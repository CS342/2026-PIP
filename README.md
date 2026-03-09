# Pressure Injury Prevention (PIP) System

A healthcare application for managing fluidized positioners to help prevent pressure injuries. The system tracks positioner lifecycle (activation, assignment to patients, expiration) and integrates with Medplum EHR.

## Project Structure

```
├── medplum-hello-world/    # Main application (Medplum + React)
├── hospital-scanner/       # Standalone scanner app (React + Vite)
├── dashboard/              # Dashboard UI prototype (React)
├── hospital-scanner.html   # Legacy HTML scanner prototype
├── bag_sensor.ino          # ESP32 sensor firmware
└── public/                 # Legacy pressure sensor dashboard
```

---

## Main Application: `medplum-hello-world/`

The primary application built with React, TypeScript, and Medplum. Features include:

- **Patient Management** — View and manage patients from Medplum EHR
- **Positioner Fleet Dashboard** — Monitor all positioners (active, available, expired, discarded)
- **Barcode Scanning** — Scan positioners via camera or manual entry to assign to patients
- **Expiration Tracking** — 90-day lifecycle with automatic expiration detection
- **Reassignment Warnings** — Alerts when reassigning a positioner from one patient to another

### Getting Started

1. **Install Node.js** (v22.18.0+ or v24.2.0+)
   
   Check your version:
   ```bash
   node --version
   ```

2. **Navigate to the folder**
   ```bash
   cd medplum-hello-world
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Configure environment** (optional)
   
   Copy the defaults file and edit as needed:
   ```bash
   cp .env.defaults .env
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Features

| Page | Description |
|------|-------------|
| **Patients** | List of all patients, click to view details |
| **Patient Overview** | View patient info, active positioners, scan new positioner |
| **Fleet Dashboard** | Overview of all positioners with stats, filters, and bulk actions |

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## Hospital Scanner: `hospital-scanner/`

A dedicated scanning application for hospital staff to quickly assign positioners to patients. Uses a two-step workflow optimized for bedside use.

### Features

- **Patient Bracelet Scanning** — Scan patient QR code bracelet to identify patient
- **Positioner Barcode Scanning** — Scan positioner barcode to assign
- **Reassignment Warnings** — Alerts when a positioner is already assigned to another patient
- **First-Use Detection** — Automatically records when a positioner package is first opened
- **Days Remaining Tracking** — Shows 90-day expiration countdown

### Getting Started

1. **Navigate to the folder**
   ```bash
   cd hospital-scanner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   
   Navigate to [http://localhost:3001](http://localhost:3001)

### Workflow

1. **Scan Patient** — Scan the patient's bracelet QR code (or enter MRN manually)
2. **Scan Positioner** — Scan the positioner barcode (or enter manually)
3. **Confirm** — System auto-assigns with reassignment warning if needed

---

## Dashboard Prototype: `dashboard/`

A standalone React prototype of the positioner fleet dashboard UI. This was used as a design reference and has been integrated into the main `medplum-hello-world` application.

### Running the Prototype

1. **Navigate to the folder**
   ```bash
   cd dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   
   Navigate to [http://localhost:5173](http://localhost:5173)

> **Note:** This is a standalone prototype. For the full integrated experience, use the `medplum-hello-world` application.

---

## Other Files

### `hospital-scanner.html`

Legacy standalone HTML file demonstrating the two-step barcode scanning workflow. Now replaced by the `hospital-scanner/` React application.

### `bag_sensor.ino`

Arduino/ESP32 firmware for the pressure sensor hardware.

---

## Medplum Setup

This application uses [Medplum](https://www.medplum.com/) as the backend EHR system.

1. **Register a Medplum project** — Follow the [Medplum tutorial](https://www.medplum.com/docs/tutorials/register)

2. **Configure the app** — Update `.env` with your Medplum project credentials

3. **Data Model** — The app uses:
   - `Patient` — Patient records
   - `Device` — Positioner devices (with barcode, opened date, expiration date)
   - `DeviceUseStatement` — Links devices to patients (assignment records)

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **UI Library:** Mantine v8
- **EHR Backend:** Medplum
- **Icons:** Tabler Icons
- **Barcode Scanning:** html5-qrcode

---

## License

Apache 2.0 (medplum-hello-world)
