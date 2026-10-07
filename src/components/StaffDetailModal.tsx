import React, { useState, useEffect } from 'react';
import { Staff, Branch, UserRole, CompetencyScores } from '../types';
import { 
  X, Phone, Mail, Calendar, Award, CheckCircle2, ShieldCheck, 
  MapPin, QrCode, Sparkles, User, Briefcase, Star, Zap, Activity, Edit3, Save, RotateCcw
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StaffDetailModalProps {
  staff: Staff | null;
  branch?: Branch;
  totalHours?: number;
  totalSalary?: number;
  onClose: () => void;
  onUpdateScores?: (staffId: string, updatedScores: CompetencyScores) => void;
}

// Curated high quality avatar placeholders for demonstration
const AVATAR_FALLBACKS: Record<string, string> = {
  s0: '/tranhoangsang-admin.png', // Admin / Sang
  s1: '/ngohongthao-founder.jpg', // Founder / Thao
  s112: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', // TP Kinh Doanh / Tuấn
  s111: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80', // Kế Toán / Phương
  s110: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80', // Marketing / Long
  s109: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80', // HR / Bích
  s101: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80', // Manager / Hải
  s102: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80', // Tech / Nam
  s104: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', // Sales / Hồng
};

// Role-tailored 5-Dimension Competency Criteria Mapping
export const ROLE_COMPETENCY_CONFIG: Record<UserRole, {
  title: string;
  dimensions: { key: keyof CompetencyScores; label: string; color: string; progressGradient: string }[];
}> = {
  technician: {
    title: 'Đánh Giá Năng Lực Kỹ Thuật Viên Sửa Chữa',
    dimensions: [
      { key: 'expertise', label: '1. Tay Nghề & Kỹ Thuật Sửa Chữa (Ép kính, Main, Pin)', color: 'text-cyan-400', progressGradient: 'from-cyan-500 to-blue-500' },
      { key: 'discipline', label: '2. Kỷ Luật Chấm Công GPS Geofence', color: 'text-emerald-400', progressGradient: 'from-emerald-500 to-teal-400' },
      { key: 'attitude', label: '3. Thái Độ Phục Vụ & Giao Tiếp Khách Hàng', color: 'text-amber-400', progressGradient: 'from-amber-500 to-orange-400' },
      { key: 'kpi', label: '4. Tốc Độ Xử Lý Phiếu Sửa & Tỉ Lệ Lỗi Thấp', color: 'text-purple-400', progressGradient: 'from-purple-500 to-pink-500' },
      { key: 'lms', label: '5. Tiến Độ LMS 60 Ngày & Cập Nhật Kỹ Thuật Mới', color: 'text-sky-400', progressGradient: 'from-sky-500 to-indigo-500' },
    ]
  },
  sales: {
    title: 'Đánh Giá Năng Lực Nhân Viên Bán Hàng Tại Quầy',
    dimensions: [
      { key: 'expertise', label: '1. Kiến Thức Phụ Kiện & Kỹ Năng Tư Vấn Bán Hàng', color: 'text-cyan-400', progressGradient: 'from-cyan-500 to-blue-500' },
      { key: 'discipline', label: '2. Kỷ Luật Chấm Công GPS Geofence', color: 'text-emerald-400', progressGradient: 'from-emerald-500 to-teal-400' },
      { key: 'attitude', label: '3. Thái Độ Phục Vụ & Chăm Sóc Khách Hàng', color: 'text-amber-400', progressGradient: 'from-amber-500 to-orange-400' },
      { key: 'kpi', label: '4. Doanh Số Bán Lẻ & Tỉ Lệ Upsell Combo', color: 'text-purple-400', progressGradient: 'from-purple-500 to-pink-500' },
      { key: 'lms', label: '5. Tiến Độ LMS 60 Ngày & Quy Trình Quầy', color: 'text-sky-400', progressGradient: 'from-sky-500 to-indigo-500' },
    ]
  },
  manager: {
    title: 'Đánh Giá Năng Lực Quản Lý Chi Nhánh',
    dimensions: [
      { key: 'expertise', label: '1. Quản Trị Vận Hành & Điều Bán Cửa Hàng', color: 'text-cyan-400', progressGradient: 'from-cyan-500 to-blue-500' },
      { key: 'discipline', label: '2. Kỷ Luật Chấm Công & Quản Lý Ca Trực Chi Nhánh', color: 'text-emerald-400', progressGradient: 'from-emerald-500 to-teal-400' },
      { key: 'attitude', label: '3. Xử Lý Khiếu Nại & Giữ Chân Khách Hàng', color: 'text-amber-400', progressGradient: 'from-amber-500 to-orange-400' },
      { key: 'kpi', label: '4. KPI Tổng Doanh Thu Chi Nhánh Giao', color: 'text-purple-400', progressGradient: 'from-purple-500 to-pink-500' },
      { key: 'lms', label: '5. Tiến Độ LMS 60 Ngày & Huấn Luyện NV Mới', color: 'text-sky-400', progressGradient: 'from-sky-500 to-indigo-500' },
    ]
  },
  accountant: {
    title: 'Đánh Giá Năng Lực Kế Toán Trưởng',
    dimensions: [
      { key: 'expertise', label: '1. Độ Chính Xác Sổ Sách & Phần Mềm MISA', color: 'text-cyan-400', progressGradient: 'from-cyan-500 to-blue-500' },
      { key: 'discipline', label: '2. Kiểm Soát Chi Phí, Ngân Sách & Dòng Tiền', color: 'text-emerald-400', progressGradient: 'from-emerald-500 to-teal-400' },
      { key: 'attitude', label: '3. Quyết Toán Bảng Lương & Thuế Đúng Hạn', color: 'text-amber-400', progressGradient: 'from-amber-500 to-orange-400' },
      { key: 'kpi', label: '4. Quản Lý Tồn Kho & Kiểm Kê Phụ Kiện', color: 'text-purple-400', progressGradient: 'from-purple-500 to-pink-500' },
      { key: 'lms', label: '5. Kỷ Luật Báo Cáo Tài Chính & Bảng Cân Đối', color: 'text-sky-400', progressGradient: 'from-sky-500 to-indigo-500' },
    ]
  },
  hr: {
    title: 'Đánh Giá Năng Lực Chuyên Viên HC - NS',
    dimensions: [
      { key: 'expertise', label: '1. Quy Trình Tuyển Dụng & Onboarding NV Mới', color: 'text-cyan-400', progressGradient: 'from-cyan-500 to-blue-500' },
      { key: 'discipline', label: '2. Quản Lý Hồ Sơ Nhân Sự & Hợp Đồng NV', color: 'text-emerald-400', progressGradient: 'from-emerald-500 to-teal-400' },
      { key: 'attitude', label: '3. Giải Quyết Chế Độ, Phúc Lợi & Duyệt Phép AI HR', color: 'text-amber-400', progressGradient: 'from-amber-500 to-orange-400' },
      { key: 'kpi', label: '4. Tiến Độ Đào Tạo LMS 60 Ngày Toàn Chuỗi', color: 'text-purple-400', progressGradient: 'from-purple-500 to-pink-500' },
      { key: 'lms', label: '5. Xây Dựng Văn Hóa & Gắn Kết Đội Ngũ', color: 'text-sky-400', progressGradient: 'from-sky-500 to-indigo-500' },
    ]
  },
  marketing: {
    title: 'Đánh Giá Năng Lực Chuyên Viên Marketing',
    dimensions: [
      { key: 'expertise', label: '1. Sáng Tạo Nội Dung & AI Content Studio', color: 'text-cyan-400', progressGradient: 'from-cyan-500 to-blue-500' },
      { key: 'discipline', label: '2. Hiệu Quả Chiến Dịch & Lượng Reach/Lead', color: 'text-emerald-400', progressGradient: 'from-emerald-500 to-teal-400' },
      { key: 'attitude', label: '3. Quản Trị Fanpage, Zalo OA & TikTok', color: 'text-amber-400', progressGradient: 'from-amber-500 to-orange-400' },
      { key: 'kpi', label: '4. Tỉ Lệ Chuyển Đổi Lead Thành Đơn Bán Hàng', color: 'text-purple-400', progressGradient: 'from-purple-500 to-pink-500' },
      { key: 'lms', label: '5. Kỷ Luật Đúng Hạn Campaign & Đo Lường ROI', color: 'text-sky-400', progressGradient: 'from-sky-500 to-indigo-500' },
    ]
  },
  sales_head: {
    title: 'Đánh Giá Năng Lực Trưởng Phòng Kinh Doanh',
    dimensions: [
      { key: 'expertise', label: '1. Chiến Lược Bán Hàng & Mở Rộng Thị Trường', color: 'text-cyan-400', progressGradient: 'from-cyan-500 to-blue-500' },
      { key: 'discipline', label: '2. KPI Tổng Doanh Số 7 Chi Nhánh', color: 'text-emerald-400', progressGradient: 'from-emerald-500 to-teal-400' },
      { key: 'attitude', label: '3. Thúc Đẩy, Truyền Cảm Hứng & Đào Tạo Sales', color: 'text-amber-400', progressGradient: 'from-amber-500 to-orange-400' },
      { key: 'kpi', label: '4. Nghiên Cứu Sản Phẩm Mới & Chính Sách Giá', color: 'text-purple-400', progressGradient: 'from-purple-500 to-pink-500' },
      { key: 'lms', label: '5. Kỷ Luật Điều Hành & Đạt Mục Tiêu Chuỗi', color: 'text-sky-400', progressGradient: 'from-sky-500 to-indigo-500' },
    ]
  },
  admin: {
    title: 'Đánh Giá Năng Lực Chuyên Viên Công Nghệ',
    dimensions: [
      { key: 'expertise', label: '1. Vận Hành System Admin & Portal Web App', color: 'text-cyan-400', progressGradient: 'from-cyan-500 to-blue-500' },
      { key: 'discipline', label: '2. Phát Triển & Tự Động Hóa AI Agents (n8n)', color: 'text-emerald-400', progressGradient: 'from-emerald-500 to-teal-400' },
      { key: 'attitude', label: '3. An Toàn Dữ Liệu & Quản Trị Database Supabase', color: 'text-amber-400', progressGradient: 'from-amber-500 to-orange-400' },
      { key: 'kpi', label: '4. Hỗ Trợ Kỹ Thuật UI/UX & Sửa Lỗi Tốc Độ Hỏa Tốc', color: 'text-purple-400', progressGradient: 'from-purple-500 to-pink-500' },
      { key: 'lms', label: '5. Tiến Độ Nâng Cấp & Triển Khai Tính Năng Mới', color: 'text-sky-400', progressGradient: 'from-sky-500 to-indigo-500' },
    ]
  },
  founder: {
    title: 'Đánh Giá Năng Lực Lãnh Đạo / Founder',
    dimensions: [
      { key: 'expertise', label: '1. Tầm Nhìn Chiến Lược & Định Hướng Chuỗi', color: 'text-cyan-400', progressGradient: 'from-cyan-500 to-blue-500' },
      { key: 'discipline', label: '2. Quản Trị Tài Chính, Dòng Tiền & Đầu Tư', color: 'text-emerald-400', progressGradient: 'from-emerald-500 to-teal-400' },
      { key: 'attitude', label: '3. Mở Rộng Mạng Lưới Chi Nhánh & Đối Tác', color: 'text-amber-400', progressGradient: 'from-amber-500 to-orange-400' },
      { key: 'kpi', label: '4. Xây Dựng Bộ Máy Vận Hành & Văn Hóa Đội Ngũ', color: 'text-purple-400', progressGradient: 'from-purple-500 to-pink-500' },
      { key: 'lms', label: '5. Tự Động Hóa AI System & Tăng Trưởng Bền Vững', color: 'text-sky-400', progressGradient: 'from-sky-500 to-indigo-500' },
    ]
  },
  customer: {
    title: 'Đánh Giá Năng Lực Khách Hàng',
    dimensions: [
      { key: 'expertise', label: '1. Tần Suất Ghé Thăm & Mua Hàng', color: 'text-cyan-400', progressGradient: 'from-cyan-500 to-blue-500' },
      { key: 'discipline', label: '2. Mức Độ Tương Tác Kênh Online', color: 'text-emerald-400', progressGradient: 'from-emerald-500 to-teal-400' },
      { key: 'attitude', label: '3. Đánh Giá Phản Hồi Dịch Vụ', color: 'text-amber-400', progressGradient: 'from-amber-500 to-orange-400' },
      { key: 'kpi', label: '4. Điểm Tích Lũy Thành Viên', color: 'text-purple-400', progressGradient: 'from-purple-500 to-pink-500' },
      { key: 'lms', label: '5. Giới Thiệu Khách Hàng Mới', color: 'text-sky-400', progressGradient: 'from-sky-500 to-indigo-500' },
    ]
  }
};

export const StaffDetailModal: React.FC<StaffDetailModalProps> = ({
  staff,
  branch,
  totalHours = 176.0,
  totalSalary = 0,
  onClose,
  onUpdateScores
}) => {
  if (!staff) return null;

  // Role config for 5D Competency
  const roleConfig = ROLE_COMPETENCY_CONFIG[staff.role] || ROLE_COMPETENCY_CONFIG.sales;

  // Initialize current scores
  const initialScores: CompetencyScores = staff.competencyScores || {
    expertise: 92,
    discipline: 96,
    attitude: 98,
    kpi: 88,
    lms: 94
  };

  const [scores, setScores] = useState<CompetencyScores>(initialScores);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Sync state if staff changes
  useEffect(() => {
    if (staff) {
      setScores(staff.competencyScores || initialScores);
      setIsEditing(false);
    }
  }, [staff]);

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

  const branchName = branch ? branch.name : 'Phụ Kiện 88 - Bến Tre 1 (Trụ Sở Chính)';

  // Calculate Average Rating
  const avgScore = Math.round(
    (scores.expertise + scores.discipline + scores.attitude + scores.kpi + scores.lms) / 5
  );

  const ratingLabel = 
    avgScore >= 90 ? 'XUẤT SẮC' :
    avgScore >= 80 ? 'TỐT' :
    avgScore >= 70 ? 'KHÁ' : 'CẦN CỐ GẮNG';

  const ratingBadgeColor = 
    avgScore >= 90 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
    avgScore >= 80 ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' :
    avgScore >= 70 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
    'text-rose-400 bg-rose-500/10 border-rose-500/30';

  // QR VietQR image URL sample
  const vietQrUrl = `https://img.vietqr.io/image/vietcombank-0671000426203-compact.png?amount=0&addInfo=${encodeURIComponent('Thuong Nong ' + staff.fullName)}&accountName=${encodeURIComponent(staff.fullName)}`;

  const handleScoreChange = (key: keyof CompetencyScores, value: number) => {
    const clamped = Math.min(100, Math.max(0, value));
    setScores(prev => ({ ...prev, [key]: clamped }));
  };

  const handleSaveScores = async () => {
    setSaving(true);
    try {
      if (onUpdateScores) {
        onUpdateScores(staff.id, scores);
      }

      // Try syncing to Supabase staff table if possible
      try {
        await supabase
          .from('staff')
          .update({ competency_scores: scores })
          .eq('phone', staff.phone);
      } catch (e) {
        console.log('Supabase sync info:', e);
      }

      setIsEditing(false);
      alert(`✅ Đã cập nhật Chỉ Số Năng Lực 5 Chiều cho ${staff.fullName} thành công!`);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

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

          {/* Right Column: Role-Tailored Competency Radar & Rewards QR (7 cols) */}
          <div className="md:col-span-7 space-y-4 flex flex-col justify-between">
            {/* Role-Specific Competency Assessment Panel */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3 relative">
              {/* Header section with Role Title & Edit Toggle */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div>
                  <h4 className="text-[11px] font-extrabold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
                    <span>{roleConfig.title}</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tiêu chí đo lường chuyên biệt cho vị trí: <strong className="text-cyan-300">{roleDisplay}</strong></p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${ratingBadgeColor}`}>
                    Xếp loại: {ratingLabel} ({avgScore}%)
                  </span>

                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      title="Chỉnh sửa chỉ số năng lực trực tiếp"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Sửa Điểm</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setScores(initialScores);
                        setIsEditing(false);
                      }}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Hủy</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 5-Dimension Competency Metrics */}
              <div className="space-y-3 text-xs pt-1">
                {roleConfig.dimensions.map((dim) => {
                  const val = scores[dim.key] ?? 90;
                  return (
                    <div key={dim.key} className="space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-300 font-semibold truncate pr-2">{dim.label}</span>
                        
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={val}
                              onChange={(e) => handleScoreChange(dim.key, parseInt(e.target.value) || 0)}
                              className="w-14 bg-slate-900 border border-cyan-500/50 rounded text-center text-xs font-mono font-bold text-cyan-300 p-0.5 focus:outline-none focus:border-cyan-400"
                            />
                            <span className="text-[10px] text-slate-400">%</span>
                          </div>
                        ) : (
                          <span className={`font-mono font-extrabold ${dim.color}`}>{val}%</span>
                        )}
                      </div>

                      {/* Progress bar / Slider */}
                      {isEditing ? (
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={val}
                          onChange={(e) => handleScoreChange(dim.key, parseInt(e.target.value))}
                          className="w-full accent-cyan-400 h-1.5 bg-slate-900 rounded-lg cursor-pointer"
                        />
                      ) : (
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className={`h-full bg-gradient-to-r ${dim.progressGradient} rounded-full transition-all duration-700`} 
                            style={{ width: `${val}%` }} 
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Edit Mode Save Button */}
              {isEditing && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2 animate-fade-in">
                  <button
                    onClick={() => {
                      setScores(initialScores);
                      setIsEditing(false);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>

                  <button
                    onClick={handleSaveScores}
                    disabled={saving}
                    className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Đang Lưu...' : 'Lưu Chỉ Số Năng Lực'}</span>
                  </button>
                </div>
              )}
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

