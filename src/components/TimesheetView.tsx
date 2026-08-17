import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CalendarDays,
  Users,
  Banknote,
  Building2,
  Download,
  Printer,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  HardHat,
  FileSpreadsheet,
  Layers,
  ArrowUpDown,
  UserCheck,
  BarChart3,
  Eye,
  Info,
  Clock,
  Briefcase,
  SlidersHorizontal,
  X,
  Lock,
} from 'lucide-react';
import { ConstructionProject, LaborDailyLog, StaffMember, CompanySettings, UserAccount, hasUserPermission } from '../types';

interface TimesheetViewProps {
  staff: StaffMember[];
  laborLogs: LaborDailyLog[];
  projects?: ConstructionProject[];
  companySettings?: CompanySettings;
  currentUser?: UserAccount | null;
  onOpenStaffDetail?: (staffMember: StaffMember) => void;
  onOpenNewLaborLog?: () => void;
}

export interface DayAttendanceDetail {
  workdays: number;
  cost: number;
  projects: string[];
  sessions: string[];
  notes: string[];
}

export interface WorkerMonthlySummary {
  staffId: string;
  name: string;
  role: string;
  phone: string;
  dailyWage: number;
  status: string;
  isRegisteredStaff: boolean;
  dailyMap: { [day: number]: DayAttendanceDetail };
  totalWorkdays: number;
  totalCost: number;
  daysPresentCount: number;
  projectsWorked: string[];
}

export const TimesheetView: React.FC<TimesheetViewProps> = ({
  staff,
  laborLogs = [],
  projects = [],
  companySettings,
  currentUser,
  onOpenStaffDetail,
  onOpenNewLaborLog,
}) => {
  const canExportExcel = hasUserPermission(currentUser, 'canExportExcel');

  // Current chosen Year and Month (default to current month)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1; // 1-12

  // Format month string YYYY-MM
  const formatMonthStr = (y: number, m: number) => `${y}-${String(m).padStart(2, '0')}`;

  const [selectedMonthStr, setSelectedMonthStr] = useState<string>(
    formatMonthStr(currentYear, currentMonthNum)
  );
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'matrix' | 'summary'>('matrix');
  const [hoveredDayCell, setHoveredDayCell] = useState<{ workerName: string; day: number; detail: DayAttendanceDetail } | null>(null);

  // Parse current year and month from selectedMonthStr
  const { year, month } = useMemo(() => {
    const parts = selectedMonthStr.split('-');
    const y = parseInt(parts[0], 10) || currentYear;
    const m = parseInt(parts[1], 10) || currentMonthNum;
    return { year: y, month: m };
  }, [selectedMonthStr, currentYear, currentMonthNum]);

  // Calculate number of days in the selected month
  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  // List of all distinct months found in laborLogs for quick dropdown selection
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    // Always include current month and last month
    set.add(formatMonthStr(currentYear, currentMonthNum));
    const prevMonth = currentMonthNum === 1 ? 12 : currentMonthNum - 1;
    const prevYear = currentMonthNum === 1 ? currentYear - 1 : currentYear;
    set.add(formatMonthStr(prevYear, prevMonth));

    laborLogs.forEach((log) => {
      if (log.date && log.date.length >= 7) {
        set.add(log.date.substring(0, 7));
      }
    });

    return Array.from(set).sort().reverse();
  }, [laborLogs, currentYear, currentMonthNum]);

  // Navigate months
  const handlePrevMonth = () => {
    let prevM = month - 1;
    let prevY = year;
    if (prevM < 1) {
      prevM = 12;
      prevY -= 1;
    }
    setSelectedMonthStr(formatMonthStr(prevY, prevM));
  };

  const handleNextMonth = () => {
    let nextM = month + 1;
    let nextY = year;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    setSelectedMonthStr(formatMonthStr(nextY, nextM));
  };

  // Day of week helper for header
  const getDayInfo = (dayNum: number) => {
    const d = new Date(year, month - 1, dayNum);
    const dayOfWeek = d.getDay(); // 0 is CN (Sunday), 6 is T7 (Saturday)
    const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isSunday = dayOfWeek === 0;
    return {
      label: dayLabels[dayOfWeek],
      isWeekend,
      isSunday,
      dateFormatted: `${String(dayNum).padStart(2, '0')}/${String(month).padStart(2, '0')}`,
    };
  };

  // Format currency VNĐ
  const formatCurrency = (val?: number) => {
    if (val === undefined || isNaN(val)) return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
  };

  // Process and Aggregate Attendance Data for the Selected Month and Project
  const monthlyData = useMemo(() => {
    // 1. Gather all logs that match the selected month (YYYY-MM) and optional project filter
    const logsInMonth = laborLogs.filter((log) => {
      if (!log.date || !log.date.startsWith(selectedMonthStr)) return false;
      if (selectedProject !== 'all') {
        const logProj = (log.projectName || '').trim().toLowerCase();
        const targetProj = selectedProject.trim().toLowerCase();
        if (logProj !== targetProj) return false;
      }
      return true;
    });

    // 2. Map of worker names/IDs -> WorkerMonthlySummary
    const workerMap = new Map<string, WorkerMonthlySummary>();

    // Seed registered staff members first
    staff.forEach((s) => {
      const key = s.name.trim().toLowerCase();
      workerMap.set(key, {
        staffId: s.id,
        name: s.name.trim(),
        role: s.role || 'Thợ thi công',
        phone: s.phone || '',
        dailyWage: s.dailyWage || 450000,
        status: s.status || 'Sẵn sàng',
        isRegisteredStaff: true,
        dailyMap: {},
        totalWorkdays: 0,
        totalCost: 0,
        daysPresentCount: 0,
        projectsWorked: [],
      });
    });

    // Process logs
    logsInMonth.forEach((log) => {
      const logDateParts = log.date.split('-');
      const logDay = parseInt(logDateParts[2], 10);
      if (isNaN(logDay) || logDay < 1 || logDay > 31) return;

      const logProjName = log.projectName || 'Công trình chung';

      // Case A: Detailed worker array in workerDetails
      if (log.workerDetails && Array.isArray(log.workerDetails) && log.workerDetails.length > 0) {
        log.workerDetails.forEach((wd) => {
          if (!wd.name || !wd.name.trim()) return;
          const wKey = wd.name.trim().toLowerCase();
          let summary = workerMap.get(wKey);

          if (!summary) {
            // Unregistered worker who was logged
            summary = {
              staffId: `temp_${wKey}`,
              name: wd.name.trim(),
              role: wd.role || 'Thợ thi công',
              phone: '',
              dailyWage: wd.dailyWage || 450000,
              status: 'Theo ca công nhật',
              isRegisteredStaff: false,
              dailyMap: {},
              totalWorkdays: 0,
              totalCost: 0,
              daysPresentCount: 0,
              projectsWorked: [],
            };
            workerMap.set(wKey, summary);
          }

          const workdays = wd.workdays !== undefined ? wd.workdays : 1.0;
          const wage = wd.dailyWage || summary.dailyWage || 450000;
          const cost = wd.cost !== undefined ? wd.cost : workdays * wage;

          if (!summary.dailyMap[logDay]) {
            summary.dailyMap[logDay] = {
              workdays: 0,
              cost: 0,
              projects: [],
              sessions: [],
              notes: [],
            };
          }

          summary.dailyMap[logDay].workdays += workdays;
          summary.dailyMap[logDay].cost += cost;
          if (!summary.dailyMap[logDay].projects.includes(logProjName)) {
            summary.dailyMap[logDay].projects.push(logProjName);
          }
          if (log.session && !summary.dailyMap[logDay].sessions.includes(log.session)) {
            summary.dailyMap[logDay].sessions.push(log.session);
          }
          if (log.notes && !summary.dailyMap[logDay].notes.includes(log.notes)) {
            summary.dailyMap[logDay].notes.push(log.notes);
          }

          if (!summary.projectsWorked.includes(logProjName)) {
            summary.projectsWorked.push(logProjName);
          }
        });
      } else if (log.workerNames && Array.isArray(log.workerNames) && log.workerNames.length > 0) {
        // Case B: Simple workerNames array
        const count = log.workerNames.length;
        const avgWorkdays = log.totalWorkdays ? log.totalWorkdays / count : 1.0;

        log.workerNames.forEach((wName) => {
          if (!wName || !wName.trim()) return;
          const wKey = wName.trim().toLowerCase();
          let summary = workerMap.get(wKey);

          if (!summary) {
            summary = {
              staffId: `temp_${wKey}`,
              name: wName.trim(),
              role: 'Thợ thi công',
              phone: '',
              dailyWage: 450000,
              status: 'Theo ca công nhật',
              isRegisteredStaff: false,
              dailyMap: {},
              totalWorkdays: 0,
              totalCost: 0,
              daysPresentCount: 0,
              projectsWorked: [],
            };
            workerMap.set(wKey, summary);
          }

          const wage = summary.dailyWage || 450000;
          const cost = log.totalCost ? log.totalCost / count : avgWorkdays * wage;

          if (!summary.dailyMap[logDay]) {
            summary.dailyMap[logDay] = {
              workdays: 0,
              cost: 0,
              projects: [],
              sessions: [],
              notes: [],
            };
          }

          summary.dailyMap[logDay].workdays += avgWorkdays;
          summary.dailyMap[logDay].cost += cost;
          if (!summary.dailyMap[logDay].projects.includes(logProjName)) {
            summary.dailyMap[logDay].projects.push(logProjName);
          }
          if (log.session && !summary.dailyMap[logDay].sessions.includes(log.session)) {
            summary.dailyMap[logDay].sessions.push(log.session);
          }
          if (log.notes && !summary.dailyMap[logDay].notes.includes(log.notes)) {
            summary.dailyMap[logDay].notes.push(log.notes);
          }

          if (!summary.projectsWorked.includes(logProjName)) {
            summary.projectsWorked.push(logProjName);
          }
        });
      }
    });

    // Compute totals per worker
    const list: WorkerMonthlySummary[] = [];
    workerMap.forEach((summary) => {
      let totalW = 0;
      let totalC = 0;
      let daysCount = 0;

      Object.keys(summary.dailyMap).forEach((dayStr) => {
        const dNum = parseInt(dayStr, 10);
        const dayDet = summary.dailyMap[dNum];
        if (dayDet && dayDet.workdays > 0) {
          totalW += dayDet.workdays;
          totalC += dayDet.cost;
          daysCount += 1;
        }
      });

      summary.totalWorkdays = Math.round(totalW * 10) / 10;
      summary.totalCost = totalC;
      summary.daysPresentCount = daysCount;

      list.push(summary);
    });

    // Sort: workers with active attendance in month first (highest workdays first), then alphabetically
    list.sort((a, b) => {
      if (b.totalWorkdays !== a.totalWorkdays) {
        return b.totalWorkdays - a.totalWorkdays;
      }
      return a.name.localeCompare(b.name, 'vi');
    });

    return {
      workers: list,
      logsInMonth,
    };
  }, [selectedMonthStr, selectedProject, laborLogs, staff]);

  // Filtered workers by search query
  const filteredWorkers = useMemo(() => {
    return monthlyData.workers.filter((w) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        w.name.toLowerCase().includes(q) ||
        w.role.toLowerCase().includes(q) ||
        w.phone.includes(q) ||
        w.projectsWorked.some((p) => p.toLowerCase().includes(q))
      );
    });
  }, [monthlyData.workers, searchQuery]);

  // High level KPIs for the current month
  const monthlyKPIs = useMemo(() => {
    const activeWorkers = monthlyData.workers.filter((w) => w.totalWorkdays > 0);
    const totalDaysLogged = activeWorkers.reduce((sum, w) => sum + w.totalWorkdays, 0);
    const totalPayroll = activeWorkers.reduce((sum, w) => sum + w.totalCost, 0);

    // Find project with highest workdays
    const projMap: { [p: string]: number } = {};
    monthlyData.logsInMonth.forEach((log) => {
      const pName = log.projectName || 'Công trình chung';
      projMap[pName] = (projMap[pName] || 0) + (log.totalWorkdays || 1);
    });

    let topProjectName = 'Chưa có dự án';
    let topProjectWorkdays = 0;
    Object.entries(projMap).forEach(([p, w]) => {
      if (w > topProjectWorkdays) {
        topProjectWorkdays = w;
        topProjectName = p;
      }
    });

    return {
      activeWorkersCount: activeWorkers.length,
      totalStaffCount: monthlyData.workers.length,
      totalDaysLogged: Math.round(totalDaysLogged * 10) / 10,
      totalPayroll,
      topProjectName,
      topProjectWorkdays: Math.round(topProjectWorkdays * 10) / 10,
    };
  }, [monthlyData]);

  // Export Timesheet to CSV / Excel format
  const handleExportCSV = () => {
    const monthTitle = `BẢNG CHẤM CÔNG THÁNG ${month}-${year}`;
    const headers = ['STT', 'Mã / Tên Nhân Sự', 'Chức Vụ', 'Đơn Giá Ngày (VNĐ)'];

    // Add days columns 1..daysInMonth
    for (let d = 1; d <= daysInMonth; d++) {
      headers.push(`Ngày ${d}`);
    }
    headers.push('Tổng Số Công', 'Tổng Tiền Lương (VNĐ)', 'Công Trình Đã Tham Gia');

    const rows: string[][] = [];
    filteredWorkers.forEach((w, idx) => {
      const row: string[] = [
        String(idx + 1),
        `"${w.name}"`,
        `"${w.role}"`,
        String(w.dailyWage),
      ];

      for (let d = 1; d <= daysInMonth; d++) {
        const dayData = w.dailyMap[d];
        row.push(dayData && dayData.workdays > 0 ? String(dayData.workdays) : '');
      }

      row.push(
        String(w.totalWorkdays),
        String(w.totalCost),
        `"${w.projectsWorked.join(', ')}"`
      );
      rows.push(row);
    });

    const csvContent =
      '\uFEFF' + // UTF-8 BOM for Excel Vietnamese display
      `"${companySettings?.brandName || companySettings?.orgName || 'CÔNG TY TRƯỜNG SƠN 36'}"\n` +
      `"${monthTitle}"\n` +
      `"Dự án / Chi nhánh: ${selectedProject === 'all' ? 'Tất cả công trình' : selectedProject}"\n\n` +
      headers.join(',') +
      '\n' +
      rows.map((r) => r.join(',')).join('\n') +
      `\n\n"TỔNG CỘNG",,,,"Tổng công: ${monthlyKPIs.totalDaysLogged}","Tổng lương: ${monthlyKPIs.totalPayroll} VNĐ"`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bang_Cham_Cong_Thang_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Timesheet
  const handlePrint = () => {
    window.print();
  };

  // Find corresponding registered StaffMember for modal opening
  const handleWorkerClick = (w: WorkerMonthlySummary) => {
    if (onOpenStaffDetail) {
      const registered = staff.find((s) => s.id === w.staffId || s.name.trim().toLowerCase() === w.name.trim().toLowerCase());
      if (registered) {
        onOpenStaffDetail(registered);
      } else {
        // Create temporary staff object for view
        onOpenStaffDetail({
          id: w.staffId,
          name: w.name,
          role: w.role,
          phone: w.phone,
          dailyWage: w.dailyWage,
          status: w.status,
        });
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Printable Header - hidden on screen, visible when printing */}
      <div className="hidden print:block text-center pb-4 border-b border-black">
        <h1 className="text-lg font-bold uppercase">{companySettings?.brandName || companySettings?.orgName || 'CÔNG TY TRƯỜNG SƠN 36'}</h1>
        <p className="text-xs">{companySettings?.address || 'Hà Nội'}</p>
        <h2 className="text-base font-bold uppercase mt-2">
          BẢNG TỔNG HỢP CHẤM CÔNG & THANH TOÁN TIỀN LƯƠNG NHÂN CÔNG
        </h2>
        <p className="text-xs italic">Tháng {month} năm {year} {selectedProject !== 'all' ? `• Công trình: ${selectedProject}` : ''}</p>
      </div>

      {/* Control & Filter Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Month Selector Bar & Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Month Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Tháng trước"
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg shadow-2xs text-xs font-bold text-slate-900">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-mono text-sm">Tháng {String(month).padStart(2, '0')}/{year}</span>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                title="Tháng sau"
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Month Dropdown */}
            <div className="relative">
              <select
                value={selectedMonthStr}
                onChange={(e) => setSelectedMonthStr(e.target.value)}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                {availableMonths.map((mStr) => {
                  const [y, m] = mStr.split('-');
                  return (
                    <option key={mStr} value={mStr}>
                      Tháng {m}/{y}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* View Mode Toggle (Matrix vs Summary) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 ml-auto sm:ml-2">
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'matrix'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Ma trận chấm công 1 -> 31 theo ngày"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ma Trận Ngày</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('summary')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'summary'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Bảng tổng hợp công & quỹ lương tháng"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tổng Hợp Lương</span>
              </button>
            </div>
          </div>

          {/* Quick Action Tools: Export, Print, Add Labor */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenNewLaborLog && (
              <button
                type="button"
                onClick={onOpenNewLaborLog}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
                title="Ghi nhận nhật ký chấm công ngày hôm nay"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Chấm công mới</span>
              </button>
            )}

            <button
              type="button"
              disabled={!canExportExcel}
              onClick={() => {
                if (!canExportExcel) return;
                handleExportCSV();
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors ${
                canExportExcel
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-70'
              }`}
              title={canExportExcel ? 'Tải bảng chấm công định dạng Excel (CSV UTF-8)' : 'Tài khoản chưa được cấp quyền xuất file Excel'}
            >
              <Download className={`w-3.5 h-3.5 ${canExportExcel ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Xuất Excel</span>
              {!canExportExcel && <Lock className="w-3 h-3 text-slate-400" />}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="In hoặc lưu PDF bảng chấm công"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>In bảng công</span>
            </button>
          </div>
        </div>

        {/* Search & Project Filter Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên thợ, chức vụ, số điện thoại, công trình..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-slate-800"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Project Filter */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-600 cursor-pointer min-w-[200px]"
            >
              <option value="all">Tất cả công trình ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.code ? `[${p.code}] ` : ''}{p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Overview Bar for Selected Month */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-slate-500 font-medium block truncate">Nhân sự đi làm tháng {month}</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 font-mono">{monthlyKPIs.activeWorkersCount}</span>
              <span className="text-xs text-slate-400 font-normal">/ {monthlyKPIs.totalStaffCount} người</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-slate-500 font-medium block truncate">Tổng ngày công toàn đội</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-emerald-600 font-mono">{monthlyKPIs.totalDaysLogged}</span>
              <span className="text-xs text-slate-400 font-normal">công</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Banknote className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-slate-500 font-medium block truncate">Tổng quỹ lương công nhật</span>
            <p className="text-lg font-bold text-indigo-700 font-mono mt-0.5 truncate">
              {formatCurrency(monthlyKPIs.totalPayroll)}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-slate-500 font-medium block truncate">Dự án thi công trọng điểm</span>
            <p className="text-xs font-bold text-slate-900 mt-0.5 truncate" title={monthlyKPIs.topProjectName}>
              {monthlyKPIs.topProjectName}
            </p>
            <span className="text-[10px] text-amber-700 font-mono font-semibold">
              {monthlyKPIs.topProjectWorkdays > 0 ? `${monthlyKPIs.topProjectWorkdays} công` : 'Chưa có công'}
            </span>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: MATRIX VIEW (Day 1..31 Grid) */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                <span>Bảng Ma Trận Chấm Công Theo Ngày - Tháng {month}/{year}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dữ liệu được tự động tổng hợp thời gian thực từ các nhật ký chấm công theo ngày
              </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-4 rounded bg-emerald-500 text-white font-bold text-[9px] flex items-center justify-center">1.0</span>
                <span>Cả ngày (1 công)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-4 rounded bg-amber-500 text-white font-bold text-[9px] flex items-center justify-center">0.5</span>
                <span>Nửa ca (0.5 công)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-4 rounded bg-purple-600 text-white font-bold text-[9px] flex items-center justify-center">1.5</span>
                <span>Tăng ca / Thêm giờ</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-5 h-4 rounded bg-slate-100 border border-slate-200 text-slate-400 text-[10px] flex items-center justify-center">-</span>
                <span>Nghỉ</span>
              </span>
            </div>
          </div>

          {/* Matrix Table Container with horizontal scrolling */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="sticky left-0 z-20 bg-slate-100 px-3 py-2.5 text-center w-10 border-r border-slate-200">
                    STT
                  </th>
                  <th className="sticky left-10 z-20 bg-slate-100 px-3.5 py-2.5 min-w-[160px] max-w-[200px] border-r border-slate-200 shadow-2xs">
                    Họ và Tên Nhân Sự
                  </th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap min-w-[95px] border-r border-slate-200 bg-slate-100">
                    Lương/Ngày
                  </th>

                  {/* Day Columns */}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dNum) => {
                    const dayInfo = getDayInfo(dNum);
                    return (
                      <th
                        key={dNum}
                        className={`px-1 py-1.5 text-center min-w-[34px] border-r border-slate-200/80 transition-colors ${
                          dayInfo.isSunday
                            ? 'bg-rose-50/80 text-rose-700 font-bold'
                            : dayInfo.isWeekend
                            ? 'bg-amber-50/60 text-amber-800 font-semibold'
                            : 'text-slate-700'
                        }`}
                      >
                        <div className="text-[11px] font-mono leading-none">{dNum}</div>
                        <div className="text-[9px] uppercase tracking-tight text-slate-400 mt-0.5 leading-none">
                          {dayInfo.label}
                        </div>
                      </th>
                    );
                  })}

                  {/* Summary Columns */}
                  <th className="sticky right-32 z-20 bg-blue-50/90 text-blue-900 px-3 py-2.5 text-center font-bold min-w-[70px] border-l border-r border-blue-200 shadow-2xs">
                    Tổng Công
                  </th>
                  <th className="sticky right-0 z-20 bg-indigo-50/90 text-indigo-900 px-3.5 py-2.5 text-right font-bold min-w-[110px] shadow-2xs">
                    Thành Tiền
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={daysInMonth + 5} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-slate-600">Không tìm thấy dữ liệu nhân sự nào trong tháng {month}/{year}</p>
                        <p className="text-xs text-slate-400">Thử thay đổi bộ lọc tìm kiếm hoặc ghi nhận thêm nhật ký chấm công</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker, index) => {
                    const hasAttendance = worker.totalWorkdays > 0;
                    return (
                      <tr
                        key={worker.staffId}
                        className={`hover:bg-blue-50/40 transition-colors ${
                          !hasAttendance ? 'opacity-60 bg-slate-50/30' : ''
                        }`}
                      >
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-blue-50 px-3 py-2 text-center text-slate-400 font-mono text-[11px] border-r border-slate-100">
                          {index + 1}
                        </td>
                        <td className="sticky left-10 z-10 bg-white group-hover:bg-blue-50 px-3.5 py-2 border-r border-slate-100 shadow-2xs">
                          <div className="flex items-center justify-between gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleWorkerClick(worker)}
                              className="font-bold text-slate-900 hover:text-blue-600 text-left truncate max-w-[130px] cursor-pointer"
                              title={`Xem chi tiết lịch sử chấm công của ${worker.name}`}
                            >
                              {worker.name}
                            </button>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-medium whitespace-nowrap flex-shrink-0">
                              {worker.role}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-[11px] text-slate-600 border-r border-slate-100">
                          {formatCurrency(worker.dailyWage)}
                        </td>

                        {/* 1..31 Day Cells */}
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dNum) => {
                          const dayInfo = getDayInfo(dNum);
                          const dayData = worker.dailyMap[dNum];
                          const hasWork = dayData && dayData.workdays > 0;

                          return (
                            <td
                              key={dNum}
                              onMouseEnter={() => {
                                if (hasWork) {
                                  setHoveredDayCell({
                                    workerName: worker.name,
                                    day: dNum,
                                    detail: dayData,
                                  });
                                }
                              }}
                              onMouseLeave={() => setHoveredDayCell(null)}
                              className={`px-0.5 py-1 text-center font-mono text-[11px] border-r border-slate-100 transition-colors relative ${
                                dayInfo.isSunday
                                  ? 'bg-rose-50/30'
                                  : dayInfo.isWeekend
                                  ? 'bg-amber-50/20'
                                  : ''
                              }`}
                            >
                              {hasWork ? (
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-[10px] shadow-2xs cursor-help ${
                                    dayData.workdays >= 1.5
                                      ? 'bg-purple-600 text-white'
                                      : dayData.workdays === 1.0
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-amber-500 text-white'
                                  }`}
                                  title={`Ngày ${dNum}/${month}: ${dayData.workdays} công\nCông trình: ${dayData.projects.join(', ')}\nThành tiền: ${formatCurrency(dayData.cost)}${dayData.notes.length ? '\nGhi chú: ' + dayData.notes.join('; ') : ''}`}
                                >
                                  {dayData.workdays}
                                </span>
                              ) : (
                                <span className="text-slate-300 select-none text-[10px]">-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* Summary for this worker */}
                        <td className="sticky right-32 z-10 bg-blue-50/90 px-3 py-2 text-center font-mono font-bold text-blue-900 border-l border-r border-blue-200 shadow-2xs">
                          {worker.totalWorkdays > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-900 font-bold">
                              {worker.totalWorkdays}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">0</span>
                          )}
                        </td>

                        <td className="sticky right-0 z-10 bg-indigo-50/90 px-3.5 py-2 text-right font-mono font-bold text-indigo-900 shadow-2xs">
                          {formatCurrency(worker.totalCost)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer with Totals */}
              {filteredWorkers.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-800 text-white font-bold text-xs border-t-2 border-slate-700">
                    <td colSpan={2} className="sticky left-0 z-20 bg-slate-800 px-3.5 py-3 text-left">
                      TỔNG CỘNG ({filteredWorkers.length} Nhân Sự)
                    </td>
                    <td className="px-3 py-3 text-right text-slate-300 font-mono text-[11px]">
                      -
                    </td>

                    {/* Daily Column Sums */}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dNum) => {
                      const daySum = filteredWorkers.reduce((acc, w) => {
                        const d = w.dailyMap[dNum];
                        return acc + (d ? d.workdays : 0);
                      }, 0);

                      return (
                        <td
                          key={dNum}
                          className="px-0.5 py-3 text-center font-mono text-[10px] text-slate-200"
                        >
                          {daySum > 0 ? Math.round(daySum * 10) / 10 : '-'}
                        </td>
                      );
                    })}

                    <td className="sticky right-32 z-20 bg-blue-900 text-white px-3 py-3 text-center font-mono text-sm font-bold shadow-2xs">
                      {monthlyKPIs.totalDaysLogged}
                    </td>

                    <td className="sticky right-0 z-20 bg-indigo-900 text-white px-3.5 py-3 text-right font-mono text-sm font-bold shadow-2xs whitespace-nowrap">
                      {formatCurrency(monthlyKPIs.totalPayroll)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: SUMMARY & PAYROLL DETAILED TABLE */}
      {viewMode === 'summary' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Bảng Tổng Hợp Công & Thanh Toán Lương - Tháng {month}/{year}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bảng thanh toán chi tiết tổng số ngày công và thành tiền tiền công của từng nhân sự
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-600">
              Tổng nhân sự: <strong className="text-slate-900">{filteredWorkers.length}</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="px-3.5 py-3 text-center w-12">STT</th>
                  <th className="px-4 py-3">Họ và Tên Nhân Sự</th>
                  <th className="px-3 py-3">Chức Vụ</th>
                  <th className="px-3.5 py-3 text-right">Lương/Ngày</th>
                  <th className="px-3.5 py-3 text-center">Số Ngày Đi Làm</th>
                  <th className="px-3.5 py-3 text-center">Tổng Số Ngày Công</th>
                  <th className="px-4 py-3 text-right">Tổng Tiền Lương (VNĐ)</th>
                  <th className="px-4 py-3">Công Trình Tham Gia</th>
                  <th className="px-3.5 py-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                      Không tìm thấy dữ liệu nhân sự nào trong tháng {month}/{year}
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker, idx) => (
                    <tr key={worker.staffId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{worker.name}</div>
                        {worker.phone && <div className="text-[11px] text-slate-400">{worker.phone}</div>}
                      </td>
                      <td className="px-3 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {worker.role}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-right font-mono text-[11px] text-slate-600">
                        {formatCurrency(worker.dailyWage)}
                      </td>
                      <td className="px-3.5 py-3 text-center font-mono text-slate-700">
                        <span className="font-semibold">{worker.daysPresentCount}</span> ngày
                      </td>
                      <td className="px-3.5 py-3 text-center font-mono">
                        {worker.totalWorkdays > 0 ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                            {worker.totalWorkdays} công
                          </span>
                        ) : (
                          <span className="text-slate-400">0 công</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700 text-sm">
                        {formatCurrency(worker.totalCost)}
                      </td>
                      <td className="px-4 py-3">
                        {worker.projectsWorked.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[240px]">
                            {worker.projectsWorked.map((p, pIdx) => (
                              <span
                                key={pIdx}
                                className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium truncate max-w-[200px]"
                                title={p}
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Chưa phát sinh</span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleWorkerClick(worker)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors cursor-pointer"
                          title="Xem chi tiết các ngày công của nhân sự này"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredWorkers.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold text-xs">
                    <td colSpan={4} className="px-4 py-3.5 text-left">
                      TỔNG CỘNG ({monthlyKPIs.activeWorkersCount} nhân sự đi làm)
                    </td>
                    <td className="px-3.5 py-3.5 text-center font-mono">
                      -
                    </td>
                    <td className="px-3.5 py-3.5 text-center font-mono text-emerald-400 text-sm">
                      {monthlyKPIs.totalDaysLogged} công
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-indigo-300 text-sm font-bold">
                      {formatCurrency(monthlyKPIs.totalPayroll)}
                    </td>
                    <td colSpan={2} className="px-4 py-3.5 text-slate-400 font-normal italic">
                      Đã đồng bộ Realtime Database
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Printable Signature Section */}
      <div className="hidden print:grid grid-cols-4 gap-6 pt-12 text-center text-xs">
        <div>
          <p className="font-bold">NGƯỜI LẬP BIỂU</p>
          <p className="italic text-[11px] text-slate-500 mt-0.5">(Ký, họ tên)</p>
          <div className="h-16"></div>
        </div>
        <div>
          <p className="font-bold">GIÁM SÁT / CHỈ HUY</p>
          <p className="italic text-[11px] text-slate-500 mt-0.5">(Ký, họ tên)</p>
          <div className="h-16"></div>
        </div>
        <div>
          <p className="font-bold">KẾ TOÁN THANH TOÁN</p>
          <p className="italic text-[11px] text-slate-500 mt-0.5">(Ký, họ tên)</p>
          <div className="h-16"></div>
        </div>
        <div>
          <p className="font-bold">GIÁM ĐỐC DUYỆT</p>
          <p className="italic text-[11px] text-slate-500 mt-0.5">(Ký, đóng dấu)</p>
          <div className="h-16"></div>
        </div>
      </div>
    </div>
  );
};
