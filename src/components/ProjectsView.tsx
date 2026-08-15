import React, { useState } from 'react';
import { Compass, Plus, Search, MapPin, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { ConstructionProject } from '../types';

interface ProjectsViewProps {
  projects: ConstructionProject[];
  onOpenNewProject: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ projects, onOpenNewProject }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.partner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Quản Lý Công Trình & Dự Án</h2>
          <p className="text-xs text-slate-500 mt-0.5">Danh sách các dự án chống thấm đang triển khai thi công</p>
        </div>

        <button
          type="button"
          onClick={onOpenNewProject}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0c59be] hover:bg-[#094ca7] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm công trình mới</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo tên công trình, mã dự án hoặc đối tác..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none shadow-2xs"
        />
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((proj) => (
          <div
            key={proj.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3 relative group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                  {proj.code}
                </span>
                <h3 className="font-bold text-slate-900 text-base">{proj.name}</h3>
                <p className="text-xs text-slate-500 font-medium">{proj.partner}</p>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <CheckCircle2 className="w-3 h-3" />
                <span>Đang thi công</span>
              </span>
            </div>

            <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{proj.address}</span>
            </div>

            <div className="text-xs text-slate-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>Khởi công: {proj.startDate}</span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Vật tư đã xuất:</span>
                <span className="font-bold text-slate-800">{formatCurrency(proj.totalExportsValue)} đ</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[11px]">Tổng công nhật:</span>
                <span className="font-bold text-blue-700">{proj.workdaysLogged} Công</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
