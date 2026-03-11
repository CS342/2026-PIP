// Medplum API Service - Standalone positioner management
const MEDPLUM_BASE_URL = 'https://api.medplum.com';
const MEDPLUM_CLIENT_ID = 'da02ae93-04f4-48a3-a32e-3e5a96fb5bd0';
const MEDPLUM_CLIENT_SECRET = '419ead2a73c4a53f5e6829168042db73c3dd8a1ecc6ed37640b1dc6ac1896bd6';

const EXTENSION_URLS = {
  openedAt: 'https://example.com/fhir/positioner-opened-at',
  expiresAt: 'https://example.com/fhir/positioner-expires-at',
  currentPatient: 'https://example.com/fhir/current-patient',
  assignedAt: 'https://example.com/fhir/assigned-at',
};

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

// Get extension value from Device
function getExtension(device, url) {
  return device.extension?.find(ext => ext.url === url);
}

function getDateTimeExtension(device, url) {
  const ext = getExtension(device, url);
  return ext?.valueDateTime ? new Date(ext.valueDateTime) : null;
}

function getReferenceExtension(device, url) {
  const ext = getExtension(device, url);
  return ext?.valueReference || null;
}

// Convert Device to Positioner object
export function deviceToPositioner(device) {
  const openedAt = getDateTimeExtension(device, EXTENSION_URLS.openedAt);
  const expiresAt = getDateTimeExtension(device, EXTENSION_URLS.expiresAt);
  const now = new Date();
  
  // Calculate days remaining
  let daysRemaining = null;
  if (expiresAt) {
    daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    if (now >= expiresAt) {
      daysRemaining = -Math.ceil((now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24));
    }
  }
  
  // Determine status
  let status = 'available';
  if (device.status === 'inactive') {
    status = 'discarded';
  } else if (expiresAt && now >= expiresAt) {
    status = 'expired';
  } else if (getReferenceExtension(device, EXTENSION_URLS.currentPatient)) {
    status = 'active';
  }
  
  return {
    id: device.id || '',
    barcode: device.identifier?.[0]?.value || '',
    status,
    openedAt,
    expiresAt,
    daysRemaining,
    currentPatient: getReferenceExtension(device, EXTENSION_URLS.currentPatient),
    assignedAt: getDateTimeExtension(device, EXTENSION_URLS.assignedAt),
    device,
  };
}

// Fetch all positioners
export async function fetchAllPositioners() {
  const data = await fetchWithAuth(`${MEDPLUM_BASE_URL}/fhir/R4/Device?_count=200`);
  const devices = data.entry ? data.entry.map(e => e.resource) : [];
  
  // Filter to only positioner devices
  const positioners = devices.filter(device =>
    device.type?.coding?.some(coding => coding.code === 'fluidized-positioner')
  );
  
  return positioners.map(deviceToPositioner);
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

// Fetch all sensor data for positioners
export async function fetchAllSensorData(positioners) {
  const results = {};
  for (const p of positioners) {
    results[p.id] = await fetchCapacitanceReading(p.id);
  }
  return results;
}

// Discard a positioner
export async function discardPositioner(device) {
  // Remove patient assignment and mark as inactive
  const updated = {
    ...device,
    status: 'inactive',
    extension: device.extension?.filter(ext => 
      ext.url !== EXTENSION_URLS.currentPatient && 
      ext.url !== EXTENSION_URLS.assignedAt
    ) || []
  };
  
  return putWithAuth(`${MEDPLUM_BASE_URL}/fhir/R4/Device/${device.id}`, updated);
}

// Deactivate (unassign) a positioner
export async function deactivatePositioner(device) {
  const updated = {
    ...device,
    extension: device.extension?.filter(ext => 
      ext.url !== EXTENSION_URLS.currentPatient && 
      ext.url !== EXTENSION_URLS.assignedAt
    ) || []
  };
  
  return putWithAuth(`${MEDPLUM_BASE_URL}/fhir/R4/Device/${device.id}`, updated);
}

// Time ago helper
function getTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
