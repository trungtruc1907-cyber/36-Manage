import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Check,
  Building2,
  Calendar as CalendarIcon,
  PlusCircle,
  Receipt,
  User,
  Plus,
  Minus,
  Package,
} from 'lucide-react';
import { ConstructionProject, ExportedGood, MaterialItem } from '../types';

interface NewExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ConstructionProject[];
  materials: MaterialItem[];
  onAddExport: (item: ExportedGood) => void;
  onAddBatchExport?: (items: ExportedGood[]) => void;
  onAddMaterial?: (material: MaterialItem) => void;
  initialProjectName?: string;
  initialMaterialId?: string;
}

interface SelectedItemConfig {
  quantity: number;
  unitPrice: number;
}

export const NewExportModal: React.FC<NewExportModalProps> = ({
  isOpen,
  onClose,
  projects,
  materials,
  onAddExport,
  onAddBatchExport,
  onAddMaterial,
  initialProjectName,
  initialMaterialId,
}) => {
  // Date helpers
  const getTodayIso = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDateDisplay = (isoStr: string) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };

  // Form states
  const [dateIso, setDateIso] = useState<string>(getTodayIso);
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const [recipient, setRecipient] = useState('Chỉ huy công trường');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item IDs mapping to their quantities & prices
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, SelectedItemConfig>>({});

  // Temporary / custom materials added on the fly
  const [customMaterials, setCustomMaterials] = useState<MaterialItem[]>([]);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customUnit, setCustomUnit] = useState('md');
  const [customPrice, setCustomPrice] = useState<number>(50000);
  const [customQty, setCustomQty] = useState<number>(1);
  const [saveToMaterialsList, setSaveToMaterialsList] = useState(false);

  // Combine default materials and custom added materials
  const allAvailableMaterials: MaterialItem[] = useMemo(() => {
    const defaultList = materials.length > 0 ? materials : [];
    return [...defaultList, ...customMaterials];
  }, [materials, customMaterials]);

  // Reset or initialize state when opening modal
  useEffect(() => {
    if (isOpen) {
      setDateIso(getTodayIso());
      setSearchQuery('');
      setShowAddCustom(false);
      setCustomName('');
      setCustomUnit('md');
      setCustomPrice(50000);
      setCustomQty(1);

      if (initialProjectName) {
        setSelectedProjectName(initialProjectName);
      } else if (projects.length > 0) {
        setSelectedProjectName(projects[0].name);
      }

      // If opening for a specific material
      if (initialMaterialId) {
        const mat = materials.find((m) => m.id === initialMaterialId);
        if (mat) {
          const price = mat.price || mat.defaultPrice || 0;
          setSelectedItemsMap({
            [initialMaterialId]: { quantity: 1, unitPrice: price },
          });
        }
      } else {
        setSelectedItemsMap({});
      }
    }
  }, [isOpen, initialProjectName, initialMaterialId, projects, materials]);

  if (!isOpen) return null;

  // Toggle selection for a material
  const toggleMaterial = (mat: MaterialItem) => {
    setSelectedItemsMap((prev) => {
      const next = { ...prev };
      if (next[mat.id]) {
        delete next[mat.id];
      } else {
        const price = mat.price || mat.defaultPrice || 0;
        next[mat.id] = { quantity: 1, unitPrice: price };
      }
      return next;
    });
  };

  // Update quantity for a selected item
  const updateQuantity = (matId: string, newQty: number) => {
    if (newQty < 1) return;
    setSelectedItemsMap((prev) => {
      if (!prev[matId]) return prev;
      return {
        ...prev,
        [matId]: {
          ...prev[matId],
          quantity: newQty,
        },
      };
    });
  };

  // Update unit price for a selected item
  const updateUnitPrice = (matId: string, newPrice: number) => {
    setSelectedItemsMap((prev) => {
      if (!prev[matId]) return prev;
      return {
        ...prev,
        [matId]: {
          ...prev[matId],
          unitPrice: Math.max(0, newPrice),
        },
      };
    });
  };

  // Filter materials based on search query
  const filteredMaterials = allAvailableMaterials.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (m.name || '').toLowerCase().includes(q) ||
      (m.code || '').toLowerCase().includes(q) ||
      (m.unit || '').toLowerCase().includes(q) ||
      (m.category || '').toLowerCase().includes(q)
    );
  });

  const selectedCount = Object.keys(selectedItemsMap).length;

  // Total price calculation
  const totalCalculatedCost = (Object.entries(selectedItemsMap) as [string, SelectedItemConfig][]).reduce(
    (sum, [, config]) => {
      return sum + (config.quantity || 0) * (config.unitPrice || 0);
    },
    0
  );

  // Currency formatter
  const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN').format(v);

  // Handle adding custom material on the fly
  const handleAddCustomMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newMatId = `mat_temp_${Date.now()}`;
    const newMat: MaterialItem = {
      id: newMatId,
      code: `VT-${Math.floor(100 + Math.random() * 900)}`,
      name: customName.trim(),
      unit: customUnit.trim() || 'Cái',
      price: Number(customPrice) || 0,
      defaultPrice: Number(customPrice) || 0,
      stockQty: 100,
      minStock: 10,
      category: 'Phụ gia & Vật tư khác',
      description: 'Vật tư nhập nhanh ngoài danh mục',
    };

    setCustomMaterials((prev) => [...prev, newMat]);
    setSelectedItemsMap((prev) => ({
      ...prev,
      [newMatId]: {
        quantity: Number(customQty) || 1,
        unitPrice: Number(customPrice) || 0,
      },
    }));

    if (saveToMaterialsList && onAddMaterial) {
      onAddMaterial(newMat);
    }

    setCustomName('');
    setShowAddCustom(false);
  };

  // Submit export form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedEntries = Object.entries(selectedItemsMap) as [string, SelectedItemConfig][];
    if (selectedEntries.length === 0) {
      alert('Vui lòng tích chọn ít nhất 1 vật tư để xuất kho!');
      return;
    }

    const targetProjectObj = projects.find((p) => p.name === selectedProjectName);
    const targetProjectCode = targetProjectObj?.code || 'WP-01';
    const targetProjectName = selectedProjectName || 'Công trình thi công';

    const exportItemsToSave: ExportedGood[] = selectedEntries
      .map(([matId, config]) => {
        const mat = allAvailableMaterials.find((m) => m.id === matId);
        if (!mat) return null;

        const qty = Number(config.quantity) || 1;
        const price = Number(config.unitPrice) || mat.defaultPrice || 0;

        return {
          id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          materialName: mat.name,
          projectName: targetProjectName,
          projectCode: targetProjectCode,
          quantity: qty,
          unit: mat.unit || 'Cái',
          totalPrice: qty * price,
          date: dateIso,
          recipient: recipient || 'Chỉ huy công trường',
        };
      })
      .filter(Boolean) as ExportedGood[];

    if (exportItemsToSave.length === 0) return;

    if (onAddBatchExport) {
      onAddBatchExport(exportItemsToSave);
    } else {
      // Fallback single item
      for (const item of exportItemsToSave) {
        onAddExport(item);
      }
    }

    onClose();
  };

  const selectedProjObj = projects.find((p) => p.name === selectedProjectName);

  return (
    <div
      id="new-export-modal-backdrop"
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
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-sky-600 tracking-tight">
                Phiếu Xuất Nhiều Vật Tư
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Project & Recipient Bar */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {initialProjectName ? (
              <div className="flex items-center gap-2 py-1.5 px-3 bg-sky-50/70 border border-sky-200/80 rounded-xl">
                <Building2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                <span className="text-xs font-bold text-sky-900 truncate">
                  {selectedProjObj ? `[${selectedProjObj.code}] ${selectedProjObj.name}` : initialProjectName}
                </span>
              </div>
            ) : projects.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedProjectName}
                  onChange={(e) => setSelectedProjectName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:bg-white transition-all cursor-pointer truncate"
                >
                  <option value="">-- Chọn công trình nhận vật tư --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.name}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="relative">
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Người nhận / Đội thi công..."
                className="w-full px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Field: Ngày xuất (dd/MM/yyyy) with Calendar icon */}
            <div className="relative">
              <div className="border border-slate-300 rounded-2xl p-3 bg-white hover:border-sky-500 transition-colors focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-100">
                <label className="block text-[11px] font-semibold text-slate-500 -mt-5 bg-white px-1.5 w-fit ml-2">
                  Ngày xuất (dd/MM/yyyy)
                </label>
                <div className="flex items-center gap-3 mt-1">
                  <CalendarIcon className="w-5 h-5 text-sky-500 flex-shrink-0" />
                  <input
                    type="date"
                    value={dateIso}
                    onChange={(e) => setDateIso(e.target.value)}
                    required
                    className="w-full text-sm sm:text-base font-bold text-slate-800 outline-none bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-400 flex-shrink-0 pr-1">
                    {formatDateDisplay(dateIso)}
                  </span>
                </div>
              </div>
            </div>

            {/* Section: Tích chọn vật tư từ CSDL */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  Tích chọn vật tư từ CSDL:
                </span>
                {selectedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedItemsMap({})}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Bỏ chọn ({selectedCount})
                  </button>
                )}
              </div>

              {/* Search Box */}
              <div className="relative mb-3">
                <div className="flex items-center border border-slate-300 rounded-2xl px-3.5 py-2.5 bg-white focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 transition-all">
                  <Search className="w-4 h-4 text-sky-500 mr-2.5 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm tên vật tư..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Materials List with Checkboxes */}
              <div className="border border-slate-200/90 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-56 sm:max-h-64 overflow-y-auto pr-0.5 scrollbar-thin">
                {filteredMaterials.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 space-y-1">
                    <Package className="w-6 h-6 mx-auto text-slate-300" />
                    <p className="text-xs font-medium">Không tìm thấy vật tư phù hợp</p>
                  </div>
                ) : (
                  filteredMaterials.map((mat) => {
                    const isSelected = !!selectedItemsMap[mat.id];
                    const selectedConfig = selectedItemsMap[mat.id];
                    const price = mat.price || mat.defaultPrice || 0;

                    return (
                      <div
                        key={mat.id}
                        className={`p-3 transition-colors ${
                          isSelected ? 'bg-sky-50/70' : 'hover:bg-slate-50/80 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Custom Checkbox */}
                          <div
                            onClick={() => toggleMaterial(mat)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer mt-0.5 ${
                              isSelected
                                ? 'bg-sky-500 text-white shadow-2xs'
                                : 'border-2 border-slate-300 bg-white hover:border-slate-400'
                            }`}
                          >
                            {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                          </div>

                          {/* Material Details */}
                          <div className="flex-1 min-w-0">
                            <p
                              onClick={() => toggleMaterial(mat)}
                              className="text-xs sm:text-sm font-bold text-slate-900 cursor-pointer truncate"
                            >
                              {mat.name}
                            </p>
                            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                              ĐVT: {mat.unit || 'Cái'} | Giá chuẩn: {formatCurrency(price)} đ
                              {mat.stockQty !== undefined && (
                                <span className="ml-1 text-slate-400">
                                  • Tồn: {mat.stockQty} {mat.unit}
                                </span>
                              )}
                            </p>

                            {/* Quantity & Unit Price Adjuster if Selected */}
                            {isSelected && (
                              <div className="mt-2.5 pt-2 border-t border-sky-200/60 space-y-2 animate-in fade-in">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  {/* Quantity Controls */}
                                  <div className="flex items-center gap-1.5 bg-white border border-sky-300 rounded-xl p-1 shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateQuantity(mat.id, (selectedConfig?.quantity || 1) - 1)
                                      }
                                      disabled={(selectedConfig?.quantity || 1) <= 1}
                                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center disabled:opacity-40 cursor-pointer transition-colors"
                                      title="Giảm số lượng"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>

                                    <input
                                      type="number"
                                      min="1"
                                      value={selectedConfig?.quantity || 1}
                                      onChange={(e) =>
                                        updateQuantity(mat.id, Math.max(1, Number(e.target.value)))
                                      }
                                      className="w-12 text-center text-xs font-bold text-slate-800 outline-none bg-transparent"
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateQuantity(mat.id, (selectedConfig?.quantity || 1) + 1)
                                      }
                                      className="w-6 h-6 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-700 flex items-center justify-center cursor-pointer transition-colors"
                                      title="Tăng số lượng"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                    <span className="text-[11px] font-semibold text-slate-500 px-1">
                                      {mat.unit || 'Cái'}
                                    </span>
                                  </div>

                                  {/* Editable Unit Price Field */}
                                  <div className="flex items-center gap-1 bg-white border border-amber-300/80 rounded-xl px-2 py-1 shadow-2xs">
                                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">Đơn giá:</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="500"
                                      value={selectedConfig?.unitPrice ?? price}
                                      onChange={(e) =>
                                        updateUnitPrice(mat.id, Math.max(0, Number(e.target.value)))
                                      }
                                      className="w-20 text-right text-xs font-bold text-amber-900 outline-none bg-transparent"
                                      title="Nhập giá xuất kho cho vật tư này"
                                    />
                                    <span className="text-[10px] font-semibold text-amber-600">đ</span>
                                  </div>
                                </div>

                                {/* Line Total and Reset Price Helper */}
                                <div className="flex items-center justify-between text-[11px] px-0.5">
                                  {selectedConfig?.unitPrice !== price ? (
                                    <button
                                      type="button"
                                      onClick={() => updateUnitPrice(mat.id, price)}
                                      className="text-[10px] text-amber-700 hover:text-amber-900 underline cursor-pointer"
                                    >
                                      Khôi phục giá chuẩn ({formatCurrency(price)} đ)
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">
                                      Theo giá chuẩn CSDL
                                    </span>
                                  )}

                                  <div className="text-right">
                                    <span className="text-slate-500 mr-1 text-[11px]">Thành tiền:</span>
                                    <span className="text-xs font-extrabold text-sky-700">
                                      {formatCurrency(
                                        (selectedConfig?.quantity || 1) * (selectedConfig?.unitPrice ?? price)
                                      )}{' '}
                                      đ
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Button: + Thêm vật tư ngoài danh mục */}
              {!showAddCustom ? (
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(true)}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sky-600 hover:text-sky-700 cursor-pointer py-1.5 px-3 rounded-xl hover:bg-sky-50 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Thêm vật tư ngoài danh mục</span>
                  </button>
                </div>
              ) : (
                <div className="mt-3 p-3.5 bg-sky-50/60 border border-sky-200 rounded-2xl space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-900">
                      Thêm vật tư nhanh vào phiếu
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddCustom(false)}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Tên vật tư (VD: Băng keo...)"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="sm:col-span-2 px-3 py-1.5 text-xs border border-slate-200 bg-white rounded-xl outline-none focus:border-sky-500 font-medium"
                    />
                    <input
                      type="text"
                      placeholder="ĐVT (Cuộn, md...)"
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-slate-200 bg-white rounded-xl outline-none focus:border-sky-500 font-medium"
                    />
                    <input
                      type="number"
                      placeholder="Đơn giá (VNĐ)"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(Number(e.target.value))}
                      className="px-3 py-1.5 text-xs border border-slate-200 bg-white rounded-xl outline-none focus:border-sky-500 font-medium text-sky-700"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={saveToMaterialsList}
                        onChange={(e) => setSaveToMaterialsList(e.target.checked)}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <span>Lưu vào danh mục vật tư kho</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleAddCustomMaterialSubmit}
                      className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Thêm vào phiếu
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Total Summary Card */}
            <div className="bg-sky-50/90 border border-sky-200/90 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-bold text-sky-950">
                  Tổng cộng ({selectedCount} loại):
                </p>
                <p className="text-[11px] text-sky-700 font-medium mt-0.5">
                  Đã chọn {(Object.values(selectedItemsMap) as SelectedItemConfig[]).reduce((s, i) => s + (i.quantity || 0), 0)} sản phẩm
                </p>
              </div>

              <div className="text-right">
                <p className="text-base sm:text-lg font-extrabold text-sky-800">
                  {formatCurrency(totalCalculatedCost)} đ
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
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
              disabled={selectedCount === 0}
              className="flex-1 py-3.5 px-6 bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white rounded-2xl sm:rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-wide transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
            >
              {selectedCount > 0 ? `LƯU PHIẾU XUẤT (${selectedCount} LOẠI)` : 'LƯU PHIẾU XUẤT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
