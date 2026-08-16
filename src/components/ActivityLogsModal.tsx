import React, { useState, useMemo } from 'react';
import {
  Bell,
  X,
  Search,
  Trash2,
  Package,
  Calendar,
  Building2,
  Archive,
  Users,
  Shield,
  Settings,
  Clock,
  User,
  Filter,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { ActivityLog, ActivityCategory, UserAccount } from '../types';

interface ActivityLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActivityLog[];
  onClearLogs?: () => Promise<void> | void;
  currentUser?: UserAccount | null;
}

export const ActivityLogsModal: React.FC<ActivityLogsModalProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>('all');
  const [isClearing, setIsClearing] = useState(false);

  // Time format helper for relative display
  const getRelativeTime = (timestamp: number) => {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / 1000); // in seconds

    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 172800) return 'Hôm qua';
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchCategory =
        selectedCategory === 'all' ? true : log.category === selectedCategory;

      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        log.title.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.timeFormatted.toLowerCase().includes(q);

      return matchCategory && matchSearch;
    });
  }, [logs, selectedCategory, searchTerm]);

  // Category stats
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: logs.length,
      project: 0,
      export: 0,
      labor: 0,
      material: 0,
      staff: 0,
      auth: 0,
      settings: 0,
    };
    logs.forEach((log) => {
      if (counts[log.category] !== undefined) {
        counts[log.category]++;
      }
    });
    return counts;
  }, [logs]);

  const handleClear = async () => {
    if (!onClearLogs) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử thao tác này?')) {
      setIsClearing(true);
      await onClearLogs();
      setIsClearing(false);
    }
  };

  if (!isOpen) return null;

  // Icon and theme config for categories
  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'project':
        return {
          icon: <Building2 className="w-4 h-4 text-blue-600" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'Công trình',
        };
      case 'export':
        return {
          icon: <Package className="w-4 h-4 text-amber-600" />,
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
          label: 'Xuất kho',
        };
      case 'labor':
        return {
          icon: <Calendar className="w-4 h-4 text-emerald-600" />,
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Nhân công',
        };
      case 'material':
        return {
          icon: <Archive className="w-4 h-4 text-indigo-600" />,
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          label: 'Vật tư',
        };
      case 'staff':
        return {
          icon: <Users className="w-4 h-4 text-cyan-600" />,
          bgColor: 'bg-cyan-50',
          borderColor: 'border-cyan-200',
          badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          label: 'Nhân sự',
        };
      case 'auth':
        return {
          icon: <Shield className="w-4 h-4 text-rose-600" />,
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-200',
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
          label: 'Đăng nhập',
        };
      case 'settings':
      default:
        return {
          icon: <Settings className="w-4 h-4 text-slate-600" />,
          bgColor: 'bg-slate-100',
          borderColor: 'border-slate-200',
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
          label: 'Hệ thống',
        };
    }
  };

  return (
    <div
      id="activity-logs-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Lịch Sử Thao Tác Ứng Dụng
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {logs.length} hoạt động
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhật ký chi tiết các thao tác xuất kho, công trình, nhân công và tài khoản
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {onClearLogs && logs.length > 0 && currentUser?.role === 'admin' && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isClearing}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  title="Xóa toàn bộ lịch sử thao tác"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Xóa lịch sử</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search & Category Filter Pills */}
          <div className="mt-4 space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm theo công trình, vật tư, người thao tác..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {[
                { id: 'all', label: 'Tất cả', count: categoryCounts.all },
                { id: 'project', label: 'Công trình', count: categoryCounts.project },
                { id: 'export', label: 'Xuất kho', count: categoryCounts.export },
                { id: 'labor', label: 'Nhân công', count: categoryCounts.labor },
                { id: 'material', label: 'Vật tư', count: categoryCounts.material },
                { id: 'staff', label: 'Nhân sự', count: categoryCounts.staff },
                { id: 'auth', label: 'Đăng nhập', count: categoryCounts.auth },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id as ActivityCategory)}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === tab.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                      selectedCategory === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Body: Activity Log List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-slate-100">
          {filteredLogs.map((log) => {
            const config = getCategoryConfig(log.category);
            const relativeTime = getRelativeTime(log.timestamp);

            return (
              <div
                key={log.id}
                className="pt-3 first:pt-0 group hover:bg-slate-50/70 p-2.5 rounded-xl transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Category Icon Badge */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${config.bgColor} ${config.borderColor} mt-0.5 shadow-2xs`}
                  >
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${config.badgeColor}`}
                        >
                          {log.action}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {log.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span title={log.timeFormatted}>
                          {relativeTime || log.timeFormatted}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed break-words">
                      {log.description}
                    </p>

                    {/* Metadata Footer */}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1 text-slate-500 font-medium">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Thực hiện bởi:</span>
                        <span className="font-bold text-slate-700">{log.userName}</span>
                        {log.userRole && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase font-semibold">
                            {log.userRole}
                          </span>
                        )}
                      </div>

                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {log.timeFormatted}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="py-14 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">
                {searchTerm
                  ? `Không tìm thấy thao tác nào khớp với "${searchTerm}"`
                  : 'Chưa có lịch sử thao tác nào'}
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchTerm
                  ? 'Vui lòng thử tìm với từ khóa khác hoặc chuyển danh mục bộ lọc'
                  : 'Mọi thao tác xuất kho, ghi nhận nhân công, tạo dự án và chỉnh sửa sẽ tự động được lưu lại tại đây.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Tự động đồng bộ thời gian thực với Firebase Database</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
