import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Check,
  Globe,
  MapPin,
  Phone,
  Mail,
  FileText,
  Trash2,
  Edit2,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Layers,
  AlertCircle,
  Database,
  RefreshCw,
} from 'lucide-react';
import { TenantOrganization, UserAccount } from '../types';
import { DEFAULT_TENANT_ID, saveTenantToDatabase, deleteTenantFromDatabase, seedSampleDataToDatabase } from '../firebase';

interface TenantManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: TenantOrganization[];
  activeTenantId: string;
  onSelectTenant: (tenantId: string) => void;
  currentUser: UserAccount | null;
  onShowToast: (msg: string) => void;
}

export const TenantManagerModal: React.FC<TenantManagerModalProps> = ({
  isOpen,
  onClose,
  tenants,
  activeTenantId,
  onSelectTenant,
  currentUser,
  onShowToast,
}) => {
  // Modal view mode: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingTenant, setEditingTenant] = useState<TenantOrganization | null>(null);

  // Form states for Create / Edit
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [seedDataOption, setSeedDataOption] = useState<'sample' | 'empty'>('sample');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation
  const [deletingTenantId, setDeletingTenantId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const isSuperAdmin =
    currentUser?.username.toLowerCase() === 'admin' &&
    (currentUser?.orgId?.toUpperCase() === 'CT36' || currentUser?.allowedTenants?.includes('*'));

  const checkUserHasAccess = (t: TenantOrganization) => {
    if (isSuperAdmin) return true;
    if (!currentUser) return false;
    const userOrg = (currentUser.orgId || '').toUpperCase();
    const targetCode = (t.code || '').toUpperCase();
    const allowed = currentUser.allowedTenants || [];
    return (
      t.id === currentUser.createdTenantId ||
      userOrg === targetCode ||
      allowed.includes(t.id) ||
      allowed.includes(targetCode)
    );
  };

  const handleOpenCreate = () => {
    setViewMode('create');
    setEditingTenant(null);
    setCode(`CN0${tenants.length + 1}`);
    setName('');
    setBrandName('');
    setTagline('Chi nhánh thi công & phân phối giải pháp chống thấm chuyên nghiệp');
    setPhone('');
    setEmail('');
    setAddress('');
    setTaxCode('');
    setSeedDataOption('sample');
    setFormError('');
  };

  const handleOpenEdit = (t: TenantOrganization) => {
    setViewMode('edit');
    setEditingTenant(t);
    setCode(t.code);
    setName(t.name);
    setBrandName(t.brandName || t.name);
    setTagline(t.tagline || '');
    setPhone(t.phone || '');
    setEmail(t.email || '');
    setAddress(t.address || '');
    setTaxCode(t.taxCode || '');
    setFormError('');
  };

  const handleSubmitTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    if (!cleanCode) {
      setFormError('Vui lòng nhập Mã chi nhánh / đơn vị (ví dụ: HN01, DN01)');
      return;
    }
    if (!cleanName) {
      setFormError('Vui lòng nhập Tên đơn vị / chi nhánh');
      return;
    }

    // Check duplicate code
    const isDup = tenants.some(
      (t) => t.code.toUpperCase() === cleanCode && (!editingTenant || t.id !== editingTenant.id)
    );
    if (isDup) {
      setFormError(`Mã đơn vị "${cleanCode}" đã tồn tại trên hệ thống. Vui lòng chọn mã khác.`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (viewMode === 'create') {
        const newId = `tenant_${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now().toString(36)}`;
        const newTenant: TenantOrganization = {
          id: newId,
          code: cleanCode,
          name: cleanName,
          brandName: brandName.trim() || cleanName,
          tagline: tagline.trim() || 'Hệ thống Quản lý Thi công & Vật tư Chống thấm Chuyên nghiệp',
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          taxCode: taxCode.trim(),
          status: 'active',
          isDefault: false,
          createdAt: new Date().toLocaleDateString('vi-VN'),
        };

        await saveTenantToDatabase(newTenant);

        if (seedDataOption === 'sample') {
          await seedSampleDataToDatabase(newId, cleanCode);
        }

        onShowToast(`Đã tạo thành công không gian Chi nhánh: ${cleanName} (${cleanCode})`);
        onSelectTenant(newId);
      } else if (viewMode === 'edit' && editingTenant) {
        const updatedTenant: TenantOrganization = {
          ...editingTenant,
          code: cleanCode,
          name: cleanName,
          brandName: brandName.trim() || cleanName,
          tagline: tagline.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          taxCode: taxCode.trim(),
          updatedAt: new Date().toISOString(),
        };

        await saveTenantToDatabase(updatedTenant);
        onShowToast(`Đã cập nhật thông tin Chi nhánh: ${cleanName}`);
      }

      setViewMode('list');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Có lỗi khi lưu thông tin đơn vị');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (tenantId === DEFAULT_TENANT_ID) {
      onShowToast('Không thể xóa Chi nhánh gốc mặc định!');
      return;
    }
    setIsDeleting(true);
    try {
      await deleteTenantFromDatabase(tenantId);
      if (activeTenantId === tenantId) {
        onSelectTenant(DEFAULT_TENANT_ID);
      }
      onShowToast('Đã xóa đơn vị / chi nhánh và dữ liệu liên quan thành công.');
      setDeletingTenantId(null);
    } catch (err) {
      onShowToast('Lỗi khi xóa đơn vị: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="tenant-manager-modal"
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Cơ Sở Dữ Liệu Đa Doanh Nghiệp (Multi-Tenant)</h3>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/30 border border-blue-400/40 text-[11px] font-bold text-blue-200">
                  {tenants.length} Không gian
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Phân vùng và cô lập dữ liệu độc lập theo từng Chi nhánh, Công ty hoặc Dự án thành viên
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {viewMode === 'list' ? (
            <>
              {/* Active Workspace Banner */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                    {tenants.find((t) => t.id === activeTenantId)?.code || 'CT'}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                      Không Gian Đang Hoạt Động (Active Tenant)
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      {tenants.find((t) => t.id === activeTenantId)?.name || 'Công Ty Trường Sơn - Waterproofing 36'}
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Đang kết nối Realtime
                  </span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Danh Sách Chi Nhánh / Đơn Vị Trực Thuộc</h4>
                  <p className="text-xs text-slate-500">Mỗi đơn vị sở hữu kho vật tư, dự án, chấm công và chi phí riêng biệt</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Chi Nhánh Mới</span>
                </button>
              </div>

              {/* Tenants Grid / List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {tenants.map((t) => {
                  const isActive = t.id === activeTenantId;
                  const isDefault = t.id === DEFAULT_TENANT_ID || t.isDefault;

                  return (
                    <div
                      key={t.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between relative ${
                        isActive
                          ? 'bg-blue-50/40 border-blue-400 ring-2 ring-blue-500/20 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 rounded-lg bg-slate-900 text-white text-xs font-black font-mono tracking-wider">
                              {t.code}
                            </span>
                            {isDefault && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                                Đơn vị gốc
                              </span>
                            )}
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold shadow-2xs">
                                Đang chọn
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(t)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Sửa thông tin chi nhánh"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {!isDefault && (
                              <button
                                type="button"
                                onClick={() => setDeletingTenantId(t.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Xóa chi nhánh"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title & info */}
                        <h5 className="font-bold text-slate-900 text-sm mt-2.5 leading-snug">
                          {t.name}
                        </h5>
                        <p className="text-xs text-slate-500 italic mt-0.5 line-clamp-1">
                          {t.brandName || t.name} {t.tagline ? `— ${t.tagline}` : ''}
                        </p>

                        {/* Details */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                          {t.address && (
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{t.address}</span>
                            </div>
                          )}
                          {t.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span>{t.phone}</span>
                            </div>
                          )}
                          {t.taxCode && (
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span>MST: {t.taxCode}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer Switch Action */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          ID: <code className="font-mono">{t.id}</code>
                        </span>
                        {isActive ? (
                          <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                            <Check className="w-4 h-4 text-blue-600" />
                            <span>Không gian hiện tại</span>
                          </span>
                        ) : checkUserHasAccess(t) ? (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectTenant(t.id);
                              onShowToast(`Đã chuyển sang không gian làm việc: ${t.name} (${t.code})`);
                              onClose();
                            }}
                            className="py-1.5 px-3 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>Làm việc tại đây</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                            <span>🔒 Thuộc đơn vị khác</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Create / Edit Form */
            <form onSubmit={handleSubmitTenant} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      {viewMode === 'create' ? 'Thêm Chi Nhánh / Đơn Vị Mới' : 'Chỉnh Sửa Thông Tin Chi Nhánh'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {viewMode === 'create'
                        ? 'Tạo mới một phân vùng cơ sở dữ liệu riêng biệt cho đơn vị này'
                        : `Cập nhật thông tin nhận diện cho ${editingTenant?.code}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  ← Quay lại danh sách
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã Đơn Vị / Chi Nhánh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: HN01, DN01, HCM02"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Dùng làm mã định danh tiền tố</span>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Đơn Vị / Công Ty / Chi Nhánh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: Chi Nhánh Đà Nẵng - Waterproofing Trường Sơn"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên Thương Hiệu (Brand Name)</label>
                  <input
                    type="text"
                    placeholder="ví dụ: Waterproofing Đà Nẵng"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã Số Thuế (MST)</label>
                  <input
                    type="text"
                    placeholder="ví dụ: 2801987654-003"
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hotline / Số Điện Thoại</label>
                  <input
                    type="text"
                    placeholder="ví dụ: 0915 586 234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Liên Hệ</label>
                  <input
                    type="email"
                    placeholder="ví dụ: danang@chongtham36.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa Chỉ Chi Nhánh / Văn Phòng</label>
                <input
                  type="text"
                  placeholder="ví dụ: Số 123 Nguyễn Văn Linh, Q. Hải Châu, TP. Đà Nẵng"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Khẩu Hiệu / Tagline</label>
                <input
                  type="text"
                  placeholder="ví dụ: Giải pháp chống thấm toàn diện cho khu vực Miền Trung"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {viewMode === 'create' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-blue-600" />
                    <span>Khởi Tạo Dữ Liệu Ban Đầu Cho Không Gian Này:</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 cursor-pointer transition-all ${
                        seedDataOption === 'sample'
                          ? 'bg-blue-50/80 border-blue-300 font-semibold text-blue-900'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="seedOption"
                        checked={seedDataOption === 'sample'}
                        onChange={() => setSeedDataOption('sample')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <span className="block font-bold">Khởi tạo dữ liệu mẫu</span>
                        <span className="text-[11px] font-normal text-slate-500">
                          Sao chép bộ danh mục vật tư Sika, dự án mẫu và nhân sự ban đầu
                        </span>
                      </div>
                    </label>

                    <label
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 cursor-pointer transition-all ${
                        seedDataOption === 'empty'
                          ? 'bg-blue-50/80 border-blue-300 font-semibold text-blue-900'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="seedOption"
                        checked={seedDataOption === 'empty'}
                        onChange={() => setSeedDataOption('empty')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <span className="block font-bold">Kho dữ liệu trống (Blank)</span>
                        <span className="text-[11px] font-normal text-slate-500">
                          Bắt đầu với kho vật tư và công trình trống hoàn toàn
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-xs transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{viewMode === 'create' ? 'Tạo Chi Nhánh Mới' : 'Lưu Thay Đổi'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Delete confirmation modal overlay */}
        {deletingTenantId && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2.5 rounded-xl bg-rose-100">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Xác Nhận Xóa Chi Nhánh?</h4>
                  <p className="text-xs text-slate-500">Hành động này không thể hoàn tác</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bạn có chắc chắn muốn xóa không gian chi nhánh{' '}
                <strong className="text-slate-900">
                  {tenants.find((t) => t.id === deletingTenantId)?.name}
                </strong>
                ? Toàn bộ danh mục vật tư, dự án, lịch sử xuất kho và chấm công của đơn vị này trên Firebase sẽ bị xóa.
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingTenantId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => handleDeleteTenant(deletingTenantId)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Xác nhận Xóa vĩnh viễn</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Mỗi Chi nhánh được phân lập dữ liệu độc lập và đồng bộ thời gian thực theo chuẩn Multi-Tenant.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold cursor-pointer transition-colors self-end sm:self-auto"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
