// Fleet Scanner Modal - Two-step workflow: Scan patient, then positioner
import { useState, useRef, useEffect } from 'react';
import type { JSX } from 'react';
import type { Patient } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import { showNotification } from '@mantine/notifications';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Modal,
  Stack,
  Text,
  Button,
  Alert,
  Card,
  Badge,
  Group,
  TextInput,
  Stepper,
} from '@mantine/core';
import { IconAlertCircle, IconAlertTriangle, IconUser, IconQrcode, IconCheck, IconCamera, IconPlayerStop } from '@tabler/icons-react';
import { getReferenceString } from '@medplum/core';
import {
  findPositionerByBarcode,
  createPositioner,
  isPositionerExpired,
  assignPositionerToPatient,
  deviceToPositioner,
} from '../utils/positioner';

interface FleetScannerModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ScanStep = 'patient' | 'positioner' | 'confirm-reassign' | 'processing' | 'success';

interface ReassignmentInfo {
  currentPatientRef: string;
  currentPatientDisplay: string;
  barcode: string;
}

export function FleetScannerModal({ opened, onClose, onSuccess }: FleetScannerModalProps): JSX.Element {
  const medplum = useMedplum();
  const [step, setStep] = useState<ScanStep>('patient');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientInput, setPatientInput] = useState('');
  const [positionerInput, setPositionerInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reassignmentInfo, setReassignmentInfo] = useState<ReassignmentInfo | null>(null);
  const [scanning, setScanning] = useState(false);
  const qrCodeScannerRef = useRef<Html5Qrcode | null>(null);

  // Cleanup scanner on close
  useEffect(() => {
    if (!opened && qrCodeScannerRef.current) {
      qrCodeScannerRef.current.stop().catch(() => {});
      qrCodeScannerRef.current = null;
      setScanning(false);
    }
  }, [opened]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (qrCodeScannerRef.current) {
        qrCodeScannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const getPatientName = (p: Patient): string => {
    if (p.name && p.name.length > 0) {
      const name = p.name[0];
      const given = name.given?.join(' ') || '';
      const family = name.family || '';
      return `${given} ${family}`.trim() || `Patient ${p.id?.substring(0, 8)}`;
    }
    return `Patient ${p.id?.substring(0, 8)}`;
  };

  const startCameraScan = async (containerId: string, onScan: (code: string) => void): Promise<void> => {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      setError(null);
      setScanning(true);
      const scanner = new Html5Qrcode(containerId);
      qrCodeScannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
          scanner.stop().then(() => {
            setScanning(false);
            qrCodeScannerRef.current = null;
          }).catch(() => {
            setScanning(false);
          });
        },
        () => {}
      );
    } catch (err: any) {
      setError('Camera access failed. Please enter manually.');
      setScanning(false);
    }
  };

  const stopCamera = (): void => {
    if (qrCodeScannerRef.current) {
      qrCodeScannerRef.current.stop().catch(() => {});
      qrCodeScannerRef.current = null;
      setScanning(false);
    }
  };

  const handlePatientScan = async (identifier: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Search for patient by identifier (MRN)
      const patients = await medplum.searchResources('Patient', {
        identifier: identifier,
      });

      if (patients.length === 0) {
        // Try searching by ID
        try {
          const patientById = await medplum.readResource('Patient', identifier);
          setPatient(patientById);
          setPatientInput(identifier);
          setStep('positioner');
          stopCamera();
        } catch {
          setError(`Patient with ID/MRN "${identifier}" not found`);
        }
      } else {
        setPatient(patients[0]);
        setPatientInput(identifier);
        setStep('positioner');
        stopCamera();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to find patient');
    } finally {
      setLoading(false);
    }
  };

  const handlePositionerScan = async (barcode: string): Promise<void> => {
    if (!patient) return;

    setLoading(true);
    setError(null);
    setPositionerInput(barcode);
    stopCamera();

    try {
      // Find existing positioner
      let device = await findPositionerByBarcode(medplum, barcode);

      if (device) {
        // Check if expired
        if (isPositionerExpired(device)) {
          setError('Positioner expired — discard and replace');
          setLoading(false);
          return;
        }

        // Check if assigned to another patient
        const positioner = deviceToPositioner(device);
        if (positioner.currentPatient) {
          const currentPatientRef = positioner.currentPatient.reference || '';
          const newPatientRef = getReferenceString(patient);

          if (currentPatientRef !== newPatientRef) {
            setReassignmentInfo({
              currentPatientRef,
              currentPatientDisplay: positioner.currentPatient.display || currentPatientRef,
              barcode,
            });
            setStep('confirm-reassign');
            setLoading(false);
            return;
          }
        }
      } else {
        // Create new positioner
        device = await createPositioner(medplum, barcode);
      }

      // Proceed with assignment
      await performAssignment(device, barcode);
    } catch (err: any) {
      setError(err.message || 'Failed to process positioner');
      setLoading(false);
    }
  };

  const performAssignment = async (device: any, barcode: string): Promise<void> => {
    if (!patient) return;

    setStep('processing');
    setLoading(true);

    try {
      await assignPositionerToPatient(medplum, device, patient, 0);

      setStep('success');
      showNotification({
        color: 'green',
        message: `Positioner ${barcode} assigned to ${getPatientName(patient)}`,
      });

      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to assign positioner');
      setStep('positioner');
      setLoading(false);
    }
  };

  const handleConfirmReassign = async (): Promise<void> => {
    if (!reassignmentInfo || !patient) return;

    setLoading(true);
    setError(null);

    try {
      let device = await findPositionerByBarcode(medplum, reassignmentInfo.barcode);
      if (!device) throw new Error('Positioner not found');
      await performAssignment(device, reassignmentInfo.barcode);
    } catch (err: any) {
      setError(err.message || 'Failed to reassign');
      setLoading(false);
    }
  };

  const handleClose = (): void => {
    stopCamera();
    setStep('patient');
    setPatient(null);
    setPatientInput('');
    setPositionerInput('');
    setError(null);
    setReassignmentInfo(null);
    setLoading(false);
    onClose();
  };

  const getStepperActive = (): number => {
    if (step === 'patient') return 0;
    if (step === 'positioner' || step === 'confirm-reassign') return 1;
    return 2;
  };

  // Reassignment confirmation
  if (step === 'confirm-reassign' && reassignmentInfo && patient) {
    return (
      <Modal opened={opened} onClose={handleClose} title="Reassignment Warning" size="md" centered>
        <Stack gap="md">
          <Alert icon={<IconAlertTriangle size={24} />} color="orange" title="Positioner Already Assigned">
            This positioner is currently assigned to another patient.
          </Alert>

          <Card withBorder padding="md" bg="orange.0">
            <Stack gap="xs">
              <Text size="sm" fw={600} c="orange.8">Currently Assigned To:</Text>
              <Text size="lg" fw={700}>{reassignmentInfo.currentPatientDisplay}</Text>
              <Badge color="orange">Positioner: {reassignmentInfo.barcode}</Badge>
            </Stack>
          </Card>

          <Card withBorder padding="md" bg="green.0">
            <Stack gap="xs">
              <Text size="sm" fw={600} c="green.8">Reassign To:</Text>
              <Text size="lg" fw={700}>{getPatientName(patient)}</Text>
            </Stack>
          </Card>

          {error && <Alert color="red" icon={<IconAlertCircle size={16} />}>{error}</Alert>}

          <Group justify="space-between" mt="md">
            <Button variant="outline" color="gray" onClick={() => setStep('positioner')}>
              Cancel
            </Button>
            <Button color="orange" onClick={handleConfirmReassign} loading={loading}>
              Confirm Reassignment
            </Button>
          </Group>
        </Stack>
      </Modal>
    );
  }

  // Success view
  if (step === 'success' && patient) {
    return (
      <Modal opened={opened} onClose={handleClose} title="Success" size="md" centered>
        <Stack gap="md" align="center" py="xl">
          <div style={{ 
            width: 64, 
            height: 64, 
            borderRadius: '50%', 
            backgroundColor: '#007a7a', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <IconCheck size={36} color="white" />
          </div>
          <Text size="xl" fw={700}>Assignment Complete!</Text>
          <Card withBorder padding="md" w="100%">
            <Stack gap="xs" align="center">
              <Badge color="teal" size="lg">{positionerInput}</Badge>
              <Text size="lg">→</Text>
              <Text fw={600}>{getPatientName(patient)}</Text>
            </Stack>
          </Card>
        </Stack>
      </Modal>
    );
  }

  // Processing view
  if (step === 'processing') {
    return (
      <Modal opened={opened} onClose={() => {}} title="Processing" size="md" centered withCloseButton={false}>
        <Stack gap="md" align="center" py="xl">
          <div style={{ 
            width: 40, height: 40, 
            border: '3px solid #e0e0e0', 
            borderTopColor: '#007a7a',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <Text>Assigning positioner to patient...</Text>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </Stack>
      </Modal>
    );
  }

  // Main workflow view
  return (
    <Modal opened={opened} onClose={handleClose} title="Scan Positioner" size="lg" centered>
      <Stack gap="lg">
        <Stepper active={getStepperActive()} size="sm">
          <Stepper.Step label="Patient" icon={<IconUser size={18} />} />
          <Stepper.Step label="Positioner" icon={<IconQrcode size={18} />} />
          <Stepper.Step label="Complete" icon={<IconCheck size={18} />} />
        </Stepper>

        {step === 'patient' && (
          <Stack gap="md">
            <Alert color="blue" title="Step 1: Scan Patient">
              Scan the patient's bracelet or enter their MRN/ID
            </Alert>

            <div
              id="patient-scanner"
              style={{ width: '100%', minHeight: '250px', borderRadius: 8, overflow: 'hidden', border: '2px solid #007a7a' }}
            />

            {!scanning ? (
              <Button
                fullWidth
                color="teal"
                leftSection={<IconCamera size={18} />}
                onClick={() => startCameraScan('patient-scanner', handlePatientScan)}
              >
                Start Camera
              </Button>
            ) : (
              <Button fullWidth variant="outline" color="red" leftSection={<IconPlayerStop size={18} />} onClick={stopCamera}>
                Stop Camera
              </Button>
            )}

            <Text ta="center" size="sm" c="dimmed">— or enter manually —</Text>

            <Group gap="sm">
              <TextInput
                placeholder="Patient MRN or ID..."
                value={patientInput}
                onChange={(e) => setPatientInput(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button
                color="teal"
                onClick={() => handlePatientScan(patientInput)}
                loading={loading}
                disabled={!patientInput.trim()}
              >
                Find Patient
              </Button>
            </Group>
          </Stack>
        )}

        {step === 'positioner' && patient && (
          <Stack gap="md">
            <Card withBorder padding="sm" bg="green.0">
              <Group gap="sm">
                <IconUser size={20} />
                <Text fw={600}>{getPatientName(patient)}</Text>
                <Button size="xs" variant="subtle" onClick={() => setStep('patient')}>
                  Change
                </Button>
              </Group>
            </Card>

            <Alert color="teal" title="Step 2: Scan Positioner">
              Now scan the positioner barcode
            </Alert>

            <div
              id="positioner-scanner"
              style={{ width: '100%', minHeight: '250px', borderRadius: 8, overflow: 'hidden', border: '2px solid #007a7a' }}
            />

            {!scanning ? (
              <Button
                fullWidth
                color="teal"
                leftSection={<IconCamera size={18} />}
                onClick={() => startCameraScan('positioner-scanner', handlePositionerScan)}
              >
                Start Camera
              </Button>
            ) : (
              <Button fullWidth variant="outline" color="red" leftSection={<IconPlayerStop size={18} />} onClick={stopCamera}>
                Stop Camera
              </Button>
            )}

            <Text ta="center" size="sm" c="dimmed">— or enter manually —</Text>

            <Group gap="sm">
              <TextInput
                placeholder="Positioner barcode..."
                value={positionerInput}
                onChange={(e) => setPositionerInput(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button
                color="teal"
                onClick={() => handlePositionerScan(positionerInput)}
                loading={loading}
                disabled={!positionerInput.trim()}
              >
                Assign
              </Button>
            </Group>
          </Stack>
        )}

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
            {error}
          </Alert>
        )}

        <Group justify="flex-end">
          <Button variant="subtle" onClick={handleClose}>
            Cancel
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
