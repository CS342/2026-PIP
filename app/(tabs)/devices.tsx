import { View, FlatList, Pressable, StyleSheet, RefreshControl, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { medplum } from '../../services/medplum';
import { Device, Patient } from '@medplum/fhirtypes';

interface EnrichedDevice {
  device: Device;
  patientName?: string;
  daysRemaining: number;
}

export default function DevicesScreen() {
  const router = useRouter();
  const [devices, setDevices] = useState<EnrichedDevice[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDevices();
  }, []);

  async function loadDevices() {
    try {
      // Get all active devices
      const activeDevices = await medplum.searchResources('Device', {
        status: 'active',
        _count: '100',
      }) as Device[];

      // Enrich with patient names
      const enriched: EnrichedDevice[] = [];
      
      for (const device of activeDevices) {
        let patientName = 'Unknown Patient';
        
        if (device.patient?.reference) {
          const patientId = device.patient.reference.split('/')[1];
          try {
            const patient = await medplum.readResource('Patient', patientId) as Patient;
            patientName = patient.name?.[0]?.text || 'Unknown Patient';
          } catch (error) {
            console.error('Error fetching patient:', error);
          }
        }

        const expirationDate = device.expirationDate;
        const daysRemaining = expirationDate
          ? Math.max(0, Math.floor((new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : 90;

        enriched.push({
          device,
          patientName,
          daysRemaining,
        });
      }

      setDevices(enriched);
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadDevices();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Active Devices</Text>
      {devices.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No active devices</Text>
          <Text style={styles.emptySubtext}>Scan a device barcode to activate</Text>
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.device.id || ''}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => {
            const barcode = item.device.identifier?.find(
              i => i.system === 'http://hospital.org/positioner-barcode'
            )?.value;

            const activationDate = item.device.property?.find(
              p => p.type?.text === 'activationDate'
            )?.valueDateTime;

            const daysInUse = activationDate
              ? Math.floor((Date.now() - new Date(activationDate).getTime()) / (1000 * 60 * 60 * 24))
              : 0;

            return (
              <Pressable
                style={styles.deviceCard}
                onPress={() => router.push(`/device/${item.device.id}`)}
              >
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceBarcode}>{barcode || 'Unknown'}</Text>
                  <Text style={styles.devicePatient}>Patient: {item.patientName}</Text>
                  <View style={styles.deviceStats}>
                    <Text style={styles.statText}>In use: {daysInUse}d</Text>
                    <Text style={styles.separator}>•</Text>
                    <Text style={[
                      styles.statText,
                      item.daysRemaining < 7 && styles.statTextWarning
                    ]}>
                      Remaining: {item.daysRemaining}d
                    </Text>
                  </View>
                </View>
                <Text style={styles.arrow}>→</Text>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    padding: 20,
    backgroundColor: 'white',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  deviceCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceBarcode: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  devicePatient: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  deviceStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#007AFF',
  },
  statTextWarning: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  separator: {
    marginHorizontal: 8,
    color: '#999',
  },
  arrow: {
    fontSize: 24,
    color: '#007AFF',
  },
});