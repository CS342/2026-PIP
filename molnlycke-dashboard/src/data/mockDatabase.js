/**
 * MÖLNLYCKE MOCK DATABASE
 * Generates realistic positioner usage data
 */

const TODAY = new Date("2026-02-18");

const CLIENTS = [
  {
    id: "hosp_001",
    name: "Stanford Health Care",
    total_purchased: 350,
    compliance_target: 0.65,
    behavior_profile: "mixed",
    lat: 37.4419,
    lng: -122.143,
    contact: "supply.chain@stanfordhealth.org",
  },
  {
    id: "hosp_002",
    name: "UCSF Medical Center",
    total_purchased: 150,
    compliance_target: 0.92,
    behavior_profile: "hero",
    lat: 41.8781,
    lng: -87.6298,
    contact: "procurement@ucsfmed.edu",
  },
  {
    id: "hosp_003",
    name: "Kaiser Permanente",
    total_purchased: 500,
    compliance_target: 0.15,
    behavior_profile: "villain",
    lat: 29.7604,
    lng: -95.3698,
    contact: "materials@kaiserperm.org",
  },
];

function generateDates(scanCount) {
  const dates = [];
  const startTimestamp = new Date("2025-11-20").getTime();
  const endTimestamp = TODAY.getTime();
  let current = startTimestamp + Math.random() * (endTimestamp - startTimestamp);

  for (let i = 0; i < scanCount; i++) {
    dates.push(new Date(current).toISOString());
    current += (2 + Math.random() * 8) * 24 * 60 * 60 * 1000;
  }
  return dates;
}

function getScanCount(profile) {
  const r = Math.random();
  if (profile === "hero") {
    if (r < 0.05) return 1;
    if (r < 0.2) return 2;
    if (r < 0.4) return 3;
    return 4 + Math.floor(Math.random() * 4);
  } else if (profile === "villain") {
    if (r < 0.8) return 1;
    if (r < 0.95) return 2;
    return 3;
  } else {
    if (r < 0.2) return 1;
    if (r < 0.5) return 2;
    if (r < 0.8) return 3;
    return 4 + Math.floor(Math.random() * 2);
  }
}

function generateActiveHours(firstScan, profile) {
  const diffDays = Math.floor(
    Math.abs(TODAY - new Date(firstScan)) / (1000 * 60 * 60 * 24)
  );
  const totalPossibleHours = diffDays * 24;

  let usePercentage;
  if (profile === "hero") usePercentage = 0.4 + Math.random() * 0.3;
  else if (profile === "villain") usePercentage = 0.05 + Math.random() * 0.1;
  else usePercentage = 0.15 + Math.random() * 0.25;

  return Math.floor(totalPossibleHours * usePercentage);
}

function generateInventory() {
  const allInventory = [];

  CLIENTS.forEach((client) => {
    const activeCount = Math.floor(
      client.total_purchased * client.compliance_target
    );

    for (let i = 0; i < activeCount; i++) {
      const scansNeeded = getScanCount(client.behavior_profile);
      const scanDates = generateDates(scansNeeded);

      allInventory.push({
        serial_number: `MP-${Math.floor(1000 + Math.random() * 9000)}-${client.id.slice(-2)}`,
        client_id: client.id,
        batch: Math.random() > 0.5 ? "BATCH-JAN" : "BATCH-FEB",
        scans: scanDates,
        active_use_hours: generateActiveHours(
          scanDates[0],
          client.behavior_profile
        ),
      });
    }
  });

  return allInventory;
}

// Generate data once and export
const inventory = generateInventory();

export const database = {
  clients: CLIENTS,
  inventory,
  today: TODAY,
};

export const getClientById = (id) => CLIENTS.find((c) => c.id === id);

export const getInventoryByClient = (clientId) =>
  clientId === "all"
    ? inventory
    : inventory.filter((item) => item.client_id === clientId);

export const calculateDaysRemaining = (firstScanDate) => {
  const daysSince = Math.floor(
    Math.abs(TODAY - new Date(firstScanDate)) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, 90 - daysSince);
};
