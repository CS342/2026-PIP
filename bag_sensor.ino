#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ===== WIFI CREDENTIALS =====
const char* ssid = "Eric";
const char* password = "abcdefgh";

// ===== MEDPLUM CREDENTIALS =====
const char* medplumBaseUrl = "https://api.medplum.com";
const char* clientId = "da02ae93-04f4-48a3-a32e-3e5a96fb5bd0";
const char* clientSecret = "419ead2a73c4a53f5e6829168042db73c3dd8a1ecc6ed37640b1dc6ac1896bd6";

// ===== BAG CONFIGURATION =====
const char* bagId = "BAG-006";
const char* deviceId = "9d0bc31e-ca6f-4f0b-9bd0-0a687ea61059";

// ===== PRESSURE SENSOR CONFIGURATION (kept for future use) =====
const int FSR_PIN = 34;                     // GPIO pin connected to FSR sensor (ADC pin)
const int PRESSURE_THRESHOLD = 500;         // Adjust based on sensor (0-4095 range)

// ===== CAPACITIVE SENSOR CONFIGURATION =====
const int CAP_THRESH = 600;                 // Touch threshold — lower = touched on ESP32 touch pins
const int CAP_AVG_WINDOW = 8;              // Moving average window size

// ===== TIMING =====
const unsigned long SEND_INTERVAL = 10000; // Send update every 10 seconds

// ===== GLOBAL VARIABLES =====
String accessToken = "";
unsigned long lastSendTime = 0;

// Pressure sensor state
bool lastPressureOccupied = false;

// Capacitive sensor state
int capBuf[8];
int capIdx = 0;
long capSum = 0;
bool lastCapTouched = false;

// ===== SETUP =====
void setup() {
  Serial.begin(115200);
  pinMode(FSR_PIN, INPUT);

  Serial.println("\n\n=== Positioner Bag Sensor ===");

  // Init capacitive moving average buffer
  for (int i = 0; i < CAP_AVG_WINDOW; i++) {
    int v = touchRead(T0);
    capBuf[i] = v;
    capSum += v;
    delay(20);
  }

  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  if (authenticateWithMedplum()) {
    Serial.println("✓ Authenticated with Medplum");
  } else {
    Serial.println("✗ Failed to authenticate with Medplum");
  }
}

// ===== MAIN LOOP =====
void loop() {
  // --- Pressure sensor (kept intact) ---
  int pressureValue = analogRead(FSR_PIN);
  bool pressureOccupied = pressureValue > PRESSURE_THRESHOLD;

  // --- Capacitive sensor (moving average) ---
  int capRaw = touchRead(T0);
  capSum -= capBuf[capIdx];
  capBuf[capIdx] = capRaw;
  capSum += capRaw;
  capIdx = (capIdx + 1) % CAP_AVG_WINDOW;
  int capAvg = capSum / CAP_AVG_WINDOW;
  bool capTouched = capAvg < CAP_THRESH;

  // Serial output
  Serial.print("Pressure: "); Serial.print(pressureValue);
  Serial.print(" | Pressure Occupied: "); Serial.print(pressureOccupied ? "YES" : "NO");
  Serial.print(" | Cap raw="); Serial.print(capRaw);
  Serial.print("  avg="); Serial.print(capAvg);
  Serial.print("  touched="); Serial.println(capTouched ? "YES" : "NO");

  unsigned long currentTime = millis();
  bool stateChanged = (pressureOccupied != lastPressureOccupied) || (capTouched != lastCapTouched);

  if (currentTime - lastSendTime >= SEND_INTERVAL || stateChanged) {
    if (WiFi.status() == WL_CONNECTED) {

      // Send pressure observation (existing, unchanged)
      sendOccupancyToMedplum(pressureOccupied, pressureValue);

      // Send capacitance observation (new, separate)
      sendCapacitanceToMedplum(capTouched, capAvg);

      lastSendTime = currentTime;
      lastPressureOccupied = pressureOccupied;
      lastCapTouched = capTouched;

    } else {
      Serial.println("WiFi disconnected. Reconnecting...");
      WiFi.begin(ssid, password);
    }
  }

  delay(1000);
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
    Serial.print("Auth failed. HTTP Response code: ");
    Serial.println(httpResponseCode);
    http.end();
    return false;
  }
}

// ===== SEND PRESSURE/OCCUPANCY DATA TO MEDPLUM (original, unchanged) =====
void sendOccupancyToMedplum(bool occupied, int pressureValue) {
  if (accessToken == "") {
    Serial.println("No access token. Authenticating...");
    if (!authenticateWithMedplum()) {
      Serial.println("Authentication failed. Cannot send data.");
      return;
    }
  }

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
  JsonObject pressureCode = pressureComponent.createNestedObject("code");
  pressureCode["text"] = "Pressure Reading";
  JsonObject pressureValue_obj = pressureComponent.createNestedObject("valueQuantity");
  pressureValue_obj["value"] = pressureValue;
  pressureValue_obj["unit"] = "raw";

  String jsonString;
  serializeJson(doc, jsonString);

  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode == 201 || httpResponseCode == 200) {
    Serial.println("✓ Pressure/occupancy data sent to Medplum");
  } else if (httpResponseCode == 401) {
    Serial.println("✗ Token expired. Re-authenticating...");
    accessToken = "";
    authenticateWithMedplum();
  } else {
    Serial.print("✗ Failed to send pressure data. HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.println(http.getString());
  }

  http.end();
}

// ===== SEND CAPACITANCE DATA TO MEDPLUM (new, separate observation) =====
void sendCapacitanceToMedplum(bool touched, int capAvg) {
  if (accessToken == "") {
    Serial.println("No access token. Authenticating...");
    if (!authenticateWithMedplum()) {
      Serial.println("Authentication failed. Cannot send capacitance data.");
      return;
    }
  }

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

  // Raw average reading stored as component for debugging
  JsonArray components = doc.createNestedArray("component");
  JsonObject capComponent = components.createNestedObject();
  JsonObject capCode = capComponent.createNestedObject("code");
  capCode["text"] = "Capacitance Average Reading";
  JsonObject capValue_obj = capComponent.createNestedObject("valueQuantity");
  capValue_obj["value"] = capAvg;
  capValue_obj["unit"] = "raw";

  String jsonString;
  serializeJson(doc, jsonString);

  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode == 201 || httpResponseCode == 200) {
    Serial.println("✓ Capacitance data sent to Medplum");
  } else if (httpResponseCode == 401) {
    Serial.println("✗ Token expired. Re-authenticating...");
    accessToken = "";
    authenticateWithMedplum();
  } else {
    Serial.print("✗ Failed to send capacitance data. HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.println(http.getString());
  }

  http.end();
}

// ===== GET CURRENT TIMESTAMP =====
String getCurrentTimestamp() {
  // For production: sync with NTP server
  return "2026-02-01T00:00:00Z";
}
