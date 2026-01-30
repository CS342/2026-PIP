// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Badge, Card, Group, Stack, Text, Button, Alert, Progress, Title } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconAlertCircle, IconX, IconCheck, IconClock } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import type { Patient } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import {
  getPositionersForPatient,
  deactivatePositioner,
  completeRotation,
  postponeRotation,
  type Positioner,
} from '../utils/positioner';

interface PositionerStatusProps {
  patient: Patient;
  onRefresh?: () => void;
}

export function PositionerStatus({ patient, onRefresh }: PositionerStatusProps): JSX.Element | null {
  const medplum = useMedplum();
  const [positioners, setPositioners] = useState<Positioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPositioners();
    // Poll for rotation updates every 30 seconds
    const interval = setInterval(loadPositioners, 30000);
    return () => clearInterval(interval);
  }, [patient.id]);

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

  const handleCompleteRotation = async (positioner: Positioner): Promise<void> => {
    setActionLoading(`complete-${positioner.id}`);
    try {
      await completeRotation(medplum, positioner.device);
      showNotification({
        color: 'green',
        message: 'Rotation completed! Next rotation scheduled.',
      });
      loadPositioners();
      onRefresh?.();
    } catch (error) {
      console.error('Error completing rotation:', error);
      showNotification({
        color: 'red',
        message: 'Failed to complete rotation',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePostponeRotation = async (positioner: Positioner): Promise<void> => {
    setActionLoading(`postpone-${positioner.id}`);
    try {
      await postponeRotation(medplum, positioner.device, 30);
      showNotification({
        color: 'blue',
        message: 'Rotation postponed by 30 minutes',
      });
      loadPositioners();
      onRefresh?.();
    } catch (error) {
      console.error('Error postponing rotation:', error);
      showNotification({
        color: 'red',
        message: 'Failed to postpone rotation',
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
            backgroundColor: p.status === 'expired' ? '#fff5f5' : p.isRotationDue ? '#fff8e1' : '#f8f9fa',
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
                ) : p.isRotationDue ? (
                  <Badge color="orange" size="lg">
                    Rotation Due
                  </Badge>
                ) : (
                  <Badge color="green" size="lg">
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

            {/* Rotation Due Alert */}
            {p.isRotationDue && p.status !== 'expired' && (
              <Alert
                icon={<IconClock size={16} />}
                color="orange"
                title="Rotation Due"
                style={{ border: '2px solid #ff9800', backgroundColor: '#fff8e1' }}
              >
                <Stack gap="sm">
                  <Text size="sm">Time to rotate the patient positioner.</Text>
                  <Group gap="sm">
                    <Button
                      size="xs"
                      leftSection={<IconCheck size={14} />}
                      onClick={() => handleCompleteRotation(p)}
                      loading={actionLoading === `complete-${p.id}`}
                      style={{ backgroundColor: '#2e7d32' }}
                    >
                      Complete Rotation
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      leftSection={<IconClock size={14} />}
                      onClick={() => handlePostponeRotation(p)}
                      loading={actionLoading === `postpone-${p.id}`}
                    >
                      Postpone 30 min
                    </Button>
                  </Group>
                </Stack>
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
                    c={p.daysRemaining < 7 ? 'red' : p.daysRemaining < 30 ? 'orange' : 'green'}
                  >
                    {p.daysRemaining} days
                  </Text>
                </Group>
                <Progress
                  value={(p.daysRemaining / 90) * 100}
                  color={p.daysRemaining < 7 ? 'red' : p.daysRemaining < 30 ? 'orange' : 'green'}
                  size="sm"
                />
              </div>
            )}

            {/* Rotation Info */}
            {p.status !== 'expired' && p.rotationIntervalHours && !p.isRotationDue && (
              <Card padding="sm" style={{ backgroundColor: 'white' }}>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      Next Rotation
                    </Text>
                    <Badge color="blue" size="sm">
                      Every {p.rotationIntervalHours} hours
                    </Badge>
                  </Group>
                  {p.nextRotationAt && (
                    <Text size="xs" c="dimmed">
                      Due: {p.nextRotationAt.toLocaleString()}
                    </Text>
                  )}
                  {p.lastRotatedAt && (
                    <Text size="xs" c="dimmed">
                      Last rotated: {p.lastRotatedAt.toLocaleString()}
                    </Text>
                  )}
                </Stack>
              </Card>
            )}

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
