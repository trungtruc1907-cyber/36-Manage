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
  ActivityLog,
  TenantOrganization,
} from './types';
import {
  DEFAULT_COMPANY_SETTINGS,
  INITIAL_EXPORTED_GOODS,
  INITIAL_LABOR_LOGS,
  INITIAL_MATERIALS,
  INITIAL_PROJECTS,
  INITIAL_STAFF,
  INITIAL_ACTIVITY_LOGS,
} from './data/mockData';

export const DEFAULT_TENANT_ID = 'standalone';

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
    permissions: {
      canViewMaterialCost: true,
      canExportExcel: true,
      canViewAllActivityLogs: true,
      canChangeBrandLogo: true,
      canEditCompanyInfo: true,
      canViewUserList: true,
    },
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
    permissions: {
      canViewMaterialCost: true,
      canExportExcel: true,
      canViewAllActivityLogs: false,
      canChangeBrandLogo: false,
      canEditCompanyInfo: false,
      canViewUserList: true,
    },
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
    permissions: {
      canViewMaterialCost: false,
      canExportExcel: true,
      canViewAllActivityLogs: false,
      canChangeBrandLogo: false,
      canEditCompanyInfo: false,
      canViewUserList: true,
    },
  },
];

// Firebase configuration with Realtime Database URL
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

// Helper to clean data before writing to Firebase RTDB (removes undefined values)
function cleanForDatabase<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
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

// ============================================================================
// Database Architecture Initialization & Seamless Migration
// ============================================================================

/**
 * Initializes the standalone database schema.
 * Ensures system accounts and company settings exist without pushing any sample/demo data.
 */
export async function initializeDatabaseArchitecture(): Promise<void> {
  try {
    // 1. Ensure system accounts are initialized if not yet existing
    const accountsSnap = await get(ref(db, 'systemAccounts'));
    if (!accountsSnap.exists() || !accountsSnap.val()) {
      const accountsMap: Record<string, UserAccountRecord> = {};
      INITIAL_USER_ACCOUNTS.forEach((acc) => {
        accountsMap[acc.username.toLowerCase()] = acc;
      });
      await set(ref(db, 'systemAccounts'), accountsMap);
    }

    // 2. Ensure company settings exist if not yet existing
    const settingsSnap = await get(ref(db, 'companySettings'));
    if (!settingsSnap.exists() || !settingsSnap.val()) {
      await set(ref(db, 'companySettings'), cleanForDatabase(DEFAULT_COMPANY_SETTINGS));
    }

    // 3. Remove old multi-tenant nodes if present
    await remove(ref(db, 'tenants')).catch(() => {});
  } catch (err) {
    console.warn('Note during database initialization:', err);
  }
}

// Backward compatibility alias
export const initializeMultiTenantArchitecture = initializeDatabaseArchitecture;

// ============================================================================
// Standalone Business Data Subscriptions
// ============================================================================

export function subscribeProjects(
  onData: (projects: ConstructionProject[]) => void,
  _ignoredTenantId?: string
): Unsubscribe {
  const targetRef = ref(db, 'projects');
  return onValue(
    targetRef,
    (snap) => {
      const list = rtdbToList<ConstructionProject>(snap.val());
      // Sort by creation time descending if available
      list.sort((a, b) => (b.createdAtTimestamp || 0) - (a.createdAtTimestamp || 0));
      onData(list);
    },
    (err) => {
      handleDatabaseError(err, OperationType.LIST, 'projects');
    }
  );
}

export function subscribeMaterials(
  onData: (materials: MaterialItem[]) => void,
  _ignoredTenantId?: string
): Unsubscribe {
  const targetRef = ref(db, 'materials');
  return onValue(
    targetRef,
    (snap) => {
      const list = rtdbToList<MaterialItem>(snap.val());
      onData(list);
    },
    (err) => {
      handleDatabaseError(err, OperationType.LIST, 'materials');
    }
  );
}

export function subscribeExportedGoods(
  onData: (goods: ExportedGood[]) => void,
  _ignoredTenantId?: string
): Unsubscribe {
  const targetRef = ref(db, 'exportedGoods');
  return onValue(
    targetRef,
    (snap) => {
      const list = rtdbToList<ExportedGood>(snap.val());
      onData(list);
    },
    (err) => {
      handleDatabaseError(err, OperationType.LIST, 'exportedGoods');
    }
  );
}

export function subscribeLaborLogs(
  onData: (logs: LaborDailyLog[]) => void,
  _ignoredTenantId?: string
): Unsubscribe {
  const targetRef = ref(db, 'laborLogs');
  return onValue(
    targetRef,
    (snap) => {
      const list = rtdbToList<LaborDailyLog>(snap.val());
      onData(list);
    },
    (err) => {
      handleDatabaseError(err, OperationType.LIST, 'laborLogs');
    }
  );
}

export function subscribeStaff(
  onData: (staff: StaffMember[]) => void,
  _ignoredTenantId?: string
): Unsubscribe {
  const targetRef = ref(db, 'staff');
  return onValue(
    targetRef,
    (snap) => {
      const list = rtdbToList<StaffMember>(snap.val());
      onData(list);
    },
    (err) => {
      handleDatabaseError(err, OperationType.LIST, 'staff');
    }
  );
}

// Company Settings Subscription
export function subscribeCompanySettings(
  onData: (settings: CompanySettings) => void,
  _ignoredTenantId?: string
): Unsubscribe {
  const targetRef = ref(db, 'companySettings');
  return onValue(
    targetRef,
    (snap) => {
      if (snap.exists() && snap.val()) {
        onData(snap.val() as CompanySettings);
      } else {
        onData(DEFAULT_COMPANY_SETTINGS);
      }
    },
    (err) => {
      handleDatabaseError(err, OperationType.GET, 'companySettings');
      onData(DEFAULT_COMPANY_SETTINGS);
    }
  );
}

export async function saveCompanySettingsToDatabase(
  settings: CompanySettings,
  _ignoredTenantId?: string
) {
  try {
    const cleanPayload = cleanForDatabase(settings);
    await set(ref(db, 'companySettings'), cleanPayload);
  } catch (err) {
    handleDatabaseError(err, OperationType.WRITE, 'companySettings');
    throw err;
  }
}
export const saveCompanySettingsToFirestore = saveCompanySettingsToDatabase;

// ============================================================================
// Standalone Data Mutations (CRUD)
// ============================================================================

export async function addProjectToDatabase(
  project: ConstructionProject,
  _ignoredTenantId?: string
) {
  try {
    const cleanPayload = cleanForDatabase(project);
    await set(ref(db, `projects/${project.id}`), cleanPayload);
  } catch (err) {
    handleDatabaseError(err, OperationType.CREATE, `projects/${project.id}`);
    throw err;
  }
}
export const addProjectToFirestore = addProjectToDatabase;

export async function updateProjectInDatabase(
  project: ConstructionProject,
  _ignoredTenantId?: string
) {
  try {
    const cleanPayload = cleanForDatabase(project);
    await set(ref(db, `projects/${project.id}`), cleanPayload);
  } catch (err) {
    handleDatabaseError(err, OperationType.UPDATE, `projects/${project.id}`);
    throw err;
  }
}
export const updateProjectInFirestore = updateProjectInDatabase;

export async function deleteProjectFromDatabase(
  projectId: string,
  _ignoredTenantId?: string
) {
  try {
    await remove(ref(db, `projects/${projectId}`));
  } catch (err) {
    handleDatabaseError(err, OperationType.DELETE, `projects/${projectId}`);
    throw err;
  }
}
export const deleteProjectFromFirestore = deleteProjectFromDatabase;

export async function addMaterialToDatabase(
  material: MaterialItem,
  _ignoredTenantId?: string
) {
  try {
    const cleanPayload = cleanForDatabase(material);
    await set(ref(db, `materials/${material.id}`), cleanPayload);
  } catch (err) {
    handleDatabaseError(err, OperationType.CREATE, `materials/${material.id}`);
    throw err;
  }
}
export const addMaterialToFirestore = addMaterialToDatabase;

export async function updateMaterialInDatabase(
  material: MaterialItem,
  _ignoredTenantId?: string
) {
  try {
    const cleanPayload = cleanForDatabase(material);
    await set(ref(db, `materials/${material.id}`), cleanPayload);
  } catch (err) {
    handleDatabaseError(err, OperationType.UPDATE, `materials/${material.id}`);
    throw err;
  }
}
export const updateMaterialInFirestore = updateMaterialInDatabase;

export async function batchSaveMaterialsToDatabase(
  materialsList: MaterialItem[],
  _ignoredTenantId?: string
) {
  try {
    const updates: Record<string, MaterialItem> = {};
    for (const mat of materialsList) {
      updates[`materials/${mat.id}`] = cleanForDatabase(mat);
    }
    await update(ref(db), updates);
  } catch (err) {
    handleDatabaseError(err, OperationType.WRITE, 'materials');
    throw err;
  }
}
export const batchSaveMaterialsToFirestore = batchSaveMaterialsToDatabase;

export async function deleteMaterialFromDatabase(
  materialId: string,
  _ignoredTenantId?: string
) {
  try {
    await remove(ref(db, `materials/${materialId}`));
  } catch (err) {
    handleDatabaseError(err, OperationType.DELETE, `materials/${materialId}`);
    throw err;
  }
}
export const deleteMaterialFromFirestore = deleteMaterialFromDatabase;

export async function addExportedGoodToDatabase(
  good: ExportedGood,
  _ignoredTenantId?: string
) {
  try {
    const cleanPayload = cleanForDatabase(good);
    await set(ref(db, `exportedGoods/${good.id}`), cleanPayload);
  } catch (err) {
    handleDatabaseError(err, OperationType.CREATE, `exportedGoods/${good.id}`);
    throw err;
  }
}
export const addExportedGoodToFirestore = addExportedGoodToDatabase;

export async function updateExportedGoodInDatabase(
  good: ExportedGood,
  _ignoredTenantId?: string
) {
  try {
    const cleanPayload = cleanForDatabase(good);
    await set(ref(db, `exportedGoods/${good.id}`), cleanPayload);
  } catch (err) {
    handleDatabaseError(err, OperationType.UPDATE, `exportedGoods/${good.id}`);
    throw err;
  }
}
export const updateExportedGoodToFirestore = updateExportedGoodInDatabase;
export const updateExportedGoodInFirestore = updateExportedGoodInDatabase;

export async function deleteExportedGoodFromDatabase(
  goodId: string,
  _ignoredTenantId?: string
) {
  try {
    await remove(ref(db, `exportedGoods/${goodId}`));
  } catch (err) {
    handleDatabaseError(err, OperationType.DELETE, `exportedGoods/${goodId}`);
    throw err;
  }
}
export const deleteExportedGoodFromFirestore = deleteExportedGoodFromDatabase;

export async function addLaborLogToDatabase(
  log: LaborDailyLog,
  _ignoredTenantId?: string
) {
  try {
    const id = log.id || `log_${Date.now()}`;
    const cleanPayload = cleanForDatabase({ ...log, id });
    await set(ref(db, `laborLogs/${id}`), cleanPayload);
  } catch (err) {
    handleDatabaseError(err, OperationType.CREATE, 'laborLogs');
    throw err;
  }
}
export const addLaborLogToFirestore = addLaborLogToDatabase;

export async function updateLaborLogToDatabase(
  log: LaborDailyLog,
  _ignoredTenantId?: string
) {
  try {
    const id = log.id || `log_${Date.now()}`;
    const cleanPayload = cleanForDatabase({ ...log, id });
    await set(ref(db, `laborLogs/${id}`), cleanPayload);
  } catch (err) {
    handleDatabaseError(err, OperationType.UPDATE, `laborLogs/${log.id}`);
    throw err;
  }
}
export const updateLaborLogToFirestore = updateLaborLogToDatabase;

export async function deleteLaborLogFromDatabase(
  logId: string,
  _ignoredTenantId?: string
) {
  try {
    await remove(ref(db, `laborLogs/${logId}`));
  } catch (err) {
    handleDatabaseError(err, OperationType.DELETE, `laborLogs/${logId}`);
    throw err;
  }
}
export const deleteLaborLogFromFirestore = deleteLaborLogFromDatabase;

export async function addStaffToDatabase(
  staff: StaffMember,
  _ignoredTenantId?: string
) {
  try {
    const cleanPayload = cleanForDatabase(staff);
    await set(ref(db, `staff/${staff.id}`), cleanPayload);
  } catch (err) {
    handleDatabaseError(err, OperationType.CREATE, `staff/${staff.id}`);
    throw err;
  }
}
export const addStaffToFirestore = addStaffToDatabase;

export async function deleteStaffFromDatabase(
  staffId: string,
  _ignoredTenantId?: string
) {
  try {
    await remove(ref(db, `staff/${staffId}`));
  } catch (err) {
    handleDatabaseError(err, OperationType.DELETE, `staff/${staffId}`);
    throw err;
  }
}
export const deleteStaffFromFirestore = deleteStaffFromDatabase;

// Clear all business data from standalone Realtime Database
export async function clearAllDatabaseData(_ignoredTenantId?: string) {
  const nodes = ['projects', 'materials', 'exportedGoods', 'laborLogs', 'staff', 'activityLogs', 'tenants'];
  for (const node of nodes) {
    try {
      await remove(ref(db, node));
    } catch (err) {
      console.warn(`Error clearing Realtime Database node ${node}:`, err);
    }
  }
}

/**
 * Restores the 6 core business data branches to Firebase Realtime Database:
 * 1. projects/: Danh mục công trình thi công, tiến độ và chi phí xuất kho.
 * 2. materials/: Kho vật tư, định mức tồn kho và giá vốn/giá bán.
 * 3. exportedGoods/: Lịch sử các phiếu xuất kho vật tư theo công trình.
 * 4. laborLogs/: Nhật ký chấm công nhân sự theo chuẩn định dạng ngày tháng dd/mm/yyyy.
 * 5. staff/: Danh sách cán bộ kỹ thuật, giám sát và đội thợ thi công.
 * 6. activityLogs/: Lịch sử hoạt động và nhật ký kiểm toán hệ thống.
 */
export async function restoreAllCoreDataBranchesToDatabase(
  _ignoredTenantId?: string,
  _prefix: string = 'CT'
): Promise<void> {
  try {
    // 1. projects/
    const projectsMap: Record<string, ConstructionProject> = {};
    for (const p of INITIAL_PROJECTS) {
      projectsMap[p.id] = p;
    }
    await set(ref(db, 'projects'), projectsMap);

    // 2. materials/
    const materialsMap: Record<string, MaterialItem> = {};
    for (const m of INITIAL_MATERIALS) {
      materialsMap[m.id] = m;
    }
    await set(ref(db, 'materials'), materialsMap);

    // 3. exportedGoods/
    const exportsMap: Record<string, ExportedGood> = {};
    for (const e of INITIAL_EXPORTED_GOODS) {
      exportsMap[e.id] = e;
    }
    await set(ref(db, 'exportedGoods'), exportsMap);

    // 4. laborLogs/ (định dạng ngày tháng dd/mm/yyyy)
    const laborMap: Record<string, LaborDailyLog> = {};
    for (let i = 0; i < INITIAL_LABOR_LOGS.length; i++) {
      const log = INITIAL_LABOR_LOGS[i];
      const id = log.id || `log_${i + 1}`;
      laborMap[id] = { ...log, id };
    }
    await set(ref(db, 'laborLogs'), laborMap);

    // 5. staff/
    const staffMap: Record<string, StaffMember> = {};
    for (const s of INITIAL_STAFF) {
      staffMap[s.id] = s;
    }
    await set(ref(db, 'staff'), staffMap);

    // 6. activityLogs/
    const logsMap: Record<string, ActivityLog> = {};
    for (const a of INITIAL_ACTIVITY_LOGS) {
      logsMap[a.id] = a;
    }
    await set(ref(db, 'activityLogs'), logsMap);

    console.log('Successfully restored all 6 core data branches to standalone database.');
  } catch (err) {
    console.error('Error restoring core data branches:', err);
    handleDatabaseError(err, OperationType.WRITE, 'root');
  }
}

// Backward compatibility aliases
export const seedSampleDataToDatabase = restoreAllCoreDataBranchesToDatabase;
export const seedSampleDataToFirestore = restoreAllCoreDataBranchesToDatabase;

// Purge demo records from standalone database if ever needed
export async function purgeAllDemoDataFromDatabase() {
  try {
    const nodes = ['projects', 'materials', 'exportedGoods', 'laborLogs', 'staff', 'activityLogs', 'tenants'];
    for (const node of nodes) {
      await remove(ref(db, node)).catch(() => {});
    }
    console.log('All demo business data has been purged successfully.');
  } catch (err) {
    console.warn('Note during demo data purge:', err);
  }
}

// ============================================================================
// User Accounts & Authentication Subscriptions
// ============================================================================

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
    const key = (account?.username || '').trim().toLowerCase();
    if (!key) return;
    await set(ref(db, `systemAccounts/${key}`), cleanForDatabase(account));
  } catch (err) {
    handleDatabaseError(err, OperationType.WRITE, `systemAccounts/${account.username}`);
  }
}

export async function deleteUserAccountFromDatabase(username: string) {
  try {
    const key = (username || '').trim().toLowerCase();
    if (!key) return;
    await remove(ref(db, `systemAccounts/${key}`));
  } catch (err) {
    handleDatabaseError(err, OperationType.DELETE, `systemAccounts/${username}`);
  }
}

// ============================================================================
// Login History Tracking
// ============================================================================

export function subscribeLoginHistory(onData: (history: LoginHistoryRecord[]) => void): Unsubscribe {
  const historyRef = ref(db, 'loginHistory');
  return onValue(
    historyRef,
    (snap) => {
      if (snap.exists() && snap.val()) {
        const list = rtdbToList<LoginHistoryRecord>(snap.val());
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
    await set(ref(db, `loginHistory/${logId}`), cleanForDatabase({
      ...log,
      id: logId,
    }));

    const userKey = (log?.username || '').trim().toLowerCase();
    if (userKey) {
      const accountRef = ref(db, `systemAccounts/${userKey}`);
      const snap = await get(accountRef);
      if (snap.exists()) {
        await update(accountRef, {
          lastLoginAt: log.timeFormatted,
        });
      }
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

// ============================================================================
// Standalone Activity / Audit Logs Tracking
// ============================================================================

export function subscribeActivityLogs(
  onData: (logs: ActivityLog[]) => void,
  _ignoredTenantId?: string
): Unsubscribe {
  const logsRef = ref(db, 'activityLogs');
  return onValue(
    logsRef,
    (snap) => {
      if (snap.exists() && snap.val()) {
        const list = rtdbToList<ActivityLog>(snap.val());
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        onData(list);
      } else {
        onData([]);
      }
    },
    (err) => {
      handleDatabaseError(err, OperationType.LIST, 'activityLogs');
      onData([]);
    }
  );
}

export async function recordActivityLogToDatabase(
  log: ActivityLog,
  _ignoredTenantId?: string
) {
  try {
    const logId = log.id || `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await set(ref(db, `activityLogs/${logId}`), cleanForDatabase({
      ...log,
      id: logId,
    }));
  } catch (err) {
    handleDatabaseError(err, OperationType.WRITE, `activityLogs/${log.id}`);
  }
}

export async function clearActivityLogsFromDatabase(_ignoredTenantId?: string) {
  try {
    await remove(ref(db, 'activityLogs'));
  } catch (err) {
    handleDatabaseError(err, OperationType.DELETE, 'activityLogs');
  }
}

// Backward compatibility helper
export function subscribeTenants(onData: (tenants: TenantOrganization[]) => void): Unsubscribe {
  onData([]);
  return () => {};
}
export async function saveTenantToDatabase(_tenant: TenantOrganization) {}
export async function deleteTenantFromDatabase(_tenantId: string) {}
export async function registerNewTenantWithDatabase(
  _tenantData: any,
  _accountData: any
): Promise<any> {
  return null;
}
