// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { Device, Patient, Reference, DeviceUseStatement } from '@medplum/fhirtypes';
import type { MedplumClient } from '@medplum/core';

/**
 * =============================================================================
 * POSITIONER DATA MODEL (Unified with Hospital Scanner)
 * =============================================================================
 *
 * CORE FIELDS (FHIR standard):
 * - Device.status: 'active' | 'inactive' (inactive = discarded)
 * - Device.identifier[0].value: Barcode ID
 * - Device.note[0].text: "Package opened: <ISO date>"
 * - Device.note[0].time: <ISO date>
 *
 * ASSIGNMENT:
 * - DeviceUseStatement.subject: Reference<Patient>
 * - DeviceUseStatement.device: Reference<Device>
 * - DeviceUseStatement.status: 'active' | 'completed'
 * - DeviceUseStatement.timingPeriod.start: assignment start ISO date
 * - DeviceUseStatement.timingPeriod.end: unassignment ISO date
 * =============================================================================
 */

const EXPIRATION_DAYS = 90;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type PositionerStatus = 'active' | 'expired' | 'discarded' | 'available';

export interface Positioner {
  id: string;
  barcode: string;
  status: PositionerStatus;
  openedAt: Date | null;
  expiresAt: Date | null;
  daysRemaining: number | null;
  currentPatient: Reference<Patient> | null;
  assignedAt: Date | null;
  rotationIntervalHours: number | null;
  nextRotationAt: Date | null;
  lastRotatedAt: Date | null;
  isRotationDue: boolean;
  device: Device;
  activeStatement: DeviceUseStatement | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function calculateExpirationDate(openedAt: Date): Date {
  const expiresAt = new Date(openedAt);
  expiresAt.setDate(expiresAt.getDate() + EXPIRATION_DAYS);
  return expiresAt;
}

function parseOpenedAt(device: Device): Date | null {
  const noteText = device.note?.[0]?.text || '';
  const match = noteText.match(/Package opened: (\d{4}-\d{2}-\d{2}T[\d:.]+Z)/);
  if (match) return new Date(match[1]);
  return null;
}

// ============================================================================
// POSITIONER DATA ACCESS
// ============================================================================

export function deviceToPositioner(device: Device, activeStatement: DeviceUseStatement | null = null): Positioner {
  const openedAt = parseOpenedAt(device);
  const expiresAt = openedAt ? calculateExpirationDate(openedAt) : null;
  const now = new Date();

  let daysRemaining: number | null = null;
  if (expiresAt) {
    daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  let status: PositionerStatus = 'available';
  if (device.status === 'inactive') {
    status = 'discarded';
  } else if (expiresAt && now >= expiresAt) {
    status = 'expired';
  } else if (activeStatement) {
    status = 'active';
  }

  const currentPatient = activeStatement?.subject as Reference<Patient> | null ?? null;
  const assignedAt = activeStatement?.timingPeriod?.start ? new Date(activeStatement.timingPeriod.start) : null;

  return {
    id: device.id || '',
    barcode: device.identifier?.[0]?.value || '',
    status,
    openedAt,
    expiresAt,
    daysRemaining,
    currentPatient,
    assignedAt,
    rotationIntervalHours: null,
    nextRotationAt: null,
    lastRotatedAt: null,
    isRotationDue: false,
    device,
    activeStatement,
  };
}

export function isPositionerExpired(device: Device): boolean {
  const openedAt = parseOpenedAt(device);
  if (!openedAt) return false;
  return new Date() >= calculateExpirationDate(openedAt);
}

// ============================================================================
// POSITIONER CRUD OPERATIONS
// ============================================================================

export async function findPositionerByBarcode(medplum: MedplumClient, barcode: string): Promise<Device | null> {
  try {
    const devices = await medplum.searchResources('Device', { identifier: barcode });
    return devices[0] || null;
  } catch (error) {
    console.error('Error finding positioner:', error);
    return null;
  }
}

export async function getAllPositioners(medplum: MedplumClient): Promise<Positioner[]> {
  try {
    const devices = await medplum.searchResources('Device', {});

    // Fetch all DeviceUseStatements and filter active ones client-side
    const allStatements = await medplum.searchResources('DeviceUseStatement', {});
    const activeStatements = allStatements.filter((s) => s.status === 'active');

    // Map device id -> active statement
    const statementByDevice: Record<string, DeviceUseStatement> = {};
    for (const stmt of activeStatements) {
      const deviceId = stmt.device?.reference?.split('/').pop();
      if (deviceId) statementByDevice[deviceId] = stmt;
    }

    return devices.map((device) => deviceToPositioner(device, statementByDevice[device.id!] || null));
  } catch (error) {
    console.error('Error getting all positioners:', error);
    return [];
  }
}

export async function getPositionersForPatient(medplum: MedplumClient, patient: Patient): Promise<Positioner[]> {
  try {
    const all = await getAllPositioners(medplum);
    const patientRef = `Patient/${patient.id}`;
    return all.filter((p) => p.currentPatient?.reference === patientRef && p.status === 'active');
  } catch (error) {
    console.error('Error getting positioners for patient:', error);
    return [];
  }
}

export async function createPositioner(medplum: MedplumClient, barcode: string): Promise<Device> {
  const now = new Date();
  const device: Device = {
    resourceType: 'Device',
    status: 'active',
    identifier: [{ value: barcode }],
    note: [{ text: `Package opened: ${now.toISOString()}`, time: now.toISOString() }],
  };
  return medplum.createResource(device);
}

// ============================================================================
// PATIENT ASSIGNMENT
// ============================================================================

export async function assignPositionerToPatient(
  medplum: MedplumClient,
  device: Device,
  patient: Patient,
  _rotationIntervalHours: number
): Promise<Device> {
  // Complete any existing active assignments for this device
  const allStatements = await medplum.searchResources('DeviceUseStatement', {
    device: `Device/${device.id}`,
  });
  for (const stmt of allStatements.filter((s) => s.status === 'active')) {
    await medplum.updateResource({
      ...stmt,
      status: 'completed',
      timingPeriod: { ...stmt.timingPeriod, end: new Date().toISOString() },
    });
  }

  // Create new active assignment
  const now = new Date().toISOString();
  await medplum.createResource<DeviceUseStatement>({
    resourceType: 'DeviceUseStatement',
    status: 'active',
    subject: { reference: `Patient/${patient.id}`, display: patient.name?.[0]?.family || '' },
    device: { reference: `Device/${device.id}` },
    recordedOn: now,
    timingPeriod: { start: now },
  });

  return device;
}

export async function deactivatePositioner(medplum: MedplumClient, device: Device): Promise<Device> {
  const allStatements = await medplum.searchResources('DeviceUseStatement', {
    device: `Device/${device.id}`,
  });
  for (const stmt of allStatements.filter((s) => s.status === 'active')) {
    await medplum.updateResource({
      ...stmt,
      status: 'completed',
      timingPeriod: { ...stmt.timingPeriod, end: new Date().toISOString() },
    });
  }
  return device;
}

export async function discardPositioner(medplum: MedplumClient, device: Device): Promise<Device> {
  await deactivatePositioner(medplum, device);
  const updated: Device = { ...device, status: 'inactive' };
  return medplum.updateResource(updated);
}

// ============================================================================
// EXPIRATION MANAGEMENT
// ============================================================================

export async function checkAndDiscardExpiredPositioners(medplum: MedplumClient): Promise<void> {
  try {
    const all = await getAllPositioners(medplum);
    for (const p of all) {
      if (p.status !== 'discarded' && isPositionerExpired(p.device)) {
        console.log(`Auto-discarding expired positioner: ${p.barcode}`);
        await discardPositioner(medplum, p.device);
      }
    }
  } catch (error) {
    console.error('Error checking expired positioners:', error);
  }
}

// ============================================================================
// ROTATION (no-ops in unified model — scanner does not use rotation)
// ============================================================================

export async function completeRotation(medplum: MedplumClient, _device: Device): Promise<Device> {
  return _device;
}

export async function postponeRotation(medplum: MedplumClient, _device: Device, _minutes: number = 30): Promise<Device> {
  return _device;
}

export async function cleanupDuplicatePositioners(_medplum: MedplumClient): Promise<void> {
  // No-op in unified model
}

// ============================================================================
// SCAN & ACTIVATE WORKFLOW
// ============================================================================

export async function scanAndActivatePositioner(
  medplum: MedplumClient,
  barcode: string,
  patient: Patient,
  rotationIntervalHours: number
): Promise<{ success: boolean; device?: Device; error?: string }> {
  try {
    let device = await findPositionerByBarcode(medplum, barcode);

    if (!device) {
      device = await createPositioner(medplum, barcode);
    }

    if (isPositionerExpired(device)) {
      return { success: false, error: 'Positioner expired — discard and replace' };
    }

    device = await assignPositionerToPatient(medplum, device, patient, rotationIntervalHours);
    return { success: true, device };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to activate positioner' };
  }
}
// ============================================================================
// WEAR HOURS
// ============================================================================

/**
 * Get the stored cumulative wear hours for a positioner device from Medplum.
 * Stored as an Observation with code 'wear-hours'.
 */
export async function getWearHours(
  medplum: MedplumClient,
  deviceId: string
): Promise<number> {
  try {
    const observations = await medplum.searchResources('Observation', {
      subject: `Device/${deviceId}`,
      code: 'wear-hours',
      _sort: '-_lastUpdated',
      _count: '1',
    });
    if (observations.length === 0) return 0;
    return (observations[0] as import('@medplum/fhirtypes').Observation).valueInteger ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Save (upsert) cumulative wear hours for a positioner device in Medplum.
 */
export async function saveWearHours(
  medplum: MedplumClient,
  deviceId: string,
  hours: number
): Promise<void> {
  try {
    const existing = await medplum.searchResources('Observation', {
      subject: `Device/${deviceId}`,
      code: 'wear-hours',
      _sort: '-_lastUpdated',
      _count: '1',
    });

    const obs: import('@medplum/fhirtypes').Observation = {
      resourceType: 'Observation',
      status: 'final',
      code: { coding: [{ code: 'wear-hours', display: 'Wear Hours' }] },
      subject: { reference: `Device/${deviceId}` },
      valueInteger: hours,
      effectiveDateTime: new Date().toISOString(),
    };

    if (existing.length > 0 && existing[0].id) {
      await medplum.updateResource({ ...obs, id: existing[0].id });
    } else {
      await medplum.createResource(obs);
    }
  } catch (error) {
    console.error('Error saving wear hours:', error);
  }
}
