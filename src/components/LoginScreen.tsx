import React, { useState } from 'react';
import {
  LogIn,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Phone,
  Info,
} from 'lucide-react';
import {
  CompanySettings,
  UserAccount,
  UserAccountRecord,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_USER_PERMISSIONS,
} from '../types';
import { INITIAL_USER_ACCOUNTS, recordLoginHistoryToDatabase, saveUserAccountToDatabase } from '../firebase';

interface LoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
  onRegisterAccount?: (newAccount: UserAccountRecord) => Promise<void> | void;
  accounts?: UserAccountRecord[];
  companySettings?: CompanySettings;
  tenants?: any[];
  onRegisterNewEnterprise?: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onRegisterAccount,
  accounts = INITIAL_USER_ACCOUNTS,
  companySettings,
}) => {
  // Login Form States
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('chongtham36_last_username') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Forgot Password / Password Recovery Form States
  const [forgotUsername, setForgotUsername] = useState('');
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
    const cleanVerification = forgotVerification.trim().toLowerCase();
    const cleanNewPass = forgotNewPassword.trim();
    const cleanConfirmPass = forgotConfirmPassword.trim();

    if (!cleanUser) {
      setForgotError('Vui lòng nhập Tên đăng nhập cần lấy lại mật khẩu');
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

      setForgotSuccess(`Đã đặt lại mật khẩu mới cho tài khoản "${matched.name || cleanUser}" thành công!`);
      setIsResettingPassword(false);
    } catch (err) {
      console.error('Error resetting password:', err);
      setForgotError('Có lỗi xảy ra khi cập nhật mật khẩu lên hệ thống. Vui lòng thử lại.');
      setIsResettingPassword(false);
    }
  };

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setErrorMessage('Vui lòng nhập Tên đăng nhập (User)');
      return;
    }
    if (!cleanPassword) {
      setErrorMessage('Vui lòng nhập Mật khẩu (Pass)');
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

      // Validate password
      if (matchedAccount) {
        if (matchedAccount.password && matchedAccount.password !== cleanPassword) {
          setErrorMessage('Mật khẩu không chính xác. Vui lòng kiểm tra lại!');

          // Record failed login to Realtime Database
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
            orgId: companySettings?.orgId || 'CT36',
            timestamp: Date.now(),
            timeFormatted,
            status: 'failed',
            userAgent: userAgent.substring(0, 150),
            device,
            notes: 'Mật khẩu không chính xác',
          });
          return;
        }
      }

      // Prepare user session object
      const orgName = companySettings?.orgName || 'Công Ty Trường Sơn - Waterproofing 36';
      const orgCode = companySettings?.orgId || 'CT36';

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
        orgId: orgCode,
        orgName,
        name: userName,
        phone: matchedAccount?.phone,
        email: matchedAccount?.email,
        permissions: userPermissions,
      };

      // Save to localStorage for quick restore
      localStorage.setItem('chongtham36_last_username', cleanUsername);
      if (rememberMe) {
        localStorage.setItem('chongtham36_active_user', JSON.stringify(authenticatedUser));
      } else {
        localStorage.removeItem('chongtham36_active_user');
      }

      onLoginSuccess(authenticatedUser);
    }, 400);
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
      <div className="w-full max-w-[440px] flex flex-col items-center z-10 my-auto py-6">
        {/* Main Card */}
        <div
          id="auth-main-card"
          className="w-full bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.25)] p-6 sm:p-8 border border-white/40 backdrop-blur-sm"
        >
          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              Đăng Nhập Hệ Thống
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Vui lòng nhập tài khoản và mật khẩu để tiếp tục
            </p>
          </div>

          {/* Status Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Field 1: User */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Tên đăng nhập <span className="text-rose-500 font-bold">*</span>
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
                  placeholder="Nhập tên tài khoản"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none font-medium"
                />
              </div>
            </div>

            {/* Field 2: Password */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Mật khẩu <span className="text-rose-500 font-bold">*</span>
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

          {/* Version and Copyright */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Phiên bản 2.5.0</span>
            <span>Hệ Thống Quản Lý Độc Lập</span>
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
                    <span>Mật khẩu mới:</span>
                    <strong className="font-mono text-blue-700">{forgotNewPassword}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  id="confirm-login-after-reset-btn"
                  onClick={() => setShowForgotModal(false)}
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
                      placeholder="ví dụ: admin, thukho, giamsat"
                      className="w-full pl-9 pr-3 py-2 text-xs text-slate-800 outline-none"
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
                    Mật khẩu mới sẽ được cập nhật trực tiếp lên hệ thống cơ sở dữ liệu. Hotline hỗ trợ: <strong>0915 586 234</strong>.
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
