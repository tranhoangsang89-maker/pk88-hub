import React, { useState, useEffect } from 'react';
import { Branch, Staff, JobApplication, JobApplicationStatus, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Search, 
  Filter, 
  MapPin, 
  Phone, 
  Calendar, 
  CheckCircle, 
  Clock, 
  UserCheck, 
  XCircle, 
  RefreshCw, 
  Plus, 
  Eye, 
  Briefcase, 
  Building2, 
  ArrowRight, 
  Check, 
  Sparkles, 
  GraduationCap,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  Trash2,
  Undo2,
  CalendarCheck
} from 'lucide-react';

interface RecruitmentManagementProps {
  branches: Branch[];
  staffList: Staff[];
  onRefreshStaff?: () => void;
  currentUser?: Staff;
}

const ROLE_LABELS: Record<string, string> = {
  sales: 'Bán hàng & Tư vấn',
  technician: 'Kỹ thuật sửa chữa',
  manager: 'Quản lý cửa hàng',
  marketing: 'Marketing / Media',
  warehouse_accountant: 'Thu ngân / Kế toán kho',
  hr: 'Nhân sự HR',
  admin: 'Quản trị viên'
};

const STATUS_CONFIG: Record<JobApplicationStatus, { label: string; color: string; badge: string; icon: any }> = {
  pending: {
    label: 'Chờ xét duyệt',
    color: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: Clock
  },
  interview: {
    label: 'Hẹn phỏng vấn',
    color: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    icon: Phone
  },
  hired: {
    label: 'Đã nhận việc',
    color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: UserCheck
  },
  rejected: {
    label: 'Không phù hợp',
    color: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    icon: XCircle
  }
};

// Dữ liệu mẫu chuẩn hóa đúng ID chi nhánh thực tế
const getInitialApplications = (branches: Branch[]): JobApplication[] => [
  {
    id: 'app-1',
    branch_id: branches.find(b => b.code.includes('DONGKHOI') || b.name.includes('Đồng Khởi'))?.id || branches[1]?.id || 'b-dongkhoi',
    full_name: 'Nguyễn Minh Trí',
    phone: '0918234567',
    role_applied: 'technician',
    experience_note: 'Từng làm kỹ thuật ép kính màn hình thẳng tại tiệm nhỏ 1 năm, muốn học thêm ép màn cong.',
    status: 'interview',
    interview_date: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'app-2',
    branch_id: branches.find(b => b.code.includes('MYTHO') || b.name.includes('Mỹ Tho'))?.id || branches[2]?.id || 'b-mytho',
    full_name: 'Phạm Thuỳ Trang',
    phone: '0978654321',
    role_applied: 'sales',
    experience_note: 'Ngoại hình sáng, từng bán hàng mỹ phẩm và phụ kiện 8 tháng, giao tiếp tốt.',
    status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'app-3',
    branch_id: branches.find(b => b.code.includes('CANTHO') || b.name.includes('Cần Thơ'))?.id || branches[4]?.id || 'b-cantho',
    full_name: 'Lê Hoàng Nam',
    phone: '0833112233',
    role_applied: 'marketing',
    experience_note: 'Biết quay dựng CapCut trên điện thoại, có kênh TikTok cá nhân 15k followers về review công nghệ.',
    status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

export const RecruitmentManagement: React.FC<RecruitmentManagementProps> = ({
  branches,
  staffList,
  onRefreshStaff,
  currentUser
}) => {
  // Lấy chi nhánh thực tế để map mã cũ nếu có
  const getBranchIdByCode = (code: string) => {
    const c = (code || '').toLowerCase();
    if (c.includes('mt') || c.includes('mytho')) return branches.find(b => b.code.includes('MYTHO') || b.name.includes('Mỹ Tho'))?.id;
    if (c.includes('ct') || c.includes('cantho')) return branches.find(b => b.code.includes('CANTHO') || b.name.includes('Cần Thơ'))?.id;
    if (c.includes('bt1') || c.includes('dongkhoi')) return branches.find(b => b.code.includes('DONGKHOI') || b.name.includes('Đồng Khởi'))?.id;
    if (c.includes('bt2') || c.includes('phukhuong')) return branches.find(b => b.code.includes('PHUKHUONG') || b.name.includes('Phú Khương'))?.id;
    if (c.includes('vl') || c.includes('vinhlong')) return branches.find(b => b.code.includes('VINHLONG') || b.name.includes('Vĩnh Long'))?.id;
    return branches[0]?.id;
  };

  const [applications, setApplications] = useState<JobApplication[]>(() => {
    const cached = localStorage.getItem('pk88_job_applications');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Chuẩn hóa branch_id nếu là mã legacy cn_mt, cn_bt1...
          return parsed.map((item: any) => {
            if (item.branch_id === 'cn_mt' || item.branch_id === 'cn_bt1' || item.branch_id === 'cn_ct') {
              const realId = getBranchIdByCode(item.branch_id);
              if (realId) return { ...item, branch_id: realId };
            }
            return item;
          });
        }
      } catch (e) {}
    }
    return getInitialApplications(branches);
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Modal chuyển thành nhân viên
  const [candidateToConvert, setCandidateToConvert] = useState<JobApplication | null>(null);
  const [convertBranchId, setConvertBranchId] = useState<string>('');
  const [convertRole, setConvertRole] = useState<UserRole>('sales');
  const [isConverting, setIsConverting] = useState<boolean>(false);

  // Modal tạo ứng viên thủ công
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newFullName, setNewFullName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newBranchId, setNewBranchId] = useState<string>(branches[0]?.id || '');
  const [newRole, setNewRole] = useState<string>('sales');
  const [newNote, setNewNote] = useState<string>('');

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Lỗi fetch job_applications từ Supabase (dùng cache local):', error.message);
      } else if (data && data.length > 0) {
        setApplications(data);
        localStorage.setItem('pk88_job_applications', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Lỗi khi fetch ứng viên:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();

    // Lắng nghe Realtime từ Supabase khi có ứng viên mới nộp đơn
    const channel = supabase
      .channel('realtime_job_applications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'job_applications' },
        () => {
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Thay đổi trạng thái ứng viên
  const handleUpdateStatus = async (appId: string, newStatus: JobApplicationStatus) => {
    // 1. Optimistic UI update
    setApplications(prev => {
      const updated = prev.map(a => a.id === appId ? { ...a, status: newStatus } : a);
      localStorage.setItem('pk88_job_applications', JSON.stringify(updated));
      return updated;
    });

    // 2. Ghi lên Supabase
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('id', appId);

      if (error) {
        console.warn('Lỗi update status trên Supabase:', error.message);
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái ứng viên:', err);
    }
  };

  // Xóa hồ sơ ứng viên
  const handleDeleteApplication = async (appId: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ của ứng viên "${name}" khỏi hệ thống?`)) return;

    setApplications(prev => {
      const updated = prev.filter(a => a.id !== appId);
      localStorage.setItem('pk88_job_applications', JSON.stringify(updated));
      return updated;
    });

    try {
      await supabase.from('job_applications').delete().eq('id', appId);
    } catch (err) {
      console.warn('Lỗi xóa trên Supabase:', err);
    }
  };

  // Mở modal xác nhận chuyển thành nhân viên
  const handleOpenConvertModal = (candidate: JobApplication) => {
    setCandidateToConvert(candidate);
    const validBranch = branches.find(b => b.id === candidate.branch_id)?.id 
      || getBranchIdByCode(candidate.branch_id) 
      || branches[0]?.id 
      || '';
    setConvertBranchId(validBranch);
    setConvertRole((candidate.role_applied as UserRole) || 'sales');
  };

  // Thực hiện chuyển thành nhân viên
  const handleConfirmConvert = async () => {
    if (!candidateToConvert) return;

    // Kiểm tra xem SĐT đã có trong danh sách nhân sự chưa
    const existingStaff = staffList.find(s => s.phone.trim() === candidateToConvert.phone.trim());
    if (existingStaff) {
      const confirmProceed = window.confirm(
        `⚠️ Số điện thoại ${candidateToConvert.phone} đã thuộc về nhân viên "${existingStaff.fullName}". Bạn có chắc chắn muốn tiếp tục tạo thêm tài khoản này?`
      );
      if (!confirmProceed) return;
    }

    setIsConverting(true);

    const newStaffData = {
      full_name: candidateToConvert.full_name,
      phone: candidateToConvert.phone,
      branch_id: convertBranchId,
      role: convertRole,
      is_active: true
    };

    try {
      // 1. Ghi vào bảng staff trên Supabase
      const { data: insertedStaff, error: staffError } = await supabase
        .from('staff')
        .insert([newStaffData])
        .select()
        .single();

      if (staffError) {
        console.error('Lỗi thêm staff vào Supabase:', staffError);
        alert(`⚠️ Lỗi khi thêm nhân sự: ${staffError.message}`);
        setIsConverting(false);
        return;
      }

      // 2. Cập nhật hồ sơ ứng viên thành 'hired'
      await handleUpdateStatus(candidateToConvert.id, 'hired');

      // 3. Refresh danh sách nhân viên
      onRefreshStaff?.();

      alert(
        `🎉 Chúc mừng! Đã chuyển ứng viên "${candidateToConvert.full_name}" thành nhân sự mới (Thử việc).\n` +
        `• Chi nhánh: ${getBranchName(convertBranchId)}\n` +
        `• Vị trí: ${ROLE_LABELS[convertRole] || convertRole}\n` +
        `• Số điện thoại: ${candidateToConvert.phone}\n\n` +
        `Nhân sự mới đã có thể đăng nhập bằng SĐT để bắt đầu Chấm Công GPS và Học LMS 60 ngày!`
      );

      setCandidateToConvert(null);
    } catch (err: any) {
      console.error('Lỗi ngoại lệ khi onboard nhân sự:', err);
      alert('Đã xảy ra lỗi khi chuyển đổi nhân sự. Vui lòng thử lại.');
    } finally {
      setIsConverting(false);
    }
  };

  // Thêm hồ sơ ứng viên thủ công
  const handleAddManualCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newPhone.trim()) {
      alert('Vui lòng nhập Họ tên và Số điện thoại');
      return;
    }

    const payload: Partial<JobApplication> = {
      branch_id: newBranchId || branches[0]?.id || '',
      full_name: newFullName.trim(),
      phone: newPhone.trim(),
      role_applied: newRole,
      experience_note: newNote.trim() || 'Hồ sơ do HR tạo trực tiếp',
      status: 'pending'
    };

    try {
      const { data, error } = await supabase
        .from('job_applications')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.warn('Lỗi lưu Supabase (lưu cache):', error.message);
        const newApp: JobApplication = {
          id: `manual-${Date.now()}`,
          branch_id: newBranchId || branches[0]?.id || '',
          full_name: newFullName.trim(),
          phone: newPhone.trim(),
          role_applied: newRole,
          experience_note: newNote.trim() || 'Hồ sơ do HR tạo trực tiếp',
          status: 'pending',
          created_at: new Date().toISOString()
        };
        setApplications(prev => [newApp, ...prev]);
      } else if (data) {
        setApplications(prev => [data, ...prev]);
      }

      setShowAddModal(false);
      setNewFullName('');
      setNewPhone('');
      setNewNote('');
      alert('✅ Đã thêm hồ sơ ứng viên thành công!');
    } catch (err) {
      console.error('Lỗi khi thêm hồ sơ:', err);
    }
  };

  // Hàm chuyển đổi tên chi nhánh thông minh (chuẩn hóa cả UUID lẫn mã legacy)
  const getBranchName = (bId: string) => {
    if (!bId) return 'Chưa phân chi nhánh';
    const found = branches.find(b => b.id === bId);
    if (found) return found.name;

    // Kiểm tra mã legacy nếu có
    const lower = bId.toLowerCase();
    if (lower.includes('mt') || lower.includes('mytho')) {
      const match = branches.find(b => b.code.includes('MYTHO') || b.name.includes('Mỹ Tho'));
      if (match) return match.name;
    }
    if (lower.includes('ct') || lower.includes('cantho')) {
      const match = branches.find(b => b.code.includes('CANTHO') || b.name.includes('Cần Thơ'));
      if (match) return match.name;
    }
    if (lower.includes('bt1') || lower.includes('dongkhoi')) {
      const match = branches.find(b => b.code.includes('DONGKHOI') || b.name.includes('Đồng Khởi'));
      if (match) return match.name;
    }
    if (lower.includes('bt2') || lower.includes('phukhuong')) {
      const match = branches.find(b => b.code.includes('PHUKHUONG') || b.name.includes('Phú Khương'));
      if (match) return match.name;
    }
    if (lower.includes('vl') || lower.includes('vinhlong')) {
      const match = branches.find(b => b.code.includes('VINHLONG') || b.name.includes('Vĩnh Long'));
      if (match) return match.name;
    }
    if (lower.includes('td') || lower.includes('thuduc')) {
      const match = branches.find(b => b.code.includes('THUDUC') || b.name.includes('Thủ Đức'));
      if (match) return match.name;
    }

    return bId;
  };

  // Định dạng thời gian nộp trực quan thân thiện tiếng Việt
  const formatTimeAgo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 5) return 'Vừa nộp';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays === 1) return `Hôm qua ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
      return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} lúc ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Lọc dữ liệu chuẩn xác
  const filteredApplications = applications.filter(app => {
    const appBranchName = getBranchName(app.branch_id);
    const selectedBranchObj = branches.find(b => b.id === selectedBranch);
    const targetBranchName = selectedBranchObj ? selectedBranchObj.name : '';

    const matchBranch = selectedBranch === 'ALL' || 
      app.branch_id === selectedBranch ||
      (targetBranchName && appBranchName === targetBranchName);

    const matchQuery = searchQuery === '' || 
      app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone.includes(searchQuery) ||
      (app.experience_note && app.experience_note.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchBranch && matchQuery;
  });

  const getCandidatesByStatus = (status: JobApplicationStatus) => {
    return filteredApplications.filter(a => a.status === status);
  };

  return (
    <div className="space-y-5 pt-1">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/95 border border-slate-800 p-4 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Quản Lý Tuyển Dụng & Onboarding Nhân Sự
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                {filteredApplications.length} hồ sơ
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Nhận hồ sơ tự động từ trang ứng tuyển công khai <a href="/?tab=tuyen-dung" target="_blank" className="text-amber-400 hover:underline inline-flex items-center gap-0.5 font-medium">/?tab=tuyen-dung <ExternalLink className="w-3 h-3" /></a>
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Nút xem trang ứng tuyển công khai */}
          <a
            href="/?tab=tuyen-dung"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>Xem Trang Tuyển Dụng</span>
          </a>

          {/* Nút thêm ứng viên thủ công */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Hồ Sơ</span>
          </button>

          {/* Nút làm mới */}
          <button
            onClick={fetchApplications}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition disabled:opacity-50"
            title="Tải lại danh sách từ Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 items-center gap-2 max-w-md bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Tìm theo tên ứng viên, số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-white focus:outline-none w-full placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent text-slate-200 border-none focus:outline-none font-medium cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">Toàn bộ 8 chi nhánh</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                viewMode === 'kanban' 
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                viewMode === 'table' 
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bảng dữ liệu
            </button>
          </div>
        </div>
      </div>

      {/* Main View: Kanban or Table */}
      {viewMode === 'kanban' ? (
        /* KANBAN BOARD */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {(['pending', 'interview', 'hired', 'rejected'] as JobApplicationStatus[]).map((colStatus) => {
            const config = STATUS_CONFIG[colStatus];
            const colCandidates = getCandidatesByStatus(colStatus);
            const StatusIcon = config.icon;

            return (
              <div 
                key={colStatus}
                className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col space-y-3 min-h-[480px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${config.badge}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs text-white">{config.label}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {colCandidates.length}
                  </span>
                </div>

                {/* Candidate Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colCandidates.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-slate-500 text-xs text-center border-2 border-dashed border-slate-800/60 rounded-xl">
                      <span>Không có hồ sơ nào</span>
                    </div>
                  ) : (
                    colCandidates.map((cand) => (
                      <div
                        key={cand.id}
                        className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition rounded-xl p-3.5 space-y-3 shadow-md"
                      >
                        {/* Header: Avatar, Name & Role */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-amber-400 shrink-0">
                              {cand.full_name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-white leading-tight">{cand.full_name}</h4>
                              <span className="text-[11px] font-semibold text-amber-400">
                                {ROLE_LABELS[cand.role_applied] || cand.role_applied}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0 whitespace-nowrap bg-slate-950/60 px-1.5 py-0.5 rounded-md border border-slate-800">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {formatTimeAgo(cand.created_at)}
                          </span>
                        </div>

                        {/* Phone & Branch (Hiển thị Tên Thân Thiện) */}
                        <div className="space-y-1.5 text-xs bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
                          <a
                            href={`tel:${cand.phone}`}
                            className="flex items-center gap-1.5 text-slate-300 hover:text-amber-400 transition"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="font-mono font-bold text-white">{cand.phone}</span>
                            <span className="text-[10px] text-emerald-400 ml-1">(Zalo)</span>
                          </a>
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="font-medium text-amber-200/90 truncate">{getBranchName(cand.branch_id)}</span>
                          </div>
                        </div>

                        {/* Experience Note */}
                        {cand.experience_note && (
                          <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg line-clamp-3 border border-slate-800/40 italic">
                            "{cand.experience_note}"
                          </p>
                        )}

                        {/* Action Buttons: CHUẨN HÓA LOGIC THEO TỪNG CỘT */}
                        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-1.5 text-xs">
                          {/* 1. CỘT: CHỜ XÉT DUYỆT (pending) - Chưa phỏng vấn: Chỉ có Hẹn PV & Loại */}
                          {colStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(cand.id, 'rejected')}
                                className="px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 text-[11px] font-medium transition"
                              >
                                Loại
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(cand.id, 'interview')}
                                className="ml-auto px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>Hẹn Phỏng Vấn</span>
                              </button>
                            </>
                          )}

                          {/* 2. CỘT: HẸN PHỎNG VẤN (interview) - Phỏng vấn xong: Mới có nút Nhận Việc hoặc Không Đạt */}
                          {colStatus === 'interview' && (
                            <>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleUpdateStatus(cand.id, 'pending')}
                                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px] transition"
                                  title="Lùi về chờ duyệt"
                                >
                                  Lùi về
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(cand.id, 'rejected')}
                                  className="px-2 py-1 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 text-[11px] transition"
                                  title="Phỏng vấn không đạt"
                                >
                                  Không đạt
                                </button>
                              </div>
                              <button
                                onClick={() => handleOpenConvertModal(cand)}
                                className="ml-auto px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-[11px] font-black transition flex items-center gap-1 shadow-md shadow-emerald-500/20"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Nhận Việc & Onboard</span>
                              </button>
                            </>
                          )}

                          {/* 3. CỘT: ĐÃ NHẬN VIỆC (hired) - Đã vào staff: Hiển thị badge hoàn thành */}
                          {colStatus === 'hired' && (
                            <div className="w-full flex items-center justify-between">
                              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Đã Chuyển Vào Staff</span>
                              </span>
                              <button
                                onClick={() => handleUpdateStatus(cand.id, 'interview')}
                                className="text-[10px] text-slate-500 hover:text-slate-300 underline"
                              >
                                Hoàn tác
                              </button>
                            </div>
                          )}

                          {/* 4. CỘT: KHÔNG PHÙ HỢP (rejected) - Đã từ chối: TUYỆT ĐỐI KHÔNG CÓ NÚT NHẬN VIỆC */}
                          {colStatus === 'rejected' && (
                            <div className="w-full flex items-center justify-between">
                              <span className="text-[11px] text-rose-400/80 font-medium">Đã loại hồ sơ</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleUpdateStatus(cand.id, 'pending')}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition flex items-center gap-1"
                                  title="Khôi phục về trạng thái chờ duyệt"
                                >
                                  <Undo2 className="w-3 h-3 text-amber-400" />
                                  <span>Khôi phục</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteApplication(cand.id, cand.full_name)}
                                  className="px-2 py-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 text-[11px] transition"
                                  title="Xóa vĩnh viễn"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Họ và tên</th>
                  <th className="px-4 py-3">Số điện thoại (Zalo)</th>
                  <th className="px-4 py-3">Vị trí</th>
                  <th className="px-4 py-3">Chi nhánh ứng tuyển</th>
                  <th className="px-4 py-3">Thời gian nộp</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredApplications.map((cand) => {
                  const config = STATUS_CONFIG[cand.status];
                  return (
                    <tr key={cand.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                        {cand.full_name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <a href={`tel:${cand.phone}`} className="text-amber-400 hover:underline font-mono">
                          {cand.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-200 whitespace-nowrap">
                        {ROLE_LABELS[cand.role_applied] || cand.role_applied}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-slate-300 font-medium">{getBranchName(cand.branch_id)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                        {formatTimeAgo(cand.created_at)}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${config.badge}`}>
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                        {cand.status === 'interview' && (
                          <button
                            onClick={() => handleOpenConvertModal(cand)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition inline-flex items-center gap-1 shadow-sm"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Nhận việc & Onboard</span>
                          </button>
                        )}
                        {cand.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(cand.id, 'interview')}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 font-bold text-[11px] transition inline-flex items-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Hẹn PV</span>
                          </button>
                        )}
                        {cand.status === 'hired' && (
                          <span className="text-emerald-400 text-[11px] font-bold inline-flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Đã onboard
                          </span>
                        )}
                        {cand.status === 'rejected' && (
                          <button
                            onClick={() => handleUpdateStatus(cand.id, 'pending')}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                          >
                            Khôi phục
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CHUYỂN ỨNG VIÊN THÀNH NHÂN VIÊN (ONBOARDING) */}
      {candidateToConvert && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <UserCheck className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-white">Chuyển Ứng Viên Thành Nhân Viên</h3>
              </div>
              <button
                onClick={() => setCandidateToConvert(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 space-y-1">
              <p className="font-bold">✨ Cơ chế kích hoạt tự động:</p>
              <p>
                Sau khi xác nhận, ứng viên sẽ được chuyển vào bảng nhân sự với trạng thái <b>Thử việc (Probation)</b>. Nhân viên có thể dùng SĐT <b>{candidateToConvert.phone}</b> để đăng nhập, thực hiện <b>Chấm Công GPS</b> tại chi nhánh và bắt đầu học <b>Lộ trình LMS 60 ngày</b>.
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Họ và tên nhân sự</label>
                <input
                  type="text"
                  disabled
                  value={candidateToConvert.full_name}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Số điện thoại đăng nhập</label>
                <input
                  type="text"
                  disabled
                  value={candidateToConvert.phone}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Phân bổ về Chi nhánh làm việc <span className="text-red-400">*</span>
                </label>
                <select
                  value={convertBranchId}
                  onChange={(e) => setConvertBranchId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-500"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} - {b.address}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Chức vụ phân quyền (Role) <span className="text-red-400">*</span>
                </label>
                <select
                  value={convertRole}
                  onChange={(e) => setConvertRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-500"
                >
                  <option value="sales">Nhân viên Bán hàng & Tư vấn (sales)</option>
                  <option value="technician">Kỹ thuật viên Sửa chữa (technician)</option>
                  <option value="manager">Cửa hàng trưởng / Quản lý ca (manager)</option>
                  <option value="marketing">Nhân viên Marketing (marketing)</option>
                  <option value="warehouse_accountant">Thu ngân / Kế toán kho (warehouse_accountant)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCandidateToConvert(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isConverting}
                onClick={handleConfirmConvert}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isConverting ? (
                  <span>Đang xử lý...</span>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>XÁC NHẬN NHẬN VIỆC & TẠO TÀI KHOẢN</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: THÊM HỒ SƠ ỨNG VIÊN THỦ CÔNG */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                Thêm Hồ Sơ Ứng Viên Mới
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualCandidate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Họ và tên <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập họ tên ứng viên"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Số điện thoại (Zalo) <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ví dụ: 0912345678"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Chi nhánh ứng tuyển</label>
                <select
                  value={newBranchId}
                  onChange={(e) => setNewBranchId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-500"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Vị trí mong muốn</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-amber-500"
                >
                  <option value="sales">Bán hàng & Tư vấn</option>
                  <option value="technician">Kỹ thuật sửa chữa</option>
                  <option value="manager">Quản lý cửa hàng</option>
                  <option value="marketing">Marketing</option>
                  <option value="warehouse_accountant">Thu ngân / Kế toán kho</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Ghi chú kinh nghiệm / Đánh giá sơ bộ</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú kinh nghiệm hoặc ấn tượng ban đầu..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950"
                >
                  Lưu hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
