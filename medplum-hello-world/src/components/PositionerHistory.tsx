import { Badge, Card, Divider, Group, Stack, Text, Title } from '@mantine/core';
import { useMedplum } from '@medplum/react';
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import type { Patient, DeviceUseStatement, Device } from '@medplum/fhirtypes';

interface HistoryEntry {
  statement: DeviceUseStatement;
  barcode: string;
  start: Date | null;
  end: Date | null;
  status: string;
}

interface PositionerHistoryProps {
  patient: Patient;
  refreshKey?: number;
}

export function PositionerHistory({ patient, refreshKey }: PositionerHistoryProps): JSX.Element | null {
  const medplum = useMedplum();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const allStatements = await medplum.searchResources('DeviceUseStatement', {});
        const statements = allStatements.filter(
          (s) => s.subject?.reference === `Patient/${patient.id}`
        );

        const entries: HistoryEntry[] = await Promise.all(
          statements.map(async (stmt) => {
            let barcode = stmt.device?.reference || 'Unknown';
            try {
              const deviceId = stmt.device?.reference?.split('/').pop();
              if (deviceId) {
                const device = await medplum.readResource('Device', deviceId) as Device;
                barcode = device.identifier?.[0]?.value || barcode;
              }
            } catch {}
            return {
              statement: stmt,
              barcode,
              start: stmt.timingPeriod?.start ? new Date(stmt.timingPeriod.start) : null,
              end: stmt.timingPeriod?.end ? new Date(stmt.timingPeriod.end) : null,
              status: stmt.status || 'unknown',
            };
          })
        );

        // Sort by start date descending
        entries.sort((a, b) => (b.start?.getTime() ?? 0) - (a.start?.getTime() ?? 0));
        setHistory(entries);
      } catch (err) {
        console.error('Error loading positioner history:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patient.id, refreshKey, medplum]);

  if (loading) return null;

  if (history.length === 0) {
    return (
      <Stack gap="sm">
        <Divider />
        <Title order={4}>Positioner History</Title>
        <Text size="sm" c="dimmed">No positioner assignments recorded for this patient.</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="sm">
      <Divider />
      <Title order={4}>Positioner History ({history.length})</Title>
      {history.map((entry) => (
        <Card key={entry.statement.id} withBorder padding="sm" radius="md">
          <Group justify="space-between" align="center">
            <Group gap="sm">
              <Text fw={600}>{entry.barcode}</Text>
              <Badge color={entry.status === 'active' ? 'teal' : 'gray'} size="sm">
                {entry.status === 'active' ? 'Active' : 'Completed'}
              </Badge>
            </Group>
            <Stack gap={2} align="flex-end">
              {entry.start && (
                <Text size="xs" c="dimmed">
                  Assigned: {entry.start.toLocaleDateString()} {entry.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
              {entry.end && (
                <Text size="xs" c="dimmed">
                  Removed: {entry.end.toLocaleDateString()} {entry.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
              {entry.start && entry.end && (
                <Text size="xs" c="dimmed">
                  Duration: {Math.round((entry.end.getTime() - entry.start.getTime()) / (1000 * 60 * 60 * 24))}d
                </Text>
              )}
            </Stack>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}
