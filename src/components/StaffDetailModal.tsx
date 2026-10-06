import React from 'react';
import { Staff, Branch } from '../types';
import { 
  X, Phone, Mail, Calendar, Award, CheckCircle2, ShieldCheck, 
  MapPin, QrCode, Sparkles, User, Briefcase, Star, Zap, Activity
} from 'lucide-react';

interface StaffDetailModalProps {
  staff: Staff | null;
  branch?: Branch;
  totalHours?: number;
  totalSalary?: number;
  onClose: () => void;
}

// Curated high quality avatar placeholders for demonstration
const AVATAR_FALLBACKS: Record<string, string> = {
  s0: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', // Admin / Sang
  s1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', // Founder / Thao
  s112: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', // TP Kinh Doanh / Tuấn
  s111: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80', // Kế Toán / Phương
  s110: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80', // Marketing / Long
  s109: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80', // HR / Bích
  s101: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80', // Manager / Hải
  s102: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80', // Tech / Nam
  s104: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', // Sales / Hồng
};

export const StaffDetailModal: React.FC<StaffDetailModalProps> = ({
  staff,
  branch,
  totalHours = 176.0,
  totalSalary = 0,
  onClose,
}) => {
  if (!staff) return null;

  // Derive display values
  const staffCode = staff.code || `PK88-NV${staff.id.replace(/\D/g, '').padStart(3, '0')}`;
  const avatarUrl = staff.avatarUrl || AVATAR_FALLBACKS[staff.id] || `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.fullName)}&background=0284c7&color=fff&size=200&font-size=0.35&bold=true`;
  const roleDisplay = 
    staff.role === 'founder' ? 'Chủ Sở Hữu / Founder' :
    staff.role === 'admin' ? 'Admin & System Automation' :
    staff.role === 'sales_head' ? 'Trưởng Phòng Kinh Doanh' :
    staff.role === 'accountant' ? 'Kế Toán Trưởng' :
    staff.role === 'marketing' ? 'Chuyên Viên Marketing' :
    staff.role === 'hr' ? 'Chuyên Viên HC - NS' :
    staff.role === 'manager' ? 'Quản Lý Chi Nhánh' :
    staff.role === 'technician' ? 'Kỹ Thuật Viên Sửa Chữa' : 'Nhân Viên Bán Hàng Tại Quầy';

  const roleColor = 
    staff.role === 'founder' || staff.role === 'admin' ? 'from-purple-500 to-indigo-600 border-purple-400 text-purple-200' :
    staff.role === 'sales_head' ? 'from-amber-500 to-orange-600 border-amber-400 text-amber-200' :
    staff.role === 'accountant' ? 'from-emerald-500 to-teal-600 border-emerald-400 text-emerald-200' :
    staff.role === 'marketing' ? 'from-pink-500 to-rose-600 border-pink-400 text-pink-200' :
    staff.role === 'hr' ? 'from-sky-500 to-cyan-600 border-sky-400 text-sky-200' :
    staff.role === 'technician' ? 'from-blue-500 to-cyan-600 border-blue-400 text-blue-200' :
    'from-cyan-500 to-blue-600 border-cyan-400 text-cyan-200';

  // Mock radar competency scores
  const scores = staff.competencyScores || {
    expertise: 92,
    discipline: 96,
    attitude: 98,
    kpi: 88,
    lms: 94
  };

  const branchName = branch ? branch.name : 'Phụ Kiện 88 - Bến Tre 1 (Trụ Sở Chính)';

  // QR VietQR image URL sample
  const vietQrUrl = `https://img.vietqr.io/image/vietcombank-0671000426203-compact.png?amount=0&addInfo=${encodeURIComponent('Thuong Nong ' + staff.fullName)}&accountName=${encodeURIComponent(staff.fullName)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-500" />
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">HỒ SƠ NHÂN SỰ PHỤ KIỆN 88</h3>
              <p className="text-[10px] text-slate-400">Mã NV: <strong className="text-cyan-400 font-mono">{staffCode}</strong></p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Portrait & Personal Metadata (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="relative group rounded-2xl overflow-hidden border-2 border-cyan-500/30 shadow-lg bg-slate-950">
              <img
                src={avatarUrl}
                alt={staff.fullName}
                className="w-full h-64 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.fullName)}&background=0284c7&color=fff&size=200&bold=true`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              
              <div className="absolute bottom-3 left-3 right-3">
                <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-gradient-to-r ${roleColor} shadow-md uppercase tracking-wider mb-1`}>
                  {roleDisplay}
                </span>
                <h2 className="text-lg font-black text-white leading-tight drop-shadow-md">{staff.fullName}</h2>
              </div>
            </div>

            {/* Quick Metadata Card */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Chi nhánh:
                </span>
                <span className="font-bold text-cyan-300 text-right text-[11px] truncate max-w-[160px]">
                  {branchName.replace('Phụ Kiện 88 - ', '')}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> Điện thoại:
                </span>
                <a href={`tel:${staff.phone}`} className="font-mono font-bold text-emerald-400 hover:underline">
                  {staff.phone}
                </a>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-400" /> Email làm việc:
                </span>
                <span className="font-mono text-[11px] text-slate-300">
                  {staff.email || `${staff.id}@phukien88.vn`}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" /> Ngày vào làm:
                </span>
                <span className="font-semibold text-slate-200">
                  {staff.joinDate || '01/03/2024'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Trạng thái hồ sơ:
                </span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  ĐỦ HỒ SƠ
                </span>
              </div>
            </div>

            {/* Quick Action Button */}
            <a
              href={`tel:${staff.phone}`}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4 fill-slate-950" />
              <span>GỌI ĐIỆN HOẶC ZALO NHANH</span>
            </a>
          </div>

          {/* Right Column: Competency Radar & Rewards QR (7 cols) */}
          <div className="md:col-span-7 space-y-4 flex flex-col justify-between">
            {/* Competency Assessment (5 Dimensions) */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Đánh Giá Năng Lực 5 Chiều</span>
                </h4>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  Xếp loại: XUẤT SẮC
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Metric 1: Expertise */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400 font-semibold">1. Chuyên Môn & Kỹ Thuật (Phụ Kiện / Sửa Chữa)</span>
                    <span className="font-mono font-extrabold text-cyan-400">{scores.expertise}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000" style={{ width: `${scores.expertise}%` }} />
                  </div>
                </div>

                {/* Metric 2: Discipline */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400 font-semibold">2. Kỷ Luật Chấm Công GPS Geofence</span>
                    <span className="font-mono font-extrabold text-emerald-400">{scores.discipline}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000" style={{ width: `${scores.discipline}%` }} />
                  </div>
                </div>

                {/* Metric 3: Attitude */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400 font-semibold">3. Thái Độ Phục Vụ Khách Hàng</span>
                    <span className="font-mono font-extrabold text-amber-400">{scores.attitude}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-1000" style={{ width: `${scores.attitude}%` }} />
                  </div>
                </div>

                {/* Metric 4: KPI Sales */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400 font-semibold">4. Doanh Số Bán Lẻ & KPI Chi Nhánh</span>
                    <span className="font-mono font-extrabold text-purple-400">{scores.kpi}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000" style={{ width: `${scores.kpi}%` }} />
                  </div>
                </div>

                {/* Metric 5: LMS Training */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400 font-semibold">5. Tiến Độ Đào Tạo LMS 60 Ngày</span>
                    <span className="font-mono font-extrabold text-sky-400">{scores.lms}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${scores.lms}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Rewards Card (Thưởng Nóng Vietcombank) */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border border-cyan-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
                  <h5 className="text-xs font-black text-slate-100 uppercase">THƯỞNG NÓNG VIETQR</h5>
                </div>
                <p className="text-[11px] text-slate-300">
                  Ngân hàng: <strong className="text-cyan-300">Vietcombank</strong>
                </p>
                <p className="text-[11px] text-slate-300">
                  Số tài khoản: <strong className="font-mono text-amber-400 font-bold">0671000426203</strong>
                </p>
                <p className="text-[10px] text-slate-400">Quét mã QR bên cạnh để thưởng nóng trực tiếp qua Internet Banking.</p>
              </div>

              <div className="w-24 h-24 p-1.5 bg-white rounded-2xl flex-shrink-0 shadow-lg border border-cyan-400/50 flex flex-col items-center justify-center">
                <img
                  src={vietQrUrl}
                  alt="Mã QR Vietcombank Thưởng Nóng"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback visual QR icon
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <QrCode className="w-12 h-12 text-slate-900 hidden" />
              </div>
            </div>

            {/* Work & Attendance Stats */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
                <div className="text-[10px] text-slate-400 font-semibold mb-0.5">TỔNG GIỜ LÀM THÁNG NÀY</div>
                <div className="text-lg font-black text-emerald-400 font-mono">{totalHours.toFixed(1)}h</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
                <div className="text-[10px] text-slate-400 font-semibold mb-0.5">LƯƠNG TẠM TÍNH (THÁNG)</div>
                <div className="text-lg font-black text-rose-400 font-mono">
                  {totalSalary > 0 ? totalSalary.toLocaleString('vi-VN') + ' đ' : 'Cố định'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
