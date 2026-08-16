import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  Trash2,
  Edit2,
  Phone,
  UserCheck,
  Tag,
  DollarSign,
  TrendingUp,
  HardHat,
  ArrowUpRight,
  ExternalLink,
  Filter,
  LayoutGrid,
  List,
  Layers,
  FileText,
  Package,
  X,
  Sparkles,
} from 'lucide-react';
import { ConstructionProject, ExportedGood, LaborDailyLog, StaffMember } from '../types';

interface ProjectsViewProps {
  projects: ConstructionProject[];
  exportedGoods?: ExportedGood[];
  laborLogs?: LaborDailyLog[];
  staff?: StaffMember[];
  onOpenNewProject: () => void;
  onEditProject?: (project: ConstructionProject) => void;
  onDeleteProject?: (id: string) => Promise<void> | void;
  onOpenExportForProject?: (project: ConstructionProject) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  exportedGoods = [],
  laborLogs = [],
  staff = [],
  onOpenNewProject,
  onEditProject,
  onDeleteProject,
  onOpenExportForProject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<ConstructionProject | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

    return {
      exportsList: projectExports,
      laborList: projectLabor,
      totalExportsVal: totalExports,
      totalWorkdays: totalWorkdays,
    };
  };

  // Filter list
  const filteredProjects = projects.filter((p) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(search) ||
      p.partner.toLowerCase().includes(search) ||
      p.code.toLowerCase().includes(search) ||
      (p.address && p.address.toLowerCase().includes(search)) ||
      (p.supervisor && p.supervisor.toLowerCase().includes(search)) ||
      (p.category && p.category.toLowerCase().includes(search));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && (p.status === 'active' || !p.status)) ||
      (statusFilter === 'pending' && p.status === 'pending') ||
      (statusFilter === 'completed' && p.status === 'completed');

    const matchesCategory =
      categoryFilter === 'all' || (p.category && p.category.includes(categoryFilter));

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Aggregate stats across all projects
  const totalProjectsCount = projects.length;
  const activeCount = projects.filter((p) => p.status === 'active' || !p.status).length;
  const pendingCount = projects.filter((p) => p.status === 'pending').length;
  const completedCount = projects.filter((p) => p.status === 'completed').length;
  const totalSystemExports = exportedGoods.reduce((sum, e) => sum + (e.totalPrice || 0), 0);
  const totalSystemLabor = laborLogs.reduce((sum, l) => sum + (l.totalWorkdays || 0), 0);

  // Extract unique categories
  const categoriesList = Array.from(
    new Set(projects.map((p) => p.category).filter(Boolean))
  ) as string[];

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
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Quản Lý Công Trình & Dự Án Chống Thấm
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Database className="w-3 h-3" />
                  <span>Realtime DB ({projects.length})</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Dữ liệu công trình, đối tác, địa chỉ thi công và tiến độ vật tư được lưu trữ đồng bộ thời gian thực
              </p>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
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

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs sm:col-span-2 lg:col-span-2">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Tổng Giá Trị Vật Tư Xuất Ra</span>
            <Package className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-blue-700 mt-1">
            {formatCurrency(totalSystemExports)} đ
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Lũy kế {exportedGoods.length} phiếu xuất kho
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
              Đã Hoàn Thành ({completedCount})
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

        {/* Search & Category Filter Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên công trình, mã dự án, đối tác, địa chỉ, chỉ huy trưởng..."
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

          {categoriesList.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:bg-white focus:border-blue-600 outline-none cursor-pointer"
              >
                <option value="all">Tất cả hạng mục</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((proj) => {
            const stats = getProjectLiveStats(proj);
            const isCompleted = proj.status === 'completed';
            const isPending = proj.status === 'pending';

            return (
              <div
                key={proj.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between relative group"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold font-mono uppercase tracking-wider">
                          {proj.code}
                        </span>
                        {proj.category && (
                          <span className="text-[10px] text-slate-500 font-medium truncate max-w-[130px]" title={proj.category}>
                            • {proj.category}
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

                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" />
                          <span>Đã xong</span>
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Chuẩn bị</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Đang thi công</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Location & Supervisor info */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate text-slate-700" title={proj.address}>
                        {proj.address || 'TP. Hồ Chí Minh'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>Khởi công: <strong>{proj.startDate}</strong></span>
                      </div>
                      {proj.supervisor && (
                        <div className="flex items-center gap-1 text-slate-500 font-medium">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[100px]" title={proj.supervisor}>
                            {proj.supervisor}
                          </span>
                        </div>
                      )}
                    </div>

                    {proj.phone && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span>Hotline: <strong className="text-slate-700">{proj.phone}</strong></span>
                      </div>
                    )}
                  </div>

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
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedProjectDetail(proj)}
                    className="text-[11px] text-blue-700 hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Xem chi tiết</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1">
                    {onOpenExportForProject && (
                      <button
                        type="button"
                        onClick={() => onOpenExportForProject(proj)}
                        className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Tạo phiếu xuất kho cho công trình này"
                      >
                        <Package className="w-3 h-3" />
                        <span>Xuất kho</span>
                      </button>
                    )}

                    {onEditProject && (
                      <button
                        type="button"
                        onClick={() => onEditProject(proj)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
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
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Xóa công trình khỏi cơ sở dữ liệu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
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
                  <th className="px-4 py-3">Hạng Mục & Đối Tác</th>
                  <th className="px-4 py-3">Địa Chỉ & Phụ Trách</th>
                  <th className="px-4 py-3">Khởi Công</th>
                  <th className="px-4 py-3 text-right">Vật Tư Xuất</th>
                  <th className="px-4 py-3 text-center">Công Nhật</th>
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
                    return (
                      <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer" onClick={() => setSelectedProjectDetail(proj)}>
                            {proj.name}
                          </div>
                          <span className="font-mono text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                            {proj.code}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{proj.partner}</div>
                          <div className="text-[11px] text-slate-500">{proj.category || 'Chống thấm'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-700 max-w-[200px] truncate" title={proj.address}>
                            {proj.address}
                          </div>
                          {proj.supervisor && (
                            <div className="text-[11px] text-slate-500 font-medium">
                              PT: {proj.supervisor} {proj.phone ? `(${proj.phone})` : ''}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap text-slate-600">
                          {proj.startDate}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(stats.totalExportsVal)} đ
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-blue-700 whitespace-nowrap">
                          {stats.totalWorkdays} Công
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {proj.status === 'completed' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              Đã xong
                            </span>
                          ) : proj.status === 'pending' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Chuẩn bị
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Đang thi công
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
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
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
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

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 text-[11px] block">Hạng mục chính:</span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {selectedProjectDetail.category || 'Chống thấm chuyên sâu'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Địa chỉ công trường:</span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {selectedProjectDetail.address || 'TP. Hồ Chí Minh'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Người phụ trách / SĐT:</span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {selectedProjectDetail.supervisor || 'Chưa phân công'}{' '}
                    {selectedProjectDetail.phone ? `(${selectedProjectDetail.phone})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Thời gian:</span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {selectedProjectDetail.startDate}{' '}
                    {selectedProjectDetail.endDate ? `-> ${selectedProjectDetail.endDate}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Dự toán ngân sách:</span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {selectedProjectDetail.budget
                      ? `${formatCurrency(selectedProjectDetail.budget)} đ`
                      : 'Chưa thiết lập'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Trạng thái:</span>
                  <span className="font-bold text-emerald-700 block mt-0.5 uppercase">
                    {selectedProjectDetail.status === 'completed'
                      ? 'Đã nghiệm thu'
                      : selectedProjectDetail.status === 'pending'
                      ? 'Sắp khởi công'
                      : 'Đang thi công'}
                  </span>
                </div>
              </div>

              {selectedProjectDetail.notes && (
                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-slate-700">
                  <span className="font-bold text-blue-900 text-[11px] block mb-0.5">
                    Yêu cầu kỹ thuật & Ghi chú:
                  </span>
                  <p>{selectedProjectDetail.notes}</p>
                </div>
              )}

              {/* Material Exports for this Project */}
              {(() => {
                const stats = getProjectLiveStats(selectedProjectDetail);
                return (
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
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Xuất Thêm Vật Tư</span>
                        </button>
                      )}
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-56 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
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
                              <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
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
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                ID Cơ sở dữ liệu: <strong className="font-mono">{selectedProjectDetail.id}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedProjectDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
