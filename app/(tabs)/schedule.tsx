import { View, FlatList, Pressable, StyleSheet, RefreshControl, Text, Modal, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { getRotationTasks, approveTask, postponeTaskWithReason, cancelTask } from '../../services/medplum';
import { Task } from '@medplum/fhirtypes';

interface EnrichedTask {
  task: Task;
  patientName?: string;
  deviceBarcode?: string;
  rotationNumber: number;
  scheduledTime: Date;
  isDue: boolean;
  isOverdue: boolean;
  category: 'overdue' | 'due_now' | 'due_today' | 'upcoming';
}

export default function ScheduleScreen() {
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);
  const [showPostponeModal, setShowPostponeModal] = useState(false);

  useEffect(() => {
    loadTasks();
    
    // Check for overdue tasks every minute
    const interval = setInterval(loadTasks, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadTasks() {
    try {
      const rawTasks = await getRotationTasks();
      
      // Enrich tasks
      const enriched: EnrichedTask[] = [];
      const now = new Date();
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      for (const task of rawTasks) {
        const scheduledTime = task.executionPeriod?.start 
          ? new Date(task.executionPeriod.start)
          : new Date();

const rotationNumber = task.input?.find(
          i => i.type?.text === 'rotationNumber'
        )?.valueInteger || 1;

        // Get patient name from task input (mock data)
        const patientName = task.input?.find(
          i => i.type?.text === 'patientName'
        )?.valueString || 'Unknown Patient';

        // Get device barcode from task input (mock data)
        const deviceBarcode = task.input?.find(
          i => i.type?.text === 'deviceBarcode'
        )?.valueString || 'Unknown Device';
        const isDue = scheduledTime <= now;
        const isOverdue = scheduledTime < new Date(now.getTime() - 15 * 60 * 1000); // 15 min past due

        let category: EnrichedTask['category'];
        if (isOverdue) {
          category = 'overdue';
        } else if (isDue) {
          category = 'due_now';
        } else if (scheduledTime <= todayEnd) {
          category = 'due_today';
        } else {
          category = 'upcoming';
        }

        enriched.push({
          task,
          patientName,
          deviceBarcode,
          rotationNumber,
          scheduledTime,
          isDue,
          isOverdue,
          category,
        });
      }

      // Sort: overdue first, then by scheduled time
      enriched.sort((a, b) => {
        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
        return a.scheduledTime.getTime() - b.scheduledTime.getTime();
      });

      setTasks(enriched);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  }

  function groupTasksByCategory() {
    const groups = {
      overdue: tasks.filter(t => t.category === 'overdue'),
      due_now: tasks.filter(t => t.category === 'due_now'),
      due_today: tasks.filter(t => t.category === 'due_today'),
      upcoming: tasks.filter(t => t.category === 'upcoming'),
    };
    return groups;
  }

  async function handleApprove(task: EnrichedTask) {
    const success = await approveTask(task.task.id!);
    if (success) {
      Alert.alert('Success', 'Rotation completed');
      loadTasks();
    } else {
      Alert.alert('Error', 'Failed to complete rotation');
    }
  }

  async function handlePostpone(
    task: EnrichedTask,
    reason: 'patient_asleep' | 'patient_off_unit' | 'procedure_ongoing' | 'equipment_issue' | 'other',
    reasonText?: string
  ) {
    const success = await postponeTaskWithReason(task.task.id!, 30, reason, reasonText);
    if (success) {
      Alert.alert('Success', 'Task postponed for 30 minutes');
      setShowPostponeModal(false);
      setSelectedTask(null);
      loadTasks();
    } else {
      Alert.alert('Error', 'Failed to postpone task');
    }
  }

  async function handleCancel(task: EnrichedTask) {
    Alert.alert(
      'Cancel Task',
      'Are you sure you want to cancel this rotation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            const success = await cancelTask(task.task.id!);
            if (success) {
              Alert.alert('Success', 'Task cancelled');
              setSelectedTask(null);
              loadTasks();
            } else {
              Alert.alert('Error', 'Failed to cancel task');
            }
          },
        },
      ]
    );
  }

  const groups = groupTasksByCategory();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rotation Tasks</Text>
      
      <FlatList
        data={[
          { section: 'Overdue', tasks: groups.overdue, color: '#FF3B30' },
          { section: 'Due Now', tasks: groups.due_now, color: '#FF9500' },
          { section: 'Due Today', tasks: groups.due_today, color: '#007AFF' },
          { section: 'Upcoming', tasks: groups.upcoming, color: '#34C759' },
        ]}
        keyExtractor={(item) => item.section}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item: group }) => {
          if (group.tasks.length === 0) return null;

          return (
            <View style={styles.section}>
              <View style={[styles.sectionHeader, { borderLeftColor: group.color }]}>
                <Text style={styles.sectionTitle}>{group.section}</Text>
                <Text style={styles.sectionCount}>{group.tasks.length}</Text>
              </View>
              
              {group.tasks.map((task) => (
                <Pressable
                  key={task.task.id}
                  style={styles.taskCard}
                  onPress={() => setSelectedTask(task)}
                >
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>
                      Rotation #{task.rotationNumber}
                    </Text>
                    <Text style={styles.taskPatient}>{task.patientName}</Text>
                    <Text style={styles.taskDevice}>Device: {task.deviceBarcode}</Text>
                    <Text style={[
                      styles.taskTime,
                      task.isOverdue && styles.taskTimeOverdue
                    ]}>
                      {task.isOverdue ? 'OVERDUE: ' : 'Due: '}
                      {task.scheduledTime.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                  {task.isOverdue && (
                    <View style={styles.overdueBadge}>
                      <Text style={styles.overdueText}>!</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          );
        }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No rotation tasks</Text>
            <Text style={styles.emptySubtext}>All caught up!</Text>
          </View>
        }
      />

      {/* Task Action Modal */}
      {selectedTask && (
        <Modal
          visible={!!selectedTask}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedTask(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Rotation #{selectedTask.rotationNumber}</Text>
              <Text style={styles.modalSubtitle}>{selectedTask.patientName}</Text>
              <Text style={styles.modalDevice}>Device: {selectedTask.deviceBarcode}</Text>

              <Pressable
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => {
                  handleApprove(selectedTask);
                  setSelectedTask(null);
                }}
              >
                <Text style={styles.actionButtonText}>✓ Approve - Rotated</Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, styles.postponeButton]}
                onPress={() => setShowPostponeModal(true)}
              >
                <Text style={styles.actionButtonText}>⏱ Postpone</Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleCancel(selectedTask)}
              >
                <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                  ✕ Cancel Task
                </Text>
              </Pressable>

              <Pressable
                style={styles.closeButton}
                onPress={() => setSelectedTask(null)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Postpone Reason Modal */}
      {showPostponeModal && selectedTask && (
        <Modal
          visible={showPostponeModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPostponeModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Postpone Reason</Text>
              
              <Pressable
                style={styles.reasonButton}
                onPress={() => handlePostpone(selectedTask, 'patient_asleep')}
              >
                <Text style={styles.reasonButtonText}>😴 Patient asleep</Text>
              </Pressable>

              <Pressable
                style={styles.reasonButton}
                onPress={() => handlePostpone(selectedTask, 'patient_off_unit')}
              >
                <Text style={styles.reasonButtonText}>🚶 Patient off unit</Text>
              </Pressable>

              <Pressable
                style={styles.reasonButton}
                onPress={() => handlePostpone(selectedTask, 'procedure_ongoing')}
              >
                <Text style={styles.reasonButtonText}>🏥 Procedure ongoing</Text>
              </Pressable>

              <Pressable
                style={styles.reasonButton}
                onPress={() => handlePostpone(selectedTask, 'equipment_issue')}
              >
                <Text style={styles.reasonButtonText}>⚠️ Equipment issue</Text>
              </Pressable>

              <Pressable
                style={styles.reasonButton}
                onPress={() => handlePostpone(selectedTask, 'other', 'Other reason')}
              >
                <Text style={styles.reasonButtonText}>📝 Other</Text>
              </Pressable>

              <Pressable
                style={styles.closeButton}
                onPress={() => setShowPostponeModal(false)}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
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
  list: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 8,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionCount: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  taskCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
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
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskPatient: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  taskDevice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  taskTime: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  taskTimeOverdue: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  overdueBadge: {
    backgroundColor: '#FF3B30',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overdueText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4,
  },
  modalDevice: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  postponeButton: {
    backgroundColor: '#FF9500',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#FF3B30',
  },
  closeButton: {
    padding: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  reasonButton: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 12,
  },
  reasonButtonText: {
    fontSize: 16,
    color: '#000',
  },
});