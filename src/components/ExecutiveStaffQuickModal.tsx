import React, { useState, useEffect } from 'react';
import { Branch, Staff, AttendanceRecord, LeaveRequest, ShiftAssignment } from '../types';
import { 
  X, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Clock, 
  Calendar, 
  Cake, 
  Mail, 
  ShieldCheck, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  Copy, 
  CheckCheck,
  Building2,
  Gift,
  ExternalLink,
  UserCheck,
  Activity
} from 'lucide-react';

export interface LiveStaffModalItem {
  staff: Staff;
  branch: Branch;
  branchId: string;
  assignment?: ShiftAssignment;
  record?: AttendanceRecord | null;
  leave?: LeaveRequest;
  statusType: 'WORKING' | 'WORKING_LATE' | 'ON_BREAK' | 'ON_LEAVE' | 'NOT_CHECKED_IN' | 'SHIFT_ENDED' | 'WAITING' | 'UNSCHEDULED';
  statusLabel: string;
  statusBadgeClass: string;
  statusDotClass: string;
  checkInTime?: string;
  checkOutTime?: string;
  lateMinutes?: number;
  isCrossBranch?: boolean;
}

interface ExecutiveStaffQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffItem: LiveStaffModalItem | null;
  branches: Branch[];
}

// Fallback ảnh chân dung chuẩn
const AVATAR_FALLBACKS: Record<string, string> = {
  s0: '/tranhoangsang-admin.png',
  s1: '/ngohongthao-founder.jpg',
  '7526b7c5-12ac-442b-90a6-b68b9d624364': '/ngohongthao-founder.jpg',
  'e30be7a4-e5f6-47c0-8f27-d3f25d3adff8': '/tranhoangsang-admin.png',
  '0777888688': '/ngohongthao-founder.jpg',
  '0888003205': '/tranhoangsang-admin.png',
  s112: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  s111: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  s110: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
  s109: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
  s101: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
};

// Helper dịch Chức Vụ sang Tiếng Việt chuẩn mực
const formatRoleVN = (role?: string) => {
  switch (role?.toLowerCase()) {
    case 'founder': return 'Founder / Chủ Chuỗi';
    case 'admin': return 'Quản Trị Viên (Admin)';
    case 'manager': return 'Quản Lý Chi Nhánh / Cửa Hàng Trưởng';
    case 'hr': return 'Chuyên Viên Tuyển Dụng & HC-NS';
    case 'sales': return 'Nhân Viên Bán Hàng Tại Quầy';
    case 'technician': return 'Kỹ Thuật Viên Sửa Chữa';
    case 'accountant': return 'Kế Toán';
    case 'warehouse_accountant': return 'Kế Toán Kho';
    case 'marketing': return 'Chuyên Viên Marketing';
    case 'media': return 'Chuyên Viên Media / Quay Dựng';
    case 'sales_head': return 'Trưởng Phòng Kinh Doanh';
    default: return role || 'Nhân Viên';
  }
};

// Helper màu sắc chức vụ
const getRoleBadgeStyle = (role?: string) => {
  switch (role?.toLowerCase()) {
    case 'founder':
      return 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400/40';
    case 'admin':
      return 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400/40';
    case 'manager':
      return 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-300/40 font-black';
    case 'sales_head':
      return 'bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-950 border-yellow-300/40 font-black';
    case 'hr':
      return 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-400/40';
    case 'marketing':
      return 'bg-gradient-to-r from-violet-600 to-purple-600 text-white border-violet-400/40';
    case 'media':
      return 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-400/40';
    case 'accountant':
    case 'warehouse_accountant':
      return 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-teal-400/40';
    case 'technician':
      return 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-400/40';
    case 'sales':
    default:
      return 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/40';
  }
};

export const ExecutiveStaffQuickModal: React.FC<ExecutiveStaffQuickModalProps> = ({
  isOpen,
  onClose,
  staffItem,
  branches
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Đóng modal bằng phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !staffItem) return null;

  const { staff, branch, assignment, record, leave, statusLabel, statusBadgeClass, statusDotClass, isCrossBranch } = staffItem;

  // Lấy chi nhánh gốc của nhân sự
  const homeBranch = branches.find(b => b.id === staff.branchId) || branch;
  const homeBranchName = homeBranch.name.replace('Phụ Kiện 88 - ', '');
  const workingBranchName = branch.name.replace('Phụ Kiện 88 - ', '');

  // Lấy link avatar
  const avatarUrl = staff.avatarUrl || 
    AVATAR_FALLBACKS[staff.id] || 
    (staff.phone && AVATAR_FALLBACKS[staff.phone]) || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.fullName)}&background=0284c7&color=fff&size=300&bold=true`;

  // Kiểm tra ngày sinh nhật hôm nay
  let isBirthdayToday = false;
  if (staff.birthDate) {
    try {
      const today = new Date();
      const m = today.getMonth() + 1;
      const d = today.getDate();
      if (staff.birthDate.includes('-')) {
        const parts = staff.birthDate.split('-');
        if (parts.length >= 3) {
          isBirthdayToday = parseInt(parts[1], 10) === m && parseInt(parts[2], 10) === d;
        }
      } else if (staff.birthDate.includes('/')) {
        const parts = staff.birthDate.split('/');
        if (parts.length >= 2) {
          isBirthdayToday = parseInt(parts[1], 10) === m && parseInt(parts[0], 10) === d;
        }
      }
    } catch {
      isBirthdayToday = false;
    }
  }

  // Số điện thoại xử lý
  const rawPhone = staff.phone || '';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const callUrl = cleanPhone ? `tel:${cleanPhone}` : '#';
  const zaloUrl = cleanPhone ? `https://zalo.me/${cleanPhone}` : '#';

  const handleCopyPhone = () => {
    if (!cleanPhone) return;
    navigator.clipboard.writeText(cleanPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in select-none">
      <div 
        className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/40 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto border-t-2 border-t-cyan-400"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-100 uppercase tracking-wide">
                  HỒ SƠ NHÂN SỰ & LIÊN HỆ
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-950 text-cyan-400 border border-slate-800">
                  Read-only
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Mã NV: <strong className="text-cyan-400 font-mono">{staff.code || 'PK88'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Top Section: Avatar Portrait & Basic Metadata */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Portrait Image Container */}
            <div className="relative w-32 h-40 sm:w-36 sm:h-44 rounded-2xl overflow-hidden border-2 border-cyan-500/40 shadow-xl bg-slate-950 shrink-0">
              <img
                src={avatarUrl}
                alt={staff.fullName}
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.fullName)}&background=0284c7&color=fff&size=200&bold=true`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

              {/* Birthday Badge */}
              {isBirthdayToday && (
                <div className="absolute top-2 left-2 right-2 flex items-center justify-center gap-1 py-1 px-2 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white text-[9px] font-black uppercase tracking-wider shadow-lg border border-pink-300/40 animate-pulse">
                  <Gift className="w-3 h-3 text-white animate-bounce" />
                  <span>Sinh nhật hôm nay! 🎂</span>
                </div>
              )}

              {/* Employee Code Tag */}
              <div className="absolute bottom-2 left-2 right-2 text-center pointer-events-none">
                <span className="inline-block px-2 py-0.5 rounded-lg text-[9.5px] font-mono font-bold bg-slate-950/90 text-cyan-300 border border-cyan-500/30 backdrop-blur-xs">
                  {staff.code || 'PK88'}
                </span>
              </div>
            </div>

            {/* Profile Summary Beside Avatar */}
            <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left w-full">
              {/* Role Badge */}
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getRoleBadgeStyle(staff.role)}`}>
                  {formatRoleVN(staff.role)}
                </span>
              </div>

              {/* Staff Full Name */}
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                {staff.fullName}
              </h2>

              {/* Home Branch */}
              <p className="text-xs text-slate-300 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Chi nhánh gốc: <strong className="text-cyan-300">{homeBranchName}</strong></span>
              </p>

              {/* Realtime Live Status Pill */}
              <div className="pt-1">
                <div className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-xl border text-xs font-bold ${statusBadgeClass}`}>
                  <span className={`w-2 h-2 rounded-full ${statusDotClass}`} />
                  <span>{statusLabel}</span>
                </div>
              </div>

              {/* Phone Quick Copy Bar */}
              {cleanPhone && (
                <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                    {rawPhone}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700 text-[10px] flex items-center gap-1"
                    title="Sao chép SĐT"
                  >
                    {copiedPhone ? (
                      <>
                        <CheckCheck className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Chép số</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Today's Operational Status Box */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3 sm:p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800/70 pb-2">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Vận hành hôm nay:</span>
              </span>
              <span className="text-[11px] text-cyan-400 font-mono">
                {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
              {/* Working Branch */}
              <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-xl border border-slate-800/50">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Shop trực:</span>
                </span>
                <span className="font-bold text-slate-200 truncate ml-1 flex items-center gap-1">
                  <span>{workingBranchName}</span>
                  {isCrossBranch && (
                    <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded border border-amber-500/40 font-bold">
                      ✈️ Chéo
                    </span>
                  )}
                </span>
              </div>

              {/* Scheduled Shift */}
              <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-xl border border-slate-800/50">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Lịch ca:</span>
                </span>
                <span className="font-mono font-semibold text-slate-200">
                  {assignment ? `${assignment.startTime} - ${assignment.endTime}` : 'Chưa xếp ca'}
                </span>
              </div>

              {/* GPS Geofence */}
              <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-xl border border-slate-800/50">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Vị trí GPS:</span>
                </span>
                <span className="font-semibold">
                  {record ? (
                    record.isOutsideGeofence ? (
                      <span className="text-rose-400 flex items-center gap-1 font-bold">
                        <AlertTriangle className="w-3 h-3 shrink-0" /> Lệch GPS
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <Check className="w-3 h-3 shrink-0" /> Chuẩn shop (&lt;35m)
                      </span>
                    )
                  ) : (
                    <span className="text-slate-500 italic">Chưa check-in</span>
                  )}
                </span>
              </div>

              {/* Hours Logged */}
              <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-xl border border-slate-800/50">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Giờ tích lũy:</span>
                </span>
                <span className="font-mono font-bold text-cyan-300">
                  {record?.workHours ? `${record.workHours}h` : '0h'}
                </span>
              </div>
            </div>

            {/* Leave Details (if any) */}
            {leave && (
              <div className="mt-2 p-2.5 rounded-xl bg-pink-950/40 border border-pink-500/40 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-pink-300 font-bold">
                  <span>🏖️ Đơn nghỉ phép đã duyệt:</span>
                  <span className="font-mono text-[10px]">{leave.startDate} → {leave.endDate}</span>
                </div>
                <p className="text-slate-300 italic">"{leave.reason}"</p>
                {leave.replacementStaffName && (
                  <p className="text-amber-300 font-semibold text-[10px]">
                    ✈️ Nhân sự gánh ca thay thế: <strong>{leave.replacementStaffName}</strong>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Profile Details List */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800/60 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Thông tin hồ sơ nhân viên</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-sky-400" /> Email làm việc:
              </span>
              <span className="font-mono text-[11px] text-slate-200">
                {staff.email || `${staff.phone || staff.id}@phukien88.vn`}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> Ngày vào làm:
              </span>
              <span className="font-medium text-slate-200">
                {staff.joinDate || '01/03/2024'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Cake className="w-3.5 h-3.5 text-pink-400" /> Ngày sinh:
              </span>
              <span className="font-medium text-slate-200">
                {staff.birthDate || 'Đang cập nhật'}
              </span>
            </div>
          </div>

          {/* TWO PROMINENT ACTION BUTTONS: Call & Zalo */}
          {cleanPhone ? (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Call Phone Button */}
              <a
                href={callUrl}
                className="py-3 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <Phone className="w-4 h-4 fill-slate-950 shrink-0" />
                <span>Gọi Điện Thoại</span>
              </a>

              {/* Zalo Chat Button */}
              <a
                href={zaloUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-3 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Nhắn Tin Zalo</span>
                <ExternalLink className="w-3 h-3 opacity-70 ml-0.5" />
              </a>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
              Chưa có số điện thoại liên hệ cho nhân sự này
            </div>
          )}

          {/* Footer Close Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 font-bold text-xs transition-all cursor-pointer"
            >
              Đóng Cửa Sổ (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
