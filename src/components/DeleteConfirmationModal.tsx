import React from 'react';
import { AlertTriangle, Trash2, X, AlertCircle } from 'lucide-react';

export interface DeleteModalItemInfo {
  title: string;
  itemType: 'project' | 'material' | 'staff' | 'export' | 'labor' | 'other';
  itemName: string;
  itemCode?: string;
  warningDetails?: string[];
  dangerMessage?: string;
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  itemInfo: DeleteModalItemInfo | null;
  isDeleting?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemInfo,
  isDeleting = false,
}) => {
  if (!isOpen || !itemInfo) return null;

  const getItemTypeLabel = (type: DeleteModalItemInfo['itemType']) => {
    switch (type) {
      case 'project':
        return 'công trình';
      case 'material':
        return 'vật tư';
      case 'staff':
        return 'nhân sự';
      case 'export':
        return 'phiếu xuất kho';
      case 'labor':
        return 'nhật ký chấm công';
      default:
        return 'mục này';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-rose-50/80 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-rose-700">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-rose-900">
                {itemInfo.title || `Xác nhận xóa ${getItemTypeLabel(itemInfo.itemType)}`}
              </h3>
              <p className="text-[11px] text-rose-600 font-medium">Hành động này sẽ xóa dữ liệu trên hệ thống</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Target Item Name Banner */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            {itemInfo.itemCode && (
              <span className="inline-block font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {itemInfo.itemCode}
              </span>
            )}
            <div className="font-bold text-slate-900 text-sm leading-snug">{itemInfo.itemName}</div>
          </div>

          {/* Relationship Warning Details */}
          {itemInfo.warningDetails && itemInfo.warningDetails.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span>Dữ liệu liên quan phát hiện được:</span>
              </div>
              <ul className="space-y-1 pl-5 list-disc text-slate-700 text-[11px]">
                {itemInfo.warningDetails.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Danger notice */}
          <div className="flex items-start gap-2 text-slate-500 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
            <span>
              {itemInfo.dangerMessage ||
                `Dữ liệu sẽ được xóa khỏi cơ sở dữ liệu. Bạn có chắc chắn muốn thực hiện?`}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200/80 bg-white border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={async () => {
              await onConfirm();
            }}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Đang xóa...' : 'Xác Nhận Xóa'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
