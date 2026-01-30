// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import {
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Progress,
  Stack,
  Table,
  Text,
  Title,
  Alert,
  UnstyledButton,
} from '@mantine/core';
import { IconInfoCircle, IconRefresh, IconTrash } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import { Document, useMedplum } from '@medplum/react';
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { getAllPositioners, discardPositioner, type Positioner, type PositionerStatus } from '../utils/positioner';

type FilterType = PositionerStatus | 'rotation-due' | 'all';

export function PositionersPage(): JSX.Element {
  const medplum = useMedplum();
  const [loading, setLoading] = useState(true);
  const [positioners, setPositioners] = useState<Positioner[]>([]);
  const [discarding, setDiscarding] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('active'); // Default to active

  useEffect(() => {
    loadPositioners();
  }, []);

  const loadPositioners = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getAllPositioners(medplum);
      setPositioners(data);
    } catch (error) {
      console.error('Error loading positioners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = async (p: Positioner): Promise<void> => {
    setDiscarding(p.id);
    try {
      await discardPositioner(medplum, p.device);
      showNotification({
        color: 'green',
        message: `Positioner ${p.barcode} discarded`,
      });
      loadPositioners();
    } catch (error) {
      console.error('Error discarding positioner:', error);
      showNotification({
        color: 'red',
        message: 'Failed to discard positioner',
      });
    } finally {
      setDiscarding(null);
    }
  };

  const getPatientDisplay = (p: Positioner): string => {
    if (!p.currentPatient?.reference) return 'Not assigned';
    const parts = p.currentPatient.reference.split('/');
    return parts.length > 1 ? `Patient ${parts[1].substring(0, 8)}...` : p.currentPatient.reference;
  };

  const getStatusBadge = (p: Positioner): JSX.Element => {
    switch (p.status) {
      case 'expired':
        return <Badge color="red" size="lg">Expired</Badge>;
      case 'discarded':
        return <Badge color="gray" size="lg">Discarded</Badge>;
      case 'active':
        return p.isRotationDue ? (
          <Badge color="orange" size="lg">Rotation Due</Badge>
        ) : (
          <Badge color="green" size="lg">Active</Badge>
        );
      default:
        return <Badge color="blue" size="lg">Available</Badge>;
    }
  };

  // Filter positioners based on selected filter
  const filteredPositioners = positioners.filter((p) => {
    switch (filter) {
      case 'active':
        return p.status === 'active';
      case 'available':
        return p.status === 'available';
      case 'expired':
        return p.status === 'expired';
      case 'discarded':
        return p.status === 'discarded';
      case 'rotation-due':
        return p.isRotationDue && p.status === 'active';
      case 'all':
        return true;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <Document>
        <Stack align="center" gap="md" py="xl">
          <Loader size="lg" />
          <Text>Loading positioners...</Text>
        </Stack>
      </Document>
    );
  }

  // Count by status
  const activeCount = positioners.filter((p) => p.status === 'active').length;
  const availableCount = positioners.filter((p) => p.status === 'available').length;
  const expiredCount = positioners.filter((p) => p.status === 'expired').length;
  const discardedCount = positioners.filter((p) => p.status === 'discarded').length;
  const rotationDueCount = positioners.filter((p) => p.isRotationDue && p.status === 'active').length;

  // Filter card component
  const FilterCard = ({
    label,
    count,
    color,
    filterValue,
  }: {
    label: string;
    count: number;
    color: string;
    filterValue: FilterType;
  }) => (
    <UnstyledButton onClick={() => setFilter(filterValue)}>
      <Card
        shadow={filter === filterValue ? 'md' : 'xs'}
        padding="sm"
        radius="md"
        withBorder
        style={{
          borderColor: filter === filterValue ? `var(--mantine-color-${color}-6)` : undefined,
          borderWidth: filter === filterValue ? 2 : 1,
          backgroundColor: filter === filterValue ? `var(--mantine-color-${color}-0)` : undefined,
          cursor: 'pointer',
          transition: 'all 0.2s',
          minWidth: '80px',
        }}
      >
        <Stack gap={2} align="center">
          <Text size="xl" fw={700} c={color}>
            {count}
          </Text>
          <Text size="xs" c={filter === filterValue ? color : 'dimmed'} fw={filter === filterValue ? 600 : 400}>
            {label}
          </Text>
        </Stack>
      </Card>
    </UnstyledButton>
  );

  return (
    <Document>
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={2}>Positioner Inventory</Title>
          <Button leftSection={<IconRefresh size={16} />} onClick={loadPositioners} variant="outline">
            Refresh
          </Button>
        </Group>

        <Alert icon={<IconInfoCircle size={16} />} color="blue" title="Automatic Management">
          <Text size="sm">
            <strong>Reassignment:</strong> Scanning a positioner on a new patient automatically reassigns it.
          </Text>
          <Text size="sm">
            <strong>Expiration:</strong> Positioners are automatically discarded 90 days after first use.
          </Text>
        </Alert>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Text fw={600}>Filter by Status (click to filter)</Text>
            <Group gap="md">
              <FilterCard label="Active" count={activeCount} color="green" filterValue="active" />
              {rotationDueCount > 0 && (
                <FilterCard label="Rotation Due" count={rotationDueCount} color="orange" filterValue="rotation-due" />
              )}
              <FilterCard label="Available" count={availableCount} color="blue" filterValue="available" />
              <FilterCard label="Expired" count={expiredCount} color="red" filterValue="expired" />
              <FilterCard label="Discarded" count={discardedCount} color="gray" filterValue="discarded" />
              <FilterCard label="All" count={positioners.length} color="dark" filterValue="all" />
            </Group>
          </Stack>
        </Card>

        {filteredPositioners.length === 0 ? (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Text c="dimmed" ta="center">
              {positioners.length === 0
                ? 'No positioners found. Scan a positioner barcode on a patient page to create one.'
                : `No ${filter === 'all' ? '' : filter} positioners found.`}
            </Text>
          </Card>
        ) : (
          <>
            <Text size="sm" c="dimmed">
              Showing {filteredPositioners.length} {filter === 'all' ? '' : filter} positioner{filteredPositioners.length !== 1 ? 's' : ''}
            </Text>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Barcode</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Currently Assigned To</Table.Th>
                  <Table.Th>Rotation</Table.Th>
                  <Table.Th>Days Remaining</Table.Th>
                  <Table.Th>First Opened</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredPositioners.map((p) => (
                  <Table.Tr
                    key={p.id}
                    style={{
                      backgroundColor: p.isRotationDue ? '#fff8e1' : undefined,
                    }}
                  >
                    <Table.Td>
                      <Text fw={500}>{p.barcode}</Text>
                    </Table.Td>
                    <Table.Td>{getStatusBadge(p)}</Table.Td>
                    <Table.Td>
                      <Text size="sm" c={p.currentPatient ? undefined : 'dimmed'}>
                        {getPatientDisplay(p)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {p.rotationIntervalHours ? (
                        <Stack gap={2}>
                          <Text size="sm">Every {p.rotationIntervalHours}h</Text>
                          {p.nextRotationAt && (
                            <Text size="xs" c={p.isRotationDue ? 'orange' : 'dimmed'}>
                              {p.isRotationDue ? 'Due now!' : `Next: ${p.nextRotationAt.toLocaleTimeString()}`}
                            </Text>
                          )}
                        </Stack>
                      ) : (
                        <Text size="sm" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {p.daysRemaining !== null ? (
                        <Stack gap={4}>
                          <Text
                            size="sm"
                            fw={600}
                            c={p.daysRemaining < 7 ? 'red' : p.daysRemaining < 30 ? 'orange' : 'green'}
                          >
                            {p.daysRemaining} days
                          </Text>
                          <Progress
                            value={(p.daysRemaining / 90) * 100}
                            color={p.daysRemaining < 7 ? 'red' : p.daysRemaining < 30 ? 'orange' : 'green'}
                            size="xs"
                            style={{ width: '60px' }}
                          />
                        </Stack>
                      ) : (
                        <Text size="sm" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {p.openedAt ? (
                        <Text size="sm">{p.openedAt.toLocaleDateString()}</Text>
                      ) : (
                        <Text size="sm" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {p.status !== 'discarded' && (
                        <Button
                          size="xs"
                          variant="outline"
                          color="red"
                          leftSection={<IconTrash size={14} />}
                          onClick={() => handleDiscard(p)}
                          loading={discarding === p.id}
                        >
                          Discard
                        </Button>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </>
        )}
      </Stack>
    </Document>
  );
}
