import React, { useState } from 'react';
import {
  Building2,
  Shield,
  Database,
  Globe,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { UserAccount } from '../types';

interface SettingsViewProps {
  currentUser: UserAccount | null;
  onClearAllData?: () => Promise<void> | void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onClearAllData,
}) => {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);

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

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-10">
      <div className="pt-1">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Thiết Lập Hệ Thống</h2>
        <p className="text-xs text-slate-500 mt-0.5">Cấu hình đơn vị, phân quyền người dùng và dữ liệu kho</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-6">
        {/* Brand identity header */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-100 flex-shrink-0">
            <BrandLogo size="lg" className="w-16 h-16" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase text-blue-700 tracking-wider font-['Plus_Jakarta_Sans',sans-serif]">
              TRUONG SON COMPANY
            </span>
            <h3 className="text-base font-bold text-slate-900">Logo & Bộ Nhận Diện Thương Hiệu</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống quản lý định mức thi công & vật tư chống thấm Waterproofing 36
            </p>
          </div>
        </div>

        {/* Org Info */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Thông tin Doanh nghiệp / Chi nhánh</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mã Doanh nghiệp (ID)</label>
              <input
                type="text"
                disabled
                value={currentUser?.orgId || 'CT36'}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tên đơn vị</label>
              <input
                type="text"
                disabled
                value={currentUser?.orgName || 'Công Ty Trường Sơn - Waterproofing 36'}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* User profile */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Tài khoản đang đăng nhập</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tài khoản</label>
              <input
                type="text"
                disabled
                value={currentUser?.username || 'admin'}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Vai trò</label>
              <span className="inline-block px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
                Quản trị viên cấp cao (Admin)
              </span>
            </div>
          </div>
        </div>

        {/* Firebase Cloud Database */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Cơ Sở Dữ Liệu Đám Mây (Firebase Firestore)</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Đang kết nối
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Firebase Project ID</label>
              <input
                type="text"
                disabled
                value="chongtham36-c3c29"
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Auth Domain</label>
              <input
                type="text"
                disabled
                value="chongtham36-c3c29.firebaseapp.com"
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Storage Bucket</label>
              <input
                type="text"
                disabled
                value="chongtham36-c3c29.firebasestorage.app"
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Đồng bộ dữ liệu Realtime</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-800 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Tự động đồng bộ các bảng: projects, materials, exportedGoods, laborLogs, staff</span>
              </div>
            </div>
          </div>
        </div>

        {/* Database Management & Clean */}
        {onClearAllData && (
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Quản Lý & Làm Sạch Dữ Liệu</span>
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Xóa toàn bộ các bản ghi mẫu hoặc khởi tạo lại cơ sở dữ liệu trống sạch để bắt đầu nhập liệu thực tế
            </p>

            {clearedSuccess && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Đã xóa toàn bộ dữ liệu mẫu thành công! Cơ sở dữ liệu hiện đã hoàn toàn trống sạch.</span>
              </div>
            )}

            {!isConfirmingClear ? (
              <button
                type="button"
                onClick={() => setIsConfirmingClear(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa toàn bộ dữ liệu demo (Reset sạch)</span>
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-900">
                      Xác nhận xóa sạch toàn bộ dữ liệu khỏi Firestore?
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
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    disabled={isClearing}
                    onClick={handleClear}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isClearing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang xóa khỏi Firestore...</span>
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
              <span className="font-semibold text-slate-700">v2.4.2 (Clean Database Production)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400">Hỗ trợ kỹ thuật 24/7:</span>
              <span className="font-semibold text-blue-600">0915 586 234</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Bản quyền:</span>
              <span className="font-semibold text-slate-700">© 2026 Kho Chống Thấm 36</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
