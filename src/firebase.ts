import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  remove,
  onValue,
  update,
  Unsubscribe,
} from 'firebase/database';
import { getAuth } from 'firebase/auth';
import {
  CompanySettings,
  ConstructionProject,
  ExportedGood,
  LaborDailyLog,
  MaterialItem,
  StaffMember,
  UserAccountRecord,
  LoginHistoryRecord,
} from './types';
import {
  DEFAULT_COMPANY_SETTINGS,
  INITIAL_EXPORTED_GOODS,
  INITIAL_LABOR_LOGS,
  INITIAL_MATERIALS,
  INITIAL_PROJECTS,
  INITIAL_STAFF,
} from './data/mockData';

export const INITIAL_USER_ACCOUNTS: UserAccountRecord[] = [
  {
    username: 'admin',
    password: '123456',
    name: 'Quản Trị Viên (Admin)',
    role: 'admin',
    orgId: 'CT36',
    orgName: 'Công Ty Trường Sơn - Waterproofing 36',
    phone: '0915 586 234',
    email: 'admin@chongtham36.vn',
    createdAt: '01/01/2026',
  },
  {
    username: 'thukho',
    password: '123456',
    name: 'Lê Quốc Bảo (Thủ Kho)',
    role: 'storekeeper',
    orgId: 'CT36',
    orgName: 'Công Ty Trường Sơn - Waterproofing 36',
    phone: '0988 123 456',
    email: 'thukho@chongtham36.vn',
    createdAt: '05/01/2026',
  },
  {
    username: 'giamsat',
    password: '123456',
    name: 'Nguyễn Văn Hùng (Chỉ Huy Trưởng)',
    role: 'supervisor',
    orgId: 'CT36',
    orgName: 'Công Ty Trường Sơn - Waterproofing 36',
    phone: '0987 654 321',
    email: 'giamsat@chongtham36.vn',
    createdAt: '10/01/2026',
  },
];

// User's provided Firebase configuration with Realtime Database URL
export const firebaseConfig = {
  apiKey: "AIzaSyAEc0D8YtciVrTkbNOg2YpD9pCJBQ-vgY0",
  authDomain: "kho36manage.firebaseapp.com",
  databaseURL: "https://kho36manage-default-rtdb.firebaseio.com",
  projectId: "kho36manage",
  storageBucket: "kho36manage.firebasestorage.app",
  messagingSenderId: "82040498396",
  appId: "1:82040498396:web:8cc2c590b1312afb36ac19",
  measurementId: "G-MD9QW0VLG9"
};

// Initialize Firebase App & Realtime Database
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app, "https://kho36manage-default-rtdb.firebaseio.com");
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface DatabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleDatabaseError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: DatabaseErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path,
  };
  console.warn('Firebase Realtime Database Operation Info: ', errInfo);
}

// Backward compatibility alias
export const handleFirestoreError = handleDatabaseError;

// Helper to convert Firebase RTDB object map or array to typed Array
function rtdbToList<T>(val: unknown): T[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.filter(Boolean) as T[];
  }
  if (typeof val === 'object') {
    return Object.entries(val).map(([key, item]) => {
      if (item && typeof item === 'object') {
        return { ...(item as object), id: (item as any).id || key } as T;
      }
      return item as T;
    });
  }
  return [];
}

// Test connection to Firebase Realtime Database
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const statusRef = ref(db, '.info/connected');
    const snap = await get(statusRef);
    return snap.val() !== false;
  } catch (error) {
    console.warn('Realtime Database connection check note:', error);
    return true;
  }
}

// Backward compatibility alias
export const testFirestoreConnection = testDatabaseConnection;

// Seed sample initial data into Firebase Realtime Database
export async function seedSampleDataToDatabase() {
  try {
    // 1. Projects map
    const projectsMap: Record<string, ConstructionProject> = {};
    for (const p of INITIAL_PROJECTS) {
      projectsMap[p.id] = p;
    }
    await set(ref(db, 'projects'), projectsMap);

    // 2. Materials map
    const materialsMap: Record<string, MaterialItem> = {};
    for (const m of INITIAL_MATERIALS) {
      materialsMap[m.id] = m;
    }
    await set(ref(db, 'materials'), materialsMap);

    // 3. Exported Goods map
    const exportsMap: Record<string, ExportedGood> = {};
    for (const e of INITIAL_EXPORTED_GOODS) {
      exportsMap[e.id] = e;
    }
    await set(ref(db, 'exportedGoods'), exportsMap);

    // 4. Labor Logs map
    const laborMap: Record<string, LaborDailyLog> = {};
    for (let i = 0; i < INITIAL_LABOR_LOGS.length; i++) {
      const log = INITIAL_LABOR_LOGS[i];
      laborMap[`log_sample_${i + 1}`] = log;
    }
    await set(ref(db, 'laborLogs'), laborMap);

    // 5. Staff map
    const staffMap: Record<string, StaffMember> = {};
    for (const s of INITIAL_STAFF) {
      staffMap[s.id] = s;
    }
    await set(ref(db, 'staff'), staffMap);

    // 6. Company config
    await set(ref(db, 'systemConfig/company'), DEFAULT_COMPANY_SETTINGS);

    // 7. System User Accounts map
    const accountsMap: Record<string, UserAccountRecord> = {};
    for (const acc of INITIAL_USER_ACCOUNTS) {
      accountsMap[acc.username.toLowerCase()] = acc;
    }
    await set(ref(db, 'systemAccounts'), accountsMap);

    console.log('Successfully seeded all initial datasets to Firebase Realtime Database.');
  } catch (err) {
    console.error('Error seeding initial data to Realtime Database:', err);
    handleDatabaseError(err, OperationType.WRITE, 'root');
  }
}

// Backward compatibility alias
export const seedSampleDataToFirestore = seedSampleDataToDatabase;

// Seed initial collections if database is empty
export async function seedInitialDataIfEmpty() {
  try {
    const snap = await get(ref(db, 'projects'));
    if (!snap.exists() || !snap.val() || Object.keys(snap.val()).length === 0) {
      console.log('Realtime Database is empty. Auto-seeding initial waterproofing data...');
      await seedSampleDataToDatabase();
    }
  } catch (err) {
    console.warn('Could not check/seed empty Realtime Database:', err);
  }
}

// Clear all data in Firebase Realtime Database
export async function clearAllDatabaseData() {
  const nodes = ['projects', 'materials', 'exportedGoods', 'laborLogs', 'staff'];
  for (const node of nodes) {
    try {
      await remove(ref(db, node));
    } catch (err) {
      console.warn(`Error clearing Realtime Database node ${node}:`, err);
    }
  }
}

// Real-time Database subscribers using onValue
export function subscribeProjects(onData: (projects: ConstructionProject[]) => void): Unsubscribe {
  const projectsRef = ref(db, 'projects');
  return onValue(
    projectsRef,
    (snap) => {
      const list = rtdbToList<ConstructionProject>(snap.val());
      onData(list);
    },
    (err) => {
      handleDatabaseError(err, OperationType.LIST, 'projects');
    }
  );
}

export function subscribeMaterials(onData: (materials: MaterialItem[]) => void): Unsubscribe {
  const materialsRef = ref(db, 'materials');
  return onValue(
    materialsRef,
    (snap) => {
      const list = rtdbToList<MaterialItem>(snap.val());
      onData(list);
    },
    (err) => {
      handleDatabaseError(err, OperationType.LIST, 'materials');
    }
  );
}

export function subscribeExportedGoods(onData: (goods: ExportedGood[]) => void): Unsubscribe {
  const exportsRef = ref(db, 'exportedGoods');
  return onValue(
    exportsRef,
    (snap) => {
      const list = rtdbToList<ExportedGood>(snap.val());
      onData(list);
    },
    (err) => {
      handleDatabaseError(err, OperationType.LIST, 'exportedGoods');
    }
  );
}

export function subscribeLaborLogs(onData: (logs: LaborDailyLog[]) => void): Unsubscribe {
  const laborRef = ref(db, 'laborLogs');
  return onValue(
    laborRef,
    (snap) => {
      const list = rtdbToList<LaborDailyLog>(snap.val());
      onData(list);
    },
    (err) => {
      handleDatabaseError(err, OperationType.LIST, 'laborLogs');
    }
  );
}

export function subscribeStaff(onData: (staff: StaffMember[]) => void): Unsubscribe {
  const staffRef = ref(db, 'staff');
  return onValue(
    staffRef,
    (snap) => {
      const list = rtdbToList<StaffMember>(snap.val());
      onData(list);
    },
    (err) => {
      handleDatabaseError(err, OperationType.LIST, 'staff');
    }
  );
}

// Data Mutation Functions
export async function addProjectToDatabase(project: ConstructionProject) {
  try {
    await set(ref(db, `projects/${project.id}`), project);
  } catch (err) {
    handleDatabaseError(err, OperationType.CREATE, `projects/${project.id}`);
  }
}
export const addProjectToFirestore = addProjectToDatabase;

export async function updateProjectInDatabase(project: ConstructionProject) {
  try {
    await update(ref(db, `projects/${project.id}`), project as any);
  } catch (err) {
    handleDatabaseError(err, OperationType.UPDATE, `projects/${project.id}`);
  }
}
export const updateProjectInFirestore = updateProjectInDatabase;

export async function deleteProjectFromDatabase(projectId: string) {
  try {
    await remove(ref(db, `projects/${projectId}`));
  } catch (err) {
    handleDatabaseError(err, OperationType.DELETE, `projects/${projectId}`);
  }
}
export const deleteProjectFromFirestore = deleteProjectFromDatabase;

export async function addMaterialToDatabase(material: MaterialItem) {
  try {
    await set(ref(db, `materials/${material.id}`), material);
  } catch (err) {
    handleDatabaseError(err, OperationType.CREATE, `materials/${material.id}`);
  }
}
export const addMaterialToFirestore = addMaterialToDatabase;

export async function deleteMaterialFromDatabase(materialId: string) {
  try {
    await remove(ref(db, `materials/${materialId}`));
  } catch (err) {
    handleDatabaseError(err, OperationType.DELETE, `materials/${materialId}`);
  }
}
export const deleteMaterialFromFirestore = deleteMaterialFromDatabase;

export async function addExportedGoodToDatabase(good: ExportedGood) {
  try {
    await set(ref(db, `exportedGoods/${good.id}`), good);
  } catch (err) {
    handleDatabaseError(err, OperationType.CREATE, `exportedGoods/${good.id}`);
  }
}
export const addExportedGoodToFirestore = addExportedGoodToDatabase;

export async function addLaborLogToDatabase(log: LaborDailyLog) {
  try {
    const id = `log_${Date.now()}`;
    await set(ref(db, `laborLogs/${id}`), log);
  } catch (err) {
    handleDatabaseError(err, OperationType.CREATE, 'laborLogs');
  }
}
export const addLaborLogToFirestore = addLaborLogToDatabase;

export async function addStaffToDatabase(staff: StaffMember) {
  try {
    await set(ref(db, `staff/${staff.id}`), staff);
  } catch (err) {
    handleDatabaseError(err, OperationType.CREATE, `staff/${staff.id}`);
  }
}
export const addStaffToFirestore = addStaffToDatabase;

export async function deleteStaffFromDatabase(staffId: string) {
  try {
    await remove(ref(db, `staff/${staffId}`));
  } catch (err) {
    handleDatabaseError(err, OperationType.DELETE, `staff/${staffId}`);
  }
}
export const deleteStaffFromFirestore = deleteStaffFromDatabase;

// Company Settings (Organization profile & Custom Logo)
export function subscribeCompanySettings(onData: (settings: CompanySettings) => void): Unsubscribe {
  const companyRef = ref(db, 'systemConfig/company');
  return onValue(
    companyRef,
    (snap) => {
      if (snap.exists() && snap.val()) {
        onData(snap.val() as CompanySettings);
      }
    },
    (err) => {
      handleDatabaseError(err, OperationType.GET, 'systemConfig/company');
    }
  );
}

export async function saveCompanySettingsToDatabase(settings: CompanySettings) {
  try {
    await set(ref(db, 'systemConfig/company'), settings);
  } catch (err) {
    handleDatabaseError(err, OperationType.WRITE, 'systemConfig/company');
  }
}
export const saveCompanySettingsToFirestore = saveCompanySettingsToDatabase;

// System User Accounts Management
export function subscribeUserAccounts(onData: (accounts: UserAccountRecord[]) => void): Unsubscribe {
  const accountsRef = ref(db, 'systemAccounts');
  return onValue(
    accountsRef,
    (snap) => {
      if (snap.exists() && snap.val()) {
        const list = rtdbToList<UserAccountRecord>(snap.val());
        onData(list);
      } else {
        onData(INITIAL_USER_ACCOUNTS);
      }
    },
    (err) => {
      handleDatabaseError(err, OperationType.LIST, 'systemAccounts');
      onData(INITIAL_USER_ACCOUNTS);
    }
  );
}

export async function saveUserAccountToDatabase(account: UserAccountRecord) {
  try {
    const key = account.username.trim().toLowerCase();
    await set(ref(db, `systemAccounts/${key}`), account);
  } catch (err) {
    handleDatabaseError(err, OperationType.WRITE, `systemAccounts/${account.username}`);
  }
}

export async function deleteUserAccountFromDatabase(username: string) {
  try {
    const key = username.trim().toLowerCase();
    await remove(ref(db, `systemAccounts/${key}`));
  } catch (err) {
    handleDatabaseError(err, OperationType.DELETE, `systemAccounts/${username}`);
  }
}

// ----------------------------------------------------
// Login Activity / History Tracking on Realtime Database
// ----------------------------------------------------
export function subscribeLoginHistory(onData: (history: LoginHistoryRecord[]) => void): Unsubscribe {
  const historyRef = ref(db, 'loginHistory');
  return onValue(
    historyRef,
    (snap) => {
      if (snap.exists() && snap.val()) {
        const list = rtdbToList<LoginHistoryRecord>(snap.val());
        // Sort newest first
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        onData(list);
      } else {
        onData([]);
      }
    },
    (err) => {
      handleDatabaseError(err, OperationType.LIST, 'loginHistory');
      onData([]);
    }
  );
}

export async function recordLoginHistoryToDatabase(log: LoginHistoryRecord) {
  try {
    const logId = log.id || `LOG-${Date.now()}`;
    await set(ref(db, `loginHistory/${logId}`), {
      ...log,
      id: logId,
    });

    // Also update lastLoginAt on the account record in systemAccounts
    const userKey = log.username.trim().toLowerCase();
    const accountRef = ref(db, `systemAccounts/${userKey}`);
    const snap = await get(accountRef);
    if (snap.exists()) {
      await update(accountRef, {
        lastLoginAt: log.timeFormatted,
      });
    } else {
      // If not yet saved in systemAccounts, write basic account
      await set(accountRef, {
        username: log.username,
        name: log.name,
        role: log.role,
        orgId: log.orgId,
        lastLoginAt: log.timeFormatted,
        createdAt: log.timeFormatted,
      });
    }
  } catch (err) {
    handleDatabaseError(err, OperationType.WRITE, `loginHistory/${log.id}`);
  }
}

export async function clearLoginHistoryFromDatabase() {
  try {
    await remove(ref(db, 'loginHistory'));
  } catch (err) {
    handleDatabaseError(err, OperationType.DELETE, 'loginHistory');
  }
}


