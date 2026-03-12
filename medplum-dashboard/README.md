<h1 align="center">PIP Fleet Dashboard</h1>
<p align="center">A Medplum-integrated dashboard for managing fluidized positioners and preventing pressure injuries.</p>
<p align="center">
<a href="https://github.com/medplum/medplum-hello-world/blob/main/LICENSE.txt">
    <img src="https://img.shields.io/badge/license-Apache-blue.svg" />
  </a>
</p>

## Features

- **Patient Management** — View and manage patients from Medplum EHR
- **Fleet Dashboard** — Monitor all positioners (active, available, expired, discarded)
- **Positioner Scanning** — Assign positioners to patients via QR/barcode scanning
- **Expiration Tracking** — 90-day lifecycle with automatic alerts and warnings
- **Capacitance Sensor Integration** — Real-time patient contact monitoring

## Getting Started

### Prerequisites

- Node.js v22.18.0+ or v24.2.0+
- A Medplum account ([register here](https://app.medplum.com/register))

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure Medplum credentials:
```bash
cp .env.defaults .env
```

Edit `.env` with your Medplum project credentials.

3. Start the development server:
```bash
npm run dev
```

The app will run at `http://localhost:3000/`

## About

Built on the [Medplum](https://www.medplum.com/) platform — an open-source, API-first EHR.

- [Medplum Documentation](https://www.medplum.com/docs)
- [React Component Library](https://storybook.medplum.com/)
- [Join the Discord](https://discord.gg/medplum)
