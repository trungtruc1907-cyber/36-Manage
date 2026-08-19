import React, { useState } from 'react';
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
  ArrowRight,
  HelpCircle,
  Sparkles,
  Info,
  KeyRound,
  CheckCircle2,
  Phone,
  Mail,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import {
  CompanySettings,
  TenantOrganization,
  UserAccount,
  UserAccountRecord,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_USER_PERMISSIONS,
} from '../types';
import { INITIAL_USER_ACCOUNTS, recordLoginHistoryToDatabase, saveUserAccountToDatabase } from '../firebase';
import { INITIAL_TENANTS } from '../data/mockData';

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
  tenants = INITIAL_TENANTS,
}) => {
  // Active Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login Form States
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('chongtham36_last_username') || '';
  });
  const [password, setPassword] = useState('');
  const [orgId, setOrgId] = useState(() => {
    return localStorage.getItem('chongtham36_last_orgId') || companySettings?.orgId || 'CT36';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Forgot Password / Password Recovery Form States
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotOrgId, setForgotOrgId] = useState(companySettings?.orgId || '');
  const [forgotVerification, setForgotVerification] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotShowPassword, setForgotShowPassword] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Open Forgot Password Modal Helper
  const handleOpenForgotModal = () => {
    setForgotUsername(username || 'admin');
    setForgotOrgId(orgId || companySettings?.orgId || 'CT36');
    setForgotVerification('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotShowPassword(false);
    setForgotError('');
    setForgotSuccess('');
    setShowForgotModal(true);
  };

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    const cleanUser = forgotUsername.trim().toLowerCase().replace(/\s+/g, '');
    const cleanOrg = forgotOrgId.trim().toUpperCase();
    const cleanVerification = forgotVerification.trim().toLowerCase();
    const cleanNewPass = forgotNewPassword.trim();
    const cleanConfirmPass = forgotConfirmPassword.trim();

    if (!cleanUser) {
      setForgotError('Vui lòng nhập Tên đăng nhập cần lấy lại mật khẩu');
      return;
    }
    if (!cleanOrg) {
      setForgotError('Vui lòng nhập Mã Doanh Nghiệp (ví dụ: CT36)');
      return;
    }
    if (!cleanNewPass || cleanNewPass.length < 4) {
      setForgotError('Mật khẩu mới phải có tối thiểu 4 ký tự');
      return;
    }
    if (cleanNewPass !== cleanConfirmPass) {
      setForgotError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsResettingPassword(true);

    try {
      const combinedAccounts = [...INITIAL_USER_ACCOUNTS, ...accounts];
      const matched = combinedAccounts.find(
        (a) => a.username.toLowerCase() === cleanUser
      );

      if (!matched) {
        setForgotError(`Không tìm thấy tài khoản "${cleanUser}" trong cơ sở dữ liệu. Vui lòng kiểm tra lại.`);
        setIsResettingPassword(false);
        return;
      }

      // Check organization affiliation
      const isSuperAdmin = cleanUser === 'admin';
      const userOrg = (matched.orgId || 'CT36').toUpperCase();
      const allowed = matched.allowedTenants || [];
      const orgMatches =
        isSuperAdmin ||
        userOrg === cleanOrg ||
        allowed.some((t) => t.toUpperCase() === cleanOrg) ||
        tenants.some((t) => t.code.toUpperCase() === cleanOrg && allowed.includes(t.id));

      if (!orgMatches) {
        setForgotError(`Tài khoản "${cleanUser}" không thuộc về Mã Doanh Nghiệp "${cleanOrg}".`);
        setIsResettingPassword(false);
        return;
      }

      // Check verification phone or email if provided
      if (cleanVerification) {
        const accPhone = (matched.phone || '').trim().toLowerCase();
        const accEmail = (matched.email || '').trim().toLowerCase();
        if (accPhone && accEmail) {
          if (!accPhone.includes(cleanVerification) && !accEmail.includes(cleanVerification)) {
            setForgotError('Số điện thoại hoặc Email xác minh không khớp với thông tin đã lưu trên tài khoản.');
            setIsResettingPassword(false);
            return;
          }
        } else if (accPhone && !accPhone.includes(cleanVerification)) {
          setForgotError('Số điện thoại xác minh không khớp với số điện thoại của tài khoản.');
          setIsResettingPassword(false);
          return;
        } else if (accEmail && !accEmail.includes(cleanVerification)) {
          setForgotError('Email xác minh không khớp với email đăng ký của tài khoản.');
          setIsResettingPassword(false);
          return;
        }
      }

      // Build updated account payload
      const updatedAccount: UserAccountRecord = {
        ...matched,
        password: cleanNewPass,
        phone: cleanVerification && !cleanVerification.includes('@') ? (matched.phone || cleanVerification) : matched.phone,
        email: cleanVerification && cleanVerification.includes('@') ? (matched.email || cleanVerification) : matched.email,
      };

      // Save to Firebase Realtime Database
      await saveUserAccountToDatabase(updatedAccount);
      if (onRegisterAccount) {
        await onRegisterAccount(updatedAccount);
      }

      // Pre-fill form state for immediate login
      setUsername(cleanUser);
      setPassword(cleanNewPass);
      setOrgId(cleanOrg);

      setForgotSuccess(`Đã đặt lại mật khẩu mới cho tài khoản "${matched.name || cleanUser}" thành công!`);
      setIsResettingPassword(false);
    } catch (err) {
      console.error('Error resetting password:', err);
      setForgotError('Có lỗi xảy ra khi cập nhật mật khẩu lên hệ thống. Vui lòng thử lại.');
      setIsResettingPassword(false);
    }
  };

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
      const matchedTenantObj = tenants.find(
        (t) => t.code.toUpperCase() === cleanOrgId || t.id === cleanOrgId
      );
      const orgName = matchedTenantObj
        ? matchedTenantObj.name
        : matchedAccount?.orgName || (companySettings?.orgId === cleanOrgId ? companySettings.orgName : `Đơn vị ${cleanOrgId}`);

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

      const userPermissions =
        matchedAccount?.permissions ||
        (userRole === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_USER_PERMISSIONS);

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
        permissions: userPermissions,
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
          permissions: DEFAULT_ADMIN_PERMISSIONS,
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
      <div className="w-full max-w-[480px] flex flex-col items-center z-10 my-auto py-6">
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
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'register'
                ? 'bg-white text-blue-800 shadow-md'
                : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Đăng Ký Doanh Nghiệp</span>
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
              <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                    onClick={handleOpenForgotModal}
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

          {/* ===================== TAB 2: REGISTER ENTERPRISE ===================== */}
          {authMode === 'register' && (
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

          {/* Version and Copyright */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Phiên bản 2.5.0</span>
            <span>Kho & Thi Công Xây Dựng</span>
          </div>
        </div>
      </div>

      {/* Forgot Password / Password Recovery Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                    Lấy Lại Mật Khẩu
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Khôi phục và cập nhật mật khẩu mới cho tài khoản
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="close-forgot-modal-btn"
                onClick={() => setShowForgotModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Error message */}
            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{forgotError}</span>
              </div>
            )}

            {/* Success State */}
            {forgotSuccess ? (
              <div className="space-y-4 animate-in fade-in py-2">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-emerald-900 text-sm">Thao tác thành công!</p>
                    <p className="leading-relaxed">{forgotSuccess}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Tài khoản:</span>
                    <strong className="font-mono text-slate-900">{forgotUsername}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Doanh nghiệp:</span>
                    <strong className="font-mono text-slate-900">{forgotOrgId}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Mật khẩu mới:</span>
                    <strong className="font-mono text-blue-700">{forgotNewPassword}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  id="confirm-login-after-reset-btn"
                  onClick={() => {
                    setShowForgotModal(false);
                    setAuthMode('login');
                  }}
                  className="w-full bg-[#0c59be] hover:bg-[#094ca7] text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>ĐĂNG NHẬP NGAY VỚI MẬT KHẨU MỚI</span>
                </button>
              </div>
            ) : (
              /* Password Reset Form */
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                {/* Username */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Tên đăng nhập <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 bg-white overflow-hidden">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      id="forgot-username-input"
                      value={forgotUsername}
                      onChange={(e) => setForgotUsername(e.target.value)}
                      placeholder="ví dụ: admin, thong_kho"
                      className="w-full pl-9 pr-3 py-2 text-xs text-slate-800 outline-none"
                    />
                  </div>
                </div>

                {/* Organization Code */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mã Doanh Nghiệp (Chi nhánh) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 bg-white overflow-hidden">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      id="forgot-orgid-input"
                      value={forgotOrgId}
                      onChange={(e) => setForgotOrgId(e.target.value.toUpperCase())}
                      placeholder="CT36"
                      className="w-full pl-9 pr-3 py-2 text-xs font-bold text-blue-700 uppercase outline-none"
                    />
                  </div>
                </div>

                {/* Verification Phone or Email */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Số điện thoại / Email xác minh
                    </label>
                    <span className="text-[10px] text-slate-400">Tùy chọn xác thực</span>
                  </div>
                  <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 bg-white overflow-hidden">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="forgot-verification-input"
                      value={forgotVerification}
                      onChange={(e) => setForgotVerification(e.target.value)}
                      placeholder="Số điện thoại hoặc Email đăng ký tài khoản"
                      className="w-full pl-9 pr-3 py-2 text-xs text-slate-800 outline-none"
                    />
                  </div>
                </div>

                {/* New Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Mật khẩu mới <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 bg-white overflow-hidden">
                      <input
                        type={forgotShowPassword ? 'text' : 'password'}
                        required
                        id="forgot-new-password-input"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full px-3 py-2 text-xs text-slate-800 outline-none pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setForgotShowPassword(!forgotShowPassword)}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {forgotShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Xác nhận mật khẩu <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 bg-white overflow-hidden">
                      <input
                        type={forgotShowPassword ? 'text' : 'password'}
                        required
                        id="forgot-confirm-password-input"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full px-3 py-2 text-xs text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Hotlines helper notice */}
                <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-100 text-[11px] text-blue-800 flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                  <span>
                    Mật khẩu mới sẽ được cập nhật trực tiếp lên hệ thống đám mây Realtime Database. Hotline hỗ trợ kỹ thuật: <strong>0915 586 234</strong>.
                  </span>
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    id="submit-reset-password-btn"
                    disabled={isResettingPassword}
                    className="w-full bg-[#0c59be] hover:bg-[#094ca7] text-white py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {isResettingPassword ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>XÁC NHẬN ĐẶT LẠI MẬT KHẨU</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Hủy bỏ & Quay lại
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
