import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  MapPin,
  Calendar,
  CheckCircle2,
  Sparkles,
  Phone,
  UserCheck,
  Tag,
  DollarSign,
  FileText,
  AlertCircle,
  Clock,
  Check,
} from 'lucide-react';
import { ConstructionProject, StaffMember } from '../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProject: (project: ConstructionProject) => Promise<void> | void;
  initialData?: ConstructionProject | null;
  staffList?: StaffMember[];
  existingProjectsCount?: number;
}

const CATEGORY_PRESETS = [
  'Chống thấm Sàn mái lộ thiên',
  'Chống thấm Tầng hầm & Hố Pit',
  'Chống thấm Bể bơi & Bể nước sinh hoạt',
  'Chống thấm Ban công & Sân thượng',
  'Chống thấm Tường đứng ngoài nhà',
  'Chống thấm Nhà vệ sinh & Khu ẩm ướt',
  'Chống thấm Khe co giãn & Cổ ống',
  'Tổng thầu Chống thấm Toàn bộ công trình',
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onSaveProject,
  initialData = null,
  staffList = [],
  existingProjectsCount = 0,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [partner, setPartner] = useState('');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'active' | 'pending' | 'completed'>('active');
  const [category, setCategory] = useState(CATEGORY_PRESETS[0]);
  const [supervisor, setSupervisor] = useState('');
  const [phone, setPhone] = useState('');
  const [budget, setBudget] = useState<number | string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Populate data when editing or reset when creating new
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCode(initialData.code || '');
      setPartner(initialData.partner || '');
      setAddress(initialData.address || '');
      setStartDate(initialData.startDate || new Date().toISOString().split('T')[0]);
      setEndDate(initialData.endDate || '');
      setStatus(initialData.status || 'active');
      setCategory(initialData.category || CATEGORY_PRESETS[0]);
      setSupervisor(initialData.supervisor || '');
      setPhone(initialData.phone || '');
      setBudget(initialData.budget ? initialData.budget : '');
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setCode(`CT36-CT${String(existingProjectsCount + 1).padStart(2, '0')}`);
      setPartner('');
      setAddress('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setStatus('active');
      setCategory(CATEGORY_PRESETS[0]);
      setSupervisor(staffList[0]?.name || '');
      setPhone('');
      setBudget('');
      setNotes('');
    }
    setErrorMessage('');
  }, [initialData, isOpen, existingProjectsCount, staffList]);

  if (!isOpen) return null;

  const generateAutoCode = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setCode(`CT36-DA${randomSuffix}`);
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
      const projectPayload: ConstructionProject = {
        id: initialData?.id || `proj-${Date.now()}`,
        code: cleanCode,
        name: cleanName,
        partner: cleanPartner || 'Chủ đầu tư mới',
        address: cleanAddress || 'TP. Hồ Chí Minh',
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate ? endDate : undefined,
        status: status,
        totalExportsValue: initialData ? initialData.totalExportsValue : 0,
        workdaysLogged: initialData ? initialData.workdaysLogged : 0,
        supervisor: supervisor.trim() || undefined,
        category: category || CATEGORY_PRESETS[0],
        phone: phone.trim() || undefined,
        budget: typeof budget === 'number' ? budget : Number(budget) || undefined,
        notes: notes.trim() || undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
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

          {/* Row 2: Category & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Hạng mục chống thấm chính</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-medium text-slate-700 cursor-pointer"
              >
                {CATEGORY_PRESETS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Trạng thái thi công</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-semibold cursor-pointer"
              >
                <option value="active">🟢 Đang thi công (Active)</option>
                <option value="pending">🟡 Chuẩn bị / Sắp khởi công (Pending)</option>
                <option value="completed">🔵 Đã nghiệm thu & Hoàn thành (Completed)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Partner & Address */}
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

          {/* Row 4: Supervisor & Contact Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Chỉ huy trưởng / Giám sát phụ trách</span>
              </label>
              {staffList.length > 0 ? (
                <div className="relative">
                  <input
                    type="text"
                    list="staff-suggestions"
                    value={supervisor}
                    onChange={(e) => setSupervisor(e.target.value)}
                    placeholder="Chọn hoặc nhập tên phụ trách..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800"
                  />
                  <datalist id="staff-suggestions">
                    {staffList.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.role} - {s.phone})
                      </option>
                    ))}
                  </datalist>
                </div>
              ) : (
                <input
                  type="text"
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  placeholder="VD: Nguyễn Văn Thắng"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800"
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Số điện thoại hotline công trường</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0912 345 678"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800"
              />
            </div>
          </div>

          {/* Row 5: Start Date, Expected End Date & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Ngày khởi công</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Dự kiến kết thúc</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>Dự toán / Ngân sách (đ)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1000000"
                value={budget}
                onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : '')}
                placeholder="VD: 50000000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-medium"
              />
            </div>
          </div>

          {/* Row 6: Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Ghi chú & Yêu cầu kỹ thuật chống thấm</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Sử dụng màng khò nóng 4mm kết hợp sơn chống thấm polyurethane hai thành phần..."
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
  );
};
