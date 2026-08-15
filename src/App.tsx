import React, { useState, useEffect } from 'react';
import { Menu, LogIn, CheckCircle, Bell, User as UserIcon, Database } from 'lucide-react';
import {
  DEFAULT_COMPANY_SETTINGS,
  INITIAL_EXPORTED_GOODS,
  INITIAL_LABOR_LOGS,
  INITIAL_MATERIALS,
  INITIAL_PROJECTS,
  INITIAL_STAFF,
} from './data/mockData';
import {
  CompanySettings,
  ConstructionProject,
  ExportedGood,
  LaborDailyLog,
  MaterialItem,
  StaffMember,
  UserAccount,
} from './types';
import {
  testFirestoreConnection,
  subscribeProjects,
  subscribeMaterials,
  subscribeExportedGoods,
  subscribeLaborLogs,
  subscribeStaff,
  subscribeCompanySettings,
  saveCompanySettingsToFirestore,
  addProjectToFirestore,
  deleteProjectFromFirestore,
  addMaterialToFirestore,
  deleteMaterialFromFirestore,
  addExportedGoodToFirestore,
  addLaborLogToFirestore,
  addStaffToFirestore,
  deleteStaffFromFirestore,
  clearAllDatabaseData,
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

export default function App() {
  // Authentication state - starts with demo logged in or login screen
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core business data states - starts clean without demo data
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
  const [isNewExportOpen, setIsNewExportOpen] = useState(false);
  const [isLaborDetailOpen, setIsLaborDetailOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Firebase Realtime Subscriptions & Initial Setup
  useEffect(() => {
    // Test server connection
    testFirestoreConnection().then((connected) => {
      setIsFirebaseConnected(connected);
    });

    // Subscribe to all collections in real-time
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

    return () => {
      unsubProjects();
      unsubMaterials();
      unsubExports();
      unsubLabor();
      unsubStaff();
      unsubCompanySettings();
    };
  }, []);

  // Handlers
  const handleUpdateCompanySettings = async (newSettings: CompanySettings) => {
    setCompanySettings(newSettings);
    localStorage.setItem('chongtham36_company_settings', JSON.stringify(newSettings));
    await saveCompanySettingsToFirestore(newSettings);
    showToast('Đã lưu cấu hình doanh nghiệp và logo thành công!');
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
    showToast(`Chào mừng ${user.name} - Đăng nhập ${user.orgId} thành công!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Đã đăng xuất khỏi hệ thống');
  };

  const handleCreateProject = async (newProj: ConstructionProject) => {
    setProjects((prev) => [newProj, ...prev]);
    await addProjectToFirestore(newProj);
    showToast(`Đã lưu công trình "${newProj.name}" lên Firebase Firestore`);
  };

  const handleDeleteProject = async (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    await deleteProjectFromFirestore(projectId);
    showToast('Đã xóa công trình khỏi Firestore');
  };

  const handleAddMaterial = async (newMat: MaterialItem) => {
    setMaterials((prev) => [newMat, ...prev]);
    await addMaterialToFirestore(newMat);
    showToast(`Đã lưu vật tư "${newMat.name}" lên Firebase Firestore`);
  };

  const handleDeleteMaterial = async (materialId: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    await deleteMaterialFromFirestore(materialId);
    showToast('Đã xóa vật tư khỏi Firestore');
  };

  const handleClearAllData = async () => {
    await clearAllDatabaseData();
    setProjects([]);
    setMaterials([]);
    setExportedGoods([]);
    setLaborLogs([]);
    setStaff([]);
    showToast('Đã xóa toàn bộ dữ liệu demo khỏi cơ sở dữ liệu!');
  };

  const handleAddExport = async (newExp: ExportedGood) => {
    // 1. Add export record
    setExportedGoods((prev) => [newExp, ...prev]);
    await addExportedGoodToFirestore(newExp);

    // 2. Deduct material stock in Firestore
    const targetMat = materials.find((m) => m.name === newExp.materialName);
    if (targetMat) {
      const updatedMat: MaterialItem = {
        ...targetMat,
        stockQty: Math.max(0, targetMat.stockQty - newExp.quantity),
      };
      setMaterials((prev) => prev.map((m) => (m.id === targetMat.id ? updatedMat : m)));
      await addMaterialToFirestore(updatedMat);
    }

    // 3. Update project totalExportsValue in Firestore
    const targetProj = projects.find((p) => p.name === newExp.projectName);
    if (targetProj) {
      const updatedProj: ConstructionProject = {
        ...targetProj,
        totalExportsValue: targetProj.totalExportsValue + newExp.totalPrice,
      };
      setProjects((prev) => prev.map((p) => (p.id === targetProj.id ? updatedProj : p)));
      await addProjectToFirestore(updatedProj);
    }

    showToast(`Đã lưu phiếu xuất "${newExp.materialName}" và đồng bộ kho & công trình lên Firebase`);
  };

  const handleAddLaborLog = async (newLog: LaborDailyLog) => {
    setLaborLogs((prev) => [...prev, newLog]);
    await addLaborLogToFirestore(newLog);

    // Update workdaysLogged on the relevant project if project is specified
    if (newLog.projectName) {
      const targetProj = projects.find((p) => p.name === newLog.projectName);
      if (targetProj) {
        const updatedProj: ConstructionProject = {
          ...targetProj,
          workdaysLogged: targetProj.workdaysLogged + newLog.totalWorkdays,
        };
        setProjects((prev) => prev.map((p) => (p.id === targetProj.id ? updatedProj : p)));
        await addProjectToFirestore(updatedProj);
      }
    }

    showToast(`Đã lưu chấm công ngày ${newLog.date} (${newLog.totalWorkdays} Công) lên Firebase`);
  };

  const handleAddStaff = async (newStaff: StaffMember) => {
    setStaff((prev) => [newStaff, ...prev]);
    await addStaffToFirestore(newStaff);
    showToast(`Đã lưu nhân sự "${newStaff.name}" lên Firebase Firestore`);
  };

  const handleDeleteStaff = async (staffId: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== staffId));
    await deleteStaffFromFirestore(staffId);
    showToast('Đã xóa nhân sự khỏi Firestore');
  };

  // If user is not logged in, show the Login screen directly
  if (!currentUser) {
    return (
      <div className="relative min-h-screen">
        {/* Quick helper banner to auto-login if user wants immediate preview */}
        <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              handleLoginSuccess({
                username: 'admin',
                role: 'admin',
                orgId: 'CT36',
                orgName: 'Công Ty Trường Sơn - Waterproofing 36',
                name: 'Quản Trị Viên (Admin)',
              })
            }
            className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold border border-white/30 shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            title="Bấm để vào thẳng màn hình Tổng quan"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Vào nhanh Tổng quan &gt;</span>
          </button>
        </div>

        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
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
        {/* Top Header Bar for Mobile and Quick Status */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between">
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
                {activeTab === 'dashboard' && 'Tổng quan công trường'}
                {activeTab === 'projects' && 'Danh mục công trình'}
                {activeTab === 'materials' && 'Vật tư & Định mức'}
                {activeTab === 'staff' && 'Nhân sự & Thợ thi công'}
                {activeTab === 'settings' && 'Cấu hình hệ thống'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Firebase Live Cloud Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold" title="Đã kết nối Firebase Firestore: chongtham36-c3c29">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Firebase Cloud DB</span>
            </div>

            {/* Switch to login screen preview button */}
            <button
              type="button"
              onClick={handleLogout}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              title="Xem lại màn hình Đăng nhập"
            >
              Đổi tài khoản / Xem Login
            </button>

            {/* Notification bell */}
            <div className="relative">
              <button
                type="button"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
              </button>
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <span className="text-xs font-bold text-slate-800 block truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-blue-600 font-semibold block uppercase">
                  {currentUser.orgId}
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
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView
              projects={projects}
              onOpenNewProject={() => setIsNewProjectOpen(true)}
              onDeleteProject={handleDeleteProject}
            />
          )}

          {activeTab === 'materials' && (
            <MaterialsView
              materials={materials}
              onOpenNewExport={() => setIsNewExportOpen(true)}
              onAddMaterial={handleAddMaterial}
              onDeleteMaterial={handleDeleteMaterial}
            />
          )}

          {activeTab === 'staff' && (
            <StaffView
              staff={staff}
              onAddStaff={handleAddStaff}
              onDeleteStaff={handleDeleteStaff}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              currentUser={currentUser}
              companySettings={companySettings}
              onUpdateCompanySettings={handleUpdateCompanySettings}
              onClearAllData={handleClearAllData}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onCreateProject={handleCreateProject}
      />

      <NewExportModal
        isOpen={isNewExportOpen}
        onClose={() => setIsNewExportOpen(false)}
        projects={projects}
        materials={materials}
        onAddExport={handleAddExport}
      />

      <LaborDetailModal
        isOpen={isLaborDetailOpen}
        onClose={() => setIsLaborDetailOpen(false)}
        laborLogs={laborLogs}
        onAddLaborLog={handleAddLaborLog}
      />

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
    </div>
  );
}
