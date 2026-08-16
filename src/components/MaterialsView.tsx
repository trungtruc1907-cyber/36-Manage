import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  ArrowUpRight,
  Database,
  X,
  PlusCircle,
  Trash2,
  Edit,
  FileSpreadsheet,
  Upload,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Package,
  Boxes,
  TrendingUp,
  Tag,
  Building2,
  FileText,
  DollarSign,
  History,
  Sparkles,
  ArrowUpDown,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ChevronRight,
  Info,
} from 'lucide-react';
import { MaterialItem, ExportedGood, CompanySettings } from '../types';
import {
  exportMaterialsToExcel,
} from '../utils/materialExportUtils';
import { ImportMaterialsModal } from './ImportMaterialsModal';

interface MaterialsViewProps {
  materials: MaterialItem[];
  exportedGoods?: ExportedGood[];
  companySettings?: CompanySettings;
  onOpenNewExport: () => void;
  onOpenExportForMaterial?: (material: MaterialItem) => void;
  onAddMaterial?: (newMat: MaterialItem) => Promise<void> | void;
  onUpdateMaterial?: (updatedMat: MaterialItem) => Promise<void> | void;
  onDeleteMaterial?: (id: string) => Promise<void> | void;
  onBatchSaveMaterials?: (materials: MaterialItem[]) => Promise<void> | void;
}

const COMMON_CATEGORIES = [
  'Hai thành phần gốc xi măng',
  'Gốc Polyurethane (PU)',
  'Màng chống thấm',
  'Phụ gia chống thấm',
  'Băng cản nước / Khớp nối',
  'Keo trám khe & Trương nở',
  'Vữa tự san phẳng & Sửa chữa',
  'Keo chà ron & Dán gạch',
  'Sơn lót & Tác nhân kết nối',
];

const COMMON_BRANDS = [
  'Chống Thấm 36',
  'Sika',
  'Quicseal',
  'Mapei',
  'Conmik',
  'Vitec',
  'Bestmix',
  'Maxbond',
  'Neomax',
  'Masterseal',
];

const COMMON_UNITS = ['Bộ', 'kg', 'Thùng', 'Bao', 'Cuộn', 'Can', 'Tuýp', 'Lít', 'Mét'];

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  materials,
  exportedGoods = [],
  companySettings,
  onOpenNewExport,
  onOpenExportForMaterial,
  onAddMaterial,
  onUpdateMaterial,
  onDeleteMaterial,
  onBatchSaveMaterials,
}) => {
  // State: Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedItemType, setSelectedItemType] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'out_of_stock' | 'low_stock'>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'code' | 'price_desc' | 'price_asc' | 'stock_desc' | 'stock_asc'>('code');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // State: Modals & Detail
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null);
  const [selectedMaterialDetail, setSelectedMaterialDetail] = useState<MaterialItem | null>(null);
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
  const [adjustTargetMaterial, setAdjustTargetMaterial] = useState<MaterialItem | null>(null);
  const [adjustMode, setAdjustMode] = useState<'add' | 'subtract' | 'set'>('add');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(10);
  const [adjustNote, setAdjustNote] = useState<string>('Nhập hàng bổ sung từ kho tổng');

  // State for Import Excel Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Form states for Add/Edit
  const [formItemType, setFormItemType] = useState('Hàng hóa');
  const [formCategory, setFormCategory] = useState('Hai thành phần gốc xi măng');
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('Chống Thấm 36');
  const [formPrice, setFormPrice] = useState<number>(650000);
  const [formCostPrice, setFormCostPrice] = useState<number>(0);
  const [formStockQty, setFormStockQty] = useState<number>(0);
  const [formUnit, setFormUnit] = useState('Bộ');
  const [formDescription, setFormDescription] = useState('');
  const [formMinStock, setFormMinStock] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (val: number | undefined) =>
    new Intl.NumberFormat('vi-VN').format(val || 0);

  // Open modal for Adding new material
  const handleOpenAddModal = () => {
    // Generate suggested code SP2511xxx
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const suggestedCode = `SP2511${randomSuffix}`;

    setEditingMaterial(null);
    setFormItemType('Hàng hóa');
    setFormCategory('Hai thành phần gốc xi măng');
    setFormCode(suggestedCode);
    setFormName('');
    setFormBrand('Chống Thấm 36');
    setFormPrice(650000);
    setFormCostPrice(0);
    setFormStockQty(0);
    setFormUnit('Bộ');
    setFormDescription('');
    setFormMinStock(5);
    setIsAddModalOpen(true);
  };

  // Open modal for Editing material
  const handleOpenEditModal = (mat: MaterialItem) => {
    setEditingMaterial(mat);
    setFormItemType(mat.itemType || 'Hàng hóa');
    setFormCategory(mat.category || 'Hai thành phần gốc xi măng');
    setFormCode(mat.code || '');
    setFormName(mat.name || '');
    setFormBrand(mat.brand || 'Chống Thấm 36');
    setFormPrice(mat.price || mat.defaultPrice || 0);
    setFormCostPrice(mat.costPrice || 0);
    setFormStockQty(mat.stockQty || 0);
    setFormUnit(mat.unit || 'Bộ');
    setFormDescription(mat.description || '');
    setFormMinStock(mat.minStock || 5);
    setIsAddModalOpen(true);
  };

  // Save (Create / Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);

    const payload: MaterialItem = {
      id: editingMaterial ? editingMaterial.id : `mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      itemType: formItemType.trim() || 'Hàng hóa',
      category: formCategory.trim() || 'Hai thành phần gốc xi măng',
      code: formCode.trim() || `SP${Date.now().toString().slice(-6)}`,
      name: formName.trim(),
      brand: formBrand.trim() || 'Chống Thấm 36',
      price: Number(formPrice) || 0,
      defaultPrice: Number(formPrice) || 0,
      costPrice: Number(formCostPrice) || 0,
      stockQty: Number(formStockQty) || 0,
      unit: formUnit.trim() || 'Bộ',
      description: formDescription.trim(),
      minStock: Number(formMinStock) || 5,
      updatedAt: new Date().toISOString(),
    };

    if (editingMaterial && onUpdateMaterial) {
      await onUpdateMaterial(payload);
    } else if (onAddMaterial) {
      await onAddMaterial(payload);
    }

    setIsSubmitting(false);
    setIsAddModalOpen(false);
    setEditingMaterial(null);
  };

  // Quick Stock Adjustment
  const handleOpenAdjustStock = (mat: MaterialItem) => {
    setAdjustTargetMaterial(mat);
    setAdjustMode('add');
    setAdjustQuantity(10);
    setAdjustNote('Nhập hàng bổ sung từ nhà cung cấp');
    setIsAdjustStockModalOpen(true);
  };

  const handleSaveStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetMaterial || !onUpdateMaterial) return;

    let newStock = adjustTargetMaterial.stockQty || 0;
    if (adjustMode === 'add') {
      newStock += Number(adjustQuantity) || 0;
    } else if (adjustMode === 'subtract') {
      newStock = Math.max(0, newStock - (Number(adjustQuantity) || 0));
    } else if (adjustMode === 'set') {
      newStock = Math.max(0, Number(adjustQuantity) || 0);
    }

    const updated: MaterialItem = {
      ...adjustTargetMaterial,
      stockQty: newStock,
      updatedAt: new Date().toISOString(),
    };

    await onUpdateMaterial(updated);
    setIsAdjustStockModalOpen(false);
    setAdjustTargetMaterial(null);
  };

  // Handle Excel Import completion with strategy support
  const handleImportCompleted = async (
    importedItems: MaterialItem[],
    strategy: 'upsert' | 'addOnly' | 'replace'
  ) => {
    let resultList: MaterialItem[] = [];

    if (strategy === 'replace') {
      resultList = [...importedItems];
    } else if (strategy === 'addOnly') {
      const existingCodes = new Set(
        materials.map((m) => m.code?.trim().toLowerCase()).filter(Boolean)
      );
      const existingNames = new Set(
        materials.map((m) => m.name.trim().toLowerCase()).filter(Boolean)
      );

      const newItems = importedItems.filter((item) => {
        const hasCode = item.code && existingCodes.has(item.code.trim().toLowerCase());
        const hasName = existingNames.has(item.name.trim().toLowerCase());
        return !hasCode && !hasName;
      });

      resultList = [...newItems, ...materials];
    } else {
      // Strategy: 'upsert' (Cập nhật nếu trùng mã/tên, thêm mới nếu chưa có)
      const existingMap = new Map<string, MaterialItem>();
      materials.forEach((m) => existingMap.set(m.id, { ...m }));

      const codeToIdMap = new Map<string, string>();
      const nameToIdMap = new Map<string, string>();

      materials.forEach((m) => {
        if (m.code) codeToIdMap.set(m.code.trim().toLowerCase(), m.id);
        if (m.name) nameToIdMap.set(m.name.trim().toLowerCase(), m.id);
      });

      const appendedItems: MaterialItem[] = [];

      importedItems.forEach((item) => {
        const codeKey = item.code?.trim().toLowerCase();
        const nameKey = item.name.trim().toLowerCase();
        const matchedId = (codeKey && codeToIdMap.get(codeKey)) || nameToIdMap.get(nameKey);

        if (matchedId && existingMap.has(matchedId)) {
          const current = existingMap.get(matchedId)!;
          existingMap.set(matchedId, {
            ...current,
            itemType: item.itemType || current.itemType,
            category: item.category || current.category,
            code: item.code || current.code,
            name: item.name || current.name,
            brand: item.brand || current.brand,
            price: item.price || current.price,
            defaultPrice: item.price || current.defaultPrice,
            costPrice: item.costPrice || current.costPrice,
            stockQty: item.stockQty !== undefined ? item.stockQty : current.stockQty,
            unit: item.unit || current.unit,
            description: item.description || current.description,
            updatedAt: new Date().toISOString(),
          });
        } else {
          appendedItems.push(item);
        }
      });

      resultList = [...appendedItems, ...Array.from(existingMap.values())];
    }

    if (onBatchSaveMaterials) {
      await onBatchSaveMaterials(resultList);
    } else if (onAddMaterial) {
      for (const m of resultList) {
        await onAddMaterial(m);
      }
    }
  };

  // Categories and Brands lists in current DB
  const dynamicCategories = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    COMMON_CATEGORIES.forEach((c) => set.add(c));
    return Array.from(set);
  }, [materials]);

  const dynamicBrands = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => {
      if (m.brand) set.add(m.brand);
    });
    COMMON_BRANDS.forEach((b) => set.add(b));
    return Array.from(set);
  }, [materials]);

  // Filter and Sort Logic
  const filteredAndSortedMaterials = useMemo(() => {
    return materials
      .filter((m) => {
        // Search term
        const search = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !search ||
          (m.name && m.name.toLowerCase().includes(search)) ||
          (m.code && m.code.toLowerCase().includes(search)) ||
          (m.category && m.category.toLowerCase().includes(search)) ||
          (m.brand && m.brand.toLowerCase().includes(search)) ||
          (m.description && m.description.toLowerCase().includes(search));

        // Category filter
        const matchesCategory =
          selectedCategory === 'all' || m.category === selectedCategory;

        // Brand filter
        const matchesBrand =
          selectedBrand === 'all' || m.brand === selectedBrand;

        // ItemType filter
        const matchesItemType =
          selectedItemType === 'all' || (m.itemType || 'Hàng hóa') === selectedItemType;

        // Stock status filter
        let matchesStock = true;
        const qty = m.stockQty || 0;
        const min = m.minStock || 5;
        if (stockStatusFilter === 'in_stock') {
          matchesStock = qty > 0;
        } else if (stockStatusFilter === 'out_of_stock') {
          matchesStock = qty === 0;
        } else if (stockStatusFilter === 'low_stock') {
          matchesStock = qty > 0 && qty <= min;
        }

        return matchesSearch && matchesCategory && matchesBrand && matchesItemType && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'code') {
          return (a.code || '').localeCompare(b.code || '');
        }
        if (sortBy === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'name_desc') {
          return b.name.localeCompare(a.name);
        }
        if (sortBy === 'price_desc') {
          return (b.price || b.defaultPrice || 0) - (a.price || a.defaultPrice || 0);
        }
        if (sortBy === 'price_asc') {
          return (a.price || a.defaultPrice || 0) - (b.price || b.defaultPrice || 0);
        }
        if (sortBy === 'stock_desc') {
          return (b.stockQty || 0) - (a.stockQty || 0);
        }
        if (sortBy === 'stock_asc') {
          return (a.stockQty || 0) - (b.stockQty || 0);
        }
        return 0;
      });
  }, [
    materials,
    searchTerm,
    selectedCategory,
    selectedBrand,
    selectedItemType,
    stockStatusFilter,
    sortBy,
  ]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalItems = materials.length;
    const outOfStockCount = materials.filter((m) => (m.stockQty || 0) === 0).length;
    const lowStockCount = materials.filter(
      (m) => (m.stockQty || 0) > 0 && (m.stockQty || 0) <= (m.minStock || 5)
    ).length;
    const totalStockQty = materials.reduce((sum, m) => sum + (m.stockQty || 0), 0);
    const totalSellingValue = materials.reduce(
      (sum, m) => sum + (m.stockQty || 0) * (m.price || m.defaultPrice || 0),
      0
    );
    const totalCostValue = materials.reduce(
      (sum, m) => sum + (m.stockQty || 0) * (m.costPrice || 0),
      0
    );

    return {
      totalItems,
      outOfStockCount,
      lowStockCount,
      totalStockQty,
      totalSellingValue,
      totalCostValue,
    };
  }, [materials]);

  // Helper to find export history for a specific material
  const getMaterialExportHistory = (matName: string) => {
    return exportedGoods.filter(
      (e) => e.materialName && e.materialName.toLowerCase() === matName.toLowerCase()
    );
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* TOP HEADER & ACTION TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Boxes className="w-6 h-6 text-blue-600" />
              <span>Cơ Sở Dữ Liệu Vật Tư & Hàng Hóa</span>
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Database className="w-3.5 h-3.5" />
              {materials.length} Mặt Hàng (SKU)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Import Excel */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 transition-all cursor-pointer shadow-2xs"
            title="Nhập dữ liệu danh mục từ file Excel (.xlsx, .xls, .csv)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Nhập Excel</span>
          </button>

          {/* Export Excel */}
          <button
            type="button"
            onClick={() => exportMaterialsToExcel(filteredAndSortedMaterials, companySettings)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl text-xs font-bold border border-teal-200 transition-all cursor-pointer"
            title="Xuất file Excel chuẩn 10 cột"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất Excel</span>
          </button>

          {/* Add New Material */}
          {onAddMaterial && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Thêm Vật Tư</span>
            </button>
          )}

          {/* Export Good to Project */}
          <button
            type="button"
            onClick={onOpenNewExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Xuất Kho</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total SKU */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tổng Mặt Hàng</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-900">{stats.totalItems}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Mã sản phẩm / SKU</div>
        </div>

        {/* Total Stock Units */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tổng Tồn Kho</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700">{formatCurrency(stats.totalStockQty)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Bộ, Can, Thùng, Cuộn...</div>
        </div>

        {/* Selling Value */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Giá Trị (Giá Bán)</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-800">{formatCurrency(stats.totalSellingValue)} đ</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Quy mô kho theo giá niêm yết</div>
        </div>

        {/* Cost Value */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Giá Trị (Giá Vốn)</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-indigo-800">{formatCurrency(stats.totalCostValue)} đ</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Vốn đầu tư nhập kho</div>
        </div>

        {/* Out of Stock & Low Stock Alert */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cảnh Báo Tồn</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-rose-600">{stats.outOfStockCount}</span>
            <span className="text-xs text-slate-500 font-medium">hết hàng /</span>
            <span className="text-xl font-black text-amber-600">{stats.lowStockCount}</span>
            <span className="text-xs text-slate-500 font-medium">sắp hết</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Cần tạo đơn đặt hàng thêm</div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo Tên hàng, Mã hàng (SP25...), Thương hiệu, Mô tả..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none font-medium"
            >
              <option value="all">▶ Tất cả nhóm hàng ({dynamicCategories.length})</option>
              {dynamicCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none font-medium"
            >
              <option value="all">▶ Tất cả thương hiệu</option>
              {dynamicBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none font-medium"
            >
              <option value="code">Sắp xếp: Mã hàng (A-Z)</option>
              <option value="name_asc">Sắp xếp: Tên hàng (A-Z)</option>
              <option value="name_desc">Sắp xếp: Tên hàng (Z-A)</option>
              <option value="price_desc">Sắp xếp: Giá bán (Cao → Thấp)</option>
              <option value="price_asc">Sắp xếp: Giá bán (Thấp → Cao)</option>
              <option value="stock_desc">Sắp xếp: Tồn kho (Nhiều → Ít)</option>
              <option value="stock_asc">Sắp xếp: Tồn kho (Ít → Nhiều)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="lg:col-span-1 flex items-center justify-end">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Xem dạng bảng chi tiết"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Xem dạng thẻ lưới"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-slate-500 text-[11px] font-semibold">Tình trạng tồn:</span>
          <button
            type="button"
            onClick={() => setStockStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              stockStatusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({materials.length})
          </button>
          <button
            type="button"
            onClick={() => setStockStatusFilter('in_stock')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              stockStatusFilter === 'in_stock'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50'
            }`}
          >
            Còn hàng ({materials.filter((m) => (m.stockQty || 0) > 0).length})
          </button>
          <button
            type="button"
            onClick={() => setStockStatusFilter('out_of_stock')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              stockStatusFilter === 'out_of_stock'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/50'
            }`}
          >
            Hết hàng (=0) ({stats.outOfStockCount})
          </button>
          <button
            type="button"
            onClick={() => setStockStatusFilter('low_stock')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              stockStatusFilter === 'low_stock'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/50'
            }`}
          >
            Tồn thấp (≤5) ({stats.lowStockCount})
          </button>

          {(searchTerm || selectedCategory !== 'all' || selectedBrand !== 'all' || stockStatusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedBrand('all');
                setStockStatusFilter('all');
              }}
              className="ml-auto text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* 10-COLUMN DATA TABLE VIEW (Exact Match with Image Reference) */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3.5 whitespace-nowrap">Loại hàng</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Nhóm hàng</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Mã hàng</th>
                  <th className="py-3 px-4 min-w-[240px]">Tên hàng</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Thương hiệu</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Giá bán</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">Giá vốn</th>
                  <th className="py-3 px-3.5 text-center whitespace-nowrap">Tồn kho</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">ĐVT</th>
                  <th className="py-3 px-4 min-w-[200px]">Mô tả</th>
                  <th className="py-3 px-3 text-center sticky right-0 bg-slate-100/90 shadow-xs">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedMaterials.map((mat) => {
                  const stock = mat.stockQty || 0;
                  const min = mat.minStock || 5;
                  const isOutOfStock = stock === 0;
                  const isLowStock = stock > 0 && stock <= min;

                  return (
                    <tr
                      key={mat.id}
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedMaterialDetail(mat)}
                    >
                      {/* 1. Loại hàng */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {mat.itemType || 'Hàng hóa'}
                        </span>
                      </td>

                      {/* 2. Nhóm hàng */}
                      <td className="py-3 px-3.5 font-medium text-slate-700 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                          {mat.category}
                        </span>
                      </td>

                      {/* 3. Mã hàng */}
                      <td className="py-3 px-3.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {mat.code || '-'}
                      </td>

                      {/* 4. Tên hàng */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="hover:text-blue-600 transition-colors">{mat.name}</span>
                        </div>
                      </td>

                      {/* 5. Thương hiệu */}
                      <td className="py-3 px-3.5 text-slate-700 font-semibold whitespace-nowrap">
                        {mat.brand || 'Chống Thấm 36'}
                      </td>

                      {/* 6. Giá bán */}
                      <td className="py-3 px-3.5 text-right font-extrabold text-slate-900 whitespace-nowrap">
                        {formatCurrency(mat.price || mat.defaultPrice)} đ
                      </td>

                      {/* 7. Giá vốn */}
                      <td className="py-3 px-3.5 text-right font-semibold text-slate-500 whitespace-nowrap">
                        {formatCurrency(mat.costPrice || 0)} đ
                      </td>

                      {/* 8. Tồn kho */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                            isOutOfStock
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isLowStock
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {stock}
                        </span>
                      </td>

                      {/* 9. ĐVT */}
                      <td className="py-3 px-3 text-center font-bold text-slate-700 whitespace-nowrap">
                        {mat.unit}
                      </td>

                      {/* 10. Mô tả */}
                      <td className="py-3 px-4 text-slate-500 text-[11px] line-clamp-2 max-w-xs">
                        {mat.description || '-'}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-3 text-center whitespace-nowrap sticky right-0 bg-white group-hover:bg-blue-50/40 shadow-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {/* Quick stock adjust */}
                          <button
                            type="button"
                            onClick={() => handleOpenAdjustStock(mat)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer"
                            title="Điều chỉnh số lượng tồn kho"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(mat)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          {onDeleteMaterial && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Xác nhận xóa vật tư "${mat.name}"?`)) {
                                  onDeleteMaterial(mat.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                              title="Xóa vật tư"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredAndSortedMaterials.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-14 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Boxes className="w-10 h-10 mb-2 opacity-40 text-slate-400" />
                        <p className="text-sm font-bold text-slate-600">Không tìm thấy vật tư phù hợp</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Thử tìm kiếm với từ khóa khác hoặc nhấn "Xóa bộ lọc"
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedMaterials.map((mat) => {
            const stock = mat.stockQty || 0;
            const min = mat.minStock || 5;
            const isOutOfStock = stock === 0;
            const isLowStock = stock > 0 && stock <= min;

            return (
              <div
                key={mat.id}
                onClick={() => setSelectedMaterialDetail(mat)}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {mat.code || 'NO-CODE'}
                      </span>
                      <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {mat.brand || 'Chống Thấm 36'}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isOutOfStock
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : isLowStock
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isOutOfStock ? 'Hết hàng' : `Tồn: ${stock} ${mat.unit}`}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {mat.name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{mat.category}</p>

                  {mat.description && (
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      {mat.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10.5px] text-slate-400 font-semibold uppercase">Giá bán niêm yết</div>
                    <div className="text-base font-extrabold text-blue-700">
                      {formatCurrency(mat.price || mat.defaultPrice)} đ
                      <span className="text-xs text-slate-500 font-normal"> / {mat.unit}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleOpenAdjustStock(mat)}
                      className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200"
                      title="Chỉnh tồn kho"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(mat)}
                      className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200"
                      title="Sửa vật tư"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL DRAWER / MODAL FOR SELECTED MATERIAL */}
      {selectedMaterialDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      {selectedMaterialDetail.code}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                      {selectedMaterialDetail.itemType || 'Hàng hóa'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{selectedMaterialDetail.name}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMaterialDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: 10 Fields Grid */}
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Nhóm hàng</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedMaterialDetail.category}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Thương hiệu</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedMaterialDetail.brand || 'Chống Thấm 36'}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Đơn vị tính (ĐVT)</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedMaterialDetail.unit}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Đơn giá bán niêm yết</span>
                  <p className="text-sm font-extrabold text-blue-700 mt-0.5">
                    {formatCurrency(selectedMaterialDetail.price || selectedMaterialDetail.defaultPrice)} đ
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Đơn giá vốn</span>
                  <p className="text-xs font-bold text-slate-600 mt-0.5">
                    {formatCurrency(selectedMaterialDetail.costPrice || 0)} đ
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Số lượng tồn kho</span>
                  <p className="text-sm font-extrabold text-emerald-700 mt-0.5">
                    {selectedMaterialDetail.stockQty} {selectedMaterialDetail.unit}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedMaterialDetail.description && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Mô tả quy cách & Hướng dẫn sử dụng</span>
                  <p className="text-xs text-slate-700 leading-relaxed">{selectedMaterialDetail.description}</p>
                </div>
              )}

              {/* Export History for this material */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-blue-600" />
                    <span>Lịch sử đã xuất kho đến các công trình</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {getMaterialExportHistory(selectedMaterialDetail.name).length} lần xuất
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                      <tr>
                        <th className="py-2 px-3">Ngày xuất</th>
                        <th className="py-2 px-3">Công trình tiếp nhận</th>
                        <th className="py-2 px-3 text-center">Số lượng</th>
                        <th className="py-2 px-3 text-right">Thành tiền</th>
                        <th className="py-2 px-3">Người nhận</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getMaterialExportHistory(selectedMaterialDetail.name).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-slate-600">{item.date}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{item.projectName}</td>
                          <td className="py-2 px-3 text-center font-bold text-blue-700">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-800">
                            {formatCurrency(item.totalPrice)} đ
                          </td>
                          <td className="py-2 px-3 text-slate-600">{item.recipient}</td>
                        </tr>
                      ))}
                      {getMaterialExportHistory(selectedMaterialDetail.name).length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                            Vật tư này chưa có phiếu xuất kho nào
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMaterialDetail(null);
                    handleOpenAdjustStock(selectedMaterialDetail);
                  }}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 transition-all cursor-pointer"
                >
                  Điều chỉnh tồn kho
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMaterialDetail(null);
                    handleOpenEditModal(selectedMaterialDetail);
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Chỉnh sửa
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMaterialDetail(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMaterialDetail(null);
                    if (onOpenExportForMaterial) {
                      onOpenExportForMaterial(selectedMaterialDetail);
                    } else {
                      onOpenNewExport();
                    }
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Tạo phiếu xuất ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT MATERIAL (Full 10 Fields) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingMaterial ? 'Chỉnh Sửa Thông Tin Vật Tư' : 'Thêm Mặt Hàng / Vật Tư Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Row 1: Loại hàng & Nhóm hàng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Loại hàng <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formItemType}
                    onChange={(e) => setFormItemType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none bg-white font-medium"
                  >
                    <option value="Hàng hóa">Hàng hóa</option>
                    <option value="Dịch vụ">Dịch vụ thi công</option>
                    <option value="Vật tư phụ">Vật tư phụ / Tiêu hao</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nhóm hàng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="cat-suggestions"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Hai thành phần gốc xi măng..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                  <datalist id="cat-suggestions">
                    {COMMON_CATEGORIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Row 2: Mã hàng & Thương hiệu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã hàng (Code) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="Ví dụ: SP2511175, vitecxp02 HS..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thương hiệu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="brand-suggestions"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="Chống Thấm 36, Sika..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-medium"
                  />
                  <datalist id="brand-suggestions">
                    {COMMON_BRANDS.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Row 3: Tên hàng */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên hàng / Vật tư chống thấm <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Quicseal 104s - bộ 40kg"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              {/* Row 4: Giá bán, Giá vốn, ĐVT, Tồn kho */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giá bán (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giá vốn (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ĐVT <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="unit-suggestions"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="Bộ, kg, Thùng..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-center font-bold focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                  <datalist id="unit-suggestions">
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số lượng tồn
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formStockQty}
                    onChange={(e) => setFormStockQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-extrabold text-blue-700 text-center focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Mô tả */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả / Quy cách / Định mức ứng dụng
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú quy cách đóng gói (vd: 25kg bột + 15kg lỏng), định mức thi công..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    'Đang lưu...'
                  ) : editingMaterial ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Cập nhật vật tư</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Lưu vào cơ sở dữ liệu</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUICK STOCK ADJUSTMENT */}
      {isAdjustStockModalOpen && adjustTargetMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Điều Chỉnh Số Lượng Tồn Kho</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustStockModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="text-xs font-bold text-slate-800">{adjustTargetMaterial.name}</div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>Mã: <strong className="font-mono text-slate-700">{adjustTargetMaterial.code}</strong></span>
                <span>Tồn hiện tại: <strong className="text-blue-700 font-extrabold">{adjustTargetMaterial.stockQty} {adjustTargetMaterial.unit}</strong></span>
              </div>
            </div>

            <form onSubmit={handleSaveStockAdjustment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Loại điều chỉnh</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustMode('add')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      adjustMode === 'add'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    + Nhập thêm
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustMode('subtract')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      adjustMode === 'subtract'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    - Xuất trừ
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustMode('set')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      adjustMode === 'set'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    = Đặt lại tồn
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số lượng thay đổi ({adjustTargetMaterial.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 text-center focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lý do điều chỉnh</label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="Nhập hàng NCC, Kiểm kê hao hụt, Thu hồi..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustStockModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Xác nhận cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE IMPORT EXCEL MODAL */}
      <ImportMaterialsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingMaterials={materials}
        onImportComplete={handleImportCompleted}
      />
    </div>
  );
};
