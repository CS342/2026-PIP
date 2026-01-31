import { MedplumClient } from '@medplum/core';
import { Patient, Device, Task, Bundle } from '@medplum/fhirtypes';

// Custom storage adapter for React Native (Medplum needs this)
// Custom storage adapter for React Native (Medplum needs this)
class ReactNativeStorage {
  private storage: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  // Medplum also needs these methods
  getObject(key: string): any {
    const value = this.storage.get(key);
    if (!value) return undefined;
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }

  setObject(key: string, value: any): void {
    this.storage.set(key, JSON.stringify(value));
  }

  clear(): void {
    this.storage.clear();
  }
}
// Initialize Medplum client
const medplum = new MedplumClient({
  baseUrl: 'https://api.medplum.com',
  storage: new ReactNativeStorage(),
  fetch: fetch,
});

// Authentication state
let isAuthenticated = false;

export async function authenticate(clientId: string, clientSecret: string) {
  try {
    await medplum.startClientLogin(clientId, clientSecret);
    isAuthenticated = true;
    return true;
  } catch (error) {
    console.error('Authentication failed:', error);
    return false;
  }
}

// Patient operations
export async function getPatients(): Promise<Patient[]> {
  if (!isAuthenticated) {
    return getMockPatients();
  }
  
  try {
    const bundle = await medplum.searchResources('Patient', { _count: '50' });
    return bundle as Patient[];
  } catch (error) {
    console.error('Error fetching patients:', error);
    return [];
  }
}

export async function getPatient(id: string): Promise<Patient | null> {
  if (!isAuthenticated) {
    return getMockPatients().find(p => p.id === id) || null;
  }
  
  try {
    return await medplum.readResource('Patient', id);
  } catch (error) {
    console.error('Error fetching patient:', error);
    return null;
  }
}

// Device operations
export async function getActiveDevices(): Promise<Device[]> {
  if (!isAuthenticated) {
    return getMockDevices();
  }

  try {
    const devices = await medplum.searchResources('Device', {
      status: 'active',
      _count: '100',
    }) as Device[];
    return devices;
  } catch (error) {
    console.error('Error fetching devices:', error);
    return [];
  }
}

export async function scanBarcode(
  barcode: string,
  patientId: string,
  rotationHours: number
): Promise<boolean> {
  if (!isAuthenticated) {
    console.log('Mock: Device activated', { barcode, patientId, rotationHours });
    return true;
  }
  
  try {
    const devices = await medplum.searchResources('Device', {
      identifier: `http://hospital.org/positioner-barcode|${barcode}`,
    });
    
    if (devices.length === 0) {
      throw new Error('Device not found');
    }
    
    const device = devices[0] as Device;
    
    const now = new Date();
    const expiration = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    await medplum.updateResource({
      ...device,
      status: 'active',
      patient: { reference: `Patient/${patientId}` },
      expirationDate: expiration.toISOString(),
      property: [
        {
          type: { text: 'activationDate' },
          valueDateTime: now.toISOString(),
        },
        {
          type: { text: 'rotationIntervalHours' },
          valueQuantity: { value: rotationHours, unit: 'hours' },
        },
      ],
    });
    
    return true;
  } catch (error) {
    console.error('Error activating device:', error);
    return false;
  }
}

// Task operations
export async function getRotationTasks(): Promise<Task[]> {
  if (!isAuthenticated) {
    return getMockTasks();
  }
  
  try {
    const bundle = await medplum.searchResources('Task', {
      code: 'rotate-positioner',
      status: 'ready',
      _sort: 'executionPeriod',
    });
    return bundle as Task[];
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}

export async function approveTask(taskId: string): Promise<boolean> {
  if (!isAuthenticated) {
    console.log('Mock: Task approved', taskId);
    return true;
  }
  
  try {
    const task = await medplum.readResource('Task', taskId);
    await medplum.updateResource({
      ...task,
      status: 'completed',
      output: [
        {
          type: { text: 'completedAt' },
          valueDateTime: new Date().toISOString(),
        },
      ],
    });
    return true;
  } catch (error) {
    console.error('Error approving task:', error);
    return false;
  }
}

export async function postponeTask(taskId: string, minutes: number): Promise<boolean> {
  if (!isAuthenticated) {
    console.log('Mock: Task postponed', { taskId, minutes });
    return true;
  }
  
  try {
    const task = await medplum.readResource('Task', taskId);
    await medplum.updateResource({
      ...task,
      status: 'on-hold',
      note: [
        ...(task.note || []),
        {
          text: `Postponed by ${minutes} minutes`,
          time: new Date().toISOString(),
        },
      ],
    });
    return true;
  } catch (error) {
    console.error('Error postponing task:', error);
    return false;
  }
}

export async function cancelTask(taskId: string): Promise<boolean> {
  if (!isAuthenticated) {
    console.log('Mock: Task cancelled', taskId);
    return true;
  }
  
  try {
    const task = await medplum.readResource('Task', taskId);
    await medplum.updateResource({
      ...task,
      status: 'cancelled',
      note: [
        ...(task.note || []),
        {
          text: 'Device no longer in use',
          time: new Date().toISOString(),
        },
      ],
    });
    return true;
  } catch (error) {
    console.error('Error cancelling task:', error);
    return false;
  }
}

// Device Condition Management
export async function getDeviceCondition(deviceId: string) {
  if (!isAuthenticated) {
    return {
      firmnessRating: 3,
      leakObserved: false,
      pressureLevel: 'MED',
      notes: 'Device in good condition',
      lastUpdated: new Date().toISOString(),
    };
  }

  try {
    const device = await medplum.readResource('Device', deviceId) as Device;
    
    const extensions = device.extension || [];
    const conditionExt = extensions.find(ext => 
      ext.url === 'http://hospital.org/device-condition'
    );

    if (conditionExt?.extension) {
      const getExtValue = (url: string) => {
        const ext = conditionExt.extension?.find(e => e.url === url);
        return ext?.valueInteger || ext?.valueBoolean || ext?.valueString || ext?.valueCode;
      };

      return {
        firmnessRating: getExtValue('firmnessRating') as number,
        leakObserved: getExtValue('leakObserved') as boolean,
        pressureLevel: getExtValue('pressureLevel') as string,
        notes: getExtValue('notes') as string,
        lastUpdated: getExtValue('lastUpdated') as string,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching device condition:', error);
    return null;
  }
}

export async function updateDeviceCondition(
  deviceId: string,
  payload: {
    firmnessRating?: number;
    leakObserved?: boolean;
    pressureLevel?: 'LOW' | 'MED' | 'HIGH' | 'UNKNOWN';
    notes?: string;
  }
): Promise<boolean> {
  if (!isAuthenticated) {
    console.log('Mock: Device condition updated', { deviceId, payload });
    return true;
  }

  try {
    const device = await medplum.readResource('Device', deviceId) as Device;
    
    const extensions = (device.extension || []).filter(ext => 
      ext.url !== 'http://hospital.org/device-condition'
    );

    extensions.push({
      url: 'http://hospital.org/device-condition',
      extension: [
        {
          url: 'firmnessRating',
          valueInteger: payload.firmnessRating,
        },
        {
          url: 'leakObserved',
          valueBoolean: payload.leakObserved,
        },
        {
          url: 'pressureLevel',
          valueCode: payload.pressureLevel,
        },
        {
          url: 'notes',
          valueString: payload.notes,
        },
        {
          url: 'lastUpdated',
          valueDateTime: new Date().toISOString(),
        },
      ],
    });

    await medplum.updateResource({
      ...device,
      extension: extensions,
    });

    return true;
  } catch (error) {
    console.error('Error updating device condition:', error);
    return false;
  }
}

// Device History / Audit Trail
export async function getDeviceHistory(deviceId: string) {
  if (!isAuthenticated) {
    return getMockDeviceHistory(deviceId);
  }

  try {
    const deviceRef = `Device/${deviceId}`;
    
    const tasks = await medplum.searchResources('Task', {
      focus: deviceRef,
      _sort: '-authoredOn',
      _count: '100',
    }) as Task[];

    const deviceUseStatements = await medplum.searchResources('DeviceUseStatement', {
      device: deviceRef,
      _sort: '-recordedOn',
    });

    const events = [];

    for (const task of tasks) {
      if (task.status === 'completed') {
        events.push({
          type: 'rotation_completed',
          timestamp: task.output?.find(o => o.type?.text === 'completedAt')?.valueDateTime 
            || task.authoredOn,
          description: `Rotation #${task.input?.find(i => i.type?.text === 'rotationNumber')?.valueInteger} completed`,
          taskId: task.id,
          status: task.status,
        });
      } else if (task.status === 'on-hold') {
        const postponeNote = task.note?.slice(-1)[0];
        events.push({
          type: 'rotation_postponed',
          timestamp: postponeNote?.time || task.authoredOn,
          description: postponeNote?.text || 'Rotation postponed',
          taskId: task.id,
          status: task.status,
        });
      } else if (task.status === 'cancelled') {
        events.push({
          type: 'rotation_cancelled',
          timestamp: task.authoredOn,
          description: 'Rotation task cancelled',
          taskId: task.id,
          status: task.status,
        });
      } else if (task.status === 'ready') {
        events.push({
          type: 'rotation_scheduled',
          timestamp: task.authoredOn,
          description: `Rotation #${task.input?.find(i => i.type?.text === 'rotationNumber')?.valueInteger} scheduled`,
          taskId: task.id,
          status: task.status,
          dueTime: task.executionPeriod?.start,
        });
      }
    }

    for (const statement of deviceUseStatements) {
      events.push({
        type: 'device_activated',
        timestamp: statement.recordedOn || statement.timingPeriod?.start,
        description: `Device activated for patient`,
        patientRef: statement.subject?.reference,
      });
    }

    events.sort((a, b) => 
      new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    );

    return events;
  } catch (error) {
    console.error('Error fetching device history:', error);
    return [];
  }
}

// Enhanced task operations with postpone reasons
export async function postponeTaskWithReason(
  taskId: string,
  minutes: number,
  reason: 'patient_asleep' | 'patient_off_unit' | 'procedure_ongoing' | 'equipment_issue' | 'other',
  reasonText?: string
): Promise<boolean> {
  if (!isAuthenticated) {
    console.log('Mock: Task postponed with reason', { taskId, minutes, reason, reasonText });
    return true;
  }

  try {
    const task = await medplum.readResource('Task', taskId) as Task;
    
    const reasonMap = {
      patient_asleep: 'Patient asleep',
      patient_off_unit: 'Patient off unit',
      procedure_ongoing: 'Procedure ongoing',
      equipment_issue: 'Equipment issue',
      other: reasonText || 'Other reason',
    };

    await medplum.updateResource({
      ...task,
      status: 'on-hold',
      statusReason: {
        text: reasonMap[reason],
      },
      note: [
        ...(task.note || []),
        {
          text: `Postponed by ${minutes} minutes - Reason: ${reasonMap[reason]}`,
          time: new Date().toISOString(),
        },
      ],
    });

    return true;
  } catch (error) {
    console.error('Error postponing task:', error);
    return false;
  }
}

// Escalation: Check for overdue tasks
export async function checkAndEscalateOverdueTasks(overdueThresholdMinutes: number = 30) {
  if (!isAuthenticated) {
    console.log('Mock: Checking for overdue tasks');
    return { escalated: 0 };
  }

  try {
    const tasks = await medplum.searchResources('Task', {
      code: 'rotate-positioner',
      status: 'ready',
    }) as Task[];

    const now = new Date();
    let escalatedCount = 0;

    for (const task of tasks) {
      const scheduledTime = task.executionPeriod?.start;
      if (!scheduledTime) continue;

      const dueTime = new Date(scheduledTime);
      const minutesOverdue = (now.getTime() - dueTime.getTime()) / (1000 * 60);

      if (minutesOverdue > overdueThresholdMinutes) {
        await medplum.updateResource({
          ...task,
          priority: 'urgent',
          note: [
            ...(task.note || []),
            {
              text: `ESCALATED: Task overdue by ${Math.floor(minutesOverdue)} minutes. Assigned to charge nurse.`,
              time: now.toISOString(),
            },
          ],
        });

        escalatedCount++;
      }
    }

    return { escalated: escalatedCount };
  } catch (error) {
    console.error('Error checking overdue tasks:', error);
    return { escalated: 0 };
  }
}

// Mock data functions
function getMockPatients(): Patient[] {
  return [
    {
      resourceType: 'Patient',
      id: 'patient-001',
      name: [{ given: ['John'], family: 'Smith', text: 'John Smith' }],
      gender: 'male',
      birthDate: '1985-06-15',
    },
    {
      resourceType: 'Patient',
      id: 'patient-002',
      name: [{ given: ['Sarah'], family: 'Johnson', text: 'Sarah Johnson' }],
      gender: 'female',
      birthDate: '1992-03-22',
    },
    {
      resourceType: 'Patient',
      id: 'patient-003',
      name: [{ given: ['Michael'], family: 'Brown', text: 'Michael Brown' }],
      gender: 'male',
      birthDate: '1978-11-05',
    },
  ];
}

function getMockDevices(): Device[] {
  const now = new Date();
  const activation1 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const activation2 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const expiration1 = new Date(activation1.getTime() + 90 * 24 * 60 * 60 * 1000);
  const expiration2 = new Date(activation2.getTime() + 90 * 24 * 60 * 60 * 1000);

  return [
    {
      resourceType: 'Device',
      id: 'positioner-001',
      identifier: [
        {
          system: 'http://hospital.org/positioner-barcode',
          value: 'POS-12345',
        },
      ],
      status: 'active',
      patient: { reference: 'Patient/patient-001' },
      expirationDate: expiration1.toISOString(),
      property: [
        {
          type: { text: 'activationDate' },
          valueDateTime: activation1.toISOString(),
        },
        {
          type: { text: 'rotationIntervalHours' },
          valueQuantity: { value: 6, unit: 'hours' },
        },
      ],
    },
    {
      resourceType: 'Device',
      id: 'positioner-002',
      identifier: [
        {
          system: 'http://hospital.org/positioner-barcode',
          value: 'POS-67890',
        },
      ],
      status: 'active',
      patient: { reference: 'Patient/patient-002' },
      expirationDate: expiration2.toISOString(),
      property: [
        {
          type: { text: 'activationDate' },
          valueDateTime: activation2.toISOString(),
        },
        {
          type: { text: 'rotationIntervalHours' },
          valueQuantity: { value: 8, unit: 'hours' },
        },
      ],
    },
  ];
}

function getMockTasks(): Task[] {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  
  return [
    {
      resourceType: 'Task',
      id: 'task-001',
      status: 'ready',
      intent: 'order',
      description: 'Rotate positioner POS-12345 for John Smith',
      executionPeriod: { start: oneHourAgo.toISOString() },
      for: { reference: 'Patient/patient-001' },
      focus: { reference: 'Device/positioner-001' },
      input: [
        { type: { text: 'rotationNumber' }, valueInteger: 3 },
        { type: { text: 'deviceBarcode' }, valueString: 'POS-12345' },
        { type: { text: 'patientName' }, valueString: 'John Smith' },
      ],
    },
    {
      resourceType: 'Task',
      id: 'task-002',
      status: 'ready',
      intent: 'order',
      description: 'Rotate positioner POS-67890 for Sarah Johnson',
      executionPeriod: { start: inTwoHours.toISOString() },
      for: { reference: 'Patient/patient-002' },
      focus: { reference: 'Device/positioner-002' },
      input: [
        { type: { text: 'rotationNumber' }, valueInteger: 1 },
        { type: { text: 'deviceBarcode' }, valueString: 'POS-67890' },
        { type: { text: 'patientName' }, valueString: 'Sarah Johnson' },
      ],
    },
  ];
}

function getMockDeviceHistory(deviceId: string) {
  const now = new Date();
  return [
    {
      type: 'device_activated',
      timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      description: 'Device activated for patient',
      patientRef: 'Patient/patient-001',
    },
    {
      type: 'rotation_completed',
      timestamp: new Date(now.getTime() - 42 * 60 * 60 * 1000).toISOString(),
      description: 'Rotation #1 completed',
      taskId: 'task-001',
    },
    {
      type: 'rotation_completed',
      timestamp: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
      description: 'Rotation #2 completed',
      taskId: 'task-002',
    },
    {
      type: 'rotation_postponed',
      timestamp: new Date(now.getTime() - 30 * 60 * 60 * 1000).toISOString(),
      description: 'Postponed by 30 minutes - Reason: Patient asleep',
      taskId: 'task-003',
    },
    {
      type: 'rotation_completed',
      timestamp: new Date(now.getTime() - 29 * 60 * 60 * 1000).toISOString(),
      description: 'Rotation #3 completed',
      taskId: 'task-003',
    },
  ];
}

export { medplum };