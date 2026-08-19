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
  Sparkles,
} from 'lucide-react';
import { DEFAULT_COMPANY_SETTINGS } from './data/mockData';
import {
  CompanySettings,
  ConstructionProject,
  ExportedGood,
  LaborDailyLog,
  MaterialItem,
  StaffMember,
  UserAccount,
  UserAccountRecord,
  LoginHistoryRecord,
  ActivityLog,
} from './types';
import {
  testDatabaseConnection,
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
  saveCompanySettingsToDatabase,
  saveUserAccountToDatabase,
  deleteUserAccountFromDatabase,
  addProjectToDatabase,
  updateProjectInDatabase,
  deleteProjectFromDatabase,
  addMaterialToDatabase,
  updateMaterialInDatabase,
  batchSaveMaterialsToDatabase,
  deleteMaterialFromDatabase,
  addExportedGoodToDatabase,
  updateExportedGoodInDatabase,
  deleteExportedGoodFromDatabase,
  addLaborLogToDatabase,
  updateLaborLogToDatabase,
  deleteLaborLogFromDatabase,
  addStaffToDatabase,
  deleteStaffFromDatabase,
  clearAllDatabaseData,
  seedSampleDataToDatabase,
  initializeDatabaseArchitecture,
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

  // Login Activity History list from Realtime Database
  const [loginHistory, setLoginHistory] = useState<LoginHistoryRecord[]>([]);

  // Application User Activity / Audit Logs from Realtime Database
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isActivityLogsOpen, setIsActivityLogsOpen] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core business data states - Standalone Single Database
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

  // Initialize Database Architecture & Test Connection on mount
  useEffect(() => {
    testDatabaseConnection().then((connected) => {
      setIsFirebaseConnected(connected);
    });

    initializeDatabaseArchitecture();

    // Standalone Subscriptions
    const unsubProjects = subscribeProjects((data) => {
      setProjects(data || []);
    });

    const unsubMaterials = subscribeMaterials((data) => {
      setMaterials(data || []);
    });

    const unsubExports = subscribeExportedGoods((data) => {
      setExportedGoods(data || []);
    });

    const unsubLabor = subscribeLaborLogs((data) => {
      setLaborLogs(data || []);
    });

    const unsubStaff = subscribeStaff((data) => {
      setStaff(data || []);
    });

    const unsubCompanySettings = subscribeCompanySettings((data) => {
      if (data) {
        setCompanySettings(data);
        localStorage.setItem('chongtham36_company_settings', JSON.stringify(data));
      }
    });

    const unsubAccounts = subscribeUserAccounts((data) => {
      if (data && data.length > 0) {
        setAccounts(data);
        setCurrentUser((curr) => {
          if (!curr) return null;
          const currentUName = (curr?.username || '').toLowerCase();
          const fresh = data.find((a) => (a?.username || '').toLowerCase() === currentUName);
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

    const unsubActivityLogs = subscribeActivityLogs((data) => {
      if (data) {
        setActivityLogs(data);
      }
    });

    return () => {
      unsubProjects();
      unsubMaterials();
      unsubExports();
      unsubLabor();
      unsubStaff();
      unsubCompanySettings();
      unsubAccounts();
      unsubLoginHistory();
      unsubActivityLogs();
    };
  }, []);

  // Helper to record user activities to Realtime Database
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
      timestamp: Date.now(),
      timeFormatted,
      status: 'success',
    };

    setActivityLogs((prev) => [newLog, ...prev]);
    await recordActivityLogToDatabase(newLog);
  };

  const handleClearActivityLogs = async () => {
    await clearActivityLogsFromDatabase();
    setActivityLogs([]);
    showToast('Đã xóa toàn bộ lịch sử thao tác trên cơ sở dữ liệu!');
  };

  // Handlers
  const handleUpdateCompanySettings = async (newSettings: CompanySettings) => {
    setCompanySettings(newSettings);
    localStorage.setItem('chongtham36_company_settings', JSON.stringify(newSettings));
    await saveCompanySettingsToDatabase(newSettings);
    await logUserAction('settings', 'Cập nhật cấu hình', 'Thiết lập doanh nghiệp', `Cập nhật thông tin ${newSettings.brandName} (${newSettings.orgName})`);
    showToast('Đã lưu cấu hình doanh nghiệp và logo thành công!');
  };

  const handleLoginSuccess = async (user: UserAccount) => {
    setCurrentUser(user);
    setActiveTab('dashboard');

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
    await logUserAction('auth', 'Đăng nhập', `Đăng nhập (${user.username})`, `Tài khoản ${user.name} (${user.role}) đăng nhập thành công`);
    showToast(`Chào mừng ${user.name} - Đăng nhập thành công!`);
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
      createdAt: proj.createdAt || existingProj?.createdAt || now.toISOString(),
      createdAtTimestamp: proj.createdAtTimestamp || existingProj?.createdAtTimestamp || Date.now(),
      updatedAt: now.toISOString(),
    };

    if (isExisting) {
      setProjects((prev) => prev.map((p) => (p.id === scopedProject.id ? scopedProject : p)));
      await updateProjectInDatabase(scopedProject);
      await logUserAction('project', 'Cập nhật công trình', scopedProject.name, `Cập nhật thông tin công trình ${scopedProject.code} - ${scopedProject.name}, đối tác: ${scopedProject.partner || 'Chủ đầu tư'}`);
      showToast(`Đã cập nhật công trình "${scopedProject.name}" lên cơ sở dữ liệu`);
    } else {
      setProjects((prev) => [scopedProject, ...prev]);
      await addProjectToDatabase(scopedProject);
      await logUserAction('project', 'Tạo công trình', scopedProject.name, `Khởi tạo công trình mới ${scopedProject.code} - ${scopedProject.name}, địa chỉ: ${scopedProject.address}`);
      showToast(`Đã lưu công trình mới "${scopedProject.name}" lên cơ sở dữ liệu`);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const deletedProj = projects.find((p) => p.id === projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    await deleteProjectFromDatabase(projectId);
    await logUserAction('project', 'Xóa công trình', deletedProj?.name || projectId, `Đã xóa công trình ${deletedProj ? `${deletedProj.code} - ${deletedProj.name}` : projectId}`);
    showToast('Đã xóa công trình khỏi cơ sở dữ liệu');
  };

  const handleAddMaterial = async (newMat: MaterialItem) => {
    setMaterials((prev) => [newMat, ...prev]);
    await addMaterialToDatabase(newMat);
    await logUserAction('material', 'Thêm vật tư', newMat.name, `Thêm mới mặt hàng ${newMat.code} - ${newMat.name}, tồn kho: ${newMat.stockQty} ${newMat.unit}`);
    showToast(`Đã lưu vật tư "${newMat.name}" lên cơ sở dữ liệu`);
  };

  const handleUpdateMaterial = async (updatedMat: MaterialItem) => {
    setMaterials((prev) => prev.map((m) => (m.id === updatedMat.id ? updatedMat : m)));
    await updateMaterialInDatabase(updatedMat);
    await logUserAction('material', 'Cập nhật vật tư', updatedMat.name, `Cập nhật thông tin hàng hóa ${updatedMat.code} - ${updatedMat.name}`);
    showToast(`Đã cập nhật vật tư "${updatedMat.name}" trên cơ sở dữ liệu`);
  };

  const handleBatchSaveMaterials = async (newMaterialsList: MaterialItem[]) => {
    setMaterials(newMaterialsList);
    await batchSaveMaterialsToDatabase(newMaterialsList);
    await logUserAction('material', 'Đồng bộ vật tư', 'Nhập danh mục', `Đã đồng bộ ${newMaterialsList.length} mặt hàng vào danh mục kho`);
    showToast(`Đã đồng bộ ${newMaterialsList.length} mặt hàng lên cơ sở dữ liệu`);
  };

  const handleDeleteMaterial = async (materialId: string) => {
    const deletedMat = materials.find((m) => m.id === materialId);
    setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    await deleteMaterialFromDatabase(materialId);
    await logUserAction('material', 'Xóa vật tư', deletedMat?.name || materialId, `Đã xóa mặt hàng ${deletedMat ? `${deletedMat.code} - ${deletedMat.name}` : materialId} khỏi kho`);
    showToast('Đã xóa vật tư khỏi cơ sở dữ liệu');
  };

  const handleAddExport = async (newExp: ExportedGood) => {
    // 1. Add export record
    setExportedGoods((prev) => [newExp, ...prev]);
    await addExportedGoodToDatabase(newExp);

    // 2. Deduct material stock in Database
    const targetMat = materials.find((m) => m.name === newExp.materialName);
    if (targetMat) {
      const updatedMat: MaterialItem = {
        ...targetMat,
        stockQty: Math.max(0, targetMat.stockQty - newExp.quantity),
      };
      setMaterials((prev) => prev.map((m) => (m.id === targetMat.id ? updatedMat : m)));
      await addMaterialToDatabase(updatedMat);
    }

    // 3. Update project totalExportsValue in Database
    const targetProj = projects.find((p) => p.name === newExp.projectName);
    if (targetProj) {
      const updatedProj: ConstructionProject = {
        ...targetProj,
        totalExportsValue: targetProj.totalExportsValue + newExp.totalPrice,
      };
      setProjects((prev) => prev.map((p) => (p.id === targetProj.id ? updatedProj : p)));
      await addProjectToDatabase(updatedProj);
    }

    await logUserAction(
      'export',
      'Xuất kho',
      newExp.materialName,
      `Xuất ${newExp.quantity} ${newExp.unit} "${newExp.materialName}" cho công trình "${newExp.projectName}" (Trị giá: ${new Intl.NumberFormat('vi-VN').format(newExp.totalPrice)} đ, người nhận: ${newExp.recipient})`
    );
    showToast(`Đã lưu phiếu xuất "${newExp.materialName}" và đồng bộ tồn kho`);
  };

  const handleAddBatchExport = async (items: ExportedGood[]) => {
    if (!items || items.length === 0) return;

    // 1. Save all export goods
    setExportedGoods((prev) => [...items, ...prev]);
    for (const exp of items) {
      await addExportedGoodToDatabase(exp);
    }

    // 2. Deduct stock for each exported material
    let updatedMaterialsList = [...materials];
    for (const exp of items) {
      const targetMat = updatedMaterialsList.find((m) => m.name === exp.materialName);
      if (targetMat) {
        const updatedMat: MaterialItem = {
          ...targetMat,
          stockQty: Math.max(0, targetMat.stockQty - exp.quantity),
        };
        updatedMaterialsList = updatedMaterialsList.map((m) =>
          m.id === targetMat.id ? updatedMat : m
        );
        await addMaterialToDatabase(updatedMat);
      }
    }
    setMaterials(updatedMaterialsList);

    // 3. Update project total exports value
    const projectName = items[0]?.projectName;
    const totalBatchPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);

    if (projectName) {
      const targetProj = projects.find((p) => p.name === projectName);
      if (targetProj) {
        const updatedProj: ConstructionProject = {
          ...targetProj,
          totalExportsValue: targetProj.totalExportsValue + totalBatchPrice,
        };
        setProjects((prev) => prev.map((p) => (p.id === targetProj.id ? updatedProj : p)));
        await addProjectToDatabase(updatedProj);
      }
    }

    // 4. Log action
    await logUserAction(
      'export',
      'Xuất nhiều vật tư',
      `Phiếu xuất ${items.length} loại vật tư`,
      `Xuất ${items.length} mặt hàng cho công trình "${projectName || 'Chưa gán'}" - Tổng giá trị: ${new Intl.NumberFormat('vi-VN').format(totalBatchPrice)} đ (Người nhận: ${items[0]?.recipient || 'Đội thi công'})`
    );

    showToast(`Đã lưu phiếu xuất ${items.length} loại vật tư và cập nhật tồn kho thành công!`);
  };

  const handleUpdateExport = async (updatedExp: ExportedGood, originalExp?: ExportedGood) => {
    // 1. Update export in state & RTDB
    setExportedGoods((prev) => prev.map((e) => (e.id === updatedExp.id ? updatedExp : e)));
    await updateExportedGoodInDatabase(updatedExp);

    // 2. Stock and project cost adjustments
    if (originalExp) {
      // Material Stock adjustment
      if (originalExp.materialName === updatedExp.materialName) {
        const qtyDiff = updatedExp.quantity - originalExp.quantity;
        if (qtyDiff !== 0) {
          const targetMat = materials.find((m) => m.name === updatedExp.materialName);
          if (targetMat) {
            const updatedMat: MaterialItem = {
              ...targetMat,
              stockQty: Math.max(0, targetMat.stockQty - qtyDiff),
            };
            setMaterials((prev) => prev.map((m) => (m.id === targetMat.id ? updatedMat : m)));
            await updateMaterialInDatabase(updatedMat);
          }
        }
      } else {
        // Material changed: revert old material stock, deduct new material stock
        const oldMat = materials.find((m) => m.name === originalExp.materialName);
        if (oldMat) {
          const revertedMat: MaterialItem = {
            ...oldMat,
            stockQty: oldMat.stockQty + originalExp.quantity,
          };
          setMaterials((prev) => prev.map((m) => (m.id === oldMat.id ? revertedMat : m)));
          await updateMaterialInDatabase(revertedMat);
        }
        const newMat = materials.find((m) => m.name === updatedExp.materialName);
        if (newMat) {
          const deductedMat: MaterialItem = {
            ...newMat,
            stockQty: Math.max(0, newMat.stockQty - updatedExp.quantity),
          };
          setMaterials((prev) => prev.map((m) => (m.id === newMat.id ? deductedMat : m)));
          await updateMaterialInDatabase(deductedMat);
        }
      }

      // Project Total Value adjustment
      if (originalExp.projectName === updatedExp.projectName) {
        const priceDiff = updatedExp.totalPrice - originalExp.totalPrice;
        if (priceDiff !== 0) {
          const targetProj = projects.find((p) => p.name === updatedExp.projectName);
          if (targetProj) {
            const updatedProj: ConstructionProject = {
              ...targetProj,
              totalExportsValue: Math.max(0, targetProj.totalExportsValue + priceDiff),
            };
            setProjects((prev) => prev.map((p) => (p.id === targetProj.id ? updatedProj : p)));
            await updateProjectInDatabase(updatedProj);
          }
        }
      } else {
        // Project changed: subtract from old project, add to new project
        const oldProj = projects.find((p) => p.name === originalExp.projectName);
        if (oldProj) {
          const updatedOldProj: ConstructionProject = {
            ...oldProj,
            totalExportsValue: Math.max(0, oldProj.totalExportsValue - originalExp.totalPrice),
          };
          setProjects((prev) => prev.map((p) => (p.id === oldProj.id ? updatedOldProj : p)));
          await updateProjectInDatabase(updatedOldProj);
        }
        const newProj = projects.find((p) => p.name === updatedExp.projectName);
        if (newProj) {
          const updatedNewProj: ConstructionProject = {
            ...newProj,
            totalExportsValue: newProj.totalExportsValue + updatedExp.totalPrice,
          };
          setProjects((prev) => prev.map((p) => (p.id === newProj.id ? updatedNewProj : p)));
          await updateProjectInDatabase(updatedNewProj);
        }
      }
    }

    await logUserAction(
      'export',
      'Sửa phiếu xuất',
      updatedExp.materialName,
      `Cập nhật phiếu xuất "${updatedExp.materialName}" (${updatedExp.quantity} ${updatedExp.unit}) cho công trình "${updatedExp.projectName}"`
    );
    showToast(`Đã cập nhật phiếu xuất kho "${updatedExp.materialName}" thành công!`);
  };

  const handleDeleteExport = async (exportId: string) => {
    const targetExp = exportedGoods.find((e) => e.id === exportId);
    if (!targetExp) return;

    setExportedGoods((prev) => prev.filter((e) => e.id !== exportId));
    await deleteExportedGoodFromDatabase(exportId);

    // Restore material stock
    const targetMat = materials.find((m) => m.name === targetExp.materialName);
    if (targetMat) {
      const restoredMat: MaterialItem = {
        ...targetMat,
        stockQty: targetMat.stockQty + targetExp.quantity,
      };
      setMaterials((prev) => prev.map((m) => (m.id === targetMat.id ? restoredMat : m)));
      await updateMaterialInDatabase(restoredMat);
    }

    // Deduct project totalExportsValue
    const targetProj = projects.find((p) => p.name === targetExp.projectName);
    if (targetProj) {
      const updatedProj: ConstructionProject = {
        ...targetProj,
        totalExportsValue: Math.max(0, targetProj.totalExportsValue - targetExp.totalPrice),
      };
      setProjects((prev) => prev.map((p) => (p.id === targetProj.id ? updatedProj : p)));
      await updateProjectInDatabase(updatedProj);
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
    };

    setLaborLogs((prev) => [...prev, scopedLog]);
    await addLaborLogToDatabase(scopedLog);

    // Update workdaysLogged on the relevant project if project is specified
    if (scopedLog.projectName) {
      const targetProj = projects.find((p) => p.name === scopedLog.projectName);
      if (targetProj) {
        const updatedProj: ConstructionProject = {
          ...targetProj,
          workdaysLogged: targetProj.workdaysLogged + scopedLog.totalWorkdays,
        };
        setProjects((prev) => prev.map((p) => (p.id === targetProj.id ? updatedProj : p)));
        await addProjectToDatabase(updatedProj);
      }
    }

    await logUserAction(
      'labor',
      'Chấm công',
      `Chấm công ${scopedLog.date}`,
      `Ghi nhận ${scopedLog.totalWorkdays} công tại công trình "${scopedLog.projectName || 'Chung'}" (${scopedLog.workerNames?.join(', ') || 'Đội thi công'})`
    );
    showToast(`Đã lưu nhật ký chấm công ${scopedLog.date} lên cơ sở dữ liệu`);
  };

  const handleUpdateLaborLog = async (updatedLog: LaborDailyLog) => {
    const formattedDate = normalizeDateToDDMMYYYY(updatedLog.date);
    const scopedLog: LaborDailyLog = {
      ...updatedLog,
      date: formattedDate,
    };
    setLaborLogs((prev) => prev.map((l) => (l.id === scopedLog.id ? scopedLog : l)));
    await updateLaborLogToDatabase(scopedLog);
    await logUserAction(
      'labor',
      'Sửa chấm công',
      `Sửa công ngày ${scopedLog.date}`,
      `Cập nhật số công của ${scopedLog.workerNames?.join(', ') || 'Nhân sự'} thành ${scopedLog.totalWorkdays} công (${scopedLog.projectName || 'Công trình'})`
    );
    showToast(`Đã cập nhật dữ liệu chấm công ngày ${scopedLog.date} trên cơ sở dữ liệu`);
  };

  const handleDeleteLaborLog = async (logId: string) => {
    const targetLog = laborLogs.find((l) => l.id === logId);
    setLaborLogs((prev) => prev.filter((l) => l.id !== logId));
    await deleteLaborLogFromDatabase(logId);
    await logUserAction(
      'labor',
      'Xóa chấm công',
      `Xóa công ngày ${targetLog?.date || logId}`,
      `Đã xóa bản ghi chấm công của ${targetLog?.workerNames?.join(', ') || 'Nhân sự'} tại ${targetLog?.projectName || 'Công trình'}`
    );
    showToast('Đã xóa bản ghi chấm công khỏi cơ sở dữ liệu');
  };

  const handleAddStaff = async (newStaff: StaffMember) => {
    setStaff((prev) => [newStaff, ...prev]);
    await addStaffToDatabase(newStaff);
    await logUserAction('staff', 'Thêm nhân sự', newStaff.name, `Thêm nhân sự ${newStaff.name} (${newStaff.role})`);
    showToast(`Đã lưu nhân sự "${newStaff.name}" lên cơ sở dữ liệu`);
  };

  const handleDeleteStaff = async (staffId: string) => {
    const targetStaff = staff.find((s) => s.id === staffId);
    setStaff((prev) => prev.filter((s) => s.id !== staffId));
    await deleteStaffFromDatabase(staffId);
    await logUserAction('staff', 'Xóa nhân sự', targetStaff?.name || staffId, `Đã xóa nhân sự ${targetStaff?.name || staffId}`);
    showToast('Đã xóa nhân sự khỏi cơ sở dữ liệu');
  };

  const handleClearAllData = async () => {
    await clearAllDatabaseData();
    setProjects([]);
    setMaterials([]);
    setExportedGoods([]);
    setLaborLogs([]);
    setStaff([]);
    await logUserAction('settings', 'Xóa dữ liệu', 'Xóa trắng', `Xóa toàn bộ dữ liệu dự án, kho vật tư và nhân sự trên cơ sở dữ liệu`);
    showToast('Đã dọn dẹp cơ sở dữ liệu thành công!');
  };

  const handleSeedSampleData = async () => {
    await seedSampleDataToDatabase();
    await logUserAction('settings', 'Nạp dữ liệu mẫu', 'Khởi tạo mẫu', `Khởi tạo bộ dữ liệu mẫu chuẩn`);
    showToast('Đã nạp bộ dữ liệu mẫu thành công!');
  };

  // If not logged in, render the Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4">
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onRegisterAccount={handleRegisterAccount}
          accounts={accounts}
          companySettings={companySettings}
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
            {/* Live Cloud Badge */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold"
              title="Đã kết nối Firebase Realtime Database: kho36manage (Hệ Thống Độc Lập)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hệ Thống Độc Lập</span>
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
                <span className="text-xs font-bold text-slate-800 block truncate max-w-[140px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-blue-600 font-semibold block uppercase">
                  {currentUser.role === 'admin' ? 'Quản Trị Viên' : currentUser.role === 'storekeeper' ? 'Thủ Kho' : 'Giám Sát'}
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
