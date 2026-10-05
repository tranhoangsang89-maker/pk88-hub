import React from 'react';
import { UserRole } from '../types';
import { ShieldCheck, UserCog, Wrench, ShoppingBag, User, Cpu } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, onRoleChange }) => {
  const roles: { role: UserRole; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
    {
      role: 'founder',
      label: 'Founder (Ngô Hồng Thao)',
      icon: <ShieldCheck className="w-4 h-4 text-rose-400" />,
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      desc: 'Báo cáo điều hành toàn chuỗi & Cảnh báo đỏ'
    },
    {
      role: 'admin',
      label: 'Admin Dự Án (Trần Hoàng Sang)',
      icon: <Cpu className="w-4 h-4 text-cyan-400" />,
      color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      desc: 'Toàn quyền cấu hình AI Automation & Hệ thống'
    },
    {
      role: 'manager',
      label: 'Quản Lý Shop',
      icon: <UserCog className="w-4 h-4 text-purple-400" />,
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      desc: 'Xem báo cáo chi nhánh, kho & duyệt công'
    },
    {
      role: 'sales',
      label: 'Nhân Viên Quầy',
      icon: <ShoppingBag className="w-4 h-4 text-emerald-400" />,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      desc: 'Chấm công GPS & Tạo phiếu dịch vụ'
    },
    {
      role: 'customer',
      label: 'Khách Hàng (QR)',
      icon: <User className="w-4 h-4 text-sky-400" />,
      color: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      desc: 'Giao diện quét QR tra cứu bảo hành'
    }
  ];

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-4 py-2.5 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Giao diện Đang Test:</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5 w-full sm:w-auto">
          {roles.map((r) => (
            <button
              key={r.role}
              onClick={() => onRoleChange(r.role)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                currentRole === r.role
                  ? `${r.color} shadow-lg shadow-black/20 ring-1 ring-white/10 font-bold`
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title={r.desc}
            >
              {r.icon}
              <span>{r.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
