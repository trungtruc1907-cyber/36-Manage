import React, { useState } from 'react';
import { LogIn, User, Lock, Eye, EyeOff, Building2, Check, AlertCircle } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { UserAccount } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [orgId, setOrgId] = useState('CT36');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  const orgSuggestions = [
    { id: 'CT36', label: 'CT36 (Trường Sơn 36)', name: 'Công Ty Trường Sơn - Waterproofing 36' },
    { id: 'MN01', label: 'MN01 (Trường Sơn MN)', name: 'Chi Nhánh Trường Sơn Miền Nam' },
    { id: 'HN01', label: 'HN01 (Trường Sơn HN)', name: 'Chi Nhánh Trường Sơn Hà Nội' },
  ];

  const handleSelectOrg = (id: string) => {
    setOrgId(id);
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Vui lòng nhập Tên đăng nhập (User)');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Vui lòng nhập Mật khẩu (Pass)');
      return;
    }
    if (!orgId.trim()) {
      setErrorMessage('Vui lòng nhập ID Doanh Nghiệp (Mã Tổ đội / Chi nhánh)');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const selectedOrg = orgSuggestions.find((o) => o.id.toUpperCase() === orgId.trim().toUpperCase());
      const orgName = selectedOrg ? selectedOrg.name : `Đơn vị ${orgId.toUpperCase()}`;

      onLoginSuccess({
        username: username.trim(),
        role: username.toLowerCase().includes('kho') ? 'storekeeper' : username.toLowerCase().includes('gs') ? 'supervisor' : 'admin',
        orgId: orgId.trim().toUpperCase(),
        orgName,
        name: username.toLowerCase() === 'admin' ? 'Quản Trị Viên (Admin)' : username,
      });
    }, 450);
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
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3 relative group">
            <div className="p-2.5 rounded-full bg-white/95 shadow-2xl ring-4 ring-white/30 backdrop-blur-xs flex items-center justify-center">
              <BrandLogo size="lg" showText={false} className="w-20 h-20 sm:w-24 sm:h-24" />
            </div>
          </div>

          <h2 className="text-sm font-black tracking-widest text-blue-100 uppercase drop-shadow-sm font-['Plus_Jakarta_Sans',sans-serif]">
            TRUONG SON COMPANY
          </h2>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-white uppercase drop-shadow-sm font-['Plus_Jakarta_Sans',sans-serif] mt-0.5">
            WATERPROOFING <span className="text-[#fbbf24]">36</span>
          </h1>

          <p className="text-white/85 text-xs sm:text-sm font-normal mt-1 max-w-xs sm:max-w-sm leading-relaxed px-2">
            Hệ Thống Quản Lý Thi Công & Vật Tư Đa Doanh Nghiệp
          </p>
        </div>

        {/* Login Form Card */}
        <div
          id="login-form-card"
          className="w-full bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.25)] p-6 sm:p-8 border border-white/40 backdrop-blur-sm"
        >
          {/* Card Header */}
          <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-inner border border-blue-100/80">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
                Đăng Nhập Tài Khoản
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Nhập User, Mật khẩu và ID Doanh nghiệp
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field 1: User */}
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Field 3: Org ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                ID Doanh Nghiệp (Mã Tổ đội / Chi nhánh) <span className="text-rose-500 font-bold">*</span>
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
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 uppercase outline-none font-semibold"
                />
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-500 mr-0.5">Gợi ý ID:</span>
                {orgSuggestions.map((item) => {
                  const isSelected = orgId.toUpperCase() === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      id={`suggest-org-${item.id.toLowerCase()}`}
                      onClick={() => handleSelectOrg(item.id)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all ${
                        isSelected
                          ? 'bg-[#5842be] text-white shadow-xs'
                          : 'bg-[#e2edff] text-slate-700 hover:bg-blue-100 border border-blue-200/50'
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
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600 font-medium">Ghi nhớ đăng nhập</span>
              </label>

              <button
                type="button"
                id="forgot-password-link"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
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
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              Phiên bản 2.4.1 • © 2024 Waterproofing 36
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 mb-2">Quên Mật Khẩu?</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Vui lòng liên hệ Quản trị viên hệ thống Waterproofing 36 hoặc Hotline kỹ thuật: <strong>1900 3636</strong> để được cấp lại mật khẩu cho tài khoản doanh nghiệp.
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Tài khoản mặc định:</span>
                <span className="font-mono font-bold">admin</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mật khẩu thử nghiệm:</span>
                <span className="font-mono font-bold">123456</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mã chi nhánh:</span>
                <span className="font-mono font-bold">CT36</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full bg-[#0c59be] text-white py-2.5 rounded-xl font-semibold text-xs hover:bg-[#094ca7] cursor-pointer"
            >
              Đã hiểu & Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
