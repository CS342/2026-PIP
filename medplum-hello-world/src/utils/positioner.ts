// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { createReference, getReferenceString } from '@medplum/core';
import type { Device, Patient, Reference } from '@medplum/fhirtypes';
import type { MedplumClient } from '@medplum/core';

/**
 * =============================================================================
 * POSITIONER DATA MODEL (Single Device Resource)
 * =============================================================================
 * 
 * All positioner data is stored in a single Device resource with extensions:
 * 
 * CORE FIELDS (FHIR standard):
 * - status: 'active' | 'inactive' (inactive = expired/discarded)
 * - identifier[0].value: Barcode ID
 * 
 * EXTENSIONS (custom):
 * - positioner-opened-at: DateTime - When first scanned (IMMUTABLE, never resets)
 * - positioner-expires-at: DateTime - opened_at + 90 days
 * - current-patient: Reference<Patient> - Currently assigned patient (or null)
 * - assigned-at: DateTime - When assigned to current patient
 * - rotation-interval-hours: Integer - How often to rotate (e.g. 6 hours)
 * - next-rotation-at: DateTime - When next rotation is due
 * - last-rotated-at: DateTime - When last rotation was completed
 * 
 * =============================================================================
 * CORE RULE: Positioner expiration is GLOBAL and NEVER resets.
 * - The 90-day countdown starts ONCE, the first time scanned
 * - Reassigning to a new patient does NOT restart the clock
 * =============================================================================
 */

const EXPIRATION_DAYS = 90;
const EXTENSION_URLS = {
  openedAt: 'https://example.com/fhir/positioner-opened-at',
  expiresAt: 'https://example.com/fhir/positioner-expires-at',
  currentPatient: 'https://example.com/fhir/current-patient',
  assignedAt: 'https://example.com/fhir/assigned-at',
  rotationIntervalHours: 'https://example.com/fhir/rotation-interval-hours',
  nextRotationAt: 'https://example.com/fhir/next-rotation-at',
  lastRotatedAt: 'https://example.com/fhir/last-rotated-at',
};

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
  device: Device; // Original FHIR resource
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate expiration date from opened_at timestamp
 */
export function calculateExpirationDate(openedAt: Date): Date {
  const expiresAt = new Date(openedAt);
  expiresAt.setDate(expiresAt.getDate() + EXPIRATION_DAYS);
  return expiresAt;
}

/**
 * Get extension value from Device
 */
function getExtension(device: Device, url: string): any {
  return device.extension?.find((ext) => ext.url === url);
}

/**
 * Get DateTime extension value
 */
function getDateTimeExtension(device: Device, url: string): Date | null {
  const ext = getExtension(device, url);
  return ext?.valueDateTime ? new Date(ext.valueDateTime) : null;
}

/**
 * Get Integer extension value
 */
function getIntegerExtension(device: Device, url: string): number | null {
  const ext = getExtension(device, url);
  return ext?.valueInteger ?? null;
}

/**
 * Get Reference extension value
 */
function getReferenceExtension(device: Device, url: string): Reference<Patient> | null {
  const ext = getExtension(device, url);
  return ext?.valueReference ?? null;
}

/**
 * Set or update an extension on Device
 */
function setExtension(device: Device, url: string, value: any, type: 'dateTime' | 'integer' | 'reference'): Device {
  const extensions = device.extension?.filter((ext) => ext.url !== url) || [];
  
  if (value !== null && value !== undefined) {
    const newExt: any = { url };
    if (type === 'dateTime') {
      newExt.valueDateTime = value instanceof Date ? value.toISOString() : value;
    } else if (type === 'integer') {
      newExt.valueInteger = value;
    } else if (type === 'reference') {
      newExt.valueReference = value;
    }
    extensions.push(newExt);
  }
  
  return { ...device, extension: extensions };
}

// ============================================================================
// POSITIONER DATA ACCESS
// ============================================================================

/**
 * Convert a Device to a Positioner object with computed fields
 */
export function deviceToPositioner(device: Device): Positioner {
  const openedAt = getDateTimeExtension(device, EXTENSION_URLS.openedAt);
  const expiresAt = getDateTimeExtension(device, EXTENSION_URLS.expiresAt);
  const nextRotationAt = getDateTimeExtension(device, EXTENSION_URLS.nextRotationAt);
  const now = new Date();
  
  // Calculate days remaining
  let daysRemaining: number | null = null;
  if (expiresAt) {
    daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }
  
  // Determine status
  let status: PositionerStatus = 'available';
  if (device.status === 'inactive') {
    status = 'discarded';
  } else if (expiresAt && now >= expiresAt) {
    status = 'expired';
  } else if (getReferenceExtension(device, EXTENSION_URLS.currentPatient)) {
    status = 'active';
  }
  
  // Check if rotation is due
  const isRotationDue = nextRotationAt ? now >= nextRotationAt : false;
  
  return {
    id: device.id || '',
    barcode: device.identifier?.[0]?.value || '',
    status,
    openedAt,
    expiresAt,
    daysRemaining,
    currentPatient: getReferenceExtension(device, EXTENSION_URLS.currentPatient),
    assignedAt: getDateTimeExtension(device, EXTENSION_URLS.assignedAt),
    rotationIntervalHours: getIntegerExtension(device, EXTENSION_URLS.rotationIntervalHours),
    nextRotationAt,
    lastRotatedAt: getDateTimeExtension(device, EXTENSION_URLS.lastRotatedAt),
    isRotationDue,
    device,
  };
}

/**
 * Check if a positioner is expired
 */
export function isPositionerExpired(device: Device): boolean {
  const expiresAt = getDateTimeExtension(device, EXTENSION_URLS.expiresAt);
  if (!expiresAt) return false;
  return new Date() >= expiresAt;
}

// ============================================================================
// POSITIONER CRUD OPERATIONS
// ============================================================================

/**
 * Find a positioner by barcode
 * Searches all devices and filters client-side to ensure no duplicates
 */
export async function findPositionerByBarcode(medplum: MedplumClient, barcode: string): Promise<Device | null> {
  try {
    // Search all devices and filter client-side for reliability
    const devices = await medplum.searchResources('Device', {});
    
    // Find positioner with matching barcode
    const match = devices.find(
      (device) =>
        device.type?.coding?.some((coding) => coding.code === 'fluidized-positioner') &&
        device.identifier?.some((id) => id.value === barcode)
    );
    
    console.log(`findPositionerByBarcode: Looking for "${barcode}", found: ${match ? match.id : 'none'}`);
    
    return match || null;
  } catch (error) {
    console.error('Error finding positioner:', error);
    return null;
  }
}

/**
 * Get all positioners
 */
export async function getAllPositioners(medplum: MedplumClient): Promise<Positioner[]> {
  try {
    const devices = await medplum.searchResources('Device', {});
    
    // Filter to only positioner devices
    const positioners = devices.filter(
      (device) =>
        device.type?.coding?.some(
          (coding) => coding.code === 'fluidized-positioner'
        )
    );
    
    return positioners.map(deviceToPositioner);
  } catch (error) {
    console.error('Error getting all positioners:', error);
    return [];
  }
}

/**
 * Get all positioners assigned to a specific patient
 */
export async function getPositionersForPatient(medplum: MedplumClient, patient: Patient): Promise<Positioner[]> {
  try {
    const allPositioners = await getAllPositioners(medplum);
    const patientRef = getReferenceString(patient);
    
    return allPositioners.filter(
      (p) => p.currentPatient?.reference === patientRef && p.status === 'active'
    );
  } catch (error) {
    console.error('Error getting positioners for patient:', error);
    return [];
  }
}

/**
 * Create a new positioner (Device) with barcode
 * Sets opened_at and expires_at on first creation
 */
export async function createPositioner(medplum: MedplumClient, barcode: string): Promise<Device> {
  const now = new Date();
  const expiresAt = calculateExpirationDate(now);

  const device: Device = {
    resourceType: 'Device',
    status: 'active',
    identifier: [
      {
        system: 'https://example.com/fhir/positioner-barcode',
        value: barcode,
      },
    ],
    type: {
      coding: [
        {
          system: 'https://example.com/fhir/device-type',
          code: 'fluidized-positioner',
          display: 'Fluidized Positioner',
        },
      ],
    },
    extension: [
      {
        url: EXTENSION_URLS.openedAt,
        valueDateTime: now.toISOString(),
      },
      {
        url: EXTENSION_URLS.expiresAt,
        valueDateTime: expiresAt.toISOString(),
      },
    ],
  };

  return medplum.createResource(device);
}

// ============================================================================
// PATIENT ASSIGNMENT
// ============================================================================

/**
 * Assign a positioner to a patient
 * - If already assigned to another patient, reassigns (ends previous assignment)
 * - Sets rotation interval and schedules first rotation
 */
export async function assignPositionerToPatient(
  medplum: MedplumClient,
  device: Device,
  patient: Patient,
  rotationIntervalHours: number
): Promise<Device> {
  const now = new Date();
  const nextRotation = new Date(now.getTime() + rotationIntervalHours * 60 * 60 * 1000);
  
  let updated = device;
  updated = setExtension(updated, EXTENSION_URLS.currentPatient, createReference(patient), 'reference');
  updated = setExtension(updated, EXTENSION_URLS.assignedAt, now, 'dateTime');
  updated = setExtension(updated, EXTENSION_URLS.rotationIntervalHours, rotationIntervalHours, 'integer');
  updated = setExtension(updated, EXTENSION_URLS.nextRotationAt, nextRotation, 'dateTime');
  updated = setExtension(updated, EXTENSION_URLS.lastRotatedAt, null, 'dateTime'); // Reset last rotated
  
  return medplum.updateResource(updated);
}

/**
 * Deactivate/unassign a positioner from its current patient
 */
export async function deactivatePositioner(medplum: MedplumClient, device: Device): Promise<Device> {
  let updated = device;
  updated = setExtension(updated, EXTENSION_URLS.currentPatient, null, 'reference');
  updated = setExtension(updated, EXTENSION_URLS.assignedAt, null, 'dateTime');
  updated = setExtension(updated, EXTENSION_URLS.rotationIntervalHours, null, 'integer');
  updated = setExtension(updated, EXTENSION_URLS.nextRotationAt, null, 'dateTime');
  
  return medplum.updateResource(updated);
}

/**
 * Discard a positioner (mark as inactive)
 */
export async function discardPositioner(medplum: MedplumClient, device: Device): Promise<Device> {
  // First deactivate (remove patient assignment)
  let updated = await deactivatePositioner(medplum, device);
  // Then mark as inactive
  updated = { ...updated, status: 'inactive' };
  return medplum.updateResource(updated);
}

// ============================================================================
// ROTATION MANAGEMENT
// ============================================================================

/**
 * Mark rotation as completed and schedule next rotation
 */
export async function completeRotation(medplum: MedplumClient, device: Device): Promise<Device> {
  const now = new Date();
  const intervalHours = getIntegerExtension(device, EXTENSION_URLS.rotationIntervalHours) || 6;
  const nextRotation = new Date(now.getTime() + intervalHours * 60 * 60 * 1000);
  
  let updated = device;
  updated = setExtension(updated, EXTENSION_URLS.lastRotatedAt, now, 'dateTime');
  updated = setExtension(updated, EXTENSION_URLS.nextRotationAt, nextRotation, 'dateTime');
  
  return medplum.updateResource(updated);
}

/**
 * Postpone rotation by a specified number of minutes
 */
export async function postponeRotation(medplum: MedplumClient, device: Device, minutes: number = 30): Promise<Device> {
  const currentNextRotation = getDateTimeExtension(device, EXTENSION_URLS.nextRotationAt) || new Date();
  const newNextRotation = new Date(currentNextRotation.getTime() + minutes * 60 * 1000);
  
  let updated = device;
  updated = setExtension(updated, EXTENSION_URLS.nextRotationAt, newNextRotation, 'dateTime');
  
  return medplum.updateResource(updated);
}

// ============================================================================
// EXPIRATION MANAGEMENT
// ============================================================================

/**
 * Check and auto-discard expired positioners
 * Call this periodically to enforce the 90-day expiration rule
 */
export async function checkAndDiscardExpiredPositioners(medplum: MedplumClient): Promise<void> {
  try {
    const allPositioners = await getAllPositioners(medplum);
    
    for (const positioner of allPositioners) {
      if (positioner.status !== 'discarded' && isPositionerExpired(positioner.device)) {
        console.log(`Auto-discarding expired positioner: ${positioner.barcode}`);
        await discardPositioner(medplum, positioner.device);
      }
    }
  } catch (error) {
    console.error('Error checking expired positioners:', error);
  }
}

// ============================================================================
// CLEANUP DUPLICATES
// ============================================================================

/**
 * Remove duplicate positioners (keeps the one with most data, deletes others)
 * Call this once to clean up existing duplicates
 */
export async function cleanupDuplicatePositioners(medplum: MedplumClient): Promise<void> {
  try {
    console.log('=== CLEANING UP DUPLICATE POSITIONERS ===');
    
    const devices = await medplum.searchResources('Device', {});
    
    // Filter to only positioner devices
    const positioners = devices.filter(
      (device) =>
        device.type?.coding?.some((coding) => coding.code === 'fluidized-positioner')
    );
    
    // Group by barcode
    const byBarcode: Record<string, Device[]> = {};
    for (const device of positioners) {
      const barcode = device.identifier?.[0]?.value;
      if (barcode) {
        if (!byBarcode[barcode]) {
          byBarcode[barcode] = [];
        }
        byBarcode[barcode].push(device);
      }
    }
    
    // Find and remove duplicates
    for (const [barcode, duplicates] of Object.entries(byBarcode)) {
      if (duplicates.length > 1) {
        console.log(`Found ${duplicates.length} duplicates for barcode: ${barcode}`);
        
        // Sort by: has current patient > has opened_at > newest
        duplicates.sort((a, b) => {
          const aHasPatient = getExtension(a, EXTENSION_URLS.currentPatient) ? 1 : 0;
          const bHasPatient = getExtension(b, EXTENSION_URLS.currentPatient) ? 1 : 0;
          if (aHasPatient !== bHasPatient) return bHasPatient - aHasPatient;
          
          const aOpened = getDateTimeExtension(a, EXTENSION_URLS.openedAt);
          const bOpened = getDateTimeExtension(b, EXTENSION_URLS.openedAt);
          if (aOpened && !bOpened) return -1;
          if (!aOpened && bOpened) return 1;
          
          return 0;
        });
        
        // Keep the first one (best one), delete the rest
        const keep = duplicates[0];
        console.log(`Keeping positioner: ${keep.id}`);
        
        for (let i = 1; i < duplicates.length; i++) {
          const toDelete = duplicates[i];
          console.log(`Deleting duplicate positioner: ${toDelete.id}`);
          await medplum.deleteResource('Device', toDelete.id!);
        }
      }
    }
    
    console.log('=== CLEANUP COMPLETE ===');
  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
  }
}

// ============================================================================
// SCAN & ACTIVATE WORKFLOW
// ============================================================================

/**
 * Main workflow: Scan a barcode and activate positioner for a patient
 * 
 * 1. Find or create the positioner
 * 2. Check if expired (block if so)
 * 3. Reassign to the new patient (automatically ends previous assignment)
 * 4. Set up rotation schedule
 */
export async function scanAndActivatePositioner(
  medplum: MedplumClient,
  barcode: string,
  patient: Patient,
  rotationIntervalHours: number
): Promise<{ success: boolean; device?: Device; error?: string }> {
  try {
    console.log(`=== SCAN & ACTIVATE: barcode="${barcode}" ===`);
    
    // Step 1: Find existing positioner by barcode
    let device = await findPositionerByBarcode(medplum, barcode);
    
    if (device) {
      console.log(`Found existing positioner: ${device.id}`);
    } else {
      console.log(`No existing positioner found, creating new one...`);
      // Create new positioner with opened_at = now
      device = await createPositioner(medplum, barcode);
      console.log(`Created new positioner: ${device.id}`);
    }
    
    // Step 2: Check if expired
    if (isPositionerExpired(device)) {
      console.log(`Positioner is expired, blocking activation`);
      return { success: false, error: 'Positioner expired — discard and replace' };
    }
    
    // Step 3: Assign to patient (automatically replaces any previous assignment)
    console.log(`Assigning positioner to patient: ${patient.id}`);
    device = await assignPositionerToPatient(medplum, device, patient, rotationIntervalHours);
    console.log(`Assignment complete`);
    
    return { success: true, device };
  } catch (error: any) {
    console.error('Error in scanAndActivatePositioner:', error);
    return { success: false, error: error.message || 'Failed to activate positioner' };
  }
}
