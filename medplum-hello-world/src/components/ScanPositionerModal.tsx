// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import {
  Button,
  Group,
  Modal,
  Stack,
  Tabs,
  Text,
  TextInput,
  FileButton,
  Alert,
  Image,
  Card,
  Badge,
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconAlertCircle, IconCamera, IconUpload, IconKeyboard, IconAlertTriangle, IconCheck, IconPlayerStop, IconFolder } from '@tabler/icons-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useState, useRef, useEffect } from 'react';
import type { JSX } from 'react';
import type { Patient } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import { getReferenceString } from '@medplum/core';
import {
  findPositionerByBarcode,
  createPositioner,
  isPositionerExpired,
  assignPositionerToPatient,
  deviceToPositioner,
} from '../utils/positioner';

interface ScanPositionerModalProps {
  opened: boolean;
  onClose: () => void;
  patient: Patient;
  onSuccess?: () => void;
}

type InputMethod = 'camera' | 'upload' | 'manual';
type ScanStep = 'scan' | 'confirm-reassign' | 'processing' | 'success';

interface ReassignmentInfo {
  currentPatientRef: string;
  currentPatientDisplay: string;
  barcode: string;
}

export function ScanPositionerModal({ opened, onClose, patient, onSuccess }: ScanPositionerModalProps): JSX.Element {
  const medplum = useMedplum();
  const [activeTab, setActiveTab] = useState<InputMethod>('camera');
  const [barcode, setBarcode] = useState<string>('');
  const [manualBarcode, setManualBarcode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [step, setStep] = useState<ScanStep>('scan');
  const [reassignmentInfo, setReassignmentInfo] = useState<ReassignmentInfo | null>(null);
  const qrCodeScannerRef = useRef<Html5Qrcode | null>(null);
  const cameraContainerRef = useRef<HTMLDivElement>(null);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (qrCodeScannerRef.current) {
        qrCodeScannerRef.current
          .stop()
          .then(() => {
            qrCodeScannerRef.current = null;
          })
          .catch(() => {
            // Ignore errors during cleanup
          });
      }
    };
  }, []);

  // Stop scanner when modal closes
  useEffect(() => {
    if (!opened && qrCodeScannerRef.current) {
      qrCodeScannerRef.current
        .stop()
        .then(() => {
          setScanning(false);
        })
        .catch(() => {
          setScanning(false);
        });
    }
  }, [opened]);

  const getPatientName = (): string => {
    if (patient.name && patient.name.length > 0) {
      const name = patient.name[0];
      const given = name.given?.join(' ') || '';
      const family = name.family || '';
      return `${given} ${family}`.trim() || `Patient ${patient.id?.substring(0, 8)}`;
    }
    return `Patient ${patient.id?.substring(0, 8)}`;
  };

  const startCameraScan = async (): Promise<void> => {
    if (!cameraContainerRef.current) return;

    try {
      setError(null);
      setScanning(true);
      const scanner = new Html5Qrcode('camera-container');
      qrCodeScannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          setBarcode(decodedText);
          scanner
            .stop()
            .then(() => {
              setScanning(false);
              qrCodeScannerRef.current = null;
            })
            .catch(() => {
              setScanning(false);
              qrCodeScannerRef.current = null;
            });
        },
        () => {
          // Ignore scanning errors, just keep trying
        }
      );
    } catch (err: any) {
      setError(err.message || 'Failed to access camera. Please check permissions or use upload/manual entry.');
      setScanning(false);
      if (qrCodeScannerRef.current) {
        qrCodeScannerRef.current.stop().catch(() => {});
        qrCodeScannerRef.current = null;
      }
    }
  };

  const handleFileUpload = async (file: File | null): Promise<void> => {
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Try to decode barcode from image
      const tempContainerId = 'temp-upload-scanner-' + Date.now();
      const tempContainer = document.createElement('div');
      tempContainer.id = tempContainerId;
      tempContainer.style.display = 'none';
      document.body.appendChild(tempContainer);

      try {
        const scanner = new Html5Qrcode(tempContainerId);
        const decodedText = await scanner.scanFile(file, true);
        setBarcode(decodedText);
        setImagePreview(null);
      } catch (scanError: any) {
        setError('Could not detect barcode in image. Please try again or use manual entry.');
        console.error('Barcode scan error:', scanError);
      } finally {
        // Clean up temp container
        if (tempContainer && tempContainer.parentNode) {
          tempContainer.parentNode.removeChild(tempContainer);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkAndActivate = async (): Promise<void> => {
    const barcodeValue = activeTab === 'manual' ? manualBarcode : barcode;
    if (!barcodeValue.trim()) {
      setError('Please enter or scan a barcode');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Find existing positioner
      let device = await findPositionerByBarcode(medplum, barcodeValue);

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

          // If assigned to a DIFFERENT patient, show warning
          if (currentPatientRef !== newPatientRef) {
            setReassignmentInfo({
              currentPatientRef,
              currentPatientDisplay: positioner.currentPatient.display || currentPatientRef,
              barcode: barcodeValue,
            });
            setStep('confirm-reassign');
            setLoading(false);
            return;
          }
          // Same patient - just update
        }
      } else {
        // Create new positioner
        device = await createPositioner(medplum, barcodeValue);
      }

      // Proceed with assignment
      await performAssignment(device, barcodeValue);
    } catch (err: any) {
      setError(err.message || 'Failed to check positioner status');
      console.error('Error checking positioner:', err);
      setLoading(false);
    }
  };

  const performAssignment = async (device: any, barcodeValue: string): Promise<void> => {
    setStep('processing');
    setLoading(true);

    try {
      await assignPositionerToPatient(medplum, device, patient, 0);

      setStep('success');
      showNotification({
        color: 'green',
        message: `Positioner ${barcodeValue} assigned to ${getPatientName()}`,
      });

      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to assign positioner');
      setStep('scan');
      setLoading(false);
    }
  };

  const handleConfirmReassign = async (): Promise<void> => {
    if (!reassignmentInfo) return;

    setLoading(true);
    setError(null);

    try {
      let device = await findPositionerByBarcode(medplum, reassignmentInfo.barcode);
      if (!device) {
        throw new Error('Positioner not found');
      }

      await performAssignment(device, reassignmentInfo.barcode);
    } catch (err: any) {
      setError(err.message || 'Failed to reassign positioner');
      setLoading(false);
    }
  };

  const handleCancelReassign = (): void => {
    setReassignmentInfo(null);
    setStep('scan');
  };

  const handleClose = (): void => {
    setBarcode('');
    setManualBarcode('');
    setError(null);
    setImagePreview(null);
    setActiveTab('camera');
    setStep('scan');
    setReassignmentInfo(null);
    if (qrCodeScannerRef.current) {
      qrCodeScannerRef.current.stop().catch(() => {});
      qrCodeScannerRef.current = null;
    }
    setScanning(false);
    setLoading(false);
    onClose();
  };

  // Reassignment confirmation view
  if (step === 'confirm-reassign' && reassignmentInfo) {
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
              <Text size="lg" fw={700}>{getPatientName()}</Text>
            </Stack>
          </Card>

          <Text size="sm" c="dimmed" ta="center">
            Do you want to reassign this positioner to {getPatientName()}?
          </Text>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
              {error}
            </Alert>
          )}

          <Group justify="space-between" mt="md">
            <Button variant="outline" color="gray" onClick={handleCancelReassign}>
              Cancel - Keep Current
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
  if (step === 'success') {
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
          <Text size="lg" fw={600}>Positioner Assigned!</Text>
          <Text c="dimmed">{barcode || manualBarcode} → {getPatientName()}</Text>
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
          <Text>Assigning positioner...</Text>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </Stack>
      </Modal>
    );
  }

  // Main scan view
  return (
    <Modal opened={opened} onClose={handleClose} title="Scan Positioner" size="lg" centered>
      <Stack gap="md">
        <Card withBorder padding="sm" bg="gray.0">
          <Group gap="sm">
            <Text size="sm" c="dimmed">Assigning to:</Text>
            <Text size="sm" fw={600}>{getPatientName()}</Text>
          </Group>
        </Card>

        <Tabs value={activeTab} onChange={(value) => setActiveTab(value as InputMethod)}>
          <Tabs.List>
            <Tabs.Tab value="camera" leftSection={<IconCamera size={16} />}>
              Camera
            </Tabs.Tab>
            <Tabs.Tab value="upload" leftSection={<IconUpload size={16} />}>
              Upload
            </Tabs.Tab>
            <Tabs.Tab value="manual" leftSection={<IconKeyboard size={16} />}>
              Manual
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="camera" pt="md">
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Scan the positioner barcode with your camera
              </Text>
              <div
                id="camera-container"
                ref={cameraContainerRef}
                style={{ width: '100%', minHeight: '280px', position: 'relative', borderRadius: 8, overflow: 'hidden' }}
              />
              {!scanning && !barcode && (
                <Button onClick={startCameraScan} fullWidth color="teal" leftSection={<IconCamera size={18} />}>
                  Start Camera
                </Button>
              )}
              {scanning && (
                <Button
                  onClick={() => {
                    if (qrCodeScannerRef.current) {
                      qrCodeScannerRef.current.stop().catch(() => {});
                      qrCodeScannerRef.current = null;
                      setScanning(false);
                    }
                  }}
                  fullWidth
                  variant="outline"
                  color="red"
                  leftSection={<IconPlayerStop size={18} />}
                >
                  Stop Camera
                </Button>
              )}
              {barcode && (
                <Alert color="green" title="Barcode detected">
                  <Text fw={600}>{barcode}</Text>
                </Alert>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="upload" pt="md">
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Upload an image of the positioner barcode
              </Text>
              <FileButton onChange={handleFileUpload} accept="image/*">
                {(props) => (
                  <Button {...props} fullWidth loading={loading} color="teal" leftSection={<IconFolder size={18} />}>
                    Choose Image
                  </Button>
                )}
              </FileButton>
              {imagePreview && (
                <Image src={imagePreview} alt="Barcode preview" style={{ maxHeight: '200px', objectFit: 'contain' }} />
              )}
              {barcode && (
                <Alert color="green" title="Barcode detected">
                  <Text fw={600}>{barcode}</Text>
                </Alert>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="manual" pt="md">
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Enter the barcode manually
              </Text>
              <TextInput
                label="Barcode"
                placeholder="Enter positioner barcode..."
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                size="md"
              />
            </Stack>
          </Tabs.Panel>
        </Tabs>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error">
            {error}
          </Alert>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={checkAndActivate}
            loading={loading}
            disabled={!barcode && !(activeTab === 'manual' && manualBarcode)}
            color="teal"
          >
            Assign Positioner
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
