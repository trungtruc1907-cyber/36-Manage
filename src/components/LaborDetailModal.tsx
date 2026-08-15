import React, { useState } from 'react';
import { X, Users, Calendar, Plus, Check } from 'lucide-react';
import { LaborDailyLog } from '../types';

interface LaborDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  laborLogs: LaborDailyLog[];
  onAddLaborLog: (log: LaborDailyLog) => void;
}

export const LaborDetailModal: React.FC<LaborDetailModalProps> = ({
  isOpen,
  onClose,
  laborLogs,
  onAddLaborLog,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [date, setDate] = useState('17/08');
  const [dayOfWeek, setDayOfWeek] = useState('T2');
  const [mainWorkers, setMainWorkers] = useState(3);
  const [helperWorkers, setHelperWorkers] = useState(1);
  const [cost, setCost] = useState(1600000);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: LaborDailyLog = {
      date,
      dayOfWeek,
      mainWorkers,
      helperWorkers,
      totalWorkdays: mainWorkers + helperWorkers,
      totalCost: Number(cost) || (mainWorkers * 400000 + helperWorkers * 300000),
      notes: notes || 'Thi công chống thấm',
    };
    onAddLaborLog(newLog);
    setShowAddForm(false);
    setNotes('');
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN').format(v);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Chi Tiết Nhật Ký Nhân Công</h3>
              <p className="text-xs text-slate-400 font-medium">Bảng theo dõi chấm công 7 ngày qua</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Add form toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Danh sách ngày thi công ({laborLogs.length} ngày)
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold hover:bg-blue-100 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Chấm công ngày mới</span>
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAdd} className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3">
              <h4 className="text-xs font-bold text-blue-900">Nhập nhật ký chấm công</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">Ngày</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="17/08"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">Thứ</label>
                  <input
                    type="text"
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    placeholder="T2"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">Thợ chính</label>
                  <input
                    type="number"
                    value={mainWorkers}
                    onChange={(e) => setMainWorkers(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">Thợ phụ</label>
                  <input
                    type="number"
                    value={helperWorkers}
                    onChange={(e) => setHelperWorkers(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">Chi phí nhân công (VNĐ)</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">Nội dung công việc</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Hạng mục thi công trong ngày"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0c59be] text-white text-xs font-bold rounded-lg hover:bg-[#094ca7] flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu chấm công</span>
                </button>
              </div>
            </form>
          )}

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Ngày & Thứ</th>
                  <th className="py-2.5 px-3 text-center">Thợ chính</th>
                  <th className="py-2.5 px-3 text-center">Thợ phụ</th>
                  <th className="py-2.5 px-3 text-center">Tổng công</th>
                  <th className="py-2.5 px-3 text-right">Chi phí (VNĐ)</th>
                  <th className="py-2.5 px-3">Hạng mục thi công</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {laborLogs.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-bold text-slate-800">
                      {row.date} ({row.dayOfWeek})
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-slate-700">{row.mainWorkers}</td>
                    <td className="py-2.5 px-3 text-center font-medium text-slate-700">{row.helperWorkers}</td>
                    <td className="py-2.5 px-3 text-center font-extrabold text-blue-700">
                      {row.totalWorkdays} Công
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                      {formatCurrency(row.totalCost)} đ
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 truncate max-w-[200px]" title={row.notes}>
                      {row.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Tổng 7 ngày: <strong>{laborLogs.reduce((s, i) => s + i.totalWorkdays, 0)} Công</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
