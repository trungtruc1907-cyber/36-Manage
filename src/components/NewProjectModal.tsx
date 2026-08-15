import React, { useState } from 'react';
import { X, Building, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import { ConstructionProject } from '../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: ConstructionProject) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [partner, setPartner] = useState('');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProj: ConstructionProject = {
      id: `proj-${Date.now()}`,
      code: code.trim() || `WP-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      partner: partner.trim() || 'Chủ đầu tư mới',
      address: address.trim() || 'TP. Hồ Chí Minh',
      startDate: startDate || '2024-08-16',
      status: 'active',
      totalExportsValue: 0,
      workdaysLogged: 0,
    };

    onCreateProject(newProj);
    onClose();
    setName('');
    setCode('');
    setPartner('');
    setAddress('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Tạo Dự Án / Công Trình Mới</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên Công Trình <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Cẩm Bá Thước Azhome / Biệt thự Vinhome"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mã dự án</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: AZ-05"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none uppercase font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày khởi công</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chủ đầu tư / Đối tác
            </label>
            <input
              type="text"
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
              placeholder="VD: Công ty CP Kiến Trúc Azhome"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ thi công</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="VD: 18 Cẩm Bá Thước, Phường 7, Phú Nhuận, TP.HCM"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#0c59be] hover:bg-[#094ca7] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận tạo dự án</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
