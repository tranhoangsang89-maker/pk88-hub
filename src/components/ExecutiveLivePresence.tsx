import React, { useState, useMemo, useEffect } from 'react';
import { Branch, Staff, AttendanceRecord, LeaveRequest, ShiftAssignment } from '../types';
import { getAllAssignments } from '../lib/shiftService';
import { sortBranchesByPriority } from '../lib/mockData';
import { 
  Users, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Coffee, 
  UtensilsCrossed, 
  ShieldCheck, 
  Building2, 
  Search, 
  Sparkles,
  Activity,
  Filter,
  Check,
  RefreshCw
} from 'lucide-react';

interface ExecutiveLivePresenceProps {
  branches: Branch[];
  staffList: Staff[];
  attendanceLogs: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  onRefreshAttendance?: () => void;
}

export type LiveStatusType = 
  | 'ALL' 
  | 'WORKING' 
  | 'WORKING_LATE' 
  | 'ON_BREAK' 
  | 'ON_LEAVE' 
  | 'NOT_CHECKED_IN' 
  | 'SHIFT_ENDED' 
  | 'WAITING'
  | 'UNSCHEDULED';

// Helper dịch Chức Vụ sang Tiếng Việt chuẩn mực
const formatRoleVN = (role?: string) => {
  switch (role?.toLowerCase()) {
    case 'founder': return 'Founder';
    case 'admin': return 'Quản Trị Viên';
    case 'manager': return 'Cửa Hàng Trưởng';
    case 'hr': return 'HR Tuyển Dụng';
    case 'sales': return 'Bán Hàng';
    case 'technician': return 'Kỹ Thuật';
    case 'accountant': return 'Kế Toán';
    case 'warehouse_accountant': return 'Kế Toán Kho';
    case 'marketing': return 'Marketing';
    case 'media': return 'Media / Quay Dựng';
    default: return role || 'Nhân Viên';
  }
};

export const ExecutiveLivePresence: React.FC<ExecutiveLivePresenceProps> = ({
  branches,
  staffList,
  attendanceLogs = [],
  leaveRequests = [],
  onRefreshAttendance
}) => {
  // 1. Khởi tạo ngày hôm nay theo giờ Việt Nam
  const todayStr = useMemo(() => {
    const d = new Date();
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(d);
  }, []);

  // 2. Realtime Clock: Cập nhật mỗi 30s để tự động chuyển trạng thái ca theo giờ thực tế
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Cập nhật timestamp mỗi khi có dữ liệu attendanceLogs mới từ Supabase Realtime
  useEffect(() => {
    setLastSyncTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [attendanceLogs]);

  // Lắng nghe sự kiện thay đổi lịch ca từ Ma Trận 1.1 hoặc các tab khác
  const [shiftsVersion, setShiftsVersion] = useState<number>(0);
  useEffect(() => {
    const handleShiftsUpdate = () => {
      setShiftsVersion(v => v + 1);
    };
    window.addEventListener('pk88_shifts_updated', handleShiftsUpdate);
    window.addEventListener('storage', handleShiftsUpdate);
    return () => {
      window.removeEventListener('pk88_shifts_updated', handleShiftsUpdate);
      window.removeEventListener('storage', handleShiftsUpdate);
    };
  }, []);

  // 3. Chi nhánh được chọn: 'ALL' (Toàn chuỗi) hoặc branchId cụ thể
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<LiveStatusType>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 4. Danh sách ca phân công hôm nay (Đồng bộ Ma Trận 1.1 & Cloud Supabase)
  const assignments = useMemo(() => {
    try {
      const all = getAllAssignments(staffList, branches);
      return all.filter(a => a.date === todayStr);
    } catch {
      return [];
    }
  }, [staffList, branches, todayStr, shiftsVersion]);

  // Chi nhánh active sắp xếp theo thứ tự ưu tiên chuẩn
  const activeBranches = useMemo(() => {
    return sortBranchesByPriority(branches.filter(b => b.isActive));
  }, [branches]);

  // Helper tìm records chấm công hôm nay của nhân sự (So khớp chính xác ID, SĐT, Mã NV)
  const getStaffTodayRecord = (staff: Staff): AttendanceRecord | null => {
    const records = attendanceLogs.filter(log => {
      if (!log.checkIn) return false;
      let logDate = '';
      try {
        logDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(log.checkIn));
      } catch {
        logDate = log.checkIn.slice(0, 10);
      }
      if (logDate !== todayStr) return false;

      // So khớp định danh duy nhất (UUID Supabase, SĐT, Mã NV)
      const matchId = log.staffId === staff.id;
      const matchPhone = staff.phone && (log.staffId === staff.phone || (log.notes && log.notes.includes(staff.phone)));
      const matchCode = staff.code && (log.staffId === staff.code || (log.notes && log.notes.includes(staff.code)));
      const matchName = staff.fullName && log.notes && log.notes.toLowerCase().includes(staff.fullName.toLowerCase()) && !log.notes.includes(`[CHẤM BÙ BỞI ${staff.fullName}]`);

      return matchId || matchPhone || matchCode || matchName;
    });

    if (records.length === 0) return null;
    return [...records].sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())[0];
  };

  // Helper tìm đơn nghỉ phép đã duyệt hôm nay của nhân sự
  const getStaffApprovedLeave = (staff: Staff): LeaveRequest | undefined => {
    if (!leaveRequests || leaveRequests.length === 0) return undefined;
    return leaveRequests.find(req => {
      if (req.status !== 'APPROVED') return false;
      const isMatch = req.staffId === staff.id ||
        (staff.phone && req.phone === staff.phone) ||
        (staff.fullName && req.staffName && req.staffName.trim().toLowerCase() === staff.fullName.trim().toLowerCase());
      if (!isMatch) return false;
      return todayStr >= req.startDate && todayStr <= req.endDate;
    });
  };

  // 5. Tổng hợp danh sách nhân sự trực chiến hôm nay
  const liveStaffData = useMemo(() => {
    const now = currentTime;
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const items: Array<{
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
    }> = [];

    const formatTime = (iso?: string) => {
      if (!iso) return '';
      const d = new Date(iso);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    // Helper kiểm tra assignment có thuộc về staff không
    const isStaffAssignment = (asg: ShiftAssignment, s: Staff) => {
      return asg.staffId === s.id ||
        (asg.staffPhone && s.phone && asg.staffPhone === s.phone) ||
        (asg.staffName && s.fullName && asg.staffName.trim().toLowerCase() === s.fullName.trim().toLowerCase());
    };

    // Danh sách nhân sự đang hoạt động (loại trừ hoàn toàn Founder - chủ DN)
    const activeStaff = staffList.filter(s => {
      const isFounder = s.role === 'founder' || s.code === 'PK88-FOUNDER' || s.fullName?.toLowerCase().includes('founder');
      if (isFounder) return false;
      return s.isActive !== false;
    });

    const processedStaffIds = new Set<string>();

    // A. Quét qua TẤT CẢ nhân sự đang làm việc tại chuỗi PK88
    activeStaff.forEach(staff => {
      processedStaffIds.add(staff.id);

      // Tìm ca phân công hôm nay (Ma trận 1.1)
      const asg = assignments.find(a => isStaffAssignment(a, staff));
      // Tìm dữ liệu chấm công thực tế hôm nay (nếu có)
      const rec = getStaffTodayRecord(staff);
      // Tìm đơn nghỉ phép đã duyệt hôm nay (nếu có)
      const leave = getStaffApprovedLeave(staff);

      // Xác định chi nhánh làm việc hôm nay
      // Ưu tiên: ca phân công (hỗ trợ điều động chéo) -> vị trí chấm công GPS -> chi nhánh gốc của nhân sự
      const workingBranchId = asg?.workingBranchId || rec?.branchId || staff.homeBranchId || staff.branchId;
      const workingBranch = branches.find(b => b.id === workingBranchId) || branches.find(b => b.id === staff.branchId) || branches[0];
      const isCross = (asg?.isCrossBranch) || (staff.branchId !== workingBranch.id);

      // 1. Nếu có đơn nghỉ phép đã duyệt
      if (leave) {
        const isSick = leave.type === 'SICK_LEAVE';
        items.push({
          staff,
          branch: workingBranch,
          branchId: workingBranch.id,
          assignment: asg,
          record: rec,
          leave,
          statusType: 'ON_LEAVE',
          statusLabel: isSick ? '💊 Nghỉ ốm (Đã duyệt)' : '🏖️ Nghỉ phép (Đã duyệt)',
          statusBadgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/50 shadow-sm shadow-pink-500/20',
          statusDotClass: 'bg-pink-400',
          isCrossBranch: isCross
        });
        return;
      }

      // 2. Nếu đang có chấm công (đã check-in và chưa check-out)
      if (rec && !rec.checkOut) {
        const checkInTime = formatTime(rec.checkIn);
        const isBreak = rec.isOnBreak || 
          (rec.notes && 
            (rec.notes.includes('[ĐANG NGHỈ TRƯA]') || rec.notes.includes('[ĐANG NGHỈ ĂN TỐI]') || rec.notes.includes('[ĐANG NGHỈ GIỮA CA]')) && 
            !rec.notes.includes('[KẾT THÚC NGHỈ TRƯA]') && !rec.notes.includes('[KẾT THÚC NGHỈ ĂN TỐI]') && !rec.notes.includes('[KẾT THÚC NGHỈ GIỮA CA]'));

        if (isBreak) {
          const currentHour = now.getHours();
          const isEveningBreak = rec.shiftType === 'CA_CHIEU' || (rec.notes && rec.notes.includes('ĂN TỐI')) || currentHour >= 16;
          items.push({
            staff,
            branch: workingBranch,
            branchId: workingBranch.id,
            assignment: asg,
            record: rec,
            statusType: 'ON_BREAK',
            statusLabel: isEveningBreak ? '🍱 Đang ăn tối' : '☕ Đang nghỉ trưa',
            statusBadgeClass: 'bg-amber-500/25 text-amber-200 border-amber-500/60 shadow-sm shadow-amber-500/20',
            statusDotClass: 'bg-amber-400',
            checkInTime,
            isCrossBranch: isCross
          });
          return;
        }

        // Tính trễ
        let isLate = rec.isLate || false;
        let lateM = 0;
        if (!isLate && asg?.startTime && checkInTime) {
          const [sH, sM] = asg.startTime.split(':').map(Number);
          const [cH, cM] = checkInTime.split(':').map(Number);
          if (!isNaN(sH) && !isNaN(cH)) {
            const startTotalM = sH * 60 + sM;
            const checkInTotalM = cH * 60 + cM;
            if (checkInTotalM > startTotalM + 10) {
              isLate = true;
              lateM = checkInTotalM - startTotalM;
            }
          }
        }

        if (isLate) {
          items.push({
            staff,
            branch: workingBranch,
            branchId: workingBranch.id,
            assignment: asg,
            record: rec,
            statusType: 'WORKING_LATE',
            statusLabel: `🟠 ${checkInTime} (Trễ ${lateM > 0 ? `${lateM}p` : ''})`,
            statusBadgeClass: 'bg-amber-500/25 text-amber-200 border-amber-400 shadow-sm shadow-amber-500/30 ring-1 ring-amber-400/50',
            statusDotClass: 'bg-amber-400 animate-pulse',
            checkInTime,
            lateMinutes: lateM,
            isCrossBranch: isCross
          });
        } else {
          items.push({
            staff,
            branch: workingBranch,
            branchId: workingBranch.id,
            assignment: asg,
            record: rec,
            statusType: 'WORKING',
            statusLabel: asg ? `🟢 ${checkInTime} Đang làm` : `⚡ ${checkInTime} Trực ngoài lịch`,
            statusBadgeClass: asg 
              ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400 shadow-sm shadow-emerald-500/20' 
              : 'bg-cyan-500/25 text-cyan-200 border-cyan-400 shadow-sm shadow-cyan-500/20',
            statusDotClass: asg ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400',
            checkInTime,
            isCrossBranch: isCross
          });
        }
        return;
      }

      // 3. Nếu đã check-out ra ca hôm nay
      if (rec && rec.checkOut) {
        const checkInTime = formatTime(rec.checkIn);
        const checkOutTime = formatTime(rec.checkOut);
        items.push({
          staff,
          branch: workingBranch,
          branchId: workingBranch.id,
          assignment: asg,
          record: rec,
          statusType: 'SHIFT_ENDED',
          statusLabel: asg ? `🏁 Ra ca ${checkOutTime}` : `🏁 Ra ca ${checkOutTime} (Ngoài lịch)`,
          statusBadgeClass: 'bg-blue-500/20 text-blue-200 border-blue-400/40',
          statusDotClass: 'bg-blue-400',
          checkInTime,
          checkOutTime,
          isCrossBranch: isCross
        });
        return;
      }

      // 4. Nếu có ca phân công trong Ma Trận 1.1 nhưng chưa check-in
      if (asg) {
        if (asg.status === 'OFF') {
          items.push({
            staff,
            branch: workingBranch,
            branchId: workingBranch.id,
            assignment: asg,
            statusType: 'SHIFT_ENDED',
            statusLabel: '☕ Nghỉ theo lịch (OFF)',
            statusBadgeClass: 'bg-slate-800/80 text-slate-400 border-slate-700/60',
            statusDotClass: 'bg-slate-500',
            isCrossBranch: isCross
          });
          return;
        }

        if (currentHHMM >= asg.startTime) {
          items.push({
            staff,
            branch: workingBranch,
            branchId: workingBranch.id,
            assignment: asg,
            statusType: 'NOT_CHECKED_IN',
            statusLabel: `⚠️ Chưa check-in (Quá giờ ${asg.startTime})`,
            statusBadgeClass: 'bg-rose-500/25 text-rose-200 border-rose-500/60 shadow-sm shadow-rose-500/20 animate-pulse',
            statusDotClass: 'bg-rose-500 animate-ping',
            isCrossBranch: isCross
          });
        } else {
          items.push({
            staff,
            branch: workingBranch,
            branchId: workingBranch.id,
            assignment: asg,
            statusType: 'WAITING',
            statusLabel: `⏳ Chờ ca (${asg.startTime} - ${asg.endTime})`,
            statusBadgeClass: 'bg-slate-800/80 text-slate-400 border-slate-700/60',
            statusDotClass: 'bg-slate-500',
            isCrossBranch: isCross
          });
        }
        return;
      }

      // 5. Chưa có lịch phân ca hôm nay trong Ma Trận 1.1 VÀ chưa chấm công
      items.push({
        staff,
        branch: workingBranch,
        branchId: workingBranch.id,
        statusType: 'UNSCHEDULED',
        statusLabel: '☕ Chưa xếp ca hôm nay',
        statusBadgeClass: 'bg-slate-900/90 text-slate-400 border border-slate-800 shadow-inner',
        statusDotClass: 'bg-slate-600',
        isCrossBranch: false
      });
    });

    // B. Kiểm tra bổ sung nhân sự có ca hoặc chấm công nhưng không có trong activeStaff (ví dụ tài khoản mới/vãng lai)
    assignments.forEach(asg => {
      if (asg.status === 'OFF') return;
      const alreadyProcessed = items.some(i => i.assignment?.id === asg.id || i.staff.id === asg.staffId);
      if (alreadyProcessed) return;

      const staff = staffList.find(s => isStaffAssignment(asg, s));
      if (!staff) return;

      const workingBranch = branches.find(b => b.id === asg.workingBranchId) || branches[0];
      const rec = getStaffTodayRecord(staff);

      if (rec && !rec.checkOut) {
        const checkInTime = formatTime(rec.checkIn);
        items.push({
          staff,
          branch: workingBranch,
          branchId: workingBranch.id,
          assignment: asg,
          record: rec,
          statusType: 'WORKING',
          statusLabel: `🟢 ${checkInTime} Đang làm`,
          statusBadgeClass: 'bg-emerald-500/25 text-emerald-200 border-emerald-400 shadow-sm shadow-emerald-500/20',
          statusDotClass: 'bg-emerald-400 animate-ping',
          checkInTime,
          isCrossBranch: asg.isCrossBranch
        });
      } else {
        items.push({
          staff,
          branch: workingBranch,
          branchId: workingBranch.id,
          assignment: asg,
          statusType: currentHHMM >= asg.startTime ? 'NOT_CHECKED_IN' : 'WAITING',
          statusLabel: currentHHMM >= asg.startTime ? `⚠️ Chưa check-in (${asg.startTime})` : `⏳ Chờ ca (${asg.startTime})`,
          statusBadgeClass: currentHHMM >= asg.startTime 
            ? 'bg-rose-500/25 text-rose-200 border-rose-500/60 shadow-sm shadow-rose-500/20' 
            : 'bg-slate-800/80 text-slate-400 border-slate-700/60',
          statusDotClass: currentHHMM >= asg.startTime ? 'bg-rose-500' : 'bg-slate-500',
          isCrossBranch: asg.isCrossBranch
        });
      }
    });

    return items;
  }, [assignments, staffList, branches, attendanceLogs, leaveRequests, todayStr, currentTime]);

  // 5. Thống kê quân số
  const counts = useMemo(() => {
    let working = 0;
    let late = 0;
    let onBreak = 0;
    let onLeave = 0;
    let missing = 0;
    let ended = 0;
    let waiting = 0;
    let unscheduled = 0;

    liveStaffData.forEach(item => {
      if (selectedBranchId !== 'ALL' && item.branchId !== selectedBranchId) return;
      if (item.statusType === 'WORKING') working++;
      else if (item.statusType === 'WORKING_LATE') {
        working++;
        late++;
      }
      else if (item.statusType === 'ON_BREAK') onBreak++;
      else if (item.statusType === 'ON_LEAVE') onLeave++;
      else if (item.statusType === 'NOT_CHECKED_IN') missing++;
      else if (item.statusType === 'SHIFT_ENDED') ended++;
      else if (item.statusType === 'WAITING') waiting++;
      else if (item.statusType === 'UNSCHEDULED') unscheduled++;
    });

    const totalActive = working + onBreak;
    return { working, late, onBreak, onLeave, missing, ended, waiting, unscheduled, totalActive };
  }, [liveStaffData, selectedBranchId]);

  // Đếm quân số theo từng chi nhánh để gắn lên tab
  const branchCountsMap = useMemo(() => {
    const map = new Map<string, { active: number; total: number }>();
    activeBranches.forEach(b => {
      const branchStaff = liveStaffData.filter(i => i.branchId === b.id);
      const active = branchStaff.filter(i => i.statusType === 'WORKING' || i.statusType === 'WORKING_LATE' || i.statusType === 'ON_BREAK').length;
      map.set(b.id, { active, total: branchStaff.length });
    });
    return map;
  }, [activeBranches, liveStaffData]);

  // Tổng quân số đang làm trên toàn chuỗi
  const totalActiveChain = useMemo(() => {
    return liveStaffData.filter(i => i.statusType === 'WORKING' || i.statusType === 'WORKING_LATE' || i.statusType === 'ON_BREAK').length;
  }, [liveStaffData]);

  // 6. Lọc danh sách hiển thị
  const filteredStaffItems = useMemo(() => {
    return liveStaffData.filter(item => {
      // Lọc theo chi nhánh
      if (selectedBranchId !== 'ALL' && item.branchId !== selectedBranchId) return false;

      // Lọc theo trạng thái
      if (statusFilter === 'WORKING' && item.statusType !== 'WORKING') return false;
      if (statusFilter === 'WORKING_LATE' && item.statusType !== 'WORKING_LATE') return false;
      if (statusFilter === 'ON_BREAK' && item.statusType !== 'ON_BREAK') return false;
      if (statusFilter === 'ON_LEAVE' && item.statusType !== 'ON_LEAVE') return false;
      if (statusFilter === 'NOT_CHECKED_IN' && item.statusType !== 'NOT_CHECKED_IN') return false;
      if (statusFilter === 'SHIFT_ENDED' && item.statusType !== 'SHIFT_ENDED') return false;
      if (statusFilter === 'WAITING' && item.statusType !== 'WAITING') return false;
      if (statusFilter === 'UNSCHEDULED' && item.statusType !== 'UNSCHEDULED') return false;

      // Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.staff.fullName.toLowerCase().includes(q);
        const matchPhone = item.staff.phone?.toLowerCase().includes(q);
        const matchCode = item.staff.code?.toLowerCase().includes(q);
        const matchBranch = item.branch.name.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchCode && !matchBranch) return false;
      }

      return true;
    });
  }, [liveStaffData, selectedBranchId, statusFilter, searchQuery]);

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 border border-cyan-500/30 bg-slate-900/90 shadow-2xl space-y-4">
      {/* Header: Title + Read-Only Lock Badge + Realtime Live Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-100 flex items-center gap-2 flex-wrap">
              <span>Bảng Giám Sát Trực Tiếp Quân Số Toàn Chuỗi</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Realtime Supabase Cloud</span>
              </span>
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap mt-0.5">
              <span>Đồng bộ tức thời với dữ liệu chấm công GPS tại từng cửa hàng</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400 font-mono text-[11px]">Cập nhật: {lastSyncTime}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Read-Only Safety Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-bold bg-slate-950 text-slate-300 border border-slate-800 shadow-inner">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Chế độ xem điều hành (Read-only)</span>
          </span>

          {onRefreshAttendance && (
            <button
              onClick={() => {
                onRefreshAttendance();
                setLastSyncTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              title="Đồng bộ ngay với Supabase Cloud"
            >
              <RefreshCw className="w-3 h-3 text-cyan-400" />
              <span>Đồng bộ ngay</span>
            </button>
          )}
        </div>
      </div>

      {/* Branch Selector: Pills with smooth horizontal scrolling */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Chọn Chi Nhánh Giám Sát:</span>
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {selectedBranchId === 'ALL' ? 'Đang xem Toàn Chuỗi' : branches.find(b => b.id === selectedBranchId)?.name}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Button: Toàn Chuỗi */}
          <button
            type="button"
            onClick={() => setSelectedBranchId('ALL')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
              selectedBranchId === 'ALL'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <span>🏢 Toàn Chuỗi</span>
            <span className={`text-[9.5px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              selectedBranchId === 'ALL' ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-slate-800 text-cyan-400 font-bold'
            }`}>
              {totalActiveChain}/{liveStaffData.length}
            </span>
          </button>

          {/* List of Active Branches */}
          {activeBranches.map(branch => {
            const shortName = branch.name.replace('Phụ Kiện 88 - ', '');
            const isSelected = selectedBranchId === branch.id;
            const bCounts = branchCountsMap.get(branch.id) || { active: 0, total: 0 };

            return (
              <button
                key={branch.id}
                type="button"
                onClick={() => setSelectedBranchId(branch.id)}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>📍 {shortName}</span>
                <span className={`text-[9.5px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                }`}>
                  {bCounts.active}/{bCounts.total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Status Bar & Search Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Tất cả ({filteredStaffItems.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('WORKING')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'WORKING'
                ? 'bg-emerald-500 text-slate-950 font-black'
                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Đang làm: {counts.working}</span>
          </button>

          {counts.late > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('WORKING_LATE')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'WORKING_LATE'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-400/50 hover:bg-amber-500/25'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Vào trễ: {counts.late}</span>
            </button>
          )}

          {counts.onBreak > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('ON_BREAK')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'ON_BREAK'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              <span>☕ Nghỉ giữa ca: {counts.onBreak}</span>
            </button>
          )}

          {counts.onLeave > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('ON_LEAVE')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'ON_LEAVE'
                  ? 'bg-pink-500 text-white font-black'
                  : 'bg-pink-500/15 text-pink-300 border border-pink-500/30 hover:bg-pink-500/20'
              }`}
            >
              <span>🏖️ Nghỉ phép: {counts.onLeave}</span>
            </button>
          )}

          {counts.missing > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('NOT_CHECKED_IN')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'NOT_CHECKED_IN'
                  ? 'bg-rose-500 text-white font-black'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 animate-pulse'
              }`}
            >
              <span>⚠️ Chưa check-in: {counts.missing}</span>
            </button>
          )}

          {counts.ended > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('SHIFT_ENDED')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'SHIFT_ENDED'
                  ? 'bg-blue-500 text-white font-black'
                  : 'bg-blue-500/15 text-blue-300 border border-blue-400/30 hover:bg-blue-500/20'
              }`}
            >
              <span>🏁 Đã tan ca: {counts.ended}</span>
            </button>
          )}

          {counts.unscheduled > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('UNSCHEDULED')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'UNSCHEDULED'
                  ? 'bg-slate-700 text-white font-black'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700/60 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span>☕ Chưa xếp ca: {counts.unscheduled}</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-56 flex-shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, SĐT, mã NV..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Staff Live Presence Cards Grid: 2 columns on mobile, scaling up to 5 on wide screens */}
      {filteredStaffItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
          {filteredStaffItems.map((item, idx) => {
            const { staff, branch, assignment, record, leave, statusLabel, statusBadgeClass, statusDotClass, isCrossBranch } = item;
            const branchShortName = branch.name.replace('Phụ Kiện 88 - ', '');

            return (
              <div
                key={`${staff.id}-${idx}`}
                className="rounded-xl sm:rounded-2xl p-2 sm:p-3 bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between space-y-1.5 sm:space-y-2 shadow-md relative overflow-hidden select-none"
              >
                {/* Staff Info Top */}
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs flex-shrink-0 border ${
                    isCrossBranch
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  }`}>
                    {staff.fullName.charAt(0)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-extrabold text-slate-200 text-[11px] sm:text-xs truncate block" title={staff.fullName}>
                        {staff.fullName}
                      </span>
                      {isCrossBranch && (
                        <span className="text-[7.5px] sm:text-[8px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded border border-amber-500/40 font-bold whitespace-nowrap">
                          ✈️
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono truncate">
                      <span className="text-cyan-400 font-semibold whitespace-nowrap">{staff.code || 'PK88'}</span>
                      <span>•</span>
                      <span className="text-slate-300 font-sans font-medium truncate">{formatRoleVN(staff.role)}</span>
                    </div>
                  </div>
                </div>

                {/* Location & Shift Details */}
                <div className="bg-slate-900/80 rounded-lg sm:rounded-xl p-1.5 sm:p-2 border border-slate-800/60 space-y-0.5 sm:space-y-1 text-[9.5px] sm:text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400 flex-shrink-0" />
                      <span className="font-medium">Shop:</span>
                    </span>
                    <span className="font-bold text-slate-200 truncate ml-1">{branchShortName}</span>
                  </div>

                  {assignment ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 flex-shrink-0" />
                        <span className="font-medium">Ca:</span>
                      </span>
                      <span className="font-mono font-semibold text-slate-300 truncate ml-1 text-[9px] sm:text-[10px]">
                        {assignment.startTime}-{assignment.endTime}
                      </span>
                    </div>
                  ) : record ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400 flex-shrink-0" />
                        <span className="font-medium">Chấm công:</span>
                      </span>
                      <span className="font-mono text-cyan-300 font-semibold truncate ml-1 text-[9px] sm:text-[10px]">Ngoài lịch</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500 flex-shrink-0" />
                        <span className="font-medium">Lịch ca:</span>
                      </span>
                      <span className="font-mono text-slate-400 italic text-[9px] sm:text-[10px] truncate ml-1">Chưa xếp ca</span>
                    </div>
                  )}

                  {leave && leave.replacementStaffName && (
                    <div className="flex items-center justify-between pt-0.5 border-t border-slate-800 text-[9px] text-amber-300 truncate">
                      <span>✈️ Gánh:</span>
                      <span className="font-bold truncate ml-1">{leave.replacementStaffName}</span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className={`py-1 sm:py-1.5 px-1.5 sm:px-2 rounded-lg sm:rounded-xl border text-center text-[9.5px] sm:text-xs font-bold flex items-center justify-center gap-1 ${statusBadgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDotClass}`} />
                  <span className="truncate">{statusLabel}</span>
                </div>

                {/* GPS Verification Tag (If record exists) */}
                {record && (
                  <div className="flex items-center justify-between text-[8.5px] sm:text-[9.5px] font-mono text-slate-400 px-0.5 pt-0.5 truncate">
                    <span>
                      {record.isOutsideGeofence ? (
                        <span className="text-rose-400 flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" />
                          <span>Lệch GPS</span>
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5 flex-shrink-0" />
                          <span>Đúng shop</span>
                        </span>
                      )}
                    </span>
                    {record.workHours ? (
                      <span className="text-cyan-300 font-bold ml-1">{record.workHours}h</span>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center flex flex-col items-center justify-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-300">Không tìm thấy nhân sự phù hợp với bộ lọc</p>
          <p className="text-[11px] text-slate-500">
            Thử chuyển sang chọn "Toàn Chuỗi" hoặc xóa từ khóa tìm kiếm để xem tất cả nhân sự trực hôm nay.
          </p>
        </div>
      )}
    </div>
  );
};
