import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  MapPin,
  Calendar,
  CheckCircle2,
  Sparkles,
  DollarSign,
  FileText,
  AlertCircle,
  Clock,
  Coins,
  ArrowRight,
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import { ConstructionProject, StaffMember } from '../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProject: (project: ConstructionProject) => Promise<void> | void;
  initialData?: ConstructionProject | null;
  existingProjectsCount?: number;
  staffList?: StaffMember[];
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onSaveProject,
  initialData = null,
  existingProjectsCount = 0,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [partner, setPartner] = useState('');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'active' | 'pending' | 'completed'>('active');
  const [completedValue, setCompletedValue] = useState<number | string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // State for the Completion Value Popup Modal
  const [isCompletedValuePopupOpen, setIsCompletedValuePopupOpen] = useState(false);
  const [tempValueInput, setTempValueInput] = useState('');

  // Format currency helper
  const formatCurrency = (val: number | string) => {
    const num = typeof val === 'number' ? val : Number(val);
    if (isNaN(num) || num === 0) return '0';
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  // Populate data when editing or reset when creating new
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCode(initialData.code || '');
      setPartner(initialData.partner || '');
      setAddress(initialData.address || '');
      setStartDate(initialData.startDate || new Date().toISOString().split('T')[0]);
      setStatus(initialData.status || 'active');
      setCompletedValue(
        initialData.completedValue !== undefined ? initialData.completedValue : ''
      );
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setCode(`CT36-CT${String(existingProjectsCount + 1).padStart(2, '0')}`);
      setPartner('');
      setAddress('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setStatus('active');
      setCompletedValue('');
      setNotes('');
    }
    setIsCompletedValuePopupOpen(false);
    setErrorMessage('');
  }, [initialData, isOpen, existingProjectsCount]);

  if (!isOpen) return null;

  const generateAutoCode = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setCode(`CT36-DA${randomSuffix}`);
  };

  // Handle status selection change
  const handleStatusChange = (newStatus: 'active' | 'pending' | 'completed') => {
    setStatus(newStatus);
    if (newStatus === 'completed') {
      // Open popup to enter completion value
      setTempValueInput(completedValue ? String(completedValue) : '');
      setIsCompletedValuePopupOpen(true);
    } else {
      // When active or pending, reset or hide completed value
      setIsCompletedValuePopupOpen(false);
    }
  };

  // Confirm value from popup
  const handleConfirmCompletedValue = () => {
    const cleanNum = Number(tempValueInput.replace(/\D/g, '')) || 0;
    setCompletedValue(cleanNum);
    setIsCompletedValuePopupOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();
    const cleanPartner = partner.trim();
    const cleanAddress = address.trim();

    if (!cleanName) {
      setErrorMessage('Vui lòng nhập tên công trình / dự án');
      return;
    }
    if (!cleanCode) {
      setErrorMessage('Vui lòng nhập mã công trình');
      return;
    }

    setIsSubmitting(true);

    try {
      const numCompletedValue =
        status === 'completed'
          ? typeof completedValue === 'number'
            ? completedValue
            : Number(completedValue) || 0
          : undefined;

      const now = new Date();
      const projectPayload: ConstructionProject = {
        id: initialData?.id || `proj-${Date.now()}`,
        code: cleanCode,
        name: cleanName,
        partner: cleanPartner || 'Chủ đầu tư mới',
        address: cleanAddress || 'TP. Hồ Chí Minh',
        startDate: startDate || now.toISOString().split('T')[0],
        status: status,
        totalExportsValue: initialData ? initialData.totalExportsValue : 0,
        workdaysLogged: initialData ? initialData.workdaysLogged : 0,
        completedValue: numCompletedValue,
        notes: notes.trim() || undefined,
        createdAt: initialData?.createdAt || now.toISOString(),
        createdAtTimestamp: initialData?.createdAtTimestamp || Date.now(),
        updatedAt: now.toISOString(),
      };

      await onSaveProject(projectPayload);
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setErrorMessage('Đã xảy ra lỗi khi lưu vào cơ sở dữ liệu. Vui lòng thử lại!');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  {initialData ? 'Chỉnh Sửa Công Trình / Dự Án' : 'Thêm Mới Công Trình / Dự Án'}
                </h3>
                <p className="text-xs text-slate-500">
                  {initialData
                    ? `Mã: ${initialData.code} - Đồng bộ trực tiếp Firebase Realtime DB`
                    : 'Lưu thông tin công trình vào Firebase Realtime Database'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error notification */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {/* Row 1: Project Name & Code */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên Công Trình / Dự Án <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Cẩm Bá Thước Azhome / Biệt thự Holm Thảo Điền"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800 font-semibold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Mã Dự Án <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateAutoCode}
                    className="text-[10px] text-blue-600 hover:underline font-medium inline-flex items-center gap-0.5 cursor-pointer"
                    title="Tạo mã tự động"
                  >
                    <Sparkles className="w-2.5 h-2.5" /> Tạo mã
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="VD: CT36-AZ05"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none uppercase font-mono font-bold text-blue-700"
                />
              </div>
            </div>

            {/* Row 2: Partner & Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chủ đầu tư / Đối tác</label>
                <input
                  type="text"
                  value={partner}
                  onChange={(e) => setPartner(e.target.value)}
                  placeholder="VD: Công ty CP Kiến Trúc Azhome"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Địa chỉ thi công</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="VD: 18 Cẩm Bá Thước, P.7, Q.Phú Nhuận, TP.HCM"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800"
                />
              </div>
            </div>

            {/* Row 3: Start Date & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ngày khởi công</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Trạng thái thi công</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value as any)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-bold cursor-pointer transition-all ${
                    status === 'completed'
                      ? 'border-blue-400 bg-blue-50/70 text-blue-800 ring-2 ring-blue-100'
                      : status === 'pending'
                      ? 'border-amber-300 bg-amber-50/60 text-amber-800'
                      : 'border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-blue-600'
                  }`}
                >
                  <option value="active">🟢 Đang thi công (Active)</option>
                  <option value="pending">🟡 Chuẩn bị / Sắp khởi công (Pending)</option>
                  <option value="completed">🔵 Đã nghiệm thu hoàn thành (Completed)</option>
                </select>
              </div>
            </div>

            {/* Row 4: Completed Value Field (Hidden when active/pending, displayed when completed) */}
            {status === 'completed' && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/90 to-indigo-50/80 border border-blue-200 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                      <Coins className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-blue-900 text-xs">
                      Tổng Giá Trị Hoàn Thành (Nghiệm thu)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                      Đã hoàn thành
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setTempValueInput(completedValue ? String(completedValue) : '');
                      setIsCompletedValuePopupOpen(true);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Chỉnh sửa popup</span>
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-600 font-bold text-sm">
                    ₫
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1000000"
                    placeholder="Nhập tổng giá trị nghiệm thu (VNĐ)..."
                    value={completedValue}
                    onChange={(e) =>
                      setCompletedValue(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-blue-300 bg-white font-mono font-bold text-blue-900 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>

                {completedValue ? (
                  <p className="text-[11px] text-blue-700 font-medium mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    <span>
                      Đã ghi nhận: <strong>{formatCurrency(completedValue)} VNĐ</strong>
                    </span>
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500 mt-1">
                    * Nhập số tiền tổng giá trị nghiệm thu thực tế hoặc bấm vào "Chỉnh sửa popup" để chọn nhanh
                  </p>
                )}
              </div>
            )}

            {/* Row 5: Notes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Ghi chú công trình</span>
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Nghiệm thu bàn giao hồ sơ bảo hành chống thấm 5 năm..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{initialData ? 'Lưu Cập Nhật Dự Án' : 'Lưu Dự Án Vào Cơ Sở Dữ Liệu'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* POPUP MODAL: Nhập Tổng Giá Trị Hoàn Thành khi trạng thái chuyển Nghiệm Thu */}
      {isCompletedValuePopupOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Popup Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Nghiệm Thu Hoàn Thành</h4>
                  <p className="text-[11px] text-blue-100">Điền tổng giá trị hoàn thành của công trình</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCompletedValuePopupOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Popup Content */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Tổng giá trị hoàn thành (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-600 font-bold text-base">
                    ₫
                  </div>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ví dụ: 125,000,000"
                    value={
                      tempValueInput
                        ? new Intl.NumberFormat('vi-VN').format(
                            Number(tempValueInput.replace(/\D/g, '')) || 0
                          )
                        : ''
                    }
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setTempValueInput(raw);
                    }}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-blue-500 bg-blue-50/20 font-mono font-extrabold text-blue-900 text-lg focus:ring-4 focus:ring-blue-100 outline-none text-right tracking-wide"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Chọn nhanh giá trị mẫu:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[20000000, 50000000, 100000000, 200000000, 350000000, 500000000].map(
                    (preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTempValueInput(String(preset))}
                        className="px-2 py-1.5 text-[11px] font-semibold rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-700 cursor-pointer transition-all text-center"
                      >
                        {preset >= 1000000000
                          ? `${preset / 1000000000} Tỷ`
                          : `${preset / 1000000} Tr`}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Confirmation Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCompletedValuePopupOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Bỏ qua
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCompletedValue}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận giá trị</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
