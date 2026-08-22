import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  Package,
  Users,
  FolderKanban,
  Building2,
  Calendar,
  Download,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingUp,
  Briefcase,
  FileSpreadsheet,
  Printer,
  Layers,
  ArrowUpRight,
  HardHat,
  Receipt,
  PieChart as PieChartIcon,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  ConstructionProject,
  ExportedGood,
  LaborDailyLog,
  StaffMember,
  CompanySettings,
  UserAccount,
} from '../types';
import {
  exportComprehensiveReportToExcel,
  printComprehensiveReport,
  ReportSummaryData,
} from '../utils/reportExportUtils';
import { normalizeDateToDDMMYYYY } from '../utils/dateUtils';

type TimeFilterType = 'all' | 'this_month' | 'this_quarter' | 'this_year';
type ReportSubTab = 'projects' | 'materials' | 'labor' | 'financial';

interface ReportsViewProps {
  projects: ConstructionProject[];
  exportedGoods: ExportedGood[];
  laborLogs: LaborDailyLog[];
  staff: StaffMember[];
  companySettings?: CompanySettings;
  currentUser: UserAccount | null;
  onNavigateToProject?: (projectId: string) => void;
}

interface PaginationControlProps {
  idPrefix: string;
  currentPage: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  itemUnitName?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const PaginationControl: React.FC<PaginationControlProps> = ({
  idPrefix,
  currentPage,
  totalItems,
  pageSize,
  pageSizeOptions = [6, 10, 20, 50],
  itemUnitName = 'mục',
  onPageChange,
  onPageSizeChange,
}) => {
  if (totalItems <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const fromIndex = (safePage - 1) * pageSize + 1;
  const toIndex = Math.min(safePage * pageSize, totalItems);

  return (
    <div
      id={`${idPrefix}-pagination`}
      className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
    >
      {/* Info & Page Size Selector */}
      <div className="text-slate-600 flex flex-wrap items-center gap-2">
        <span>
          Hiển thị{' '}
          <strong className="text-slate-900 font-bold">{fromIndex}</strong>{' '}
          -{' '}
          <strong className="text-slate-900 font-bold">{toIndex}</strong>{' '}
          trên tổng số{' '}
          <strong className="text-blue-700 font-extrabold">{totalItems}</strong>{' '}
          {itemUnitName}
        </span>

        <div className="flex items-center gap-1 pl-2 sm:border-l border-slate-200 text-slate-500">
          <span>Hiển thị:</span>
          <select
            id={`${idPrefix}-page-size-select`}
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-bold text-xs outline-none focus:border-blue-600 cursor-pointer"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} {itemUnitName}/trang
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {/* First Page */}
        <button
          type="button"
          id={`${idPrefix}-page-first-btn`}
          disabled={safePage <= 1}
          onClick={() => onPageChange(1)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-colors"
          title="Trang đầu"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Prev Page */}
        <button
          type="button"
          id={`${idPrefix}-page-prev-btn`}
          disabled={safePage <= 1}
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer flex items-center gap-1 transition-colors"
          title="Trang trước"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Trước</span>
        </button>

        {/* Dynamic Page Numbers with Ellipsis */}
        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              return (
                p === 1 ||
                p === totalPages ||
                Math.abs(p - safePage) <= 1
              );
            })
            .map((pageNum, idx, arr) => {
              const prevNum = arr[idx - 1];
              const showEllipsis = prevNum && pageNum - prevNum > 1;

              return (
                <React.Fragment key={pageNum}>
                  {showEllipsis && (
                    <span className="px-1 text-slate-400 select-none">...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => onPageChange(pageNum)}
                    className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      safePage === pageNum
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100 border border-slate-200 bg-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                </React.Fragment>
              );
            })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          id={`${idPrefix}-page-next-btn`}
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer flex items-center gap-1 transition-colors"
          title="Trang sau"
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          id={`${idPrefix}-page-last-btn`}
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-colors"
          title="Trang cuối"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const ReportsView: React.FC<ReportsViewProps> = ({
  projects,
  exportedGoods,
  laborLogs,
  staff,
  companySettings,
  currentUser,
  onNavigateToProject,
}) => {
  // Filter States
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<ReportSubTab>('projects');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState<string>('all');

  // Pagination States for all 4 Tabs
  const [projectsPage, setProjectsPage] = useState<number>(1);
  const [projectsPageSize, setProjectsPageSize] = useState<number>(6);

  const [materialsPage, setMaterialsPage] = useState<number>(1);
  const [materialsPageSize, setMaterialsPageSize] = useState<number>(10);

  const [laborPage, setLaborPage] = useState<number>(1);
  const [laborPageSize, setLaborPageSize] = useState<number>(10);

  const [financialPage, setFinancialPage] = useState<number>(1);
  const [financialPageSize, setFinancialPageSize] = useState<number>(10);

  // Auto-reset page numbers when filter changes
  useEffect(() => {
    setProjectsPage(1);
    setFinancialPage(1);
    setLaborPage(1);
  }, [timeFilter, selectedProjectId]);

  useEffect(() => {
    setMaterialsPage(1);
  }, [timeFilter, selectedProjectId, searchTerm, materialCategoryFilter]);

  // Format currency helper
  const formatCurrency = (val?: number | null) => {
    if (!val || isNaN(val)) return '0 đ';
    return `${new Intl.NumberFormat('vi-VN').format(val)} đ`;
  };

  const formatNumber = (val?: number | null) => {
    if (!val || isNaN(val)) return '0';
    return new Intl.NumberFormat('vi-VN').format(val);
  };

  // Parse date helper (dd/mm/yyyy -> Date)
  const parseDDMMYYYY = (dateStr?: string): Date | null => {
    if (!dateStr) return null;
    const norm = normalizeDateToDDMMYYYY(dateStr);
    const parts = norm.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        return new Date(y, m, d);
      }
    }
    return null;
  };

  // Current Date boundaries for filtering
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentQuarter = Math.floor(currentMonth / 3);

  // Check if date falls in time filter
  const isDateInTimeFilter = (dateStr?: string): boolean => {
    if (timeFilter === 'all') return true;
    const d = parseDDMMYYYY(dateStr);
    if (!d) return true; // If no date, include in all

    const itemYear = d.getFullYear();
    const itemMonth = d.getMonth();
    const itemQuarter = Math.floor(itemMonth / 3);

    if (timeFilter === 'this_month') {
      return itemYear === currentYear && itemMonth === currentMonth;
    }
    if (timeFilter === 'this_quarter') {
      return itemYear === currentYear && itemQuarter === currentQuarter;
    }
    if (timeFilter === 'this_year') {
      return itemYear === currentYear;
    }
    return true;
  };

  // Filtered Exported Goods according to time and project
  const filteredExports = useMemo(() => {
    return exportedGoods.filter((item) => {
      // 1. Time filter
      if (!isDateInTimeFilter(item.date)) return false;

      // 2. Project filter
      if (selectedProjectId !== 'all') {
        const targetProj = projects.find((p) => p.id === selectedProjectId);
        if (targetProj) {
          const matchCode = (item.projectCode || '').trim().toLowerCase() === targetProj.code.trim().toLowerCase();
          const matchName = (item.projectName || '').trim().toLowerCase() === targetProj.name.trim().toLowerCase();
          if (!matchCode && !matchName) return false;
        }
      }
      return true;
    });
  }, [exportedGoods, timeFilter, selectedProjectId, projects]);

  // Filtered Labor Logs according to time and project
  const filteredLabor = useMemo(() => {
    return laborLogs.filter((item) => {
      // 1. Time filter
      if (!isDateInTimeFilter(item.date)) return false;

      // 2. Project filter
      if (selectedProjectId !== 'all') {
        const targetProj = projects.find((p) => p.id === selectedProjectId);
        if (targetProj) {
          const matchCode = (item.projectCode || '').trim().toLowerCase() === targetProj.code.trim().toLowerCase();
          const matchName = (item.projectName || '').trim().toLowerCase() === targetProj.name.trim().toLowerCase();
          if (!matchCode && !matchName) return false;
        }
      }
      return true;
    });
  }, [laborLogs, timeFilter, selectedProjectId, projects]);

  // Aggregated KPIs
  const totalMaterialCost = useMemo(() => {
    return filteredExports.reduce((sum, e) => sum + (e.totalPrice || 0), 0);
  }, [filteredExports]);

  const totalLaborCost = useMemo(() => {
    return filteredLabor.reduce((sum, l) => sum + (l.totalCost || 0), 0);
  }, [filteredLabor]);

  const totalCost = totalMaterialCost + totalLaborCost;
  const totalExportsCount = filteredExports.length;

  const totalWorkdays = useMemo(() => {
    return filteredLabor.reduce((sum, l) => sum + (l.totalWorkdays || 0), 0);
  }, [filteredLabor]);

  // Project breakdown calculations
  const projectMetricsList = useMemo(() => {
    let targetProjects = projects;
    if (selectedProjectId !== 'all') {
      targetProjects = projects.filter((p) => p.id === selectedProjectId);
    }

    return targetProjects.map((p) => {
      // Calculate material cost for this project in the filtered range
      const pExports = filteredExports.filter((e) => {
        const matchCode = (e.projectCode || '').trim().toLowerCase() === p.code.trim().toLowerCase();
        const matchName = (e.projectName || '').trim().toLowerCase() === p.name.trim().toLowerCase();
        return matchCode || matchName;
      });
      const pMaterialCost = pExports.reduce((sum, e) => sum + (e.totalPrice || 0), 0);

      // Calculate labor cost for this project in the filtered range
      const pLabor = filteredLabor.filter((l) => {
        const matchCode = (l.projectCode || '').trim().toLowerCase() === p.code.trim().toLowerCase();
        const matchName = (l.projectName || '').trim().toLowerCase() === p.name.trim().toLowerCase();
        return matchCode || matchName;
      });
      const pLaborCost = pLabor.reduce((sum, l) => sum + (l.totalCost || 0), 0);
      const pWorkdays = pLabor.reduce((sum, l) => sum + (l.totalWorkdays || 0), 0);

      const pTotalCost = pMaterialCost + pLaborCost;
      const completedVal = p.completedValue !== undefined && p.completedValue !== null && p.completedValue > 0
        ? p.completedValue
        : (p.budget || 0);

      // Material percentage and labor percentage of total cost
      const matPercent = pTotalCost > 0 ? Math.round((pMaterialCost / pTotalCost) * 100) : 50;
      const laborPercent = pTotalCost > 0 ? 100 - matPercent : 50;

      return {
        project: p,
        materialCost: pMaterialCost,
        laborCost: pLaborCost,
        totalCost: pTotalCost,
        workdays: pWorkdays,
        budget: completedVal,
        matPercent,
        laborPercent,
      };
    });
  }, [projects, selectedProjectId, filteredExports, filteredLabor]);

  // Paginated Projects
  const paginatedProjects = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(projectMetricsList.length / projectsPageSize));
    const safePage = Math.min(Math.max(1, projectsPage), totalPages);
    const start = (safePage - 1) * projectsPageSize;
    return projectMetricsList.slice(start, start + projectsPageSize);
  }, [projectMetricsList, projectsPage, projectsPageSize]);

  // Project count metrics
  const activeProjectsCount = useMemo(() => {
    return projects.filter((p) => p.status === 'active').length;
  }, [projects]);

  const totalProjectsCount = projects.length;

  // Material Breakdown for Material Sub-Tab
  const materialBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { code: string; name: string; category: string; unit: string; totalQty: number; totalAmount: number }
    >();

    filteredExports.forEach((item) => {
      const code = item.materialCode || 'N/A';
      const key = `${code}_${item.materialName}`;
      const existing = map.get(key);
      if (existing) {
        existing.totalQty += item.quantity || 0;
        existing.totalAmount += item.totalPrice || 0;
      } else {
        map.set(key, {
          code,
          name: item.materialName,
          category: 'Vật tư chống thấm',
          unit: item.unit || 'Đơn vị',
          totalQty: item.quantity || 0,
          totalAmount: item.totalPrice || 0,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredExports]);

  // Filtered materials in sub-tab
  const displayedMaterials = useMemo(() => {
    return materialBreakdown.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat =
        materialCategoryFilter === 'all' || m.category === materialCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [materialBreakdown, searchTerm, materialCategoryFilter]);

  // Paginated Materials
  const paginatedMaterials = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(displayedMaterials.length / materialsPageSize));
    const safePage = Math.min(Math.max(1, materialsPage), totalPages);
    const start = (safePage - 1) * materialsPageSize;
    return displayedMaterials.slice(start, start + materialsPageSize);
  }, [displayedMaterials, materialsPage, materialsPageSize]);

  // Labor Breakdown for Labor Sub-Tab
  const laborBreakdown = useMemo(() => {
    const staffMap = new Map<
      string,
      { staffName: string; role: string; workdays: number; totalCost: number; projectsUsed: Set<string> }
    >();

    filteredLabor.forEach((log) => {
      const projName = log.projectName || log.projectCode || 'Công trình chung';
      if (log.workerDetails && log.workerDetails.length > 0) {
        log.workerDetails.forEach((w) => {
          const name = w.name.trim();
          if (!name) return;
          const existing = staffMap.get(name);
          if (existing) {
            existing.workdays += w.workdays || 0;
            existing.totalCost += w.cost || 0;
            existing.projectsUsed.add(projName);
          } else {
            staffMap.set(name, {
              staffName: name,
              role: w.role || 'Thợ thi công',
              workdays: w.workdays || 0,
              totalCost: w.cost || 0,
              projectsUsed: new Set([projName]),
            });
          }
        });
      } else if (log.workerNames && log.workerNames.length > 0) {
        const perWorkerCost = log.workerNames.length > 0 ? (log.totalCost || 0) / log.workerNames.length : 0;
        const perWorkerDays = log.workerNames.length > 0 ? (log.totalWorkdays || 0) / log.workerNames.length : 1;
        log.workerNames.forEach((name) => {
          const cleanName = name.trim();
          if (!cleanName) return;
          const existing = staffMap.get(cleanName);
          if (existing) {
            existing.workdays += perWorkerDays;
            existing.totalCost += perWorkerCost;
            existing.projectsUsed.add(projName);
          } else {
            staffMap.set(cleanName, {
              staffName: cleanName,
              role: 'Thợ thi công',
              workdays: perWorkerDays,
              totalCost: perWorkerCost,
              projectsUsed: new Set([projName]),
            });
          }
        });
      }
    });

    return Array.from(staffMap.values())
      .map((item) => ({
        ...item,
        projectsUsed: Array.from(item.projectsUsed),
      }))
      .sort((a, b) => b.totalCost - a.totalCost);
  }, [filteredLabor]);

  // Paginated Labor
  const paginatedLabor = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(laborBreakdown.length / laborPageSize));
    const safePage = Math.min(Math.max(1, laborPage), totalPages);
    const start = (safePage - 1) * laborPageSize;
    return laborBreakdown.slice(start, start + laborPageSize);
  }, [laborBreakdown, laborPage, laborPageSize]);

  // Paginated Financial
  const paginatedFinancial = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(projectMetricsList.length / financialPageSize));
    const safePage = Math.min(Math.max(1, financialPage), totalPages);
    const start = (safePage - 1) * financialPageSize;
    return projectMetricsList.slice(start, start + financialPageSize);
  }, [projectMetricsList, financialPage, financialPageSize]);

  // Handle Export Excel Button Click
  const handleExportExcelReport = () => {
    const timeLabels: Record<TimeFilterType, string> = {
      all: 'Tất cả thời gian',
      this_month: `Tháng ${currentMonth + 1}/${currentYear}`,
      this_quarter: `Quý ${currentQuarter + 1}/${currentYear}`,
      this_year: `Năm ${currentYear}`,
    };

    let projLabel = 'Tất cả công trình';
    if (selectedProjectId !== 'all') {
      const p = projects.find((item) => item.id === selectedProjectId);
      if (p) projLabel = `${p.code} - ${p.name}`;
    }

    const reportData: ReportSummaryData = {
      timeFilterLabel: timeLabels[timeFilter],
      projectFilterLabel: projLabel,
      totalCost,
      totalMaterialCost,
      totalLaborCost,
      totalExportsCount,
      totalWorkdays,
      activeProjectsCount,
      totalProjectsCount,
      filteredProjects: projectMetricsList,
      materialBreakdown,
      laborBreakdown,
    };

    exportComprehensiveReportToExcel(reportData, companySettings);
  };

  // Handle Print Report Button Click
  const handlePrintReport = () => {
    const timeLabels: Record<TimeFilterType, string> = {
      all: 'Tất cả thời gian',
      this_month: `Tháng ${currentMonth + 1}/${currentYear}`,
      this_quarter: `Quý ${currentQuarter + 1}/${currentYear}`,
      this_year: `Năm ${currentYear}`,
    };

    let projLabel = 'Tất cả công trình';
    if (selectedProjectId !== 'all') {
      const p = projects.find((item) => item.id === selectedProjectId);
      if (p) projLabel = `${p.code} - ${p.name}`;
    }

    const reportData: ReportSummaryData = {
      timeFilterLabel: timeLabels[timeFilter],
      projectFilterLabel: projLabel,
      totalCost,
      totalMaterialCost,
      totalLaborCost,
      totalExportsCount,
      totalWorkdays,
      activeProjectsCount,
      totalProjectsCount,
      filteredProjects: projectMetricsList,
      materialBreakdown,
      laborBreakdown,
    };

    printComprehensiveReport(reportData, companySettings);
  };

  return (
    <div id="reports-view-container" className="space-y-6 pb-24 animate-in fade-in select-none">
      {/* ================= 1. TOP FILTER ROW ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Time Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl w-fit border border-slate-200/60 shadow-2xs">
          <button
            type="button"
            id="time-filter-all"
            onClick={() => setTimeFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              timeFilter === 'all'
                ? 'bg-[#0b5ed7] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Tất cả thời gian
          </button>

          <button
            type="button"
            id="time-filter-month"
            onClick={() => setTimeFilter('this_month')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              timeFilter === 'this_month'
                ? 'bg-[#0b5ed7] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Tháng này
          </button>

          <button
            type="button"
            id="time-filter-quarter"
            onClick={() => setTimeFilter('this_quarter')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              timeFilter === 'this_quarter'
                ? 'bg-[#0b5ed7] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Quý này
          </button>
        </div>

        {/* Right: Project Dropdown Selector */}
        <div className="relative min-w-[220px]">
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <FolderKanban className="w-4 h-4" />
            </div>
            <select
              id="report-project-selector"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full pl-9.5 pr-8 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs appearance-none outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
            >
              <option value="all">Tất cả công trình</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* ================= 2. 4 KPI SUMMARY CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng Chi Phí */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500">Tổng Chi Phí</span>
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              {formatCurrency(totalCost)}
            </h3>
            <p className="text-xs font-semibold text-blue-600 mt-1 flex items-center gap-1">
              Vật tư + Nhân công
            </p>
          </div>
        </div>

        {/* Card 2: Chi Phí Vật Tư */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500">Chi Phí Vật Tư</span>
            <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              {formatCurrency(totalMaterialCost)}
            </h3>
            <p className="text-xs font-medium text-slate-500 mt-1">
              {totalExportsCount} phiếu xuất
            </p>
          </div>
        </div>

        {/* Card 3: Chi Phí Nhân Công */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500">Chi Phí Nhân Công</span>
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              {formatCurrency(totalLaborCost)}
            </h3>
            <p className="text-xs font-semibold text-emerald-600 mt-1">
              {formatNumber(totalWorkdays)} ngày công
            </p>
          </div>
        </div>

        {/* Card 4: Công Trình */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500">Công Trình</span>
            <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              {activeProjectsCount} / {totalProjectsCount}
            </h3>
            <p className="text-xs font-semibold text-purple-600 mt-1">
              đang thi công
            </p>
          </div>
        </div>
      </div>

      {/* ================= 3. SUB-TAB PILL BAR ================= */}
      <div className="bg-slate-100/90 p-1 rounded-2xl flex items-center gap-1 w-full max-w-lg border border-slate-200/60 shadow-2xs">
        <button
          type="button"
          id="report-tab-projects"
          onClick={() => setActiveSubTab('projects')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
            activeSubTab === 'projects'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          Dự án
        </button>

        <button
          type="button"
          id="report-tab-materials"
          onClick={() => setActiveSubTab('materials')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
            activeSubTab === 'materials'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          Vật tư
        </button>

        <button
          type="button"
          id="report-tab-labor"
          onClick={() => setActiveSubTab('labor')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
            activeSubTab === 'labor'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          Chấm công
        </button>

        <button
          type="button"
          id="report-tab-financial"
          onClick={() => setActiveSubTab('financial')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
            activeSubTab === 'financial'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          Tài chính
        </button>
      </div>

      {/* ================= 4. TAB CONTENT ================= */}

      {/* ----------------- TAB 1: DỰ ÁN ----------------- */}
      {activeSubTab === 'projects' && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              Tiến độ & Chi phí từng dự án
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              So sánh chi phí thực tế phát sinh theo ngân sách dự toán
            </p>
          </div>

          {projectMetricsList.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
              <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-700">Chưa có công trình nào trong phạm vi đã chọn</h4>
              <p className="text-xs text-slate-500 mt-1">
                Hãy chuyển sang bộ lọc "Tất cả thời gian" hoặc tạo thêm công trình mới.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {paginatedProjects.map((item) => {
                  const { project, materialCost, laborCost, totalCost, matPercent, laborPercent } = item;
                  const isCompleted = project.status === 'completed';
                  const isPending = project.status === 'pending';

                  return (
                    <div
                      key={project.id}
                      className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Row: Code Pill + Project Name + Status Pill */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 text-[11px] font-extrabold font-mono uppercase tracking-wider">
                              {project.code}
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate font-['Plus_Jakarta_Sans',sans-serif]">
                              {project.name}
                            </h3>
                          </div>

                          {/* Status Badge */}
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Hoàn thành
                              </span>
                            ) : isPending ? (
                              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Sắp khởi công
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200/80">
                                Đang thi công
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Subtitle: Chủ đầu tư */}
                        <p className="text-xs text-slate-500 mt-1.5">
                          Chủ đầu tư: <span className="text-slate-700 font-medium">{project.partner || 'Chưa có thông tin'}</span>
                        </p>

                        {/* 3 Metric Columns */}
                        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100">
                          <div>
                            <span className="text-[11px] font-semibold text-slate-500 block">Vật tư</span>
                            <span className="text-xs sm:text-sm font-extrabold text-amber-600 block mt-0.5 truncate">
                              {formatCurrency(materialCost)}
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] font-semibold text-slate-500 block">Nhân công</span>
                            <span className="text-xs sm:text-sm font-extrabold text-emerald-600 block mt-0.5 truncate">
                              {formatCurrency(laborCost)}
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] font-semibold text-slate-500 block">Tổng chi phí</span>
                            <span className="text-xs sm:text-sm font-black text-blue-600 block mt-0.5 truncate">
                              {formatCurrency(totalCost)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Segmented Dual-Color Progress Bar */}
                      <div className="mt-4 pt-1">
                        <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden">
                          <div
                            className="h-full bg-amber-500 transition-all"
                            style={{ width: `${totalCost > 0 ? matPercent : 50}%` }}
                            title={`Vật tư: ${formatCurrency(materialCost)} (${matPercent}%)`}
                          />
                          <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{ width: `${totalCost > 0 ? laborPercent : 50}%` }}
                            title={`Nhân công: ${formatCurrency(laborCost)} (${laborPercent}%)`}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mt-1.5">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Vật tư ({matPercent}%)
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Nhân công ({laborPercent}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Bar for Projects */}
              <PaginationControl
                idPrefix="report-projects"
                currentPage={projectsPage}
                totalItems={projectMetricsList.length}
                pageSize={projectsPageSize}
                pageSizeOptions={[4, 6, 8, 12, 24]}
                itemUnitName="dự án"
                onPageChange={setProjectsPage}
                onPageSizeChange={setProjectsPageSize}
              />
            </>
          )}
        </div>
      )}

      {/* ----------------- TAB 2: VẬT TƯ ----------------- */}
      {activeSubTab === 'materials' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                Báo cáo tiêu hao & xuất kho vật tư
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thống kê chi tiết số lượng và giá trị vật tư xuất dùng theo công trình
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã hoặc tên vật tư..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9.5 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">STT</th>
                    <th className="py-3.5 px-4">Mã Hàng</th>
                    <th className="py-3.5 px-4">Tên Vật Tư Chống Thấm</th>
                    <th className="py-3.5 px-4 text-center">ĐVT</th>
                    <th className="py-3.5 px-4 text-right">Tổng SL Xuất</th>
                    <th className="py-3.5 px-4 text-right">Tổng Thành Tiền</th>
                    <th className="py-3.5 px-4 text-right">Tỷ Trọng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {displayedMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        Không tìm thấy dữ liệu xuất kho vật tư trong kỳ đã chọn
                      </td>
                    </tr>
                  ) : (
                    paginatedMaterials.map((mat, idx) => {
                      const globalIdx = (materialsPage - 1) * materialsPageSize + idx + 1;
                      const ratio =
                        totalMaterialCost > 0
                          ? ((mat.totalAmount / totalMaterialCost) * 100).toFixed(1)
                          : '0';
                      return (
                        <tr key={`${mat.code}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-center text-slate-400 font-mono">{globalIdx}</td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-700">{mat.code}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{mat.name}</td>
                          <td className="py-3 px-4 text-center text-slate-600">{mat.unit}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-800">
                            {formatNumber(mat.totalQty)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-amber-600">
                            {formatCurrency(mat.totalAmount)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                              {ratio}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Bar for Materials */}
          <PaginationControl
            idPrefix="report-materials"
            currentPage={materialsPage}
            totalItems={displayedMaterials.length}
            pageSize={materialsPageSize}
            pageSizeOptions={[10, 20, 50, 100]}
            itemUnitName="vật tư"
            onPageChange={setMaterialsPage}
            onPageSizeChange={setMaterialsPageSize}
          />
        </div>
      )}

      {/* ----------------- TAB 3: CHẤM CÔNG ----------------- */}
      {activeSubTab === 'labor' && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              Báo cáo nhân lực & ngày công thi công
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chi tiết ngày công và chi phí trả lương thợ theo công trình và nhân sự
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">STT</th>
                    <th className="py-3.5 px-4">Họ Và Tên Thợ</th>
                    <th className="py-3.5 px-4">Vị Trí / Chức Danh</th>
                    <th className="py-3.5 px-4 text-right">Số Ngày Công</th>
                    <th className="py-3.5 px-4 text-right">Tổng Tiền Lương</th>
                    <th className="py-3.5 px-4">Các Công Trình Tham Gia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {laborBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        Không có dữ liệu nhật ký chấm công trong kỳ đã chọn
                      </td>
                    </tr>
                  ) : (
                    paginatedLabor.map((lab, idx) => {
                      const globalIdx = (laborPage - 1) * laborPageSize + idx + 1;
                      return (
                        <tr key={`${lab.staffName}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-center text-slate-400 font-mono">{globalIdx}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{lab.staffName}</td>
                          <td className="py-3 px-4 text-slate-600">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium text-[11px]">
                              {lab.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-emerald-600">
                            {formatNumber(lab.workdays)} công
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            {formatCurrency(lab.totalCost)}
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                            {lab.projectsUsed.join(', ') || 'Công trình chung'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Bar for Labor */}
          <PaginationControl
            idPrefix="report-labor"
            currentPage={laborPage}
            totalItems={laborBreakdown.length}
            pageSize={laborPageSize}
            pageSizeOptions={[10, 20, 50, 100]}
            itemUnitName="nhân sự"
            onPageChange={setLaborPage}
            onPageSizeChange={setLaborPageSize}
          />
        </div>
      )}

      {/* ----------------- TAB 4: TÀI CHÍNH ----------------- */}
      {activeSubTab === 'financial' && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              Tổng hợp tài chính & Giá trị hoàn thành
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Đánh giá chi phí phát sinh thực tế so với tổng giá trị hoàn thành của từng dự án
            </p>
          </div>

          {/* Comparative Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">STT</th>
                    <th className="py-3.5 px-4">Công Trình</th>
                    <th className="py-3.5 px-4 text-right">Chi Phí Vật Tư</th>
                    <th className="py-3.5 px-4 text-right">Chi Phí Nhân Công</th>
                    <th className="py-3.5 px-4 text-right">Tổng Chi Phí Thực Tế</th>
                    <th className="py-3.5 px-4 text-right">Tổng Giá Trị Hoàn Thành</th>
                    <th className="py-3.5 px-4 text-right">Tỷ Lệ Tiêu Hao</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {projectMetricsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        Chưa có dữ liệu tài chính
                      </td>
                    </tr>
                  ) : (
                    paginatedFinancial.map((item, idx) => {
                      const { project, materialCost, laborCost, totalCost, budget } = item;
                      const usageRate = budget > 0 ? Math.round((totalCost / budget) * 100) : 0;
                      const globalIdx = (financialPage - 1) * financialPageSize + idx + 1;

                      return (
                        <tr key={project.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-center text-slate-400 font-mono">{globalIdx}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{project.name}</div>
                            <div className="text-[11px] font-mono text-blue-600">{project.code}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-amber-600">
                            {formatCurrency(materialCost)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                            {formatCurrency(laborCost)}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-blue-700">
                            {formatCurrency(totalCost)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-700">
                            {budget > 0 ? formatCurrency(budget) : 'Chưa có giá trị'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {budget > 0 ? (
                              <span
                                className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                                  usageRate > 100
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : usageRate > 80
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {usageRate}%
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Bar for Financial */}
          <PaginationControl
            idPrefix="report-financial"
            currentPage={financialPage}
            totalItems={projectMetricsList.length}
            pageSize={financialPageSize}
            pageSizeOptions={[10, 20, 50, 100]}
            itemUnitName="công trình"
            onPageChange={setFinancialPage}
            onPageSizeChange={setFinancialPageSize}
          />
        </div>
      )}

      {/* ================= 5. FLOATING BOTTOM-RIGHT ACTION BUTTONS ================= */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 sm:gap-3">
        {/* Nút In Báo Cáo */}
        <button
          type="button"
          id="print-report-floating-btn"
          onClick={handlePrintReport}
          className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-bold px-4 sm:px-5 py-3 rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all flex items-center gap-2 active:scale-95 cursor-pointer text-xs sm:text-sm font-['Plus_Jakarta_Sans',sans-serif]"
          title="In báo cáo tổng hợp & tiến độ thi công"
        >
          <Printer className="w-4 h-4 text-slate-700" />
          <span>In Báo Cáo</span>
        </button>

        {/* Nút Xuất File Báo Cáo */}
        <button
          type="button"
          id="export-report-floating-btn"
          onClick={handleExportExcelReport}
          className="bg-[#0b5ed7] hover:bg-[#094ca7] text-white font-bold px-4 sm:px-5 py-3 rounded-full shadow-[0_8px_24px_rgba(11,94,215,0.35)] hover:shadow-[0_12px_28px_rgba(11,94,215,0.45)] transition-all flex items-center gap-2 active:scale-95 cursor-pointer text-xs sm:text-sm font-['Plus_Jakarta_Sans',sans-serif]"
          title="Xuất file Excel báo cáo tổng hợp"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Xuất File Báo Cáo</span>
        </button>
      </div>
    </div>
  );
};
