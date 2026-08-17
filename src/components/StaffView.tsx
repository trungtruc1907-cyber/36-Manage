import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Phone,
  HardHat,
  Banknote,
  Search,
  Trash2,
  Edit,
  X,
  Building2,
  CheckCircle2,
  Briefcase,
  History,
  Calendar,
  Clock,
  ArrowUpRight,
  CalendarDays,
  FileSpreadsheet,
  Plus,
} from 'lucide-react';
import { ConstructionProject, LaborDailyLog, StaffMember, CompanySettings, UserAccount } from '../types';
import { StaffAttendanceDetailModal } from './StaffAttendanceDetailModal';
import { TimesheetView } from './TimesheetView';

interface StaffViewProps {
  staff: StaffMember[];
  laborLogs?: LaborDailyLog[];
  projects?: ConstructionProject[];
  companySettings?: CompanySettings;
  currentUser?: UserAccount | null;
  onAddStaff: (newStaff: StaffMember) => Promise<void> | void;
  onDeleteStaff?: (id: string) => Promise<void> | void;
  onUpdateLaborLog?: (log: LaborDailyLog) => Promise<void> | void;
  onDeleteLaborLog?: (logId: string) => Promise<void> | void;
  onAddLaborLog?: (log: LaborDailyLog) => Promise<void> | void;
  onOpenNewLaborLog?: () => void;
}

export const StaffView: React.FC<StaffViewProps> = ({
  staff,
  laborLogs = [],
  projects = [],
  companySettings,
  currentUser,
  onAddStaff,
  onDeleteStaff,
  onUpdateLaborLog,
  onDeleteLaborLog,
  onAddLaborLog,
  onOpenNewLaborLog,
}) => {
  // Active sub-tab inside Personnel module: 'staff_list' (Hồ sơ nhân sự) or 'timesheet' (Bảng chấm công tổng hợp)
  const [activeTab, setActiveTab] = useState<'staff_list' | 'timesheet'>('staff_list');

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Selected staff for viewing / editing detailed attendance history
  const [selectedStaffForAttendance, setSelectedStaffForAttendance] = useState<StaffMember | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('Thợ chính chống thấm');
  const [phone, setPhone] = useState('');
  const [dailyWage, setDailyWage] = useState<number>(450000);
  const [status, setStatus] = useState('Sẵn sàng nhận dự án mới');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (val?: number) => {
    if (val === undefined || isNaN(val)) return '0 đ';
    return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
  };

  // Helper to calculate total attendance workdays and costs for a staff member
  const getStaffAttendanceSummary = useMemo(() => {
    const map = new Map<string, { totalWorkdays: number; totalCost: number; logCount: number }>();

    staff.forEach((s) => {
      const sName = s.name.trim().toLowerCase();
      let totalWorkdays = 0;
      let totalCost = 0;
      let logCount = 0;

      laborLogs.forEach((log) => {
        if (log.workerDetails && Array.isArray(log.workerDetails) && log.workerDetails.length > 0) {
          log.workerDetails.forEach((wd) => {
            if (wd.name && wd.name.trim().toLowerCase() === sName) {
              const wdCost = wd.cost || (wd.workdays || 1.0) * (wd.dailyWage || s.dailyWage || 450000);
              totalWorkdays += wd.workdays || 1.0;
              totalCost += wdCost;
              logCount++;
            }
          });
        } else if (log.workerNames && Array.isArray(log.workerNames)) {
          const found = log.workerNames.some((wn) => wn && wn.trim().toLowerCase() === sName);
          if (found) {
            const count = log.workerNames.length || 1;
            const wdays = log.totalWorkdays ? log.totalWorkdays / count : 1.0;
            const wCost = log.totalCost ? log.totalCost / count : wdays * (s.dailyWage || 450000);
            totalWorkdays += wdays;
            totalCost += wCost;
            logCount++;
          }
        }
      });

      map.set(s.id, { totalWorkdays, totalCost, logCount });
    });

    return map;
  }, [staff, laborLogs]);

  // Open modal for Adding
  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setName('');
    setRole('Thợ chính chống thấm');
    setPhone('');
    setDailyWage(450000);
    setStatus('Sẵn sàng nhận dự án mới');
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEditModal = (member: StaffMember) => {
    setEditingStaff(member);
    setName(member.name);
    setRole(member.role);
    setPhone(member.phone);
    setDailyWage(member.dailyWage || 450000);
    setStatus(member.status || 'Sẵn sàng nhận dự án mới');
    setIsModalOpen(true);
  };

  const filtered = useMemo(() => {
    return staff.filter((w) => {
      const matchSearch =
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.phone.includes(searchTerm) ||
        w.status.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRole =
        roleFilter === 'all'
          ? true
          : roleFilter === 'main'
          ? w.role.toLowerCase().includes('chính') || w.role.toLowerCase().includes('tổ trưởng')
          : roleFilter === 'supervisor'
          ? w.role.toLowerCase().includes('kỹ sư') ||
            w.role.toLowerCase().includes('giám sát') ||
            w.role.toLowerCase().includes('chỉ huy')
          : roleFilter === 'helper'
          ? w.role.toLowerCase().includes('phụ')
          : true;

      return matchSearch && matchRole;
    });
  }, [staff, searchTerm, roleFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = staff.length;
    const working = staff.filter((s) => !s.status.toLowerCase().includes('sẵn sàng')).length;
    const ready = total - working;
    const totalWage = staff.reduce((sum, s) => sum + (s.dailyWage || 0), 0);
    const avgWage = total > 0 ? Math.round(totalWage / total) : 0;

    return { total, working, ready, avgWage };
  }, [staff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    const staffData: StaffMember = {
      id: editingStaff ? editingStaff.id : `staff_${Date.now()}`,
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim(),
      dailyWage: Number(dailyWage) || 0,
      status: status.trim() || 'Sẵn sàng nhận dự án mới',
    };

    await onAddStaff(staffData);
    setIsSubmitting(false);
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  const quickWageOptions = [350000, 400000, 450000, 500000, 550000, 650000];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Header & Module Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Quản Lý Nhân Sự & Bảng Chấm Công
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              {staff.length} Nhân Sự
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý danh sách thợ thi công, kỹ sư và bảng chấm công tổng hợp từ nhật ký hàng ngày
          </p>
        </div>

        {/* Action Button & Sub-Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sub-tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('staff_list')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'staff_list'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Hồ Sơ Nhân Sự ({staff.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('timesheet')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'timesheet'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Bảng Chấm Công</span>
            </button>
          </div>

          {/* Quick Action Button based on active subtab */}
          {activeTab === 'staff_list' ? (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0c59be] hover:bg-[#094ca7] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm nhân sự</span>
            </button>
          ) : (
            onOpenNewLaborLog && (
              <button
                type="button"
                onClick={onOpenNewLaborLog}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Chấm công mới</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* SUB-VIEW 1: STAFF PROFILES & CARDS */}
      {activeTab === 'staff_list' && (
        <>
          {/* KPI Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Tổng nhân sự</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Trong danh sách quản lý</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Đang tại công trình</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <HardHat className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-amber-600 mt-1">{stats.working}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Đang trực tiếp thi công</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Sẵn sàng nhận việc</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-600 mt-1">{stats.ready}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Chờ phân công dự án</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Lương ngày trung bình</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-indigo-700 mt-1">{formatCurrency(stats.avgWage)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">/ ngày công chuẩn</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, chức danh, số điện thoại, công trình..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              roleFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tất cả ({staff.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('main')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              roleFilter === 'main'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Thợ chính / Tổ trưởng
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('supervisor')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              roleFilter === 'supervisor'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Kỹ sư / Giám sát
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('helper')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              roleFilter === 'helper'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Thợ phụ
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((w) => {
          const isReady = w.status.toLowerCase().includes('sẵn sàng');
          const isSupervisor =
            w.role.toLowerCase().includes('kỹ sư') ||
            w.role.toLowerCase().includes('giám sát') ||
            w.role.toLowerCase().includes('chỉ huy');
          const attStats = getStaffAttendanceSummary.get(w.id) || {
            totalWorkdays: 0,
            totalCost: 0,
            logCount: 0,
          };

          return (
            <div
              key={w.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-3.5 relative group flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header of Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold border ${
                        isSupervisor
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}
                    >
                      {isSupervisor ? (
                        <Briefcase className="w-5 h-5" />
                      ) : (
                        <HardHat className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm tracking-tight truncate">
                        {w.name}
                      </h3>
                      <p className="text-xs text-blue-600 font-medium truncate">{w.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(w)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                      title="Sửa thông tin hồ sơ"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {onDeleteStaff && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Xác nhận xóa nhân sự "${w.name}" khỏi cơ sở dữ liệu?`)) {
                            onDeleteStaff(w.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                        title="Xóa nhân sự"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Details: Phone & Daily Wage */}
                <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
                  {/* Phone */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      Điện thoại:
                    </span>
                    <a
                      href={`tel:${w.phone}`}
                      className="text-slate-800 hover:text-blue-600 font-semibold transition-colors"
                    >
                      {w.phone}
                    </a>
                  </div>

                  {/* Daily Wage */}
                  <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      Lương ngày:
                    </span>
                    <span className="font-bold text-emerald-700 text-xs">
                      {formatCurrency(w.dailyWage)}
                      <span className="text-[10px] font-normal text-slate-400 ml-1">/ ngày</span>
                    </span>
                  </div>
                </div>

                {/* Attendance Summary Mini-Banner */}
                <div className="bg-blue-50/60 rounded-xl p-2.5 border border-blue-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      Đã chấm công:
                    </span>
                    <p className="font-bold text-slate-900 mt-0.5 text-xs">
                      {attStats.totalWorkdays.toFixed(1)} Công{' '}
                      <span className="text-slate-400 font-normal text-[10px]">
                        ({attStats.logCount} buổi)
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400">Tích lũy lương</span>
                    <p className="font-bold text-emerald-700 text-xs mt-0.5">
                      {formatCurrency(attStats.totalCost)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Status */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {/* View / Edit Attendance History Button */}
                <button
                  type="button"
                  onClick={() => setSelectedStaffForAttendance(w)}
                  className="w-full py-2 px-3 bg-slate-900 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-between cursor-pointer group/btn"
                >
                  <span className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-blue-300" />
                    <span>Lịch sử chấm công</span>
                  </span>
                  <span className="text-[11px] font-medium bg-white/20 px-2 py-0.5 rounded-lg group-hover/btn:bg-white/30 transition-colors">
                    Xem & Sửa →
                  </span>
                </button>

                {/* Status / Assignment footer */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Phụ trách:
                  </span>
                  <span
                    className={`font-semibold px-2.5 py-0.5 rounded-lg border truncate max-w-[170px] ${
                      isReady
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}
                    title={w.status}
                  >
                    {w.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600 text-sm">
              {searchTerm
                ? `Không tìm thấy nhân sự phù hợp với từ khóa "${searchTerm}"`
                : 'Chưa có nhân sự nào trong danh mục'}
            </p>
            <p className="text-slate-400 text-[11px]">
              {searchTerm
                ? 'Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc bộ lọc chức danh'
                : 'Nhấn nút "Thêm nhân sự mới" để nhập thông tin thợ và chỉ huy vào hệ thống'}
            </p>
          </div>
        )}
      </div>
        </>
      )}

      {/* SUB-VIEW 2: TIMESHEET BOARD (BẢNG CHẤM CÔNG TỔNG HỢP REALTIME) */}
      {activeTab === 'timesheet' && (
        <TimesheetView
          staff={staff}
          laborLogs={laborLogs}
          projects={projects}
          companySettings={companySettings}
          currentUser={currentUser}
          onOpenStaffDetail={(s) => setSelectedStaffForAttendance(s)}
          onOpenNewLaborLog={onOpenNewLaborLog}
        />
      )}

      {/* Modal Add / Edit Staff */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <HardHat className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingStaff ? 'Cập Nhật Thông Tin Nhân Sự' : 'Thêm Nhân Sự Mới'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingStaff
                      ? `Chỉnh sửa hồ sơ cho ${editingStaff.name}`
                      : 'Nhập thông tin nhân sự và đơn giá lương ngày'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Họ và tên */}
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              {/* Vị trí & Điện thoại */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vị trí / Chức danh <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none bg-white font-medium"
                  >
                    <option value="Đội Trưởng Thi Công Chống Thấm">Đội Trưởng Thi Công Chống Thấm</option>
                    <option value="Thợ chính chống thấm">Thợ chính chống thấm</option>
                    <option value="Thợ Chính Khò Màng Bitum">Thợ Chính Khò Màng Bitum</option>
                    <option value="Tổ Trưởng Phun Polyurethane">Tổ Trưởng Phun Polyurethane</option>
                    <option value="Kỹ Thuật Viên Xử Lý Rò Rỉ & Nứt">Kỹ Thuật Viên Bơm Keo PU/Epoxy</option>
                    <option value="Kỹ Sư Giám Sát Hiện Trường">Kỹ Sư Giám Sát Hiện Trường</option>
                    <option value="Chỉ huy trưởng công trường">Chỉ huy trưởng công trường</option>
                    <option value="Thợ phụ thi công">Thợ phụ thi công</option>
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-medium"
                  />
                </div>
              </div>

              {/* Lương ngày (VNĐ/ngày) */}
              <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-900">
                    Lương ngày (VNĐ/ngày) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs font-extrabold text-emerald-700">
                    {formatCurrency(dailyWage)} / ngày
                  </span>
                </div>

                <div className="relative">
                  <Banknote className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    required
                    step="10000"
                    min="0"
                    placeholder="Ví dụ: 450000"
                    value={dailyWage || ''}
                    onChange={(e) => setDailyWage(Number(e.target.value) || 0)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-emerald-200 bg-white text-xs font-bold text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none"
                  />
                </div>

                {/* Quick Selection Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium py-0.5">Chọn nhanh:</span>
                  {quickWageOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setDailyWage(opt)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${
                        dailyWage === opt
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {new Intl.NumberFormat('vi-VN').format(opt)} đ
                    </button>
                  ))}
                </div>
              </div>

              {/* Công trình phân công / Trạng thái */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Công trình phân công / Trạng thái
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đang tại Vincom Mega Mall hoặc Sẵn sàng nhận dự án mới"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#0c59be] hover:bg-[#094ca7] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    'Đang lưu...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{editingStaff ? 'Lưu thay đổi' : 'Lưu nhân sự'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal View & Edit Attendance Details for specific staff */}
      {selectedStaffForAttendance && (
        <StaffAttendanceDetailModal
          isOpen={Boolean(selectedStaffForAttendance)}
          onClose={() => setSelectedStaffForAttendance(null)}
          staffMember={selectedStaffForAttendance}
          laborLogs={laborLogs}
          projects={projects}
          onUpdateLaborLog={onUpdateLaborLog}
          onDeleteLaborLog={onDeleteLaborLog}
          onAddLaborLog={onAddLaborLog}
        />
      )}
    </div>
  );
};
