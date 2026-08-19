import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Shield,
  Database,
  Globe,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  UploadCloud,
  Image as ImageIcon,
  Save,
  RotateCcw,
  Phone,
  Mail,
  MapPin,
  FileText,
  Sparkles,
  Key,
  Users,
  UserCheck,
  UserPlus,
  Eye,
  EyeOff,
  Check,
  History,
  Laptop,
  Smartphone,
  Search,
  Filter,
  X,
  Lock,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  Download,
  Upload,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import {
  CompanySettings,
  UserAccount,
  UserAccountRecord,
  LoginHistoryRecord,
  UserPermissions,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_USER_PERMISSIONS,
  hasUserPermission,
} from '../types';
import { DEFAULT_COMPANY_SETTINGS } from '../data/mockData';
import { INITIAL_USER_ACCOUNTS } from '../firebase';

export const PERMISSION_ITEMS: {
  key: keyof UserPermissions;
  label: string;
  description: string;
  badge: string;
  icon: any;
}[] = [
  {
    key: 'canViewMaterialCost',
    label: 'Xem giá vốn vật tư',
    description: 'Được xem đơn giá vốn, chi phí nhập kho và tổng giá trị vốn tồn kho.',
    badge: 'Giá Vốn',
    icon: Eye,
  },
  {
    key: 'canExportExcel',
    label: 'Xuất file Excel',
    description: 'Được tải file Excel danh mục vật tư, phiếu xuất kho, bảng chấm công & dự án.',
    badge: 'Xuất Excel',
    icon: FileSpreadsheet,
  },
  {
    key: 'canViewAllActivityLogs',
    label: 'Xem lịch sử thao tác của các user khác',
    description: 'Được xem nhật ký hoạt động, thao tác dữ liệu và lịch sử đăng nhập toàn hệ thống.',
    badge: 'Nhật Ký',
    icon: History,
  },
  {
    key: 'canChangeBrandLogo',
    label: 'Thay đổi logo thương hiệu',
    description: 'Được tải lên logo mới hoặc tùy biến biểu trưng nhận diện thương hiệu.',
    badge: 'Đổi Logo',
    icon: ImageIcon,
  },
  {
    key: 'canEditCompanyInfo',
    label: 'Thay đổi Thông Tin Doanh Nghiệp',
    description: 'Được chỉnh sửa tên doanh nghiệp, MST, địa chỉ, tài khoản ngân hàng.',
    badge: 'TT Doanh Nghiệp',
    icon: Building2,
  },
  {
    key: 'canViewUserList',
    label: 'Xem danh sách user',
    description: 'Được xem danh sách tài khoản người dùng và nhân sự hệ thống.',
    badge: 'DS User',
    icon: Users,
  },
];

interface SettingsViewProps {
  currentUser: UserAccount | null;
  accounts?: UserAccountRecord[];
  companySettings: CompanySettings;
  loginHistory?: LoginHistoryRecord[];
  onClearLoginHistory?: () => Promise<void> | void;
  onUpdateCompanySettings: (newSettings: CompanySettings) => Promise<void> | void;
  onSaveAccount?: (account: UserAccountRecord) => Promise<void> | void;
  onDeleteAccount?: (username: string) => Promise<void> | void;
  onClearAllData?: () => Promise<void> | void;
  onSeedSampleData?: () => Promise<void> | void;
  tenants?: any[];
  activeTenantId?: string;
  onSelectTenant?: (tenantId: string) => void;
  onRegisterNewEnterprise?: any;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  accounts = INITIAL_USER_ACCOUNTS,
  companySettings,
  loginHistory = [],
  onClearLoginHistory,
  onUpdateCompanySettings,
  onSaveAccount,
  onDeleteAccount,
  onClearAllData,
  onSeedSampleData,
}) => {
  const [activeTab, setActiveTab] = useState<'company' | 'users' | 'history' | 'database'>('company');

  // Form State
  const [formData, setFormData] = useState<CompanySettings>(companySettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(companySettings?.logoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User management states
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UserAccountRecord | null>(null);

  // User Form states
  const [modalName, setModalName] = useState('');
  const [modalUsername, setModalUsername] = useState('');
  const [modalPassword, setModalPassword] = useState('');
  const [modalRole, setModalRole] = useState<'admin' | 'storekeeper' | 'supervisor'>('supervisor');
  const [modalPhone, setModalPhone] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalPermissions, setModalPermissions] = useState<UserPermissions>(DEFAULT_USER_PERMISSIONS);
  const [modalShowPassword, setModalShowPassword] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  // Login History states
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const HISTORY_PER_PAGE = 10;

  // Database Danger Zone state
  const [isClearingData, setIsClearingData] = useState(false);
  const [isSeedingData, setIsSeedingData] = useState(false);

  // Admin Permission verification
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username?.toLowerCase() === 'admin';
  const canEditCompany = isAdmin || hasUserPermission(currentUser, 'canEditCompanyInfo');
  const canChangeLogo = isAdmin || hasUserPermission(currentUser, 'canChangeBrandLogo');
  const canViewUsers = isAdmin || hasUserPermission(currentUser, 'canViewUserList');
  const canViewAllLogs = isAdmin || hasUserPermission(currentUser, 'canViewAllActivityLogs');

  useEffect(() => {
    setFormData(companySettings);
    setLogoPreview(companySettings?.logoUrl || null);
  }, [companySettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Dung lượng ảnh không được vượt quá 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData((prev) => ({
          ...prev,
          logoUrl: result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setFormData((prev) => ({
      ...prev,
      logoUrl: undefined,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditCompany) {
      alert('Bạn không có quyền chỉnh sửa thông tin doanh nghiệp!');
      return;
    }
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await onUpdateCompanySettings(formData);
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
      alert('Có lỗi xảy ra khi lưu thiết lập');
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Khôi phục lại thông tin doanh nghiệp mặc định?')) {
      setFormData(DEFAULT_COMPANY_SETTINGS);
      setLogoPreview(DEFAULT_COMPANY_SETTINGS.customLogoUrl || null);
    }
  };

  // User Management Handlers
  const handleOpenAddUser = () => {
    setEditingAccount(null);
    setModalName('');
    setModalUsername('');
    setModalPassword('123456');
    setModalRole('supervisor');
    setModalPhone('');
    setModalEmail('');
    setModalPermissions(DEFAULT_USER_PERMISSIONS);
    setModalShowPassword(false);
    setModalError('');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (acc: UserAccountRecord) => {
    setEditingAccount(acc);
    setModalName(acc.name);
    setModalUsername(acc.username);
    setModalPassword(acc.password || '123456');
    setModalRole(acc.role);
    setModalPhone(acc.phone || '');
    setModalEmail(acc.email || '');
    setModalPermissions(acc.permissions || (acc.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS));
    setModalShowPassword(false);
    setModalError('');
    setIsUserModalOpen(true);
  };

  const handleRoleChange = (newRole: 'admin' | 'storekeeper' | 'supervisor') => {
    setModalRole(newRole);
    if (!editingAccount) {
      setModalPermissions(newRole === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS);
    }
  };

  const handleSaveUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    const cleanUsername = modalUsername.trim().toLowerCase().replace(/\s+/g, '');
    const cleanName = modalName.trim();
    const cleanPassword = modalPassword.trim();

    if (!cleanName) {
      setModalError('Vui lòng nhập Họ & Tên người dùng');
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      setModalError('Tên đăng nhập phải có ít nhất 3 ký tự (không dấu, không khoảng trắng)');
      return;
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      setModalError('Mật khẩu phải có ít nhất 4 ký tự');
      return;
    }

    if (!editingAccount) {
      const exists = accounts.some((a) => a.username.toLowerCase() === cleanUsername);
      if (exists) {
        setModalError(`Tên đăng nhập "${cleanUsername}" đã tồn tại! Vui lòng chọn tên khác.`);
        return;
      }
    }

    setModalSaving(true);
    try {
      const payload: UserAccountRecord = {
        username: cleanUsername,
        name: cleanName,
        password: cleanPassword,
        role: modalRole,
        orgId: companySettings.orgId || 'CT36',
        orgName: companySettings.orgName,
        phone: modalPhone.trim() || undefined,
        email: modalEmail.trim() || undefined,
        permissions: modalRole === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : modalPermissions,
        createdAt: editingAccount?.createdAt || new Date().toLocaleDateString('vi-VN'),
      };

      if (onSaveAccount) {
        await onSaveAccount(payload);
      }
      setModalSaving(false);
      setIsUserModalOpen(false);
    } catch (err) {
      setModalSaving(false);
      setModalError('Có lỗi khi lưu tài khoản người dùng!');
    }
  };

  const handleDeleteUser = async (usernameToDelete: string) => {
    if (usernameToDelete.toLowerCase() === 'admin') {
      alert('Không thể xóa tài khoản Admin gốc của hệ thống!');
      return;
    }
    if (usernameToDelete.toLowerCase() === currentUser?.username.toLowerCase()) {
      alert('Không thể tự xóa tài khoản bạn đang đăng nhập!');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${usernameToDelete}" khỏi hệ thống?`)) {
      if (onDeleteAccount) {
        await onDeleteAccount(usernameToDelete);
      }
    }
  };

  // Filtered Users
  const filteredUsers = accounts.filter((acc) => {
    const matchRole = userRoleFilter === 'all' ? true : acc.role === userRoleFilter;
    const q = userSearchTerm.toLowerCase().trim();
    const matchQuery =
      !q ||
      acc.name.toLowerCase().includes(q) ||
      acc.username.toLowerCase().includes(q) ||
      (acc.phone && acc.phone.includes(q)) ||
      (acc.email && acc.email.toLowerCase().includes(q));
    return matchRole && matchQuery;
  });

  // Filtered Login History
  const filteredHistory = loginHistory.filter((log) => {
    const matchStatus = historyStatusFilter === 'all' ? true : log.status === historyStatusFilter;
    const q = historySearch.toLowerCase().trim();
    const matchQuery =
      !q ||
      log.username.toLowerCase().includes(q) ||
      (log.name && log.name.toLowerCase().includes(q)) ||
      (log.device && log.device.toLowerCase().includes(q)) ||
      (log.timeFormatted && log.timeFormatted.toLowerCase().includes(q));
    return matchStatus && matchQuery;
  });

  const totalHistoryPages = Math.ceil(filteredHistory.length / HISTORY_PER_PAGE) || 1;
  const paginatedHistory = filteredHistory.slice(
    (historyCurrentPage - 1) * HISTORY_PER_PAGE,
    historyCurrentPage * HISTORY_PER_PAGE
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                Thiết Lập Hệ Thống
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                Độc Lập Dữ Liệu
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cấu hình thông tin doanh nghiệp, nhận diện thương hiệu, quản trị người dùng & bảo mật
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200 overflow-x-auto">
          <button
            type="button"
            id="tab-company-settings"
            onClick={() => setActiveTab('company')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'company'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Doanh Nghiệp & Logo</span>
          </button>

          {canViewUsers && (
            <button
              type="button"
              id="tab-user-settings"
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Người Dùng & Phân Quyền</span>
            </button>
          )}

          {canViewAllLogs && (
            <button
              type="button"
              id="tab-history-settings"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Lịch Sử Đăng Nhập</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              id="tab-database-settings"
              onClick={() => setActiveTab('database')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Cơ Sở Dữ Liệu</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================= TAB 1: COMPANY & LOGO ======================= */}
      {activeTab === 'company' && (
        <form onSubmit={handleSubmitCompany} className="space-y-6">
          {/* Logo & Identity Customization */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Biểu Trưng & Nhận Diện Thương Hiệu
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Xuất hiện trên header, phiếu xuất kho & báo cáo PDF
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-1">
              {/* Logo Preview Box */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-32 h-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center p-3 overflow-hidden shadow-xs relative group">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Brand Logo Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <BrandLogo className="w-12 h-12 mx-auto text-blue-600" />
                      <span className="text-[10px] text-slate-400 block mt-1">Logo mặc định</span>
                    </div>
                  )}
                </div>

                {canChangeLogo && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Tải ảnh lên</span>
                    </button>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs border border-rose-200 transition-colors cursor-pointer"
                        title="Xóa logo tùy chỉnh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>

              {/* Brand text & slogans */}
              <div className="flex-1 w-full space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Tên Thương Hiệu (Brand Name) <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      name="brandName"
                      value={formData.brandName || ''}
                      onChange={handleInputChange}
                      disabled={!canEditCompany}
                      placeholder="VD: Waterproofing 36"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-blue-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Mã Doanh Nghiệp (Org Code)
                    </label>
                    <input
                      type="text"
                      name="orgId"
                      value={formData.orgId || 'CT36'}
                      onChange={handleInputChange}
                      disabled={!canEditCompany}
                      placeholder="CT36"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 uppercase outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Khẩu hiệu / Slogan thương hiệu
                  </label>
                  <input
                    type="text"
                    name="tagline"
                    value={formData.tagline || ''}
                    onChange={handleInputChange}
                    disabled={!canEditCompany}
                    placeholder="VD: Quản lý thi công & vật tư chống thấm chuyên nghiệp"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Legal Company Information */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Thông Tin Pháp Lý & Liên Hệ
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Tên Doanh Nghiệp Đầy Đủ (Legal Name) <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  name="orgName"
                  value={formData.orgName || ''}
                  onChange={handleInputChange}
                  disabled={!canEditCompany}
                  placeholder="VD: Công Ty Cổ Phần Đầu Tư & Xây Dựng Trường Sơn"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mã Số Thuế (MST)
                  </label>
                  <input
                    type="text"
                    name="taxCode"
                    value={formData.taxCode || ''}
                    onChange={handleInputChange}
                    disabled={!canEditCompany}
                    placeholder="VD: 2801234567"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Số Điện Thoại Liên Hệ
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    disabled={!canEditCompany}
                    placeholder="0915 586 234"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Email Doanh Nghiệp
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    disabled={!canEditCompany}
                    placeholder="contact@chongtham36.vn"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Địa Chỉ Trụ Sở & Kho Trung Tâm
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  disabled={!canEditCompany}
                  placeholder="Số 36, Đại Lộ Lê Lợi, TP. Thanh Hóa, Tỉnh Thanh Hóa"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Tài Khoản Ngân Hàng Doanh Nghiệp
                  </label>
                  <input
                    type="text"
                    name="bankAccount"
                    value={formData.bankAccount || ''}
                    onChange={handleInputChange}
                    disabled={!canEditCompany}
                    placeholder="VD: 1029384756 - MB Bank"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Chủ Tài Khoản / Người Thụ Hưởng
                  </label>
                  <input
                    type="text"
                    name="bankHolder"
                    value={formData.bankHolder || ''}
                    onChange={handleInputChange}
                    disabled={!canEditCompany}
                    placeholder="CONG TY CP TRUONG SON"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          {canEditCompany && (
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Mặc Định</span>
              </button>

              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Đã lưu thành công!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>LƯU THIẾT LẬP DOANH NGHIỆP</span>
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* ======================= TAB 2: USER ACCOUNTS ======================= */}
      {activeTab === 'users' && canViewUsers && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  Danh Sách Tài Khoản & Phân Quyền
                </h2>
                <p className="text-xs text-slate-500">
                  Quản lý quyền truy cập của các thành viên trong công ty
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                id="add-user-btn"
                onClick={handleOpenAddUser}
                className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Thêm Tài Khoản Mới</span>
              </button>
            )}
          </div>

          {/* User Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Tìm theo họ tên, username, số điện thoại, email..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white outline-none focus:border-blue-600"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="admin">Quản trị viên (Admin)</option>
                <option value="storekeeper">Thủ kho vật tư</option>
                <option value="supervisor">Giám sát / Chỉ huy trưởng</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Tài Khoản</th>
                    <th className="py-3 px-4">Vai Trò</th>
                    <th className="py-3 px-4">Liên Hệ</th>
                    <th className="py-3 px-4">Quyền Hạn Cấp Phép</th>
                    <th className="py-3 px-4">Đăng Nhập Gần Nhất</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Thao Tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.map((acc) => {
                    const roleBadge =
                      acc.role === 'admin'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : acc.role === 'storekeeper'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                    const roleLabel =
                      acc.role === 'admin'
                        ? 'Quản Trị Viên'
                        : acc.role === 'storekeeper'
                        ? 'Thủ Kho'
                        : 'Giám Sát';

                    return (
                      <tr key={acc.username} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{acc.name}</div>
                          <div className="text-[11px] font-mono text-slate-500">{acc.username}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${roleBadge}`}
                          >
                            {roleLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px]">
                          <div>{acc.phone || '—'}</div>
                          <div className="text-slate-400">{acc.email || '—'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {acc.role === 'admin' ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold border border-purple-200">
                                Toàn quyền quản trị
                              </span>
                            ) : (
                              PERMISSION_ITEMS.filter(
                                (p) => acc.permissions && acc.permissions[p.key]
                              ).map((p) => (
                                <span
                                  key={p.key}
                                  className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                                >
                                  {p.badge}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-500 font-mono">
                          {acc.lastLoginAt || 'Chưa đăng nhập'}
                        </td>
                        {isAdmin && (
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditUser(acc)}
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                                title="Chỉnh sửa tài khoản & phân quyền"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {acc.username.toLowerCase() !== 'admin' &&
                                acc.username.toLowerCase() !== currentUser?.username.toLowerCase() && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(acc.username)}
                                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                    title="Xóa tài khoản"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        Không tìm thấy tài khoản nào phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 3: LOGIN HISTORY ======================= */}
      {activeTab === 'history' && canViewAllLogs && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  Lịch Sử Đăng Nhập & Truy Cập
                </h2>
                <p className="text-xs text-slate-500">
                  Ghi nhận các phiên đăng nhập, thiết bị và thời gian truy cập
                </p>
              </div>
            </div>

            {isAdmin && onClearLoginHistory && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử đăng nhập?')) {
                    setIsClearingHistory(true);
                    await onClearLoginHistory();
                    setIsClearingHistory(false);
                  }
                }}
                disabled={isClearingHistory || loginHistory.length === 0}
                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa Lịch Sử</span>
              </button>
            )}
          </div>

          {/* History Search & Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setHistoryCurrentPage(1);
                }}
                placeholder="Tìm theo user, thiết bị, ngày giờ..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={historyStatusFilter}
              onChange={(e) => {
                setHistoryStatusFilter(e.target.value as any);
                setHistoryCurrentPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white outline-none focus:border-blue-600"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="success">Đăng nhập thành công</option>
              <option value="failed">Đăng nhập thất bại</option>
            </select>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Thời Gian</th>
                    <th className="py-3 px-4">Người Dùng</th>
                    <th className="py-3 px-4">Thiết Bị</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4">Ghi Chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedHistory.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 font-semibold">
                        {log.timeFormatted}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{log.name || log.username}</div>
                        <div className="text-[10px] font-mono text-slate-500">@{log.username}</div>
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          {log.device?.toLowerCase().includes('phone') ||
                          log.device?.toLowerCase().includes('di động') ? (
                            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <Laptop className="w-3.5 h-3.5 text-slate-600" />
                          )}
                          <span>{log.device || 'Trình duyệt web'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {log.status === 'success' ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            Thành công
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                            Thất bại
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500">{log.notes || '—'}</td>
                    </tr>
                  ))}
                  {paginatedHistory.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        Chưa có dữ liệu lịch sử đăng nhập
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalHistoryPages > 1 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Trang {historyCurrentPage} / {totalHistoryPages} ({filteredHistory.length} bản ghi)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setHistoryCurrentPage(1)}
                    disabled={historyCurrentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={historyCurrentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryCurrentPage((p) => Math.min(totalHistoryPages, p + 1))}
                    disabled={historyCurrentPage === totalHistoryPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryCurrentPage(totalHistoryPages)}
                    disabled={historyCurrentPage === totalHistoryPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= TAB 4: DATABASE & MAINTENANCE ======================= */}
      {activeTab === 'database' && isAdmin && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  Quản Trị Cơ Sở Dữ Liệu Độc Lập
                </h2>
                <p className="text-xs text-slate-500">
                  Các công cụ sao lưu, nạp dữ liệu mẫu và làm sạch kho dữ liệu
                </p>
              </div>
            </div>

            {/* Seed & Reset Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Seed Sample Data Card */}
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 space-y-3">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Nạp Bộ Dữ Liệu Chuẩn Mẫu</span>
                </div>
                <p className="text-xs text-slate-600">
                  Nạp lại bộ dữ liệu danh mục vật tư chống thấm chuẩn (Sika, Neomax...), công trình mẫu, bảng chấm công và hồ sơ nhân sự.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      window.confirm(
                        'Bạn có chắc muốn nạp lại bộ dữ liệu chuẩn mẫu vào cơ sở dữ liệu?'
                      )
                    ) {
                      setIsSeedingData(true);
                      if (onSeedSampleData) {
                        await onSeedSampleData();
                      }
                      setIsSeedingData(false);
                      alert('Đã nạp bộ dữ liệu mẫu thành công!');
                    }
                  }}
                  disabled={isSeedingData}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSeedingData ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>Nạp Lại Dữ Liệu Mẫu</span>
                </button>
              </div>

              {/* Clear All Data (Danger Zone) */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-3">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Xóa Trắng Dữ Liệu (Danger Zone)</span>
                </div>
                <p className="text-xs text-rose-800">
                  Xóa toàn bộ vật tư, công trình, xuất kho, chấm công để nhập liệu lại từ đầu. Thao tác này không thể hoàn tác.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    const confirmCode = window.prompt(
                      'CẢNH BÁO: Nhập chữ "XOA TRANG" để xác nhận xóa toàn bộ dữ liệu:'
                    );
                    if (confirmCode === 'XOA TRANG') {
                      setIsClearingData(true);
                      if (onClearAllData) {
                        await onClearAllData();
                      }
                      setIsClearingData(false);
                      alert('Đã làm sạch toàn bộ cơ sở dữ liệu!');
                    }
                  }}
                  disabled={isClearingData}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isClearingData ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Xóa Trắng Toàn Bộ Dữ Liệu</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: ADD / EDIT USER ======================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                    {editingAccount ? 'Chỉnh Sửa Tài Khoản' : 'Thêm Tài Khoản Người Dùng Mới'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cấu hình thông tin đăng nhập và phân quyền chi tiết
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Error banner */}
            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUserSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Họ & Tên <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="VD: Lê Văn Bảo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Username & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Tên đăng nhập <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingAccount}
                    value={modalUsername}
                    onChange={(e) => setModalUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="thukho_01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Vai trò / Chức danh <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <select
                    value={modalRole}
                    onChange={(e) => handleRoleChange(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="supervisor">Giám sát / Chỉ huy trưởng</option>
                    <option value="storekeeper">Thủ kho vật tư</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Mật khẩu đăng nhập <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    type={modalShowPassword ? 'text' : 'password'}
                    required
                    value={modalPassword}
                    onChange={(e) => setModalPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setModalShowPassword(!modalShowPassword)}
                    className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {modalShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Số điện thoại</label>
                  <input
                    type="tel"
                    value={modalPhone}
                    onChange={(e) => setModalPhone(e.target.value)}
                    placeholder="0988 123 456"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    placeholder="user@chongtham36.vn"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Permissions Checkboxes */}
              {modalRole !== 'admin' && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">
                    Phân Quyền Chức Năng Chi Tiết:
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {PERMISSION_ITEMS.map((item) => {
                      const isChecked = !!modalPermissions[item.key];
                      return (
                        <label
                          key={item.key}
                          className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              setModalPermissions((prev) => ({
                                ...prev,
                                [item.key]: e.target.checked,
                              }));
                            }}
                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800">{item.label}</span>
                            <p className="text-[10px] text-slate-500 leading-tight">
                              {item.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
                >
                  {modalSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>LƯU TÀI KHOẢN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
