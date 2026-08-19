import React, { useState, useRef, useMemo } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  Check,
  X,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import { MaterialItem } from '../types';
import {
  downloadMaterialsTemplateExcel,
  parseAndValidateMaterialsExcel,
  ParsedExcelResult,
  ParsedMaterialRow,
} from '../utils/materialExportUtils';

interface ImportMaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingMaterials: MaterialItem[];
  onImportComplete: (
    importedItems: MaterialItem[],
    strategy: 'upsert' | 'addOnly' | 'replace'
  ) => Promise<void>;
}

export const ImportMaterialsModal: React.FC<ImportMaterialsModalProps> = ({
  isOpen,
  onClose,
  existingMaterials,
  onImportComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ParsedExcelResult | null>(null);
  const [importStrategy, setImportStrategy] = useState<'upsert' | 'addOnly' | 'replace'>('upsert');
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'update' | 'error'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setFile(null);
    setParseResult(null);
    setSearchTerm('');
    setFilterStatus('all');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileProcess = async (selectedFile: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsParsing(true);
    try {
      const result = await parseAndValidateMaterialsExcel(selectedFile, existingMaterials);
      setParseResult(result);
    } catch (err: any) {
      console.error('Failed to parse Excel file:', err);
      alert('Không thể đọc file Excel. Vui lòng kiểm tra file có đúng định dạng .xlsx, .xls hoặc .csv không!');
      handleReset();
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      handleFileProcess(f);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      handleFileProcess(f);
    }
  };

  const handleToggleRowSelection = (tempId: string) => {
    if (!parseResult) return;
    setParseResult({
      ...parseResult,
      rows: parseResult.rows.map((r) =>
        r.tempId === tempId ? { ...r, selected: !r.selected } : r
      ),
    });
  };

  const handleToggleSelectAll = (select: boolean) => {
    if (!parseResult) return;
    setParseResult({
      ...parseResult,
      rows: parseResult.rows.map((r) =>
        r.status !== 'error' ? { ...r, selected: select } : r
      ),
    });
  };

  // Filtered rows for preview table
  const previewRows = useMemo(() => {
    if (!parseResult) return [];
    return parseResult.rows.filter((r) => {
      // Status filter
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchName = (r.name || '').toLowerCase().includes(query);
        const matchCode = (r.code || '').toLowerCase().includes(query);
        const matchBrand = (r.brand || '').toLowerCase().includes(query);
        const matchCat = (r.category || '').toLowerCase().includes(query);
        if (!matchName && !matchCode && !matchBrand && !matchCat) return false;
      }
      return true;
    });
  }, [parseResult, filterStatus, searchTerm]);

  const selectedCount = useMemo(() => {
    if (!parseResult) return 0;
    return parseResult.rows.filter((r) => r.selected && r.status !== 'error').length;
  }, [parseResult]);

  if (!isOpen) return null;

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val) + ' đ';

  const handleExecuteImport = async () => {
    if (!parseResult) return;

    const selectedValidRows = parseResult.rows.filter((r) => r.selected && r.status !== 'error');
    if (selectedValidRows.length === 0) {
      alert('Chưa có mặt hàng hợp lệ nào được chọn để nhập vào kho!');
      return;
    }

    if (importStrategy === 'replace') {
      const confirmed = window.confirm(
        `CẢNH BÁO: Chế độ "Ghi đè thay thế toàn bộ" sẽ XÓA toàn bộ ${existingMaterials.length} mặt hàng hiện có và thay bằng ${selectedValidRows.length} mặt hàng từ file Excel. Bạn có chắc chắn muốn thực hiện?`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      const itemsToProcess: MaterialItem[] = selectedValidRows.map((r) => ({
        id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        itemType: r.itemType || 'Hàng hóa',
        category: r.category || 'Vật tư chống thấm',
        code: r.code,
        name: r.name,
        brand: r.brand || 'Chống Thấm 36',
        price: r.price || 0,
        defaultPrice: r.price || 0,
        costPrice: r.costPrice || 0,
        stockQty: r.stockQty || 0,
        unit: r.unit || 'Bộ',
        description: r.description || '',
        minStock: r.minStock || 5,
        updatedAt: new Date().toISOString(),
      }));

      await onImportComplete(itemsToProcess, importStrategy);
      onClose();
    } catch (err: any) {
      console.error('Import execution error:', err);
      alert('Đã xảy ra lỗi khi lưu vào cơ sở dữ liệu. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".xlsx, .xls, .csv"
          className="hidden"
        />

        {/* MODAL HEADER */}
        <div className="bg-linear-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white px-6 py-4.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Nhập Dữ Liệu Vật Tư Từ File Excel</span>
                <span className="text-[11px] font-semibold bg-emerald-500/40 text-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300/30">
                  Chuẩn 10 Cột
                </span>
              </h3>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Đọc, kiểm tra tính hợp lệ và đồng bộ danh mục vật tư chống thấm vào kho
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadMaterialsTemplateExcel}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/25 transition-all cursor-pointer shadow-2xs"
              title="Tải file Excel mẫu 10 cột chuẩn"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file mẫu (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50">
          {/* STEP 1: If no parsed result, show upload dropzone */}
          {!parseResult && (
            <div className="space-y-5">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
                  dragOver
                    ? 'border-emerald-500 bg-emerald-50/70 scale-[0.99]'
                    : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 bg-white'
                }`}
              >
                <div className="max-w-md mx-auto flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-inner">
                    {isParsing ? (
                      <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                    ) : (
                      <Upload className="w-8 h-8 text-emerald-600" />
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mb-1">
                    {isParsing ? 'Đang đọc và kiểm tra file Excel...' : 'Kéo thả file Excel vào đây hoặc click để duyệt file'}
                  </h4>
                  <p className="text-xs text-slate-500 mb-5">
                    Hỗ trợ các định dạng <strong>.xlsx, .xls, .csv</strong> (Kích thước tối đa 15MB)
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={isParsing}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Chọn file từ máy tính</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadMaterialsTemplateExcel();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Tải file Excel mẫu (.xlsx)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>10 Cột Dữ Liệu Chuẩn</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Loại hàng, Nhóm hàng, Mã hàng, Tên hàng, Thương hiệu, Giá bán, Giá vốn, Tồn kho, ĐVT, Mô tả.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs mb-1.5">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Tự Động Chuẩn Hóa</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hệ thống tự động bỏ dấu, nhận diện tên cột linh hoạt và chuyển đổi định dạng số tiền, số lượng chính xác.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-xs mb-1.5">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Xem Trước & Kiểm Soát</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Kiểm tra danh sách trước khi nạp. Cho phép chọn chế độ cập nhật giá/tồn kho hoặc chỉ thêm mới.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Confirmation */}
          {parseResult && (
            <div className="space-y-4">
              {/* Top KPI Stats & File Info Bar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{parseResult.fileName}</span>
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {parseResult.totalRows} dòng
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Đã phân tích: {parseResult.validRows} hợp lệ ({parseResult.newCount} mới, {parseResult.updateCount} cập nhật), {parseResult.errorCount} lỗi
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Chọn file khác</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadMaterialsTemplateExcel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải mẫu</span>
                  </button>
                </div>
              </div>

              {/* Import Strategy Selector */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Chế độ nhập dữ liệu vào kho:</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      importStrategy === 'upsert'
                        ? 'border-blue-500 bg-blue-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="strategy"
                      checked={importStrategy === 'upsert'}
                      onChange={() => setImportStrategy('upsert')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>🔄 Cập nhật & Bổ sung</span>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                          Khuyên dùng
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Trùng mã hàng sẽ cập nhật Giá bán & Tồn kho; Mã mới sẽ được thêm vào kho.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      importStrategy === 'addOnly'
                        ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="strategy"
                      checked={importStrategy === 'addOnly'}
                      onChange={() => setImportStrategy('addOnly')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">➕ Chỉ thêm mặt hàng mới</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Bỏ qua các mặt hàng đã có sẵn mã trong hệ thống để giữ nguyên dữ liệu cũ.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      importStrategy === 'replace'
                        ? 'border-red-500 bg-red-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="strategy"
                      checked={importStrategy === 'replace'}
                      onChange={() => setImportStrategy('replace')}
                      className="mt-0.5 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-red-800 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        <span>⚠️ Ghi đè toàn bộ kho</span>
                      </div>
                      <p className="text-[11px] text-red-600/80 mt-0.5">
                        Xóa sạch toàn bộ kho hiện tại và nạp danh sách mới từ file Excel này.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Table Toolbar (Filter & Search) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                {/* Status Badges Filter */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilterStatus('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      filterStatus === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tất cả ({parseResult.totalRows})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterStatus('new')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                      filterStatus === 'new'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    <span>✨ Thêm mới</span>
                    <span className="text-[10px] opacity-80">({parseResult.newCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterStatus('update')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                      filterStatus === 'update'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    <span>🔄 Cập nhật</span>
                    <span className="text-[10px] opacity-80">({parseResult.updateCount})</span>
                  </button>

                  {parseResult.errorCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterStatus('error')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        filterStatus === 'error'
                          ? 'bg-red-600 text-white'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      <span>⚠️ Lỗi</span>
                      <span className="text-[10px] opacity-80">({parseResult.errorCount})</span>
                    </button>
                  )}
                </div>

                {/* Search in preview */}
                <div className="flex items-center gap-2">
                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm trong danh sách..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleSelectAll(true)}
                      className="px-2 py-1 text-emerald-700 hover:bg-emerald-50 rounded font-semibold cursor-pointer"
                    >
                      Chọn hết
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => handleToggleSelectAll(false)}
                      className="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded font-semibold cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>
              </div>

              {/* PREVIEW TABLE */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider z-10 border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <span className="sr-only">Chọn</span>
                        </th>
                        <th className="p-3 w-28">Trạng thái</th>
                        <th className="p-3 w-28">Mã hàng</th>
                        <th className="p-3">Tên hàng / Vật tư</th>
                        <th className="p-3 w-36">Nhóm hàng</th>
                        <th className="p-3 w-28">Thương hiệu</th>
                        <th className="p-3 w-28 text-right">Giá bán</th>
                        <th className="p-3 w-24 text-right">Giá vốn</th>
                        <th className="p-3 w-20 text-center">Tồn kho</th>
                        <th className="p-3 w-16 text-center">ĐVT</th>
                        <th className="p-3 min-w-[140px]">Mô tả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-normal">
                      {previewRows.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="p-8 text-center text-slate-400">
                            Không tìm thấy dòng nào phù hợp với bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        previewRows.map((row) => (
                          <tr
                            key={row.tempId}
                            className={`transition-colors ${
                              row.status === 'error'
                                ? 'bg-red-50/40 text-red-800'
                                : row.selected
                                ? 'hover:bg-emerald-50/30'
                                : 'opacity-60 bg-slate-50/50'
                            }`}
                          >
                            <td className="p-3 text-center">
                              {row.status !== 'error' ? (
                                <input
                                  type="checkbox"
                                  checked={row.selected}
                                  onChange={() => handleToggleRowSelection(row.tempId)}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                              )}
                            </td>

                            <td className="p-3">
                              {row.status === 'new' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <Sparkles className="w-3 h-3" />
                                  <span>Mới</span>
                                </span>
                              )}
                              {row.status === 'update' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                  <RefreshCw className="w-3 h-3" />
                                  <span>Cập nhật</span>
                                </span>
                              )}
                              {row.status === 'error' && (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200"
                                  title={row.errorMsg}
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>{row.errorMsg || 'Lỗi'}</span>
                                </span>
                              )}
                            </td>

                            <td className="p-3 font-mono font-bold text-slate-800">
                              {row.code}
                            </td>

                            <td className="p-3 font-medium text-slate-900">
                              {row.name}
                            </td>

                            <td className="p-3 text-slate-600 text-[11px]">
                              {row.category}
                            </td>

                            <td className="p-3 text-slate-600">
                              {row.brand}
                            </td>

                            <td className="p-3 text-right font-bold text-slate-900">
                              {formatCurrency(row.price)}
                            </td>

                            <td className="p-3 text-right text-slate-500">
                              {formatCurrency(row.costPrice)}
                            </td>

                            <td className="p-3 text-center font-bold text-slate-900">
                              {row.stockQty}
                            </td>

                            <td className="p-3 text-center font-semibold text-slate-700">
                              {row.unit}
                            </td>

                            <td className="p-3 text-[11px] text-slate-500 max-w-[200px] truncate" title={row.description}>
                              {row.description || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="text-xs text-slate-600">
            {parseResult ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">Đã chọn {selectedCount} mặt hàng</span>
                <span className="text-slate-400">•</span>
                <span>Chế độ: <strong>{importStrategy === 'upsert' ? 'Cập nhật & Bổ sung' : importStrategy === 'addOnly' ? 'Chỉ thêm mới' : 'Ghi đè thay thế toàn bộ'}</strong></span>
              </div>
            ) : (
              <span>Vui lòng tải file Excel mẫu để đảm bảo đúng định dạng 10 cột dữ liệu.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>

            {parseResult && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isSubmitting || selectedCount === 0}
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang lưu vào Firebase...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Tiến hành nhập {selectedCount} mặt hàng</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
