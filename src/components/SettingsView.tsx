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
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { CompanySettings, TenantOrganization, UserAccount, UserAccountRecord, LoginHistoryRecord } from '../types';
import { DEFAULT_COMPANY_SETTINGS } from '../data/mockData';
import { INITIAL_USER_ACCOUNTS } from '../firebase';

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
  tenants?: TenantOrganization[];
  activeTenantId?: string;
  onSelectTenant?: (tenantId: string) => void;
  onOpenTenantManager?: () => void;
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
  tenants = [],
  activeTenantId,
  onSelectTenant,
  onOpenTenantManager,
}) => {
  // Form states
  const [formData, setFormData] = useState<CompanySettings>(companySettings);
  const [logoPreview, setLogoPreview] = useState<string | null>(companySettings.customLogoUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Admin permission check
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username?.toLowerCase() === 'admin';

  // Password Change state for active user
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Add New Account Modal & State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addUsername, setAddUsername] = useState('');
  const [addPassword, setAddPassword] = useState('123456');
  const [addRole, setAddRole] = useState<'admin' | 'storekeeper' | 'supervisor'>('supervisor');
  const [addOrgId, setAddOrgId] = useState(companySettings?.orgId || 'CT36');
  const [addPhone, setAddPhone] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addAllowedTenants, setAddAllowedTenants] = useState<string[]>([]);
  const [addUserError, setAddUserError] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Edit Account Modal & State
  const [editingAccount, setEditingAccount] = useState<UserAccountRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRoleValue, setEditRoleValue] = useState<'admin' | 'storekeeper' | 'supervisor'>('supervisor');
  const [editOrgId, setEditOrgId] = useState('CT36');
  const [editOrgName, setEditOrgName] = useState('');
  const [editPassValue, setEditPassValue] = useState('');
  const [editShowPass, setEditShowPass] = useState(false);
  const [editAllowedTenants, setEditAllowedTenants] = useState<string[]>([]);
  const [editUserError, setEditUserError] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Account Modal & State
  const [deletingAccount, setDeletingAccount] = useState<UserAccountRecord | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Account Search & Filter State
  const [searchAccountQuery, setSearchAccountQuery] = useState('');
  const [filterAccountRole, setFilterAccountRole] = useState<'all' | 'admin' | 'storekeeper' | 'supervisor'>('all');

  // Login History Search & Filter states
  const [searchLoginQuery, setSearchLoginQuery] = useState('');
  const [filterLoginStatus, setFilterLoginStatus] = useState<'all' | 'success' | 'failed'>('all');
  const [isConfirmingClearLogs, setIsConfirmingClearLogs] = useState(false);
  const [isClearingLogs, setIsClearingLogs] = useState(false);

  // Clear & Seed data states
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle password change for active user
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!newPassword.trim() || newPassword.length < 4) {
      setPasswordMsg({ text: 'Mật khẩu mới phải có ít nhất 4 ký tự', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Mật khẩu xác nhận không khớp', isError: true });
      return;
    }

    if (!currentUser) return;

    setIsChangingPass(true);
    const existing = accounts.find((a) => a.username.toLowerCase() === currentUser.username.toLowerCase());
    const updatedAccount: UserAccountRecord = {
      username: currentUser.username,
      name: currentUser.name,
      role: currentUser.role,
      orgId: currentUser.orgId,
      orgName: currentUser.orgName,
      phone: currentUser.phone || existing?.phone,
      email: currentUser.email || existing?.email,
      password: newPassword.trim(),
    };

    if (onSaveAccount) {
      await onSaveAccount(updatedAccount);
    }

    setIsChangingPass(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMsg({ text: 'Đã cập nhật mật khẩu mới thành công lên Realtime Database!', isError: false });
  };

  // Handle Open Create Account Modal
  const handleOpenCreateAccount = () => {
    setAddUserError('');
    setAddName('');
    setAddUsername('');
    setAddPassword('123456');
    setAddRole('supervisor');
    setAddOrgId(companySettings?.orgId || 'CT36');
    setAddPhone('');
    setAddEmail('');
    setAddAllowedTenants(activeTenantId ? [activeTenantId] : ['tenant_ct36']);
    setIsAddUserOpen(true);
  };

  // Handle Create Account Submit
  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError('');

    const cleanUsername = addUsername.trim().toLowerCase().replace(/\s+/g, '');
    const cleanName = addName.trim();
    const cleanPass = addPassword.trim();
    const cleanOrg = addOrgId.trim().toUpperCase() || 'CT36';

    if (!cleanName) {
      setAddUserError('Vui lòng nhập Họ tên nhân sự');
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      setAddUserError('Tên đăng nhập phải có ít nhất 3 ký tự (không dấu, không khoảng trắng)');
      return;
    }
    if (!cleanPass || cleanPass.length < 4) {
      setAddUserError('Mật khẩu phải có ít nhất 4 ký tự');
      return;
    }

    // Check duplicate
    if (accounts.some((a) => a.username.toLowerCase() === cleanUsername)) {
      setAddUserError(`Tên đăng nhập "${cleanUsername}" đã tồn tại trong hệ thống!`);
      return;
    }

    setIsSavingUser(true);
    const targetTenant = tenants.find((t) => t.code?.toUpperCase() === cleanOrg || t.id === addAllowedTenants[0]);
    const orgName = targetTenant?.name || companySettings?.orgName || `Đơn vị ${cleanOrg}`;

    const newAcc: UserAccountRecord = {
      username: cleanUsername,
      password: cleanPass,
      name: cleanName,
      role: addRole,
      orgId: cleanOrg,
      orgName,
      phone: addPhone.trim() || undefined,
      email: addEmail.trim() || undefined,
      allowedTenants: addAllowedTenants.length > 0 ? addAllowedTenants : undefined,
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };

    if (onSaveAccount) {
      await onSaveAccount(newAcc);
    }

    setIsSavingUser(false);
    setIsAddUserOpen(false);
    setAddName('');
    setAddUsername('');
    setAddPassword('123456');
    setAddPhone('');
    setAddEmail('');
  };

  // Handle Open Edit Account Modal
  const handleOpenEditAccount = (acc: UserAccountRecord) => {
    setEditingAccount(acc);
    setEditName(acc.name || '');
    setEditPhone(acc.phone || '');
    setEditEmail(acc.email || '');
    setEditRoleValue(acc.role || 'supervisor');
    setEditOrgId(acc.orgId || 'CT36');
    setEditOrgName(acc.orgName || '');
    setEditPassValue('');
    setEditShowPass(false);
    setEditAllowedTenants(acc.allowedTenants || (acc.createdTenantId ? [acc.createdTenantId] : ['tenant_ct36']));
    setEditUserError('');
  };

  // Handle Edit Account Save
  const handleSaveEditAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    setEditUserError('');

    const cleanName = editName.trim();
    if (!cleanName) {
      setEditUserError('Họ và tên nhân sự không được để trống');
      return;
    }

    setIsSavingEdit(true);
    try {
      const cleanOrg = editOrgId.trim().toUpperCase() || 'CT36';
      const targetTenant = tenants.find((t) => t.code?.toUpperCase() === cleanOrg || t.id === editAllowedTenants[0]);
      const orgName = editOrgName.trim() || targetTenant?.name || editingAccount.orgName || `Đơn vị ${cleanOrg}`;

      const updated: UserAccountRecord = {
        ...editingAccount,
        name: cleanName,
        phone: editPhone.trim() || undefined,
        email: editEmail.trim() || undefined,
        role: editRoleValue,
        orgId: cleanOrg,
        orgName,
        allowedTenants: editAllowedTenants.length > 0 ? editAllowedTenants : undefined,
        password: editPassValue.trim() ? editPassValue.trim() : editingAccount.password,
      };

      if (onSaveAccount) {
        await onSaveAccount(updated);
      }

      setIsSavingEdit(false);
      setEditingAccount(null);
    } catch (err) {
      console.error('Error saving user account:', err);
      setIsSavingEdit(false);
      setEditUserError('Đã có lỗi xảy ra khi lưu thông tin tài khoản.');
    }
  };

  // Handle Open Delete Account Modal
  const handleOpenDeleteAccount = (acc: UserAccountRecord) => {
    setDeletingAccount(acc);
  };

  // Handle Confirm Delete Account
  const handleConfirmDeleteAccount = async () => {
    if (!deletingAccount || !onDeleteAccount) return;
    setIsDeletingUser(true);
    try {
      await onDeleteAccount(deletingAccount.username);
      setIsDeletingUser(false);
      setDeletingAccount(null);
    } catch (err) {
      console.error('Error deleting user account:', err);
      setIsDeletingUser(false);
    }
  };

  // Handle Clear Logs
  const handleClearLogs = async () => {
    if (!onClearLoginHistory) return;
    setIsClearingLogs(true);
    await onClearLoginHistory();
    setIsClearingLogs(false);
    setIsConfirmingClearLogs(false);
  };

  // Filter login logs
  const filteredLogs = loginHistory.filter((log) => {
    const matchSearch =
      !searchLoginQuery ||
      log.username.toLowerCase().includes(searchLoginQuery.toLowerCase()) ||
      log.name.toLowerCase().includes(searchLoginQuery.toLowerCase()) ||
      log.orgId.toLowerCase().includes(searchLoginQuery.toLowerCase()) ||
      log.timeFormatted.includes(searchLoginQuery);

    const matchStatus =
      filterLoginStatus === 'all' ||
      (filterLoginStatus === 'success' && log.status === 'success') ||
      (filterLoginStatus === 'failed' && log.status === 'failed');

    return matchSearch && matchStatus;
  });

  // Sync state when prop updates
  useEffect(() => {
    setFormData(companySettings);
    setLogoPreview(companySettings.customLogoUrl);
  }, [companySettings]);

  // Handle Logo Upload via File Reader
  const processImageFile = (file: File) => {
    setUploadError(null);

    // Validate mime type
    if (!file.type.startsWith('image/')) {
      setUploadError('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, JPEG, SVG, WebP).');
      return;
    }

    // Validate size (max 2.5MB)
    if (file.size > 2.5 * 1024 * 1024) {
      setUploadError('Dung lượng ảnh vượt quá 2.5MB. Vui lòng chọn ảnh nhẹ hơn.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoPreview(result);
      setFormData((prev) => ({ ...prev, customLogoUrl: result }));
    };
    reader.onerror = () => {
      setUploadError('Không thể đọc file ảnh. Vui lòng thử lại.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleResetToDefaultLogo = () => {
    setLogoPreview(null);
    setFormData((prev) => ({ ...prev, customLogoUrl: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetAllToDefault = () => {
    setFormData(DEFAULT_COMPANY_SETTINGS);
    setLogoPreview(DEFAULT_COMPANY_SETTINGS.customLogoUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setUploadError(null);

    try {
      await onUpdateCompanySettings(formData);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Error saving company settings:', err);
      setUploadError('Không thể lưu cài đặt. Vui lòng kiểm tra kết nối mạng.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    if (!onClearAllData) return;
    setIsClearing(true);
    await onClearAllData();
    setIsClearing(false);
    setIsConfirmingClear(false);
    setClearedSuccess(true);
    setTimeout(() => {
      setClearedSuccess(false);
    }, 4000);
  };

  const handleSeed = async () => {
    if (!onSeedSampleData) return;
    setIsSeeding(true);
    await onSeedSampleData();
    setIsSeeding(false);
    setSeedSuccess(true);
    setTimeout(() => {
      setSeedSuccess(false);
    }, 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Thiết Lập Hệ Thống & Doanh Nghiệp</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình thông tin doanh nghiệp, tải lên logo thương hiệu và quản lý cơ sở dữ liệu
          </p>
        </div>

        {saveSuccess && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã lưu cài đặt doanh nghiệp thành công!</span>
          </div>
        )}
      </div>

      {/* MULTI-TENANT WORKSPACE CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 shadow-md border border-slate-700/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner flex-shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 font-mono bg-blue-500/20 px-2 py-0.5 rounded">
                  Multi-Tenant Database
                </span>
                <span className="text-xs text-slate-300">
                  {tenants.length} Đơn vị trực thuộc
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                Không Gian Làm Việc: {tenants.find((t) => t.id === activeTenantId)?.name || companySettings.orgName} ({tenants.find((t) => t.id === activeTenantId)?.code || companySettings.orgId})
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Toàn bộ dữ liệu Dự án, Kho vật tư, Chấm công và Lịch sử hoạt động được cô lập và đồng bộ độc lập cho từng chi nhánh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              id="settings-open-tenant-manager-btn"
              onClick={onOpenTenantManager}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Quản Lý Chi Nhánh / Đơn Vị</span>
            </button>
          </div>
        </div>

        {/* Quick Branch Switcher Chips */}
        <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1">Chuyển nhanh không gian:</span>
          {tenants.map((t) => {
            const isCurrent = t.id === activeTenantId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  if (onSelectTenant) onSelectTenant(t.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-500 text-white shadow-xs ring-2 ring-blue-300/40'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                <span className="font-mono text-[10px] bg-black/30 px-1 py-0.2 rounded font-bold">{t.code}</span>
                <span className="truncate max-w-[160px]">{t.brandName || t.name}</span>
                {isCurrent && <Check className="w-3.5 h-3.5 text-blue-200" />}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: LOGO UPLOAD & BRAND PREVIEW */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Logo & Nhận Diện Thương Hiệu</h3>
                <p className="text-[11px] text-slate-500">Tải lên file logo tùy chỉnh để thay thế biểu trưng toàn hệ thống</p>
              </div>
            </div>

            {logoPreview && (
              <button
                type="button"
                id="reset-logo-btn"
                onClick={handleResetToDefaultLogo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Dùng logo Trường Sơn mặc định</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Upload Zone (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div
                id="logo-dropzone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/80 ring-4 ring-blue-100'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  id="logo-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3 shadow-xs">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <h4 className="text-xs font-bold text-slate-800 mb-1">
                  Kéo thả file logo vào đây hoặc <span className="text-blue-600 underline">bấm để chọn file</span>
                </h4>
                <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                  Hỗ trợ các định dạng PNG, JPG, JPEG, SVG, WebP. Khuyến nghị ảnh nền trong suốt (PNG/SVG), tỉ lệ 1:1, tối đa 2.5MB.
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-600">
                    PNG / SVG
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-600">
                    Nền trong suốt
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-600">
                    Tỉ lệ 1:1
                  </span>
                </div>
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>

            {/* Live Context Previews (5 cols) */}
            <div className="lg:col-span-5 bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Xem trước hiển thị thực tế</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  {logoPreview ? 'Logo tùy chỉnh' : 'Logo mặc định'}
                </span>
              </div>

              {/* Preview 1: Sidebar top badge style */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Trên thanh Sidebar & Header
                </span>
                <div className="flex items-center gap-3">
                  <div className="p-1 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center flex-shrink-0">
                    <BrandLogo size="md" customLogoUrl={logoPreview} brandName={formData.brandName} className="w-9 h-9" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black text-blue-700 tracking-wider uppercase block leading-none truncate font-['Plus_Jakarta_Sans',sans-serif]">
                      {formData.brandName || 'Trường Sơn Co.'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1 mt-0.5 truncate">
                      Waterproofing <span className="text-[#0c5ec7]">36</span>
                    </h4>
                  </div>
                </div>
              </div>

              {/* Preview 2: Login screen preview */}
              <div className="p-3.5 bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl text-white shadow-xs space-y-2">
                <span className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider block">
                  Trên Màn Hình Đăng Nhập
                </span>
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-full bg-white/95 shadow-md flex items-center justify-center flex-shrink-0">
                    <BrandLogo size="md" customLogoUrl={logoPreview} brandName={formData.brandName} className="w-10 h-10" />
                  </div>
                  <div className="min-w-0 text-left">
                    <span className="text-[10px] font-black tracking-widest text-blue-100 uppercase block truncate">
                      {formData.brandName || 'TRUONG SON COMPANY'}
                    </span>
                    <span className="text-xs font-extrabold tracking-wider text-white uppercase block truncate">
                      WATERPROOFING <span className="text-[#fbbf24]">36</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: COMPANY / ORGANIZATION PROFILE */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Thông Tin Doanh Nghiệp & Chi Nhánh</h3>
                <p className="text-[11px] text-slate-500">Chỉnh sửa thông tin doanh nghiệp hiển thị trên báo cáo, phiếu xuất và giao diện</p>
              </div>
            </div>

            <button
              type="button"
              id="reset-form-default-btn"
              onClick={handleResetAllToDefault}
              className="text-xs text-slate-500 hover:text-blue-600 hover:underline font-medium cursor-pointer"
            >
              Khôi phục mặc định
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Field 1: Mã Doanh Nghiệp */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Mã Doanh Nghiệp (Org ID) <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white shadow-2xs">
                <input
                  id="settings-orgid-input"
                  type="text"
                  required
                  value={formData.orgId}
                  onChange={(e) => setFormData({ ...formData, orgId: e.target.value.toUpperCase() })}
                  placeholder="CT36"
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 uppercase outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400">Dùng để phân biệt dữ liệu và mã đăng nhập đơn vị</p>
            </div>

            {/* Field 2: Tên Đầy Đủ Doanh Nghiệp */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">
                Tên Đầy Đủ Doanh Nghiệp / Chi Nhánh <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white shadow-2xs">
                <input
                  id="settings-orgname-input"
                  type="text"
                  required
                  value={formData.orgName}
                  onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                  placeholder="Công Ty Trường Sơn - Waterproofing 36"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400">Tên pháp nhân hiển thị trên tiêu đề hệ thống và phiếu xuất kho</p>
            </div>

            {/* Field 3: Tên Thương Hiệu Ngắn */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Tên Thương Hiệu Ngắn (Brand Name)
              </label>
              <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white shadow-2xs">
                <input
                  id="settings-brandname-input"
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  placeholder="Trường Sơn Co."
                  className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Field 4: Hotline / Số điện thoại */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Số Điện Thoại / Hotline</span>
              </label>
              <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white shadow-2xs">
                <input
                  id="settings-phone-input"
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0915 586 234"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Field 5: Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Liên Hệ</span>
              </label>
              <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white shadow-2xs">
                <input
                  id="settings-email-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@chongtham36.vn"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Field 6: Địa Chỉ */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Địa Chỉ Trụ Sở / Kho Hàng</span>
              </label>
              <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white shadow-2xs">
                <input
                  id="settings-address-input"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Số 36 Đại Lộ Lê Lợi, TP. Thanh Hóa"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Field 7: Mã Số Thuế */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Mã Số Thuế (MST)</span>
              </label>
              <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white shadow-2xs">
                <input
                  id="settings-taxcode-input"
                  type="text"
                  value={formData.taxCode}
                  onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                  placeholder="2801987654"
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-medium text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Field 8: Khẩu hiệu / Tagline */}
            <div className="space-y-1.5 sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700">
                Khẩu Hiệu / Giới Thiệu Ngắn (Tagline)
              </label>
              <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white shadow-2xs">
                <input
                  id="settings-tagline-input"
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Hệ thống Quản lý Thi công & Vật tư Chống thấm"
                  className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Save Button Action */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="submit"
              id="save-company-settings-btn"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0c59be] hover:bg-[#094ca7] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang lưu lên Firestore...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Lưu Thay Đổi Cài Đặt</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* SECTION 3: USER PROFILE & FIREBASE CLOUD */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-6">
        {/* User profile & Active Role */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Tài khoản & Phân quyền đang hoạt động</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 uppercase">
              {currentUser?.role === 'admin'
                ? '👑 Quản Trị Viên'
                : currentUser?.role === 'storekeeper'
                ? '📦 Thủ Kho'
                : '👷 Giám Sát'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Họ tên nhân sự</label>
              <input
                type="text"
                disabled
                value={currentUser?.name || 'Quản Trị Viên'}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tên đăng nhập (User)</label>
              <input
                type="text"
                disabled
                value={currentUser?.username || 'admin'}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono font-bold text-blue-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mã Doanh Nghiệp (Org ID)</label>
              <input
                type="text"
                disabled
                value={currentUser?.orgId || 'CT36'}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 uppercase"
              />
            </div>
          </div>

          {/* Change Password Form */}
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
              <Key className="w-3.5 h-3.5 text-blue-600" />
              <span>Đổi Mật Khẩu Cho Tài Khoản Này</span>
            </h4>

            {passwordMsg && (
              <div
                className={`mb-3 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  passwordMsg.isError
                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                }`}
              >
                {passwordMsg.isError ? (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <Check className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-300 outline-none focus:border-blue-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex-1 min-w-[160px]">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nhập lại mật khẩu</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu"
                  className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-300 outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPass}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {isChangingPass ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Lưu Mật Khẩu</span>
              </button>
            </form>
          </div>

          {/* System Accounts Directory & Management */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Quản Lý Tài Khoản Hệ Thống ({accounts.length})</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {isAdmin
                    ? '👑 Bạn đang đăng nhập với quyền Admin: Có toàn quyền Sửa thông tin, phân quyền và Xóa các tài khoản người dùng khác.'
                    : 'Tài khoản được lưu đồng bộ thời gian thực trên Firebase Realtime Database'}
                </p>
              </div>

              {isAdmin && onSaveAccount && (
                <button
                  type="button"
                  id="add-new-user-account-btn"
                  onClick={handleOpenCreateAccount}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Thêm Tài Khoản Mới</span>
                </button>
              )}
            </div>

            {/* Account Search & Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchAccountQuery}
                  onChange={(e) => setSearchAccountQuery(e.target.value)}
                  placeholder="Tìm theo tên, username, SĐT, email hoặc đơn vị..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-600"
                />
                {searchAccountQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchAccountQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setFilterAccountRole('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    filterAccountRole === 'all'
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Tất cả ({accounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterAccountRole('admin')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    filterAccountRole === 'admin'
                      ? 'bg-white text-amber-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  👑 Admin ({accounts.filter((a) => a.role === 'admin').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterAccountRole('storekeeper')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    filterAccountRole === 'storekeeper'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  📦 Thủ Kho ({accounts.filter((a) => a.role === 'storekeeper').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterAccountRole('supervisor')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    filterAccountRole === 'supervisor'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  👷 Giám Sát ({accounts.filter((a) => a.role === 'supervisor').length})
                </button>
              </div>
            </div>

            {/* Accounts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {accounts
                .filter((acc) => {
                  const matchSearch =
                    !searchAccountQuery ||
                    acc.name?.toLowerCase().includes(searchAccountQuery.toLowerCase()) ||
                    acc.username?.toLowerCase().includes(searchAccountQuery.toLowerCase()) ||
                    (acc.phone && acc.phone.includes(searchAccountQuery)) ||
                    (acc.email && acc.email.toLowerCase().includes(searchAccountQuery.toLowerCase())) ||
                    (acc.orgId && acc.orgId.toLowerCase().includes(searchAccountQuery.toLowerCase())) ||
                    (acc.orgName && acc.orgName.toLowerCase().includes(searchAccountQuery.toLowerCase()));

                  const matchRole = filterAccountRole === 'all' || acc.role === filterAccountRole;
                  return matchSearch && matchRole;
                })
                .map((acc) => {
                  const isCurrentLoggedUser =
                    acc.username.toLowerCase() === (currentUser?.username || '').toLowerCase();

                  return (
                    <div
                      key={acc.username}
                      className={`p-3.5 bg-slate-50/90 rounded-xl border text-xs flex flex-col justify-between hover:border-slate-300 transition-all shadow-2xs ${
                        isCurrentLoggedUser
                          ? 'border-blue-300 bg-blue-50/30 ring-1 ring-blue-100'
                          : 'border-slate-200/90'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                acc.role === 'admin'
                                  ? 'bg-amber-100 text-amber-800'
                                  : acc.role === 'storekeeper'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {acc.name ? acc.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 truncate text-xs block" title={acc.name}>
                                {acc.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">@{acc.username}</span>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0 ${
                              acc.role === 'admin'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : acc.role === 'storekeeper'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {acc.role === 'admin'
                              ? '👑 Admin'
                              : acc.role === 'storekeeper'
                              ? '📦 Thủ Kho'
                              : '👷 Giám Sát'}
                          </span>
                        </div>

                        <div className="space-y-1 text-slate-600 bg-white/70 p-2 rounded-lg border border-slate-100">
                          {acc.phone && (
                            <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span className="font-medium text-slate-700">{acc.phone}</span>
                            </div>
                          )}
                          {acc.email && (
                            <div className="text-[11px] text-slate-600 flex items-center gap-1.5 truncate">
                              <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span className="text-slate-600 truncate">{acc.email}</span>
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                            <span>Đơn vị: <strong className="text-slate-700">{acc.orgId || 'CT36'}</strong></span>
                            {acc.createdAt && (
                              <span className="text-slate-400">Tạo: {acc.createdAt}</span>
                            )}
                          </div>
                          {acc.lastLoginAt && (
                            <div className="text-[10px] text-slate-500 pt-0.5 border-t border-slate-100">
                              Đăng nhập: <span className="font-medium text-slate-600">{acc.lastLoginAt}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                        {isCurrentLoggedUser ? (
                          <span className="text-[10px] font-semibold text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            <span>Bạn đang đăng nhập</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">
                            {acc.allowedTenants && acc.allowedTenants.length > 1
                              ? `Truy cập: ${acc.allowedTenants.length} chi nhánh`
                              : `Chi nhánh: ${acc.orgId || 'CT36'}`}
                          </span>
                        )}

                        <div className="flex items-center gap-1">
                          {/* Nút Sửa: Admin có quyền sửa tất cả user */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditAccount(acc)}
                              className="px-2 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title={`Sửa thông tin, mật khẩu & quyền tài khoản ${acc.username}`}
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Sửa</span>
                            </button>
                          )}

                          {/* Nút Xóa: Admin có quyền xóa tất cả các user khác (ngoại trừ tài khoản đang đăng nhập) */}
                          {isAdmin && onDeleteAccount && !isCurrentLoggedUser && (
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteAccount(acc)}
                              className="px-2 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title={`Xóa vĩnh viễn tài khoản ${acc.username}`}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Xóa</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* REALTIME LOGIN AUDIT LOGS SECTION */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-600" />
                  <span>Nhật Ký & Lịch Sử Đăng Nhập Realtime Database ({loginHistory.length})</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Tất cả các phiên đăng nhập được lưu tự động lên cơ sở dữ liệu để theo dõi an ninh
                </p>
              </div>

              <div className="flex items-center gap-2">
                {onClearLoginHistory && loginHistory.length > 0 && !isConfirmingClearLogs && (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingClearLogs(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa Lịch Sử</span>
                  </button>
                )}

                {isConfirmingClearLogs && (
                  <div className="flex items-center gap-1.5 bg-rose-50 p-1 rounded-lg border border-rose-200">
                    <span className="text-[11px] text-rose-700 font-semibold px-1">Xóa sạch nhật ký?</span>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingClearLogs(false)}
                      className="px-2 py-0.5 bg-white text-slate-600 text-[10px] font-bold rounded cursor-pointer border border-slate-200"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleClearLogs}
                      disabled={isClearingLogs}
                      className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded cursor-pointer disabled:opacity-50"
                    >
                      {isClearingLogs ? 'Đang xóa...' : 'Đồng ý'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchLoginQuery}
                  onChange={(e) => setSearchLoginQuery(e.target.value)}
                  placeholder="Tìm theo user, họ tên, chi nhánh hoặc ngày..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-blue-600"
                />
                {searchLoginQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchLoginQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setFilterLoginStatus('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    filterLoginStatus === 'all'
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Tất cả ({loginHistory.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterLoginStatus('success')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    filterLoginStatus === 'success'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Thành công ({loginHistory.filter((l) => l.status === 'success').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterLoginStatus('failed')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    filterLoginStatus === 'failed'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Thất bại ({loginHistory.filter((l) => l.status === 'failed').length})
                </button>
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-3.5 py-2.5">Thời Gian</th>
                    <th className="px-3.5 py-2.5">Tài Khoản & Người Dùng</th>
                    <th className="px-3.5 py-2.5">Vai Trò & Đơn Vị</th>
                    <th className="px-3.5 py-2.5">Thiết Bị / Nền Tảng</th>
                    <th className="px-3.5 py-2.5 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        {loginHistory.length === 0
                          ? 'Chưa có nhật ký đăng nhập nào được ghi nhận. Hãy đăng nhập để lưu vào Realtime Database.'
                          : 'Không tìm thấy nhật ký đăng nhập phù hợp với bộ lọc.'}
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {log.timeFormatted || new Date(log.timestamp).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="font-bold text-slate-900">{log.name || log.username}</div>
                          <div className="text-[11px] text-blue-700 font-mono">@{log.username}</div>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] px-2 py-0.2 rounded font-bold uppercase ${
                                log.role === 'admin'
                                  ? 'bg-amber-100 text-amber-800'
                                  : log.role === 'storekeeper'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {log.role}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Org: {log.orgId}</span>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            {log.device?.includes('Điện thoại') ? (
                              <Smartphone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            )}
                            <span className="truncate max-w-[180px]" title={log.device || log.userAgent}>
                              {log.device || 'Máy tính (Desktop)'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                          {log.status === 'success' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Thành công</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Thất bại</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal: Add New System Account */}
        {isAddUserOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span>Tạo Tài Khoản Người Dùng Mới</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {addUserError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{addUserError}</span>
                </div>
              )}

              <form onSubmit={handleCreateAccountSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Họ tên nhân sự *</label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="VD: Nguyễn Văn Thắng"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tên đăng nhập *</label>
                    <input
                      type="text"
                      required
                      value={addUsername}
                      onChange={(e) => setAddUsername(e.target.value)}
                      placeholder="VD: thangnv"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600 font-mono font-bold text-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu *</label>
                    <input
                      type="text"
                      required
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                      placeholder="Mật khẩu"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phân quyền vai trò</label>
                    <select
                      value={addRole}
                      onChange={(e) => setAddRole(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600 font-semibold cursor-pointer"
                    >
                      <option value="admin">👑 Quản Trị Viên (Admin)</option>
                      <option value="storekeeper">📦 Thủ Kho (Storekeeper)</option>
                      <option value="supervisor">👷 Giám Sát (Supervisor)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Đơn Vị (Org ID)</label>
                    <input
                      type="text"
                      value={addOrgId}
                      onChange={(e) => setAddOrgId(e.target.value.toUpperCase())}
                      placeholder="CT36"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600 font-bold uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại liên hệ</label>
                  <input
                    type="tel"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="VD: 0915 123 456"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingUser}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSavingUser ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Lưu Vào Realtime DB</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Account (Full Information, Role, Password, Tenants) */}
        {editingAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 space-y-4 my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Chỉnh Sửa Tài Khoản Nhân Sự
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Cập nhật thông tin, mật khẩu & quyền truy cập cho <strong className="text-blue-700 font-mono">@{editingAccount.username}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {editUserError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{editUserError}</span>
                </div>
              )}

              <form onSubmit={handleSaveEditAccount} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Họ tên nhân sự *</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="VD: Nguyễn Văn Thắng"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tên đăng nhập (Cố định)</label>
                    <input
                      type="text"
                      disabled
                      value={editingAccount.username}
                      className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-blue-700 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại liên hệ</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="VD: 0915 123 456"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="VD: thangnv@ct36.vn"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phân quyền vai trò</label>
                    <select
                      value={editRoleValue}
                      onChange={(e) => setEditRoleValue(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600 font-semibold cursor-pointer"
                    >
                      <option value="admin">👑 Quản Trị Viên (Admin)</option>
                      <option value="storekeeper">📦 Thủ Kho (Storekeeper)</option>
                      <option value="supervisor">👷 Giám Sát (Supervisor)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Đơn Vị (Org ID)</label>
                    <input
                      type="text"
                      value={editOrgId}
                      onChange={(e) => setEditOrgId(e.target.value.toUpperCase())}
                      placeholder="CT36"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-600 font-bold uppercase"
                    />
                  </div>
                </div>

                {/* Đổi mật khẩu mới */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-600" />
                      <span>Đặt lại mật khẩu mới</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditPassValue('123456')}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer underline"
                      >
                        Đặt 123456
                      </button>
                      <span className="text-slate-300 text-[10px]">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          const rand = Math.floor(100000 + Math.random() * 900000).toString();
                          setEditPassValue(rand);
                        }}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer underline"
                      >
                        Tạo ngẫu nhiên
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type={editShowPass ? 'text' : 'password'}
                      value={editPassValue}
                      onChange={(e) => setEditPassValue(e.target.value)}
                      placeholder="Để trống nếu muốn giữ nguyên mật khẩu cũ..."
                      className="w-full pl-3 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setEditShowPass(!editShowPass)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {editShowPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Chỉ nhập khi cần cấp lại hoặc đổi mật khẩu cho tài khoản này.
                  </p>
                </div>

                {/* Phân quyền truy cập các Chi nhánh / Doanh nghiệp */}
                {tenants.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Quyền truy cập Doanh nghiệp / Chi nhánh</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (editAllowedTenants.length === tenants.length) {
                            setEditAllowedTenants([tenants[0].id]);
                          } else {
                            setEditAllowedTenants(tenants.map((t) => t.id));
                          }
                        }}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                      >
                        {editAllowedTenants.length === tenants.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả chi nhánh'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                      {tenants.map((t) => {
                        const isChecked = editAllowedTenants.includes(t.id);
                        return (
                          <label
                            key={t.id}
                            className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-blue-50/80 border-blue-200 text-blue-900 font-medium'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditAllowedTenants([...editAllowedTenants, t.id]);
                                } else {
                                  setEditAllowedTenants(editAllowedTenants.filter((id) => id !== t.id));
                                }
                              }}
                              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                            <div className="min-w-0 truncate">
                              <span className="truncate block">{t.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">[{t.code}]</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingAccount(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSavingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Lưu Cập Nhật</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Xác Nhận Xóa Tài Khoản */}
        {deletingAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Xác Nhận Xóa Tài Khoản</h3>
                  <p className="text-xs text-slate-500">Hành động này không thể hoàn tác</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Họ và tên:</span>
                  <strong className="text-slate-800 font-bold">{deletingAccount.name}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tên đăng nhập:</span>
                  <strong className="text-blue-700 font-mono">@{deletingAccount.username}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Vai trò:</span>
                  <span className="font-semibold text-slate-700">
                    {deletingAccount.role === 'admin'
                      ? '👑 Quản Trị Viên'
                      : deletingAccount.role === 'storekeeper'
                      ? '📦 Thủ Kho'
                      : '👷 Giám Sát'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Đơn vị:</span>
                  <span className="text-slate-700">{deletingAccount.orgName || deletingAccount.orgId || 'CT36'}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Bạn có chắc chắn muốn xóa tài khoản này khỏi cơ sở dữ liệu Firebase Realtime Database? Người dùng này sẽ không thể đăng nhập vào bất kỳ không gian làm việc nào nữa.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isDeletingUser}
                  onClick={() => setDeletingAccount(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isDeletingUser}
                  onClick={handleConfirmDeleteAccount}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isDeletingUser ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Xác Nhận Xóa Vĩnh Viễn</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Firebase Cloud Realtime Database */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Cơ Sở Dữ Liệu Thời Gian Thực (Firebase Realtime Database)</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Đang kết nối Realtime
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Realtime Database URL</label>
              <input
                type="text"
                disabled
                value="https://kho36manage-default-rtdb.firebaseio.com"
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono font-bold text-blue-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Cấu hình đồng bộ thời gian thực</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-800 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Dự án: kho36manage • Tự động đồng bộ Realtime Database</span>
              </div>
            </div>
          </div>
        </div>

        {/* Database Management & Clean */}
        {(onClearAllData || onSeedSampleData) && (
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span>Quản Lý Dữ Liệu & Đồng Bộ Đám Mây</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Nạp lại bộ dữ liệu chuẩn chống thấm thực tế (Dự án, Vật tư, Phiếu xuất, Chấm công, Nhân sự) lên Firebase Realtime Database hoặc xóa sạch để nhập mới.
            </p>

            {seedSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Đã nạp và đồng bộ toàn bộ dữ liệu mẫu lên Firebase Realtime Database thành công! Dữ liệu đã hiển thị trên tất cả màn hình.</span>
              </div>
            )}

            {clearedSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2 font-medium animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Đã xóa toàn bộ dữ liệu thành công! Cơ sở dữ liệu hiện đã hoàn toàn trống sạch.</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {onSeedSampleData && (
                <button
                  type="button"
                  id="seed-sample-data-btn"
                  disabled={isSeeding}
                  onClick={handleSeed}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-50"
                >
                  {isSeeding ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang nạp lên Realtime DB...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>Nạp lại dữ liệu thực tế mẫu lên Realtime Database</span>
                    </>
                  )}
                </button>
              )}

              {onClearAllData && !isConfirmingClear && (
                <button
                  type="button"
                  id="trigger-clear-all-data-btn"
                  onClick={() => setIsConfirmingClear(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa toàn bộ dữ liệu dự án & kho (Reset sạch)</span>
                </button>
              )}
            </div>

            {onClearAllData && isConfirmingClear && (
              <div className="mt-3 p-4 rounded-xl bg-rose-50/80 border border-rose-200 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-900">
                      Xác nhận xóa sạch dữ liệu khỏi Realtime Database?
                    </h4>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      Thao tác này sẽ xóa tất cả công trình, vật tư, phiếu xuất kho, nhật ký chấm công và nhân sự trong cơ sở dữ liệu đám mây. Thao tác không thể hoàn tác.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingClear(false)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    id="confirm-clear-all-data-btn"
                    disabled={isClearing}
                    onClick={handleClear}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isClearing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang xóa khỏi Realtime DB...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Đồng ý xóa sạch tất cả</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* System parameters */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Thông tin ứng dụng</span>
          </h3>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Phiên bản hệ thống:</span>
              <span className="font-semibold text-slate-700">v2.5.0 (Custom Company & Logo Enabled)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Hỗ trợ kỹ thuật 24/7:</span>
              <span className="font-semibold text-blue-600">{formData.phone || '0915 586 234'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Bản quyền:</span>
              <span className="font-semibold text-slate-700">© 2026 {formData.orgName || 'Kho Chống Thấm 36'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
