import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Staff, Branch, UserRole, CompetencyScores, AttendanceRecord } from '../types';
import { 
  X, Phone, Mail, Calendar, Award, CheckCircle2, ShieldCheck, 
  MapPin, QrCode, Sparkles, User, Briefcase, Star, Zap, Activity, Edit3, Save, RotateCcw,
  Gift, Cake, PartyPopper, Camera, UploadCloud, RefreshCw, KeyRound, Lock, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { compressAvatarImage, CompressedImageResult } from '../lib/imageCompression';
import { saveStaffPasswordToCloud, saveStaffProfileToCloud } from '../lib/staffAuthService';
import { fetchMonthlyCleanlinessStats } from '../lib/cleanlinessService';

interface StaffDetailModalProps {
  staff: Staff | null;
  branch?: Branch;
  branches?: Branch[];
  totalHours?: number;
  totalSalary?: number;
  attendanceLogs?: AttendanceRecord[];
  onClose: () => void;
  onUpdateScores?: (staffId: string, updatedScores: CompetencyScores) => void;
  onUpdateStaff?: (updatedStaff: Staff) => void;
  canEdit?: boolean;
  initialEditMode?: boolean;
  currentUser?: Staff | null;
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
    title: 'Đánh Giá Năng Lực Kế Toán',
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
  media: {
    title: 'Đánh Giá Năng Lực Chuyên Viên Media',
    dimensions: [
      { key: 'expertise', label: '1. Kỹ Thuật Quay Phim, Chụp Ảnh & Edit Video', color: 'text-cyan-400', progressGradient: 'from-cyan-500 to-blue-500' },
      { key: 'discipline', label: '2. Tiến Độ Sản Xuất Media & Lịch Đăng Bài Chuỗi', color: 'text-emerald-400', progressGradient: 'from-emerald-500 to-teal-400' },
      { key: 'attitude', label: '3. Sáng Tạo Ý Tưởng Viral & Bắt Trend Phụ Kiện', color: 'text-amber-400', progressGradient: 'from-amber-500 to-orange-400' },
      { key: 'kpi', label: '4. Hiệu Quả Lượng View, Tương Tác & Chất Lượng Video', color: 'text-purple-400', progressGradient: 'from-purple-500 to-pink-500' },
      { key: 'lms', label: '5. Tiến Độ LMS 60 Ngày & Kỷ Luật Công Việc', color: 'text-sky-400', progressGradient: 'from-sky-500 to-indigo-500' },
    ]
  },
  warehouse_accountant: {
    title: 'Đánh Giá Năng Lực Kế Toán Kho',
    dimensions: [
      { key: 'expertise', label: '1. Độ Chính Xác Nhập - Xuất - Tồn Kho & Kiểm Kê', color: 'text-cyan-400', progressGradient: 'from-cyan-500 to-blue-500' },
      { key: 'discipline', label: '2. Kiểm Soát Luân Chuyển Hàng Giữa Các Chi Nhánh', color: 'text-emerald-400', progressGradient: 'from-emerald-500 to-teal-400' },
      { key: 'attitude', label: '3. Quyết Toán Chứng Từ Nhập Hàng Đúng Hạn', color: 'text-amber-400', progressGradient: 'from-amber-500 to-orange-400' },
      { key: 'kpi', label: '4. Giảm Thiểu Thất Thoát, Lỗi Hàng & Tồn Kho Ảo', color: 'text-purple-400', progressGradient: 'from-purple-500 to-pink-500' },
      { key: 'lms', label: '5. Kỷ Luật Báo Cáo Tồn Kho & Bảng Cân Đối Kho', color: 'text-sky-400', progressGradient: 'from-sky-500 to-indigo-500' },
    ]
  },
  sales_head: {
    title: 'Đánh Giá Năng Lực Trưởng Phòng Kinh Doanh',
    dimensions: [
      { key: 'expertise', label: '1. Chiến Lược Bán Hàng & Mở Rộng Thị Trường', color: 'text-cyan-400', progressGradient: 'from-cyan-500 to-blue-500' },
      { key: 'discipline', label: '2. KPI Tổng Doanh Số Toàn Chuỗi Chi Nhánh', color: 'text-emerald-400', progressGradient: 'from-emerald-500 to-teal-400' },
      { key: 'attitude', label: '3. Thúc Đẩy, Truyền Cảm Hứng & Đào Tạo Sales', color: 'text-amber-400', progressGradient: 'from-amber-500 to-orange-400' },
      { key: 'kpi', label: '4. Nghiên Cứu Sản Phẩm Mới & Chính Sách Giá', color: 'text-purple-400', progressGradient: 'from-purple-500 to-pink-500' },
      { key: 'lms', label: '5. Kỷ Luật Điều Hành & Đạt Mục Tiêu Chuỗi', color: 'text-sky-400', progressGradient: 'from-sky-500 to-indigo-500' },
    ]
  },
  admin: {
    title: 'Đánh Giá Năng Lực Admin',
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
  branches = [],
  totalHours,
  totalSalary = 0,
  attendanceLogs = [],
  onClose,
  onUpdateScores,
  onUpdateStaff,
  canEdit = true,
  initialEditMode = false,
  currentUser
}) => {
  if (!staff) return null;

  // Tính tổng giờ làm thực tế từ attendanceLogs nếu totalHours không được chỉ định
  const effectiveHours = useMemo(() => {
    if (totalHours !== undefined && totalHours !== null) {
      return totalHours;
    }
    if (attendanceLogs && attendanceLogs.length > 0 && staff) {
      const logs = attendanceLogs.filter(log => 
        (log.staffId === staff.id || (log.notes && log.notes.includes(staff.phone))) &&
        (log.isVerified !== false || log.disputeStatus === 'APPROVED') &&
        log.disputeStatus !== 'PENDING' &&
        log.disputeStatus !== 'REJECTED'
      );
      return logs.reduce((sum, log) => sum + (log.workHours || 0), 0);
    }
    return 0;
  }, [totalHours, attendanceLogs, staff]);

  // Tính lương tạm tính phù hợp theo vai trò hoặc theo giờ thực tế
  const effectiveSalaryInfo = useMemo(() => {
    if (totalSalary > 0) {
      return {
        label: totalSalary.toLocaleString('vi-VN') + ' đ',
        subText: 'Tính theo giờ thực tế'
      };
    }

    if (staff.role === 'manager') {
      return { label: '8.500.000 đ', subText: 'Lương quản lý cố định/tháng' };
    }
    if (staff.role === 'admin') {
      return { label: '19.000.000 đ', subText: 'Lương admin cố định/tháng' };
    }
    if (staff.role === 'hr') {
      return { label: '12.000.000 đ', subText: 'Lương HR cố định/tháng' };
    }
    if (staff.role === 'marketing') {
      return { label: '14.000.000 đ', subText: 'Lương marketing cố định/tháng' };
    }
    if (staff.role === 'accountant') {
      return { label: '13.500.000 đ', subText: 'Lương kế toán cố định/tháng' };
    }
    if (staff.role === 'founder') {
      return { label: 'Chủ Doanh Nghiệp', subText: 'Miễn chấm công' };
    }

    // Nhân viên theo giờ (sales, technician)
    const isThuDuc = branch?.code === 'PK88_THUDUC';
    const rate = isThuDuc ? 25500 : 22700;
    const calculated = Math.round(effectiveHours * rate);
    if (calculated > 0) {
      return {
        label: calculated.toLocaleString('vi-VN') + ' đ',
        subText: `${rate.toLocaleString('vi-VN')} đ/h × ${effectiveHours.toFixed(1)}h`
      };
    }
    return {
      label: '0 đ',
      subText: `${rate.toLocaleString('vi-VN')} đ/giờ (Chưa có ca làm)`
    };
  }, [totalSalary, staff, effectiveHours, branch]);

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

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(initialEditMode);
  const [editFullName, setEditFullName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editBranchId, setEditBranchId] = useState<string>('');
  const [editRole, setEditRole] = useState<UserRole>('sales');
  const [editJoinDate, setEditJoinDate] = useState<string>('');
  const [editBirthDate, setEditBirthDate] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  // Cleanliness Monthly Stats
  const [cleanlinessStats, setCleanlinessStats] = useState<{ approvedCount: number; totalSubmitted: number }>({ approvedCount: 0, totalSubmitted: 0 });

  useEffect(() => {
    if (!staff) return;
    let isMounted = true;
    const loadStats = async () => {
      try {
        const stats = await fetchMonthlyCleanlinessStats();
        if (!isMounted) return;
        const sStats = (staff.id && stats.byStaffId[staff.id]) ||
                       (staff.fullName && stats.byStaffName[staff.fullName.trim().toLowerCase()]);
        if (sStats) {
          setCleanlinessStats({
            approvedCount: sStats.approvedCount,
            totalSubmitted: sStats.totalSubmitted
          });
        }
      } catch (e) {
        console.warn('Load staff cleanliness stats error:', e);
      }
    };
    loadStats();
    return () => { isMounted = false; };
  }, [staff?.id, staff?.fullName]);

  // Password Change State
  const [showPasswordChange, setShowPasswordChange] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPwd, setShowNewPwd] = useState<boolean>(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState<boolean>(false);
  const [passwordNotice, setPasswordNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Helper đổi mật khẩu cá nhân cho nhân sự
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);

    if (!newPassword || newPassword.trim().length < 4) {
      setPasswordNotice({ type: 'error', text: 'Mật khẩu mới phải có tối thiểu 4 ký tự!' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordNotice({ type: 'error', text: 'Mật khẩu xác nhận không trùng khớp!' });
      return;
    }

    try {
      // Lưu đồng bộ lên Supabase Cloud và LocalStorage
      await saveStaffPasswordToCloud(staff.phone.trim(), newPassword.trim());

      setPasswordNotice({ type: 'success', text: `Đã đổi mật khẩu thành công cho ${staff.fullName} (Đã đồng bộ Cloud)!` });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordNotice(null);
      }, 1500);
    } catch (err: any) {
      setPasswordNotice({ type: 'error', text: 'Lỗi lưu mật khẩu: ' + err.message });
    }
  };

  // Avatar Upload & Compression State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressionStats, setCompressionStats] = useState<{
    originalKB: number;
    compressedKB: number;
    savedPercent: number;
  } | null>(null);

  // Sync state if staff changes
  useEffect(() => {
    if (staff) {
      setScores(staff.competencyScores || initialScores);
      setIsEditing(false);
      setIsEditingProfile(initialEditMode);
      const initialName = (staff.phone === '0888003205' || staff.code === 'PK88-ADMIN' || staff.fullName?.includes('Trần Hoàng Sang'))
        ? 'Trần Hoàng Sang'
        : (staff.fullName || '');
      setEditFullName(initialName);
      setEditPhone(staff.phone || '');
      setEditBranchId(staff.branchId || (branch ? branch.id : ''));
      setEditRole(staff.role || 'sales');
      setEditJoinDate(staff.joinDate || '');
      setEditBirthDate(staff.birthDate || '');
      setEditEmail(staff.email || '');
      setEditIsActive(staff.isActive !== undefined ? staff.isActive : true);
      setAvatarPreview(staff.avatarUrl || AVATAR_FALLBACKS[staff.id] || '');
      setCompressionStats(null);
    }
  }, [staff, initialEditMode]);

  // Derive display values
  const staffDisplayName = (staff.phone === '0888003205' || staff.code === 'PK88-ADMIN' || staff.fullName?.includes('Trần Hoàng Sang'))
    ? 'Trần Hoàng Sang'
    : staff.fullName;
  const staffCode = staff.code || `PK88-NV${staff.id.replace(/\D/g, '').padStart(3, '0')}`;
  const avatarUrl = avatarPreview || staff.avatarUrl || AVATAR_FALLBACKS[staff.id] || `https://ui-avatars.com/api/?name=${encodeURIComponent(staffDisplayName)}&background=0284c7&color=fff&size=200&font-size=0.35&bold=true`;
  const roleDisplay = 
    staff.role === 'founder' ? 'Chủ Sở Hữu / Founder' :
    staff.role === 'admin' ? 'Admin' :
    staff.role === 'sales_head' ? 'Trưởng Phòng Kinh Doanh' :
    staff.role === 'accountant' ? 'Kế Toán' :
    staff.role === 'warehouse_accountant' ? 'Kế Toán Kho' :
    staff.role === 'marketing' ? 'Chuyên Viên Marketing' :
    staff.role === 'media' ? 'Chuyên Viên Media' :
    staff.role === 'hr' ? 'Chuyên Viên HC - NS' :
    staff.role === 'manager' ? 'Quản Lý Chi Nhánh' :
    staff.role === 'technician' ? 'Kỹ Thuật Viên Sửa Chữa' : 'Nhân Viên Bán Hàng Tại Quầy';

  const roleColor = 
    staff.role === 'founder' || staff.role === 'admin' ? 'from-purple-500 to-indigo-600 border-purple-400 text-purple-200' :
    staff.role === 'sales_head' ? 'from-amber-500 to-orange-600 border-amber-400 text-amber-200' :
    staff.role === 'accountant' ? 'from-emerald-500 to-teal-600 border-emerald-400 text-emerald-200' :
    staff.role === 'warehouse_accountant' ? 'from-teal-500 to-emerald-600 border-teal-400 text-teal-200' :
    staff.role === 'marketing' ? 'from-pink-500 to-rose-600 border-pink-400 text-pink-200' :
    staff.role === 'media' ? 'from-fuchsia-500 to-rose-500 border-fuchsia-400 text-fuchsia-200' :
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

  // Handle Avatar Selection & Ultra-Light Compression (~20KB)
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !staff) return;

    setIsCompressing(true);
    try {
      // Nén ảnh bằng Canvas: Tự động crop vuông 1:1, resize 400x400, nén WebP chất lượng 0.8
      const result = await compressAvatarImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8,
        squareCrop: true
      });

      setAvatarPreview(result.dataUrl);
      setCompressionStats({
        originalKB: result.originalSizeKB,
        compressedKB: result.compressedSizeKB,
        savedPercent: result.savedPercent
      });

      const updatedStaff: Staff = {
        ...staff,
        avatarUrl: result.dataUrl
      };

      // 1. Lưu đệm localStorage để load ngay tức thì mọi nơi
      const overridesStr = localStorage.getItem('pk88_staff_overrides');
      const overrides = overridesStr ? JSON.parse(overridesStr) : {};
      overrides[staff.id] = { ...overrides[staff.id], ...updatedStaff };
      overrides[staff.phone] = { ...overrides[staff.phone], ...updatedStaff };
      localStorage.setItem('pk88_staff_overrides', JSON.stringify(overrides));

      // 2. Cập nhật state cha
      if (onUpdateStaff) {
        onUpdateStaff(updatedStaff);
      }

      // 3. Đồng bộ lên Supabase staff table vào cột avatar_url mới tạo
      try {
        const { error: sbErr } = await supabase
          .from('staff')
          .update({ avatar_url: result.dataUrl })
          .eq('phone', staff.phone);

        if (sbErr) {
          await supabase
            .from('staff')
            .update({ avatar_url: result.dataUrl })
            .eq('id', staff.id);
        }
      } catch (dbErr) {
        console.log('Supabase staff avatar_url update notice:', dbErr);
      }

    } catch (err: any) {
      console.error('Error compressing avatar:', err);
      alert('⚠️ Không thể tải ảnh: ' + (err.message || err));
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleResetAvatar = async () => {
    if (!staff) return;
    if (!confirm(`Bạn có chắc muốn đặt lại ảnh đại diện mặc định cho ${staff.fullName}?`)) return;

    setAvatarPreview('');
    setCompressionStats(null);

    const updatedStaff: Staff = {
      ...staff,
      avatarUrl: undefined
    };

    const overridesStr = localStorage.getItem('pk88_staff_overrides');
    const overrides = overridesStr ? JSON.parse(overridesStr) : {};
    if (overrides[staff.id]) delete overrides[staff.id].avatarUrl;
    if (overrides[staff.phone]) delete overrides[staff.phone].avatarUrl;
    localStorage.setItem('pk88_staff_overrides', JSON.stringify(overrides));

    if (onUpdateStaff) onUpdateStaff(updatedStaff);

    try {
      await supabase.from('staff').update({ avatar_url: null }).eq('phone', staff.phone);
      await supabase.from('staff').update({ avatar_url: null }).eq('id', staff.id);
    } catch (e) {
      console.log('Supabase avatar reset notice:', e);
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!staff) return;

    if (!editFullName.trim()) {
      alert('⚠️ Vui lòng nhập họ & tên đầy đủ của nhân sự!');
      return;
    }
    if (!editPhone.trim()) {
      alert('⚠️ Vui lòng nhập số điện thoại của nhân sự!');
      return;
    }

    setSavingProfile(true);
    try {
      // 1. Live update to Supabase 'staff' table (kèm avatar_url)
      const { error } = await supabase
        .from('staff')
        .update({
          full_name: editFullName.trim(),
          phone: editPhone.trim(),
          branch_id: editBranchId || staff.branchId,
          role: editRole,
          is_active: editIsActive,
          avatar_url: avatarPreview || staff.avatarUrl || null
        })
        .eq('id', staff.id);

      if (error) {
        console.warn('Update by id returned error, trying phone fallback:', error);
        await supabase
          .from('staff')
          .update({
            full_name: editFullName.trim(),
            phone: editPhone.trim(),
            branch_id: editBranchId || staff.branchId,
            role: editRole,
            is_active: editIsActive,
            avatar_url: avatarPreview || staff.avatarUrl || null
          })
          .eq('phone', staff.phone);
      }

      // 2. Updated Staff Object
      const updatedStaff: Staff = {
        ...staff,
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
        branchId: editBranchId || staff.branchId,
        role: editRole,
        isActive: editIsActive,
        joinDate: editJoinDate.trim() || undefined,
        birthDate: editBirthDate.trim() || undefined,
        email: editEmail.trim() || undefined,
        avatarUrl: avatarPreview || staff.avatarUrl
      };

      // 3. Save to Supabase Cloud & localStorage overrides so birthDate, joinDate, email persist across devices & reloads
      await saveStaffProfileToCloud(updatedStaff.phone, {
        birthDate: updatedStaff.birthDate,
        joinDate: updatedStaff.joinDate,
        email: updatedStaff.email,
        fullName: updatedStaff.fullName,
        branchId: updatedStaff.branchId,
        role: updatedStaff.role,
        id: updatedStaff.id
      });

      // 4. Update parent states
      if (onUpdateStaff) {
        onUpdateStaff(updatedStaff);
      }

      setIsEditingProfile(false);
      alert(`✅ Đã lưu cập nhật nhân sự "${updatedStaff.fullName}" thành công lên Supabase Cloud!`);
    } catch (err: any) {
      console.error('Error saving staff:', err);
      alert(`⚠️ Không thể lưu lên Supabase: ${err.message || err}`);
    } finally {
      setSavingProfile(false);
    }
  };

  // Check Birthday Information
  const birthdayInfo = (() => {
    if (!staff.birthDate) return { isToday: false, formatted: 'Chưa cập nhật' };
    
    let birthDay: number | null = null;
    let birthMonth: number | null = null;
    let birthYear: number | null = null;

    if (staff.birthDate.includes('-')) {
      const parts = staff.birthDate.split('-');
      if (parts.length === 3) {
        birthYear = parseInt(parts[0], 10);
        birthMonth = parseInt(parts[1], 10);
        birthDay = parseInt(parts[2], 10);
      }
    } else if (staff.birthDate.includes('/')) {
      const parts = staff.birthDate.split('/');
      if (parts.length === 3) {
        birthDay = parseInt(parts[0], 10);
        birthMonth = parseInt(parts[1], 10);
        birthYear = parseInt(parts[2], 10);
      }
    }

    if (!birthDay || !birthMonth) {
      return { isToday: false, formatted: staff.birthDate };
    }

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1; // 1-indexed

    const isToday = (birthDay === currentDay && birthMonth === currentMonth);
    const formatted = `${String(birthDay).padStart(2, '0')}/${String(birthMonth).padStart(2, '0')}${birthYear ? `/${birthYear}` : ''}`;

    return { isToday, formatted };
  })();

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
            {/* Hidden File Input for Avatar */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFileSelect}
              className="hidden"
            />

            {/* Avatar Portrait Card with interactive upload */}
            <div className="relative group rounded-2xl overflow-hidden border-2 border-cyan-500/30 shadow-lg bg-slate-950">
              <img
                src={avatarUrl}
                alt={staff.fullName}
                className="w-full h-64 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.fullName)}&background=0284c7&color=fff&size=200&bold=true`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
              
              {/* Interactive Hover Overlay to Upload Photo */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 text-center cursor-pointer z-10"
              >
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-white drop-shadow">Nhấp để tải ảnh lên</span>
                <span className="text-[10px] text-cyan-300 font-medium bg-cyan-950/80 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                  ⚡ Tự động nén WebP siêu nhẹ (~20KB)
                </span>
              </div>

              {/* Floating Camera Button (Always visible on top right for mobile/tablet) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                title="Tải lên hoặc thay đổi ảnh đại diện"
                className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 shadow-xl backdrop-blur-md text-[11px] font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Đổi ảnh</span>
              </button>

              {/* Compressing Loading Overlay */}
              {isCompressing && (
                <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-cyan-300">
                  <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-extrabold animate-pulse">Đang nén & tối ưu ảnh...</span>
                  <span className="text-[10px] text-slate-400 font-mono">Bảo vệ dung lượng Supabase</span>
                </div>
              )}
              
              {birthdayInfo.isToday && (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white shadow-xl shadow-pink-500/40 border border-pink-300/40 animate-pulse">
                  <Gift className="w-3.5 h-3.5 text-white fill-white/20 animate-bounce" />
                  <span className="text-[10px] font-black tracking-wide uppercase drop-shadow">Hôm nay sinh nhật! 🎂</span>
                </div>
              )}
              
              <div className="absolute bottom-3 left-3 right-3 pointer-events-none z-10">
                <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-gradient-to-r ${roleColor} shadow-md uppercase tracking-wider mb-1`}>
                  {roleDisplay}
                </span>
                <h2 className="text-lg font-black text-white leading-tight drop-shadow-md">{staffDisplayName}</h2>
              </div>
            </div>

            {/* Compression Feedback Banner */}
            {compressionStats && (
              <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-2xl p-3 text-xs text-emerald-300 flex items-center justify-between shadow-lg shadow-emerald-500/10 animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-white text-[11px]">Đã tối ưu & nén ảnh thành công!</p>
                    <p className="text-[10px] text-emerald-300/90 font-mono">
                      Gốc: {compressionStats.originalKB} KB ➔ Nén: <strong className="text-white font-bold">{compressionStats.compressedKB} KB</strong> (Tiết kiệm {compressionStats.savedPercent}%)
                    </p>
                  </div>
                </div>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleResetAvatar}
                    className="text-[10px] text-slate-400 hover:text-rose-400 underline ml-2 shrink-0 cursor-pointer"
                    title="Khôi phục ảnh avatar mặc định ban đầu"
                  >
                    Khôi phục
                  </button>
                )}
              </div>
            )}

            {/* Profile Edit Form OR Quick Metadata Card */}
            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="bg-slate-950 border border-cyan-500/40 rounded-2xl p-4 space-y-3 text-xs shadow-xl shadow-cyan-500/10">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-extrabold text-cyan-300 flex items-center gap-1.5 uppercase text-[11px]">
                    <Edit3 className="w-3.5 h-3.5" /> Sửa Thông Tin Nhân Sự
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    Lưu Supabase Cloud
                  </span>
                </div>

                {/* Upload Avatar Button inside Edit Form */}
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-cyan-400" />
                    <span>Tải Lên / Thay Đổi Ảnh Avatar (Nén ~20KB)</span>
                  </button>
                </div>

                {/* Full name */}
                <div>
                  <label className="text-slate-400 text-[11px] font-semibold block mb-1">Họ & Tên đầy đủ:</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="VD: Trần Thị Ngọc Diệu"
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-slate-400 text-[11px] font-semibold block mb-1">Số điện thoại đăng nhập:</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="VD: 0938123456"
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Branch */}
                <div>
                  <label className="text-slate-400 text-[11px] font-semibold block mb-1">Chi nhánh công tác:</label>
                  <select
                    value={editBranchId}
                    onChange={(e) => setEditBranchId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
                  >
                    {branches && branches.length > 0 ? (
                      branches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name.replace('Phụ Kiện 88 - ', '')} {b.isActive ? '' : '(TẠM ĐÓNG)'}
                        </option>
                      ))
                    ) : (
                      <option value={staff.branchId}>{branchName}</option>
                    )}
                  </select>
                </div>

                {/* Role */}
                <div>
                  <label className="text-slate-400 text-[11px] font-semibold block mb-1">Vị trí / Chức danh:</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 font-bold focus:outline-none focus:border-cyan-400"
                  >
                    <option value="sales">Nhân Viên Bán Hàng Tại Quầy</option>
                    <option value="technician">Kỹ Thuật Viên Sửa Chữa</option>
                    <option value="manager">Quản Lý Chi Nhánh / CHT</option>
                    <option value="warehouse_accountant">Kế Toán Kho</option>
                    <option value="media">Chuyên Viên Media</option>
                    <option value="accountant">Kế Toán</option>
                    <option value="hr">Chuyên Viên HC - NS</option>
                    <option value="marketing">Chuyên Viên Marketing</option>
                    <option value="sales_head">Trưởng Phòng Kinh Doanh</option>
                    <option value="admin">Admin</option>
                    <option value="founder">Chủ Sở Hữu / Founder</option>
                  </select>
                </div>

                {/* Birth Date */}
                <div>
                  <label className="text-slate-400 text-[11px] font-semibold block mb-1 flex items-center gap-1">
                    <Cake className="w-3.5 h-3.5 text-pink-400" /> Ngày sinh nhật:
                  </label>
                  <input
                    type="date"
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Join Date */}
                <div>
                  <label className="text-slate-400 text-[11px] font-semibold block mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" /> Ngày vào làm:
                  </label>
                  <input
                    type="date"
                    value={editJoinDate}
                    onChange={(e) => setEditJoinDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-slate-400 text-[11px] font-semibold block mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-sky-400" /> Email làm việc:
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="email@phukien88.vn"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400 text-[11px] font-semibold">Trạng thái làm việc:</span>
                  <button
                    type="button"
                    onClick={() => setEditIsActive(!editIsActive)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                      editIsActive
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    }`}
                  >
                    {editIsActive ? '🟢 Đang làm việc' : '🔴 Đã nghỉ việc'}
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingProfile ? 'Đang Lưu...' : 'Lưu Supabase'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <>
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

                  <div className={`flex items-center justify-between pt-2 border-t transition-all ${
                    birthdayInfo.isToday 
                      ? 'border-pink-500/40 bg-gradient-to-r from-pink-500/15 via-rose-500/10 to-amber-500/15 -mx-2 px-2.5 py-2 rounded-xl ring-1 ring-pink-500/30' 
                      : 'border-slate-800/60'
                  }`}>
                    <span className={`flex items-center gap-1.5 ${birthdayInfo.isToday ? 'text-pink-300 font-extrabold text-[11px]' : 'text-slate-400'}`}>
                      <Cake className={`w-3.5 h-3.5 ${birthdayInfo.isToday ? 'text-pink-400 animate-bounce' : 'text-pink-400/80'}`} /> Ngày sinh:
                    </span>
                    
                    {birthdayInfo.isToday ? (
                      <div className="flex items-center gap-1.5 bg-gradient-to-r from-pink-600/30 via-rose-600/30 to-amber-500/30 border border-pink-400/60 px-2.5 py-1 rounded-full shadow-lg shadow-pink-500/25">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                        </span>
                        <Gift className="w-4 h-4 text-pink-300 fill-pink-500/40 animate-bounce" />
                        <span className="font-black text-xs text-pink-200">
                          {birthdayInfo.formatted}
                        </span>
                        <span className="text-[9px] bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <PartyPopper className="w-2.5 h-2.5" /> HÔM NAY 🎁
                        </span>
                      </div>
                    ) : (
                      <span className="font-semibold text-slate-200 text-xs">
                        {birthdayInfo.formatted}
                      </span>
                    )}
                  </div>
                </div>

                {/* Password Change Form or Button - CHỈ CHÍNH CHỦ HOẶC ADMIN/HR/FOUNDER MỚI ĐƯỢC PHÉP ĐỔI */}
                {(() => {
                  const isSelf = currentUser ? (staff.id === currentUser.id || staff.phone === currentUser.phone) : true;
                  const isPrivileged = currentUser ? ['founder', 'admin', 'hr'].includes(currentUser.role) : false;
                  const allowedToChange = isSelf || isPrivileged || canEdit;

                  if (!allowedToChange) return null;

                  return showPasswordChange ? (
                    <form onSubmit={handleChangePassword} className="bg-slate-950 border border-amber-500/40 rounded-2xl p-4 space-y-3 text-xs shadow-xl shadow-amber-500/10 animate-fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="font-extrabold text-amber-300 flex items-center gap-1.5 uppercase text-[11px]">
                          <KeyRound className="w-3.5 h-3.5" /> {isSelf ? 'Đổi Mật Khẩu Của Bạn' : `Cấp Lại Mật Khẩu (${staff.fullName})`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordChange(false);
                            setPasswordNotice(null);
                          }}
                          className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>

                      {passwordNotice && (
                        <div className={`p-2.5 rounded-xl text-[11px] font-medium ${
                          passwordNotice.type === 'success' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {passwordNotice.text}
                        </div>
                      )}

                      <div>
                        <label className="text-slate-400 text-[10px] font-semibold block mb-1">Mật khẩu mới:</label>
                        <div className="relative">
                          <input
                            type={showNewPwd ? 'text' : 'password'}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Nhập mật khẩu mới (tối thiểu 4 ký tự)"
                            className="w-full pl-3 pr-9 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPwd(!showNewPwd)}
                            className="absolute right-2.5 top-2.5 text-slate-500 hover:text-amber-400 cursor-pointer"
                          >
                            {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-400 text-[10px] font-semibold block mb-1">Nhập lại mật khẩu mới:</label>
                        <div className="relative">
                          <input
                            type={showConfirmPwd ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Xác nhận lại mật khẩu mới"
                            className="w-full pl-3 pr-9 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-400 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                            className="absolute right-2.5 top-2.5 text-slate-500 hover:text-amber-400 cursor-pointer"
                          >
                            {showConfirmPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="submit"
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Lưu Mật Khẩu Mới</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordChange(true);
                        setPasswordNotice(null);
                      }}
                      className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isSelf ? 'ĐỔI MẬT KHẨU TÀI KHOẢN CỦA BẠN' : 'CẤP LẠI MẬT KHẨU CHO NHÂN SỰ'}</span>
                    </button>
                  );
                })()}

                {/* Edit Button for Founder / Admin */}
                {canEdit !== false && (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm shadow-cyan-500/10"
                  >
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                    <span>CHỈNH SỬA THÔNG TIN NHÂN SỰ</span>
                  </button>
                )}

                {/* Quick Action Button */}
                <a
                  href={`tel:${staff.phone}`}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Phone className="w-4 h-4 fill-slate-950" />
                  <span>GỌI ĐIỆN HOẶC ZALO NHANH</span>
                </a>
              </>
            )}
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

            {/* Work & Attendance & Cleanliness Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 sm:p-3">
                <div className="text-[10px] text-slate-400 font-semibold mb-0.5">TỔNG GIỜ LÀM (THÁNG)</div>
                <div className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                  {effectiveHours.toFixed(1)}h
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {effectiveHours > 0 ? 'Dữ liệu GPS thực tế' : 'Chưa ghi nhận ca làm'}
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 sm:p-3">
                <div className="text-[10px] text-slate-400 font-semibold mb-0.5">LƯƠNG TẠM TÍNH (THÁNG)</div>
                <div className="text-base sm:text-lg font-black text-rose-400 font-mono">
                  {effectiveSalaryInfo.label}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate" title={effectiveSalaryInfo.subText}>
                  {effectiveSalaryInfo.subText}
                </div>
              </div>

              <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-2.5 sm:p-3 bg-gradient-to-b from-cyan-950/20 to-transparent">
                <div className="text-[10px] text-cyan-300 font-semibold mb-0.5 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>VỆ SINH 5S (THÁNG)</span>
                </div>
                <div className="text-base sm:text-lg font-black text-cyan-300 font-mono flex items-center justify-center gap-1">
                  <span>{cleanlinessStats.approvedCount}</span>
                  <span className="text-xs font-bold text-slate-400">/ {cleanlinessStats.totalSubmitted} ca</span>
                </div>
                <div className="text-[10px] text-cyan-200/80 mt-0.5 font-medium">
                  {cleanlinessStats.approvedCount > 0 ? `${cleanlinessStats.approvedCount} ca Đạt Chuẩn` : 'Chưa có ca duyệt'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

