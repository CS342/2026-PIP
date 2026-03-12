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
/**
 * Calculate wear hours for a device based on historical capacitance readings.
 * An hour counts if touched=true for at least 30 minutes within that hour.
 */
export async function calculateWearHours(
  medplum: MedplumClient,
  deviceId: string
): Promise<number> {
  try {
    const observations = await medplum.searchResources('Observation', {
      subject: `Device/${deviceId}`,
      code: 'bag-capacitance',
      _sort: 'date',
      _count: '1000',
    });

    if (observations.length === 0) return 0;

    // Group readings by hour bucket (e.g. "2024-01-15T10")
    const hourBuckets: Record<string, { touchedMinutes: number; lastTouchedTime: Date | null }> = {};

    for (const obs of observations as Observation[]) {
      const touched = obs.valueBoolean ?? false;
      const timestamp = obs.effectiveDateTime ? new Date(obs.effectiveDateTime) : null;
      if (!timestamp) continue;

      // Round down to the hour
      const hourKey = timestamp.toISOString().slice(0, 13); // "2024-01-15T10"
      if (!hourBuckets[hourKey]) {
        hourBuckets[hourKey] = { touchedMinutes: 0, lastTouchedTime: null };
      }

      if (touched) {
        const bucket = hourBuckets[hourKey];
        if (bucket.lastTouchedTime) {
          // Add minutes since last touched reading (capped at 10 min gap to avoid overcounting)
          const minutesDiff = Math.min(
            (timestamp.getTime() - bucket.lastTouchedTime.getTime()) / 60000,
            10
          );
          bucket.touchedMinutes += minutesDiff;
        } else {
          // First touched reading in this hour — count as 1 minute
          bucket.touchedMinutes += 1;
        }
        bucket.lastTouchedTime = timestamp;
      } else {
        // Reset last touched time on untouched reading
        hourBuckets[hourKey].lastTouchedTime = null;
      }
    }

    // Count hours where touched >= 30 minutes
    return Object.values(hourBuckets).filter((b) => b.touchedMinutes >= 30).length;
  } catch (error) {
    console.error('Error calculating wear hours:', error);
    return 0;
  }
}
