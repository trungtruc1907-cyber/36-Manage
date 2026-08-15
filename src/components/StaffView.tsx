import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Phone,
  HardHat,
  Award,
  Search,
  Trash2,
  X,
  CheckCircle2,
  Database,
  Building2,
} from 'lucide-react';
import { StaffMember } from '../types';

interface StaffViewProps {
  staff: StaffMember[];
  onAddStaff: (newStaff: StaffMember) => Promise<void> | void;
  onDeleteStaff?: (id: string) => Promise<void> | void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  staff,
  onAddStaff,
  onDeleteStaff,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('Thợ chính chống thấm');
  const [phone, setPhone] = useState('');
  const [exp, setExp] = useState('3 năm');
  const [status, setStatus] = useState('Đang tại công trình');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = staff.filter(
    (w) =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.phone.includes(searchTerm) ||
      w.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    const newStaff: StaffMember = {
      id: `staff_${Date.now()}`,
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim(),
      exp: exp.trim() || '1 năm',
      status: status.trim() || 'Đang tại công trình',
    };

    await onAddStaff(newStaff);
    setName('');
    setPhone('');
    setIsSubmitting(false);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Đội Ngũ Nhân Sự & Thợ Thi Công
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Database className="w-3 h-3" />
              Firebase Firestore ({staff.length})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu nhân sự, kỹ thuật viên và tổ đội thi công được đồng bộ thời gian thực từ cơ sở dữ liệu
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0c59be] hover:bg-[#094ca7] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm nhân sự mới</span>
        </button>
      </div>

      {/* Search & Filter bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo tên, vai trò, số điện thoại hoặc công trình..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none shadow-2xs"
        />
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((w) => (
          <div
            key={w.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3 relative group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold border border-blue-100">
                  <HardHat className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm">{w.name}</h3>
                  <p className="text-xs text-blue-600 font-medium">{w.role}</p>
                </div>
              </div>

              {onDeleteStaff && (
                <button
                  type="button"
                  onClick={() => onDeleteStaff(w.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                  title="Xóa nhân sự"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="text-xs text-slate-600 space-y-1.5 pt-1">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <a
                  href={`tel:${w.phone}`}
                  className="hover:text-blue-600 transition-colors font-medium"
                >
                  {w.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-slate-400" />
                <span>Kinh nghiệm: <strong className="text-slate-700">{w.exp}</strong></span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                Phụ trách:
              </span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 truncate max-w-[170px]">
                {w.status}
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            Không tìm thấy nhân sự phù hợp với từ khóa "{searchTerm}"
          </div>
        )}
      </div>

      {/* Modal Add Staff */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <HardHat className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Thêm Nhân Sự Mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên nhân sự <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn Hùng"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vị trí / Chức danh <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                  >
                    <option value="Tổ trưởng / Thợ chính">Tổ trưởng / Thợ chính</option>
                    <option value="Thợ chính chống thấm">Thợ chính chống thấm</option>
                    <option value="Thợ phụ thi công">Thợ phụ thi công</option>
                    <option value="Kỹ thuật / Giám sát">Kỹ thuật / Giám sát</option>
                    <option value="Chỉ huy trưởng công trường">Chỉ huy trưởng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0912 xxx xxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kinh nghiệm thi công
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 5 năm"
                    value={exp}
                    onChange={(e) => setExp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Công trình phân công
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Đang tại Xd Đoàn Ái Sơn"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#0c59be] hover:bg-[#094ca7] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang lưu vào Firebase...' : 'Lưu nhân sự'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
