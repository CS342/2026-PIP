// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import {
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  Tabs,
  Text,
  TextInput,
  FileButton,
  Alert,
  Image,
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconAlertCircle, IconCamera, IconUpload, IconKeyboard } from '@tabler/icons-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useState, useRef, useEffect } from 'react';
import type { JSX } from 'react';
import type { Patient } from '@medplum/fhirtypes';
import { useMedplum } from '@medplum/react';
import { scanAndActivatePositioner } from '../utils/positioner';

interface ScanPositionerModalProps {
  opened: boolean;
  onClose: () => void;
  patient: Patient;
  onSuccess?: () => void;
}

type InputMethod = 'camera' | 'upload' | 'manual';

export function ScanPositionerModal({ opened, onClose, patient, onSuccess }: ScanPositionerModalProps): JSX.Element {
  const medplum = useMedplum();
  const [activeTab, setActiveTab] = useState<InputMethod>('camera');
  const [barcode, setBarcode] = useState<string>('');
  const [manualBarcode, setManualBarcode] = useState<string>('');
  const [rotationInterval, setRotationInterval] = useState<number>(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
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

  const handleActivate = async (): Promise<void> => {
    const barcodeValue = activeTab === 'manual' ? manualBarcode : barcode;
    if (!barcodeValue.trim()) {
      setError('Please enter or scan a barcode');
      return;
    }

    if (rotationInterval < 1 || rotationInterval > 24) {
      setError('Rotation interval must be between 1 and 24 hours');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the simplified scan and activate workflow
      const result = await scanAndActivatePositioner(medplum, barcodeValue, patient, rotationInterval);

      if (!result.success) {
        setError(result.error || 'Failed to activate positioner');
        setLoading(false);
        return;
      }

      showNotification({
        color: 'green',
        message: 'Positioner activated successfully',
      });

      onSuccess?.();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to activate positioner');
      console.error('Error activating positioner:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (): void => {
    setBarcode('');
    setManualBarcode('');
    setError(null);
    setImagePreview(null);
    setActiveTab('camera');
    if (qrCodeScannerRef.current) {
      qrCodeScannerRef.current.stop().catch(() => {});
      qrCodeScannerRef.current = null;
    }
    setScanning(false);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Scan Positioner"
      size="lg"
      centered
    >
      <Stack gap="md">
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value as InputMethod)}>
          <Tabs.List>
            <Tabs.Tab value="camera" leftSection={<IconCamera size={16} />}>
              Take Photo
            </Tabs.Tab>
            <Tabs.Tab value="upload" leftSection={<IconUpload size={16} />}>
              Upload Photo
            </Tabs.Tab>
            <Tabs.Tab value="manual" leftSection={<IconKeyboard size={16} />}>
              Manual Entry
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="camera" pt="md">
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Use your device camera to scan the positioner barcode
              </Text>
              <div
                id="camera-container"
                ref={cameraContainerRef}
                style={{ width: '100%', minHeight: '300px', position: 'relative' }}
              />
              {!scanning && (
                <Button onClick={startCameraScan} fullWidth>
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
                >
                  Stop Camera
                </Button>
              )}
              {barcode && (
                <Alert color="green" title="Barcode detected">
                  {barcode}
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
                  <Button {...props} fullWidth loading={loading}>
                    Choose Image
                  </Button>
                )}
              </FileButton>
              {imagePreview && (
                <Image src={imagePreview} alt="Barcode preview" style={{ maxHeight: '200px', objectFit: 'contain' }} />
              )}
              {barcode && (
                <Alert color="green" title="Barcode detected">
                  {barcode}
                </Alert>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="manual" pt="md">
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Enter the barcode manually if scanning fails
              </Text>
              <TextInput
                label="Barcode"
                placeholder="Enter barcode"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
              />
            </Stack>
          </Tabs.Panel>
        </Tabs>

        {(barcode || (activeTab === 'manual' && manualBarcode)) && (
          <Stack gap="md">
            <NumberInput
              label="Rotation Interval (hours)"
              description="How often should the positioner be rotated?"
              value={rotationInterval}
              onChange={(value) => setRotationInterval(typeof value === 'number' ? value : 6)}
              min={1}
              max={24}
              required
            />
          </Stack>
        )}

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
            onClick={handleActivate}
            loading={loading}
            disabled={!barcode && !(activeTab === 'manual' && manualBarcode)}
          >
            Activate Positioner
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
