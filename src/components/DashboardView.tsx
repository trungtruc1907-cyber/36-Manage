import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronDown,
  Users,
  Archive,
  BarChart2,
  TrendingUp,
  Image as ImageIcon,
  ChevronRight,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ConstructionProject, ExportedGood, LaborDailyLog } from '../types';

interface DashboardViewProps {
  exportedGoods: ExportedGood[];
  laborLogs: LaborDailyLog[];
  projects: ConstructionProject[];
  onOpenLaborDetail: () => void;
  onOpenNewExport: () => void;
  onSelectProjectFilter?: (projectName: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  exportedGoods,
  laborLogs,
  onOpenLaborDetail,
  onOpenNewExport,
}) => {
  // Time range selector
  const [timeRange, setTimeRange] = useState<'7days' | '14days' | '30days' | 'month'>('7days');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  // Chart mode
  const [chartMetric, setChartMetric] = useState<'workdays' | 'cost'>('workdays');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  // Bottom filter states
  const [goodsTab, setGoodsTab] = useState<'revenue' | 'quantity' | 'by_project'>('revenue');
  const [topLimit, setTopLimit] = useState<number>(20);
  const [showTopDropdown, setShowTopDropdown] = useState(false);

  // Format currency helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val);
  };

  // Filtered goods
  const filteredGoods = useMemo(() => {
    let list = [...exportedGoods];

    if (goodsTab === 'revenue') {
      list.sort((a, b) => b.totalPrice - a.totalPrice);
    } else if (goodsTab === 'quantity') {
      list.sort((a, b) => b.quantity - a.quantity);
    } else if (goodsTab === 'by_project') {
      list.sort((a, b) => a.projectName.localeCompare(b.projectName));
    }

    return list.slice(0, topLimit);
  }, [exportedGoods, goodsTab, topLimit]);

  // Overall calculations
  const totalWorkdays = useMemo(() => {
    return laborLogs.reduce((sum, item) => sum + item.totalWorkdays, 0);
  }, [laborLogs]);

  const totalLaborCost = useMemo(() => {
    return laborLogs.reduce((sum, item) => sum + item.totalCost, 0);
  }, [laborLogs]);

  const totalMaterialsExportedValue = useMemo(() => {
    return exportedGoods.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [exportedGoods]);

  const totalExportItemCount = useMemo(() => {
    return exportedGoods.length;
  }, [exportedGoods]);

  // Format data for chart
  const chartData = useMemo(() => {
    return laborLogs.map((log) => ({
      name: `${log.date}\n${log.dayOfWeek}`,
      displayLabel: `${log.date} ${log.dayOfWeek}`,
      date: log.date,
      dayOfWeek: log.dayOfWeek,
      workdays: log.totalWorkdays,
      cost: log.totalCost,
      mainWorkers: log.mainWorkers,
      helperWorkers: log.helperWorkers,
      notes: log.notes,
    }));
  }, [laborLogs]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Left: Time Range Dropdown */}
        <div className="relative inline-block text-left">
          <button
            type="button"
            id="time-range-dropdown-btn"
            onClick={() => setShowTimeDropdown(!showTimeDropdown)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>
              {timeRange === '7days' && '7 ngày qua'}
              {timeRange === '14days' && '14 ngày qua'}
              {timeRange === '30days' && '30 ngày qua'}
              {timeRange === 'month' && 'Tháng này'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {showTimeDropdown && (
            <div className="origin-top-left absolute left-0 mt-1.5 w-44 rounded-xl shadow-lg bg-white ring-1 ring-black/5 divide-y divide-slate-100 z-30 focus:outline-none">
              <div className="py-1">
                {[
                  { id: '7days', label: '7 ngày qua' },
                  { id: '14days', label: '14 ngày qua' },
                  { id: '30days', label: '30 ngày qua' },
                  { id: 'month', label: 'Tháng này' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setTimeRange(opt.id as any);
                      setShowTimeDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                      timeRange === opt.id
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right summary pill & Export button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="quick-export-material-btn"
            onClick={onOpenNewExport}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Xuất vật tư</span>
          </button>

          <div
            id="summary-badge-pill"
            className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#e8f1fd] text-[#1967d2] text-xs font-semibold tracking-tight shadow-2xs"
          >
            <span>{laborLogs.length} nhật ký</span>
            <span className="mx-2 text-blue-300 font-normal">•</span>
            <span>{totalExportItemCount} vật tư xuất</span>
          </div>
        </div>
      </div>

      {/* Top 2 Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Nhân công */}
        <div
          id="metric-card-labor"
          className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-blue-500 shadow-xs relative overflow-hidden transition-all hover:shadow-md"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Nhân công</h2>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#b91c1c] tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              {totalWorkdays}
            </span>
            <span className="text-base font-bold text-slate-700">Công</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            ≈ {formatCurrency(totalLaborCost)} đ
          </p>
        </div>

        {/* Card 2: Vật liệu xuất */}
        <div
          id="metric-card-materials"
          className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs relative overflow-hidden transition-all hover:shadow-md border-t-2 border-t-emerald-500"
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Archive className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Vật liệu xuất</h2>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#dc2626] tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              {formatCurrency(totalMaterialsExportedValue)}
            </span>
            <span className="text-base font-bold text-slate-700">VNĐ</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            {totalExportItemCount} mặt hàng xuất
          </p>
        </div>
      </div>

      {/* Middle Section: Biểu đồ biến đổi nhân công */}
      <div
        id="chart-card-labor-trend"
        className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              Biểu đồ biến đổi nhân công
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Theo 7 ngày qua</p>
          </div>

          <button
            type="button"
            id="view-labor-detail-link"
            onClick={onOpenLaborDetail}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer pt-0.5"
          >
            <span>Chi tiết</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Toggle Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pt-1">
          {/* Metric switch */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-full">
            <button
              type="button"
              id="chart-switch-workdays"
              onClick={() => setChartMetric('workdays')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                chartMetric === 'workdays'
                  ? 'bg-[#1351b4] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Số công
            </button>
            <button
              type="button"
              id="chart-switch-cost"
              onClick={() => setChartMetric('cost')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                chartMetric === 'cost'
                  ? 'bg-[#1351b4] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chi phí (VNĐ)
            </button>
          </div>

          {/* Chart Type Toggle */}
          <div className="inline-flex p-1 bg-slate-100 rounded-full border border-slate-200/60">
            <button
              type="button"
              id="chart-type-bar"
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-[#1351b4] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Biểu đồ cột"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="chart-type-line"
              onClick={() => setChartType('line')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                chartType === 'line'
                  ? 'bg-[#1351b4] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Biểu đồ đường"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-[220px] sm:h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="displayLabel"
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  domain={[0, chartMetric === 'workdays' ? 20 : 3000000]}
                  ticks={
                    chartMetric === 'workdays'
                      ? [0, 10, 20]
                      : [0, 1000000, 2000000, 3000000]
                  }
                  tickFormatter={(val) => {
                    if (chartMetric === 'workdays') return `${val} c`;
                    if (val === 0) return '0';
                    return `${val / 1000000}tr`;
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                          <p className="font-bold text-blue-300">
                            {data.date} ({data.dayOfWeek})
                          </p>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Tổng công:</span>
                            <span className="font-bold text-white">{data.workdays} Công</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Chi phí:</span>
                            <span className="font-bold text-emerald-400">
                              {formatCurrency(data.cost)} đ
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 border-t border-slate-800 pt-1 mt-1 truncate max-w-[200px]">
                            {data.notes}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey={chartMetric === 'workdays' ? 'workdays' : 'cost'}
                  fill="#0c5ec7"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                />
              </BarChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="displayLabel"
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  domain={[0, chartMetric === 'workdays' ? 20 : 3000000]}
                  ticks={
                    chartMetric === 'workdays'
                      ? [0, 10, 20]
                      : [0, 1000000, 2000000, 3000000]
                  }
                  tickFormatter={(val) => {
                    if (chartMetric === 'workdays') return `${val} c`;
                    if (val === 0) return '0';
                    return `${val / 1000000}tr`;
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                          <p className="font-bold text-blue-300">
                            {data.date} ({data.dayOfWeek})
                          </p>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Tổng công:</span>
                            <span className="font-bold text-white">{data.workdays} Công</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-300">
                            <span>Chi phí:</span>
                            <span className="font-bold text-emerald-400">
                              {formatCurrency(data.cost)} đ
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={chartMetric === 'workdays' ? 'workdays' : 'cost'}
                  stroke="#0c5ec7"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0c5ec7', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#1d4ed8' }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section: Hàng hóa theo công trình */}
      <div
        id="goods-by-project-section"
        className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs"
      >
        {/* Title */}
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            Hàng hóa theo công trình
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Lượng hàng hoá đã xuất trong 7 ngày qua
          </p>
        </div>

        {/* Sub-Filters and Top Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {/* Tabs: Doanh thu / Số lượng / Theo công trình */}
          <div className="inline-flex p-1 bg-slate-100 rounded-full">
            <button
              type="button"
              id="goods-tab-revenue"
              onClick={() => setGoodsTab('revenue')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                goodsTab === 'revenue'
                  ? 'bg-[#1351b4] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Doanh thu
            </button>
            <button
              type="button"
              id="goods-tab-quantity"
              onClick={() => setGoodsTab('quantity')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                goodsTab === 'quantity'
                  ? 'bg-[#1351b4] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Số lượng
            </button>
            <button
              type="button"
              id="goods-tab-by-project"
              onClick={() => setGoodsTab('by_project')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                goodsTab === 'by_project'
                  ? 'bg-[#1351b4] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Theo công trình
            </button>
          </div>

          {/* Top 20 Dropdown */}
          <div className="relative">
            <button
              type="button"
              id="goods-top-limit-dropdown-btn"
              onClick={() => setShowTopDropdown(!showTopDropdown)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span>Top {topLimit}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showTopDropdown && (
              <div className="origin-top-right absolute right-0 mt-1.5 w-28 rounded-xl shadow-lg bg-white ring-1 ring-black/5 divide-y divide-slate-100 z-30 focus:outline-none">
                <div className="py-1">
                  {[5, 10, 20, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setTopLimit(num);
                        setShowTopDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                        topLimit === num
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Top {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Goods List Cards */}
        <div className="space-y-2.5">
          {filteredGoods.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Archive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">Không tìm thấy hàng hóa xuất cho danh mục này</p>
            </div>
          ) : (
            filteredGoods.map((item, idx) => (
              <div
                key={item.id || idx}
                id={`good-item-row-${idx}`}
                className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50/20 transition-all"
              >
                {/* Left: Thumbnail & Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Thumbnail Box */}
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-5 h-5 opacity-90" />
                  </div>

                  {/* Name and Tags */}
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      {item.materialName}
                    </h4>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-[#e2edff] text-blue-700 text-[11px] font-medium truncate max-w-[140px] sm:max-w-[200px]">
                        {item.projectName}
                      </span>
                      <span className="text-slate-300 text-xs">•</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Total Price */}
                <div className="text-right flex-shrink-0 pl-3">
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                    {formatCurrency(item.totalPrice)} đ
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
