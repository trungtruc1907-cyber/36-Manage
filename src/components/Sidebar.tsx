import React from 'react';
import {
  LayoutGrid,
  Compass,
  Archive,
  Users,
  Settings,
  Plus,
  HelpCircle,
  LogOut,
  X,
  Menu,
  Building2,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { CompanySettings, TenantOrganization, UserAccount } from '../types';

export type NavTab = 'dashboard' | 'projects' | 'materials' | 'staff' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenNewProject: () => void;
  onLogout: () => void;
  currentUser: UserAccount | null;
  companySettings?: CompanySettings;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenSupportModal: () => void;
  tenants?: TenantOrganization[];
  activeTenantId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewProject,
  onLogout,
  currentUser,
  companySettings,
  isOpenMobile,
  onCloseMobile,
  onOpenSupportModal,
  tenants = [],
  activeTenantId,
}) => {
  const menuItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: <LayoutGrid className="w-5 h-5" /> },
    { id: 'projects', label: 'Công trình', icon: <Compass className="w-5 h-5" /> },
    { id: 'materials', label: 'Vật tư', icon: <Archive className="w-5 h-5" /> },
    { id: 'staff', label: 'Nhân sự', icon: <Users className="w-5 h-5" /> },
    { id: 'settings', label: 'Thiết lập', icon: <Settings className="w-5 h-5" /> },
  ];

  const currentTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Aside */}
      <aside
        id="app-main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top Branding */}
        <div>
          <div className="p-4 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-1 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs flex items-center justify-center flex-shrink-0">
                <BrandLogo
                  size="md"
                  customLogoUrl={companySettings?.customLogoUrl}
                  brandName={companySettings?.brandName}
                  className="w-9 h-9"
                />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black text-blue-700 tracking-wider uppercase block leading-none truncate font-['Plus_Jakarta_Sans',sans-serif]">
                  {companySettings?.brandName || 'Trường Sơn Co.'}
                </span>
                <h1 className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-1 font-['Plus_Jakarta_Sans',sans-serif] mt-0.5 truncate">
                  Waterproofing <span className="text-[#0c5ec7]">36</span>
                </h1>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              id="close-mobile-sidebar-btn"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 mt-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0b5ed7] text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-500'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 space-y-2 border-t border-slate-100">
          {/* New Project CTA Button */}
          <button
            type="button"
            id="sidebar-create-project-btn"
            onClick={() => {
              onOpenNewProject();
              onCloseMobile();
            }}
            className="w-full bg-[#0c59be] hover:bg-[#094ca7] text-white text-sm font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo dự án mới</span>
          </button>

          {/* Help button */}
          <button
            type="button"
            id="sidebar-help-btn"
            onClick={onOpenSupportModal}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Hỗ trợ</span>
          </button>

          {/* Logout button */}
          <button
            type="button"
            id="sidebar-logout-btn"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400 hover:text-rose-500" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};
