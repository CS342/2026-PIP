const MEDPLUM_BASE_URL = 'https://api.medplum.com';
const MEDPLUM_CLIENT_ID = 'da02ae93-04f4-48a3-a32e-3e5a96fb5bd0';
const MEDPLUM_CLIENT_SECRET = '419ead2a73c4a53f5e6829168042db73c3dd8a1ecc6ed37640b1dc6ac1896bd6';

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

export function getToken() {
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

export async function fetchDevices() {
  const data = await fetchWithAuth(`${MEDPLUM_BASE_URL}/fhir/R4/Device?_count=100`);
  return data.entry ? data.entry.map(e => e.resource) : [];
}

export async function fetchDeviceUseStatements() {
  const data = await fetchWithAuth(`${MEDPLUM_BASE_URL}/fhir/R4/DeviceUseStatement?_count=1000`);
  return data.entry ? data.entry.map(e => e.resource) : [];
}

export async function fetchSensorData(deviceId, code) {
  const data = await fetchWithAuth(
    `${MEDPLUM_BASE_URL}/fhir/R4/Observation?subject=Device/${deviceId}&code=${code}&_sort=-_lastUpdated&_count=1`
  );
  return data.entry?.[0]?.resource || null;
}

export async function fetchOccupancyHistory(deviceId) {
  const data = await fetchWithAuth(
    `${MEDPLUM_BASE_URL}/fhir/R4/Observation?subject=Device/${deviceId}&code=occupied&_sort=-date&_count=1000`
  );
  return data.entry ? data.entry.map(e => e.resource) : [];
}

export async function updateDevice(device) {
  return putWithAuth(`${MEDPLUM_BASE_URL}/fhir/R4/Device/${device.id}`, device);
}

export async function updateDeviceUseStatement(statement) {
  return putWithAuth(`${MEDPLUM_BASE_URL}/fhir/R4/DeviceUseStatement/${statement.id}`, statement);
}
