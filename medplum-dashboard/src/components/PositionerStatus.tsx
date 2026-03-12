// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Badge, Card, Group, Stack, Text, Button, Alert, Progress, Title, Divider } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconAlertCircle, IconX, IconActivity } from '@tabler/icons-react';
import { useEffect, useState, useCallback } from 'react';
import type { JSX } from 'react';
import type { Patient } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import {
  getPositionersForPatient,
  deactivatePositioner,
  getWearHours,
  saveWearHours,
  type Positioner,
} from '../utils/positioner';
import { getLatestCapacitanceReading, calculateWearHours, type SensorReading } from '../utils/sensorData';
interface PositionerStatusProps {
  patient: Patient;
  onRefresh?: () => void;
}

export function PositionerStatus({ patient, onRefresh }: PositionerStatusProps): JSX.Element | null {
  const medplum = useMedplum();
  const [positioners, setPositioners] = useState<Positioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sensorData, setSensorData] = useState<Record<string, SensorReading | null>>({});
  const [wearHours, setWearHours] = useState<Record<string, number>>({});

  const loadSensorData = useCallback(async (positionerList: Positioner[]) => {
    const data: Record<string, SensorReading | null> = {};
    for (const p of positionerList) {
      data[p.id] = await getLatestCapacitanceReading(medplum, p.id);
    }
    setSensorData(data);
  }, [medplum]);
  
  const loadWearHours = useCallback(async (positionerList: Positioner[]) => {
  const updated: Record<string, number> = {};
  for (const p of positionerList) {
    const calculated = await calculateWearHours(medplum, p.id);
    await saveWearHours(medplum, p.id, calculated);
    updated[p.id] = calculated;
  }
  setWearHours(updated);
}, [medplum]);

  useEffect(() => {
    loadPositioners();
  }, [patient.id]);

  // Poll sensor data every 10 seconds
useEffect(() => {
  if (positioners.length > 0) {
    loadSensorData(positioners);
    loadWearHours(positioners);                              // ADD THIS LINE
    const interval = setInterval(() => loadSensorData(positioners), 10000);
    return () => clearInterval(interval);
  }
}, [positioners, loadSensorData, loadWearHours]);           // add loadWearHours to deps
  
  const loadPositioners = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getPositionersForPatient(medplum, patient);
      setPositioners(data);
    } catch (error) {
      console.error('Error loading positioners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (positioner: Positioner): Promise<void> => {
    setActionLoading(`deactivate-${positioner.id}`);
    try {
      await deactivatePositioner(medplum, positioner.device);
      showNotification({
        color: 'green',
        message: 'Positioner deactivated',
      });
      loadPositioners();
      onRefresh?.();
    } catch (error) {
      console.error('Error deactivating positioner:', error);
      showNotification({
        color: 'red',
        message: 'Failed to deactivate positioner',
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && positioners.length === 0) {
    return null;
  }

  if (positioners.length === 0) {
    return null;
  }

  return (
    <Stack gap="md">
      <Title order={4}>Active Positioners ({positioners.length})</Title>

      {positioners.map((p) => (
        <Card
          key={p.id}
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          style={{
            backgroundColor: p.status === 'expired' ? '#fff5f5' : '#f8f9fa',
          }}
        >
          <Stack gap="md">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fw={600} size="lg">
                  Positioner
                </Text>
                <Text size="sm" c="dimmed">
                  Barcode: {p.barcode}
                </Text>
              </div>
              <Group gap="sm">
                {p.status === 'expired' ? (
                  <Badge color="red" size="lg">
                    Expired
                  </Badge>
                ) : (
                  <Badge size="lg" style={{ backgroundColor: '#007a7a', color: 'white' }}>
                    Active
                  </Badge>
                )}
                <Button
                  size="xs"
                  variant="outline"
                  color="red"
                  leftSection={<IconX size={14} />}
                  onClick={() => handleDeactivate(p)}
                  loading={actionLoading === `deactivate-${p.id}`}
                >
                  Deactivate
                </Button>
              </Group>
            </Group>

            {/* Expiration Alert */}
            {p.status === 'expired' && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="red"
                title="Positioner Expired — High Priority Alert"
                style={{ border: '2px solid #d32f2f', backgroundColor: '#ffebee' }}
              >
                <Text fw={600}>Positioner expired — discard and replace</Text>
                <Text size="sm" mt="xs">
                  This positioner has exceeded its 90-day expiration period. Please replace it immediately.
                </Text>
              </Alert>
            )}

            {/* Days Remaining */}
            {p.status !== 'expired' && p.daysRemaining !== null && (
              <div>
                <Group justify="space-between" mb={4}>
                  <Text size="sm" fw={500}>
                    Days Until Expiration
                  </Text>
                  <Text
                    size="sm"
                    fw={600}
                    style={{ color: p.daysRemaining < 7 ? '#c43d3d' : p.daysRemaining < 30 ? '#b87b00' : '#007a7a' }}
                  >
                    {p.daysRemaining} days
                  </Text>
                </Group>
                <Progress
                  value={(p.daysRemaining / 90) * 100}
                  color={p.daysRemaining < 7 ? 'red' : p.daysRemaining < 30 ? 'orange' : '#007a7a'}
                  size="sm"
                />
              </div>
            )}

            {/* Sensor Data */}
            <Divider label="Live Sensor Data" labelPosition="center" />
            <Group gap="xl">
              <div>
                <Text size="xs" c="dimmed" mb={4}>Capacitance Sensor</Text>
                {sensorData[p.id] ? (
                  <Group gap="xs">
                    <Badge 
                      size="lg" 
                      color={sensorData[p.id]?.touched ? 'yellow' : 'gray'}
                      leftSection={<IconActivity size={14} />}
                    >
                      {sensorData[p.id]?.touched ? 'TOUCHED' : 'NOT TOUCHED'}
                    </Badge>
                    <Text size="xs" c="dimmed">{sensorData[p.id]?.timeAgo}</Text>
                  </Group>
                ) : (
                  <Text size="sm" c="dimmed">No sensor data</Text>
                )}
              </div>
              {sensorData[p.id]?.rawValue !== null && sensorData[p.id]?.rawValue !== undefined && (
                <div>
                  <Text size="xs" c="dimmed" mb={4}>Raw Value</Text>
                  <Text size="sm" fw={500}>{sensorData[p.id]?.rawValue}</Text>
                </div>
              )}
            </Group>
            {/* Wear Hours */}
<Divider label="Wear Tracking" labelPosition="center" />
<Group gap="xl">
  <div>
    <Text size="xs" c="dimmed" mb={4}>Wear Hours</Text>
    <Badge size="lg" style={{ backgroundColor: '#007a7a', color: 'white' }}>
      {wearHours[p.id] ?? 0} hrs
    </Badge>
  </div>
</Group>

            {/* Metadata */}
            <Group gap="xl">
              {p.openedAt && (
                <Text size="xs" c="dimmed">
                  Opened: {p.openedAt.toLocaleDateString()}
                </Text>
              )}
              {p.assignedAt && (
                <Text size="xs" c="dimmed">
                  Assigned: {p.assignedAt.toLocaleDateString()}
                </Text>
              )}
            </Group>
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
