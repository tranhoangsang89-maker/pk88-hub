import React, { useState } from 'react';
import { Staff, UserRole } from '../types';
import { MOCK_STAFF } from '../lib/mockData';
import { Lock, Phone, KeyRound, ShieldCheck, ArrowRight, UserCheck, AlertCircle, HelpCircle, MessageSquare, RotateCcw, CheckCircle2 } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (staff: Staff) => void;
  onGuestLookup?: () => void;
  onRecruitmentApply?: () => void;
  staffList?: Staff[];
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, onGuestLookup, onRecruitmentApply, staffList = MOCK_STAFF }) => {
  const [phone, setPhone] = useState(''); // Mặc định để trống để bảo mật
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showQuickLogins, setShowQuickLogins] = useState<boolean>(false); // Mặc định ẩn danh sách test
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // Helper lấy mật khẩu của nhân viên (ưu tiên mật khẩu cá nhân đã đổi, nếu chưa đổi thì mặc định 123456)
  const getStaffPassword = (staffPhone: string): string => {
    try {
      const stored = localStorage.getItem('pk88_passwords');
      if (stored) {
        const passMap = JSON.parse(stored);
        if (passMap && passMap[staffPhone.trim()]) {
          return passMap[staffPhone.trim()];
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc mật khẩu:', e);
    }
    return '123456';
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Find staff by phone number
    const listToSearch = staffList && staffList.length > 0 ? staffList : MOCK_STAFF;
    const foundStaff = listToSearch.find((s) => s.phone.trim() === phone.trim());

    if (!foundStaff) {
      setErrorMsg('Số điện thoại không tồn tại trên hệ thống Phụ Kiện 88.');
      return;
    }

    if (!foundStaff.isActive) {
      setErrorMsg('Tài khoản nhân sự này hiện đã thôi việc hoặc đang tạm khóa.');
      return;
    }

    const expectedPassword = getStaffPassword(foundStaff.phone);

    if (password !== expectedPassword) {
      setErrorMsg('Mật khẩu không chính xác. Vui lòng kiểm tra lại!');
      return;
    }

    onLoginSuccess(foundStaff);
  };

  const quickLogins = [
    { label: 'Ngô Hồng Thao (Founder)', phone: '0777888688', role: 'Chủ Doanh Nghiệp' },
    { label: 'Trần Hoàng Sang (Admin)', phone: '0888003205', role: 'Admin System' },
    { label: 'Phan Hoàng Khánh (HR)', phone: '0394336726', role: 'Chuyên Viên HC - NS' },
    { label: 'Thùy Dương (CHT Phú Khương)', phone: '0939998322', role: 'Quản Lý Cửa Hàng' },
    { label: 'Trung Hiếu (Kỹ Thuật Trưởng)', phone: '0939118793', role: 'Kỹ Thuật Sửa Chữa' },
    { label: 'Bích Trâm (Kế Toán VP)', phone: '0985059514', role: 'Kế Toán Trưởng' },
    { label: 'Tiểu My (Bán Hàng)', phone: '0392399534', role: 'Nhân Viên Quầy' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-card bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Top Glow Background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Logo & Header */}
        <div className="text-center pb-6 mb-6 border-b border-slate-800">
          <img 
            src="/logo-pk88.jpg" 
            alt="Phụ Kiện 88 Logo" 
            className="w-16 h-16 rounded-2xl shadow-lg shadow-amber-500/30 object-cover mx-auto mb-3 border border-slate-800"
          />
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">ĐĂNG NHẬP PHÂN QUYỀN</h2>
          <p className="text-xs text-slate-400 mt-1">Hệ Thống Vận Hành Tự Động Hóa Chuỗi Phụ Kiện 88</p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
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
                placeholder="Nhập SĐT nhân sự của bạn"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-semibold">Mật khẩu xác thực:</label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] text-amber-400/90 hover:text-amber-300 hover:underline cursor-pointer flex items-center gap-1 font-medium"
              >
                <HelpCircle className="w-3 h-3 text-amber-400" />
                <span>Quên mật khẩu?</span>
              </button>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu tài khoản"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 text-xs transition-all cursor-pointer active:scale-95"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>XÁC THỰC VÀO HỆ THỐNG</span>
          </button>
        </form>

        {/* Toggle Fast Test Login Shortcuts (Bảo Mật: Mặc định ẩn, bấm nút mới bung ra) */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-500" />
              Chế độ nội bộ:
            </span>
            <button
              type="button"
              onClick={() => setShowQuickLogins(!showQuickLogins)}
              className="text-[11px] font-bold text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{showQuickLogins ? '▲ Ẩn danh sách Test' : '▼ Bật đăng nhập Test mẫu'}</span>
            </button>
          </div>

          {showQuickLogins && (
            <div className="mt-3 animate-fade-in space-y-2">
              <div className="text-[10px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
                ⚠️ Chế độ dùng để kiểm thử nhanh phân quyền. Khi vận hành thật nên ẩn phần này.
              </div>
              <div className="grid grid-cols-2 gap-2">
                {quickLogins.map((ql, idx) => {
                  const pass = getStaffPassword(ql.phone);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPhone(ql.phone);
                        setPassword(pass);
                      }}
                      className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all group cursor-pointer"
                    >
                      <div className="text-[11px] font-bold text-slate-200 group-hover:text-amber-400 transition-colors">
                        {ql.label}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{ql.phone}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Guest / Customer Lookup & Recruitment Shortcuts */}
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-center">
          {onGuestLookup && (
            <button
              type="button"
              onClick={onGuestLookup}
              className="w-full py-2.5 px-4 bg-slate-950/50 hover:bg-slate-800 text-cyan-400 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              Bạn là Khách hàng? Bấm tra cứu QR tại đây →
            </button>
          )}

          {onRecruitmentApply && (
            <button
              type="button"
              onClick={onRecruitmentApply}
              className="w-full py-2 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              💼 Bạn muốn ứng tuyển vào PK88? Nộp hồ sơ ngay →
            </button>
          )}
        </div>
      </div>

      {/* Forgot Password Help Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/95 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-sm w-full p-6 text-xs shadow-2xl relative">
            <div className="flex items-center gap-2 text-amber-400 mb-3 font-bold text-sm">
              <HelpCircle className="w-5 h-5 flex-shrink-0" />
              <span>Hỗ Trợ Quên Mật Khẩu</span>
            </div>

            <p className="text-slate-300 leading-relaxed mb-4">
              Vì lý do an toàn dữ liệu chuỗi, nhân viên quên mật khẩu vui lòng liên hệ trực tiếp cho <strong className="text-amber-300">Admin Quản Trị</strong> hoặc <strong className="text-amber-300">Nhân Sự (HR)</strong> để được cấp lại:
            </p>

            <div className="space-y-2 mb-4 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">1. Admin Hệ Thống:</span>
                <span className="font-bold text-slate-200">Trần Hoàng Sang</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">SĐT / Zalo Admin:</span>
                <a href="tel:0888003205" className="font-mono font-bold text-emerald-400 hover:underline">0888003205</a>
              </div>
              <div className="border-t border-slate-800/80 my-1"></div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">2. Nhân Sự (HR):</span>
                <span className="font-bold text-slate-200">Phan Hoàng Khánh</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">SĐT / Zalo HR:</span>
                <a href="tel:0394336726" className="font-mono font-bold text-emerald-400 hover:underline">0394336726</a>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-4 text-[11px] text-amber-300 leading-relaxed">
              🔒 <strong>Quy định bảo mật chuỗi:</strong> Để ngăn chặn xâm nhập trái phép, hệ thống <u>không cho phép</u> tự đặt lại mật khẩu từ bên ngoài. Vui lòng nhắn tin trực tiếp cho Admin hoặc HR để được xác minh danh tính và cấp lại mật khẩu.
            </div>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all cursor-pointer"
            >
              Đã Hiểu & Đóng Cửa Sổ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
