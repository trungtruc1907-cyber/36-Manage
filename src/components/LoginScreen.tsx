import React, { useState, useEffect } from 'react';
import {
  LogIn,
  User,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Check,
  AlertCircle,
  UserPlus,
  ShieldCheck,
  Package,
  HardHat,
  Phone,
  ArrowRight,
  HelpCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { CompanySettings, TenantOrganization, UserAccount, UserAccountRecord, LoginHistoryRecord } from '../types';
import { INITIAL_USER_ACCOUNTS, recordLoginHistoryToDatabase } from '../firebase';

interface LoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
  onRegisterAccount?: (newAccount: UserAccountRecord) => Promise<void> | void;
  onRegisterNewEnterprise?: (
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
  ) => Promise<{ tenant: TenantOrganization; user: UserAccountRecord }>;
  accounts?: UserAccountRecord[];
  companySettings?: CompanySettings;
  tenants?: TenantOrganization[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onRegisterAccount,
  onRegisterNewEnterprise,
  accounts = INITIAL_USER_ACCOUNTS,
  companySettings,
  tenants = [],
}) => {
  // Active Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Register Sub-Type: 'new_enterprise' (Khởi tạo Doanh nghiệp mới + CSDL riêng) | 'join_enterprise' (Tạo user trong doanh nghiệp có sẵn)
  const [regType, setRegType] = useState<'new_enterprise' | 'join_enterprise'>('new_enterprise');

  // Login Form States
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('chongtham36_last_username') || 'admin';
  });
  const [password, setPassword] = useState('123456');
  const [orgId, setOrgId] = useState(() => {
    return localStorage.getItem('chongtham36_last_orgId') || companySettings?.orgId || 'CT36';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Register New Enterprise Form States
  const [entCode, setEntCode] = useState('');
  const [entName, setEntName] = useState('');
  const [entBrandName, setEntBrandName] = useState('');
  const [entAddress, setEntAddress] = useState('');
  const [entPhone, setEntPhone] = useState('');
  const [entAdminName, setEntAdminName] = useState('');
  const [entUsername, setEntUsername] = useState('');
  const [entPassword, setEntPassword] = useState('');
  const [entConfirmPassword, setEntConfirmPassword] = useState('');
  const [entShowPassword, setEntShowPassword] = useState(false);

  // Register Member In Existing Enterprise Form States
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<'admin' | 'supervisor' | 'storekeeper'>('supervisor');
  const [regOrgId, setRegOrgId] = useState(companySettings?.orgId || 'CT36');
  const [regShowPassword, setRegShowPassword] = useState(false);

  const orgSuggestions = tenants.length > 0
    ? tenants.map((t) => ({
        id: t.code,
        label: `${t.code} (${t.brandName || t.name})`,
        name: t.name,
      }))
    : [
        {
          id: companySettings?.orgId || 'CT36',
          label: `${companySettings?.orgId || 'CT36'} (${companySettings?.brandName || 'Trường Sơn 36'})`,
          name: companySettings?.orgName || 'Công Ty Trường Sơn - Waterproofing 36',
        },
        { id: 'HN01', label: 'HN01 (Trường Sơn HN)', name: 'Chi Nhánh Trường Sơn Hà Nội' },
        { id: 'MN01', label: 'MN01 (Trường Sơn MN)', name: 'Chi Nhánh Trường Sơn Miền Nam' },
      ];

  const handleSelectOrg = (id: string) => {
    setOrgId(id);
    setErrorMessage('');
  };

  // Quick Role Demo Login
  const handleQuickLoginRole = (roleType: 'admin' | 'storekeeper' | 'supervisor') => {
    setErrorMessage('');
    setIsLoading(true);

    let defaultAcc = accounts.find((a) => a.role === roleType);
    if (!defaultAcc) {
      defaultAcc = INITIAL_USER_ACCOUNTS.find((a) => a.role === roleType) || INITIAL_USER_ACCOUNTS[0];
    }

    setUsername(defaultAcc.username);
    setPassword(defaultAcc.password || '123456');
    setOrgId(defaultAcc.orgId || companySettings?.orgId || 'CT36');

    setTimeout(() => {
      setIsLoading(false);
      localStorage.setItem('chongtham36_last_username', defaultAcc!.username);
      localStorage.setItem('chongtham36_last_orgId', defaultAcc!.orgId);
      if (rememberMe) {
        localStorage.setItem('chongtham36_active_user', JSON.stringify(defaultAcc));
      }

      onLoginSuccess({
        username: defaultAcc!.username,
        role: defaultAcc!.role,
        orgId: defaultAcc!.orgId,
        orgName: defaultAcc!.orgName,
        name: defaultAcc!.name,
        phone: defaultAcc!.phone,
        email: defaultAcc!.email,
      });
    }, 350);
  };

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    const cleanOrgId = orgId.trim().toUpperCase();

    if (!cleanUsername) {
      setErrorMessage('Vui lòng nhập Tên đăng nhập (User)');
      return;
    }
    if (!cleanPassword) {
      setErrorMessage('Vui lòng nhập Mật khẩu (Pass)');
      return;
    }
    if (!cleanOrgId) {
      setErrorMessage('Vui lòng nhập Mã Doanh Nghiệp (Mã Chi nhánh / Tổ đội)');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      // Check against existing accounts list + initial defaults
      const combinedAccounts = [...INITIAL_USER_ACCOUNTS, ...accounts];
      const matchedAccount = combinedAccounts.find(
        (acc) => acc.username.toLowerCase() === cleanUsername.toLowerCase()
      );

      // 1. Check if account exists & validate password
      if (matchedAccount) {
        if (matchedAccount.password && matchedAccount.password !== cleanPassword) {
          setErrorMessage('Mật khẩu không chính xác. Vui lòng kiểm tra lại!');

          // Record failed login to Firebase Realtime Database
          const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Browser';
          let device = 'Máy tính (Desktop)';
          if (/mobile|android|iphone|ipad|tablet/i.test(userAgent)) {
            device = 'Điện thoại / Di động';
          }
          const now = new Date();
          const timeFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

          recordLoginHistoryToDatabase({
            id: `LOG-FAIL-${Date.now()}`,
            username: cleanUsername,
            name: matchedAccount.name,
            role: matchedAccount.role,
            orgId: cleanOrgId,
            timestamp: Date.now(),
            timeFormatted,
            status: 'failed',
            userAgent: userAgent.substring(0, 150),
            device,
            notes: 'Mật khẩu không chính xác',
          });
          return;
        }

        // 2. Strict Tenant Authorization & Isolation Check
        // Super Admin (root admin account) has global access
        const isSuperAdmin =
          matchedAccount.username.toLowerCase() === 'admin' &&
          (matchedAccount.orgId?.toUpperCase() === 'CT36' || matchedAccount.allowedTenants?.includes('*'));

        if (!isSuperAdmin) {
          const userOrg = (matchedAccount.orgId || '').toUpperCase();
          const allowedTenantsList = matchedAccount.allowedTenants || [];

          // Check whether the entered cleanOrgId matches user's org or allowedTenants
          const isAllowedOrg =
            userOrg === cleanOrgId ||
            allowedTenantsList.some((tId) => tId.toUpperCase() === cleanOrgId) ||
            tenants.some((t) => t.code.toUpperCase() === cleanOrgId && allowedTenantsList.includes(t.id));

          if (!isAllowedOrg) {
            setErrorMessage(
              `⛔ Bạn không có quyền truy cập vào Doanh nghiệp "${cleanOrgId}". Tài khoản "${matchedAccount.name}" chỉ được phép đăng nhập vào Doanh nghiệp "${matchedAccount.orgId}" (${matchedAccount.orgName || ''})!`
            );

            // Record unauthorized login attempt
            const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Browser';
            let device = 'Máy tính (Desktop)';
            if (/mobile|android|iphone|ipad|tablet/i.test(userAgent)) {
              device = 'Điện thoại / Di động';
            }
            const now = new Date();
            const timeFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

            recordLoginHistoryToDatabase({
              id: `LOG-UNAUTH-${Date.now()}`,
              username: cleanUsername,
              name: matchedAccount.name,
              role: matchedAccount.role,
              orgId: cleanOrgId,
              timestamp: Date.now(),
              timeFormatted,
              status: 'failed',
              userAgent: userAgent.substring(0, 150),
              device,
              notes: `Cố tình đăng nhập trái phép vào ${cleanOrgId} (Thuộc về ${userOrg})`,
            });
            return;
          }
        }
      }

      // Prepare user session object
      const selectedOrg = orgSuggestions.find((o) => o.id.toUpperCase() === cleanOrgId);
      const matchedTenantObj = tenants.find(
        (t) => t.code.toUpperCase() === cleanOrgId || t.id === cleanOrgId
      );
      const orgName = selectedOrg
        ? selectedOrg.name
        : matchedTenantObj
        ? matchedTenantObj.name
        : matchedAccount?.orgName || `Đơn vị ${cleanOrgId}`;

      const userRole = matchedAccount
        ? matchedAccount.role
        : cleanUsername.toLowerCase().includes('kho')
        ? 'storekeeper'
        : cleanUsername.toLowerCase().includes('gs') || cleanUsername.toLowerCase().includes('giam')
        ? 'supervisor'
        : 'admin';

      const userName = matchedAccount
        ? matchedAccount.name
        : cleanUsername.toLowerCase() === 'admin'
        ? 'Quản Trị Viên (Admin)'
        : cleanUsername;

      const authenticatedUser: UserAccount = {
        username: cleanUsername,
        role: userRole,
        orgId: cleanOrgId,
        orgName,
        name: userName,
        phone: matchedAccount?.phone,
        email: matchedAccount?.email,
        allowedTenants: matchedAccount?.allowedTenants || [matchedTenantObj?.id || cleanOrgId],
        isTenantOwner: matchedAccount?.isTenantOwner,
        createdTenantId: matchedAccount?.createdTenantId,
      };

      // Save to localStorage for quick restore
      localStorage.setItem('chongtham36_last_username', cleanUsername);
      localStorage.setItem('chongtham36_last_orgId', cleanOrgId);
      if (rememberMe) {
        localStorage.setItem('chongtham36_active_user', JSON.stringify(authenticatedUser));
      } else {
        localStorage.removeItem('chongtham36_active_user');
      }

      onLoginSuccess(authenticatedUser);
    }, 400);
  };

  // Handle Register New Enterprise Submit
  const handleRegisterEnterpriseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanCode = entCode.trim().toUpperCase();
    const cleanName = entName.trim();
    const cleanBrand = entBrandName.trim() || cleanName;
    const cleanAdmin = entAdminName.trim();
    const cleanUsername = entUsername.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPassword = entPassword.trim();
    const cleanConfirm = entConfirmPassword.trim();

    if (!cleanCode || cleanCode.length < 2) {
      setErrorMessage('Vui lòng nhập Mã Doanh Nghiệp (tối thiểu 2 ký tự, ví dụ: TH01, DN36, HP01)');
      return;
    }
    if (!cleanName) {
      setErrorMessage('Vui lòng nhập Tên đầy đủ của Doanh nghiệp / Chi nhánh');
      return;
    }
    if (!cleanAdmin) {
      setErrorMessage('Vui lòng nhập Họ & Tên người quản trị');
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage('Tên đăng nhập phải có ít nhất 3 ký tự (không dấu, không khoảng trắng)');
      return;
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      setErrorMessage('Mật khẩu phải có ít nhất 4 ký tự');
      return;
    }
    if (cleanPassword !== cleanConfirm) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    // Check duplicate tenant code
    const isDuplicateTenant = tenants.some((t) => t.code.toUpperCase() === cleanCode);
    if (isDuplicateTenant) {
      setErrorMessage(`Mã Doanh Nghiệp "${cleanCode}" đã tồn tại trên hệ thống. Vui lòng chọn mã khác!`);
      return;
    }

    // Check duplicate username
    const combinedAccounts = [...INITIAL_USER_ACCOUNTS, ...accounts];
    if (combinedAccounts.some((a) => a.username.toLowerCase() === cleanUsername)) {
      setErrorMessage(`Tên đăng nhập "${cleanUsername}" đã tồn tại. Vui lòng chọn tên đăng nhập khác!`);
      return;
    }

    setIsLoading(true);

    try {
      if (onRegisterNewEnterprise) {
        const result = await onRegisterNewEnterprise(
          {
            code: cleanCode,
            name: cleanName,
            brandName: cleanBrand,
            phone: entPhone.trim(),
            address: entAddress.trim(),
            tagline: `Chi nhánh ${cleanBrand} — Giải pháp chống thấm chuyên nghiệp`,
            status: 'active',
            createdAt: new Date().toLocaleDateString('vi-VN'),
          },
          {
            username: cleanUsername,
            password: cleanPassword,
            name: cleanAdmin,
            phone: entPhone.trim() || undefined,
            role: 'admin',
            orgId: cleanCode,
            orgName: cleanName,
          }
        );

        setIsLoading(false);
        setSuccessMessage(`Đã khởi tạo thành công Doanh nghiệp ${cleanName} (${cleanCode})! Đang tự động đăng nhập...`);

        setTimeout(() => {
          localStorage.setItem('chongtham36_last_username', cleanUsername);
          localStorage.setItem('chongtham36_last_orgId', cleanCode);
          localStorage.setItem('chongtham36_active_user', JSON.stringify(result.user));
          onLoginSuccess(result.user);
        }, 600);
      } else {
        // Fallback standard register
        const newAccountRecord: UserAccountRecord = {
          username: cleanUsername,
          password: cleanPassword,
          name: cleanAdmin,
          role: 'admin',
          orgId: cleanCode,
          orgName: cleanName,
          phone: entPhone.trim() || undefined,
          isTenantOwner: true,
          createdAt: new Date().toLocaleDateString('vi-VN'),
        };

        if (onRegisterAccount) {
          await onRegisterAccount(newAccountRecord);
        }

        setIsLoading(false);
        setSuccessMessage('Đăng ký thành công! Đang đăng nhập...');

        setTimeout(() => {
          localStorage.setItem('chongtham36_last_username', cleanUsername);
          localStorage.setItem('chongtham36_last_orgId', cleanCode);
          localStorage.setItem('chongtham36_active_user', JSON.stringify(newAccountRecord));
          onLoginSuccess(newAccountRecord);
        }, 600);
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err instanceof Error ? err.message : 'Có lỗi khi khởi tạo Doanh nghiệp mới!');
    }
  };

  // Handle Register Member Submit (Join Existing Enterprise)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanFullName = regFullName.trim();
    const cleanUsername = regUsername.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPassword = regPassword.trim();
    const cleanConfirm = regConfirmPassword.trim();
    const cleanOrgId = regOrgId.trim().toUpperCase() || 'CT36';

    if (!cleanFullName) {
      setErrorMessage('Vui lòng nhập Họ và tên');
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage('Tên đăng nhập phải có ít nhất 3 ký tự (không dấu, không khoảng trắng)');
      return;
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      setErrorMessage('Mật khẩu phải có ít nhất 4 ký tự');
      return;
    }
    if (cleanPassword !== cleanConfirm) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    // Check duplicate username
    const combinedAccounts = [...INITIAL_USER_ACCOUNTS, ...accounts];
    if (combinedAccounts.some((a) => a.username.toLowerCase() === cleanUsername)) {
      setErrorMessage(`Tên đăng nhập "${cleanUsername}" đã tồn tại. Vui lòng chọn tên khác!`);
      return;
    }

    setIsLoading(true);

    const selectedOrg = orgSuggestions.find((o) => o.id.toUpperCase() === cleanOrgId);
    const matchedTenant = tenants.find((t) => t.code.toUpperCase() === cleanOrgId || t.id === cleanOrgId);
    const orgName = selectedOrg ? selectedOrg.name : matchedTenant ? matchedTenant.name : companySettings?.orgName || `Đơn vị ${cleanOrgId}`;

    const newAccountRecord: UserAccountRecord = {
      username: cleanUsername,
      password: cleanPassword,
      name: cleanFullName,
      role: regRole,
      orgId: cleanOrgId,
      orgName,
      phone: regPhone.trim() || undefined,
      allowedTenants: [matchedTenant?.id || cleanOrgId],
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };

    if (onRegisterAccount) {
      await onRegisterAccount(newAccountRecord);
    }

    setIsLoading(false);
    setSuccessMessage('Đăng ký tài khoản thành công! Đang đăng nhập...');

    // Auto login
    setTimeout(() => {
      localStorage.setItem('chongtham36_last_username', cleanUsername);
      localStorage.setItem('chongtham36_last_orgId', cleanOrgId);
      localStorage.setItem('chongtham36_active_user', JSON.stringify(newAccountRecord));
      onLoginSuccess(newAccountRecord);
    }, 600);
  };

  return (
    <div
      id="login-page-container"
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-y-auto"
      style={{
        backgroundColor: '#0c5ec7',
        backgroundImage: 'radial-gradient(circle at 50% 20%, #166be4 0%, #0c5ec7 60%, #094ba4 100%)',
      }}
    >
      {/* Background geometric accents */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full border border-white/20" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full border border-white/20" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[500px] flex flex-col items-center z-10 my-auto py-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="mb-2.5 relative group">
            <div className="p-2.5 rounded-full bg-white/95 shadow-2xl ring-4 ring-white/30 backdrop-blur-xs flex items-center justify-center">
              <BrandLogo
                size="lg"
                showText={false}
                customLogoUrl={companySettings?.customLogoUrl}
                brandName={companySettings?.brandName}
                className="w-16 h-16 sm:w-20 sm:h-20"
              />
            </div>
          </div>

          <h2 className="text-xs font-black tracking-widest text-blue-100 uppercase drop-shadow-sm font-['Plus_Jakarta_Sans',sans-serif]">
            {companySettings?.brandName || 'TRƯỜNG SƠN WATERPROOFING'}
          </h2>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-wider text-white uppercase drop-shadow-sm font-['Plus_Jakarta_Sans',sans-serif] mt-0.5">
            KHO & CÔNG TRƯỜNG <span className="text-[#fbbf24]">36</span>
          </h1>

          <p className="text-white/85 text-xs font-normal mt-1 max-w-xs sm:max-w-sm leading-relaxed px-2">
            {companySettings?.tagline || 'Hệ Thống Quản Lý Thi Công & Vật Tư Đa Doanh Nghiệp'}
          </p>
        </div>

        {/* Login / Register Tab Pill */}
        <div className="w-full max-w-[420px] mb-3 p-1 bg-black/20 backdrop-blur-md rounded-2xl flex items-center justify-between border border-white/20">
          <button
            type="button"
            id="tab-switch-login"
            onClick={() => {
              setAuthMode('login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'login'
                ? 'bg-white text-blue-800 shadow-md'
                : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng Nhập</span>
          </button>

          <button
            type="button"
            id="tab-switch-register"
            onClick={() => {
              setAuthMode('register');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'register'
                ? 'bg-white text-blue-800 shadow-md'
                : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Đăng Ký Tài Khoản</span>
          </button>
        </div>

        {/* Main Card */}
        <div
          id="auth-main-card"
          className="w-full bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.25)] p-5 sm:p-7 border border-white/40 backdrop-blur-sm"
        >
          {/* Status Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ===================== TAB 1: LOGIN ===================== */}
          {authMode === 'login' && (
            <div>
              {/* Quick Role Selection Banner */}
              <div className="mb-5 p-3 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-slate-50 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Đăng nhập nhanh theo vai trò:
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Bấm để đăng nhập</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    id="quick-login-admin"
                    onClick={() => handleQuickLoginRole('admin')}
                    className="p-2 rounded-xl bg-white hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-200 hover:border-blue-600 transition-all text-left group shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center gap-1 text-[11px] font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500 group-hover:text-amber-300" />
                      <span>Admin</span>
                    </div>
                    <span className="text-[10px] text-slate-400 group-hover:text-blue-100 block truncate">
                      Toàn quyền
                    </span>
                  </button>

                  <button
                    type="button"
                    id="quick-login-storekeeper"
                    onClick={() => handleQuickLoginRole('storekeeper')}
                    className="p-2 rounded-xl bg-white hover:bg-emerald-600 text-slate-700 hover:text-white border border-slate-200 hover:border-emerald-600 transition-all text-left group shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center gap-1 text-[11px] font-bold">
                      <Package className="w-3.5 h-3.5 text-emerald-500 group-hover:text-emerald-300" />
                      <span>Thủ Kho</span>
                    </div>
                    <span className="text-[10px] text-slate-400 group-hover:text-emerald-100 block truncate">
                      Xuất/nhập
                    </span>
                  </button>

                  <button
                    type="button"
                    id="quick-login-supervisor"
                    onClick={() => handleQuickLoginRole('supervisor')}
                    className="p-2 rounded-xl bg-white hover:bg-indigo-600 text-slate-700 hover:text-white border border-slate-200 hover:border-indigo-600 transition-all text-left group shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center gap-1 text-[11px] font-bold">
                      <HardHat className="w-3.5 h-3.5 text-indigo-500 group-hover:text-indigo-300" />
                      <span>Giám Sát</span>
                    </div>
                    <span className="text-[10px] text-slate-400 group-hover:text-indigo-100 block truncate">
                      Chấm công
                    </span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {/* Field 1: User */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Tên đăng nhập (User) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white overflow-hidden shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="login-username-input"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Field 2: Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mật khẩu (Pass) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white overflow-hidden shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none font-medium"
                    />
                    <button
                      type="button"
                      id="toggle-password-visibility-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Field 3: Org ID */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mã Doanh Nghiệp (Chi nhánh) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white overflow-hidden shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      id="login-orgid-input"
                      type="text"
                      value={orgId}
                      onChange={(e) => setOrgId(e.target.value.toUpperCase())}
                      placeholder="CT36"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 uppercase outline-none font-bold text-blue-700"
                    />
                  </div>
                </div>

                {/* Quick Org Suggestions */}
                <div className="pt-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-medium text-slate-500 mr-0.5">Gợi ý ID:</span>
                    {orgSuggestions.map((item) => {
                      const isSelected = orgId.toUpperCase() === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          id={`suggest-org-${item.id.toLowerCase()}`}
                          onClick={() => handleSelectOrg(item.id)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#1351b4] text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      id="remember-me-checkbox"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 font-medium">Ghi nhớ đăng nhập</span>
                  </label>

                  <button
                    type="button"
                    id="forgot-password-link"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    id="login-submit-btn"
                    disabled={isLoading}
                    className="w-full bg-[#0c59be] hover:bg-[#094ca7] text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-75 cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span className="tracking-wide text-sm font-bold uppercase font-['Plus_Jakarta_Sans',sans-serif]">
                          ĐĂNG NHẬP HỆ THỐNG
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ===================== TAB 2: REGISTER ===================== */}
          {authMode === 'register' && (
            <div>
              {/* Register Mode Selector */}
              <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-slate-100/90 rounded-xl border border-slate-200">
                <button
                  type="button"
                  id="reg-mode-new-ent-btn"
                  onClick={() => {
                    setRegType('new_enterprise');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    regType === 'new_enterprise'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Tạo Doanh Nghiệp Mới</span>
                </button>
                <button
                  type="button"
                  id="reg-mode-join-ent-btn"
                  onClick={() => {
                    setRegType('join_enterprise');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    regType === 'join_enterprise'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Tham Gia Đơn Vị Có Sẵn</span>
                </button>
              </div>

              {/* MODE 1: REGISTER NEW ENTERPRISE & SEED DATABASE */}
              {regType === 'new_enterprise' && (
                <div>
                  <div className="mb-3.5 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        Đăng ký Doanh nghiệp / Chi nhánh mới
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Khởi tạo không gian dữ liệu riêng & tài khoản Quản trị viên
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold uppercase border border-blue-200">
                      Độc Lập Dữ Liệu
                    </span>
                  </div>

                  <form onSubmit={handleRegisterEnterpriseSubmit} className="space-y-3">
                    {/* Enterprise Code & Brand Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="space-y-1 sm:col-span-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Mã Doanh Nghiệp <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          id="new-ent-code-input"
                          value={entCode}
                          onChange={(e) => setEntCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                          placeholder="VD: TH36, HP01"
                          maxLength={10}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-blue-700 uppercase outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700">
                          Tên Thương Hiệu hiển thị <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          id="new-ent-brand-input"
                          value={entBrandName}
                          onChange={(e) => setEntBrandName(e.target.value)}
                          placeholder="VD: Chống Thấm Thanh Hóa"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    {/* Enterprise Full Legal Name */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Tên đầy đủ Doanh nghiệp / Tổ đội <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        id="new-ent-name-input"
                        value={entName}
                        onChange={(e) => setEntName(e.target.value)}
                        placeholder="VD: Công Ty TNHH Chống Thấm & Xây Dựng Thanh Hóa"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* Phone & Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Số điện thoại liên hệ</label>
                        <input
                          type="tel"
                          id="new-ent-phone-input"
                          value={entPhone}
                          onChange={(e) => setEntPhone(e.target.value)}
                          placeholder="0915 586 234"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Địa chỉ trụ sở / Kho</label>
                        <input
                          type="text"
                          id="new-ent-address-input"
                          value={entAddress}
                          onChange={(e) => setEntAddress(e.target.value)}
                          placeholder="TP. Thanh Hóa, Thanh Hóa"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    {/* Admin Account Credentials */}
                    <div className="pt-2 border-t border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                          Thông tin Tài khoản Quản trị (Admin)
                        </span>
                        <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Chủ sở hữu Tenant
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            Họ tên Quản lý / Đại diện <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            id="new-ent-admin-name-input"
                            value={entAdminName}
                            onChange={(e) => setEntAdminName(e.target.value)}
                            placeholder="Nguyễn Văn Hùng"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            Tên đăng nhập (Username) <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            id="new-ent-username-input"
                            value={entUsername}
                            onChange={(e) => setEntUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                            placeholder="hung_th36"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>

                      {/* Password & Confirm */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            Mật khẩu <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={entShowPassword ? 'text' : 'password'}
                              required
                              id="new-ent-password-input"
                              value={entPassword}
                              onChange={(e) => setEntPassword(e.target.value)}
                              placeholder="••••••"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 pr-8"
                            />
                            <button
                              type="button"
                              onClick={() => setEntShowPassword(!entShowPassword)}
                              className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {entShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            Xác nhận mật khẩu <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type={entShowPassword ? 'text' : 'password'}
                            required
                            id="new-ent-confirm-password-input"
                            value={entConfirmPassword}
                            onChange={(e) => setEntConfirmPassword(e.target.value)}
                            placeholder="••••••"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Isolation Notice Banner */}
                    <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-[11px] text-blue-900 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="leading-snug">
                        <strong>Cách ly dữ liệu an toàn:</strong> Khi hoàn tất, hệ thống tự động khởi tạo cơ sở dữ liệu vật tư, công trình, xuất kho và chỉ cho phép tài khoản này đăng nhập vào Doanh nghiệp <strong>{entCode || 'mới'}</strong>.
                      </p>
                    </div>

                    {/* Submit Enterprise Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        id="register-enterprise-submit-btn"
                        disabled={isLoading}
                        className="w-full bg-[#0c59be] hover:bg-[#094ca7] text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Building2 className="w-4 h-4" />
                            <span className="tracking-wide text-xs sm:text-sm font-bold uppercase font-['Plus_Jakarta_Sans',sans-serif]">
                              KHỞI TẠO DOANH NGHIỆP & ĐĂNG NHẬP
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* MODE 2: REGISTER MEMBER IN EXISTING ENTERPRISE */}
              {regType === 'join_enterprise' && (
                <div>
                  <div className="mb-3.5 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <UserPlus className="w-4 h-4 text-emerald-600" />
                        Tạo tài khoản nhân sự trong Đơn vị có sẵn
                      </h3>
                      <p className="text-[11px] text-slate-500">Đăng ký tài khoản Giám sát, Thủ kho hoặc Quản lý</p>
                    </div>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    {/* Full name */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Họ và tên <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        id="reg-member-name-input"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="Ví dụ: Nguyễn Văn Hùng"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                    </div>

                    {/* Username */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Tên đăng nhập (User viết liền) <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        id="reg-member-username-input"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        placeholder="hung_giamsat"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-mono"
                      />
                    </div>

                    {/* Role selection */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Vai trò / Phân quyền <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'supervisor', label: 'Giám Sát', desc: 'Chấm công/Nhật ký' },
                          { id: 'storekeeper', label: 'Thủ Kho', desc: 'Xuất/Nhập vật tư' },
                          { id: 'admin', label: 'Quản Trị', desc: 'Toàn quyền đơn vị' },
                        ].map((roleItem) => (
                          <button
                            key={roleItem.id}
                            type="button"
                            onClick={() => setRegRole(roleItem.id as any)}
                            className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                              regRole === roleItem.id
                                ? 'bg-emerald-50 border-emerald-600 text-emerald-700 font-bold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xs block">{roleItem.label}</span>
                            <span className="text-[10px] text-slate-400 font-normal block">{roleItem.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Phone & Org ID */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Số điện thoại</label>
                        <input
                          type="tel"
                          id="reg-member-phone-input"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="0988 123 456"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Mã Doanh Nghiệp <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          id="reg-member-org-input"
                          value={regOrgId}
                          onChange={(e) => setRegOrgId(e.target.value.toUpperCase())}
                          placeholder="CT36"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 uppercase font-bold outline-none"
                        />
                      </div>
                    </div>

                    {/* Password & Confirm */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Mật khẩu <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={regShowPassword ? 'text' : 'password'}
                            required
                            id="reg-member-password-input"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="••••••"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none pr-7"
                          />
                          <button
                            type="button"
                            onClick={() => setRegShowPassword(!regShowPassword)}
                            className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {regShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Xác nhận mật khẩu <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type={regShowPassword ? 'text' : 'password'}
                          required
                          id="reg-member-confirm-password-input"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="••••••"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none"
                        />
                      </div>
                    </div>

                    {/* Submit Register Member Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        id="register-member-submit-btn"
                        disabled={isLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            <span className="tracking-wide text-xs sm:text-sm font-bold uppercase font-['Plus_Jakarta_Sans',sans-serif]">
                              TẠO TÀI KHOẢN & ĐĂNG NHẬP
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Version and Copyright */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Phiên bản 2.5.0</span>
            <span>© 2026 Kho & Thi Công 36</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Danh Sách Tài Khoản Mặc Định
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold">
                CT36
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Bạn có thể sử dụng các tài khoản quản lý và nghiệp vụ mẫu sau đây để đăng nhập ngay vào hệ thống:
            </p>

            <div className="space-y-2.5 mb-5 max-h-[260px] overflow-y-auto pr-1">
              {accounts.map((acc, idx) => (
                <div
                  key={acc.username || idx}
                  className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between hover:border-blue-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{acc.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 uppercase">
                        {acc.role}
                      </span>
                    </div>
                    <div className="text-slate-500 mt-1 flex items-center gap-3">
                      <span>User: <strong className="text-slate-800 font-mono">{acc.username}</strong></span>
                      <span>Pass: <strong className="text-slate-800 font-mono">{acc.password || '123456'}</strong></span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUsername(acc.username);
                      setPassword(acc.password || '123456');
                      setOrgId(acc.orgId || 'CT36');
                      setShowForgotModal(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Điền</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 mb-4 flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <span>Nếu bạn muốn đặt lại mật khẩu cho tài khoản doanh nghiệp riêng, vui lòng liên hệ Hotline quản trị: <strong>0915 586 234</strong>.</span>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
