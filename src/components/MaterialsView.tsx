import React, { useState } from 'react';
import { Archive, Plus, Search, Layers, ArrowUpRight, PackageCheck } from 'lucide-react';
import { MaterialItem } from '../types';

interface MaterialsViewProps {
  materials: MaterialItem[];
  onOpenNewExport: () => void;
}

export const MaterialsView: React.FC<MaterialsViewProps> = ({ materials, onOpenNewExport }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = materials.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Danh Mục Vật Tư & Kho Hàng</h2>
          <p className="text-xs text-slate-500 mt-0.5">Quản lý định mức vật liệu chống thấm và số lượng tồn kho</p>
        </div>

        <button
          type="button"
          onClick={onOpenNewExport}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Tạo phiếu xuất vật tư</span>
        </button>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((mat) => (
                <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
