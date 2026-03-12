#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ===== WIFI CREDENTIALS =====
const char* ssid = "";
const char* password = "";

// ===== MEDPLUM CREDENTIALS =====
const char* medplumBaseUrl = "https://api.medplum.com";
const char* clientId = "";
const char* clientSecret = "";

// ===== BAG CONFIGURATION =====
const char* bagId = "";
const char* deviceId = "";

// ===== SENSOR CONFIGURATION =====
const int FSR_PIN = 34;
const int PRESSURE_THRESHOLD = 500;
const int CAP_TOUCH_DROP = 90;
const int CAP_AVG_WINDOW = 8;

// ===== SLEEP CONFIGURATION =====
const uint64_t SLEEP_DURATION_US = 22ULL * 60 * 1000000; // 22 minutes in microseconds

// ===== RTC MEMORY — persists across deep sleep cycles =====
RTC_DATA_ATTR float capBaseline = 0;
RTC_DATA_ATTR bool firstBoot = true;

// ===== GLOBAL =====
String accessToken = "";

// ===== SETUP — runs once per wake cycle =====
void setup() {
  Serial.begin(115200);
  pinMode(FSR_PIN, INPUT);
  delay(100);

  Serial.println("\n=== Positioner Bag Sensor (Wake Cycle) ===");
  Serial.print("Wake reason: ");
  Serial.println(esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_TIMER ? "Timer" : "Power-on/Reset");

  // --- Calibrate capacitive baseline on first boot only ---
  if (firstBoot) {
    Serial.println("First boot: calibrating capacitive baseline...");
    long sum = 0;
    for (int i = 0; i < CAP_AVG_WINDOW; i++) {
      sum += touchRead(T0);
      delay(20);
    }
    capBaseline = sum / CAP_AVG_WINDOW;
    firstBoot = false;
    Serial.print("Baseline set to: ");
    Serial.println(capBaseline);
  }

  // --- Read pressure sensor ---
  int pressureValue = analogRead(FSR_PIN);
  bool pressureOccupied = pressureValue > PRESSURE_THRESHOLD;

  // --- Read capacitive sensor (averaged) ---
  long capSum = 0;
  int capRaw = 0;
  for (int i = 0; i < CAP_AVG_WINDOW; i++) {
    capRaw = touchRead(T0);
    capSum += capRaw;
    delay(20);
  }
  int capAvg = capSum / CAP_AVG_WINDOW;
  bool capTouched = (capBaseline - capAvg) > CAP_TOUCH_DROP;

  // Update baseline slowly if not touched (drift compensation, saved to RTC)
  if (!capTouched) {
    capBaseline = capBaseline * 0.95 + capAvg * 0.05;
  }

  Serial.print("Pressure: "); Serial.print(pressureValue);
  Serial.print(" | Occupied: "); Serial.print(pressureOccupied ? "YES" : "NO");
  Serial.print(" | Cap avg: "); Serial.print(capAvg);
  Serial.print(" | Baseline: "); Serial.print(capBaseline);
  Serial.print(" | Touched: "); Serial.println(capTouched ? "YES" : "NO");

  // --- Connect WiFi & send ---
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  int wifiRetries = 0;
  while (WiFi.status() != WL_CONNECTED && wifiRetries < 20) {
    delay(500);
    Serial.print(".");
    wifiRetries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected.");
    if (authenticateWithMedplum()) {
      sendOccupancyToMedplum(pressureOccupied, pressureValue);
      sendCapacitanceToMedplum(capTouched, capAvg);
    } else {
      Serial.println("✗ Auth failed. Skipping send.");
    }
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
  } else {
    Serial.println("\n✗ WiFi failed. Skipping send.");
  }

  // --- Go to deep sleep ---
  Serial.print("Sleeping for 22 minutes... ");
  Serial.flush();
  esp_sleep_enable_timer_wakeup(SLEEP_DURATION_US);
  esp_deep_sleep_start();
  // Nothing below here runs — deep sleep resets execution to setup()
}

void loop() {
  // Never reached during normal deep sleep operation
}

// ===== AUTHENTICATE WITH MEDPLUM =====
bool authenticateWithMedplum() {
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  http.begin(String(medplumBaseUrl) + "/oauth2/token");
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");

  String postData = "grant_type=client_credentials";
  postData += "&client_id=" + String(clientId);
  postData += "&client_secret=" + String(clientSecret);

  int httpResponseCode = http.POST(postData);

  if (httpResponseCode == 200) {
    String response = http.getString();
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, response);
    accessToken = doc["access_token"].as<String>();
    http.end();
    return true;
  } else {
    Serial.print("Auth failed. Code: ");
    Serial.println(httpResponseCode);
    http.end();
    return false;
  }
}

// ===== SEND PRESSURE/OCCUPANCY =====
void sendOccupancyToMedplum(bool occupied, int pressureValue) {
  HTTPClient http;
  http.begin(String(medplumBaseUrl) + "/fhir/R4/Observation");
  http.addHeader("Content-Type", "application/fhir+json");
  http.addHeader("Authorization", "Bearer " + accessToken);

  DynamicJsonDocument doc(1024);
  doc["resourceType"] = "Observation";
  doc["status"] = "final";

  JsonObject code = doc.createNestedObject("code");
  JsonArray codingArray = code.createNestedArray("coding");
  JsonObject coding = codingArray.createNestedObject();
  coding["system"] = "http://hospital.org/observations";
  coding["code"] = "bag-occupancy";
  coding["display"] = "Bag Occupancy Status";

  JsonObject subject = doc.createNestedObject("subject");
  subject["reference"] = "Device/" + String(deviceId);
  subject["display"] = String(bagId);

  doc["effectiveDateTime"] = getCurrentTimestamp();
  doc["valueBoolean"] = occupied;

  JsonArray components = doc.createNestedArray("component");
  JsonObject pressureComponent = components.createNestedObject();
  pressureComponent.createNestedObject("code")["text"] = "Pressure Reading";
  JsonObject pv = pressureComponent.createNestedObject("valueQuantity");
  pv["value"] = pressureValue;
  pv["unit"] = "raw";

  String jsonString;
  serializeJson(doc, jsonString);

  int httpResponseCode = http.POST(jsonString);
  Serial.println(httpResponseCode == 201 || httpResponseCode == 200
    ? "✓ Pressure/occupancy sent"
    : "✗ Failed to send pressure data (code: " + String(httpResponseCode) + ")");

  http.end();
}

// ===== SEND CAPACITANCE =====
void sendCapacitanceToMedplum(bool touched, int capAvg) {
  HTTPClient http;
  http.begin(String(medplumBaseUrl) + "/fhir/R4/Observation");
  http.addHeader("Content-Type", "application/fhir+json");
  http.addHeader("Authorization", "Bearer " + accessToken);

  DynamicJsonDocument doc(1024);
  doc["resourceType"] = "Observation";
  doc["status"] = "final";

  JsonObject code = doc.createNestedObject("code");
  JsonArray codingArray = code.createNestedArray("coding");
  JsonObject coding = codingArray.createNestedObject();
  coding["system"] = "http://hospital.org/observations";
  coding["code"] = "bag-capacitance";
  coding["display"] = "Bag Capacitive Touch Status";

  JsonObject subject = doc.createNestedObject("subject");
  subject["reference"] = "Device/" + String(deviceId);
  subject["display"] = String(bagId);

  doc["effectiveDateTime"] = getCurrentTimestamp();
  doc["valueBoolean"] = touched;

  JsonArray components = doc.createNestedArray("component");
  JsonObject capComponent = components.createNestedObject();
  capComponent.createNestedObject("code")["text"] = "Capacitance Average Reading";
  JsonObject cv = capComponent.createNestedObject("valueQuantity");
  cv["value"] = capAvg;
  cv["unit"] = "raw";

  String jsonString;
  serializeJson(doc, jsonString);

  int httpResponseCode = http.POST(jsonString);
  Serial.println(httpResponseCode == 201 || httpResponseCode == 200
    ? "✓ Capacitance sent"
    : "✗ Failed to send capacitance data (code: " + String(httpResponseCode) + ")");

  http.end();
}

// ===== TIMESTAMP =====
String getCurrentTimestamp() {
  return "2026-02-01T00:00:00Z";
}
