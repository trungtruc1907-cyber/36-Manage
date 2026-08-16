import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  Building2,
  Banknote,
  Edit,
  Trash2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  HardHat,
  History,
  Check,
} from 'lucide-react';
import { ConstructionProject, LaborDailyLog, LaborWorkerDetail, StaffMember } from '../types';

interface StaffAttendanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffMember: StaffMember | null;
  laborLogs: LaborDailyLog[];
  projects: ConstructionProject[];
  onUpdateLaborLog?: (log: LaborDailyLog) => Promise<void> | void;
  onDeleteLaborLog?: (logId: string) => Promise<void> | void;
  onAddLaborLog?: (log: LaborDailyLog) => Promise<void> | void;
}

export interface WorkerAttendanceRecord {
  logId: string;
  originalLog: LaborDailyLog;
  workerIndexInLog: number;
  date: string;
  dayOfWeek?: string;
  projectName: string;
  projectCode?: string;
  workdays: number;
  dailyWage: number;
  cost: number;
  notes: string;
  session?: 'morning' | 'afternoon' | 'full';
}

export const StaffAttendanceDetailModal: React.FC<StaffAttendanceDetailModalProps> = ({
  isOpen,
  onClose,
  staffMember,
  laborLogs,
  projects,
  onUpdateLaborLog,
  onDeleteLaborLog,
  onAddLaborLog,
}) => {
  // Filters
  const [filterProject, setFilterProject] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mode: 'view', 'edit_record', 'add_record'
  const [editingRecord, setEditingRecord] = useState<WorkerAttendanceRecord | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);

  // Edit/Add Form states
  const [formDate, setFormDate] = useState('');
  const [formProject, setFormProject] = useState('');
  const [formWorkdays, setFormWorkdays] = useState<number>(1.0);
  const [formDailyWage, setFormDailyWage] = useState<number>(450000);
  const [formSession, setFormSession] = useState<'morning' | 'afternoon' | 'full'>('full');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Currency helper
  const formatCurrency = (val?: number) => {
    if (val === undefined || isNaN(val)) return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
  };

  // Date helper
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Get day of week in Vietnamese
  const getDayOfWeekName = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const dayIndex = d.getDay();
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      return days[dayIndex] || '';
    } catch {
      return '';
    }
  };

  // Extract all attendance records for this specific staff member
  const attendanceRecords: WorkerAttendanceRecord[] = useMemo(() => {
    if (!staffMember) return [];
    const staffName = staffMember.name.trim().toLowerCase();
    const records: WorkerAttendanceRecord[] = [];

    laborLogs.forEach((log) => {
      // Check in workerDetails
      if (log.workerDetails && Array.isArray(log.workerDetails) && log.workerDetails.length > 0) {
        log.workerDetails.forEach((wd, index) => {
          if (wd.name && wd.name.trim().toLowerCase() === staffName) {
            records.push({
              logId: log.id || `log_${log.date}_${index}`,
              originalLog: log,
              workerIndexInLog: index,
              date: log.date,
              dayOfWeek: log.dayOfWeek,
              projectName: log.projectName || 'Công trình thi công',
              projectCode: log.projectCode,
              workdays: wd.workdays || 1.0,
              dailyWage: wd.dailyWage || staffMember.dailyWage || 450000,
              cost: wd.cost || (wd.workdays || 1.0) * (wd.dailyWage || staffMember.dailyWage || 450000),
              notes: log.notes || '',
              session: log.session || (wd.workdays === 0.5 ? 'morning' : 'full'),
            });
          }
        });
      } else if (log.workerNames && Array.isArray(log.workerNames)) {
        // Fallback if only workerNames array exists
        const found = log.workerNames.some((wn) => wn && wn.trim().toLowerCase() === staffName);
        if (found) {
          const count = log.workerNames.length || 1;
          const individualWorkdays = log.totalWorkdays ? log.totalWorkdays / count : 1.0;
          const individualCost = log.totalCost ? log.totalCost / count : individualWorkdays * (staffMember.dailyWage || 450000);

          records.push({
            logId: log.id || `log_${log.date}`,
            originalLog: log,
            workerIndexInLog: -1,
            date: log.date,
            dayOfWeek: log.dayOfWeek,
            projectName: log.projectName || 'Công trình thi công',
            projectCode: log.projectCode,
            workdays: individualWorkdays,
            dailyWage: staffMember.dailyWage || 450000,
            cost: individualCost,
            notes: log.notes || '',
            session: log.session || 'full',
          });
        }
      }
    });

    // Sort descending by date
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [staffMember, laborLogs]);

  // Distinct months for filtering
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    attendanceRecords.forEach((r) => {
      if (r.date && r.date.length >= 7) {
        monthsSet.add(r.date.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [attendanceRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter((r) => {
      const matchProj = filterProject === 'all' || r.projectName === filterProject;
      const matchMonth = filterMonth === 'all' || (r.date && r.date.startsWith(filterMonth));
      const matchSearch =
        !searchTerm.trim() ||
        r.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.date.includes(searchTerm);

      return matchProj && matchMonth && matchSearch;
    });
  }, [attendanceRecords, filterProject, filterMonth, searchTerm]);

  // Overall Statistics for this Staff
  const staffStats = useMemo(() => {
    const totalWorkdays = filteredRecords.reduce((sum, r) => sum + r.workdays, 0);
    const totalCost = filteredRecords.reduce((sum, r) => sum + r.cost, 0);
    const uniqueProjects = new Set(filteredRecords.map((r) => r.projectName)).size;
    const totalDaysCount = filteredRecords.length;

    return { totalWorkdays, totalCost, uniqueProjects, totalDaysCount };
  }, [filteredRecords]);

  if (!isOpen || !staffMember) return null;

  // Open Edit Form for a record
  const handleOpenEdit = (rec: WorkerAttendanceRecord) => {
    setEditingRecord(rec);
    setIsAddMode(false);
    setFormDate(rec.date);
    setFormProject(rec.projectName);
    setFormWorkdays(rec.workdays);
    setFormDailyWage(rec.dailyWage || staffMember.dailyWage || 450000);
    setFormSession(rec.session || (rec.workdays === 0.5 ? 'morning' : 'full'));
    setFormNotes(rec.notes);
  };

  // Open Add Form
  const handleOpenAdd = () => {
    setEditingRecord(null);
    setIsAddMode(true);
    const today = new Date().toISOString().split('T')[0];
    setFormDate(today);
    setFormProject(projects.length > 0 ? projects[0].name : 'Công trình thi công');
    setFormWorkdays(1.0);
    setFormDailyWage(staffMember.dailyWage || 450000);
    setFormSession('full');
    setFormNotes('');
  };

  // Save Edit record
  const handleSaveEditRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !onUpdateLaborLog) return;

    setIsSubmitting(true);
    try {
      const orig = editingRecord.originalLog;
      const targetProj = projects.find((p) => p.name === formProject);
      const calculatedCost = formWorkdays * formDailyWage;

      // Update workerDetails inside the original log
      let updatedWorkerDetails: LaborWorkerDetail[] = orig.workerDetails ? [...orig.workerDetails] : [];

      if (editingRecord.workerIndexInLog >= 0 && updatedWorkerDetails[editingRecord.workerIndexInLog]) {
        updatedWorkerDetails[editingRecord.workerIndexInLog] = {
          name: staffMember.name,
          role: staffMember.role,
          dailyWage: formDailyWage,
          workdays: formWorkdays,
          cost: calculatedCost,
        };
      } else {
        // Find by name or recreate
        const idx = updatedWorkerDetails.findIndex(
          (wd) => wd.name.trim().toLowerCase() === staffMember.name.trim().toLowerCase()
        );
        if (idx >= 0) {
          updatedWorkerDetails[idx] = {
            name: staffMember.name,
            role: staffMember.role,
            dailyWage: formDailyWage,
            workdays: formWorkdays,
            cost: calculatedCost,
          };
        } else {
          updatedWorkerDetails.push({
            name: staffMember.name,
            role: staffMember.role,
            dailyWage: formDailyWage,
            workdays: formWorkdays,
            cost: calculatedCost,
          });
        }
      }

      // Recalculate total workdays and cost for the entire log
      const newTotalWorkdays = updatedWorkerDetails.reduce((sum, wd) => sum + (wd.workdays || 0), 0) || formWorkdays;
      const newTotalCost = updatedWorkerDetails.reduce((sum, wd) => sum + (wd.cost || 0), 0) || calculatedCost;

      const updatedLog: LaborDailyLog = {
        ...orig,
        id: orig.id,
        date: formDate,
        dayOfWeek: getDayOfWeekName(formDate) || orig.dayOfWeek,
        projectName: formProject,
        projectCode: targetProj?.code || orig.projectCode || 'CT-01',
        totalWorkdays: newTotalWorkdays,
        totalCost: newTotalCost,
        notes: formNotes,
        session: formSession,
        workerDetails: updatedWorkerDetails,
      };

      await onUpdateLaborLog(updatedLog);
      setEditingRecord(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Add new record
  const handleSaveAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddLaborLog) return;

    setIsSubmitting(true);
    try {
      const targetProj = projects.find((p) => p.name === formProject);
      const calculatedCost = formWorkdays * formDailyWage;
      const isMain = staffMember.role.toLowerCase().includes('chính') || staffMember.role.toLowerCase().includes('tổ trưởng');

      const newLog: LaborDailyLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        date: formDate,
        dayOfWeek: getDayOfWeekName(formDate) || 'Thứ Hai',
        projectName: formProject,
        projectCode: targetProj?.code || 'CT-01',
        mainWorkers: isMain ? 1 : 0,
        helperWorkers: isMain ? 0 : 1,
        totalWorkdays: formWorkdays,
        totalCost: calculatedCost,
        notes: formNotes || `Chấm công trực tiếp cho ${staffMember.name}`,
        session: formSession,
        workerNames: [staffMember.name],
        workerDetails: [
          {
            name: staffMember.name,
            role: staffMember.role,
            dailyWage: formDailyWage,
            workdays: formWorkdays,
            cost: calculatedCost,
          },
        ],
      };

      await onAddLaborLog(newLog);
      setIsAddMode(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete an attendance record
  const handleDeleteRecord = async (rec: WorkerAttendanceRecord) => {
    if (!window.confirm(`Xác nhận xóa ngày công ${formatDateDisplay(rec.date)} (${rec.workdays} công) của ${staffMember.name}?`)) {
      return;
    }

    if (!onDeleteLaborLog && !onUpdateLaborLog) return;

    try {
      const orig = rec.originalLog;

      // If the log contains only this worker, remove the entire log
      if (
        (!orig.workerDetails || orig.workerDetails.length <= 1) &&
        (!orig.workerNames || orig.workerNames.length <= 1)
      ) {
        if (onDeleteLaborLog && orig.id) {
          await onDeleteLaborLog(orig.id);
        }
      } else {
        // Multi-worker log: remove this worker from workerDetails & workerNames
        if (onUpdateLaborLog) {
          const staffName = staffMember.name.trim().toLowerCase();
          const nextDetails = (orig.workerDetails || []).filter(
            (wd) => wd.name.trim().toLowerCase() !== staffName
          );
          const nextNames = (orig.workerNames || []).filter(
            (wn) => wn.trim().toLowerCase() !== staffName
          );

          const newTotalWorkdays = nextDetails.reduce((sum, wd) => sum + (wd.workdays || 0), 0);
          const newTotalCost = nextDetails.reduce((sum, wd) => sum + (wd.cost || 0), 0);

          const updatedLog: LaborDailyLog = {
            ...orig,
            workerDetails: nextDetails,
            workerNames: nextNames,
            totalWorkdays: newTotalWorkdays,
            totalCost: newTotalCost,
          };

          await onUpdateLaborLog(updatedLog);
        }
      }
    } catch (err) {
      console.error('Error deleting record:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Staff Profile */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center flex-shrink-0 font-bold shadow-inner">
                <HardHat className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white truncate">
                    {staffMember.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {staffMember.role}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                  <span>SĐT: <strong className="text-white">{staffMember.phone}</strong></span>
                  <span>•</span>
                  <span>Định mức lương: <strong className="text-emerald-400">{formatCurrency(staffMember.dailyWage)}/ngày</strong></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Chấm công thêm</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick KPI Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-slate-700/60">
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <span className="text-[11px] text-slate-400 font-medium">Tổng ngày công</span>
              <p className="text-base sm:text-lg font-bold text-amber-300 mt-0.5">
                {staffStats.totalWorkdays.toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-300">Công</span>
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <span className="text-[11px] text-slate-400 font-medium">Tổng thu nhập tích lũy</span>
              <p className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5 truncate">
                {formatCurrency(staffStats.totalCost)}
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <span className="text-[11px] text-slate-400 font-medium">Số lượt chấm công</span>
              <p className="text-base sm:text-lg font-bold text-sky-300 mt-0.5">
                {staffStats.totalDaysCount}{' '}
                <span className="text-xs font-normal text-slate-300">Buổi/Ngày</span>
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
              <span className="text-[11px] text-slate-400 font-medium">Công trình tham gia</span>
              <p className="text-base sm:text-lg font-bold text-indigo-300 mt-0.5">
                {staffStats.uniqueProjects}{' '}
                <span className="text-xs font-normal text-slate-300">Dự án</span>
              </p>
            </div>
          </div>
        </div>

        {/* Action / Edit / Add Sub-panel */}
        {(isAddMode || editingRecord) && (
          <div className="p-4 bg-blue-50/80 border-b border-blue-200 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <h3 className="text-xs sm:text-sm font-bold text-blue-950 uppercase tracking-tight">
                  {editingRecord
                    ? `Chỉnh sửa ngày công: ${formatDateDisplay(editingRecord.date)}`
                    : `Chấm công bổ sung cho: ${staffMember.name}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingRecord(null);
                  setIsAddMode(false);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>

            <form
              onSubmit={editingRecord ? handleSaveEditRecord : handleSaveAddRecord}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {/* Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Ngày làm việc
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl outline-none focus:border-blue-600"
                  />
                </div>

                {/* Project */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Công trình thi công
                  </label>
                  <select
                    value={formProject}
                    onChange={(e) => setFormProject(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl outline-none focus:border-blue-600"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.name}>
                        [{p.code}] {p.name}
                      </option>
                    ))}
                    {!projects.some((p) => p.name === formProject) && formProject && (
                      <option value={formProject}>{formProject}</option>
                    )}
                  </select>
                </div>

                {/* Shift / Workdays */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Buổi & Số công
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setFormSession('full');
                        setFormWorkdays(1.0);
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        formWorkdays === 1.0
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Cả ngày (1.0)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormSession('morning');
                        setFormWorkdays(0.5);
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        formWorkdays === 0.5
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      Nửa ngày (0.5)
                    </button>
                  </div>
                </div>

                {/* Daily wage override */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mức lương ngày áp dụng
                  </label>
                  <input
                    type="number"
                    step="10000"
                    min="0"
                    value={formDailyWage}
                    onChange={(e) => setFormDailyWage(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-bold text-emerald-800 bg-white border border-slate-300 rounded-xl outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Notes & Summary */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <input
                  type="text"
                  placeholder="Ghi chú công việc (Ví dụ: Khò màng tầng hầm B2...)"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full sm:flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-blue-600"
                />

                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    Thành tiền:{' '}
                    <strong className="text-emerald-700 text-sm">
                      {formatCurrency(formWorkdays * formDailyWage)}
                    </strong>
                  </span>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? 'Đang lưu...' : 'Lưu bản ghi'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Filter and Search Toolbar */}
        <div className="p-3 sm:px-5 sm:py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm công trình, ghi chú..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-600"
              />
            </div>

            {/* Filter Project */}
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-slate-700 cursor-pointer"
            >
              <option value="all">Tất cả công trình</option>
              {projects.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Filter Month */}
            {availableMonths.length > 0 && (
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-slate-700 cursor-pointer"
              >
                <option value="all">Tất cả các tháng</option>
                {availableMonths.map((m) => {
                  const [y, mm] = m.split('-');
                  return (
                    <option key={m} value={m}>
                      Tháng {mm}/{y}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Add Attendance Button for mobile */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="sm:hidden inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Chấm công</span>
          </button>
        </div>

        {/* Detailed Attendance Records List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2.5">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <History className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs sm:text-sm font-semibold text-slate-600">
                Chưa có dữ liệu chấm công cho nhân sự này
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Nhấn nút <strong>"+ Chấm công thêm"</strong> để ghi nhận ngày công hoặc thực hiện chấm công từ bảng điều khiển.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              {filteredRecords.map((rec, idx) => {
                const dayName = getDayOfWeekName(rec.date);
                const isHalfDay = rec.workdays === 0.5;

                return (
                  <div
                    key={`${rec.logId}_${idx}`}
                    className="p-3.5 sm:p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    {/* Left: Date & Project Details */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex flex-col items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-[9px] font-bold text-slate-600 mt-0.5">
                          {dayName.replace('Thứ ', 'T').replace('Chủ Nhật', 'CN')}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            {formatDateDisplay(rec.date)}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">({dayName})</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isHalfDay
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {rec.workdays} Công ({isHalfDay ? 'Nửa ngày' : 'Cả ngày'})
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600">
                          <div className="flex items-center gap-1 font-semibold text-slate-800">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            <span className="truncate max-w-[250px]">{rec.projectName}</span>
                          </div>
                          {rec.notes && (
                            <span className="text-slate-400 text-[11px] truncate max-w-[300px]">
                              • Ghi chú: {rec.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Cost & Action Buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <p className="text-xs sm:text-sm font-bold text-emerald-700">
                          {formatCurrency(rec.cost)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatCurrency(rec.dailyWage)}/ngày
                        </p>
                      </div>

                      {/* Action buttons (Sửa & Xóa) */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(rec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                          title="Sửa chi tiết ngày công này"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(rec)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          title="Xóa bản ghi ngày công này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Hiển thị <strong>{filteredRecords.length}</strong> bản ghi chấm công
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
