import { View, StyleSheet, ScrollView, Text, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Device } from '@medplum/fhirtypes';
import { medplum, getDeviceCondition, updateDeviceCondition } from '../../services/medplum';

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [device, setDevice] = useState<Device | null>(null);
  const [condition, setCondition] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [firmnessRating, setFirmnessRating] = useState(3);
  const [leakObserved, setLeakObserved] = useState(false);
  const [pressureLevel, setPressureLevel] = useState<'LOW' | 'MED' | 'HIGH' | 'UNKNOWN'>('MED');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadDevice();
    loadCondition();
  }, [id]);

  async function loadDevice() {
    try {
      const deviceData = await medplum.readResource('Device', id as string) as Device;
      setDevice(deviceData);
    } catch (error) {
      console.error('Error loading device:', error);
    }
  }

  async function loadCondition() {
    const conditionData = await getDeviceCondition(id as string);
    if (conditionData) {
      setCondition(conditionData);
      setFirmnessRating(conditionData.firmnessRating || 3);
      setLeakObserved(conditionData.leakObserved || false);
      setPressureLevel(conditionData.pressureLevel || 'MED');
      setNotes(conditionData.notes || '');
    }
  }

  async function handleSaveCondition() {
    const success = await updateDeviceCondition(id as string, {
      firmnessRating,
      leakObserved,
      pressureLevel,
      notes,
    });

    if (success) {
      Alert.alert('Success', 'Device condition updated');
      setIsEditing(false);
      loadCondition();
    } else {
      Alert.alert('Error', 'Failed to update condition');
    }
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const barcode = device.identifier?.find(
    i => i.system === 'http://hospital.org/positioner-barcode'
  )?.value;

  const activationDate = device.property?.find(
    p => p.type?.text === 'activationDate'
  )?.valueDateTime;

  const expirationDate = device.expirationDate;

  const daysInUse = activationDate
    ? Math.floor((Date.now() - new Date(activationDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const daysRemaining = expirationDate
    ? Math.max(0, Math.floor((new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 90;

  const patientRef = device.patient?.reference;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>

      {/* Device Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Information</Text>
        <InfoRow label="Barcode" value={barcode || 'Unknown'} />
        <InfoRow label="Status" value={device.status || 'inactive'} />
        <InfoRow label="Active Patient" value={patientRef || 'None'} />
        <InfoRow label="Opened At" value={activationDate ? new Date(activationDate).toLocaleDateString() : 'N/A'} />
        <InfoRow label="Days in Use" value={`${daysInUse} days`} />
        <InfoRow label="Days Remaining" value={`${daysRemaining} days`} color={daysRemaining < 7 ? '#FF3B30' : '#34C759'} />
        <InfoRow label="Expires At" value={expirationDate ? new Date(expirationDate).toLocaleDateString() : 'N/A'} />
      </View>

      {/* Condition Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Device Condition</Text>
          <Pressable onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.editButton}>{isEditing ? 'Cancel' : 'Edit'}</Text>
          </Pressable>
        </View>

        {!isEditing ? (
          <>
            <InfoRow label="Firmness Rating" value={`${condition?.firmnessRating || 3}/5`} />
            <InfoRow label="Leak Observed" value={condition?.leakObserved ? 'Yes' : 'No'} />
            <InfoRow label="Pressure Level" value={condition?.pressureLevel || 'MED'} />
            <InfoRow label="Notes" value={condition?.notes || 'No notes'} />
            <InfoRow label="Last Updated" value={condition?.lastUpdated ? new Date(condition.lastUpdated).toLocaleString() : 'Never'} />
          </>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Firmness Rating (1-5):</Text>
            <View style={styles.ratingButtons}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <Pressable
                  key={rating}
                  style={[
                    styles.ratingButton,
                    firmnessRating === rating && styles.ratingButtonActive,
                  ]}
                  onPress={() => setFirmnessRating(rating)}
                >
                  <Text
                    style={[
                      styles.ratingButtonText,
                      firmnessRating === rating && styles.ratingButtonTextActive,
                    ]}
                  >
                    {rating}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Leak Observed:</Text>
            <View style={styles.toggleButtons}>
              <Pressable
                style={[styles.toggleButton, !leakObserved && styles.toggleButtonActive]}
                onPress={() => setLeakObserved(false)}
              >
                <Text style={[styles.toggleButtonText, !leakObserved && styles.toggleButtonTextActive]}>
                  No
                </Text>
              </Pressable>
              <Pressable
                style={[styles.toggleButton, leakObserved && styles.toggleButtonActive]}
                onPress={() => setLeakObserved(true)}
              >
                <Text style={[styles.toggleButtonText, leakObserved && styles.toggleButtonTextActive]}>
                  Yes
                </Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Pressure Level:</Text>
            <View style={styles.pressureButtons}>
              {(['LOW', 'MED', 'HIGH', 'UNKNOWN'] as const).map((level) => (
                <Pressable
                  key={level}
                  style={[
                    styles.pressureButton,
                    pressureLevel === level && styles.pressureButtonActive,
                  ]}
                  onPress={() => setPressureLevel(level)}
                >
                  <Text
                    style={[
                      styles.pressureButtonText,
                      pressureLevel === level && styles.pressureButtonTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Notes:</Text>
            <Text
              style={styles.textArea}
              onChangeText={setNotes}
            >
              {notes}
            </Text>

            <Pressable style={styles.saveButton} onPress={handleSaveCondition}>
              <Text style={styles.saveButtonText}>Save Condition</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* History Button */}
      <Pressable
        style={styles.historyButton}
        onPress={() => router.push(`/device/${id}/history`)}
      >
        <Text style={styles.historyButtonText}>View History & Timeline →</Text>
      </Pressable>
    </ScrollView>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={[styles.infoValue, color && { color }]}>{value}</Text>
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
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  editButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  ratingButtonActive: {
    backgroundColor: '#007AFF',
  },
  ratingButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  ratingButtonTextActive: {
    color: 'white',
  },
  toggleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: 'white',
  },
  pressureButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pressureButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  pressureButtonActive: {
    backgroundColor: '#007AFF',
  },
  pressureButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  pressureButtonTextActive: {
    color: 'white',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
  },
  saveButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  historyButton: {
    backgroundColor: '#5856D6',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  historyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});