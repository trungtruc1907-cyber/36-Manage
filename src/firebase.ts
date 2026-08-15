import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
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
} from './types';
import {
  INITIAL_EXPORTED_GOODS,
  INITIAL_LABOR_LOGS,
  INITIAL_MATERIALS,
  INITIAL_PROJECTS,
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

// Seed initial collections if empty
export async function seedInitialDataIfEmpty() {
  try {
    const projectsSnap = await getDocs(collection(db, 'projects'));
    if (projectsSnap.empty) {
      console.log('Seeding initial projects to Firestore...');
      for (const p of INITIAL_PROJECTS) {
        await setDoc(doc(db, 'projects', p.id), p);
      }
    }

    const materialsSnap = await getDocs(collection(db, 'materials'));
    if (materialsSnap.empty) {
      console.log('Seeding initial materials to Firestore...');
      for (const m of INITIAL_MATERIALS) {
        await setDoc(doc(db, 'materials', m.id), m);
      }
    }

    const exportsSnap = await getDocs(collection(db, 'exportedGoods'));
    if (exportsSnap.empty) {
      console.log('Seeding initial exported goods to Firestore...');
      for (const exp of INITIAL_EXPORTED_GOODS) {
        await setDoc(doc(db, 'exportedGoods', exp.id), exp);
      }
    }

    const laborSnap = await getDocs(collection(db, 'laborLogs'));
    if (laborSnap.empty) {
      console.log('Seeding initial labor logs to Firestore...');
      for (let i = 0; i < INITIAL_LABOR_LOGS.length; i++) {
        const log = INITIAL_LABOR_LOGS[i];
        await setDoc(doc(db, 'laborLogs', `log_${i + 1}`), log);
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seed_data');
  }
}

// Real-time Firestore subscribers
export function subscribeProjects(onData: (projects: ConstructionProject[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, 'projects'),
    (snap) => {
      if (!snap.empty) {
        const list: ConstructionProject[] = [];
        snap.forEach((d) => {
          list.push({ ...d.data(), id: d.id } as ConstructionProject);
        });
        onData(list);
      }
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
      if (!snap.empty) {
        const list: MaterialItem[] = [];
        snap.forEach((d) => {
          list.push({ ...d.data(), id: d.id } as MaterialItem);
        });
        onData(list);
      }
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
      if (!snap.empty) {
        const list: ExportedGood[] = [];
        snap.forEach((d) => {
          list.push({ ...d.data(), id: d.id } as ExportedGood);
        });
        onData(list);
      }
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
      if (!snap.empty) {
        const list: LaborDailyLog[] = [];
        snap.forEach((d) => {
          list.push(d.data() as LaborDailyLog);
        });
        onData(list);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'laborLogs');
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
