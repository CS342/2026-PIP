import { MedplumClient } from '@medplum/core';
import { Patient, Device, Task, Bundle } from '@medplum/fhirtypes';

// Initialize Medplum client
const medplum = new MedplumClient({
  baseUrl: 'https://api.medplum.com',
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
    // For now, return mock data until backend team gives credentials
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
    // Find device by barcode
    const devices = await medplum.searchResources('Device', {
      identifier: `http://hospital.org/positioner-barcode|${barcode}`,
    });
    
    if (devices.length === 0) {
      throw new Error('Device not found');
    }
    
    const device = devices[0] as Device;
    
    // Update device
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

// Mock data for development (until backend credentials are available)
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
      ],
    },
  ];
}

export { medplum };