import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  ArrowUpRight,
  LayoutGrid,
  List,
  Package,
  X,
  Coins,
  ShieldCheck,
  Award,
  Users,
  Printer,
  FileSpreadsheet,
  Lock,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import { ConstructionProject, ExportedGood, LaborDailyLog, StaffMember, CompanySettings, UserAccount, hasUserPermission } from '../types';
import { exportProjectToExcel, printProjectReport } from '../utils/projectExportUtils';

// Helper function to extract exact creation timestamp for consistent sorting
export function getProjectCreationTimestamp(p: ConstructionProject): number {
  if (typeof p.createdAtTimestamp === 'number' && !isNaN(p.createdAtTimestamp)) {
    return p.createdAtTimestamp;
  }
  if (p.createdAt) {
    if (typeof p.createdAt === 'number') return p.createdAt;
    const parsed = Date.parse(p.createdAt);
    if (!isNaN(parsed)) return parsed;
    // Format DD/MM/YYYY or DD/MM/YYYY HH:mm
    const parts = p.createdAt.split(/[/ :T-]/).map((n) => parseInt(n, 10));
    if (parts.length >= 3) {
      const d = parts[0];
      const m = parts[1] - 1;
      const y = parts[2];
      const hour = parts[3] || 0;
      const min = parts[4] || 0;
      const t = new Date(y, m, d, hour, min).getTime();
      if (!isNaN(t)) return t;
    }
  }
  // Try extracting timestamp from ID (e.g., "proj-1771122334455" or "proj_1771122334455")
  const idDigits = p.id?.match(/\d{10,}/);
  if (idDigits && idDigits[0]) {
    const num = Number(idDigits[0]);
    if (num > 1000000000) return num;
  }
  // Fallback to startDate (e.g. DD/MM/YYYY)
  if (p.startDate) {
    const parsed = Date.parse(p.startDate);
    if (!isNaN(parsed)) return parsed;
    const parts = p.startDate.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const t = new Date(y, m, d).getTime();
      if (!isNaN(t)) return t;
    }
  }
  return 0;
}

// Helper function to format created date string nicely
export function formatProjectCreatedDate(p: ConstructionProject): string {
  if (p.createdAt) {
    if (p.createdAt.includes('T')) {
      const d = new Date(p.createdAt);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      }
    }
    return p.createdAt;
  }
  if (p.createdAtTimestamp) {
    const d = new Date(p.createdAtTimestamp);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
  }
  return p.startDate ? `Khởi công: ${p.startDate}` : 'Đã tạo';
}

interface ProjectsViewProps {
  projects: ConstructionProject[];
  exportedGoods?: ExportedGood[];
  laborLogs?: LaborDailyLog[];
  staff?: StaffMember[];
  companySettings?: CompanySettings;
  currentUser?: UserAccount | null;
  onOpenNewProject: () => void;
  onEditProject?: (project: ConstructionProject) => void;
  onDeleteProject?: (id: string) => Promise<void> | void;
  onSaveProject?: (project: ConstructionProject) => Promise<void> | void;
  onOpenExportForProject?: (project: ConstructionProject) => void;
  onOpenLaborForProject?: (project: ConstructionProject) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  exportedGoods = [],
  laborLogs = [],
  staff = [],
  companySettings,
  currentUser,
  onOpenNewProject,
  onEditProject,
  onDeleteProject,
  onSaveProject,
  onOpenExportForProject,
  onOpenLaborForProject,
}) => {
  const canExportExcel = hasUserPermission(currentUser, 'canExportExcel');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'name_asc' | 'start_date_desc'>('created_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<ConstructionProject | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Quick Complete Popup state
  const [projectToComplete, setProjectToComplete] = useState<ConstructionProject | null>(null);
  const [quickCompletedValueInput, setQuickCompletedValueInput] = useState<string>('');
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);

  // Helper format currency
  const formatCurrency = (val: number | undefined) =>
    val ? new Intl.NumberFormat('vi-VN').format(val) : '0';

  // Calculate dynamic exports and labor per project if matching
  const getProjectLiveStats = (proj: ConstructionProject) => {
    // Matches by code or name
    const projectExports = exportedGoods.filter(
      (e) =>
        (e.projectCode && e.projectCode.toLowerCase() === proj.code.toLowerCase()) ||
        (e.projectName && e.projectName.toLowerCase() === proj.name.toLowerCase())
    );

    const calculatedExportsVal = projectExports.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const totalExports = calculatedExportsVal > 0 ? calculatedExportsVal : proj.totalExportsValue || 0;

    // Matches labor logs
    const projectLabor = laborLogs.filter(
      (l) => l.projectName && l.projectName.toLowerCase() === proj.name.toLowerCase()
    );
    const calculatedWorkdays = projectLabor.reduce((sum, item) => sum + (item.totalWorkdays || 0), 0);
    const totalWorkdays = calculatedWorkdays > 0 ? calculatedWorkdays : proj.workdaysLogged || 0;
    const totalLaborCost = projectLabor.reduce((sum, item) => sum + (item.totalCost || 0), 0);

    return {
      exportsList: projectExports,
      laborList: projectLabor,
      totalExportsVal: totalExports,
      totalExportsValue: totalExports,
      totalWorkdays: totalWorkdays,
      totalLaborCost: totalLaborCost,
    };
  };

  // Filter & Sort list - Default: sorted by newest created time on top
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          p.name.toLowerCase().includes(search) ||
          p.partner.toLowerCase().includes(search) ||
          p.code.toLowerCase().includes(search) ||
          (p.address && p.address.toLowerCase().includes(search));

        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && (p.status === 'active' || !p.status)) ||
          (statusFilter === 'pending' && p.status === 'pending') ||
          (statusFilter === 'completed' && p.status === 'completed');

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'created_desc') {
          return getProjectCreationTimestamp(b) - getProjectCreationTimestamp(a);
        }
        if (sortBy === 'created_asc') {
          return getProjectCreationTimestamp(a) - getProjectCreationTimestamp(b);
        }
        if (sortBy === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'start_date_desc') {
          const tA = getProjectCreationTimestamp({ ...a, createdAtTimestamp: undefined, createdAt: undefined });
          const tB = getProjectCreationTimestamp({ ...b, createdAtTimestamp: undefined, createdAt: undefined });
          return tB - tA;
        }
        return getProjectCreationTimestamp(b) - getProjectCreationTimestamp(a);
      });
  }, [projects, searchTerm, statusFilter, sortBy]);

  // Aggregate stats across all projects
  const totalProjectsCount = projects.length;
  const activeCount = projects.filter((p) => p.status === 'active' || !p.status).length;
  const pendingCount = projects.filter((p) => p.status === 'pending').length;
  const completedCount = projects.filter((p) => p.status === 'completed').length;
  const totalSystemExports = exportedGoods.reduce((sum, e) => sum + (e.totalPrice || 0), 0);
  const totalCompletedVal = projects
    .filter((p) => p.status === 'completed' && p.completedValue)
    .reduce((sum, p) => sum + (p.completedValue || 0), 0);

  const handleDeleteConfirm = async (id: string, name: string) => {
    if (window.confirm(`Xác nhận xóa công trình "${name}" khỏi cơ sở dữ liệu Firebase?`)) {
      setDeletingId(id);
      if (onDeleteProject) {
        await onDeleteProject(id);
      }
      setDeletingId(null);
      if (selectedProjectDetail?.id === id) {
        setSelectedProjectDetail(null);
      }
    }
  };

  // Open Quick Complete Dialog
  const handleOpenCompleteModal = (proj: ConstructionProject) => {
    setProjectToComplete(proj);
    setQuickCompletedValueInput(proj.completedValue ? String(proj.completedValue) : '');
  };

  // Save completion value
  const handleSaveQuickCompletion = async () => {
    if (!projectToComplete) return;
    setIsSavingCompletion(true);
    const cleanNum = Number(quickCompletedValueInput.replace(/\D/g, '')) || 0;
    const updatedProject: ConstructionProject = {
      ...projectToComplete,
      status: 'completed',
      completedValue: cleanNum,
    };

    if (onSaveProject) {
      await onSaveProject(updatedProject);
    }
    if (selectedProjectDetail?.id === updatedProject.id) {
      setSelectedProjectDetail(updatedProject);
    }
    setIsSavingCompletion(false);
    setProjectToComplete(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Quản Lý Công Trình & Dự Án Chống Thấm
              </h1>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenNewProject}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0c59be] hover:bg-[#094ca7] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Công Trình Mới</span>
        </button>
      </div>

      {/* KPI Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500">Tổng Công Trình</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{totalProjectsCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Trong cơ sở dữ liệu</div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 shadow-2xs bg-gradient-to-br from-emerald-50/40 to-white">
          <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Đang Thi Công</span>
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{activeCount}</div>
          <div className="text-[10px] text-emerald-600/80 mt-0.5">Dự án hoạt động</div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-amber-100 shadow-2xs bg-gradient-to-br from-amber-50/40 to-white">
          <div className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Sắp Khởi Công</span>
          </div>
          <div className="text-xl font-bold text-amber-800 mt-1">{pendingCount}</div>
          <div className="text-[10px] text-amber-600/80 mt-0.5">Đang chuẩn bị</div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-blue-100 shadow-2xs bg-gradient-to-br from-blue-50/40 to-white">
          <div className="text-[11px] font-semibold text-blue-700 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>Đã Nghiệm Thu</span>
          </div>
          <div className="text-xl font-bold text-blue-800 mt-1">{completedCount}</div>
          <div className="text-[10px] text-blue-600/80 mt-0.5">Hoàn thành</div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-indigo-100 shadow-2xs bg-gradient-to-br from-indigo-50/50 to-white">
          <div className="text-[11px] font-semibold text-indigo-700 flex items-center justify-between">
            <span>Tổng Giá Trị Nghiệm Thu</span>
            <Coins className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-lg font-bold text-indigo-800 mt-1 truncate">
            {formatCurrency(totalCompletedVal)} đ
          </div>
          <div className="text-[10px] text-indigo-600/80 mt-0.5">
            {completedCount} công trình xong
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Vật Tư Đã Xuất</span>
            <Package className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-blue-700 mt-1 truncate">
            {formatCurrency(totalSystemExports)} đ
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {exportedGoods.length} phiếu xuất kho
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất Cả ({totalProjectsCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Đang Thi Công ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sắp Khởi Công ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Đã Nghiệm Thu ({completedCount})
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem dạng lưới (Card)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem dạng bảng chi tiết (Table)"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên công trình, mã dự án, đối tác / chủ đầu tư, địa chỉ thi công..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 placeholder:text-slate-400 focus:border-blue-600 outline-none transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 flex-shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap hidden sm:inline">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer pr-1"
              title="Chọn thứ tự sắp xếp danh sách công trình"
            >
              <option value="created_desc">⚡ Mới tạo trước (Mặc định)</option>
              <option value="created_asc">Cũ nhất trước</option>
              <option value="start_date_desc">Ngày khởi công mới nhất</option>
              <option value="name_asc">Tên công trình (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((proj) => {
            const stats = getProjectLiveStats(proj);
            const isCompleted = proj.status === 'completed';
            const isPending = proj.status === 'pending';
            const creationTime = getProjectCreationTimestamp(proj);
            const isRecentlyCreated = Date.now() - creationTime < 48 * 3600 * 1000;

            return (
              <div
                key={proj.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between relative group"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold font-mono uppercase tracking-wider">
                          {proj.code}
                        </span>
                        {isRecentlyCreated && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                            Mới tạo
                          </span>
                        )}
                      </div>
                      <h3
                        onClick={() => setSelectedProjectDetail(proj)}
                        className="font-bold text-slate-900 text-base hover:text-blue-600 transition-colors cursor-pointer line-clamp-1"
                        title={proj.name}
                      >
                        {proj.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium truncate">{proj.partner || 'Chủ đầu tư'}</p>
                    </div>

                    {/* Top Right: Status Badge & Edit/Delete Buttons */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isCompleted ? (
                        <button
                          type="button"
                          onClick={() => handleOpenCompleteModal(proj)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer"
                          title="Bấm để chỉnh sửa giá trị hoàn thành"
                        >
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          <span>Đã xong</span>
                        </button>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Chuẩn bị</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenCompleteModal(proj)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                          title="Bấm để nghiệm thu công trình"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Đang thi công</span>
                        </button>
                      )}

                      <div className="flex items-center opacity-60 group-hover:opacity-100 transition-opacity ml-0.5">
                        {onEditProject && (
                          <button
                            type="button"
                            onClick={() => onEditProject(proj)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin công trình"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteProject && (
                          <button
                            type="button"
                            onClick={() => handleDeleteConfirm(proj.id, proj.name)}
                            disabled={deletingId === proj.id}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Xóa công trình khỏi cơ sở dữ liệu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location, Creation Date & Start Date info */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate text-slate-700" title={proj.address}>
                        {proj.address || 'TP. Hồ Chí Minh'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>Khởi công: <strong className="text-slate-700">{proj.startDate}</strong></span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 flex-shrink-0" title="Thời gian tạo dự án">
                        <Clock className="w-3 h-3 text-blue-500 flex-shrink-0" />
                        <span>Tạo: <strong className="text-slate-700 font-semibold">{formatProjectCreatedDate(proj)}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* COMPLETED VALUE HIGHLIGHT (Visible when completed) */}
                  {isCompleted && (
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/80 border border-blue-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center">
                          <Coins className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-blue-900 block leading-tight">
                            Tổng giá trị hoàn thành:
                          </span>
                          <span className="font-extrabold text-blue-700 text-xs">
                            {proj.completedValue ? `${formatCurrency(proj.completedValue)} đ` : 'Chưa nhập giá trị'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenCompleteModal(proj)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                      >
                        Sửa
                      </button>
                    </div>
                  )}

                  {/* Material & Workdays metric */}
                  <div className="pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50/80 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[10px] font-medium">Vật tư đã xuất:</span>
                      <span className="font-bold text-slate-900 text-xs truncate block">
                        {formatCurrency(stats.totalExportsVal)} đ
                      </span>
                    </div>
                    <div className="bg-slate-50/80 p-2 rounded-xl text-right">
                      <span className="text-slate-400 block text-[10px] font-medium">Công nhật tích lũy:</span>
                      <span className="font-bold text-blue-700 text-xs">
                        {stats.totalWorkdays} Công
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
                  {/* Action Row 1: Quick Operations (Xuất kho, Chấm công, Nghiệm thu) */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {onOpenExportForProject && (
                      <button
                        type="button"
                        onClick={() => onOpenExportForProject(proj)}
                        className="px-2 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                        title="Tạo phiếu xuất kho cho công trình này"
                      >
                        <Package className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span className="whitespace-nowrap">Xuất kho</span>
                      </button>
                    )}

                    {onOpenLaborForProject && (
                      <button
                        type="button"
                        onClick={() => onOpenLaborForProject(proj)}
                        className="px-2 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                        title="Chấm công nhân công cho công trình này"
                      >
                        <Users className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                        <span className="whitespace-nowrap">Chấm công</span>
                      </button>
                    )}

                    {!isCompleted ? (
                      <button
                        type="button"
                        onClick={() => handleOpenCompleteModal(proj)}
                        className="px-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                        title="Nghiệm thu công trình"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="whitespace-nowrap">Nghiệm thu</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenCompleteModal(proj)}
                        className="px-2 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1"
                        title="Chỉnh sửa nghiệm thu"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span className="whitespace-nowrap">Nghiệm thu</span>
                      </button>
                    )}
                  </div>

                  {/* Action Row 2: Xem chi tiết & Báo cáo */}
                  <button
                    type="button"
                    onClick={() => setSelectedProjectDetail(proj)}
                    className="w-full py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/80 hover:border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 group/btn"
                  >
                    <span>Xem chi tiết hồ sơ & báo cáo</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-blue-600 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredProjects.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs space-y-2">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600 text-sm">
                Không tìm thấy công trình nào trong cơ sở dữ liệu
              </p>
              <p className="text-slate-400">
                {searchTerm
                  ? `Không có kết quả khớp với từ khóa "${searchTerm}"`
                  : 'Hãy nhấn "Thêm Công Trình Mới" để lưu thông tin dự án lên Firebase Realtime DB.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Mã & Công Trình</th>
                  <th className="px-4 py-3">Chủ Đầu Tư & Địa Chỉ</th>
                  <th className="px-4 py-3">Thời Gian Tạo & Khởi Công</th>
                  <th className="px-4 py-3 text-right">Vật Tư Xuất</th>
                  <th className="px-4 py-3 text-center">Công Nhật</th>
                  <th className="px-4 py-3 text-right">Giá Trị Hoàn Thành</th>
                  <th className="px-4 py-3 text-center">Trạng Thái</th>
                  <th className="px-4 py-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      Không tìm thấy công trình nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((proj) => {
                    const stats = getProjectLiveStats(proj);
                    const isCompleted = proj.status === 'completed';
                    const creationTime = getProjectCreationTimestamp(proj);
                    const isRecentlyCreated = Date.now() - creationTime < 48 * 3600 * 1000;

                    return (
                      <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer flex items-center gap-1.5" onClick={() => setSelectedProjectDetail(proj)}>
                            {proj.name}
                            {isRecentlyCreated && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                                Mới
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                            {proj.code}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{proj.partner}</div>
                          <div className="text-[11px] text-slate-500 max-w-[200px] truncate" title={proj.address}>{proj.address}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap text-slate-600">
                          <div className="text-slate-900 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-500" />
                            Tạo: {formatProjectCreatedDate(proj)}
                          </div>
                          <div className="text-slate-500 text-[10px] flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5 text-slate-400" />
                            Khởi công: {proj.startDate}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(stats.totalExportsVal)} đ
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-blue-700 whitespace-nowrap">
                          {stats.totalWorkdays} Công
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {isCompleted ? (
                            <span className="font-bold text-blue-800 font-mono">
                              {proj.completedValue ? `${formatCurrency(proj.completedValue)} đ` : 'Đã nghiệm thu'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Đang thi công</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {proj.status === 'completed' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenCompleteModal(proj)}
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer"
                            >
                              Đã xong
                            </button>
                          ) : proj.status === 'pending' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Chuẩn bị
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenCompleteModal(proj)}
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                            >
                              Đang thi công
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {!isCompleted && (
                              <button
                                type="button"
                                onClick={() => handleOpenCompleteModal(proj)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Nghiệm thu công trình"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onOpenExportForProject && (
                              <button
                                type="button"
                                onClick={() => onOpenExportForProject(proj)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Xuất kho"
                              >
                                <Package className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onOpenLaborForProject && (
                              <button
                                type="button"
                                onClick={() => onOpenLaborForProject(proj)}
                                className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Chấm công công trình"
                              >
                                <Users className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onEditProject && (
                              <button
                                type="button"
                                onClick={() => onEditProject(proj)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteProject && (
                              <button
                                type="button"
                                onClick={() => handleDeleteConfirm(proj.id, proj.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Xóa công trình"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROJECT DETAIL MODAL / DRAWER */}
      {selectedProjectDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            {/* Modal Header */}
            {(() => {
              const stats = getProjectLiveStats(selectedProjectDetail);
              return (
                <>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {selectedProjectDetail.code}
                          </span>
                          <h3 className="font-bold text-slate-900 text-base">{selectedProjectDetail.name}</h3>
                        </div>
                        <p className="text-xs text-slate-500">{selectedProjectDetail.partner}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Nút In */}
                      <button
                        type="button"
                        onClick={() => printProjectReport(selectedProjectDetail, stats.exportsList, stats.laborList, companySettings)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                        title="In báo cáo chi tiết công trình"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>In Báo Cáo</span>
                      </button>

                      {/* Nút Xuất file Excel */}
                      <button
                        type="button"
                        disabled={!canExportExcel}
                        onClick={() => {
                          if (!canExportExcel) return;
                          exportProjectToExcel(selectedProjectDetail, stats.exportsList, stats.laborList, companySettings);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs ${
                          canExportExcel
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer'
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-70'
                        }`}
                        title={canExportExcel ? 'Xuất file Excel báo cáo công trình' : 'Tài khoản chưa được cấp quyền xuất file Excel'}
                      >
                        <FileSpreadsheet className={`w-3.5 h-3.5 ${canExportExcel ? 'text-emerald-700' : 'text-slate-400'}`} />
                        <span>Xuất File Excel</span>
                        {!canExportExcel && <Lock className="w-3 h-3 text-slate-400" />}
                      </button>

                      {selectedProjectDetail.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => {
                            const p = selectedProjectDetail;
                            handleOpenCompleteModal(p);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Nghiệm thu</span>
                        </button>
                      )}

                      {onEditProject && (
                        <button
                          type="button"
                          onClick={() => {
                            const p = selectedProjectDetail;
                            setSelectedProjectDetail(null);
                            onEditProject(p);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedProjectDetail(null)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Body (Scrollable) */}
                  <div className="p-6 space-y-6 text-xs overflow-y-auto flex-1">
                    {/* Basic Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Chủ đầu tư / Đối tác:</span>
                        <span className="font-bold text-slate-800 block mt-0.5">
                          {selectedProjectDetail.partner || 'Chủ đầu tư'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Địa chỉ công trường:</span>
                        <span className="font-bold text-slate-800 block mt-0.5">
                          {selectedProjectDetail.address || 'TP. Hồ Chí Minh'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Ngày khởi công:</span>
                        <span className="font-bold text-slate-800 block mt-0.5">
                          {selectedProjectDetail.startDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Trạng thái công trình:</span>
                        <span className="font-bold text-emerald-700 block mt-0.5 uppercase">
                          {selectedProjectDetail.status === 'completed'
                            ? 'Đã nghiệm thu & Hoàn thành'
                            : selectedProjectDetail.status === 'pending'
                            ? 'Sắp khởi công'
                            : 'Đang thi công'}
                        </span>
                      </div>
                    </div>

                    {/* Summary Metric Counters */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-blue-700 font-semibold block">Vật Tư Xuất Kho</span>
                          <span className="text-base font-extrabold text-blue-900 font-mono">
                            {formatCurrency(stats.totalExportsValue)} đ
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-500 block">Số phiếu</span>
                          <span className="font-bold text-slate-800">{stats.exportsList.length} lượt</span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-100 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-amber-800 font-semibold block">Tổng Ngày Công Thợ</span>
                          <span className="text-base font-extrabold text-amber-900 font-mono">
                            {stats.totalWorkdays} Công
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-500 block">Tiền công</span>
                          <span className="font-bold text-amber-900">{formatCurrency(stats.totalLaborCost)} đ</span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-emerald-800 font-semibold block">Giá Trị Hoàn Thành</span>
                          <span className="text-base font-extrabold text-emerald-900 font-mono">
                            {selectedProjectDetail.completedValue ? `${formatCurrency(selectedProjectDetail.completedValue)} đ` : 'Chưa nghiệm thu'}
                          </span>
                        </div>
                        {selectedProjectDetail.status === 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleOpenCompleteModal(selectedProjectDetail)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold cursor-pointer"
                          >
                            Đổi
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Completed Value Highlight banner if completed */}
                    {selectedProjectDetail.status === 'completed' && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                            <Award className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-blue-900 block">
                              Tổng Giá Trị Nghiệm Thu Hoàn Thành
                            </span>
                            <span className="text-base font-extrabold text-blue-700 font-mono">
                              {selectedProjectDetail.completedValue
                                ? `${formatCurrency(selectedProjectDetail.completedValue)} VNĐ`
                                : 'Chưa thiết lập giá trị'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenCompleteModal(selectedProjectDetail)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer transition-colors shadow-xs"
                        >
                          Chỉnh sửa giá trị
                        </button>
                      </div>
                    )}

                    {selectedProjectDetail.notes && (
                      <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-slate-700">
                        <span className="font-bold text-blue-900 text-[11px] block mb-0.5">
                          Ghi chú công trình:
                        </span>
                        <p>{selectedProjectDetail.notes}</p>
                      </div>
                    )}

                    {/* Section 1: Material Exports for this Project */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span>Danh Sách Vật Tư Đã Xuất Đến Công Trình ({stats.exportsList.length})</span>
                        </h4>
                        {onOpenExportForProject && (
                          <button
                            type="button"
                            onClick={() => {
                              const p = selectedProjectDetail;
                              setSelectedProjectDetail(null);
                              onOpenExportForProject(p);
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Xuất Thêm Vật Tư</span>
                          </button>
                        )}
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-52 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] sticky top-0">
                            <tr>
                              <th className="px-3.5 py-2">Ngày</th>
                              <th className="px-3.5 py-2">Vật Tư Chống Thấm</th>
                              <th className="px-3.5 py-2 text-right">Số Lượng</th>
                              <th className="px-3.5 py-2 text-right">Thành Tiền</th>
                              <th className="px-3.5 py-2">Người Nhận</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {stats.exportsList.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-3 py-5 text-center text-slate-400">
                                  Chưa có phiếu xuất vật tư nào cho dự án này.
                                </td>
                              </tr>
                            ) : (
                              stats.exportsList.map((exp) => (
                                <tr key={exp.id} className="hover:bg-slate-50">
                                  <td className="px-3.5 py-2 font-mono text-[11px] text-slate-500">
                                    {exp.date}
                                  </td>
                                  <td className="px-3.5 py-2 font-bold text-slate-900">
                                    {exp.materialName}
                                  </td>
                                  <td className="px-3.5 py-2 text-right font-medium">
                                    {exp.quantity} {exp.unit}
                                  </td>
                                  <td className="px-3.5 py-2 text-right font-bold text-blue-700">
                                    {formatCurrency(exp.totalPrice)} đ
                                  </td>
                                  <td className="px-3.5 py-2 text-slate-600">{exp.recipient}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Section 2: Labor Logs for this Project */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-amber-600" />
                          <span>Nhật Ký Chấm Công Nhân Công Tại Công Trình ({stats.laborList.length})</span>
                        </h4>
                        {onOpenLaborForProject && (
                          <button
                            type="button"
                            onClick={() => {
                              const p = selectedProjectDetail;
                              setSelectedProjectDetail(null);
                              onOpenLaborForProject(p);
                            }}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Chấm Thêm Công</span>
                          </button>
                        )}
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-52 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] sticky top-0">
                            <tr>
                              <th className="px-3.5 py-2">Ngày</th>
                              <th className="px-3.5 py-2 text-center">Thứ</th>
                              <th className="px-3.5 py-2 text-center">Thợ Chính</th>
                              <th className="px-3.5 py-2 text-center">Thợ Phụ</th>
                              <th className="px-3.5 py-2 text-center">Tổng Công</th>
                              <th className="px-3.5 py-2 text-right">Chi Phí</th>
                              <th className="px-3.5 py-2">Nội Dung</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {stats.laborList.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="px-3 py-5 text-center text-slate-400">
                                  Chưa có nhật ký chấm công nào cho công trình này.
                                </td>
                              </tr>
                            ) : (
                              stats.laborList.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50">
                                  <td className="px-3.5 py-2 font-mono text-[11px] text-slate-500">
                                    {log.date}
                                  </td>
                                  <td className="px-3.5 py-2 text-center font-medium text-slate-600">
                                    {log.dayOfWeek}
                                  </td>
                                  <td className="px-3.5 py-2 text-center font-medium text-slate-800">
                                    {log.mainWorkers}
                                  </td>
                                  <td className="px-3.5 py-2 text-center font-medium text-slate-800">
                                    {log.helperWorkers}
                                  </td>
                                  <td className="px-3.5 py-2 text-center font-bold text-blue-700">
                                    {log.totalWorkdays} Công
                                  </td>
                                  <td className="px-3.5 py-2 text-right font-bold text-amber-700">
                                    {formatCurrency(log.totalCost)} đ
                                  </td>
                                  <td className="px-3.5 py-2 text-slate-600 max-w-[200px] truncate">
                                    {log.notes || 'Thi công chống thấm'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
                    <span className="text-[11px] text-slate-400">
                      Mã dự án: <strong className="font-mono text-slate-700">{selectedProjectDetail.code}</strong> (ID: {selectedProjectDetail.id})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedProjectDetail(null)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* POPUP MODAL: Nhập Tổng Giá Trị Hoàn Thành Nhanh */}
      {projectToComplete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Nghiệm Thu Công Trình</h4>
                  <p className="text-[11px] text-blue-100 truncate max-w-[240px]">
                    {projectToComplete.name} ({projectToComplete.code})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProjectToComplete(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
                      quickCompletedValueInput
                        ? new Intl.NumberFormat('vi-VN').format(
                            Number(quickCompletedValueInput.replace(/\D/g, '')) || 0
                          )
                        : ''
                    }
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setQuickCompletedValueInput(raw);
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
                        onClick={() => setQuickCompletedValueInput(String(preset))}
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

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProjectToComplete(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={isSavingCompletion}
                  onClick={handleSaveQuickCompletion}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận & Nghiệm thu</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
