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
  INITIAL_TENANTS,
} from './data/mockData';

export const DEFAULT_TENANT_ID = 'tenant_ct36';

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
    allowedTenants: ['tenant_ct36', 'tenant_hanoi', 'tenant_hcm'],
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
    allowedTenants: ['tenant_ct36'],
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
    allowedTenants: ['tenant_ct36'],
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
// Multi-Tenant Management Functions
// ============================================================================

/**
 * Subscribe to the list of all registered tenants / companies / branches
 */
export function subscribeTenants(onData: (tenants: TenantOrganization[]) => void): Unsubscribe {
  const tenantsRef = ref(db, 'tenantsList');
  return onValue(
    tenantsRef,
    (snap) => {
      if (snap.exists() && snap.val()) {
        const list = rtdbToList<TenantOrganization>(snap.val());
        onData(list);
      } else {
        onData(INITIAL_TENANTS);
      }
    },
    (err) => {
      handleDatabaseError(err, OperationType.LIST, 'tenantsList');
      onData(INITIAL_TENANTS);
    }
  );
}

/**
 * Save / Update a Tenant organization profile
 */
export async function saveTenantToDatabase(tenant: TenantOrganization) {
  try {
    const cleanPayload = cleanForDatabase(tenant);
    await set(ref(db, `tenantsList/${tenant.id}`), cleanPayload);
    // Also sync tenant info into tenants/{tenantId}/info
    await set(ref(db, `tenants/${tenant.id}/info`), cleanPayload);
  } catch (err) {
    handleDatabaseError(err, OperationType.WRITE, `tenantsList/${tenant.id}`);
    throw err;
  }
}
export const saveTenantToFirestore = saveTenantToDatabase;

/**
 * Delete / Archive a Tenant organization (and its data)
 */
export async function deleteTenantFromDatabase(tenantId: string) {
  try {
    if (tenantId === DEFAULT_TENANT_ID) {
      throw new Error('Không thể xóa đơn vị / chi nhánh gốc mặc định của hệ thống.');
    }
    await remove(ref(db, `tenantsList/${tenantId}`));
    await remove(ref(db, `tenants/${tenantId}`));
  } catch (err) {
    handleDatabaseError(err, OperationType.DELETE, `tenantsList/${tenantId}`);
    throw err;
  }
}
export const deleteTenantFromFirestore = deleteTenantFromDatabase;

/**
 * Register a brand new Tenant Organization with full initial database schema & admin account
 */
export async function registerNewTenantWithDatabase(
  tenantData: {
    code: string;
    name: string;
    brandName?: string;
    tagline?: string;
    phone?: string;
    email?: string;
    address?: string;
    taxCode?: string;
    customLogoUrl?: string | null;
  },
  accountData: {
    username: string;
    password?: string;
    name: string;
    phone?: string;
    email?: string;
  }
): Promise<{ tenant: TenantOrganization; user: UserAccountRecord }> {
  const cleanCode = tenantData.code.trim().toUpperCase();
  const cleanUsername = accountData.username.trim().toLowerCase();
  const tenantId = `tenant_${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
  
  const createdDateStr = new Date().toLocaleDateString('vi-VN');
  
  const newTenant: TenantOrganization = {
    id: tenantId,
    code: cleanCode,
    name: tenantData.name.trim(),
    brandName: tenantData.brandName?.trim() || tenantData.name.trim(),
    tagline: tenantData.tagline?.trim() || 'Hệ thống Quản lý Thi công & Vật tư Chống thấm Chuyên nghiệp',
    phone: tenantData.phone?.trim() || '',
    email: tenantData.email?.trim() || '',
    address: tenantData.address?.trim() || '',
    taxCode: tenantData.taxCode?.trim() || '',
    customLogoUrl: tenantData.customLogoUrl || null,
    status: 'active',
    isDefault: false,
    createdBy: cleanUsername,
    ownerUsername: cleanUsername,
    createdAt: createdDateStr,
  };

  // 1. Save Tenant metadata
  await saveTenantToDatabase(newTenant);

  // 2. Initialize Company Settings for this new tenant
  const initialCompanySettings: CompanySettings = {
    orgId: cleanCode,
    orgName: newTenant.name,
    brandName: newTenant.brandName || newTenant.name,
    tagline: newTenant.tagline || '',
    phone: newTenant.phone || '',
    email: newTenant.email || '',
    address: newTenant.address || '',
    taxCode: newTenant.taxCode || '',
    customLogoUrl: newTenant.customLogoUrl || null,
    tenantId: tenantId,
  };
  await set(ref(db, `tenants/${tenantId}/settings`), cleanForDatabase(initialCompanySettings));

  // 3. Seed structured standard database (materials, template projects, staff, labor)
  await seedSampleDataToDatabase(tenantId, cleanCode);

  // 4. Create initial Admin User Account restricted specifically to this new Tenant
  const newAccount: UserAccountRecord = {
    username: cleanUsername,
    password: accountData.password || '123456',
    name: accountData.name.trim(),
    role: 'admin',
    orgId: cleanCode,
    orgName: newTenant.name,
    phone: accountData.phone?.trim() || newTenant.phone,
    email: accountData.email?.trim() || newTenant.email,
    allowedTenants: [tenantId],
    isTenantOwner: true,
    createdTenantId: tenantId,
    createdAt: createdDateStr,
  };

  await saveUserAccountToDatabase(newAccount);

  // 5. Record initial activity log for the new tenant
  const now = new Date();
  const timeFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  
  const initLog: ActivityLog = {
    id: `ACT-INIT-${Date.now()}`,
    tenantId,
    tenantName: newTenant.name,
    category: 'tenant',
    action: 'Khởi tạo Doanh nghiệp',
    title: 'Kích hoạt không gian Doanh nghiệp mới',
    description: `Khởi tạo thành công cơ sở dữ liệu riêng biệt cho ${newTenant.name} (${cleanCode}) bởi ${newAccount.name}`,
    userName: newAccount.name,
    userRole: 'admin',
    timestamp: Date.now(),
    timeFormatted,
    status: 'success',
  };
  await recordActivityLogToDatabase(initLog, tenantId);

  return { tenant: newTenant, user: newAccount };
}


/**
 * Initialize Multi-Tenant architecture and seed default tenants & migrate legacy data if needed
 */
export async function initializeMultiTenantArchitecture(): Promise<void> {
  try {
    // 1. Check if tenantsList exists
    const tenantsListSnap = await get(ref(db, 'tenantsList'));
    if (!tenantsListSnap.exists() || !tenantsListSnap.val()) {
      const initialMap: Record<string, TenantOrganization> = {};
      INITIAL_TENANTS.forEach((t) => {
        initialMap[t.id] = t;
      });
      await set(ref(db, 'tenantsList'), initialMap);
    }

    // 2. Check if primary tenant CT36 has data; if not, check legacy root and migrate seamlessly
    const primaryTenantProjects = await get(ref(db, `tenants/${DEFAULT_TENANT_ID}/projects`));
    if (!primaryTenantProjects.exists() || !primaryTenantProjects.val()) {
      const legacyProjectsSnap = await get(ref(db, 'projects'));
      if (legacyProjectsSnap.exists() && legacyProjectsSnap.val()) {
        // Migrate legacy projects, materials, exportedGoods, laborLogs, staff
        const legacyProjects = legacyProjectsSnap.val();
        await set(ref(db, `tenants/${DEFAULT_TENANT_ID}/projects`), legacyProjects);

        const legacyMaterials = await get(ref(db, 'materials'));
        if (legacyMaterials.exists()) {
          await set(ref(db, `tenants/${DEFAULT_TENANT_ID}/materials`), legacyMaterials.val());
        }

        const legacyExports = await get(ref(db, 'exportedGoods'));
        if (legacyExports.exists()) {
          await set(ref(db, `tenants/${DEFAULT_TENANT_ID}/exportedGoods`), legacyExports.val());
        }

        const legacyLabor = await get(ref(db, 'laborLogs'));
        if (legacyLabor.exists()) {
          await set(ref(db, `tenants/${DEFAULT_TENANT_ID}/laborLogs`), legacyLabor.val());
        }

        const legacyStaff = await get(ref(db, 'staff'));
        if (legacyStaff.exists()) {
          await set(ref(db, `tenants/${DEFAULT_TENANT_ID}/staff`), legacyStaff.val());
        }

        const legacySettings = await get(ref(db, 'systemConfig/company'));
        if (legacySettings.exists()) {
          await set(ref(db, `tenants/${DEFAULT_TENANT_ID}/settings`), legacySettings.val());
        }
      } else {
        // Seed initial sample data into default tenant CT36
        await seedSampleDataToDatabase(DEFAULT_TENANT_ID);
      }
    }

    // 3. Populate secondary tenant sample data (Hà Nội, Miền Nam) if empty
    const hnProjects = await get(ref(db, 'tenants/tenant_hanoi/projects'));
    if (!hnProjects.exists() || !hnProjects.val()) {
      await seedSampleDataToDatabase('tenant_hanoi', 'HN');
    }

    const hcmProjects = await get(ref(db, 'tenants/tenant_hcm/projects'));
    if (!hcmProjects.exists() || !hcmProjects.val()) {
      await seedSampleDataToDatabase('tenant_hcm', 'MN');
    }
  } catch (err) {
    console.warn('Note during multi-tenant initialization:', err);
  }
}

// ============================================================================
// Multi-Tenant Business Data Subscriptions
// ============================================================================

export function subscribeProjects(
  onData: (projects: ConstructionProject[]) => void,
  tenantId: string = DEFAULT_TENANT_ID
): Unsubscribe {
  const targetRef = ref(db, `tenants/${tenantId}/projects`);
  return onValue(
    targetRef,
    (snap) => {
      const list = rtdbToList<ConstructionProject>(snap.val());
      onData(list);
    },
    (err) => {
      handleDatabaseError(err, OperationType.LIST, `tenants/${tenantId}/projects`);
    }
  );
}

export function subscribeMaterials(
  onData: (materials: MaterialItem[]) => void,
  tenantId: string = DEFAULT_TENANT_ID
): Unsubscribe {
  const targetRef = ref(db, `tenants/${tenantId}/materials`);
  return onValue(
    targetRef,
    (snap) => {
      const list = rtdbToList<MaterialItem>(snap.val());
      onData(list);
    },
    (err) => {
      handleDatabaseError(err, OperationType.LIST, `tenants/${tenantId}/materials`);
    }
  );
}

export function subscribeExportedGoods(
  onData: (goods: ExportedGood[]) => void,
  tenantId: string = DEFAULT_TENANT_ID
): Unsubscribe {
  const targetRef = ref(db, `tenants/${tenantId}/exportedGoods`);
  return onValue(
    targetRef,
    (snap) => {
      const list = rtdbToList<ExportedGood>(snap.val());
      onData(list);
    },
    (err) => {
      handleDatabaseError(err, OperationType.LIST, `tenants/${tenantId}/exportedGoods`);
    }
  );
}

export function subscribeLaborLogs(
  onData: (logs: LaborDailyLog[]) => void,
  tenantId: string = DEFAULT_TENANT_ID
): Unsubscribe {
  const targetRef = ref(db, `tenants/${tenantId}/laborLogs`);
  return onValue(
    targetRef,
    (snap) => {
      const list = rtdbToList<LaborDailyLog>(snap.val());
      onData(list);
    },
    (err) => {
      handleDatabaseError(err, OperationType.LIST, `tenants/${tenantId}/laborLogs`);
    }
  );
}

export function subscribeStaff(
  onData: (staff: StaffMember[]) => void,
  tenantId: string = DEFAULT_TENANT_ID
): Unsubscribe {
  const targetRef = ref(db, `tenants/${tenantId}/staff`);
  return onValue(
    targetRef,
    (snap) => {
      const list = rtdbToList<StaffMember>(snap.val());
      onData(list);
    },
    (err) => {
      handleDatabaseError(err, OperationType.LIST, `tenants/${tenantId}/staff`);
    }
  );
}

// Company / Tenant Settings
export function subscribeCompanySettings(
  onData: (settings: CompanySettings) => void,
  tenantId: string = DEFAULT_TENANT_ID
): Unsubscribe {
  const targetRef = ref(db, `tenants/${tenantId}/settings`);
  return onValue(
    targetRef,
    (snap) => {
      if (snap.exists() && snap.val()) {
        onData(snap.val() as CompanySettings);
      } else {
        // Fallback: look up in tenantsList
        get(ref(db, `tenantsList/${tenantId}`)).then((tSnap) => {
          if (tSnap.exists() && tSnap.val()) {
            const t = tSnap.val() as TenantOrganization;
            onData({
              orgId: t.code,
              orgName: t.name,
              brandName: t.brandName || t.name,
              tagline: t.tagline || DEFAULT_COMPANY_SETTINGS.tagline,
              phone: t.phone || DEFAULT_COMPANY_SETTINGS.phone,
              email: t.email || DEFAULT_COMPANY_SETTINGS.email,
              address: t.address || DEFAULT_COMPANY_SETTINGS.address,
              taxCode: t.taxCode || DEFAULT_COMPANY_SETTINGS.taxCode,
              customLogoUrl: t.customLogoUrl || null,
              tenantId: t.id,
            });
          } else {
            onData(DEFAULT_COMPANY_SETTINGS);
          }
        });
      }
    },
    (err) => {
      handleDatabaseError(err, OperationType.GET, `tenants/${tenantId}/settings`);
    }
  );
}

export async function saveCompanySettingsToDatabase(
  settings: CompanySettings,
  tenantId: string = DEFAULT_TENANT_ID
) {
  try {
    const cleanPayload = cleanForDatabase({ ...settings, tenantId });
    await set(ref(db, `tenants/${tenantId}/settings`), cleanPayload);
    // Also update matching field in tenantsList if present
    const tRef = ref(db, `tenantsList/${tenantId}`);
    const tSnap = await get(tRef);
    if (tSnap.exists()) {
      await update(tRef, {
        name: settings.orgName,
        brandName: settings.brandName,
        tagline: settings.tagline,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        taxCode: settings.taxCode,
        customLogoUrl: settings.customLogoUrl,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    handleDatabaseError(err, OperationType.WRITE, `tenants/${tenantId}/settings`);
    throw err;
  }
}
export const saveCompanySettingsToFirestore = saveCompanySettingsToDatabase;

// ============================================================================
// Multi-Tenant Data Mutations
// ============================================================================

export async function addProjectToDatabase(
  project: ConstructionProject,
  tenantId: string = DEFAULT_TENANT_ID
) {
  try {
    const cleanPayload = cleanForDatabase({ ...project, tenantId });
    await set(ref(db, `tenants/${tenantId}/projects/${project.id}`), cleanPayload);
  } catch (err) {
    handleDatabaseError(err, OperationType.CREATE, `tenants/${tenantId}/projects/${project.id}`);
    throw err;
  }
}
export const addProjectToFirestore = addProjectToDatabase;

export async function updateProjectInDatabase(
  project: ConstructionProject,
  tenantId: string = DEFAULT_TENANT_ID
) {
  try {
    const cleanPayload = cleanForDatabase({ ...project, tenantId });
    await set(ref(db, `tenants/${tenantId}/projects/${project.id}`), cleanPayload);
  } catch (err) {
    handleDatabaseError(err, OperationType.UPDATE, `tenants/${tenantId}/projects/${project.id}`);
    throw err;
  }
}
export const updateProjectInFirestore = updateProjectInDatabase;

export async function deleteProjectFromDatabase(
  projectId: string,
  tenantId: string = DEFAULT_TENANT_ID
) {
  try {
    await remove(ref(db, `tenants/${tenantId}/projects/${projectId}`));
  } catch (err) {
    handleDatabaseError(err, OperationType.DELETE, `tenants/${tenantId}/projects/${projectId}`);
    throw err;
  }
}
export const deleteProjectFromFirestore = deleteProjectFromDatabase;

export async function addMaterialToDatabase(
  material: MaterialItem,
  tenantId: string = DEFAULT_TENANT_ID
) {
  try {
    const cleanPayload = cleanForDatabase({ ...material, tenantId });
    await set(ref(db, `tenants/${tenantId}/materials/${material.id}`), cleanPayload);
  } catch (err) {
    handleDatabaseError(err, OperationType.CREATE, `tenants/${tenantId}/materials/${material.id}`);
    throw err;
  }
}
export const addMaterialToFirestore = addMaterialToDatabase;

export async function updateMaterialInDatabase(
  material: MaterialItem,
  tenantId: string = DEFAULT_TENANT_ID
) {
  try {
    const cleanPayload = cleanForDatabase({ ...material, tenantId });
    await set(ref(db, `tenants/${tenantId}/materials/${material.id}`), cleanPayload);
  } catch (err) {
    handleDatabaseError(err, OperationType.UPDATE, `tenants/${tenantId}/materials/${material.id}`);
    throw err;
  }
}
export const updateMaterialInFirestore = updateMaterialInDatabase;

export async function batchSaveMaterialsToDatabase(
  materialsList: MaterialItem[],
  tenantId: string = DEFAULT_TENANT_ID
) {
  try {
    const updates: Record<string, MaterialItem> = {};
    for (const mat of materialsList) {
      updates[`tenants/${tenantId}/materials/${mat.id}`] = cleanForDatabase({ ...mat, tenantId });
    }
    await update(ref(db), updates);
  } catch (err) {
    handleDatabaseError(err, OperationType.WRITE, `tenants/${tenantId}/materials`);
    throw err;
  }
}
export const batchSaveMaterialsToFirestore = batchSaveMaterialsToDatabase;

export async function deleteMaterialFromDatabase(
  materialId: string,
  tenantId: string = DEFAULT_TENANT_ID
) {
  try {
    await remove(ref(db, `tenants/${tenantId}/materials/${materialId}`));
  } catch (err) {
    handleDatabaseError(err, OperationType.DELETE, `tenants/${tenantId}/materials/${materialId}`);
    throw err;
  }
}
export const deleteMaterialFromFirestore = deleteMaterialFromDatabase;

export async function addExportedGoodToDatabase(
  good: ExportedGood,
  tenantId: string = DEFAULT_TENANT_ID
) {
  try {
    const cleanPayload = cleanForDatabase({ ...good, tenantId });
    await set(ref(db, `tenants/${tenantId}/exportedGoods/${good.id}`), cleanPayload);
  } catch (err) {
    handleDatabaseError(err, OperationType.CREATE, `tenants/${tenantId}/exportedGoods/${good.id}`);
    throw err;
  }
}
export const addExportedGoodToFirestore = addExportedGoodToDatabase;

export async function updateExportedGoodInDatabase(
  good: ExportedGood,
  tenantId: string = DEFAULT_TENANT_ID
) {
  try {
    const cleanPayload = cleanForDatabase({ ...good, tenantId });
    await set(ref(db, `tenants/${tenantId}/exportedGoods/${good.id}`), cleanPayload);
  } catch (err) {
    handleDatabaseError(err, OperationType.UPDATE, `tenants/${tenantId}/exportedGoods/${good.id}`);
    throw err;
  }
}
export const updateExportedGoodToFirestore = updateExportedGoodInDatabase;
export const updateExportedGoodInFirestore = updateExportedGoodInDatabase;

export async function deleteExportedGoodFromDatabase(
  goodId: string,
  tenantId: string = DEFAULT_TENANT_ID
) {
  try {
    await remove(ref(db, `tenants/${tenantId}/exportedGoods/${goodId}`));
  } catch (err) {
    handleDatabaseError(err, OperationType.DELETE, `tenants/${tenantId}/exportedGoods/${goodId}`);
    throw err;
  }
}
export const deleteExportedGoodFromFirestore = deleteExportedGoodFromDatabase;

export async function addLaborLogToDatabase(
  log: LaborDailyLog,
  tenantId: string = DEFAULT_TENANT_ID
) {
  try {
    const id = log.id || `log_${Date.now()}`;
    const cleanPayload = cleanForDatabase({ ...log, id, tenantId });
    await set(ref(db, `tenants/${tenantId}/laborLogs/${id}`), cleanPayload);
  } catch (err) {
    handleDatabaseError(err, OperationType.CREATE, `tenants/${tenantId}/laborLogs`);
    throw err;
  }
}
export const addLaborLogToFirestore = addLaborLogToDatabase;

export async function updateLaborLogToDatabase(
  log: LaborDailyLog,
  tenantId: string = DEFAULT_TENANT_ID
) {
  try {
    const id = log.id || `log_${Date.now()}`;
    const cleanPayload = cleanForDatabase({ ...log, id, tenantId });
    await set(ref(db, `tenants/${tenantId}/laborLogs/${id}`), cleanPayload);
  } catch (err) {
    handleDatabaseError(err, OperationType.UPDATE, `tenants/${tenantId}/laborLogs/${log.id}`);
    throw err;
  }
}
export const updateLaborLogToFirestore = updateLaborLogToDatabase;

export async function deleteLaborLogFromDatabase(
  logId: string,
  tenantId: string = DEFAULT_TENANT_ID
) {
  try {
    await remove(ref(db, `tenants/${tenantId}/laborLogs/${logId}`));
  } catch (err) {
    handleDatabaseError(err, OperationType.DELETE, `tenants/${tenantId}/laborLogs/${logId}`);
    throw err;
  }
}
export const deleteLaborLogFromFirestore = deleteLaborLogFromDatabase;

export async function addStaffToDatabase(
  staff: StaffMember,
  tenantId: string = DEFAULT_TENANT_ID
) {
  try {
    const cleanPayload = cleanForDatabase({ ...staff, tenantId });
    await set(ref(db, `tenants/${tenantId}/staff/${staff.id}`), cleanPayload);
  } catch (err) {
    handleDatabaseError(err, OperationType.CREATE, `tenants/${tenantId}/staff/${staff.id}`);
    throw err;
  }
}
export const addStaffToFirestore = addStaffToDatabase;

export async function deleteStaffFromDatabase(
  staffId: string,
  tenantId: string = DEFAULT_TENANT_ID
) {
  try {
    await remove(ref(db, `tenants/${tenantId}/staff/${staffId}`));
  } catch (err) {
    handleDatabaseError(err, OperationType.DELETE, `tenants/${tenantId}/staff/${staffId}`);
    throw err;
  }
}
export const deleteStaffFromFirestore = deleteStaffFromDatabase;

// Clear all business data for a specific Tenant in Firebase Realtime Database
export async function clearAllDatabaseData(tenantId: string = DEFAULT_TENANT_ID) {
  const nodes = ['projects', 'materials', 'exportedGoods', 'laborLogs', 'staff', 'activityLogs'];
  for (const node of nodes) {
    try {
      await remove(ref(db, `tenants/${tenantId}/${node}`));
    } catch (err) {
      console.warn(`Error clearing Realtime Database node tenants/${tenantId}/${node}:`, err);
    }
  }
}

// Seed sample initial data into a specific Tenant in Firebase Realtime Database
export async function seedSampleDataToDatabase(
  tenantId: string = DEFAULT_TENANT_ID,
  prefix: string = 'CT'
) {
  try {
    // 1. Projects map
    const projectsMap: Record<string, ConstructionProject> = {};
    for (const p of INITIAL_PROJECTS) {
      const id = `${p.id}_${tenantId}`;
      const code = p.code.replace('CT-', `${prefix}-`);
      projectsMap[id] = {
        ...p,
        id,
        code,
        name: prefix === 'CT' ? p.name : `[${prefix}] ${p.name}`,
        tenantId,
      };
    }
    await set(ref(db, `tenants/${tenantId}/projects`), projectsMap);

    // 2. Materials map
    const materialsMap: Record<string, MaterialItem> = {};
    for (const m of INITIAL_MATERIALS) {
      const id = `${m.id}_${tenantId}`;
      materialsMap[id] = {
        ...m,
        id,
        tenantId,
      };
    }
    await set(ref(db, `tenants/${tenantId}/materials`), materialsMap);

    // 3. Exported Goods map
    const exportsMap: Record<string, ExportedGood> = {};
    for (const e of INITIAL_EXPORTED_GOODS) {
      const id = `${e.id}_${tenantId}`;
      exportsMap[id] = {
        ...e,
        id,
        projectCode: e.projectCode.replace('CT-', `${prefix}-`),
        tenantId,
      };
    }
    await set(ref(db, `tenants/${tenantId}/exportedGoods`), exportsMap);

    // 4. Labor Logs map
    const laborMap: Record<string, LaborDailyLog> = {};
    for (let i = 0; i < INITIAL_LABOR_LOGS.length; i++) {
      const log = INITIAL_LABOR_LOGS[i];
      const id = `log_${tenantId}_${i + 1}`;
      laborMap[id] = {
        ...log,
        id,
        projectCode: (log.projectCode || 'CT-01').replace('CT-', `${prefix}-`),
        tenantId,
      };
    }
    await set(ref(db, `tenants/${tenantId}/laborLogs`), laborMap);

    // 5. Staff map
    const staffMap: Record<string, StaffMember> = {};
    for (const s of INITIAL_STAFF) {
      const id = `${s.id}_${tenantId}`;
      staffMap[id] = {
        ...s,
        id,
        tenantId,
      };
    }
    await set(ref(db, `tenants/${tenantId}/staff`), staffMap);

    console.log(`Successfully seeded dataset for tenant [${tenantId}].`);
  } catch (err) {
    console.error(`Error seeding data for tenant [${tenantId}]:`, err);
    handleDatabaseError(err, OperationType.WRITE, `tenants/${tenantId}`);
  }
}
export const seedSampleDataToFirestore = seedSampleDataToDatabase;

// Purge all legacy demo data records from Firebase Realtime Database
export async function purgeAllDemoDataFromDatabase() {
  try {
    const demoProjectIds = [
      'proj_muongthanh_01',
      'proj_vincom_02',
      'proj_flc_03',
      'proj_hopluc_04',
      'proj_eurowindow_05',
      'proj_foxconn_06',
    ];
    for (const id of demoProjectIds) {
      await remove(ref(db, `projects/${id}`)).catch(() => {});
    }

    const demoMatIds = [
      'mat_sikatop107',
      'mat_neomax201',
      'mat_mangbitum4mm',
      'mat_sikagrout214',
      'mat_sikadur731',
      'mat_sikalatexth',
      'mat_quicseal104s',
      'mat_hyperseal25lm',
      'mat_mariseal250',
      'mat_sikawaterbarv20',
      'mat_luoithuytinh140',
      'mat_foamchemfixpu',
    ];
    for (const id of demoMatIds) {
      await remove(ref(db, `materials/${id}`)).catch(() => {});
    }

    const demoExpIds = [
      'exp_001',
      'exp_002',
      'exp_003',
      'exp_004',
      'exp_005',
      'exp_006',
      'exp_007',
      'exp_008',
    ];
    for (const id of demoExpIds) {
      await remove(ref(db, `exportedGoods/${id}`)).catch(() => {});
    }

    const demoStaffIds = [
      'staff_hung_01',
      'staff_tuan_02',
      'staff_nam_03',
      'staff_hai_04',
      'staff_quang_05',
      'staff_minh_06',
    ];
    for (const id of demoStaffIds) {
      await remove(ref(db, `staff/${id}`)).catch(() => {});
    }

    for (let i = 1; i <= 20; i++) {
      await remove(ref(db, `laborLogs/log_sample_${i}`)).catch(() => {});
    }
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
    const key = account.username.trim().toLowerCase();
    await set(ref(db, `systemAccounts/${key}`), cleanForDatabase(account));
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

    const userKey = log.username.trim().toLowerCase();
    const accountRef = ref(db, `systemAccounts/${userKey}`);
    const snap = await get(accountRef);
    if (snap.exists()) {
      await update(accountRef, {
        lastLoginAt: log.timeFormatted,
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

// ============================================================================
// Activity / Audit Logs Tracking (Scoped per Tenant or Global)
// ============================================================================

export function subscribeActivityLogs(
  onData: (logs: ActivityLog[]) => void,
  tenantId: string = DEFAULT_TENANT_ID
): Unsubscribe {
  const logsRef = ref(db, `tenants/${tenantId}/activityLogs`);
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
      handleDatabaseError(err, OperationType.LIST, `tenants/${tenantId}/activityLogs`);
      onData([]);
    }
  );
}

export async function recordActivityLogToDatabase(
  log: ActivityLog,
  tenantId: string = DEFAULT_TENANT_ID
) {
  try {
    const logId = log.id || `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await set(ref(db, `tenants/${tenantId}/activityLogs/${logId}`), cleanForDatabase({
      ...log,
      id: logId,
      tenantId,
    }));
  } catch (err) {
    handleDatabaseError(err, OperationType.WRITE, `tenants/${tenantId}/activityLogs/${log.id}`);
  }
}

export async function clearActivityLogsFromDatabase(tenantId: string = DEFAULT_TENANT_ID) {
  try {
    await remove(ref(db, `tenants/${tenantId}/activityLogs`));
  } catch (err) {
    handleDatabaseError(err, OperationType.DELETE, `tenants/${tenantId}/activityLogs`);
  }
}
