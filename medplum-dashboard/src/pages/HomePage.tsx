// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Badge, Card, Group, Stack, Text, Title, Button } from '@mantine/core';
import { getReferenceString } from '@medplum/core';
import type { Practitioner, Patient, DeviceUseStatement, Device } from '@medplum/fhirtypes';
import { Document, ResourceName, useMedplum, useMedplumNavigate, useMedplumProfile } from '@medplum/react';
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { Outlet } from 'react-router';

interface PatientRow {
  patient: Patient;
  activeBarcode: string | null;
  daysRemaining: number | null;
}

function parseOpenedAt(device: Device): Date | null {
  const noteText = device.note?.[0]?.text || '';
  const match = noteText.match(/Package opened: (\d{4}-\d{2}-\d{2}T[\d:.]+Z)/);
  return match ? new Date(match[1]) : null;
}

export function HomePage(): JSX.Element {
  const profile = useMedplumProfile() as Practitioner;
  const navigate = useMedplumNavigate();
  const medplum = useMedplum();
  const [rows, setRows] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const patients = await medplum.searchResources('Patient', {});
        const allStatements = await medplum.searchResources('DeviceUseStatement', {});
        const activeStatements = allStatements.filter((s: DeviceUseStatement) => s.status === 'active');

        const result: PatientRow[] = await Promise.all(
          patients.map(async (patient) => {
            const stmt = activeStatements.find(
              (s: DeviceUseStatement) => s.subject?.reference === `Patient/${patient.id}`
            );

            if (!stmt) return { patient, activeBarcode: null, daysRemaining: null };

            let activeBarcode: string | null = null;
            let daysRemaining: number | null = null;

            try {
              const deviceId = stmt.device?.reference?.split('/').pop();
              if (deviceId) {
                const device = await medplum.readResource('Device', deviceId) as Device;
                activeBarcode = device.identifier?.[0]?.value || null;
                const openedAt = parseOpenedAt(device);
                if (openedAt) {
                  const expiresAt = new Date(openedAt);
                  expiresAt.setDate(expiresAt.getDate() + 90);
                  daysRemaining = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                }
              }
            } catch {}

            return { patient, activeBarcode, daysRemaining };
          })
        );

        result.sort((a, b) => {
          const nameA = a.patient.name?.[0]?.family || '';
          const nameB = b.patient.name?.[0]?.family || '';
          return nameA.localeCompare(nameB);
        });

        setRows(result);
      } catch (err) {
        console.error('Error loading patients:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [medplum]);

  const getPatientName = (p: Patient): string => {
    const name = p.name?.[0];
    if (!name) return 'Unknown';
    return `${(name.given || []).join(' ')} ${name.family || ''}`.trim();
  };

  const getMrn = (p: Patient): string => {
    return p.identifier?.[0]?.value || '—';
  };

  return (
    <Document>
      <Group justify="space-between" align="center" mb="md">
        <Title>Welcome <ResourceName value={profile} link /></Title>
        <Button onClick={() => navigate('/Patient/new')} style={{ backgroundColor: '#007a7a', color: 'white' }}>
          + New Patient
        </Button>
      </Group>

      {loading ? (
        <Text c="dimmed">Loading patients...</Text>
      ) : (
        <Stack gap="sm">
          {rows.map(({ patient, activeBarcode, daysRemaining }) => (
            <Card
              key={patient.id}
              withBorder
              padding="md"
              radius="md"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/${getReferenceString(patient)}`)}
            >
              <Group justify="space-between" align="center">
                <div>
                  <Text fw={600} size="md">{getPatientName(patient)}</Text>
                  <Text size="sm" c="dimmed">MRN: {getMrn(patient)}</Text>
                </div>
                <Group gap="sm">
                  {activeBarcode ? (
                    <>
                      <Badge style={{ backgroundColor: '#007a7a', color: 'white' }}>
                        {activeBarcode}
                      </Badge>
                      {daysRemaining !== null && (
                        <Badge
                          color={daysRemaining <= 0 ? 'red' : daysRemaining < 30 ? 'orange' : 'gray'}
                          variant="light"
                        >
                          {daysRemaining <= 0 ? 'Expired' : `${daysRemaining}d left`}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <Badge color="gray" variant="light">No positioner</Badge>
                  )}
                </Group>
              </Group>
            </Card>
          ))}
          {rows.length === 0 && <Text c="dimmed">No patients found.</Text>}
        </Stack>
      )}
      <Outlet />
    </Document>
  );
}
