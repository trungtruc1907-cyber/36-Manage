import React from 'react';
import { X, HelpCircle, Phone, Mail, FileText, CheckCircle2 } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Trung Tâm Hỗ Trợ Kỹ Thuật</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-600">
          <p className="leading-relaxed">
            Hệ thống hỗ trợ quản lý định mức thi công chống thấm, xuất nhập vật tư và tổng hợp nhật ký công trường đa chi nhánh.
          </p>

          <div className="space-y-3 bg-blue-50/60 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block text-xs">Hotline Hỗ Trợ 24/7:</span>
                <span className="text-blue-700 font-semibold">0915 586 234</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block text-xs">Email Kỹ Thuật:</span>
                <span className="text-blue-700 font-semibold">support@waterproofing36.vn</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block text-xs">Tài Liệu Hướng Dẫn:</span>
                <span className="text-slate-600">docs.waterproofing36.vn</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-[#0c59be] text-white font-bold rounded-xl text-xs hover:bg-[#094ca7] cursor-pointer"
          >
            Đóng cửa sổ hỗ trợ
          </button>
        </div>
      </div>
    </div>
  );
};
