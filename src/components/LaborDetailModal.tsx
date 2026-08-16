import React, { useState, useEffect } from 'react';
import { X, Users, Calendar, Plus, Check, Building2, Filter } from 'lucide-react';
import { LaborDailyLog, ConstructionProject } from '../types';

interface LaborDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  laborLogs: LaborDailyLog[];
  onAddLaborLog: (log: LaborDailyLog) => void;
  projects?: ConstructionProject[];
  initialProjectName?: string;
}

export const LaborDetailModal: React.FC<LaborDetailModalProps> = ({
  isOpen,
  onClose,
  laborLogs,
  onAddLaborLog,
  projects = [],
  initialProjectName,
}) => {
  const getTodayFormatted = () => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}`;
  };

  const getTodayDayOfWeek = () => {
    const day = new Date().getDay();
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[day] || 'T2';
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [date, setDate] = useState(getTodayFormatted);
  const [dayOfWeek, setDayOfWeek] = useState(getTodayDayOfWeek);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [mainWorkers, setMainWorkers] = useState(3);
  const [helperWorkers, setHelperWorkers] = useState(1);
  const [cost, setCost] = useState(1600000);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDate(getTodayFormatted());
      setDayOfWeek(getTodayDayOfWeek());
      if (initialProjectName) {
        setSelectedProject(initialProjectName);
        setFilterProject(initialProjectName);
        setShowAddForm(true);
      } else {
        setSelectedProject(projects.length > 0 ? projects[0].name : '');
        setFilterProject('all');
      }
    }
  }, [isOpen, initialProjectName, projects]);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: LaborDailyLog = {
      date,
      dayOfWeek,
      mainWorkers,
      helperWorkers,
      totalWorkdays: mainWorkers + helperWorkers,
      totalCost: Number(cost) || (mainWorkers * 400000 + helperWorkers * 300000),
      notes: notes || 'Thi công chống thấm',
      projectName: selectedProject || undefined,
    };
    onAddLaborLog(newLog);
    setShowAddForm(false);
    setNotes('');
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN').format(v);

  const displayedLogs = laborLogs.filter((log) => {
    if (filterProject === 'all') return true;
    return log.projectName === filterProject;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {initialProjectName ? `Chấm Công: ${initialProjectName}` : 'Chi Tiết Nhật Ký Chấm Công'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">Theo dõi số lượng công thợ và chi phí nhân công theo ngày</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Add form toggle & Project filter */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nhật ký ({displayedLogs.length} bản ghi)
              </span>
              {projects.length > 0 && (
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1 text-xs text-slate-600">
                  <Filter className="w-3 h-3 text-slate-400" />
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="bg-transparent text-xs font-medium text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="all">Tất cả công trình</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Chấm công ngày mới</span>
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAdd} className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Nhập thông tin chấm công hôm nay</span>
                </h4>
                {selectedProject && (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    {selectedProject}
                  </span>
                )}
              </div>

              {projects.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Công trình / Dự án thi công *
                  </label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium focus:border-amber-500 outline-none"
                    required
                  >
                    <option value="">-- Chọn công trình --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.name}>
                        [{p.code}] {p.name} - {p.partner}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">Ngày</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="16/08"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">Thứ</label>
                  <input
                    type="text"
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    placeholder="T2"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">Thợ chính (người)</label>
                  <input
                    type="number"
                    min="0"
                    value={mainWorkers}
                    onChange={(e) => setMainWorkers(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">Thợ phụ (người)</label>
                  <input
                    type="number"
                    min="0"
                    value={helperWorkers}
                    onChange={(e) => setHelperWorkers(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">Chi phí nhân công dự kiến (VNĐ)</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-semibold text-rose-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">Hạng mục / Nội dung công việc</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Quét lót chống thấm sàn mái, đục vệ sinh..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu Chấm Công Lên Cơ Sở Dữ Liệu</span>
                </button>
              </div>
            </form>
          )}

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Ngày & Thứ</th>
                  <th className="py-2.5 px-3">Công Trình</th>
                  <th className="py-2.5 px-3 text-center">Thợ chính</th>
                  <th className="py-2.5 px-3 text-center">Thợ phụ</th>
                  <th className="py-2.5 px-3 text-center">Tổng công</th>
                  <th className="py-2.5 px-3 text-right">Chi phí (VNĐ)</th>
                  <th className="py-2.5 px-3">Hạng mục thi công</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      Chưa có nhật ký chấm công nào{filterProject !== 'all' ? ` cho "${filterProject}"` : ''}.
                    </td>
                  </tr>
                ) : (
                  displayedLogs.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                        {row.date} ({row.dayOfWeek})
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800 block truncate max-w-[150px]" title={row.projectName || 'Chung'}>
                          {row.projectName || 'Chung'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium text-slate-700">{row.mainWorkers}</td>
                      <td className="py-2.5 px-3 text-center font-medium text-slate-700">{row.helperWorkers}</td>
                      <td className="py-2.5 px-3 text-center font-extrabold text-blue-700 whitespace-nowrap">
                        {row.totalWorkdays} Công
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600 whitespace-nowrap">
                        {formatCurrency(row.totalCost)} đ
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-[180px]" title={row.notes}>
                        {row.notes}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Tổng công hiển thị: <strong>{displayedLogs.reduce((s, i) => s + i.totalWorkdays, 0)} Công</strong> ({formatCurrency(displayedLogs.reduce((s, i) => s + i.totalCost, 0))} đ)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
