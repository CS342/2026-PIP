import {
  Stack,
  Text,
  Button,
  Alert,
  Card,
  Group,
  Badge,
  TextInput,
  Stepper,
  Progress,
  Divider,
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import {
  IconUser,
  IconQrcode,
  IconCheck,
  IconCamera,
  IconPlayerStop,
  IconAlertTriangle,
  IconRefresh,
  IconPackage,
} from '@tabler/icons-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useState, useRef, useEffect } from 'react';
import type { JSX } from 'react';
import { MedplumClient } from '@medplum/core';
import type { Patient, Device, DeviceUseStatement } from '@medplum/fhirtypes';
import { ReassignmentModal } from './ReassignmentModal';
import styles from './Scanner.module.css';

// Medplum Configuration
const MEDPLUM_BASE_URL = 'https://api.medplum.com';
const MEDPLUM_CLIENT_ID = 'da02ae93-04f4-48a3-a32e-3e5a96fb5bd0';
const MEDPLUM_CLIENT_SECRET = '419ead2a73c4a53f5e6829168042db73c3dd8a1ecc6ed37640b1dc6ac1896bd6';

type ScanStep = 'patient' | 'positioner' | 'processing' | 'success';

interface ScanHistoryItem {
  type: 'patient' | 'bag' | 'complete';
  value: string;
  time: string;
}

interface ReassignmentInfo {
  bagId: string;
  currentPatientName: string;
  currentPatientMrn: string;
  newPatientMrn: string;
  existingAssignment: DeviceUseStatement;
}

export function Scanner(): JSX.Element {
  const [step, setStep] = useState<ScanStep>('patient');
  const [patientMrn, setPatientMrn] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [bagId, setBagId] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isFirstUse, setIsFirstUse] = useState(false);
  
  // Reassignment modal state
  const [reassignmentInfo, setReassignmentInfo] = useState<ReassignmentInfo | null>(null);
  const [reassignmentModalOpen, setReassignmentModalOpen] = useState(false);
  
  const qrCodeScannerRef = useRef<Html5Qrcode | null>(null);
  const medplumRef = useRef<MedplumClient | null>(null);
  const lastScanTime = useRef(0);
  const lastScannedCode = useRef('');
  const SCAN_COOLDOWN = 2000;

  // Initialize Medplum client
  useEffect(() => {
    const initMedplum = async () => {
      try {
        const client = new MedplumClient({
          baseUrl: MEDPLUM_BASE_URL,
        });
        await client.startClientLogin(MEDPLUM_CLIENT_ID, MEDPLUM_CLIENT_SECRET);
        medplumRef.current = client;
        console.log('Medplum authenticated');
      } catch (err) {
        console.error('Failed to authenticate with Medplum:', err);
        setError('Failed to connect to Medplum. Please check credentials.');
      }
    };
    initMedplum();
  }, []);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (qrCodeScannerRef.current) {
        qrCodeScannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const addToHistory = (type: ScanHistoryItem['type'], value: string) => {
    setScanHistory((prev) => [
      { type, value, time: new Date().toLocaleTimeString() },
      ...prev,
    ]);
  };

  const getPatientName = (p: Patient): string => {
    if (p.name && p.name.length > 0) {
      const name = p.name[0];
      const given = name.given?.join(' ') || '';
      const family = name.family || '';
      return `${given} ${family}`.trim() || `Patient ${p.id?.substring(0, 8)}`;
    }
    return `Patient ${p.id?.substring(0, 8)}`;
  };

  const startCameraScan = async (): Promise<void> => {
    const containerId = step === 'patient' ? 'patient-scanner' : 'positioner-scanner';
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
          processScannedCode(decodedText);
        },
        () => {}
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Camera access failed';
      setError(errorMessage + '. Please enter manually.');
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

  const processScannedCode = async (code: string): Promise<void> => {
    // Prevent duplicate scans
    const now = Date.now();
    if (code === lastScannedCode.current && now - lastScanTime.current < SCAN_COOLDOWN) {
      return;
    }
    lastScannedCode.current = code;
    lastScanTime.current = now;

    stopCamera();
    setError(null);
    setLoading(true);

    try {
      if (!medplumRef.current) {
        throw new Error('Not connected to Medplum');
      }
      const medplum = medplumRef.current;

      if (step === 'patient') {
        // Step 1: Scan patient MRN
        const patients = await medplum.searchResources('Patient', {
          identifier: code,
        });

        if (patients.length === 0) {
          // Try searching by ID
          try {
            const patientById = await medplum.readResource('Patient', code);
            setPatient(patientById);
            setPatientMrn(code);
            addToHistory('patient', code);
            setStep('positioner');
            showNotification({
              color: 'blue',
              message: `Patient found: ${getPatientName(patientById)}`,
            });
          } catch {
            throw new Error(`Patient with MRN "${code}" not found`);
          }
        } else {
          const foundPatient = patients[0];
          setPatient(foundPatient);
          setPatientMrn(code);
          addToHistory('patient', code);
          setStep('positioner');
          showNotification({
            color: 'blue',
            message: `Patient found: ${getPatientName(foundPatient)}`,
          });
        }
      } else if (step === 'positioner') {
        // Step 2: Scan positioner barcode
        setBagId(code);
        addToHistory('bag', code);
        await processPositionerScan(code);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Scan failed';
      setError(errorMessage);
      showNotification({ color: 'red', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const processPositionerScan = async (barcode: string): Promise<void> => {
    if (!medplumRef.current || !patient) return;
    const medplum = medplumRef.current;

    // Find the device
    const devices = await medplum.searchResources('Device', {
      identifier: barcode,
    });

    let device: Device;
    if (devices.length === 0) {
      throw new Error(`Positioner ${barcode} not found in system`);
    }
    device = devices[0];

    // Check for active assignment
    const existingAssignments = await medplum.searchResources('DeviceUseStatement', {
      device: `Device/${device.id}`,
      status: 'active',
    });

    if (existingAssignments.length > 0) {
      const existingAssignment = existingAssignments[0];
      const currentPatientRef = existingAssignment.subject?.reference;

      if (currentPatientRef) {
        const currentPatientId = currentPatientRef.split('/').pop();
        
        // Check if it's the same patient
        if (currentPatientId !== patient.id) {
          // Different patient - show reassignment warning
          try {
            const currentPatient = await medplum.readResource('Patient', currentPatientId!);
            const currentPatientName = getPatientName(currentPatient);
            const currentPatientMrn = currentPatient.identifier?.[0]?.value || 'N/A';

            setReassignmentInfo({
              bagId: barcode,
              currentPatientName,
              currentPatientMrn,
              newPatientMrn: patientMrn || 'N/A',
              existingAssignment,
            });
            setReassignmentModalOpen(true);
            return;
          } catch {
            // If we can't get the patient details, proceed anyway
          }
        }
      }
    }

    // No conflict or same patient - proceed with assignment
    await performAssignment(device, barcode);
  };

  const performAssignment = async (device: Device, barcode: string): Promise<void> => {
    if (!medplumRef.current || !patient) return;
    const medplum = medplumRef.current;

    setStep('processing');
    setLoading(true);

    try {
      // Check if this is first use (look for opened date in notes)
      let openedDate: string | null = null;
      let firstUse = true;

      if (device.note && device.note.length > 0) {
        const noteText = device.note[0].text || '';
        const match = noteText.match(/Package opened: (\d{4}-\d{2}-\d{2}T[\d:.]+Z)/);
        if (match) {
          firstUse = false;
          openedDate = match[1];
        }
      }

      // If first use, set the opened date
      if (firstUse) {
        openedDate = new Date().toISOString();
        const updatedDevice: Device = {
          ...device,
          note: [{ text: `Package opened: ${openedDate}` }],
        };
        await medplum.updateResource(updatedDevice);
      }

      // Create new DeviceUseStatement
      const deviceUseStatement: DeviceUseStatement = {
        resourceType: 'DeviceUseStatement',
        status: 'active',
        subject: {
          reference: `Patient/${patient.id}`,
          display: getPatientName(patient),
        },
        device: {
          reference: `Device/${device.id}`,
          display: barcode,
        },
        recordedOn: new Date().toISOString(),
        timingPeriod: {
          start: new Date().toISOString(),
        },
      };

      await medplum.createResource(deviceUseStatement);

      // Calculate days remaining
      if (openedDate) {
        const opened = new Date(openedDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - opened.getTime());
        const daysSinceOpened = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysRemaining(90 - daysSinceOpened);
      }

      setIsFirstUse(firstUse);
      addToHistory('complete', `${barcode} → ${getPatientName(patient)}`);
      setStep('success');

      showNotification({
        color: 'green',
        message: `Positioner ${barcode} assigned to ${getPatientName(patient)}`,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign positioner';
      setError(errorMessage);
      setStep('positioner');
    } finally {
      setLoading(false);
    }
  };

  const handleReassignmentConfirm = async (): Promise<void> => {
    if (!reassignmentInfo || !medplumRef.current) return;
    const medplum = medplumRef.current;

    setReassignmentModalOpen(false);
    setLoading(true);

    try {
      // Close existing assignment
      const updatedAssignment: DeviceUseStatement = {
        ...reassignmentInfo.existingAssignment,
        status: 'completed',
        timingPeriod: {
          ...reassignmentInfo.existingAssignment.timingPeriod,
          end: new Date().toISOString(),
        },
      };
      await medplum.updateResource(updatedAssignment);

      // Find device and proceed
      const devices = await medplum.searchResources('Device', {
        identifier: reassignmentInfo.bagId,
      });
      if (devices.length > 0) {
        await performAssignment(devices[0], reassignmentInfo.bagId);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reassign';
      setError(errorMessage);
    } finally {
      setReassignmentInfo(null);
      setLoading(false);
    }
  };

  const handleReassignmentCancel = (): void => {
    setReassignmentModalOpen(false);
    setReassignmentInfo(null);
    showNotification({
      color: 'orange',
      message: 'Reassignment cancelled',
    });
  };

  const handleManualSubmit = (): void => {
    if (manualInput.trim()) {
      processScannedCode(manualInput.trim());
      setManualInput('');
    }
  };

  const handleReset = (): void => {
    stopCamera();
    setStep('patient');
    setPatient(null);
    setPatientMrn(null);
    setBagId(null);
    setManualInput('');
    setError(null);
    setScanHistory([]);
    setDaysRemaining(null);
    setIsFirstUse(false);
    lastScannedCode.current = '';
    lastScanTime.current = 0;
  };

  const getStepperActive = (): number => {
    if (step === 'patient') return 0;
    if (step === 'positioner') return 1;
    return 2;
  };

  // Success view
  if (step === 'success' && patient) {
    return (
      <Stack gap="lg">
        <div className={styles.successIcon}>
          <IconCheck size={48} color="white" />
        </div>
        
        <Text size="xl" fw={700} ta="center">
          Assignment Complete!
        </Text>

        <Card withBorder padding="md">
          <Stack gap="sm" align="center">
            <Badge size="lg" style={{ backgroundColor: '#007a7a', color: 'white' }}>
              {bagId}
            </Badge>
            <Text size="lg">→</Text>
            <Text fw={600}>{getPatientName(patient)}</Text>
          </Stack>
        </Card>

        {isFirstUse && (
          <Alert color="green" icon={<IconPackage size={16} />}>
            <Text fw={600}>🎉 Package opened! 90 days remaining.</Text>
          </Alert>
        )}

        {!isFirstUse && daysRemaining !== null && (
          <div>
            <Group justify="space-between" mb={4}>
              <Text size="sm" fw={500}>Days Until Expiration</Text>
              <Text
                size="sm"
                fw={600}
                style={{ color: daysRemaining < 7 ? '#c43d3d' : daysRemaining < 30 ? '#b87b00' : '#007a7a' }}
              >
                {daysRemaining > 0 ? `${daysRemaining} days` : 'EXPIRED'}
              </Text>
            </Group>
            <Progress
              value={daysRemaining > 0 ? (daysRemaining / 90) * 100 : 0}
              color={daysRemaining < 7 ? 'red' : daysRemaining < 30 ? 'orange' : '#007a7a'}
              size="sm"
            />
          </div>
        )}

        <Button
          fullWidth
          leftSection={<IconRefresh size={18} />}
          onClick={handleReset}
          style={{ backgroundColor: '#007a7a', color: 'white' }}
        >
          Scan Another
        </Button>
      </Stack>
    );
  }

  // Processing view
  if (step === 'processing') {
    return (
      <Stack gap="lg" align="center" py="xl">
        <div className={styles.spinner} />
        <Text>Assigning positioner to patient...</Text>
      </Stack>
    );
  }

  // Main scanning view
  return (
    <Stack gap="lg">
      <Stepper active={getStepperActive()} size="sm" color="#007a7a">
        <Stepper.Step label="Patient" icon={<IconUser size={18} />} />
        <Stepper.Step label="Positioner" icon={<IconQrcode size={18} />} />
        <Stepper.Step label="Complete" icon={<IconCheck size={18} />} />
      </Stepper>

      {step === 'patient' && (
        <Stack gap="md">
          <Alert 
            color="blue" 
            title="Step 1: Scan Patient"
            styles={{ root: { backgroundColor: '#e6f4f4', borderColor: '#007a7a' }, title: { color: '#007a7a' } }}
          >
            Scan the patient's bracelet QR code or enter their MRN
          </Alert>

          <div
            id="patient-scanner"
            className={styles.scannerContainer}
          />

          {!scanning ? (
            <Button
              fullWidth
              style={{ backgroundColor: '#007a7a', color: 'white' }}
              leftSection={<IconCamera size={18} />}
              onClick={startCameraScan}
            >
              Start Camera
            </Button>
          ) : (
            <Button
              fullWidth
              variant="outline"
              color="red"
              leftSection={<IconPlayerStop size={18} />}
              onClick={stopCamera}
            >
              Stop Camera
            </Button>
          )}

          <Divider label="or enter manually" labelPosition="center" />

          <Group gap="sm">
            <TextInput
              placeholder="Patient MRN..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              style={{ flex: 1 }}
            />
            <Button
              style={{ backgroundColor: '#007a7a', color: 'white' }}
              onClick={handleManualSubmit}
              loading={loading}
              disabled={!manualInput.trim()}
            >
              Find Patient
            </Button>
          </Group>
        </Stack>
      )}

      {step === 'positioner' && patient && (
        <Stack gap="md">
          <Card withBorder padding="sm" bg="#e6f4f4">
            <Group gap="sm">
              <IconUser size={20} color="#007a7a" />
              <Text fw={600}>{getPatientName(patient)}</Text>
              <Badge size="sm" color="gray">{patientMrn}</Badge>
              <Button size="xs" variant="subtle" onClick={() => setStep('patient')}>
                Change
              </Button>
            </Group>
          </Card>

          <Alert 
            title="Step 2: Scan Positioner"
            styles={{ root: { backgroundColor: '#e6f4f4', borderColor: '#007a7a' }, title: { color: '#007a7a' } }}
          >
            Now scan the positioner barcode
          </Alert>

          <div
            id="positioner-scanner"
            className={styles.scannerContainer}
          />

          {!scanning ? (
            <Button
              fullWidth
              style={{ backgroundColor: '#007a7a', color: 'white' }}
              leftSection={<IconCamera size={18} />}
              onClick={startCameraScan}
            >
              Start Camera
            </Button>
          ) : (
            <Button
              fullWidth
              variant="outline"
              color="red"
              leftSection={<IconPlayerStop size={18} />}
              onClick={stopCamera}
            >
              Stop Camera
            </Button>
          )}

          <Divider label="or enter manually" labelPosition="center" />

          <Group gap="sm">
            <TextInput
              placeholder="Positioner barcode..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              style={{ flex: 1 }}
            />
            <Button
              style={{ backgroundColor: '#007a7a', color: 'white' }}
              onClick={handleManualSubmit}
              loading={loading}
              disabled={!manualInput.trim()}
            >
              Assign
            </Button>
          </Group>
        </Stack>
      )}

      {error && (
        <Alert icon={<IconAlertTriangle size={16} />} color="red" title="Error">
          {error}
        </Alert>
      )}

      {scanHistory.length > 0 && (
        <Stack gap="xs">
          <Text size="sm" fw={600} c="dimmed">Recent Scans</Text>
          {scanHistory.slice(0, 5).map((item, index) => (
            <Card key={index} withBorder padding="xs" className={styles.historyItem}>
              <Group justify="space-between">
                <Group gap="xs">
                  {item.type === 'patient' && <IconUser size={14} color="#007a7a" />}
                  {item.type === 'bag' && <IconPackage size={14} color="#b87b00" />}
                  {item.type === 'complete' && <IconCheck size={14} color="#00856a" />}
                  <Text size="sm">{item.value}</Text>
                </Group>
                <Text size="xs" c="dimmed">{item.time}</Text>
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      <Button variant="subtle" onClick={handleReset} leftSection={<IconRefresh size={16} />}>
        Reset / Start Over
      </Button>

      <ReassignmentModal
        opened={reassignmentModalOpen}
        onClose={handleReassignmentCancel}
        onConfirm={handleReassignmentConfirm}
        bagId={reassignmentInfo?.bagId || ''}
        currentPatientName={reassignmentInfo?.currentPatientName || ''}
        currentPatientMrn={reassignmentInfo?.currentPatientMrn || ''}
        newPatientMrn={reassignmentInfo?.newPatientMrn || ''}
      />
    </Stack>
  );
}
