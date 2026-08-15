import React, { useState } from 'react';
import {
  Archive,
  Plus,
  Search,
  Layers,
  ArrowUpRight,
  PackageCheck,
  Database,
  X,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import { MaterialItem } from '../types';

interface MaterialsViewProps {
  materials: MaterialItem[];
  onOpenNewExport: () => void;
  onAddMaterial?: (newMat: MaterialItem) => Promise<void> | void;
  onDeleteMaterial?: (id: string) => Promise<void> | void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  materials,
  onOpenNewExport,
  onAddMaterial,
  onDeleteMaterial,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Màng chống thấm xi măng dẻo');
  const [unit, setUnit] = useState('Bộ');
  const [defaultPrice, setDefaultPrice] = useState<number>(500000);
  const [stockQty, setStockQty] = useState<number>(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = materials.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !onAddMaterial) return;

    setIsSubmitting(true);
    const newMat: MaterialItem = {
      id: `mat_${Date.now()}`,
      name: name.trim(),
      category: category.trim(),
      unit: unit.trim(),
      defaultPrice: Number(defaultPrice) || 0,
      stockQty: Number(stockQty) || 0,
    };

    await onAddMaterial(newMat);
    setName('');
    setIsSubmitting(false);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Danh Mục Vật Tư & Kho Hàng
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Database className="w-3 h-3" />
              Firebase Firestore ({materials.length})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý định mức vật liệu chống thấm và số lượng tồn kho tự động đồng bộ thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onAddMaterial && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Thêm vật tư</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenNewExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Tạo phiếu xuất vật tư</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm vật tư, phân loại hoặc mã sản phẩm..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none shadow-2xs"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Tên Vật Tư / Sản Phẩm</th>
                <th className="py-3 px-4">Phân Loại Chống Thấm</th>
                <th className="py-3 px-4 text-center">ĐVT</th>
                <th className="py-3 px-4 text-right">Đơn Giá Định Mức</th>
                <th className="py-3 px-4 text-center">Tồn Kho Hiện Tại</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                {onDeleteMaterial && <th className="py-3 px-4 text-center">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((mat) => (
                <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>
                      <span>{mat.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{mat.category}</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-slate-700">{mat.unit}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                    {formatCurrency(mat.defaultPrice)} đ
                  </td>
                  <td className="py-3.5 px-4 text-center font-extrabold text-blue-700">
                    {mat.stockQty} {mat.unit}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <PackageCheck className="w-3 h-3" />
                      <span>Sẵn sàng</span>
                    </span>
                  </td>
                  {onDeleteMaterial && (
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteMaterial(mat.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                        title="Xóa vật tư"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={onDeleteMaterial ? 7 : 6} className="py-10 text-center text-slate-400 text-xs">
                    Không tìm thấy vật tư phù hợp trong cơ sở dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Material Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Thêm Vật Tư Mới Vào Firebase</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên vật tư / sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Quicseal 104S - 21Kg (Bộ)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phân loại chống thấm
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Màng chống thấm xi măng dẻo"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đơn vị tính
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Bộ, Bao, Cuộn..."
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đơn giá (VNĐ)
                  </label>
                  <input
                    type="number"
                    required
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số lượng tồn
                  </label>
                  <input
                    type="number"
                    required
                    value={stockQty}
                    onChange={(e) => setStockQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang lưu vào Firebase...' : 'Lưu vật tư'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
