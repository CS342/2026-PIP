const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();

exports.ingest = onRequest({ region: "us-central1" }, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type,X-API-Key");
  if (req.method === "OPTIONS") return res.status(204).send("");

  if (req.method !== "POST") return res.status(405).send("POST only");

  const EXPECTED_KEY = "CS342"; // demo key
  const apiKey = req.get("X-API-Key");
  if (apiKey !== EXPECTED_KEY) {
    return res.status(401).send("Unauthorized");
  }

  const { deviceId = "esp32-01", raw, zone, loaded, loadSeconds, peak } = req.body || {};
  if (typeof raw !== "number") return res.status(400).send("raw must be number");

  await admin.firestore().collection("readings").add({
    deviceId,
    raw,
    zone: typeof zone === "string" ? zone : null,
    loaded: typeof loaded === "number" ? loaded : null,
    loadSeconds: typeof loadSeconds === "number" ? loadSeconds : null,
    peak: typeof peak === "number" ? peak : null,
    ts: admin.firestore.FieldValue.serverTimestamp(),
  });

  logger.info("ingested", { deviceId, raw });
  return res.json({ ok: true });
});