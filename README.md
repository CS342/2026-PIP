# Pressure Injury Prevention (PIP) System

A healthcare system for managing fluidized positioners to prevent pressure injuries. Integrates with Medplum EHR for patient and device tracking.

---

## 🚀 Live Deployments

| Application | Live URL |
|-------------|----------|
| **PIP Fleet Dashboard** | *Pending deployment* |
| **Hospital Scanner** | [pip-hospital-scanner.vercel.app](https://pip-hospital-scanner.vercel.app/) |
| **Mölnlycke Dashboard** | [pip-molnlycke-dashboard.vercel.app](https://pip-molnlycke-dashboard.vercel.app/) |
| **Standalone Dashboard** | [pip-standalone-dashboard.vercel.app](https://pip-standalone-dashboard.vercel.app/) |

---

## Getting Started (New Users)

### 1. Prerequisites

- **Node.js** v22.18.0+ or v24.2.0+ — [Download here](https://nodejs.org/)

Verify installation:
```bash
node --version   # Should show v22.x or v24.x
npm --version    # Should show v10.x+
```

### 2. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/2026-PIP.git
cd 2026-PIP
```

### 3. Choose an App to Run

| App | Setup & Run | Local URL |
|-----|-------------|-----------|
| **PIP Fleet Dashboard** | `cd medplum-dashboard && npm install && npm run dev` | [localhost:3000](http://localhost:3000) |
| **Hospital Scanner** | `cd hospital-scanner && npm install && npm run dev` | [localhost:3001](http://localhost:3001) |
| **Mölnlycke Dashboard** | `cd molnlycke-dashboard && npm install && npm run dev` | [localhost:5173](http://localhost:5173) |
| **Standalone Dashboard** | `cd dashboard && npm install && npm run dev` | [localhost:5174](http://localhost:5174) |

---

## 🔐 Medplum Setup (Required for PIP Fleet Dashboard)

The PIP Fleet Dashboard requires a Medplum account for authentication and data storage.

### Step 1: Create a Medplum Account

1. Go to [app.medplum.com/register](https://app.medplum.com/register)
2. Create a new account with your email
3. Verify your email address

### Step 2: Create a Medplum Project

1. After logging in, you'll be prompted to create a project
2. Name it something like "PIP System" or "Pressure Injury Prevention"
3. Note your **Project ID** (visible in the URL or project settings)

### Step 3: Get Your Client Credentials

1. In the Medplum console, go to **Project Admin** → **Clients**
2. Create a new client application or use the default one
3. Copy the **Client ID** — this is your `MEDPLUM_CLIENT_ID`
4. If you need a client secret for server-side apps, generate one

### Step 4: Configure Your Local Environment

1. Navigate to the `medplum-dashboard/` folder:
   ```bash
   cd medplum-dashboard
   ```

2. Copy the environment template:
   ```bash
   cp .env.defaults .env
   ```

3. Edit `.env` with your credentials:
   ```env
   MEDPLUM_CLIENT_ID=your-client-id-here
   GOOGLE_CLIENT_ID=optional-for-google-signin
   ```

### Step 5: Sign In

1. Start the app: `npm run dev`
2. Go to [localhost:3000](http://localhost:3000)
3. Click "Sign in"
4. Use your Medplum email/password (or Google if configured)
5. You'll be redirected to the dashboard after successful login

### Troubleshooting Medplum Authentication

| Issue | Solution |
|-------|----------|
| "Invalid client" error | Double-check your `MEDPLUM_CLIENT_ID` in `.env` |
| Can't sign in | Make sure you're signing into the correct Medplum project |
| "Unauthorized" after login | Your user may not have access to the project — check project membership |
| Redirect loop | Clear browser cookies and try again |

---

## Applications

### `medplum-dashboard/` — PIP Fleet Dashboard

The main application for hospital staff and administrators.

**Features:**
- **Patient List** — View and search all patients from Medplum EHR
- **Patient Profiles** — See assigned positioners, sensor data, and history
- **Fleet Dashboard** — Monitor all positioners across the hospital
  - Filter by status: Active, Available, Expired, Discarded
  - Real-time capacitance sensor readings
  - Expiration alerts and warnings
- **Positioner Scanning** — Assign positioners to patients via QR/barcode
- **90-Day Expiration Tracking** — Automatic lifecycle management

**Tech:** React 19, TypeScript, Vite, Mantine v8, Medplum SDK

---

### `hospital-scanner/` — Bedside Scanner

A dedicated mobile-friendly scanning app for bedside nurses.

**Workflow:**
1. Scan patient's wristband barcode
2. Scan positioner's barcode
3. Automatic assignment with confirmation

**Features:**
- Camera-based QR/barcode scanning
- Manual barcode entry fallback
- Reassignment warnings if positioner is already in use
- First-use detection (records when package is opened)
- Works on phones, tablets, and computers

**Tech:** React, TypeScript, Vite, Mantine, html5-qrcode

---

### `molnlycke-dashboard/` — Analytics Dashboard

A Mölnlycke-branded dashboard for fleet analytics and reporting.

**Features:**
- **KPI Cards** — Key metrics at a glance (active, expired, utilization)
- **Usage Insights** — Track positioner usage patterns over time
- **Replenishment View** — Inventory management and reorder alerts
- **Fleet Map** — Visual overview of positioner distribution

**Tech:** React, Vite, Chart.js

---

### `dashboard/` — Standalone Dashboard

A standalone dashboard that connects directly to Medplum using client credentials (no user login required).

**Use Case:** Display on wall-mounted screens, kiosks, or admin monitoring

**Tech:** React, Vite, direct Medplum API calls

---

## Project Structure

```
2026-PIP/
├── medplum-dashboard/      # Main PIP Fleet Dashboard (user login)
├── hospital-scanner/       # Bedside scanner app
├── molnlycke-dashboard/    # Analytics dashboard (Mölnlycke branded)
├── dashboard/              # Standalone dashboard (client credentials)
├── hospital-scanner.html   # Legacy single-file HTML scanner
├── bag_sensor.ino          # ESP32 capacitance sensor firmware
└── README.md               # This file
```

---

## Common Commands

Run these commands from within each app's folder:

```bash
npm install      # Install dependencies
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Check for code issues
npm run lint:fix # Auto-fix linting issues
```

---

## Deployment

All apps are deployed on [Vercel](https://vercel.com/).

### Environment Variables for Vercel

For `medplum-dashboard`, add these in Vercel project settings:

| Variable | Description |
|----------|-------------|
| `MEDPLUM_CLIENT_ID` | Your Medplum client ID |
| `GOOGLE_CLIENT_ID` | (Optional) For Google sign-in |

For `hospital-scanner` and `dashboard`, client credentials are hardcoded for the shared project.

---

## Hardware Integration

### ESP32 Capacitance Sensor (`bag_sensor.ino`)

The system supports real-time patient contact detection via capacitance sensors.

**How it works:**
1. ESP32 with capacitance sensor attached to positioner
2. Sensor detects when patient is in contact with the bag
3. Data sent to Medplum as FHIR Observation resources
4. Dashboard displays real-time "touched" status and readings

**Setup:** See comments in `bag_sensor.ino` for wiring and WiFi configuration.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `node: command not found` | Install Node.js from [nodejs.org](https://nodejs.org/) |
| `npm install` fails | Delete `node_modules` and `package-lock.json`, then retry |
| Port already in use | Kill the process: `lsof -i :3000` then `kill -9 <PID>` |
| Medplum auth errors | Verify `.env` credentials match your Medplum project |
| "Module not found" | Run `npm install` in the app folder |
| Build fails on Vercel | Check environment variables are set in Vercel dashboard |

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **UI Library:** Mantine v8
- **EHR Backend:** Medplum (FHIR R4)
- **Scanning:** html5-qrcode
- **Charts:** Chart.js
- **Hosting:** Vercel
- **Hardware:** ESP32 + Capacitance Sensor

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

Apache 2.0 — See [LICENSE.txt](medplum-dashboard/LICENSE.txt)
