import React, { useState } from 'react';
import { Users, UserPlus, Phone, ShieldCheck, HardHat, Award } from 'lucide-react';

export const StaffView: React.FC = () => {
  const [workers] = useState([
    { id: 1, name: 'Nguyễn Văn Hùng', role: 'Tổ trưởng / Thợ chính', phone: '0912 345 678', exp: '8 năm', status: 'Đang tại CT 923 MB 530' },
    { id: 2, name: 'Trần Văn Mạnh', role: 'Thợ chính chống thấm', phone: '0988 765 432', exp: '5 năm', status: 'Đang tại Xd Đoàn Ái Sơn' },
    { id: 3, name: 'Lê Hoàng Long', role: 'Thợ chính chống thấm', phone: '0903 112 233', exp: '4 năm', status: 'Đang tại Thế Anh' },
    { id: 4, name: 'Phạm Đức Anh', role: 'Thợ phụ thi công', phone: '0977 889 900', exp: '2 năm', status: 'Đang tại Xd Đoàn Ái Sơn' },
    { id: 5, name: 'Võ Minh Trí', role: 'Thợ phụ thi công', phone: '0934 556 677', exp: '1 năm', status: 'Đang tại 923 MB 530' },
    { id: 6, name: 'Đặng Tuấn Kiệt', role: 'Kỹ thuật / Giám sát', phone: '0945 667 788', exp: '6 năm', status: 'Tổng chỉ huy hiện trường' },
  ]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Đội Ngũ Nhân Sự & Thợ Thi Công</h2>
          <p className="text-xs text-slate-500 mt-0.5">Danh sách kỹ thuật viên, thợ lành nghề và quản lý tổ đội</p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0c59be] hover:bg-[#094ca7] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm nhân sự</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map((w) => (
          <div key={w.id} className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">
                <HardHat className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 text-sm">{w.name}</h3>
                <p className="text-xs text-blue-600 font-medium">{w.role}</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-1.5 pt-1">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{w.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-slate-400" />
                <span>Kinh nghiệm: {w.exp}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Trạng thái:</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                {w.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
