import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  getDocFromServer,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  ConstructionProject,
  ExportedGood,
  LaborDailyLog,
  MaterialItem,
  StaffMember,
} from './types';
import {
  INITIAL_EXPORTED_GOODS,
  INITIAL_LABOR_LOGS,
  INITIAL_MATERIALS,
  INITIAL_PROJECTS,
  INITIAL_STAFF,
} from './data/mockData';

// User's provided Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBtSGwxrgPDvzxGOF0E6qVcCj8pdswhs9E",
  authDomain: "chongtham36-c3c29.firebaseapp.com",
  projectId: "chongtham36-c3c29",
  storageBucket: "chongtham36-c3c29.firebasestorage.app",
  messagingSenderId: "310381098330",
  appId: "1:310381098330:web:70dd4b0d9add1fcf792f63",
  measurementId: "G-NK4JF90JQ1"
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Notification: ', errInfo);
}

// Test connection to Firestore
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'status'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted.');
      return false;
    }
    // If permission or document not found, connection to server was still established
    return true;
  }
}

// Seed initial collections if empty - no demo data seeded
export async function seedInitialDataIfEmpty() {
  // Demo data is disabled to keep application completely clean
}

// Clear all data in Firestore
export async function clearAllDatabaseData() {
  const collections = ['projects', 'materials', 'exportedGoods', 'laborLogs', 'staff'];
  for (const col of collections) {
    try {
      const snap = await getDocs(collection(db, col));
      const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (err) {
      console.warn(`Error clearing collection ${col}:`, err);
    }
  }
}

// Real-time Firestore subscribers
export function subscribeProjects(onData: (projects: ConstructionProject[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, 'projects'),
    (snap) => {
      const list: ConstructionProject[] = [];
      snap.forEach((d) => {
        list.push({ ...d.data(), id: d.id } as ConstructionProject);
      });
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'projects');
    }
  );
}

export function subscribeMaterials(onData: (materials: MaterialItem[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, 'materials'),
    (snap) => {
      const list: MaterialItem[] = [];
      snap.forEach((d) => {
        list.push({ ...d.data(), id: d.id } as MaterialItem);
      });
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'materials');
    }
  );
}

export function subscribeExportedGoods(onData: (goods: ExportedGood[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, 'exportedGoods'),
    (snap) => {
      const list: ExportedGood[] = [];
      snap.forEach((d) => {
        list.push({ ...d.data(), id: d.id } as ExportedGood);
      });
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'exportedGoods');
    }
  );
}

export function subscribeLaborLogs(onData: (logs: LaborDailyLog[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, 'laborLogs'),
    (snap) => {
      const list: LaborDailyLog[] = [];
      snap.forEach((d) => {
        list.push(d.data() as LaborDailyLog);
      });
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'laborLogs');
    }
  );
}

export function subscribeStaff(onData: (staff: StaffMember[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, 'staff'),
    (snap) => {
      const list: StaffMember[] = [];
      snap.forEach((d) => {
        list.push({ ...d.data(), id: d.id } as StaffMember);
      });
      onData(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'staff');
    }
  );
}

// Data Mutation Functions
export async function addProjectToFirestore(project: ConstructionProject) {
  try {
    await setDoc(doc(db, 'projects', project.id), project);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `projects/${project.id}`);
  }
}

export async function deleteProjectFromFirestore(projectId: string) {
  try {
    await deleteDoc(doc(db, 'projects', projectId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `projects/${projectId}`);
  }
}

export async function addMaterialToFirestore(material: MaterialItem) {
  try {
    await setDoc(doc(db, 'materials', material.id), material);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `materials/${material.id}`);
  }
}

export async function deleteMaterialFromFirestore(materialId: string) {
  try {
    await deleteDoc(doc(db, 'materials', materialId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `materials/${materialId}`);
  }
}

export async function addExportedGoodToFirestore(good: ExportedGood) {
  try {
    await setDoc(doc(db, 'exportedGoods', good.id), good);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `exportedGoods/${good.id}`);
  }
}

export async function addLaborLogToFirestore(log: LaborDailyLog) {
  try {
    const id = `log_${Date.now()}`;
    await setDoc(doc(db, 'laborLogs', id), log);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'laborLogs');
  }
}

export async function addStaffToFirestore(staff: StaffMember) {
  try {
    await setDoc(doc(db, 'staff', staff.id), staff);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `staff/${staff.id}`);
  }
}

export async function deleteStaffFromFirestore(staffId: string) {
  try {
    await deleteDoc(doc(db, 'staff', staffId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `staff/${staffId}`);
  }
}

