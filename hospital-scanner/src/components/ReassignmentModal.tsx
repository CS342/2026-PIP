import {
  Modal,
  Stack,
  Text,
  Button,
  Alert,
  Card,
  Group,
  Badge,
} from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import type { JSX } from 'react';

interface ReassignmentModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bagId: string;
  currentPatientName: string;
  currentPatientMrn: string;
  newPatientMrn: string;
}

export function ReassignmentModal({
  opened,
  onClose,
  onConfirm,
  bagId,
  currentPatientName,
  currentPatientMrn,
  newPatientMrn,
}: ReassignmentModalProps): JSX.Element {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <IconAlertTriangle size={24} color="#b87b00" />
          <Text fw={700} size="lg">Positioner Already In Use</Text>
        </Group>
      }
      size="md"
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
    >
      <Stack gap="md">
        <Alert 
          icon={<IconAlertTriangle size={20} />} 
          color="orange" 
          variant="light"
        >
          This positioner is currently assigned to another patient.
        </Alert>

        <Card withBorder padding="md" style={{ backgroundColor: '#fff7e6', borderColor: '#b87b00' }}>
          <Stack gap="xs">
            <Text size="sm" fw={600} c="orange.8">Currently Assigned To:</Text>
            <Text size="lg" fw={700}>{currentPatientName}</Text>
            <Group gap="xs">
              <Badge color="orange">MRN: {currentPatientMrn}</Badge>
              <Badge color="gray">Bag: {bagId}</Badge>
            </Group>
          </Stack>
        </Card>

        <Card withBorder padding="md" style={{ backgroundColor: '#e6f4f4', borderColor: '#007a7a' }}>
          <Stack gap="xs">
            <Text size="sm" fw={600} style={{ color: '#007a7a' }}>Reassign To:</Text>
            <Badge size="lg" style={{ backgroundColor: '#007a7a', color: 'white' }}>
              MRN: {newPatientMrn}
            </Badge>
          </Stack>
        </Card>

        <Text size="sm" c="dimmed" ta="center">
          Do you want to reassign this positioner to the new patient?
        </Text>

        <Group justify="space-between" mt="md">
          <Button variant="outline" color="gray" onClick={onClose}>
            Cancel - Keep Current
          </Button>
          <Button 
            onClick={onConfirm}
            style={{ backgroundColor: '#b87b00', color: 'white' }}
          >
            Confirm Reassignment
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
