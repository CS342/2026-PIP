// Sensor Data Utilities - Fetch live sensor readings from Medplum
import type { MedplumClient } from '@medplum/core';
import type { Observation } from '@medplum/fhirtypes';

export interface SensorReading {
  touched: boolean;
  rawValue: number | null;
  timestamp: Date;
  timeAgo: string;
}

/**
 * Get time ago string from a date
 */
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Fetch the latest capacitance sensor reading for a device
 */
export async function getLatestCapacitanceReading(
  medplum: MedplumClient,
  deviceId: string
): Promise<SensorReading | null> {
  try {
    const observations = await medplum.searchResources('Observation', {
      subject: `Device/${deviceId}`,
      code: 'bag-capacitance',
      _sort: '-_lastUpdated',
      _count: '1',
    });

    if (observations.length === 0) {
      return null;
    }

    const obs = observations[0] as Observation;
    const touched = obs.valueBoolean ?? false;
    const timestamp = obs.effectiveDateTime ? new Date(obs.effectiveDateTime) : new Date();
    
    // Get raw value from component if available
    let rawValue: number | null = null;
    if (obs.component && obs.component.length > 0) {
      const capComponent = obs.component.find(c => c.code?.text === 'Capacitance Average Reading');
      if (capComponent?.valueQuantity?.value !== undefined) {
        rawValue = capComponent.valueQuantity.value;
      }
    }

    return {
      touched,
      rawValue,
      timestamp,
      timeAgo: getTimeAgo(timestamp),
    };
  } catch (error) {
    console.error('Error fetching capacitance reading:', error);
    return null;
  }
}

/**
 * Fetch the latest pressure/occupancy sensor reading for a device
 */
export async function getLatestOccupancyReading(
  medplum: MedplumClient,
  deviceId: string
): Promise<{ occupied: boolean; rawValue: number | null; timestamp: Date; timeAgo: string } | null> {
  try {
    const observations = await medplum.searchResources('Observation', {
      subject: `Device/${deviceId}`,
      code: 'bag-occupancy',
      _sort: '-_lastUpdated',
      _count: '1',
    });

    if (observations.length === 0) {
      return null;
    }

    const obs = observations[0] as Observation;
    const occupied = obs.valueBoolean ?? false;
    const timestamp = obs.effectiveDateTime ? new Date(obs.effectiveDateTime) : new Date();
    
    // Get raw value from component if available
    let rawValue: number | null = null;
    if (obs.component && obs.component.length > 0) {
      const pressureComponent = obs.component.find(c => c.code?.text === 'Pressure Reading');
      if (pressureComponent?.valueQuantity?.value !== undefined) {
        rawValue = pressureComponent.valueQuantity.value;
      }
    }

    return {
      occupied,
      rawValue,
      timestamp,
      timeAgo: getTimeAgo(timestamp),
    };
  } catch (error) {
    console.error('Error fetching occupancy reading:', error);
    return null;
  }
}

/**
 * Fetch all sensor data for a device
 */
export async function getAllSensorData(
  medplum: MedplumClient,
  deviceId: string
): Promise<{
  capacitance: SensorReading | null;
  occupancy: { occupied: boolean; rawValue: number | null; timestamp: Date; timeAgo: string } | null;
}> {
  const [capacitance, occupancy] = await Promise.all([
    getLatestCapacitanceReading(medplum, deviceId),
    getLatestOccupancyReading(medplum, deviceId),
  ]);

  return { capacitance, occupancy };
}
