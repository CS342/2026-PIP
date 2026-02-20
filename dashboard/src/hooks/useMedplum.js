import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

// Utility functions
export function calculateDaysSinceOpened(openedDateString) {
  if (!openedDateString) return null;
  const openedDate = new Date(openedDateString);
  const now = new Date();
  const diffTime = Math.abs(now - openedDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getOpenedDate(device) {
  if (device.note && device.note.length > 0) {
    for (let note of device.note) {
      if (note.text && note.text.includes('Package opened:')) {
        const match = note.text.match(/(\d{4}-\d{2}-\d{2}T[\d:\.]+Z)/);
        if (match) return match[1];
      }
    }
  }
  return null;
}

export function isDiscarded(device) {
  if (device.note && device.note.length > 0) {
    for (let note of device.note) {
      if (note.text && note.text.includes('DISCARDED:')) return true;
    }
  }
  return false;
}

export function findCurrentUseStatement(device, useStatements) {
  const deviceId = device.id;
  const bagIdentifier = device.identifier?.[0]?.value || null;
  
  const matches = useStatements.filter(us => {
    if (us.status !== 'active') return false;
    if (us.timingPeriod?.end) return false;
    const deviceRef = us.device.reference;
    if (deviceRef.includes(deviceId)) return true;
    if (bagIdentifier && deviceRef.includes(bagIdentifier)) return true;
    return false;
  });
  
  if (matches.length === 0) return null;
  return matches.sort((a, b) => new Date(b.recordedOn) - new Date(a.recordedOn))[0];
}

export function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function useMedplum() {
  const [devices, setDevices] = useState([]);
  const [useStatements, setUseStatements] = useState([]);
  const [pressureMap, setPressureMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await api.authenticate();
      const [devicesData, useStatementsData] = await Promise.all([
        api.fetchDevices(),
        api.fetchDeviceUseStatements()
      ]);

      const pressureData = await api.fetchAllPressureReadings(devicesData.map(d => d.id));

      setDevices(devicesData);
      setUseStatements(useStatementsData);
      setPressureMap(pressureData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const discardDevice = useCallback(async (device) => {
    const currentUse = findCurrentUseStatement(device, useStatements);
    
    // End current use if exists
    if (currentUse) {
      currentUse.status = 'completed';
      if (!currentUse.timingPeriod) currentUse.timingPeriod = {};
      currentUse.timingPeriod.end = new Date().toISOString();
      await api.updateDeviceUseStatement(currentUse);
    }
    
    // Mark device as discarded
    const discardNote = { text: `DISCARDED: ${new Date().toISOString()} - Removed from circulation` };
    if (!device.note) device.note = [discardNote];
    else device.note.push(discardNote);
    
    await api.updateDevice(device);
    await loadData();
  }, [useStatements, loadData]);

  const restoreDevice = useCallback(async (device) => {
    if (device.note && device.note.length > 0) {
      device.note = device.note.filter(note => !note.text.includes('DISCARDED:'));
    }
    await api.updateDevice(device);
    await loadData();
  }, [loadData]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  return {
    devices,
    useStatements,
    pressureMap,
    loading,
    error,
    lastUpdated,
    loadData,
    discardDevice,
    restoreDevice
  };
}
