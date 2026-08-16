import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Users,
  Calendar,
  Plus,
  Check,
  Building2,
  Filter,
  PlusCircle,
  Clock,
  History,
  FileText,
  UserCheck,
  ChevronRight,
  Briefcase,
} from 'lucide-react';
import { LaborDailyLog, ConstructionProject, StaffMember, LaborWorkerDetail } from '../types';

interface LaborDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  laborLogs: LaborDailyLog[];
  onAddLaborLog: (log: LaborDailyLog) => void;
  projects?: ConstructionProject[];
  initialProjectName?: string;
  staff?: StaffMember[];
  onAddStaff?: (staff: StaffMember) => void;
}

export const LaborDetailModal: React.FC<LaborDetailModalProps> = ({
  isOpen,
  onClose,
  laborLogs,
  onAddLaborLog,
  projects = [],
  initialProjectName,
  staff = [],
  onAddStaff,
}) => {
  // Active view tab: 'form' (Chấm công mới) or 'history' (Nhật ký chấm công)
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  // Today helpers
  const getTodayIso = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

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

  // Form states
  const [dateIso, setDateIso] = useState<string>(getTodayIso);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [notes, setNotes] = useState('');

  // Shift sessions: morning (0.5), afternoon (0.5)
  const [sessionMorning, setSessionMorning] = useState(true);
  const [sessionAfternoon, setSessionAfternoon] = useState(true);

  // Selected worker IDs
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);

  // Temporary / custom external workers added on the fly
  const [customWorkers, setCustomWorkers] = useState<StaffMember[]>([]);
  const [showAddCustomWorker, setShowAddCustomWorker] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState('Thợ chính');
  const [customWage, setCustomWage] = useState(400000);
  const [saveToStaffBook, setSaveToStaffBook] = useState(false);

  // Combine default staff and custom added workers
  const allAvailableWorkers: StaffMember[] = useMemo(() => {
    const defaultList: StaffMember[] =
      staff.length > 0
        ? staff
        : [
            { id: 'st_1', name: 'Lê Đình Đạo', role: 'Thợ chính', phone: '0912345678', dailyWage: 400000, status: 'active' },
            { id: 'st_2', name: 'Thợ Của Linh', role: 'Thợ chính', phone: '0987654321', dailyWage: 500000, status: 'active' },
            { id: 'st_3', name: 'Nguyễn Tú Linh', role: 'Thợ chính', phone: '0903112233', dailyWage: 600000, status: 'active' },
            { id: 'st_4', name: 'Hoàng Văn Hải', role: 'Thợ phụ', phone: '0977889900', dailyWage: 300000, status: 'active' },
            { id: 'st_5', name: 'Trần Văn Nam', role: 'Thợ chính', phone: '0933445566', dailyWage: 450000, status: 'active' },
          ];

    // Merge custom workers if any
    return [...defaultList, ...customWorkers];
  }, [staff, customWorkers]);

  // Reset or initialize state when opening modal
  useEffect(() => {
    if (isOpen) {
      setDateIso(getTodayIso());
      setActiveTab('form');
      setShowAddCustomWorker(false);
      setCustomName('');
      setNotes('');
      setSessionMorning(true);
      setSessionAfternoon(true);

      if (initialProjectName) {
        setSelectedProject(initialProjectName);
        setFilterProject(initialProjectName);
      } else {
        setSelectedProject(projects.length > 0 ? projects[0].name : '');
        setFilterProject('all');
      }

      // Default select all active workers
      if (allAvailableWorkers.length > 0) {
        setSelectedWorkerIds(allAvailableWorkers.map((w) => w.id));
      }
    }
  }, [isOpen, initialProjectName, projects]);

  if (!isOpen) return null;

  // Toggle worker selection
  const toggleWorker = (id: string) => {
    setSelectedWorkerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all or deselect all
  const handleSelectAll = () => {
    if (selectedWorkerIds.length === allAvailableWorkers.length) {
      setSelectedWorkerIds([]);
    } else {
      setSelectedWorkerIds(allAvailableWorkers.map((w) => w.id));
    }
  };

  // Calculate workdays per person (0, 0.5, 1.0)
  const workPerPerson = (sessionMorning ? 0.5 : 0) + (sessionAfternoon ? 0.5 : 0);

  // Selected workers objects
  const selectedWorkers = allAvailableWorkers.filter((w) =>
    selectedWorkerIds.includes(w.id)
  );

  // Count main and helper workers
  const mainWorkersCount = selectedWorkers.filter((w) =>
    (w.role || '').toLowerCase().includes('chính') || (w.role || '').toLowerCase().includes('kỹ sư')
  ).length;

  const helperWorkersCount = selectedWorkers.length - mainWorkersCount;

  // Total workdays
  const totalWorkdaysAll = Number((selectedWorkers.length * workPerPerson).toFixed(1));

  // Total cost calculation
  const totalCalculatedCost = selectedWorkers.reduce((sum, w) => {
    const wage = w.dailyWage && w.dailyWage > 0 ? w.dailyWage : w.role?.includes('phụ') ? 300000 : 400000;
    return sum + wage * workPerPerson;
  }, 0);

  // Format currency
  const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN').format(v);

  // Handle quick adding worker outside list
  const handleAddCustomWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newWorkerId = `st_temp_${Date.now()}`;
    const newWorker: StaffMember = {
      id: newWorkerId,
      name: customName.trim(),
      role: customRole,
      phone: '',
      dailyWage: Number(customWage) || 400000,
      status: 'active',
    };

    setCustomWorkers((prev) => [...prev, newWorker]);
    setSelectedWorkerIds((prev) => [...prev, newWorkerId]);

    // Save permanently to database if requested
    if (saveToStaffBook && onAddStaff) {
      onAddStaff(newWorker);
    }

    setCustomName('');
    setShowAddCustomWorker(false);
  };

  // Submit attendance log to database
  const handleSubmitAttendance = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedWorkers.length === 0) {
      alert('Vui lòng chọn ít nhất 1 lao động để chấm công!');
      return;
    }

    if (workPerPerson === 0) {
      alert('Vui lòng chọn ít nhất 1 buổi làm việc (Sáng hoặc Chiều)!');
      return;
    }

    // Convert dateIso to DD/MM and Day of Week
    let dateStr = getTodayFormatted();
    let dayOfWeekStr = getTodayDayOfWeek();

    try {
      const parts = dateIso.split('-');
      if (parts.length === 3) {
        dateStr = `${parts[2]}/${parts[1]}`;
        const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        dayOfWeekStr = days[dObj.getDay()] || 'T2';
      }
    } catch {
      // fallback
    }

    // Find project code
    const targetProjectObj = projects.find((p) => p.name === selectedProject);

    const workerDetailsList: LaborWorkerDetail[] = selectedWorkers.map((w) => {
      const wage = w.dailyWage && w.dailyWage > 0 ? w.dailyWage : w.role?.includes('phụ') ? 300000 : 400000;
      return {
        name: w.name,
        role: w.role || 'Thợ thi công',
        dailyWage: wage,
        workdays: workPerPerson,
        cost: wage * workPerPerson,
      };
    });

    const sessionType: 'morning' | 'afternoon' | 'full' =
      sessionMorning && sessionAfternoon ? 'full' : sessionMorning ? 'morning' : 'afternoon';

    const newLog: LaborDailyLog = {
      id: `log_${Date.now()}`,
      date: dateStr,
      dayOfWeek: dayOfWeekStr,
      mainWorkers: mainWorkersCount,
      helperWorkers: helperWorkersCount,
      totalWorkdays: totalWorkdaysAll,
      totalCost: totalCalculatedCost,
      notes: notes || `Chấm công ${selectedWorkers.length} người (${sessionMorning ? 'Sáng' : ''} ${sessionAfternoon ? 'Chiều' : ''})`,
      projectName: selectedProject || undefined,
      projectCode: targetProjectObj?.code || undefined,
      session: sessionType,
      workerNames: selectedWorkers.map((w) => w.name),
      workerDetails: workerDetailsList,
    };

    onAddLaborLog(newLog);
    onClose();
  };

  // Filter logs for history tab
  const displayedLogs = laborLogs.filter((log) => {
    if (filterProject === 'all') return true;
    return log.projectName === filterProject;
  });

  const selectedProjectObj = projects.find((p) => p.name === selectedProject);

  return (
    <div
      id="labor-attendance-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-5 pt-5 pb-3 bg-white border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold text-emerald-800 tracking-tight flex items-center gap-2">
                <span>Chấm Công Lao Động</span>
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'form' ? 'history' : 'form')}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                title="Chuyển đổi giữa Chấm công & Xem nhật ký"
              >
                {activeTab === 'form' ? (
                  <>
                    <History className="w-3.5 h-3.5" />
                    <span>Lịch sử ({laborLogs.length})</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Chấm công</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Project indicator / selector */}
          <div className="mt-2.5">
            {initialProjectName ? (
              <div className="flex items-center gap-2 py-1 px-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
                <Building2 className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                <span className="text-xs font-bold text-emerald-900 truncate">
                  {selectedProjectObj ? `[${selectedProjectObj.code}] ${selectedProjectObj.name}` : initialProjectName}
                </span>
              </div>
            ) : projects.length > 0 ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer truncate"
                  >
                    <option value="">-- Chọn công trình thi công --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.name}>
                        [{p.code}] {p.name} - {p.partner || 'CĐT'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Tab 1: Form Chấm Công (Mobile & Responsive layout as in image) */}
        {activeTab === 'form' ? (
          <form onSubmit={handleSubmitAttendance} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Section 1: Chọn lao động */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    Chọn lao động ({selectedWorkers.length}/{allAvailableWorkers.length}):
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    {selectedWorkers.length === allAvailableWorkers.length
                      ? 'Bỏ chọn tất cả'
                      : 'Chọn tất cả'}
                  </button>
                </div>

                {/* Worker List Cards */}
                <div className="space-y-2 max-h-56 sm:max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                  {allAvailableWorkers.map((worker) => {
                    const isSelected = selectedWorkerIds.includes(worker.id);
                    const wage =
                      worker.dailyWage && worker.dailyWage > 0
                        ? worker.dailyWage
                        : worker.role?.includes('phụ')
                        ? 300000
                        : 400000;

                    return (
                      <div
                        key={worker.id}
                        onClick={() => toggleWorker(worker.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 select-none ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-300 shadow-2xs'
                            : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {/* Custom Square Checkbox */}
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                            isSelected
                              ? 'bg-emerald-700 text-white'
                              : 'border-2 border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>

                        {/* Worker Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {worker.name}
                          </p>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {worker.role || 'Thợ chính'} • {formatCurrency(wage)} VNĐ/ngày
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Button: + Nhập thợ ngoài danh sách */}
                {!showAddCustomWorker ? (
                  <div className="mt-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => setShowAddCustomWorker(true)}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer py-1.5 px-3 rounded-xl hover:bg-emerald-50 transition-colors"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>+ Nhập thợ ngoài danh sách</span>
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900">
                        Thêm nhân công ngoài danh sách
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddCustomWorker(false)}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Họ và tên thợ..."
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="px-3 py-1.5 text-xs border border-slate-200 bg-white rounded-xl outline-none focus:border-emerald-500 font-medium"
                      />
                      <select
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        className="px-2.5 py-1.5 text-xs border border-slate-200 bg-white rounded-xl outline-none focus:border-emerald-500 font-medium"
                      >
                        <option value="Thợ chính">Thợ chính</option>
                        <option value="Thợ phụ">Thợ phụ</option>
                        <option value="Kỹ thuật / Giám sát">Kỹ thuật</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Lương ngày (VNĐ)"
                        value={customWage}
                        onChange={(e) => setCustomWage(Number(e.target.value))}
                        className="px-3 py-1.5 text-xs border border-slate-200 bg-white rounded-xl outline-none focus:border-emerald-500 font-medium text-emerald-700"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={saveToStaffBook}
                          onChange={(e) => setSaveToStaffBook(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Lưu vào danh bạ nhân sự lâu dài</span>
                      </label>

                      <button
                        type="button"
                        onClick={handleAddCustomWorkerSubmit}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Thêm vào danh sách
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Tích chọn buổi làm việc */}
              <div className="pt-1">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-2">
                  Tích chọn buổi làm việc (mỗi buổi 0.5 công):
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Sáng */}
                  <div
                    onClick={() => setSessionMorning(!sessionMorning)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 select-none ${
                      sessionMorning
                        ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                        sessionMorning
                          ? 'bg-emerald-700 text-white'
                          : 'border-2 border-slate-300 bg-white'
                      }`}
                    >
                      {sessionMorning && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Sáng</p>
                      <p className="text-xs text-slate-500 font-medium">0.5 công</p>
                    </div>
                  </div>

                  {/* Chiều */}
                  <div
                    onClick={() => setSessionAfternoon(!sessionAfternoon)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 select-none ${
                      sessionAfternoon
                        ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                        sessionAfternoon
                          ? 'bg-emerald-700 text-white'
                          : 'border-2 border-slate-300 bg-white'
                      }`}
                    >
                      {sessionAfternoon && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Chiều</p>
                      <p className="text-xs text-slate-500 font-medium">0.5 công</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Tổng cộng Box */}
              <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-emerald-950">
                    Tổng cộng ({selectedWorkers.length} lao động):
                  </p>
                  <p className="text-xs text-emerald-700 font-medium mt-0.5">
                    Tổng: <strong>{totalWorkdaysAll} Công</strong> • {formatCurrency(totalCalculatedCost)} VNĐ
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm sm:text-base font-extrabold text-emerald-900">
                    {workPerPerson.toFixed(1)} công /
                  </p>
                  <p className="text-xs font-bold text-emerald-700">người</p>
                </div>
              </div>

              {/* Section 4: Ngày chấm công & Ghi chú */}
              <div className="space-y-2.5">
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Ngày chấm công
                  </label>
                  <input
                    type="date"
                    value={dateIso}
                    onChange={(e) => setDateIso(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer"
                  />
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Hạng mục / Ghi chú (VD: Quét lót chống thấm sàn mái...)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex items-center justify-between gap-4 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer tracking-wider uppercase"
              >
                HỦY
              </button>

              <button
                type="submit"
                disabled={selectedWorkers.length === 0 || workPerPerson === 0}
                className="flex-1 py-3.5 px-6 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white rounded-2xl sm:rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-wide transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
              >
                CHẤM CÔNG ({selectedWorkers.length} NGƯỜI)
              </button>
            </div>
          </form>
        ) : (
          /* Tab 2: Lịch sử & Nhật ký chấm công */
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Nhật ký chấm công ({displayedLogs.length} ngày)
              </span>

              {projects.length > 0 && (
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl px-2.5 py-1 text-xs text-slate-600">
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

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100">
              {displayedLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Users className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold">Chưa có nhật ký chấm công nào.</p>
                </div>
              ) : (
                displayedLogs.map((row, idx) => (
                  <div key={idx} className="p-3.5 hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {row.date} ({row.dayOfWeek})
                          </span>
                          {row.projectName && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                              {row.projectName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {row.mainWorkers} Thợ chính • {row.helperWorkers} Thợ phụ • {row.notes}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-extrabold text-blue-700">
                          {row.totalWorkdays} Công
                        </p>
                        <p className="text-[11px] font-bold text-rose-600 mt-0.5">
                          {formatCurrency(row.totalCost)} đ
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                + Chấm công ngày mới
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
