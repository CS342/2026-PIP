# Pressure Injury Prevention Dashboard

A real-time dashboard for monitoring pressure sensor data from an ESP32 device, designed to help prevent pressure injuries.


## Quick Start

### Option 1: Open Directly (Easiest)

Just open the HTML file in your browser:

```bash
open public/index.html
```

Or double-click `public/index.html` in Finder.

### Option 2: Firebase Hosting (For Deployment)

1. Install Node.js: https://nodejs.org
2. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
3. Login to Firebase:
   ```bash
   firebase login
   ```
4. Run locally:
   ```bash
   firebase serve
   ```
5. Deploy:
   ```bash
   firebase deploy
   ```

## Configuration

Edit `public/index.html` and find the configuration section near the top of the `<script>`:

```javascript
// DEMO MODE - Set to true to simulate fake sensor data
const DEMO_MODE = true;

// Device filter - set to your ESP32 device ID
const DEVICE_FILTER = "esp32-01";

// Pressure thresholds (adjust based on your sensor)
const PRESSURE_THRESHOLDS = {
  low: 1000,
  moderate: 2500
};
```

### Demo Mode

- `DEMO_MODE = true` — Shows simulated data (no sensor needed)
- `DEMO_MODE = false` — Shows real data from Firebase

## Firebase Setup

### 1. Firestore Rules

Go to [Firebase Console](https://console.firebase.google.com) → Your Project → Firestore Database → Rules, and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Click **Publish** to save.

### 2. Expected Data Format

The dashboard reads from a `readings` collection. Each document should have:

```javascript
{
  deviceId: "esp32-01",    // String: device identifier
  raw: 1850,               // Number: raw ADC pressure value
  zone: "center",          // String: sensor zone (optional)
  ts: Timestamp            // Firestore Timestamp
}
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Missing or insufficient permissions" | Update Firestore rules (see above) |
| No data showing | Check `DEVICE_FILTER` matches your ESP32's deviceId |
| Chart not updating | Verify ESP32 is posting to the `readings` collection |

## Project Structure

```
├── public/
│   └── index.html      # Dashboard (all-in-one HTML/CSS/JS)
├── functions/          # Firebase Cloud Functions (if needed)
├── firebase.json       # Firebase configuration
└── .firebaserc         # Firebase project settings
```

## License

MIT
