import { View, FlatList, Pressable, StyleSheet, RefreshControl, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { getPatients } from '../../services/medplum';
import { Patient } from '@medplum/fhirtypes';

export default function PatientsScreen() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    const data = await getPatients();
    setPatients(data);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadPatients();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patients</Text>
      <FlatList
        data={patients}
        keyExtractor={(item) => item.id || ''}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => {
          const name = item.name?.[0]?.text || 'Unknown Patient';
          const birthDate = item.birthDate || '';
          
          return (
            <Pressable
              style={styles.patientCard}
              onPress={() => router.push(`/patient/${item.id}`)}
            >
              <View>
                <Text style={styles.patientName}>{name}</Text>
                {birthDate && (
                  <Text style={styles.patientDetail}>DOB: {birthDate}</Text>
                )}
              </View>
              <Text style={styles.arrow}>→</Text>
            </Pressable>
          );
        }}
        contentContainerStyle={styles.list}
      />
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
  list: {
    padding: 16,
  },
  patientCard: {
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
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  patientDetail: {
    fontSize: 14,
    color: '#666',
  },
  arrow: {
    fontSize: 24,
    color: '#007AFF',
  },
});