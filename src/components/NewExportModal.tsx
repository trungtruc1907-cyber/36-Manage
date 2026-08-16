import React, { useState } from 'react';
import { X, PackagePlus, CheckCircle2 } from 'lucide-react';
import { ConstructionProject, ExportedGood, MaterialItem } from '../types';

interface NewExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ConstructionProject[];
  materials: MaterialItem[];
  onAddExport: (item: ExportedGood) => void;
  initialProjectName?: string;
  initialMaterialId?: string;
}

export const NewExportModal: React.FC<NewExportModalProps> = ({
  isOpen,
  onClose,
  projects,
  materials,
  onAddExport,
  initialProjectName,
  initialMaterialId,
}) => {
  const [selectedMaterialId, setSelectedMaterialId] = useState(
    initialMaterialId || materials[0]?.id || ''
  );
  const [selectedProjectName, setSelectedProjectName] = useState(
    initialProjectName || projects[0]?.name || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [recipient, setRecipient] = useState('Chỉ huy công trường');
  const [unitPrice, setUnitPrice] = useState<number>(
    materials[0]?.price || materials[0]?.defaultPrice || 720000
  );

  React.useEffect(() => {
    if (initialProjectName) {
      setSelectedProjectName(initialProjectName);
    } else if (projects.length > 0 && !selectedProjectName) {
      setSelectedProjectName(projects[0].name);
    }
  }, [initialProjectName, isOpen, projects]);

  React.useEffect(() => {
    if (initialMaterialId) {
      setSelectedMaterialId(initialMaterialId);
      const found = materials.find((m) => m.id === initialMaterialId);
      if (found) {
        setUnitPrice(found.price || found.defaultPrice || 0);
      }
    } else if (materials.length > 0 && !selectedMaterialId) {
      setSelectedMaterialId(materials[0].id);
      setUnitPrice(materials[0].price || materials[0].defaultPrice || 0);
    }
  }, [initialMaterialId, isOpen, materials]);

  if (!isOpen) return null;

  const handleMaterialChange = (matId: string) => {
    setSelectedMaterialId(matId);
    const found = materials.find((m) => m.id === matId);
    if (found) {
      setUnitPrice(found.price || found.defaultPrice || 0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mat = materials.find((m) => m.id === selectedMaterialId);
    const proj = projects.find((p) => p.name === selectedProjectName);

    if (!mat) return;

    const newExport: ExportedGood = {
      id: `exp-${Date.now()}`,
      materialName: mat.name,
      projectName: selectedProjectName || 'Công trình mới',
      projectCode: proj?.code || 'WP-01',
      quantity: Number(quantity) || 1,
      unit: mat.unit,
      totalPrice: (Number(quantity) || 1) * (Number(unitPrice) || mat.defaultPrice),
      date: new Date().toISOString().split('T')[0],
      recipient: recipient || 'Đội thi công',
    };

    onAddExport(newExport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Tạo Phiếu Xuất Kho Vật Tư</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chọn Vật Tư / Vật Liệu <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedMaterialId}
              onChange={(e) => handleMaterialChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none bg-white font-medium"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.code ? `[${m.code}] ` : ''}{m.name} — {m.brand || 'Chống Thấm 36'} (Tồn: {m.stockQty} {m.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Xuất Đến Công Trình <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedProjectName}
              onChange={(e) => setSelectedProjectName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none bg-white font-medium"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} ({p.partner})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số lượng xuất</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Đơn giá (VNĐ)</label>
              <input
                type="number"
                min="0"
                step="10000"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none font-semibold text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Người nhận / Tổ thi công</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="VD: Chỉ huy công trường / Đội trưởng Nguyễn Văn A"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          {/* Total preview */}
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">Tổng tiền xuất kho:</span>
            <span className="text-sm font-extrabold text-blue-700">
              {new Intl.NumberFormat('vi-VN').format(quantity * unitPrice)} đ
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận xuất hàng</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
