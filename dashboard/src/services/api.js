// Medplum API Service - Standalone positioner management
// Matches medplum-hello-world data model exactly

// Medplum Configuration - MUST match hospital-scanner and medplum-hello-world
const MEDPLUM_BASE_URL = 'https://api.medplum.com';
const MEDPLUM_CLIENT_ID = '123e5b09-4a7a-4887-be0f-67f178eec256';
const MEDPLUM_CLIENT_SECRET = '4c5c8954f108473c9aff4afe2c465350f2e7895527a884b280327686db56d441';

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

// ============================================================================
// DATA MODEL (matches medplum-hello-world/src/utils/positioner.ts)
// ============================================================================

// Parse openedAt from Device.note (format: "Package opened: <ISO date>")
function parseOpenedAt(device) {
  const noteText = device.note?.[0]?.text || '';
  const match = noteText.match(/Package opened: (\d{4}-\d{2}-\d{2}T[\d:.]+Z)/);
  if (match) return new Date(match[1]);
  return null;
}

function calculateExpirationDate(openedAt) {
  const expiresAt = new Date(openedAt);
  expiresAt.setDate(expiresAt.getDate() + EXPIRATION_DAYS);
  return expiresAt;
}

// Convert Device + DeviceUseStatement to Positioner object
function deviceToPositioner(device, activeStatement = null) {
  const openedAt = parseOpenedAt(device);
  const expiresAt = openedAt ? calculateExpirationDate(openedAt) : null;
  const now = new Date();

  let daysRemaining = null;
  if (expiresAt) {
    daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  let status = 'available';
  if (device.status === 'inactive') {
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
    activeStatement,
  };
}

// ============================================================================
// POSITIONER FETCHING (matches medplum-hello-world)
// ============================================================================

export async function fetchAllPositioners() {
  // Fetch all Device resources
  const deviceData = await fetchWithAuth(`${MEDPLUM_BASE_URL}/fhir/R4/Device?_count=500`);
  const devices = deviceData.entry ? deviceData.entry.map(e => e.resource) : [];

  // Fetch all DeviceUseStatement resources
  const stmtData = await fetchWithAuth(`${MEDPLUM_BASE_URL}/fhir/R4/DeviceUseStatement?_count=500`);
  const allStatements = stmtData.entry ? stmtData.entry.map(e => e.resource) : [];
  const activeStatements = allStatements.filter(s => s.status === 'active');

  // Map device id -> active statement
  const statementByDevice = {};
  for (const stmt of activeStatements) {
    const deviceRef = stmt.device?.reference;
    if (deviceRef) {
      const deviceId = deviceRef.replace('Device/', '');
      statementByDevice[deviceId] = stmt;
    }
  }

  // Convert to Positioner objects
  return devices.map(device => 
    deviceToPositioner(device, statementByDevice[device.id] || null)
  );
}

// ============================================================================
// SENSOR DATA (capacitance readings)
// ============================================================================

function getTimeAgo(date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export async function fetchCapacitanceReading(deviceId) {
  try {
    const data = await fetchWithAuth(
      `${MEDPLUM_BASE_URL}/fhir/R4/Observation?subject=Device/${deviceId}&code=bag-capacitance&_sort=-_lastUpdated&_count=1`
    );
    
    if (!data.entry || data.entry.length === 0) return null;
    
    const obs = data.entry[0].resource;
    const touched = obs.valueBoolean ?? false;
    const timestamp = obs.effectiveDateTime ? new Date(obs.effectiveDateTime) : new Date();
    
    // Get raw value from component
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

export async function fetchAllSensorData(positioners) {
  const results = {};
  for (const p of positioners) {
    results[p.id] = await fetchCapacitanceReading(p.id);
  }
  return results;
}

// ============================================================================
// POSITIONER ACTIONS
// ============================================================================

export async function discardPositioner(device) {
  // Mark device as inactive
  const updated = {
    ...device,
    status: 'inactive',
  };
  return putWithAuth(`${MEDPLUM_BASE_URL}/fhir/R4/Device/${device.id}`, updated);
}

export async function deactivatePositioner(device) {
  // Find and complete active DeviceUseStatements
  const stmtData = await fetchWithAuth(
    `${MEDPLUM_BASE_URL}/fhir/R4/DeviceUseStatement?device=Device/${device.id}&_count=100`
  );
  const statements = stmtData.entry ? stmtData.entry.map(e => e.resource) : [];
  
  for (const stmt of statements.filter(s => s.status === 'active')) {
    const now = new Date().toISOString();
    const updated = {
      ...stmt,
      status: 'completed',
      timingPeriod: { ...stmt.timingPeriod, end: now },
    };
    await putWithAuth(`${MEDPLUM_BASE_URL}/fhir/R4/DeviceUseStatement/${stmt.id}`, updated);
  }
  
  return device;
}
