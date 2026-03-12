# Pressure Injury Prevention (PIP) System

A healthcare system for managing fluidized positioners to prevent pressure injuries. Integrates with Medplum EHR for patient and device tracking.

---

## Getting Started (New Users)

### 1. Prerequisites

- **Node.js** v22.18.0+ or v24.2.0+ — [Download here](https://nodejs.org/)

Verify installation:
```bash
node --version   # Should show v22.x or v24.x
npm --version    # Should show v10.x+
```

### 2. Choose an App to Run

| App | Setup & Run | URL |
|-----|-------------|-----|
| **PIP Fleet Dashboard** | `cd medplum-dashboard && npm install && npm run dev` | [localhost:3000](http://localhost:3000) |
| **Hospital Scanner** | `cd hospital-scanner && npm install && npm run dev` | [localhost:3001](http://localhost:3001) |
| **Mölnlycke Dashboard** | `cd molnlycke-dashboard && npm install && npm run dev` | [localhost:5173](http://localhost:5173) |

### 3. Medplum Configuration (Required for PIP Fleet Dashboard)

1. Create a Medplum account at [medplum.com](https://www.medplum.com/)
2. Follow the [registration tutorial](https://www.medplum.com/docs/tutorials/register)
3. In the `medplum-dashboard/` folder:
   ```bash
   cp .env.defaults .env
   ```
4. Edit `.env` with your Medplum project credentials

---

## Applications

### `medplum-dashboard/` — PIP Fleet Dashboard

Full-featured Medplum-integrated application:
- **Patients** — View/manage patients from Medplum EHR
- **Fleet Dashboard** — Monitor all positioners (active, available, expired)
- **Positioner Scanning** — Assign positioners to patients via QR/barcode
- **Expiration Tracking** — 90-day lifecycle with automatic alerts

### `hospital-scanner/` — Bedside Scanner

Dedicated scanning app for hospital staff:
- **Workflow:** Scan patient bracelet → Scan positioner → Auto-assign
- **Reassignment Warnings** — Alerts if positioner already assigned
- **First-Use Detection** — Records when package is first opened

### `molnlycke-dashboard/` — Analytics Dashboard

Fleet analytics and insights:
- **Usage Insights** — Track positioner usage patterns
- **Replenishment** — Inventory management view
- **KPI Cards** — Key metrics at a glance

---

## Project Structure

```
├── medplum-dashboard/      # Main PIP Fleet Dashboard (Medplum + React)
├── hospital-scanner/       # Standalone scanner app
├── molnlycke-dashboard/    # Analytics dashboard
├── dashboard/              # UI prototype (reference only)
├── hospital-scanner.html   # Legacy HTML scanner
└── bag_sensor.ino          # ESP32 sensor firmware
```

---

## Common Commands

```bash
npm install      # Install dependencies (run in each app folder)
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Check for code issues
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `node: command not found` | Install Node.js from [nodejs.org](https://nodejs.org/) |
| `npm install` fails | Try `rm -rf node_modules && npm install` |
| Port already in use | Kill the process or use a different port |
| Medplum auth errors | Check `.env` credentials match your Medplum project |

---

## Tech Stack

React 19 • TypeScript • Vite • Mantine v8 • Medplum • html5-qrcode
