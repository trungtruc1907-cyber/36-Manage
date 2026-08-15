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
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { CompanySettings, UserAccount } from '../types';
import { DEFAULT_COMPANY_SETTINGS } from '../data/mockData';

interface SettingsViewProps {
  currentUser: UserAccount | null;
  companySettings: CompanySettings;
  onUpdateCompanySettings: (newSettings: CompanySettings) => Promise<void> | void;
  onClearAllData?: () => Promise<void> | void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  companySettings,
  onUpdateCompanySettings,
  onClearAllData,
}) => {
  // Form states
  const [formData, setFormData] = useState<CompanySettings>(companySettings);
  const [logoPreview, setLogoPreview] = useState<string | null>(companySettings.customLogoUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Clear data states
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        {/* User profile */}
        <div>
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">Cấu hình đồng bộ</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-800 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Tự động đồng bộ: systemConfig/company, projects, materials, exportedGoods, laborLogs, staff</span>
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
              Xóa toàn bộ các bản ghi hoặc khởi tạo lại cơ sở dữ liệu trống sạch để bắt đầu nhập liệu thực tế
            </p>

            {clearedSuccess && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Đã xóa toàn bộ dữ liệu thành công! Cơ sở dữ liệu hiện đã hoàn toàn trống sạch.</span>
              </div>
            )}

            {!isConfirmingClear ? (
              <button
                type="button"
                id="trigger-clear-all-data-btn"
                onClick={() => setIsConfirmingClear(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa toàn bộ dữ liệu dự án & kho (Reset sạch)</span>
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-900">
                      Xác nhận xóa sạch dữ liệu khỏi Firestore?
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
