// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Button, Group, Stack, Title } from '@mantine/core';
import { IconQrcode } from '@tabler/icons-react';
import { Document, ResourceTable, useResource } from '@medplum/react';
import { useState } from 'react';
import type { JSX } from 'react';
import { useParams } from 'react-router';
import type { Patient } from '@medplum/fhirtypes';
import { ScanPositionerModal } from './ScanPositionerModal';
import { PositionerStatus } from './PositionerStatus';

/*
 * You can combine Medplum components with plain HTML to quickly display patient data.
 * Medplum has out of the box components to render common data types such as
 *   - Addresses
 *   - Phone numbers
 *   - Patient/Provider names
 *   - Patient/Provider profile photo
 * */
export function PatientOverview(): JSX.Element {
  const { id } = useParams();
  const patient = useResource<Patient>({ reference: `Patient/${id}` });
  const [scanModalOpened, setScanModalOpened] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleScanSuccess = (): void => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Document>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={3}>Patient Overview</Title>
          {patient && (
            <Button
              leftSection={<IconQrcode size={16} />}
              onClick={() => setScanModalOpened(true)}
              size="md"
              style={{ backgroundColor: '#2e7d32', color: 'white' }}
            >
              Scan Positioner
            </Button>
          )}
        </Group>

        {patient && (
          <>
            <PositionerStatus key={refreshKey} patient={patient} onRefresh={() => setRefreshKey((prev) => prev + 1)} />
            <ScanPositionerModal
              opened={scanModalOpened}
              onClose={() => setScanModalOpened(false)}
              patient={patient}
              onSuccess={handleScanSuccess}
            />
          </>
        )}

        <ResourceTable value={{ reference: `Patient/${id}` }} />
      </Stack>
    </Document>
  );
}
