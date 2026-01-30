import { View, StyleSheet, Pressable, TextInput, Alert, Text, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { getPatient, scanBarcode } from '../../services/medplum';
import { Patient } from '@medplum/fhirtypes';
import BarcodeScanner from '../../components/BarcodeScanner';

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [showBarcodeInput, setShowBarcodeInput] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [rotationHours, setRotationHours] = useState('6');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadPatient();
  }, [id]);

  async function loadPatient() {
    if (typeof id === 'string') {
      const data = await getPatient(id);
      setPatient(data);
    }
  }

  function handleBarcodeScanned(scannedBarcode: string) {
    setBarcode(scannedBarcode);
    setShowScanner(false);
    setShowBarcodeInput(true);
  }

  async function handleActivateDevice() {
    if (!barcode.trim()) {
      Alert.alert('Error', 'Please enter a barcode');
      return;
    }

    setIsProcessing(true);
    const success = await scanBarcode(
      barcode,
      id as string,
      parseInt(rotationHours)
    );
    setIsProcessing(false);

    if (success) {
      Alert.alert('Success', 'Device activated for patient');
      setShowBarcodeInput(false);
      setBarcode('');
    } else {
      Alert.alert('Error', 'Failed to activate device');
    }
  }

  const name = patient?.name?.[0]?.text || 'Unknown Patient';
  const birthDate = patient?.birthDate || 'N/A';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>

      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{name}</Text>
        <Text style={styles.patientDetail}>DOB: {birthDate}</Text>
      </View>

      {!showBarcodeInput ? (
        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.scanButton}
            onPress={() => setShowScanner(true)}
          >
            <Text style={styles.scanButtonText}>📷 Scan Barcode</Text>
          </Pressable>

          <Pressable
            style={styles.manualButton}
            onPress={() => setShowBarcodeInput(true)}
          >
            <Text style={styles.manualButtonText}>⌨️ Enter Manually</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.barcodeForm}>
          <Text style={styles.formTitle}>Device Barcode</Text>
          
          <View style={styles.barcodeInputRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g., POS-12345"
              value={barcode}
              onChangeText={setBarcode}
              autoCapitalize="characters"
            />
            <Pressable
              style={styles.rescanButton}
              onPress={() => setShowScanner(true)}
            >
              <Text style={styles.rescanButtonText}>📷</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Rotation Interval (hours):</Text>
          <View style={styles.intervalButtons}>
            {[2, 4, 6, 8, 12, 24].map((hours) => (
              <Pressable
                key={hours}
                style={[
                  styles.intervalButton,
                  rotationHours === hours.toString() && styles.intervalButtonActive,
                ]}
                onPress={() => setRotationHours(hours.toString())}
              >
                <Text
                  style={[
                    styles.intervalButtonText,
                    rotationHours === hours.toString() &&
                      styles.intervalButtonTextActive,
                  ]}
                >
                  {hours}h
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.activateButton, isProcessing && styles.activateButtonDisabled]}
            onPress={handleActivateDevice}
            disabled={isProcessing}
          >
            <Text style={styles.activateButtonText}>
              {isProcessing ? 'Activating...' : 'Activate Device'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={() => {
              setShowBarcodeInput(false);
              setBarcode('');
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      )}

      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <BarcodeScanner
          onBarcodeScanned={handleBarcodeScanned}
          onCancel={() => setShowScanner(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
  },
  patientInfo: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  patientName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  patientDetail: {
    fontSize: 16,
    color: '#666',
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  manualButton: {
    backgroundColor: '#5856D6',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  manualButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  barcodeForm: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  barcodeInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  rescanButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  rescanButtonText: {
    fontSize: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  intervalButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  intervalButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  intervalButtonActive: {
    backgroundColor: '#007AFF',
  },
  intervalButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  intervalButtonTextActive: {
    color: 'white',
  },
  activateButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  activateButtonDisabled: {
    opacity: 0.5,
  },
  activateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});