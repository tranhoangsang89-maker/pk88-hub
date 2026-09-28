import React, { useState } from 'react';
import { Staff, UserRole } from '../types';
import { MOCK_STAFF } from '../lib/mockData';
import { Lock, Phone, KeyRound, ShieldCheck, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (staff: Staff) => void;
  onGuestLookup?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, onGuestLookup }) => {
  const [phone, setPhone] = useState('0888003205'); // Default Admin Sang phone for fast testing
  const [password, setPassword] = useState('123456');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Find staff by phone number
    const foundStaff = MOCK_STAFF.find((s) => s.phone.trim() === phone.trim());

    if (!foundStaff) {
      setErrorMsg('Số điện thoại không tồn tại trên hệ thống Phụ Kiện 88.');
      return;
    }

    if (password !== '123456') {
      setErrorMsg('Mật khẩu không chính xác. (Mặc định test: 123456)');
      return;
    }

    onLoginSuccess(foundStaff);
  };

  const quickLogins = [
    { label: 'Ngô Hồng Thao (Founder)', phone: '0777888688', role: 'Founder' },
    { label: 'Trần Hoàng Sang (Admin)', phone: '0888003205', role: 'Admin System' },
    { label: 'Nguyễn Văn Minh (Quản lý)', phone: '0912345678', role: 'Quản Lý Shop' },
    { label: 'Phạm Thị Mỹ (Bán hàng)', phone: '0977112233', role: 'Nhân Viên Quầy' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-card bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Top Glow Background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Logo & Header */}
        <div className="text-center pb-6 mb-6 border-b border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 text-white font-extrabold text-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-500/30">
            88
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">ĐĂNG NHẬP PHÂN QUYỀN</h2>
          <p className="text-xs text-slate-400 mt-1">Hệ Thống Vận Hành Tự Động Hóa Chuỗi Phụ Kiện 88</p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">Số điện thoại đăng nhập:</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập SĐT nhân sự (VD: 0888003205)"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-rose-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">Mật khẩu xác thực:</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu (Mặc định: 123456)"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-rose-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 text-xs transition-all cursor-pointer active:scale-95"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>XÁC THỰC VÀO HỆ THỐNG</span>
          </button>
        </form>

        {/* Quick Login Shortcuts for Demo testing */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block mb-2 text-center uppercase tracking-wider">
            Chọn tài khoản Đăng Nhập mẫu (Fast Test)
          </span>
          <div className="grid grid-cols-2 gap-2">
            {quickLogins.map((ql, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPhone(ql.phone);
                  setPassword('123456');
                }}
                className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all group"
              >
                <div className="text-[11px] font-bold text-slate-200 group-hover:text-rose-400 transition-colors">
                  {ql.label}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">{ql.phone}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Guest / Customer Lookup Shortcut */}
        {onGuestLookup && (
          <div className="mt-4 pt-4 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={onGuestLookup}
              className="w-full py-2.5 px-4 bg-slate-950/50 hover:bg-slate-800 text-cyan-400 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              Bạn là Khách hàng? Bấm tra cứu QR tại đây →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
