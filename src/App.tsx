import React, { useState, useEffect } from 'react';
import {
  Menu,
  LogIn,
  CheckCircle,
  Bell,
  User as UserIcon,
  Database,
  Shield,
  LogOut,
  ChevronDown,
  Building2,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  DEFAULT_COMPANY_SETTINGS,
  INITIAL_EXPORTED_GOODS,
  INITIAL_LABOR_LOGS,
  INITIAL_MATERIALS,
  INITIAL_PROJECTS,
  INITIAL_STAFF,
  INITIAL_TENANTS,
} from './data/mockData';
import {
  CompanySettings,
  ConstructionProject,
  ExportedGood,
  LaborDailyLog,
  MaterialItem,
  StaffMember,
  TenantOrganization,
  UserAccount,
  UserAccountRecord,
  LoginHistoryRecord,
  ActivityLog,
} from './types';
import {
  testFirestoreConnection,
  subscribeTenants,
  subscribeProjects,
  subscribeMaterials,
  subscribeExportedGoods,
  subscribeLaborLogs,
  subscribeStaff,
  subscribeCompanySettings,
  subscribeUserAccounts,
  subscribeLoginHistory,
  subscribeActivityLogs,
  recordLoginHistoryToDatabase,
  clearLoginHistoryFromDatabase,
  recordActivityLogToDatabase,
  clearActivityLogsFromDatabase,
  saveCompanySettingsToFirestore,
  saveUserAccountToDatabase,
  deleteUserAccountFromDatabase,
  addProjectToFirestore,
  updateProjectInFirestore,
  deleteProjectFromFirestore,
  addMaterialToFirestore,
  updateMaterialInFirestore,
  batchSaveMaterialsToFirestore,
  deleteMaterialFromFirestore,
  addExportedGoodToFirestore,
  updateExportedGoodInFirestore,
  deleteExportedGoodFromFirestore,
  addLaborLogToFirestore,
  updateLaborLogToFirestore,
  deleteLaborLogFromFirestore,
  addStaffToFirestore,
  deleteStaffFromFirestore,
  clearAllDatabaseData,
  purgeAllDemoDataFromDatabase,
  seedSampleDataToFirestore,
  initializeMultiTenantArchitecture,
  registerNewTenantWithDatabase,
  DEFAULT_TENANT_ID,
  INITIAL_USER_ACCOUNTS,
} from './firebase';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ProjectsView } from './components/ProjectsView';
import { MaterialsView } from './components/MaterialsView';
import { StaffView } from './components/StaffView';
import { SettingsView } from './components/SettingsView';
import { NewProjectModal } from './components/NewProjectModal';
import { NewExportModal } from './components/NewExportModal';
import { LaborDetailModal } from './components/LaborDetailModal';
import { SupportModal } from './components/SupportModal';
import { ActivityLogsModal } from './components/ActivityLogsModal';
import { normalizeDateToDDMMYYYY } from './utils/dateUtils';

export default function App() {
  // Multi-Tenant State
  const [tenants, setTenants] = useState<TenantOrganization[]>(INITIAL_TENANTS);
  const [activeTenantId, setActiveTenantId] = useState<string>(() => {
    return localStorage.getItem('chongtham36_active_tenant_id') || DEFAULT_TENANT_ID;
  });

  // Authentication state - restore remember-me session if present, else null
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const savedUser = localStorage.getItem('chongtham36_active_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser) as UserAccount;
      } catch {
        return null;
      }
    }
    return null;
  });

  // System user accounts list
  const [accounts, setAccounts] = useState<UserAccountRecord[]>(INITIAL_USER_ACCOUNTS);

  // Login Activity History list from Firestore
  const [loginHistory, setLoginHistory] = useState<LoginHistoryRecord[]>([]);

  // Application User Activity / Audit Logs from Realtime Database
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isActivityLogsOpen, setIsActivityLogsOpen] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core business data states - scoped by active tenant
  const [exportedGoods, setExportedGoods] = useState<ExportedGood[]>([]);
  const [laborLogs, setLaborLogs] = useState<LaborDailyLog[]>([]);
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem('chongtham36_company_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_COMPANY_SETTINGS;
      }
    }
    return DEFAULT_COMPANY_SETTINGS;
  });
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  // Modals state
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ConstructionProject | null>(null);
  const [isNewExportOpen, setIsNewExportOpen] = useState(false);
  const [exportInitialProject, setExportInitialProject] = useState<string | undefined>(undefined);
  const [exportInitialMaterialId, setExportInitialMaterialId] = useState<string | undefined>(undefined);
  const [isLaborDetailOpen, setIsLaborDetailOpen] = useState(false);
  const [laborInitialProject, setLaborInitialProject] = useState<string | undefined>(undefined);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Switch Active Tenant
  const handleSelectTenant = (tenantId: string) => {
    // Check user permission if logged in
    if (currentUser) {
      const isSuperAdmin =
        currentUser.username.toLowerCase() === 'admin' &&
        (currentUser.orgId?.toUpperCase() === 'CT36' || currentUser.allowedTenants?.includes('*'));

      if (!isSuperAdmin) {
        const targetTenant = tenants.find((t) => t.id === tenantId);
        const targetCode = targetTenant?.code?.toUpperCase();
        const userOrg = (currentUser.orgId || '').toUpperCase();
        const allowedList = currentUser.allowedTenants || [];

        const isAllowed =
          tenantId === currentUser.createdTenantId ||
          userOrg === targetCode ||
          allowedList.includes(tenantId) ||
          (targetCode && allowedList.includes(targetCode));

        if (!isAllowed) {
          showToast(
            `⛔ Bạn không có quyền truy cập vào doanh nghiệp "${targetTenant?.name || tenantId}". Tài khoản của bạn chỉ thuộc về ${currentUser.orgName || currentUser.orgId}!`
          );
          return;
        }
      }
    }

    setActiveTenantId(tenantId);
    localStorage.setItem('chongtham36_active_tenant_id', tenantId);

    // Update companySettings preview according to tenant
    const selectedTenant = tenants.find((t) => t.id === tenantId);
    if (selectedTenant) {
      setCompanySettings((prev) => ({
        ...prev,
        tenantId: selectedTenant.id,
        orgId: selectedTenant.code,
        orgName: selectedTenant.name,
        brandName: selectedTenant.brandName || selectedTenant.name,
        phone: selectedTenant.phone || prev.phone,
        email: selectedTenant.email || prev.email,
        address: selectedTenant.address || prev.address,
        tagline: selectedTenant.tagline || prev.tagline,
      }));
    }
  };

  // Initialize Multi-Tenant Architecture & Test Connection once on mount
  useEffect(() => {
    testFirestoreConnection().then((connected) => {
      setIsFirebaseConnected(connected);
    });

    initializeMultiTenantArchitecture();

    // Subscribe to all available tenants list
    const unsubTenants = subscribeTenants((data) => {
      if (data && data.length > 0) {
        setTenants(data);
      }
    });

    // Global Accounts & Login History subscriptions
    const unsubAccounts = subscribeUserAccounts((data) => {
      if (data && data.length > 0) {
        setAccounts(data);
        setCurrentUser((curr) => {
          if (!curr) return null;
          const fresh = data.find((a) => a.username.toLowerCase() === curr.username.toLowerCase());
          if (fresh) {
            const updated = {
              ...curr,
              name: fresh.name || curr.name,
              role: fresh.role || curr.role,
              orgId: fresh.orgId || curr.orgId,
              orgName: fresh.orgName || curr.orgName,
              permissions: fresh.permissions || curr.permissions,
            };
            try {
              localStorage.setItem('chongtham36_active_user', JSON.stringify(updated));
            } catch {}
            return updated;
          }
          return curr;
        });
      }
    });

    const unsubLoginHistory = subscribeLoginHistory((data) => {
      if (data) {
        setLoginHistory(data);
      }
    });

    return () => {
      unsubTenants();
      unsubAccounts();
      unsubLoginHistory();
    };
  }, []);

  // Multi-Tenant Scoped Subscriptions: Re-subscribe whenever activeTenantId changes
  useEffect(() => {
    if (!activeTenantId) return;

    // Subscribe to tenant-scoped collections in real-time
    const unsubProjects = subscribeProjects((data) => {
      setProjects(data || []);
    }, activeTenantId);

    const unsubMaterials = subscribeMaterials((data) => {
      setMaterials(data || []);
    }, activeTenantId);

    const unsubExports = subscribeExportedGoods((data) => {
      setExportedGoods(data || []);
    }, activeTenantId);

    const unsubLabor = subscribeLaborLogs((data) => {
      setLaborLogs(data || []);
    }, activeTenantId);

    const unsubStaff = subscribeStaff((data) => {
      setStaff(data || []);
    }, activeTenantId);

    const unsubCompanySettings = subscribeCompanySettings((data) => {
      if (data) {
        setCompanySettings(data);
        localStorage.setItem('chongtham36_company_settings', JSON.stringify(data));
      }
    }, activeTenantId);

    const unsubActivityLogs = subscribeActivityLogs((data) => {
      if (data) {
        setActivityLogs(data);
      }
    }, activeTenantId);

    return () => {
      unsubProjects();
      unsubMaterials();
      unsubExports();
      unsubLabor();
      unsubStaff();
      unsubCompanySettings();
      unsubActivityLogs();
    };
  }, [activeTenantId]);

  // Helper to record user activities to Realtime Database scoped by active tenant
  const logUserAction = async (
    category: 'project' | 'export' | 'labor' | 'material' | 'staff' | 'auth' | 'settings',
    action: string,
    title: string,
    description: string
  ) => {
    const now = new Date();
    const timeFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newLog: ActivityLog = {
      id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category,
      action,
      title,
      description,
      userName: currentUser?.name || 'Quản Trị Viên (Admin)',
      userRole: currentUser?.role || 'admin',
      tenantId: activeTenantId,
      timestamp: Date.now(),
      timeFormatted,
      status: 'success',
    };

    setActivityLogs((prev) => [newLog, ...prev]);
    await recordActivityLogToDatabase(newLog, activeTenantId);
  };

  const handleClearActivityLogs = async () => {
    await clearActivityLogsFromDatabase(activeTenantId);
    setActivityLogs([]);
    showToast('Đã xóa toàn bộ lịch sử thao tác của đơn vị hiện tại trên Realtime Database!');
  };

  // Handlers
  const handleUpdateCompanySettings = async (newSettings: CompanySettings) => {
    const scopedSettings: CompanySettings = {
      ...newSettings,
      tenantId: activeTenantId,
    };
    setCompanySettings(scopedSettings);
    localStorage.setItem('chongtham36_company_settings', JSON.stringify(scopedSettings));
    await saveCompanySettingsToFirestore(scopedSettings, activeTenantId);
    await logUserAction('settings', 'Cập nhật cấu hình', 'Thiết lập doanh nghiệp', `Cập nhật thông tin chi nhánh ${scopedSettings.brandName} (${scopedSettings.orgName})`);
    showToast('Đã lưu cấu hình doanh nghiệp và logo thành công!');
  };

  const handleLoginSuccess = async (user: UserAccount) => {
    setCurrentUser(user);
    setActiveTab('dashboard');

    // If user's org matches a tenant, switch to it automatically
    const matchedTenant = tenants.find(
      (t) => t.code.toUpperCase() === user.orgId.toUpperCase() || t.id === user.orgId
    );
    if (matchedTenant) {
      handleSelectTenant(matchedTenant.id);
    }

    // Format device / browser info
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Browser';
    let device = 'Máy tính (Desktop)';
    if (/mobile|android|iphone|ipad|tablet/i.test(userAgent)) {
      device = 'Điện thoại / Di động';
    }

    const now = new Date();
    const timeFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const loginRecord: LoginHistoryRecord = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username: user.username,
      name: user.name,
      role: user.role,
      orgId: user.orgId,
      timestamp: Date.now(),
      timeFormatted,
      status: 'success',
      userAgent: userAgent.substring(0, 150),
      device,
      notes: 'Đăng nhập hệ thống thành công',
    };

    // Save login log to Firebase Realtime Database
    await recordLoginHistoryToDatabase(loginRecord);
    await logUserAction('auth', 'Đăng nhập', `Đăng nhập (${user.username})`, `Tài khoản ${user.name} (${user.role}) đăng nhập thành công vào ${user.orgId}`);
    showToast(`Chào mừng ${user.name} - Đăng nhập ${user.orgId} thành công!`);
  };

  const handleLogout = () => {
    logUserAction('auth', 'Đăng xuất', 'Đăng xuất hệ thống', `Người dùng ${currentUser?.name || ''} đã đăng xuất`);
    setCurrentUser(null);
    localStorage.removeItem('chongtham36_active_user');
    showToast('Đã đăng xuất khỏi hệ thống');
  };

  const handleClearLoginHistory = async () => {
    await clearLoginHistoryFromDatabase();
    setLoginHistory([]);
    showToast('Đã xóa toàn bộ nhật ký đăng nhập trên Realtime Database!');
  };

  const handleRegisterAccount = async (newAccount: UserAccountRecord) => {
    setAccounts((prev) => [...prev.filter((a) => a.username !== newAccount.username), newAccount]);
    await saveUserAccountToDatabase(newAccount);
    await logUserAction('auth', 'Tạo tài khoản', newAccount.username, `Tạo mới tài khoản "${newAccount.name}" với vai trò ${newAccount.role}`);
    showToast(`Đã tạo tài khoản "${newAccount.name}" (${newAccount.username}) thành công!`);
  };

  const handleRegisterNewEnterprise = async (
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
  ) => {
    const result = await registerNewTenantWithDatabase(tenantData, accountData);
    setTenants((prev) => {
      const exists = prev.some((t) => t.id === result.tenant.id);
      return exists ? prev.map((t) => (t.id === result.tenant.id ? result.tenant : t)) : [...prev, result.tenant];
    });
    setAccounts((prev) => [...prev.filter((a) => a.username !== result.user.username), result.user]);
    setActiveTenantId(result.tenant.id);
    localStorage.setItem('chongtham36_active_tenant_id', result.tenant.id);
    showToast(`Đã khởi tạo thành công không gian dữ liệu riêng cho Doanh nghiệp ${result.tenant.name} (${result.tenant.code})!`);
    return result;
  };

  const handleSaveAccount = async (account: UserAccountRecord) => {
    setAccounts((prev) => [...prev.filter((a) => a.username !== account.username), account]);
    await saveUserAccountToDatabase(account);
    await logUserAction('auth', 'Sửa tài khoản', account.username, `Cập nhật thông tin tài khoản "${account.name}"`);
    showToast(`Đã cập nhật thông tin tài khoản "${account.name}"!`);
  };

  const handleDeleteAccount = async (username: string) => {
    setAccounts((prev) => prev.filter((a) => a.username !== username));
    await deleteUserAccountFromDatabase(username);
    await logUserAction('auth', 'Xóa tài khoản', username, `Đã xóa tài khoản ${username} khỏi hệ thống`);
    showToast(`Đã xóa tài khoản "${username}" khỏi hệ thống!`);
  };

  const handleSaveProject = async (proj: ConstructionProject) => {
    const isExisting = projects.some((p) => p.id === proj.id);
    const now = new Date();
    const existingProj = isExisting ? projects.find((p) => p.id === proj.id) : null;
    
    const scopedProject: ConstructionProject = {
      ...proj,
      tenantId: activeTenantId,
      createdAt: proj.createdAt || existingProj?.createdAt || now.toISOString(),
      createdAtTimestamp: proj.createdAtTimestamp || existingProj?.createdAtTimestamp || Date.now(),
      updatedAt: now.toISOString(),
    };

    if (isExisting) {
      setProjects((prev) => prev.map((p) => (p.id === scopedProject.id ? scopedProject : p)));
      await updateProjectInFirestore(scopedProject, activeTenantId);
      await logUserAction('project', 'Cập nhật công trình', scopedProject.name, `Cập nhật thông tin công trình ${scopedProject.code} - ${scopedProject.name}, đối tác: ${scopedProject.partner || 'Chủ đầu tư'}`);
      showToast(`Đã cập nhật công trình "${scopedProject.name}" lên Realtime Database`);
    } else {
      setProjects((prev) => [scopedProject, ...prev]);
      await addProjectToFirestore(scopedProject, activeTenantId);
      await logUserAction('project', 'Tạo công trình', scopedProject.name, `Khởi tạo công trình mới ${scopedProject.code} - ${scopedProject.name}, địa chỉ: ${scopedProject.address}`);
      showToast(`Đã lưu công trình mới "${scopedProject.name}" lên Realtime Database`);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const deletedProj = projects.find((p) => p.id === projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    await deleteProjectFromFirestore(projectId, activeTenantId);
    await logUserAction('project', 'Xóa công trình', deletedProj?.name || projectId, `Đã xóa công trình ${deletedProj ? `${deletedProj.code} - ${deletedProj.name}` : projectId}`);
    showToast('Đã xóa công trình khỏi Realtime Database');
  };

  const handleAddMaterial = async (newMat: MaterialItem) => {
    const scopedMat: MaterialItem = {
      ...newMat,
      tenantId: activeTenantId,
    };
    setMaterials((prev) => [scopedMat, ...prev]);
    await addMaterialToFirestore(scopedMat, activeTenantId);
    await logUserAction('material', 'Thêm vật tư', scopedMat.name, `Thêm mới mặt hàng ${scopedMat.code} - ${scopedMat.name}, tồn kho: ${scopedMat.stockQty} ${scopedMat.unit}`);
    showToast(`Đã lưu vật tư "${scopedMat.name}" lên Realtime Database`);
  };

  const handleUpdateMaterial = async (updatedMat: MaterialItem) => {
    const scopedMat: MaterialItem = {
      ...updatedMat,
      tenantId: activeTenantId,
    };
    setMaterials((prev) => prev.map((m) => (m.id === scopedMat.id ? scopedMat : m)));
    await updateMaterialInFirestore(scopedMat, activeTenantId);
    await logUserAction('material', 'Cập nhật vật tư', scopedMat.name, `Cập nhật thông tin hàng hóa ${scopedMat.code} - ${scopedMat.name}, giá bán: ${new Intl.NumberFormat('vi-VN').format(scopedMat.price || scopedMat.defaultPrice)} đ`);
    showToast(`Đã cập nhật vật tư "${scopedMat.name}" trên Realtime Database`);
  };

  const handleBatchSaveMaterials = async (newMaterialsList: MaterialItem[]) => {
    const scopedList = newMaterialsList.map((m) => ({ ...m, tenantId: activeTenantId }));
    setMaterials(scopedList);
    await batchSaveMaterialsToFirestore(scopedList, activeTenantId);
    await logUserAction('material', 'Đồng bộ vật tư', 'Nhập danh mục', `Đã đồng bộ ${scopedList.length} mặt hàng vào danh mục kho`);
    showToast(`Đã đồng bộ ${scopedList.length} mặt hàng lên Realtime Database`);
  };

  const handleDeleteMaterial = async (materialId: string) => {
    const deletedMat = materials.find((m) => m.id === materialId);
    setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    await deleteMaterialFromFirestore(materialId, activeTenantId);
    await logUserAction('material', 'Xóa vật tư', deletedMat?.name || materialId, `Đã xóa mặt hàng ${deletedMat ? `${deletedMat.code} - ${deletedMat.name}` : materialId} khỏi kho`);
    showToast('Đã xóa vật tư khỏi Realtime Database');
  };

  const handleAddExport = async (newExp: ExportedGood) => {
    const scopedExp: ExportedGood = {
      ...newExp,
      tenantId: activeTenantId,
    };

    // 1. Add export record
    setExportedGoods((prev) => [scopedExp, ...prev]);
    await addExportedGoodToFirestore(scopedExp, activeTenantId);

    // 2. Deduct material stock in Database
    const targetMat = materials.find((m) => m.name === scopedExp.materialName);
    if (targetMat) {
      const updatedMat: MaterialItem = {
        ...targetMat,
        stockQty: Math.max(0, targetMat.stockQty - scopedExp.quantity),
        tenantId: activeTenantId,
      };
      setMaterials((prev) => prev.map((m) => (m.id === targetMat.id ? updatedMat : m)));
      await addMaterialToFirestore(updatedMat, activeTenantId);
    }

    // 3. Update project totalExportsValue in Database
    const targetProj = projects.find((p) => p.name === scopedExp.projectName);
    if (targetProj) {
      const updatedProj: ConstructionProject = {
        ...targetProj,
        totalExportsValue: targetProj.totalExportsValue + scopedExp.totalPrice,
        tenantId: activeTenantId,
      };
      setProjects((prev) => prev.map((p) => (p.id === targetProj.id ? updatedProj : p)));
      await addProjectToFirestore(updatedProj, activeTenantId);
    }

    await logUserAction(
      'export',
      'Xuất kho',
      scopedExp.materialName,
      `Xuất ${scopedExp.quantity} ${scopedExp.unit} "${scopedExp.materialName}" cho công trình "${scopedExp.projectName}" (Trị giá: ${new Intl.NumberFormat('vi-VN').format(scopedExp.totalPrice)} đ, người nhận: ${scopedExp.recipient})`
    );
    showToast(`Đã lưu phiếu xuất "${scopedExp.materialName}" và đồng bộ kho & công trình lên Realtime Database`);
  };

  const handleAddBatchExport = async (items: ExportedGood[]) => {
    if (!items || items.length === 0) return;

    const scopedItems = items.map((it) => ({ ...it, tenantId: activeTenantId }));

    // 1. Save all export goods
    setExportedGoods((prev) => [...scopedItems, ...prev]);
    for (const exp of scopedItems) {
      await addExportedGoodToFirestore(exp, activeTenantId);
    }

    // 2. Deduct stock for each exported material
    let updatedMaterialsList = [...materials];
    for (const exp of scopedItems) {
      const targetMat = updatedMaterialsList.find((m) => m.name === exp.materialName);
      if (targetMat) {
        const updatedMat: MaterialItem = {
          ...targetMat,
          stockQty: Math.max(0, targetMat.stockQty - exp.quantity),
          tenantId: activeTenantId,
        };
        updatedMaterialsList = updatedMaterialsList.map((m) =>
          m.id === targetMat.id ? updatedMat : m
        );
        await addMaterialToFirestore(updatedMat, activeTenantId);
      }
    }
    setMaterials(updatedMaterialsList);

    // 3. Update project total exports value
    const projectName = scopedItems[0]?.projectName;
    const totalBatchPrice = scopedItems.reduce((sum, item) => sum + item.totalPrice, 0);

    if (projectName) {
      const targetProj = projects.find((p) => p.name === projectName);
      if (targetProj) {
        const updatedProj: ConstructionProject = {
          ...targetProj,
          totalExportsValue: targetProj.totalExportsValue + totalBatchPrice,
          tenantId: activeTenantId,
        };
        setProjects((prev) => prev.map((p) => (p.id === targetProj.id ? updatedProj : p)));
        await addProjectToFirestore(updatedProj, activeTenantId);
      }
    }

    // 4. Log action
    await logUserAction(
      'export',
      'Xuất nhiều vật tư',
      `Phiếu xuất ${scopedItems.length} loại vật tư`,
      `Xuất ${scopedItems.length} mặt hàng cho công trình "${projectName || 'Chưa gán'}" - Tổng giá trị: ${new Intl.NumberFormat('vi-VN').format(totalBatchPrice)} đ (Người nhận: ${scopedItems[0]?.recipient || 'Đội thi công'})`
    );

    showToast(`Đã lưu phiếu xuất ${scopedItems.length} loại vật tư và cập nhật tồn kho thành công!`);
  };

  const handleUpdateExport = async (updatedExp: ExportedGood, originalExp?: ExportedGood) => {
    const scopedExp: ExportedGood = {
      ...updatedExp,
      tenantId: activeTenantId,
    };

    // 1. Update export in state & RTDB
    setExportedGoods((prev) => prev.map((e) => (e.id === scopedExp.id ? scopedExp : e)));
    await updateExportedGoodInFirestore(scopedExp, activeTenantId);

    // 2. Stock and project cost adjustments
    if (originalExp) {
      // Material Stock adjustment
      if (originalExp.materialName === scopedExp.materialName) {
        const qtyDiff = scopedExp.quantity - originalExp.quantity; // positive means we exported more -> deduct more
        if (qtyDiff !== 0) {
          const targetMat = materials.find((m) => m.name === scopedExp.materialName);
          if (targetMat) {
            const updatedMat: MaterialItem = {
              ...targetMat,
              stockQty: Math.max(0, targetMat.stockQty - qtyDiff),
              tenantId: activeTenantId,
            };
            setMaterials((prev) => prev.map((m) => (m.id === targetMat.id ? updatedMat : m)));
            await updateMaterialInFirestore(updatedMat, activeTenantId);
          }
        }
      } else {
        // Material changed: revert old material stock, deduct new material stock
        const oldMat = materials.find((m) => m.name === originalExp.materialName);
        if (oldMat) {
          const revertedMat: MaterialItem = {
            ...oldMat,
            stockQty: oldMat.stockQty + originalExp.quantity,
            tenantId: activeTenantId,
          };
          setMaterials((prev) => prev.map((m) => (m.id === oldMat.id ? revertedMat : m)));
          await updateMaterialInFirestore(revertedMat, activeTenantId);
        }
        const newMat = materials.find((m) => m.name === scopedExp.materialName);
        if (newMat) {
          const deductedMat: MaterialItem = {
            ...newMat,
            stockQty: Math.max(0, newMat.stockQty - scopedExp.quantity),
            tenantId: activeTenantId,
          };
          setMaterials((prev) => prev.map((m) => (m.id === newMat.id ? deductedMat : m)));
          await updateMaterialInFirestore(deductedMat, activeTenantId);
        }
      }

      // Project Total Value adjustment
      if (originalExp.projectName === scopedExp.projectName) {
        const priceDiff = scopedExp.totalPrice - originalExp.totalPrice;
        if (priceDiff !== 0) {
          const targetProj = projects.find((p) => p.name === scopedExp.projectName);
          if (targetProj) {
            const updatedProj: ConstructionProject = {
              ...targetProj,
              totalExportsValue: Math.max(0, targetProj.totalExportsValue + priceDiff),
              tenantId: activeTenantId,
            };
            setProjects((prev) => prev.map((p) => (p.id === targetProj.id ? updatedProj : p)));
            await updateProjectInFirestore(updatedProj, activeTenantId);
          }
        }
      } else {
        // Project changed: subtract from old project, add to new project
        const oldProj = projects.find((p) => p.name === originalExp.projectName);
        if (oldProj) {
          const updatedOldProj: ConstructionProject = {
            ...oldProj,
            totalExportsValue: Math.max(0, oldProj.totalExportsValue - originalExp.totalPrice),
            tenantId: activeTenantId,
          };
          setProjects((prev) => prev.map((p) => (p.id === oldProj.id ? updatedOldProj : p)));
          await updateProjectInFirestore(updatedOldProj, activeTenantId);
        }
        const newProj = projects.find((p) => p.name === scopedExp.projectName);
        if (newProj) {
          const updatedNewProj: ConstructionProject = {
            ...newProj,
            totalExportsValue: newProj.totalExportsValue + scopedExp.totalPrice,
            tenantId: activeTenantId,
          };
          setProjects((prev) => prev.map((p) => (p.id === newProj.id ? updatedNewProj : p)));
          await updateProjectInFirestore(updatedNewProj, activeTenantId);
        }
      }
    }

    await logUserAction(
      'export',
      'Sửa phiếu xuất',
      scopedExp.materialName,
      `Cập nhật phiếu xuất "${scopedExp.materialName}" (${scopedExp.quantity} ${scopedExp.unit}) cho công trình "${scopedExp.projectName}"`
    );
    showToast(`Đã cập nhật phiếu xuất kho "${scopedExp.materialName}" thành công!`);
  };

  const handleDeleteExport = async (exportId: string) => {
    const targetExp = exportedGoods.find((e) => e.id === exportId);
    if (!targetExp) return;

    setExportedGoods((prev) => prev.filter((e) => e.id !== exportId));
    await deleteExportedGoodFromFirestore(exportId, activeTenantId);

    // Restore material stock
    const targetMat = materials.find((m) => m.name === targetExp.materialName);
    if (targetMat) {
      const restoredMat: MaterialItem = {
        ...targetMat,
        stockQty: targetMat.stockQty + targetExp.quantity,
        tenantId: activeTenantId,
      };
      setMaterials((prev) => prev.map((m) => (m.id === targetMat.id ? restoredMat : m)));
      await updateMaterialInFirestore(restoredMat, activeTenantId);
    }

    // Deduct project totalExportsValue
    const targetProj = projects.find((p) => p.name === targetExp.projectName);
    if (targetProj) {
      const updatedProj: ConstructionProject = {
        ...targetProj,
        totalExportsValue: Math.max(0, targetProj.totalExportsValue - targetExp.totalPrice),
        tenantId: activeTenantId,
      };
      setProjects((prev) => prev.map((p) => (p.id === targetProj.id ? updatedProj : p)));
      await updateProjectInFirestore(updatedProj, activeTenantId);
    }

    await logUserAction(
      'export',
      'Xóa phiếu xuất',
      targetExp.materialName,
      `Đã xóa phiếu xuất "${targetExp.materialName}" (${targetExp.quantity} ${targetExp.unit})`
    );
    showToast(`Đã xóa phiếu xuất kho và hoàn trả tồn kho`);
  };

  const handleAddLaborLog = async (newLog: LaborDailyLog) => {
    const formattedDate = normalizeDateToDDMMYYYY(newLog.date);
    const scopedLog: LaborDailyLog = {
      ...newLog,
      date: formattedDate,
      tenantId: activeTenantId,
    };

    setLaborLogs((prev) => [...prev, scopedLog]);
    await addLaborLogToFirestore(scopedLog, activeTenantId);

    // Update workdaysLogged on the relevant project if project is specified
    if (scopedLog.projectName) {
      const targetProj = projects.find((p) => p.name === scopedLog.projectName);
      if (targetProj) {
        const updatedProj: ConstructionProject = {
          ...targetProj,
          workdaysLogged: targetProj.workdaysLogged + scopedLog.totalWorkdays,
          tenantId: activeTenantId,
        };
        setProjects((prev) => prev.map((p) => (p.id === targetProj.id ? updatedProj : p)));
        await addProjectToFirestore(updatedProj, activeTenantId);
      }
    }

    await logUserAction(
      'labor',
      'Chấm công',
      `Chấm công ${scopedLog.date}`,
      `Ghi nhận ${scopedLog.totalWorkdays} công tại công trình "${scopedLog.projectName || 'Chung'}" (${scopedLog.workerNames?.join(', ') || 'Đội thi công'})`
    );
    showToast(`Đã lưu nhật ký chấm công ${scopedLog.date} lên Realtime Database`);
  };

  const handleUpdateLaborLog = async (updatedLog: LaborDailyLog) => {
    const formattedDate = normalizeDateToDDMMYYYY(updatedLog.date);
    const scopedLog: LaborDailyLog = {
      ...updatedLog,
      date: formattedDate,
      tenantId: activeTenantId,
    };
    setLaborLogs((prev) => prev.map((l) => (l.id === scopedLog.id ? scopedLog : l)));
    await updateLaborLogToFirestore(scopedLog, activeTenantId);
    await logUserAction(
      'labor',
      'Sửa chấm công',
      `Sửa công ngày ${scopedLog.date}`,
      `Cập nhật số công của ${scopedLog.workerNames?.join(', ') || 'Nhân sự'} thành ${scopedLog.totalWorkdays} công (${scopedLog.projectName || 'Công trình'})`
    );
    showToast(`Đã cập nhật dữ liệu chấm công ngày ${scopedLog.date} trên Realtime Database`);
  };

  const handleDeleteLaborLog = async (logId: string) => {
    const targetLog = laborLogs.find((l) => l.id === logId);
    setLaborLogs((prev) => prev.filter((l) => l.id !== logId));
    await deleteLaborLogFromFirestore(logId, activeTenantId);
    await logUserAction(
      'labor',
      'Xóa chấm công',
      `Xóa công ngày ${targetLog?.date || logId}`,
      `Đã xóa bản ghi chấm công của ${targetLog?.workerNames?.join(', ') || 'Nhân sự'} tại ${targetLog?.projectName || 'Công trình'}`
    );
    showToast('Đã xóa bản ghi chấm công khỏi Realtime Database');
  };

  const handleAddStaff = async (newStaff: StaffMember) => {
    const scopedStaff: StaffMember = {
      ...newStaff,
      tenantId: activeTenantId,
    };
    setStaff((prev) => [scopedStaff, ...prev]);
    await addStaffToFirestore(scopedStaff, activeTenantId);
    await logUserAction('staff', 'Thêm nhân sự', scopedStaff.name, `Thêm nhân sự ${scopedStaff.name} (${scopedStaff.role})`);
    showToast(`Đã lưu nhân sự "${scopedStaff.name}" lên Realtime Database`);
  };

  const handleDeleteStaff = async (staffId: string) => {
    const targetStaff = staff.find((s) => s.id === staffId);
    setStaff((prev) => prev.filter((s) => s.id !== staffId));
    await deleteStaffFromFirestore(staffId, activeTenantId);
    await logUserAction('staff', 'Xóa nhân sự', targetStaff?.name || staffId, `Đã xóa nhân sự ${targetStaff?.name || staffId}`);
    showToast('Đã xóa nhân sự khỏi Realtime Database');
  };

  const handleClearAllData = async () => {
    await clearAllDatabaseData(activeTenantId);
    setProjects([]);
    setMaterials([]);
    setExportedGoods([]);
    setLaborLogs([]);
    setStaff([]);
    await logUserAction('settings', 'Xóa dữ liệu', 'Xóa trắng', `Xóa toàn bộ dữ liệu dự án, kho vật tư và nhân sự của chi nhánh ${activeTenantId}`);
    showToast('Đã dọn dẹp dữ liệu chi nhánh hiện tại trên Realtime Database');
  };

  const handleSeedSampleData = async () => {
    const activeTenant = tenants.find((t) => t.id === activeTenantId);
    await seedSampleDataToFirestore(activeTenantId, activeTenant?.code || 'CT36');
    await logUserAction('settings', 'Nạp dữ liệu mẫu', 'Khởi tạo mẫu', `Khởi tạo bộ dữ liệu mẫu cho chi nhánh ${activeTenant?.name || activeTenantId}`);
    showToast('Đã nạp bộ dữ liệu mẫu thành công!');
  };

  const currentTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0];

  // If not logged in, render the Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4">
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onRegisterAccount={handleRegisterAccount}
          onRegisterNewEnterprise={handleRegisterNewEnterprise}
          accounts={accounts}
          companySettings={companySettings}
          tenants={tenants}
        />

        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafd] text-slate-800 flex">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewProject={() => setIsNewProjectOpen(true)}
        onLogout={handleLogout}
        currentUser={currentUser}
        companySettings={companySettings}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenSupportModal={() => setIsSupportOpen(true)}
        tenants={tenants}
        activeTenantId={activeTenantId}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="open-mobile-menu-btn"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:block">
              <h2 className="text-sm font-bold text-slate-800 capitalize">
                {activeTab === 'dashboard' && 'Tổng quan'}
                {activeTab === 'projects' && 'Danh mục công trình'}
                {activeTab === 'materials' && 'Vật tư & Định mức'}
                {activeTab === 'staff' && 'Nhân sự & Thợ thi công'}
                {activeTab === 'settings' && 'Cấu hình hệ thống'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Firebase Live Cloud Badge */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold"
              title="Đã kết nối Firebase Realtime Database: kho36manage (Multi-Tenant Engine)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Multi-Tenant RTDB</span>
            </div>

            {/* Switch to login screen button */}
            <button
              type="button"
              onClick={handleLogout}
              className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title="Đăng xuất hoặc đổi tài khoản"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Đổi tài khoản</span>
            </button>

            {/* Notification bell */}
            <div className="relative">
              <button
                type="button"
                id="app-notification-bell-btn"
                onClick={() => setIsActivityLogsOpen(true)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer relative group"
                title="Xem lịch sử thao tác trên ứng dụng"
              >
                <Bell className="w-4 h-4" />
                {activityLogs.length > 0 ? (
                  <span className="absolute top-1 right-1 px-1 min-w-[16px] h-4 bg-rose-500 text-[9px] font-extrabold text-white rounded-full flex items-center justify-center ring-2 ring-white shadow-2xs">
                    {activityLogs.length > 99 ? '99+' : activityLogs.length}
                  </span>
                ) : (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-slate-300 rounded-full ring-2 ring-white" />
                )}
              </button>
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs ${
                  currentUser.role === 'admin'
                    ? 'bg-amber-600'
                    : currentUser.role === 'storekeeper'
                    ? 'bg-emerald-600'
                    : 'bg-blue-600'
                }`}
              >
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <span className="text-xs font-bold text-slate-800 block truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-blue-600 font-semibold block uppercase">
                  {currentUser.orgId} • {currentUser.role}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* View Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              exportedGoods={exportedGoods}
              laborLogs={laborLogs}
              projects={projects}
              onOpenLaborDetail={() => setIsLaborDetailOpen(true)}
              onOpenNewExport={() => setIsNewExportOpen(true)}
              onOpenNewProject={() => {
                setEditingProject(null);
                setIsNewProjectOpen(true);
              }}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView
              projects={projects}
              exportedGoods={exportedGoods}
              laborLogs={laborLogs}
              staff={staff}
              companySettings={companySettings}
              currentUser={currentUser}
              onOpenNewProject={() => {
                setEditingProject(null);
                setIsNewProjectOpen(true);
              }}
              onEditProject={(proj) => {
                setEditingProject(proj);
                setIsNewProjectOpen(true);
              }}
              onDeleteProject={handleDeleteProject}
              onSaveProject={handleSaveProject}
              onOpenExportForProject={(proj) => {
                setExportInitialProject(proj.name);
                setIsNewExportOpen(true);
              }}
              onOpenLaborForProject={(proj) => {
                setLaborInitialProject(proj.name);
                setIsLaborDetailOpen(true);
              }}
            />
          )}

          {activeTab === 'materials' && (
            <MaterialsView
              materials={materials}
              exportedGoods={exportedGoods}
              projects={projects}
              companySettings={companySettings}
              currentUser={currentUser}
              onOpenNewExport={() => {
                setExportInitialMaterialId(undefined);
                setIsNewExportOpen(true);
              }}
              onOpenExportForMaterial={(mat) => {
                setExportInitialMaterialId(mat.id);
                setIsNewExportOpen(true);
              }}
              onAddMaterial={handleAddMaterial}
              onUpdateMaterial={handleUpdateMaterial}
              onDeleteMaterial={handleDeleteMaterial}
              onBatchSaveMaterials={handleBatchSaveMaterials}
              onUpdateExport={handleUpdateExport}
              onDeleteExport={handleDeleteExport}
            />
          )}

          {activeTab === 'staff' && (
            <StaffView
              staff={staff}
              laborLogs={laborLogs}
              projects={projects}
              companySettings={companySettings}
              currentUser={currentUser}
              onAddStaff={handleAddStaff}
              onDeleteStaff={handleDeleteStaff}
              onUpdateLaborLog={handleUpdateLaborLog}
              onDeleteLaborLog={handleDeleteLaborLog}
              onAddLaborLog={handleAddLaborLog}
              onOpenNewLaborLog={() => setIsLaborDetailOpen(true)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              accounts={accounts}
              companySettings={companySettings}
              loginHistory={loginHistory}
              onClearLoginHistory={handleClearLoginHistory}
              onUpdateCompanySettings={handleUpdateCompanySettings}
              onSaveAccount={handleSaveAccount}
              onDeleteAccount={handleDeleteAccount}
              onClearAllData={handleClearAllData}
              onSeedSampleData={handleSeedSampleData}
              tenants={tenants}
              activeTenantId={activeTenantId}
              onSelectTenant={handleSelectTenant}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => {
          setIsNewProjectOpen(false);
          setEditingProject(null);
        }}
        onSaveProject={handleSaveProject}
        initialData={editingProject}
        staffList={staff}
        existingProjectsCount={projects.length}
      />

      <NewExportModal
        isOpen={isNewExportOpen}
        onClose={() => {
          setIsNewExportOpen(false);
          setExportInitialProject(undefined);
          setExportInitialMaterialId(undefined);
        }}
        projects={projects}
        materials={materials}
        onAddExport={handleAddExport}
        onAddBatchExport={handleAddBatchExport}
        onAddMaterial={handleAddMaterial}
        initialProjectName={exportInitialProject}
        initialMaterialId={exportInitialMaterialId}
      />

      <LaborDetailModal
        isOpen={isLaborDetailOpen}
        onClose={() => {
          setIsLaborDetailOpen(false);
          setLaborInitialProject(undefined);
        }}
        laborLogs={laborLogs}
        onAddLaborLog={handleAddLaborLog}
        projects={projects}
        initialProjectName={laborInitialProject}
        staff={staff}
        onAddStaff={handleAddStaff}
      />

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />

      <ActivityLogsModal
        isOpen={isActivityLogsOpen}
        onClose={() => setIsActivityLogsOpen(false)}
        logs={activityLogs}
        onClearLogs={handleClearActivityLogs}
        currentUser={currentUser}
      />
    </div>
  );
}
