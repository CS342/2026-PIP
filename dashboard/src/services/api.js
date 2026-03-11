// Medplum API Service - Standalone positioner management
const MEDPLUM_BASE_URL = 'https://api.medplum.com';
const MEDPLUM_CLIENT_ID = 'da02ae93-04f4-48a3-a32e-3e5a96fb5bd0';
const MEDPLUM_CLIENT_SECRET = '419ead2a73c4a53f5e6829168042db73c3dd8a1ecc6ed37640b1dc6ac1896bd6';

const EXPIRATION_DAYS = 90;

let accessToken = null;

export async function authenticate() {
  const response = await fetch(`${MEDPLUM_BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: MEDPLUM_CLIENT_ID,
      client_secret: MEDPLUM_CLIENT_SECRET
    })
  });

  if (!response.ok) throw new Error('Authentication failed');
  const data = await response.json();
  accessToken = data.access_token;
  return accessToken;
}

async function fetchWithAuth(url) {
  if (!accessToken) await authenticate();

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/fhir+json'
    }
  });

  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

async function putWithAuth(url, body) {
  if (!accessToken) await authenticate();

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/fhir+json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

// Parse openedAt from note text: "Package opened: 2026-02-04T04:08:49.992Z"
// Mirrors positioner.ts parseOpenedAt
function parseOpenedAt(device) {
  const noteText = device.note?.[0]?.text || '';
  const match = noteText.match(/Package opened: (\d{4}-\d{2}-\d{2}T[\d:.]+Z)/);
  if (match) return new Date(match[1]);
  return null;
}

// Check for legacy discarded bags (old dashboard added a DISCARDED note instead of setting status=inactive)
function isDiscardedByNote(device) {
  return (device.note || []).some(n => n.text?.includes('DISCARDED:'));
}

// Convert Device + optional active DeviceUseStatement to Positioner object
// Mirrors positioner.ts deviceToPositioner
export function deviceToPositioner(device, activeStatement = null) {
  const openedAt = parseOpenedAt(device);
  const expiresAt = openedAt
    ? new Date(openedAt.getTime() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000)
    : null;
  const now = new Date();

  let daysRemaining = null;
  if (expiresAt) {
    daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  let status = 'available';
  if (device.status === 'inactive' || isDiscardedByNote(device)) {
    status = 'discarded';
  } else if (expiresAt && now >= expiresAt) {
    status = 'expired';
  } else if (activeStatement) {
    status = 'active';
  }

  const currentPatient = activeStatement?.subject || null;
  const assignedAt = activeStatement?.timingPeriod?.start
    ? new Date(activeStatement.timingPeriod.start)
    : null;

  return {
    id: device.id || '',
    barcode: device.identifier?.[0]?.value || '',
    status,
    openedAt,
    expiresAt,
    daysRemaining,
    currentPatient,
    assignedAt,
    device,
  };
}

// Fetch all positioners — Devices + DeviceUseStatements in parallel
// Mirrors positioner.ts getAllPositioners
export async function fetchAllPositioners() {
  const [deviceData, stmtData] = await Promise.all([
    fetchWithAuth(`${MEDPLUM_BASE_URL}/fhir/R4/Device?_count=200`),
    fetchWithAuth(`${MEDPLUM_BASE_URL}/fhir/R4/DeviceUseStatement?_count=200`),
  ]);

  const devices = deviceData.entry ? deviceData.entry.map(e => e.resource) : [];
  const allStatements = stmtData.entry ? stmtData.entry.map(e => e.resource) : [];
  const activeStatements = allStatements.filter(s => s.status === 'active');

  // Build map: deviceId -> active statement
  const stmtByDevice = {};
  for (const stmt of activeStatements) {
    const deviceId = stmt.device?.reference?.split('/').pop();
    if (deviceId) stmtByDevice[deviceId] = stmt;
  }

  return devices.map(device => deviceToPositioner(device, stmtByDevice[device.id] || null));
}

// Fetch capacitance sensor data
export async function fetchCapacitanceReading(deviceId) {
  try {
    const data = await fetchWithAuth(
      `${MEDPLUM_BASE_URL}/fhir/R4/Observation?subject=Device/${deviceId}&code=bag-capacitance&_sort=-_lastUpdated&_count=1`
    );

    if (!data.entry || data.entry.length === 0) return null;

    const obs = data.entry[0].resource;
    const touched = obs.valueBoolean ?? false;
    const timestamp = obs.effectiveDateTime ? new Date(obs.effectiveDateTime) : new Date();

    let rawValue = null;
    if (obs.component && obs.component.length > 0) {
      const capComponent = obs.component.find(c => c.code?.text === 'Capacitance Average Reading');
      if (capComponent?.valueQuantity?.value !== undefined) {
        rawValue = capComponent.valueQuantity.value;
      }
    }

    return { touched, rawValue, timestamp, timeAgo: getTimeAgo(timestamp) };
  } catch {
    return null;
  }
}

// Fetch all sensor data for positioners
export async function fetchAllSensorData(positioners) {
  const results = {};
  for (const p of positioners) {
    results[p.id] = await fetchCapacitanceReading(p.id);
  }
  return results;
}

// Complete active DeviceUseStatements for a device
async function completeActiveStatements(deviceId) {
  const data = await fetchWithAuth(
    `${MEDPLUM_BASE_URL}/fhir/R4/DeviceUseStatement?device=Device/${deviceId}&status=active&_count=50`
  );
  const statements = data.entry ? data.entry.map(e => e.resource) : [];
  const now = new Date().toISOString();
  for (const stmt of statements) {
    await putWithAuth(`${MEDPLUM_BASE_URL}/fhir/R4/DeviceUseStatement/${stmt.id}`, {
      ...stmt,
      status: 'completed',
      timingPeriod: { ...stmt.timingPeriod, end: now },
    });
  }
}

// Discard a positioner — complete assignments then mark device inactive
// Mirrors positioner.ts discardPositioner
export async function discardPositioner(device) {
  await completeActiveStatements(device.id);
  return putWithAuth(`${MEDPLUM_BASE_URL}/fhir/R4/Device/${device.id}`, {
    ...device,
    status: 'inactive',
  });
}

// Deactivate (unassign) a positioner — complete assignments only
// Mirrors positioner.ts deactivatePositioner
export async function deactivatePositioner(device) {
  await completeActiveStatements(device.id);
}

// Time ago helper
function getTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
