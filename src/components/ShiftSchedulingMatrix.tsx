import React, { useState, useMemo, useEffect } from 'react';
import { Staff, Branch, ShiftDefinition, ShiftAssignment, ShiftAssignmentStatus, AttendanceRecord, LeaveRequest } from '../types';
import { 
  getShiftDefinitions, 
  getAllAssignments, 
  saveAssignment, 
  autoFillBiWeeklyCycle, 
  reportSickLeaveAndOpenShift, 
  claimOpenShift, 
  dispatchCrossBranchStaff, 
  saveShiftDefinition, 
  deleteShiftDefinition,
  resetDefaultShiftDefinitions,
  calculateShiftHours, 
  getBiWeeklyDates, 
  clearBranchAssignments,
  clearAllAssignments,
  deleteAssignment,
  clearStaffAssignmentsAtBranch,
  fetchShiftAssignmentsFromCloud,
  syncShiftAssignmentsToCloud,
  fetchShiftDefinitionsFromCloud,
  syncShiftDefinitionsToCloud
} from '../lib/shiftService';
import { supabase } from '../lib/supabase';
import { 
  Calendar, 
  Clock, 
  Users, 
  Building2, 
  Zap, 
  Plane, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Sliders, 
  RefreshCw, 
  ArrowRightLeft, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  ShieldAlert, 
  ShieldCheck,
  Sparkles, 
  X, 
  DollarSign, 
  HeartPulse, 
  Flame, 
  Award,
  Trash2,
  FileSpreadsheet,
  Activity,
  CheckCircle,
  Coffee
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ShiftSchedulingMatrixProps {
  branches: Branch[];
  staffList: Staff[];
  attendanceLogs?: AttendanceRecord[];
  leaveRequests?: LeaveRequest[];
  currentUser?: Staff;
  onRefreshStaff?: () => void;
  defaultBranchId?: string;
  onRefreshAttendance?: () => void;
}

export const ShiftSchedulingMatrix: React.FC<ShiftSchedulingMatrixProps> = ({
  branches,
  staffList,
  attendanceLogs = [],
  leaveRequests = [],
  currentUser,
  onRefreshStaff,
  defaultBranchId,
  onRefreshAttendance
}) => {
  // RBAC Permissions
  // 1. Quản trị cấp cao (Toàn quyền xem và xếp lịch tất cả chi nhánh: Chỉ Founder, HR, Admin)
  const isHQAdmin = currentUser?.role === 'founder' || currentUser?.role === 'admin' || currentUser?.role === 'hr';

  // State for Cycle & Branch: Nếu không phải Founder, HR, Admin thì khóa cứng vào chi nhánh của nhân sự
  const userHomeBranchId = currentUser?.branchId;
  const initialBranchId = (!isHQAdmin && userHomeBranchId)
    ? userHomeBranchId
    : (defaultBranchId || userHomeBranchId || branches[0]?.id || 'c65f5a81-a5c3-45a2-b01c-4c842e41f61e');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(initialBranchId || branches[0]?.id || 'b1');

  // 2. Cửa hàng trưởng của chi nhánh đang chọn (Chỉ có quyền trên chi nhánh mình quản lý)
  const isBranchManager = currentUser?.role === 'manager' && (currentUser.branchId === selectedBranchId);

  // 3. Có quyền quản lý / xếp ca cho chi nhánh này không?
  const canManageSchedule = isHQAdmin || isBranchManager;

  // Khởi tạo thời gian thực: Tự động phát hiện ngày/tháng/năm hiện tại
  const today = useMemo(() => new Date(), []);
  const currentRealYear = today.getFullYear();
  const currentRealMonth = today.getMonth() + 1; // 1 - 12
  const currentRealDay = today.getDate();
  const todayStr = useMemo(() => {
    return `${currentRealYear}-${String(currentRealMonth).padStart(2, '0')}-${String(currentRealDay).padStart(2, '0')}`;
  }, [currentRealYear, currentRealMonth, currentRealDay]);
  const defaultInitialCycle: 'cycle1' | 'cycle2' = currentRealDay <= 15 ? 'cycle1' : 'cycle2';

  const [cycle, setCycle] = useState<'cycle1' | 'cycle2'>(defaultInitialCycle);
  const [selectedYear, setSelectedYear] = useState<number>(currentRealYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentRealMonth);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Chế độ xem: 'matrix' (Bảng ma trận 15 ngày) hoặc 'daily' (Thẻ di động theo ngày thoáng mát)
  const isMobileInitial = typeof window !== 'undefined' && window.innerWidth < 768;
  const [viewMode, setViewMode] = useState<'matrix' | 'daily'>(isMobileInitial ? 'daily' : 'matrix');
  const [selectedDailyDate, setSelectedDailyDate] = useState<string>(todayStr);

  // Tính số ngày tối đa trong tháng đang chọn (28, 29, 30 hoặc 31 ngày)
  const lastDayOfMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const monthStr = String(selectedMonth).padStart(2, '0');
  const cycle1Text = `Kỳ 1 (01/${monthStr} - 15/${monthStr})`;
  const cycle2Text = `Kỳ 2 (16/${monthStr} - ${lastDayOfMonth}/${monthStr})`;

  // Danh sách các tháng để chọn nhanh (2 năm trước & 2 năm tới)
  const monthOptions = useMemo(() => {
    const list = [];
    for (let y = currentRealYear - 1; y <= currentRealYear + 1; y++) {
      for (let m = 1; m <= 12; m++) {
        list.push({
          value: `${y}-${m}`,
          label: `Tháng ${String(m).padStart(2, '0')}/${y}`,
          year: y,
          month: m
        });
      }
    }
    return list;
  }, [currentRealYear]);

  // Điều hướng tháng trước
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  // Điều hướng tháng sau
  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  // Trở về tháng & kỳ hiện tại
  const handleGoToCurrentMonth = () => {
    setSelectedYear(currentRealYear);
    setSelectedMonth(currentRealMonth);
    setCycle(defaultInitialCycle);
  };

  const isCurrentMonth = selectedYear === currentRealYear && selectedMonth === currentRealMonth;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Tự động chuyển chi nhánh đang chọn về chi nhánh của nhân sự nếu không phải là Admin tổng
  React.useEffect(() => {
    if (currentUser?.branchId && !isHQAdmin) {
      setSelectedBranchId(currentUser.branchId);
    }
  }, [currentUser?.id, currentUser?.branchId, isHQAdmin]);

  // Shift Definitions & Assignments
  const [shiftDefs, setShiftDefs] = useState<ShiftDefinition[]>(() => getShiftDefinitions());
  const [assignments, setAssignments] = useState<ShiftAssignment[]>(() => getAllAssignments(staffList, branches));
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setIsCloudSyncing(true);
    Promise.all([
      fetchShiftAssignmentsFromCloud(),
      fetchShiftDefinitionsFromCloud()
    ]).then(([cloudList, cloudDefs]) => {
      if (!active) return;
      if (cloudList && cloudList.length > 0) {
        setAssignments(cloudList);
      } else {
        const local = getAllAssignments(staffList, branches);
        if (local.length > 0) {
          syncShiftAssignmentsToCloud(local);
        }
      }
      if (cloudDefs && cloudDefs.length > 0) {
        setShiftDefs(cloudDefs);
      } else {
        const localDefs = getShiftDefinitions();
        syncShiftDefinitionsToCloud(localDefs);
      }
      setIsCloudSyncing(false);
    }).catch(() => {
      if (active) setIsCloudSyncing(false);
    });

    return () => { active = false; };
  }, [staffList, branches]);

  // Modals state
  const [showAutoFillModal, setShowAutoFillModal] = useState<boolean>(false);
  const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showMarketplaceModal, setShowMarketplaceModal] = useState<boolean>(false);
  const [selectedCellAssignment, setSelectedCellAssignment] = useState<ShiftAssignment | null>(null);
  const [selectedCellStaff, setSelectedCellStaff] = useState<Staff | null>(null);
  const [selectedCellDate, setSelectedCellDate] = useState<string | null>(null);
  const [isAddingSecondShift, setIsAddingSecondShift] = useState<boolean>(false);
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'CROSS_BRANCH' | 'OPEN_SHIFT'>('ALL');

  // Local Attendance State for optimistic & instant updates
  const [localAttendanceLogs, setLocalAttendanceLogs] = useState<AttendanceRecord[]>(attendanceLogs);

  useEffect(() => {
    setLocalAttendanceLogs(attendanceLogs);
  }, [attendanceLogs]);

  // Form State for Manual Attendance Compensation (Chấm Bù Công 1 Chạm)
  const [compensateCheckIn, setCompensateCheckIn] = useState<string>('07:30');
  const [compensateCheckOut, setCompensateCheckOut] = useState<string>('15:30');
  const [compensateReason, setCompensateReason] = useState<string>('Quên bấm máy chấm công');
  const [isSubmittingCompensation, setIsSubmittingCompensation] = useState<boolean>(false);

  // Auto-Fill Form State
  const [autoFillStaffId, setAutoFillStaffId] = useState<string>('');
  const [autoFillShiftDefId, setAutoFillShiftDefId] = useState<string>(shiftDefs[0]?.id || '');
  const [autoFillOffDays, setAutoFillOffDays] = useState<number[]>([2]); // Default nghỉ Thứ 3

  // Cross-Branch Dispatch Form State
  const [dispatchStaffId, setDispatchStaffId] = useState<string>('');
  const [dispatchToBranchId, setDispatchToBranchId] = useState<string>(selectedBranchId);
  const [dispatchShiftDefId, setDispatchShiftDefId] = useState<string>(shiftDefs[0]?.id || '');
  const [dispatchStartDate, setDispatchStartDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [dispatchEndDate, setDispatchEndDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`;
  });
  const [dispatchNotes, setDispatchNotes] = useState<string>('Tăng cường hỗ trợ ca cao điểm');

  // Custom Shift Create Form State
  const [newShiftName, setNewShiftName] = useState<string>('');
  const [newShiftStart, setNewShiftStart] = useState<string>('07:00');
  const [newShiftEnd, setNewShiftEnd] = useState<string>('15:30');
  const [newShiftNotes, setNewShiftNotes] = useState<string>('');

  // Sick Leave Reason Modal
  const [sickLeaveReason, setSickLeaveReason] = useState<string>('Sốt cao, xin nghỉ dưỡng bệnh');
  const [sickLeaveBounty, setSickLeaveBounty] = useState<number>(50000);

  // Tự động reset nhân sự mặc định cho chức năng Đổ ca khi đổi chi nhánh
  useEffect(() => {
    const homeStaff = staffList.filter(s => 
      s.branchId === selectedBranchId && 
      s.role !== 'founder' && 
      s.code !== 'PK88-FOUNDER' && 
      !s.fullName?.toLowerCase().includes('founder')
    );
    if (homeStaff.length > 0) {
      setAutoFillStaffId(homeStaff[0].id);
    }
  }, [selectedBranchId, staffList]);

  // Helper đối soát ca đa tầng: ID, Phone, hoặc Họ Tên
  const isAssignmentForStaff = (a: ShiftAssignment, s: Staff): boolean => {
    if (a.staffId === s.id) return true;
    if (a.staffPhone && s.phone && a.staffPhone.trim() === s.phone.trim()) return true;
    if (a.staffName && s.fullName) {
      const n1 = a.staffName.trim().toLowerCase();
      const n2 = s.fullName.trim().toLowerCase();
      if (n1 === n2) return true;
      // Tránh so khớp lỏng lẻo 1 từ đơn (như chữ 'tuấn' gây trùng giữa Liêu Thanh Tuấn & Vũ Tuấn Anh)
      // Chỉ match khi trùng cả họ tên hoặc biệt danh nhận diện đầy đủ:
      if (n1.includes('hiền diệu') && n2.includes('hiền diệu')) return true;
      if (n1.includes('tiểu my') && n2.includes('tiểu my')) return true;
      if (n1.includes('hoàng thống') && n2.includes('hoàng thống')) return true;
      if (n1.includes('thanh tuấn') && n2.includes('thanh tuấn')) return true;
      if (n1.includes('tuấn anh') && n2.includes('tuấn anh')) return true;
      if (n1.includes('hồng thắm') && n2.includes('hồng thắm')) return true;
    }
    return false;
  };

  // Active dates for current cycle (15 days)
  const cycleDates = useMemo(() => {
    return getBiWeeklyDates(selectedYear, selectedMonth, cycle);
  }, [selectedYear, selectedMonth, cycle]);

  // Tự động đồng bộ ngày điều động theo kỳ đang xem
  useEffect(() => {
    if (cycleDates.length > 0) {
      setDispatchStartDate(cycleDates[0]);
      setDispatchEndDate(cycleDates[cycleDates.length - 1]);
      if (!cycleDates.includes(selectedDailyDate)) {
        if (cycleDates.includes(todayStr)) {
          setSelectedDailyDate(todayStr);
        } else {
          setSelectedDailyDate(cycleDates[0]);
        }
      }
    }
  }, [cycleDates, todayStr]);

  // Selected Branch object
  const currentBranch = useMemo(() => {
    return branches.find(b => b.id === selectedBranchId) || branches[0];
  }, [branches, selectedBranchId]);

  // Filter staff working at or dispatched to this branch (Loại trừ hoàn toàn Founder)
  const activeStaffForMatrix = useMemo(() => {
    let list = staffList.filter(s => {
      // LOẠI TRỪ FOUNDER (Chủ doanh nghiệp được miễn xếp ca & chấm công)
      const isFounder = s.role === 'founder' || s.code === 'PK88-FOUNDER' || s.fullName?.toLowerCase().includes('founder');
      if (isFounder) return false;

      const isHomeBranch = s.branchId === selectedBranchId;
      const isWorkingHere = assignments.some(
        a => a.workingBranchId === selectedBranchId && cycleDates.includes(a.date) && isAssignmentForStaff(a, s)
      );
      return isHomeBranch || isWorkingHere;
    });

    // Lọc nhanh theo nút bấm KPI
    if (quickFilter === 'CROSS_BRANCH') {
      list = list.filter(s => {
        const isCross = s.branchId !== selectedBranchId;
        const hasCrossAsg = assignments.some(
          a => a.workingBranchId === selectedBranchId && cycleDates.includes(a.date) && a.isCrossBranch && isAssignmentForStaff(a, s)
        );
        return isCross || hasCrossAsg;
      });
    } else if (quickFilter === 'OPEN_SHIFT') {
      list = list.filter(s => {
        return assignments.some(
          a => a.workingBranchId === selectedBranchId && cycleDates.includes(a.date) && a.status === 'OPEN_SHIFT' && isAssignmentForStaff(a, s)
        );
      });
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(s => s.fullName.toLowerCase().includes(q) || s.phone.includes(q));
    }

    return list;
  }, [staffList, selectedBranchId, assignments, cycleDates, searchTerm, quickFilter]);

  // Open Shifts in current cycle (e.g. sick leave)
  const openShifts = useMemo(() => {
    return assignments.filter(a => a.status === 'OPEN_SHIFT');
  }, [assignments]);

  // Cross-branch staff count
  const crossBranchCount = useMemo(() => {
    return assignments.filter(a => a.workingBranchId === selectedBranchId && a.isCrossBranch && cycleDates.includes(a.date)).length;
  }, [assignments, selectedBranchId, cycleDates]);

  // Total scheduled hours
  const totalHours = useMemo(() => {
    return assignments
      .filter(a => a.workingBranchId === selectedBranchId && cycleDates.includes(a.date) && a.status === 'SCHEDULED')
      .reduce((sum, a) => sum + (a.hours || 0), 0);
  }, [assignments, selectedBranchId, cycleDates]);

  // Helper to format date header
  const formatDateHeader = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dayOfWeek = dayNames[d.getDay()];
    const dayNum = String(d.getDate()).padStart(2, '0');
    const isToday = dateStr === todayStr;
    return { dayOfWeek, dayNum, isToday };
  };

  // Helper to extract attendance records for a staff on a specific date
  const getStaffRecordsForDate = (staff: Staff, dateStr: string): AttendanceRecord[] => {
    if (!localAttendanceLogs || localAttendanceLogs.length === 0) return [];
    return localAttendanceLogs.filter(log => {
      if (!log.checkIn) return false;
      const logDate = log.checkIn.slice(0, 10);
      if (logDate !== dateStr) return false;
      const isMatch = log.staffId === staff.id ||
        (log.notes && staff.phone && log.notes.includes(staff.phone)) ||
        (log.notes && staff.fullName && log.notes.toLowerCase().includes(staff.fullName.toLowerCase()));
      return isMatch;
    });
  };

  // Helper to compute live attendance status for today
  const getTodayAttendanceStatus = (
    staff: Staff, 
    dayAsgs: ShiftAssignment[]
  ) => {
    const records = getStaffRecordsForDate(staff, todayStr);
    const latestRecord = records.length > 0
      ? [...records].sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())[0]
      : null;

    const formatTime = (iso?: string) => {
      if (!iso) return '';
      const d = new Date(iso);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const activeShifts = dayAsgs.filter(a => a.status !== 'OFF');
    const isOffToday = dayAsgs.length > 0 && dayAsgs.every(a => a.status === 'OFF');
    const hasScheduledShift = activeShifts.length > 0;
    const earliestStartTime = hasScheduledShift 
      ? activeShifts.reduce((min, a) => (a.startTime < min ? a.startTime : min), activeShifts[0].startTime)
      : null;

    const now = new Date();
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 1. Nếu có đơn nghỉ phép đã duyệt hôm nay
    const hasApprovedLeave = leaveRequests && leaveRequests.some(req => {
      if (req.status !== 'APPROVED') return false;
      const isMatch = req.staffId === staff.id || (staff.phone && req.phone === staff.phone);
      if (!isMatch) return false;
      return todayStr >= req.startDate && todayStr <= req.endDate;
    });

    if (hasApprovedLeave) {
      return {
        type: 'ON_LEAVE' as const,
        label: '🏖️ Nghỉ phép',
        shortLabel: 'Nghỉ phép',
        badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/50 shadow-sm shadow-pink-500/20',
        dotClass: 'bg-pink-400',
        tooltip: `${staff.fullName} đang trong kỳ nghỉ phép đã duyệt (${todayStr})`
      };
    }

    // 2. Đã chấm công và ĐANG LÀM VIỆC (chưa checkout)
    if (latestRecord && !latestRecord.checkOut) {
      const checkInTime = formatTime(latestRecord.checkIn);
      const isBreak = latestRecord.isOnBreak || 
        (latestRecord.notes && 
          (latestRecord.notes.includes('[ĐANG NGHỈ TRƯA]') || latestRecord.notes.includes('[ĐANG NGHỈ ĂN TỐI]') || latestRecord.notes.includes('[ĐANG NGHỈ GIỮA CA]')) && 
          !latestRecord.notes.includes('[KẾT THÚC NGHỈ TRƯA]') && !latestRecord.notes.includes('[KẾT THÚC NGHỈ ĂN TỐI]') && !latestRecord.notes.includes('[KẾT THÚC NGHỈ GIỮA CA]'));

      if (isBreak) {
        const currentHour = now.getHours();
        const isEveningBreak = latestRecord.shiftType === 'CA_CHIEU' || (latestRecord.notes && latestRecord.notes.includes('ĂN TỐI')) || currentHour >= 16;
        const breakLabel = isEveningBreak ? '🍱 Đang ăn tối' : '☕ Đang nghỉ trưa';
        return {
          type: 'ON_BREAK' as const,
          label: breakLabel,
          shortLabel: isEveningBreak ? 'Ăn tối' : 'Nghỉ trưa',
          time: checkInTime,
          badgeClass: 'bg-amber-500/25 text-amber-200 border-amber-500/60 shadow-sm shadow-amber-500/20',
          dotClass: 'bg-amber-400',
          tooltip: `${staff.fullName} đang tạm nghỉ ${isEveningBreak ? 'ăn tối' : 'ăn trưa'} (Vào ca lúc ${checkInTime})`
        };
      }

      return {
        type: 'WORKING' as const,
        label: `${checkInTime} Đang làm`,
        shortLabel: `${checkInTime} Đang làm`,
        time: checkInTime,
        badgeClass: 'bg-emerald-500/25 text-emerald-200 border-emerald-400 shadow-sm shadow-emerald-500/20 animate-pulse',
        dotClass: 'bg-emerald-400 animate-ping',
        tooltip: `${staff.fullName} đã check-in lúc ${checkInTime} và đang trực ca làm việc tại cửa hàng.`
      };
    }

    // 3. Đã hoàn thành ca làm và ĐÃ CHECK-OUT
    if (latestRecord && latestRecord.checkOut) {
      const checkInTime = formatTime(latestRecord.checkIn);
      const checkOutTime = formatTime(latestRecord.checkOut);
      return {
        type: 'SHIFT_ENDED' as const,
        label: `🏁 Ra ca ${checkOutTime}`,
        shortLabel: `Ra: ${checkOutTime}`,
        time: checkOutTime,
        checkInTime,
        badgeClass: 'bg-blue-500/20 text-blue-200 border-blue-400/40',
        dotClass: 'bg-blue-400',
        tooltip: `${staff.fullName} đã hoàn thành ca làm hôm nay (Vào: ${checkInTime} → Ra: ${checkOutTime})`
      };
    }

    // 4. CHƯA CHẤM CÔNG HÔM NAY
    if (hasScheduledShift && earliestStartTime) {
      if (currentHHMM >= earliestStartTime) {
        return {
          type: 'NOT_CHECKED_IN_LATE' as const,
          label: '⚠️ Chưa check-in',
          shortLabel: 'Chưa vào',
          badgeClass: 'bg-rose-500/25 text-rose-200 border-rose-500/60 shadow-sm shadow-rose-500/20 animate-pulse',
          dotClass: 'bg-rose-500 animate-ping',
          tooltip: `Đã quá giờ bắt đầu ca (${earliestStartTime}) nhưng chưa ghi nhận dữ liệu chấm công GPS!`
        };
      } else {
        return {
          type: 'WAITING_SHIFT' as const,
          label: '⏳ Chờ vào ca',
          shortLabel: 'Chờ ca',
          badgeClass: 'bg-slate-800/80 text-slate-400 border-slate-700/60',
          dotClass: 'bg-slate-500',
          tooltip: `Ca làm việc bắt đầu lúc ${earliestStartTime}. Chưa tới giờ vào ca.`
        };
      }
    }

    // 5. Nếu được xếp OFF
    if (isOffToday) {
      return {
        type: 'OFF' as const,
        label: 'OFF (Nghỉ)',
        shortLabel: 'OFF',
        badgeClass: 'bg-slate-900/50 text-slate-500 border-slate-800',
        dotClass: 'bg-slate-600',
        tooltip: 'Nhân viên nghỉ theo lịch phân ca'
      };
    }

    return null;
  };

  // Helper render badge for today's live presence
  const renderLiveAttendanceBadge = (staff: Staff, dayAsgs: ShiftAssignment[]) => {
    const attStatus = getTodayAttendanceStatus(staff, dayAsgs);
    if (!attStatus || attStatus.type === 'OFF') return null;

    return (
      <div
        className={`mt-1 flex items-center justify-center gap-1 py-0.5 px-1 rounded-md border text-[8px] font-black leading-none truncate transition-all shadow-sm ${attStatus.badgeClass}`}
        title={attStatus.tooltip}
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${attStatus.dotClass}`} />
        <span className="truncate">{attStatus.label}</span>
      </div>
    );
  };

  // Helper render audit badge for past days
  const renderPastAuditBadge = (staff: Staff, dateStr: string, dayAsgs: ShiftAssignment[]) => {
    if (dayAsgs.every(a => a.status === 'OFF')) return null;
    const pastRecords = getStaffRecordsForDate(staff, dateStr);
    if (pastRecords.length > 0) {
      const rec = pastRecords[0];
      const isCompensated = rec.notes?.includes('[CHẤM BÙ') || rec.disputeStatus === 'APPROVED' || !!rec.disputeHandledBy;
      const firstCheckIn = rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
      
      if (isCompensated) {
        return (
          <div 
            className="mt-1 flex items-center justify-center gap-0.5 py-0.5 px-1 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[7px] font-mono font-bold leading-none shadow-sm hover:scale-105 transition-all"
            title={`⚡ Đã chấm bù công ngày ${dateStr} bởi ${rec.disputeHandledBy || 'Quản lý'}: ${rec.notes || ''}`}
          >
            <span>⚡</span> <span>{firstCheckIn} (Bù)</span>
          </div>
        );
      }

      return (
        <div 
          className="mt-1 flex items-center justify-center gap-0.5 py-0.5 px-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[7px] font-mono font-bold leading-none"
          title={`Đã chấm công ngày ${dateStr} lúc ${firstCheckIn}`}
        >
          <span>✓</span> <span>{firstCheckIn}</span>
        </div>
      );
    } else {
      return (
        <div 
          className="mt-1 flex items-center justify-center gap-0.5 py-0.5 px-1 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[7px] font-bold leading-none hover:bg-rose-500/25 transition-colors"
          title={`Có lịch phân ca nhưng không tìm thấy dữ liệu chấm công GPS ngày ${dateStr}. Click vào ô để Chấm Bù Nhanh 1 chạm.`}
        >
          <span>⚠️ Chưa CC</span>
        </div>
      );
    }
  };

  // Thống kê trạng thái chấm công trực tiếp hôm nay của các nhân sự tại shop
  const todayLivePresence = useMemo(() => {
    let workingCount = 0;
    let breakCount = 0;
    let endedCount = 0;
    let missingCount = 0;
    let waitingCount = 0;

    activeStaffForMatrix.forEach(staff => {
      const dayAsgs = assignments.filter(
        a => isAssignmentForStaff(a, staff) && a.date === todayStr && a.workingBranchId === selectedBranchId
      );
      const status = getTodayAttendanceStatus(staff, dayAsgs);
      if (!status) return;
      if (status.type === 'WORKING') workingCount++;
      else if (status.type === 'ON_BREAK') breakCount++;
      else if (status.type === 'SHIFT_ENDED') endedCount++;
      else if (status.type === 'NOT_CHECKED_IN_LATE') missingCount++;
      else if (status.type === 'WAITING_SHIFT') waitingCount++;
    });

    return { workingCount, breakCount, endedCount, missingCount, waitingCount };
  }, [activeStaffForMatrix, assignments, todayStr, selectedBranchId, localAttendanceLogs, leaveRequests]);

  // Helper to get Shift Card Color & Icon
  const getShiftBadgeStyle = (assignment: ShiftAssignment) => {
    if (assignment.status === 'OFF') {
      return 'bg-slate-900/60 border-slate-800 text-slate-500 line-through';
    }
    if (assignment.status === 'OPEN_SHIFT') {
      return 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse font-extrabold shadow-lg shadow-rose-500/20';
    }
    if (assignment.isCrossBranch) {
      return 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold';
    }
    switch (assignment.shiftCode) {
      case 'HANH_CHINH':
        return 'bg-sky-500/20 border-sky-500/40 text-sky-300';
      case 'CA_SANG':
        return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300';
      case 'CA_CHIEU':
        return 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300';
      case 'CA_TRUA':
        return 'bg-purple-500/20 border-purple-500/40 text-purple-300';
      case 'CA_THU_VIEC':
        return 'bg-amber-500/20 border-amber-500/40 text-amber-300';
      case 'CA_GAY':
        return 'bg-amber-500/20 border-amber-500/50 text-amber-300';
      case 'TANG_CUONG':
        return 'bg-orange-500/20 border-orange-500/40 text-orange-300';
      default:
        return 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300';
    }
  };

  // Helper to get readable short shift label
  const getShiftDisplayName = (asg: ShiftAssignment) => {
    if (asg.shiftCode === 'HANH_CHINH') return 'Văn Phòng';
    if (asg.shiftCode === 'CA_SANG') return 'Sáng';
    if (asg.shiftCode === 'CA_CHIEU') return 'Chiều';
    if (asg.shiftCode === 'CA_TRUA') return 'Trưa';
    if (asg.shiftCode === 'CA_GAY') return 'Ca Gãy';
    if (asg.shiftCode === 'CA_THU_VIEC') return 'Thử việc';
    if (asg.shiftCode === 'TANG_CUONG') return 'T.Cường';
    if (asg.shiftName) {
      return asg.shiftName.replace(/ca\s+/i, '').trim();
    }
    return 'Ca làm';
  };

  // Helper to format salary / compensation label on matrix table
  const getStaffSalaryDisplay = (staff: Staff, cycleHours: number) => {
    const role = staff.role?.toLowerCase() || '';

    // 1. Founder: Miễn chấm công
    if (role === 'founder' || staff.code === 'PK88-FOUNDER') {
      return {
        hoursText: 'Miễn công',
        subText: '👑 Chủ Doanh Nghiệp',
        hoursColor: 'text-amber-400 font-extrabold',
        subColor: 'text-amber-400/90 font-bold'
      };
    }

    // 2. Khối Văn Phòng / Ban Chuyên Môn (Lương cứng bảo mật: Ẩn số tiền, chỉ hiển thị tiến độ ngày công)
    const officeRoles = ['admin', 'hr', 'marketing', 'accountant', 'media', 'warehouse_accountant', 'sales_head'];
    const isOffice = officeRoles.includes(role) || staff.branchId === '11111111-2222-3333-4444-555555555555';

    if (isOffice) {
      const workDays = Math.round(cycleHours / 8);
      const isFull = cycleHours >= 104; // 13 ngày * 8h = 104h

      return {
        hoursText: `${cycleHours.toFixed(1)}h`,
        subText: isFull ? '💼 Đủ công chuẩn (13 ngày)' : `💼 ${workDays}/13 ngày công`,
        hoursColor: 'text-sky-400 font-extrabold',
        subColor: 'text-sky-300 font-medium'
      };
    }

    // 3. Quản lý / Cửa hàng trưởng (Lương cứng quản lý: Ẩn số tiền)
    if (role === 'manager' || staff.salaryType === 'monthly') {
      return {
        hoursText: `${cycleHours.toFixed(1)}h`,
        subText: '💼 Lương Cứng (Quản Lý)',
        hoursColor: 'text-indigo-400 font-extrabold',
        subColor: 'text-indigo-300 font-medium'
      };
    }

    // 4. Nhân viên bán hàng / Kỹ thuật / Part-time (Tính theo giờ công thực tế)
    const rate = staff.hourlyRate || (staff.branchId?.includes('thu-duc') ? 25500 : 22700);
    const totalWage = Math.round(cycleHours * rate);
    return {
      hoursText: `${cycleHours.toFixed(1)}h`,
      subText: `${totalWage.toLocaleString('vi-VN')} đ`,
      hoursColor: 'text-emerald-400 font-extrabold',
      subColor: 'text-slate-400 font-normal'
    };
  };

  // Close Cell Modal
  const closeCellModal = () => {
    setSelectedCellAssignment(null);
    setSelectedCellStaff(null);
    setSelectedCellDate(null);
    setIsAddingSecondShift(false);
  };

  // Handle Cell Click
  const handleCellClick = (staff: Staff, dateStr: string) => {
    // Nếu không có quyền quản lý chi nhánh này:
    if (!canManageSchedule) {
      // Chỉ cho phép nhân viên bấm vào chính ô của mình để báo nghỉ ốm
      const isMyCell = staff.id === currentUser?.id || (currentUser?.phone && staff.phone === currentUser?.phone);
      if (!isMyCell) {
        showToast('🔒 Bạn không có quyền chỉnh sửa ca làm việc của đồng nghiệp khác.');
        return;
      }
    }

    setSelectedCellStaff(staff);
    setSelectedCellDate(dateStr);
    setIsAddingSecondShift(false);

    const existing = assignments.filter(
      a => isAssignmentForStaff(a, staff) &&
           a.date === dateStr &&
           a.workingBranchId === selectedBranchId
    );

    if (existing.length > 0) {
      setSelectedCellAssignment(existing[0]);
      setCompensateCheckIn(existing[0].startTime || '07:30');
      setCompensateCheckOut(existing[0].endTime || '15:30');
    } else if (canManageSchedule) {
      // Create draft assignment (chỉ Cửa hàng trưởng hoặc HR/Admin mới được tạo)
      const def = shiftDefs[0];
      const newAsg: ShiftAssignment = {
        id: `asg_${staff.id}_${dateStr}_draft_${Date.now()}`,
        staffId: staff.id,
        staffName: staff.fullName,
        staffPhone: staff.phone,
        staffRole: staff.role,
        homeBranchId: staff.branchId,
        workingBranchId: selectedBranchId,
        workingBranchName: currentBranch.name,
        date: dateStr,
        shiftDefinitionId: def.id,
        shiftCode: def.code,
        shiftName: def.name,
        startTime: def.startTime,
        endTime: def.endTime,
        hours: def.hours,
        status: 'SCHEDULED'
      };
      setSelectedCellAssignment(newAsg);
      setCompensateCheckIn(def.startTime || '07:30');
      setCompensateCheckOut(def.endTime || '15:30');
    } else {
      showToast('🔒 Bạn không có quyền tự tạo thêm ca làm việc.');
    }
    setCompensateReason('Quên bấm máy chấm công');
  };

  // Apply quick shift change on selected cell
  const handleQuickShiftChange = (shiftDef: ShiftDefinition) => {
    if (!canManageSchedule) {
      showToast('⛔ Bạn không có quyền thay đổi ca làm việc!');
      return;
    }
    if (!selectedCellAssignment) return;
    const updated: ShiftAssignment = {
      ...selectedCellAssignment,
      shiftDefinitionId: shiftDef.id,
      shiftCode: shiftDef.code,
      shiftName: shiftDef.name,
      startTime: shiftDef.startTime,
      endTime: shiftDef.endTime,
      hours: shiftDef.hours,
      status: 'SCHEDULED',
      notes: undefined
    };
    const nextList = saveAssignment(updated);
    setAssignments(nextList);
    closeCellModal();
  };

  // Add 2nd shift on the same day for this staff
  const handleAddSecondShift = (shiftDef: ShiftDefinition) => {
    if (!canManageSchedule || !selectedCellStaff || !selectedCellDate) {
      showToast('⛔ Bạn không có quyền thêm ca làm việc!');
      return;
    }
    const newSecondAsg: ShiftAssignment = {
      id: `asg_${selectedCellStaff.id}_${selectedCellDate}_ca2_${Date.now()}`,
      staffId: selectedCellStaff.id,
      staffName: selectedCellStaff.fullName,
      staffPhone: selectedCellStaff.phone,
      staffRole: selectedCellStaff.role,
      homeBranchId: selectedCellStaff.branchId,
      workingBranchId: selectedBranchId,
      workingBranchName: currentBranch.name,
      date: selectedCellDate,
      shiftDefinitionId: shiftDef.id,
      shiftCode: shiftDef.code,
      shiftName: `${shiftDef.name}`,
      startTime: shiftDef.startTime,
      endTime: shiftDef.endTime,
      hours: shiftDef.hours,
      status: 'SCHEDULED',
      notes: 'Ca làm việc thứ 2 trong ngày'
    };
    const nextList = saveAssignment(newSecondAsg);
    setAssignments(nextList);
    setIsAddingSecondShift(false);
    showToast(`✅ Đã thêm ca 2 (${shiftDef.name}) cho ngày ${selectedCellDate}`);
  };

  // Delete specific assignment from day
  const handleDeleteAssignmentFromDay = (asgId: string) => {
    const nextList = deleteAssignment(asgId);
    setAssignments(nextList);
    showToast('🗑️ Đã xóa ca làm việc');
    const remaining = nextList.filter(
      a => selectedCellStaff && isAssignmentForStaff(a, selectedCellStaff) && a.date === selectedCellDate && a.workingBranchId === selectedBranchId
    );
    if (remaining.length === 0) {
      closeCellModal();
    } else {
      setSelectedCellAssignment(remaining[0]);
    }
  };

  // Mark as OFF
  const handleMarkAsOff = () => {
    if (!canManageSchedule) {
      showToast('⛔ Bạn không có quyền chấm nghỉ luân phiên!');
      return;
    }
    if (!selectedCellAssignment) return;
    const updated: ShiftAssignment = {
      ...selectedCellAssignment,
      status: 'OFF',
      hours: 0,
      notes: 'Nghỉ luân phiên (OFF)'
    };
    const nextList = saveAssignment(updated);
    setAssignments(nextList);
    closeCellModal();
  };

  // Xóa bớt khung ca chưa hợp lý (Dành cho HR & Admin)
  const handleDeleteShiftDefinition = (def: ShiftDefinition) => {
    if (!canManageSchedule) {
      showToast('⛔ Bạn không có quyền xóa khung ca làm việc!');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa khung ca "${def.name}" (${def.startTime} - ${def.endTime}) khỏi danh sách lựa chọn không?\n\n(LƯU Ý: Thao tác này chỉ ẩn khung ca khỏi bảng chọn, không làm mất các ngày đã phân ca trước đó)`)) {
      const nextDefs = deleteShiftDefinition(def.id);
      setShiftDefs(nextDefs);
      showToast(`🗑️ Đã xóa khung ca "${def.name}"`);
    }
  };

  // Khôi phục lại toàn bộ khung ca mặc định của công ty
  const handleResetDefaultShiftDefinitions = () => {
    if (!canManageSchedule) return;
    if (window.confirm('Bạn có muốn khôi phục lại toàn bộ danh sách các khung ca mặc định của công ty không?')) {
      const nextDefs = resetDefaultShiftDefinitions();
      setShiftDefs(nextDefs);
      showToast('🔄 Đã khôi phục danh sách khung ca mặc định!');
    }
  };

  // Assignments for active modal cell
  const dayAssignmentsForModal = useMemo(() => {
    if (!selectedCellStaff || !selectedCellDate) {
      return selectedCellAssignment ? [selectedCellAssignment] : [];
    }
    return assignments.filter(
      a => isAssignmentForStaff(a, selectedCellStaff) &&
           a.date === selectedCellDate &&
           a.workingBranchId === selectedBranchId
    );
  }, [selectedCellStaff, selectedCellDate, selectedCellAssignment, assignments, selectedBranchId]);

  // Report Sick Leave
  const handleConfirmSickLeave = () => {
    if (!selectedCellAssignment) return;
    const nextList = reportSickLeaveAndOpenShift(selectedCellAssignment.id, sickLeaveReason, sickLeaveBounty);
    setAssignments(nextList);
    setSelectedCellAssignment(null);
  };

  // Chấm Bù Công Nhanh 1 Chạm & Ghi Nhận Audit Trail
  const handleConfirmAttendanceCompensation = async () => {
    if (!canManageSchedule) {
      showToast('⛔ Bạn không có quyền chấm bù công cho nhân viên!');
      return;
    }
    if (!selectedCellStaff || !selectedCellDate) {
      showToast('⚠️ Không xác định được nhân viên hoặc ngày chấm bù!');
      return;
    }

    setIsSubmittingCompensation(true);
    try {
      const dateStr = selectedCellDate;
      const staff = selectedCellStaff;
      const approverName = currentUser?.fullName || 'Quản lý cửa hàng';
      const approverRole = formatRoleVN(currentUser?.role);
      const nowTimestamp = new Date();
      const timeAuditStr = `${nowTimestamp.toLocaleTimeString('vi-VN')} ${nowTimestamp.toLocaleDateString('vi-VN')}`;

      const checkInDate = new Date(`${dateStr}T${compensateCheckIn}:00`);
      const checkOutDate = new Date(`${dateStr}T${compensateCheckOut}:00`);
      if (checkOutDate.getTime() < checkInDate.getTime()) {
        checkOutDate.setDate(checkOutDate.getDate() + 1);
      }
      const checkInIso = checkInDate.toISOString();
      const checkOutIso = checkOutDate.toISOString();

      const diffMs = checkOutDate.getTime() - checkInDate.getTime();
      const calculatedHours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);

      const shiftType = selectedCellAssignment?.shiftCode || 'HANH_CHINH';
      const reasonText = compensateReason.trim() || 'Nhân viên đi làm đầy đủ nhưng quên bấm công';
      const fullNote = `[CHẤM BÙ BỞI ${approverName} (${approverRole}) lúc ${timeAuditStr}]: ${reasonText}`;

      // Resolve db staff id & branch id
      let dbStaffId = staff.id;
      const isStaffUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dbStaffId);
      if (!isStaffUuid && staff.phone) {
        try {
          const { data: sData } = await supabase.from('staff').select('id').eq('phone', staff.phone).maybeSingle();
          if (sData?.id) dbStaffId = sData.id;
        } catch (err) {
          console.warn('Supabase staff lookup warning:', err);
        }
      }

      let dbBranchId = selectedBranchId;
      const isBranchUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dbBranchId);
      if (!isBranchUuid) {
        try {
          const { data: bData } = await supabase.from('branches').select('id').eq('name', currentBranch.name).maybeSingle();
          if (bData?.id) dbBranchId = bData.id;
        } catch (err) {
          console.warn('Supabase branch lookup warning:', err);
        }
      }

      const newRecordId = `comp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const newAttendanceRecord: AttendanceRecord = {
        id: newRecordId,
        staffId: staff.id,
        branchId: selectedBranchId,
        checkIn: checkInIso,
        checkOut: checkOutIso,
        shiftType: shiftType as any,
        workHours: calculatedHours,
        lat: currentBranch.lat,
        lng: currentBranch.lng,
        distanceMeters: 0,
        isVerified: true,
        notes: fullNote,
        disputeStatus: 'APPROVED',
        disputeHandledBy: `${approverName} (${approverRole})`,
        disputeHandledAt: nowTimestamp.toISOString(),
        disputeReason: reasonText
      };

      // 1. Optimistic UI Update: Prepend to localAttendanceLogs immediately
      setLocalAttendanceLogs(prev => [newAttendanceRecord, ...prev]);

      // 2. Insert into Supabase cloud table
      try {
        const insertPayload: any = {
          staff_id: dbStaffId,
          branch_id: dbBranchId,
          check_in: checkInIso,
          check_out: checkOutIso,
          shift_type: shiftType,
          work_hours: calculatedHours,
          lat: currentBranch.lat || 10.7769,
          lng: currentBranch.lng || 106.7009,
          distance_meters: 0,
          is_verified: true,
          dispute_status: 'APPROVED',
          dispute_handled_by: `${approverName} (${approverRole})`,
          dispute_handled_at: nowTimestamp.toISOString(),
          notes: fullNote
        };
        const { data, error } = await supabase.from('attendance').insert([insertPayload]).select();
        if (error) {
          console.warn('Supabase attendance insert error (fallback local):', error);
        } else if (data && data.length > 0) {
          setLocalAttendanceLogs(prev => prev.map(r => r.id === newRecordId ? { ...r, id: data[0].id } : r));
        }
      } catch (dbErr) {
        console.warn('Supabase attendance insert failed, saved locally:', dbErr);
      }

      // 3. Notify parent to refresh attendance records
      onRefreshAttendance?.();

      showToast(`⚡ Đã chấm bù ${calculatedHours}h công ngày ${dateStr} cho ${staff.fullName} (Lưu Audit Trail)!`);
      closeCellModal();
    } catch (e: any) {
      console.error('Lỗi khi chấm bù:', e);
      showToast('⚠️ Có lỗi xảy ra khi chấm bù: ' + (e?.message || 'Lỗi không xác định'));
    } finally {
      setIsSubmittingCompensation(false);
    }
  };

  // Claim Open Shift (Chợ Ca)
  const handleClaimOpenShift = (asg: ShiftAssignment) => {
    if (!currentUser) {
      alert('Vui lòng đăng nhập nhân sự để nhận ca gánh giúp!');
      return;
    }
    const nextList = claimOpenShift(asg.id, currentUser);
    setAssignments(nextList);
    alert(`🎉 Chúc mừng bạn ${currentUser.fullName} đã nhận ca thành công! Được cộng ${asg.hours} giờ công và thưởng nóng ${(asg.bountyBonus || 50000).toLocaleString('vi-VN')}đ.`);
  };

  // Submit Auto-Fill Bi-Weekly
  const handleAutoFillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSchedule) {
      showToast('⛔ Bạn không có quyền phân ca hàng loạt tại chi nhánh này!');
      return;
    }
    const staff = staffList.find(s => s.id === autoFillStaffId);
    const def = shiftDefs.find(d => d.id === autoFillShiftDefId);
    if (!staff || !def) return;

    const nextList = autoFillBiWeeklyCycle({
      staff,
      shiftDef: def,
      cycle,
      year: selectedYear,
      month: selectedMonth,
      workingBranch: currentBranch,
      offDaysOfWeek: autoFillOffDays,
      isCrossBranch: staff.branchId !== selectedBranchId
    });
    setAssignments(nextList);
    setShowAutoFillModal(false);
    showToast(`✅ Đã đổ ca tự động 15 ngày cho nhân sự ${staff.fullName}!`);
  };

  // Submit Cross-Branch Dispatch
  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSchedule) {
      showToast('⛔ Bạn không có quyền điều động nhân sự chéo chi nhánh!');
      return;
    }
    const staff = staffList.find(s => s.id === dispatchStaffId);
    const toBranch = branches.find(b => b.id === dispatchToBranchId);
    const def = shiftDefs.find(d => d.id === dispatchShiftDefId);
    if (!staff || !toBranch || !def) return;

    const nextList = dispatchCrossBranchStaff({
      staff,
      toBranch,
      shiftDef: def,
      startDate: dispatchStartDate,
      endDate: dispatchEndDate,
      notes: dispatchNotes
    });
    setAssignments(nextList);
    setShowDispatchModal(false);
    showToast(`✈️ Đã điều động nhân sự ${staff.fullName} sang ${toBranch.name}!`);
  };

  // Helper dịch Chức Vụ sang Tiếng Việt chuẩn mực
  const formatRoleVN = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'founder': return 'Founder';
      case 'admin': return 'Quản Trị Hệ Thống';
      case 'manager': return 'Cửa Hàng Trưởng';
      case 'sales': return 'Nhân Viên Bán Hàng';
      case 'technician': return 'Kỹ Thuật Viên';
      case 'accountant': return 'Kế Toán';
      case 'warehouse_accountant': return 'Kế Toán Kho';
      case 'hr': return 'Nhân Sự (HR)';
      case 'marketing': return 'Marketing';
      case 'media': return 'Media / Thiết Kế';
      default: return role || 'Nhân Viên';
    }
  };

  // Helper rút gọn ký hiệu ca làm cho bảng Excel ngắn gọn, tinh tế
  const getExcelShiftLabel = (asg?: ShiftAssignment) => {
    if (!asg || asg.status === 'OFF') return 'OFF';
    if (asg.status === 'OPEN_SHIFT') return 'CẦN GÁNH';
    
    // Nếu là ca Hành Chính VP
    if (asg.shiftCode === 'HANH_CHINH' || asg.shiftName?.toLowerCase().includes('hành chính') || asg.shiftName?.toLowerCase().includes('văn phòng')) {
      return 'VP (7h30-17h30)';
    }
    // Ca Sáng
    if (asg.shiftCode === 'CA_SANG' || asg.shiftName?.toLowerCase().includes('sáng')) {
      return `Sáng (${asg.startTime}-${asg.endTime})`;
    }
    // Ca Chiều
    if (asg.shiftCode === 'CA_CHIEU' || asg.shiftName?.toLowerCase().includes('chiều')) {
      return `Chiều (${asg.startTime}-${asg.endTime})`;
    }
    // Ca Gãy
    if (asg.shiftCode === 'CA_GAY' || asg.shiftName?.toLowerCase().includes('gãy')) {
      return `Ca Gãy (${asg.startTime}-${asg.endTime})`;
    }
    // Ca Trưa
    if (asg.shiftCode === 'CA_TRUA' || asg.shiftName?.toLowerCase().includes('trưa')) {
      return `Trưa (${asg.startTime}-${asg.endTime})`;
    }
    // Tăng Cường
    if (asg.shiftCode === 'TANG_CUONG' || asg.isCrossBranch) {
      return `T.Cường (${asg.startTime}-${asg.endTime})`;
    }
    // Mặc định tên ca
    const cleanName = asg.shiftName?.replace(/ca\s+/i, '').trim() || 'Ca làm';
    return `${cleanName} (${asg.startTime}-${asg.endTime})`;
  };

  // Xuất Lịch Chia Ca ra file Excel (.xlsx) chuẩn A4 chuyên nghiệp
  const handleExportScheduleExcel = () => {
    try {
      const cycleLabel = cycle === 'cycle1' ? 'Kỳ 1 (Ngày 01 đến 15)' : 'Kỳ 2 (Ngày 16 đến cuối tháng)';
      const monthYearTitle = `Tháng ${selectedMonth}/${selectedYear}`;
      
      // 1. Tiêu đề bảng (Header Title Banner)
      const excelData: any[][] = [
        [`HỆ THỐNG PHỤ KIỆN 88 - BẢNG CHIA CA LÀM VIỆC`],
        [`Chi nhánh: ${currentBranch.name} | ${cycleLabel} | ${monthYearTitle}`],
        [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} | Đơn vị tính: Giờ công thực tế`],
        [] // Dòng trống ngăn cách
      ];

      // 2. Dòng tiêu đề cột chính
      const headerRow = [
        'STT',
        'Mã NV',
        'Họ Và Tên',
        'Chức Vụ',
        'Nơi Làm Việc'
      ];

      // Thêm 15 ngày của kỳ vào tiêu đề với khoảng cách rõ ràng (Ví dụ: "T5 - 01/10")
      cycleDates.forEach(dateStr => {
        const { dayOfWeek, dayNum } = formatDateHeader(dateStr);
        headerRow.push(`${dayOfWeek} (${dayNum})`);
      });

      headerRow.push('Tổng Giờ');
      headerRow.push('Ghi Chú');
      excelData.push(headerRow);

      // 3. Dữ liệu từng nhân viên
      activeStaffForMatrix.forEach((staff, idx) => {
        const isCross = staff.branchId !== selectedBranchId;
        const homeBranch = branches.find(b => b.id === (staff.homeBranchId || staff.branchId));
        
        let staffTotalHours = 0;
        const row = [
          idx + 1,
          staff.code || `NV-${idx + 1}`,
          staff.fullName,
          formatRoleVN(staff.role),
          isCross ? `Tăng cường từ ${homeBranch?.name || 'shop khác'}` : 'Tại shop'
        ];

        // Duyệt từng ngày trong kỳ
        cycleDates.forEach(dateStr => {
          const dayAsgs = assignments.filter(
            a => isAssignmentForStaff(a, staff) &&
                 a.date === dateStr &&
                 a.workingBranchId === selectedBranchId
          );

          if (dayAsgs.length === 0 || dayAsgs.every(a => a.status === 'OFF')) {
            row.push('OFF');
          } else if (dayAsgs.some(a => a.status === 'OPEN_SHIFT')) {
            row.push('CẦN GÁNH');
          } else if (dayAsgs.length === 1 && (dayAsgs[0].shiftCode === 'CA_GAY' || dayAsgs[0].shiftName?.toLowerCase().includes('gãy'))) {
            row.push('Ca Gãy (7h-12h & 17h-22h)');
            staffTotalHours += (dayAsgs[0].hours || 10);
          } else if (dayAsgs.length >= 2) {
            const labels = dayAsgs.map(a => getExcelShiftLabel(a)).join(' + ');
            row.push(labels);
            dayAsgs.forEach(a => { staffTotalHours += (a.hours || 0); });
          } else {
            row.push(getExcelShiftLabel(dayAsgs[0]));
            staffTotalHours += (dayAsgs[0].hours || 0);
          }
        });

        // Founder hoặc Ban Quản Trị đặc thù
        const isFounderOrAdmin = staff.role?.toLowerCase() === 'founder' || staff.code === 'PK88-FOUNDER';
        row.push(isFounderOrAdmin ? 'Miễn công' : `${staffTotalHours} giờ`);
        row.push(isCross ? 'Chi nhánh cử sang tăng cường' : '');
        excelData.push(row);
      });

      // 4. Tạo worksheet từ dữ liệu mảng 2 chiều (aoa_to_sheet)
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);

      // Căn chỉnh độ rộng cột (Column Widths) rộng rãi, không bị che chữ
      const colWidths = [
        { wch: 6 },   // STT
        { wch: 14 },  // Mã NV
        { wch: 24 },  // Họ Và Tên
        { wch: 20 },  // Chức Vụ
        { wch: 16 },  // Nơi Làm Việc (Tại shop / Tăng cường)
      ];
      // 15 ngày: mỗi ngày rộng 18 ký tự hiển thị trọn vẹn "VP (7h30-17h30)"
      cycleDates.forEach(() => {
        colWidths.push({ wch: 18 });
      });
      colWidths.push({ wch: 12 }); // Tổng giờ
      colWidths.push({ wch: 24 }); // Ghi chú

      worksheet['!cols'] = colWidths;

      // Bật wrapText và căn giữa cho tất cả các ô trong bảng
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z50');
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[cellAddress]) continue;
          if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
          worksheet[cellAddress].s.alignment = { 
            wrapText: true, 
            vertical: 'center',
            horizontal: C >= 5 && C < 5 + cycleDates.length ? 'center' : 'left'
          };
        }
      }

      // 5. Tạo workbook và xuất file
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Lịch Chia Ca');
      
      const cycleSlug = cycle === 'cycle1' ? 'Ky1_01-15' : 'Ky2_16-CuoiThang';
      const branchSlug = currentBranch.name.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Bang_Chia_Ca_${branchSlug}_${cycleSlug}_T${selectedMonth}_${selectedYear}.xlsx`;
      
      XLSX.writeFile(workbook, fileName);
      showToast(`📥 Đã xuất Bảng Chia Ca Excel: ${fileName}`);
    } catch (e: any) {
      console.error('Error exporting schedule to Excel:', e);
      showToast('⚠️ Không thể xuất file Excel: ' + (e?.message || 'Lỗi không xác định'));
    }
  };

  // Submit New Custom Shift Definition
  const handleCreateCustomShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSchedule) {
      showToast('⛔ Bạn không có quyền tùy biến ca chi nhánh!');
      return;
    }
    if (!newShiftName) return;
    const hours = calculateShiftHours(newShiftStart, newShiftEnd);
    const newDef: ShiftDefinition = {
      id: `shift_custom_${Date.now()}`,
      branchId: selectedBranchId,
      code: 'TUY_CHINH',
      name: newShiftName,
      startTime: newShiftStart,
      endTime: newShiftEnd,
      hours,
      color: 'purple',
      notes: newShiftNotes || `Ca riêng chi nhánh ${currentBranch.name}`
    };
    const nextDefs = saveShiftDefinition(newDef);
    setShiftDefs(nextDefs);
    setNewShiftName('');
    setShowSettingsModal(false);
    showToast(`✅ Đã lưu khung ca mới cho chi nhánh ${currentBranch.name}!`);
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 border border-amber-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur-xl animate-in fade-in">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Control Bar */}
      <div className="glass-card rounded-2xl p-5 border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/10">
                <Calendar className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-100 tracking-tight">
                    MA TRẬN CHIA CA & ĐIỀU ĐỘNG
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    CHU KỲ 15 NGÀY
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quản lý sắp ca & HR duyệt khung giờ toàn chuỗi • Linh hoạt ca gãy, ca thử việc và tăng cường chéo chi nhánh
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Chợ Ca Thần Tốc Badge */}
            <button
              onClick={() => setShowMarketplaceModal(true)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                openShifts.length > 0
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse hover:bg-rose-500/30 shadow-md shadow-rose-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <HeartPulse className="w-4 h-4 text-rose-400" />
              <span>Chợ Ca Khẩn Cấp ({openShifts.length})</span>
            </button>

            {/* CHỈ CỬA HÀNG TRƯỞNG & HR/ADMIN MỚI ĐƯỢC XẾP LỊCH */}
            {canManageSchedule ? (
              <>
                {/* Điều Động Chéo Chi Nhánh */}
                <button
                  onClick={() => {
                    setDispatchToBranchId(selectedBranchId);
                    setShowDispatchModal(true);
                  }}
                  className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plane className="w-4 h-4 text-amber-400" />
                  <span>✈️ Điều Động Nhân Sự</span>
                </button>

                {/* Đổ Ca Tự Động 1 Chạm */}
                <button
                  onClick={() => {
                    const homeStaff = activeStaffForMatrix.filter(s => s.branchId === selectedBranchId);
                    if (homeStaff.length > 0) {
                      setAutoFillStaffId(homeStaff[0].id);
                    } else if (activeStaffForMatrix.length > 0) {
                      setAutoFillStaffId(activeStaffForMatrix[0].id);
                    }
                    setShowAutoFillModal(true);
                  }}
                  className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>⚡ Đổ Ca Cả Kỳ (30s)</span>
                </button>

                {/* Tùy Biến Khung Ca */}
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:text-cyan-300"
                  title="Tùy biến khung giờ ca làm việc riêng cho chi nhánh"
                >
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>⚙️ Tùy Biến Khung Ca</span>
                </button>

                {/* Xuất Excel Lịch Chia Ca */}
                <button
                  onClick={handleExportScheduleExcel}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-emerald-500/20 border border-slate-700/80 hover:border-emerald-500/60 text-slate-200 hover:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Xuất bảng lịch chia ca 15 ngày của chi nhánh ra file Excel (.xlsx) để in ấn hoặc lưu trữ"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>📥 Xuất Excel</span>
                </button>

                {/* Đồng Bộ Cloud Supabase */}
                <button
                  type="button"
                  onClick={async () => {
                    setIsCloudSyncing(true);
                    showToast('☁️ Đang đồng bộ dữ liệu với máy chủ Supabase Cloud...');
                    try {
                      const [cloudAsgs, cloudDefs] = await Promise.all([
                        fetchShiftAssignmentsFromCloud(),
                        fetchShiftDefinitionsFromCloud()
                      ]);

                      if (cloudAsgs && cloudAsgs.length > 0) {
                        setAssignments(cloudAsgs);
                      } else {
                        const local = getAllAssignments(staffList, branches);
                        await syncShiftAssignmentsToCloud(local);
                      }

                      if (cloudDefs && cloudDefs.length > 0) {
                        setShiftDefs(cloudDefs);
                      } else {
                        const localDefs = getShiftDefinitions();
                        await syncShiftDefinitionsToCloud(localDefs);
                      }

                      showToast('☁️ Đã đồng bộ Lịch Ca & Khung Giờ lên Supabase Cloud thành công 100%!');
                    } catch (e) {
                      showToast('⚠️ Không thể kết nối với máy chủ Supabase Cloud.');
                    } finally {
                      setIsCloudSyncing(false);
                    }
                  }}
                  disabled={isCloudSyncing}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-cyan-500/20 border border-cyan-500/40 hover:border-cyan-400 text-cyan-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Đồng bộ lịch chia ca 2 chiều với máy chủ Supabase Cloud"
                >
                  <RefreshCw className={`w-4 h-4 text-cyan-400 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                  <span>{isCloudSyncing ? 'Đang đồng bộ...' : '☁️ Đồng Bộ Cloud'}</span>
                </button>

                {/* Xóa Lịch Kỳ Này để xếp mới từ đầu */}
                <button
                  onClick={() => {
                    if (window.confirm(`Bạn có chắc chắn muốn xóa toàn bộ lịch phân ca của ${currentBranch.name} trong kỳ này không? Bảng sẽ được làm mới về 0 để bạn xếp lịch thực tế.`)) {
                      const next = clearBranchAssignments(selectedBranchId, cycleDates);
                      setAssignments(next);
                      showToast(`🗑️ Đã làm sạch lịch phân ca kỳ này của ${currentBranch.name}!`);
                    }
                  }}
                  className="px-3 py-2 bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Xóa lịch phân ca kỳ này của shop để bắt đầu xếp từ đầu"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Làm Mới Lịch</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-400">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Quyền hạn: <strong className="text-slate-300">Chỉ Xem Lịch</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Filter Bar: Branch & Bi-Weekly Cycle Switcher */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Branch Selector: Chỉ Founder, HR, Admin mới được chọn chi nhánh khác */}
            {isHQAdmin ? (
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400 font-medium">Chi nhánh:</span>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-100 focus:outline-none cursor-pointer"
                >
                  {branches.filter(b => b.isActive).map(b => (
                    <option key={b.id} value={b.id} className="bg-slate-900 text-slate-100">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* Cửa hàng trưởng (Manager) & Nhân viên: Khóa cứng hiển thị chi nhánh của mình */
              <div 
                className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 shadow-sm"
                title={`Bạn là ${formatRoleVN(currentUser?.role)} của ${currentBranch.name}. Chi nhánh được khóa cố định theo phân quyền.`}
              >
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400 font-medium">Chi nhánh:</span>
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-cyan-300">
                  <span>{currentBranch.name}</span>
                  <span className="text-[9.5px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/60 font-mono font-medium flex items-center gap-1">
                    <span>🔒</span> Cố định
                  </span>
                </div>
              </div>
            )}

            {/* Bộ Chọn & Điều Hướng Tháng / Năm */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-0.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-all cursor-pointer"
                title="Lùi về tháng trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center px-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400 mr-1.5" />
                <select
                  value={`${selectedYear}-${selectedMonth}`}
                  onChange={(e) => {
                    const [y, m] = e.target.value.split('-').map(Number);
                    setSelectedYear(y);
                    setSelectedMonth(m);
                  }}
                  className="bg-transparent text-xs font-black text-cyan-300 focus:outline-none cursor-pointer font-mono py-0.5"
                  title="Chọn tháng / năm xếp ca"
                >
                  {monthOptions.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100 font-sans">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-all cursor-pointer"
                title="Sang tháng tiếp theo"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Nút Quay Về Hiện Tại nếu đang xem tháng khác */}
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={handleGoToCurrentMonth}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                title="Quay về tháng và kỳ hiện tại"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Về hiện tại</span>
              </button>
            )}

            {/* Cycle Switcher: Kỳ 1 vs Kỳ 2 (Nhãn tự động theo tháng) */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setCycle('cycle1')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  cycle === 'cycle1'
                    ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cycle1Text}
              </button>
              <button
                onClick={() => setCycle('cycle2')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  cycle === 'cycle2'
                    ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cycle2Text}
              </button>
            </div>
          </div>

          {/* Search Box & Quick Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Quick Filter Pills */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setQuickFilter('ALL')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  quickFilter === 'ALL'
                    ? 'bg-slate-700 text-white font-extrabold shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setQuickFilter(prev => prev === 'CROSS_BRANCH' ? 'ALL' : 'CROSS_BRANCH')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  quickFilter === 'CROSS_BRANCH'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                }`}
              >
                <span>✈️ Tăng Cường ({crossBranchCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setQuickFilter(prev => prev === 'OPEN_SHIFT' ? 'ALL' : 'OPEN_SHIFT')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  quickFilter === 'OPEN_SHIFT'
                    ? 'bg-rose-500 text-white font-black shadow-md shadow-rose-500/20 animate-pulse'
                    : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
                }`}
              >
                <span>⚠️ Ca Cần Gánh ({openShifts.length})</span>
              </button>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm nhân viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nhân Sự Tại Shop</div>
            <div className="text-xl font-extrabold text-slate-100 font-mono mt-0.5">
              {activeStaffForMatrix.length} <span className="text-xs text-slate-400 font-normal">người</span>
            </div>
          </div>
          <Users className="w-5 h-5 text-cyan-400 opacity-80" />
        </div>

        <div 
          className="glass-card p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center justify-between"
          title="Tổng số giờ làm việc theo lịch phân ca dự kiến của toàn bộ nhân sự tại shop trong kỳ này. Dùng để dự toán quỹ lương và đối soát với giờ chấm công GPS thực tế."
        >
          <div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Giờ Công Kế Hoạch</span>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-300 font-semibold px-1 py-0.2 rounded border border-emerald-500/30">Dự kiến</span>
            </div>
            <div className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">
              {totalHours.toFixed(1)} <span className="text-xs text-slate-400 font-normal">giờ</span>
            </div>
            <div className="text-[9.5px] text-slate-500 mt-0.5">
              Định mức phân ca kỳ này
            </div>
          </div>
          <Clock className="w-5 h-5 text-emerald-400 opacity-80" />
        </div>

        {/* Thẻ Tăng Cường Chéo - Clickable để lọc ngay */}
        <div 
          onClick={() => setQuickFilter(prev => prev === 'CROSS_BRANCH' ? 'ALL' : 'CROSS_BRANCH')}
          className={`glass-card p-3.5 rounded-2xl border transition-all cursor-pointer ${
            quickFilter === 'CROSS_BRANCH' 
              ? 'border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/50' 
              : 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15'
          } flex items-center justify-between group`}
          title="Bấm để lọc nhanh nhân sự tăng cường chéo"
        >
          <div>
            <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>Tăng Cường Chéo</span>
              {quickFilter === 'CROSS_BRANCH' && (
                <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1 rounded">Đang lọc</span>
              )}
            </div>
            <div className="text-xl font-extrabold text-amber-300 font-mono mt-0.5">
              {crossBranchCount} <span className="text-xs text-amber-400/80 font-normal">lượt</span>
            </div>
          </div>
          <Plane className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
        </div>

        {/* Thẻ Ca Trống Cần Gánh - Clickable để lọc ngay */}
        <div 
          onClick={() => {
            if (openShifts.length > 0) {
              setQuickFilter(prev => prev === 'OPEN_SHIFT' ? 'ALL' : 'OPEN_SHIFT');
            }
          }}
          className={`glass-card p-3.5 rounded-2xl border transition-all cursor-pointer ${
            quickFilter === 'OPEN_SHIFT'
              ? 'border-rose-400 bg-rose-500/30 shadow-lg shadow-rose-500/30 ring-2 ring-rose-400/50'
              : openShifts.length > 0 
                ? 'border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 shadow-md shadow-rose-500/10' 
                : 'border-slate-800 bg-slate-900/60'
          } flex items-center justify-between group`}
          title="Bấm để lọc ca trống cần người gánh"
        >
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>Ca Trống Cần Gánh</span>
              {quickFilter === 'OPEN_SHIFT' && (
                <span className="text-[9px] bg-rose-500 text-white font-black px-1 rounded">Đang lọc</span>
              )}
            </div>
            <div className={`text-xl font-extrabold font-mono mt-0.5 ${openShifts.length > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
              {openShifts.length} <span className="text-xs text-slate-400 font-normal">ca</span>
            </div>
          </div>
          <AlertTriangle className={`w-5 h-5 ${openShifts.length > 0 ? 'text-rose-400 group-hover:scale-110' : 'text-slate-500'} transition-transform`} />
        </div>
      </div>

      {/* Real-time Attendance Presence Banner for Today */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 rounded-2xl shadow-lg">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <span>Trực Tiếp Hôm Nay</span>
            <span className="text-slate-400 font-mono text-[11px]">({todayStr})</span>:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold" title="Nhân viên đã bấm chấm công vào ca và đang làm việc">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Đang làm việc:</span>
            <span className="font-mono font-black">{todayLivePresence.workingCount}</span>
          </div>
          {todayLivePresence.breakCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold" title="Nhân viên đang tạm nghỉ trưa / ăn tối luân phiên">
              <span>☕ Nghỉ giữa ca:</span>
              <span className="font-mono font-black">{todayLivePresence.breakCount}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold" title="Đã quá giờ bắt đầu ca nhưng chưa có dữ liệu chấm công GPS">
            <span>⚠️ Chưa check-in:</span>
            <span className="font-mono font-black">{todayLivePresence.missingCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/15 border border-blue-400/30 text-blue-300 font-bold" title="Đã hoàn thành ca và check-out ra về">
            <span>🏁 Đã tan ca:</span>
            <span className="font-mono font-black">{todayLivePresence.endedCount}</span>
          </div>
          {todayLivePresence.waitingCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 font-medium" title="Chưa tới giờ vào ca theo lịch">
              <span>⏳ Chờ vào ca:</span>
              <span className="font-mono font-bold">{todayLivePresence.waitingCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* View Mode Toggle: [ 📱 Xem Theo Ngày (Tiện Di Động) ] vs [ 📊 Bảng Ma Trận (15 Ngày) ] */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
        <div className="flex items-center gap-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewMode('daily')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'daily'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span>📱 Xem Theo Ngày (Thoáng Di Động)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span>📊 Bảng Ma Trận (15 Ngày)</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 px-2 flex items-center gap-1.5 justify-center sm:justify-end">
          <span>💡</span>
          <span>{viewMode === 'daily' ? 'Chế độ cuộn dọc từng thẻ tối ưu 100% cho màn hình điện thoại' : 'Chế độ lưới ngang tổng quan 15 ngày chi nhánh'}</span>
        </div>
      </div>

      {viewMode === 'daily' ? (
        /* CHẾ ĐỘ XEM THEO NGÀY (GIAO DIỆN DI ĐỘNG CAO CẤP, RỘNG RÃI) */
        <div className="space-y-4">
          {/* Thanh Chọn Ngày Ngang (Horizontal Scroll Date Picker) */}
          <div className="glass-card p-3 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg">
            <div className="text-[11px] font-bold text-slate-400 mb-2.5 px-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>CHỌN NGÀY TRONG KỲ:</span>
              </span>
              <span className="text-cyan-300 font-mono text-xs font-extrabold bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                {formatDateHeader(selectedDailyDate).dayOfWeek}, {selectedDailyDate} {selectedDailyDate === todayStr ? '• HÔM NAY' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-700">
              {cycleDates.map(dStr => {
                const { dayOfWeek, dayNum, isToday } = formatDateHeader(dStr);
                const isSelected = dStr === selectedDailyDate;
                const hasOpenShiftOnDay = assignments.some(
                  a => a.workingBranchId === selectedBranchId && a.date === dStr && a.status === 'OPEN_SHIFT'
                );

                return (
                  <button
                    key={dStr}
                    type="button"
                    onClick={() => setSelectedDailyDate(dStr)}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-center transition-all cursor-pointer border relative min-w-[56px] ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-black border-cyan-400 shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/50 scale-105'
                        : isToday
                          ? 'bg-cyan-500/15 text-cyan-300 font-bold border-cyan-500/40 hover:bg-cyan-500/25'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-900'
                    }`}
                  >
                    <div className="text-[9.5px] uppercase font-mono">{dayOfWeek}</div>
                    <div className="text-sm font-black mt-0.5">{dayNum}</div>
                    {isToday && (
                      <div className={`text-[7px] font-black uppercase tracking-wider mt-0.5 ${isSelected ? 'text-slate-950' : 'text-cyan-400'}`}>
                        HÔM NAY
                      </div>
                    )}
                    {hasOpenShiftOnDay && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 absolute -top-1 -right-1 animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Danh Sách Thẻ Nhân Viên Cho Ngày Đang Chọn */}
          <div className="space-y-3">
            {activeStaffForMatrix.map(staff => {
              const isCross = staff.branchId !== selectedBranchId;
              const homeBranch = branches.find(b => b.id === (staff.homeBranchId || staff.branchId));
              const dayAsgs = assignments.filter(
                a => isAssignmentForStaff(a, staff) && a.date === selectedDailyDate && a.workingBranchId === selectedBranchId
              );
              const isToday = selectedDailyDate === todayStr;
              const isPast = selectedDailyDate < todayStr;
              const isOff = dayAsgs.length > 0 && dayAsgs.every(a => a.status === 'OFF');
              const isCaGay = dayAsgs.length === 1 && (dayAsgs[0].shiftCode === 'CA_GAY' || dayAsgs[0].shiftName?.toLowerCase().includes('gãy'));
              const isMultiple = dayAsgs.length >= 2;

              return (
                <div
                  key={staff.id}
                  onClick={() => handleCellClick(staff, selectedDailyDate)}
                  className="glass-card p-3.5 rounded-2xl border border-slate-800 bg-slate-900/90 hover:border-cyan-500/40 transition-all shadow-md cursor-pointer space-y-3 group"
                >
                  {/* Dòng Tiêu Đề Thẻ: Thông Tin Nhân Sự + Nút Thao Tác */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 border ${
                        isCross
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      }`}>
                        {staff.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-100 text-sm">{staff.fullName}</span>
                          {(['founder', 'admin'].includes(staff.role?.toLowerCase() || '') || staff.code === 'PK88-FOUNDER') && (
                            <span className="text-xs select-none" title="Quản trị tối cao">👑</span>
                          )}
                          {isCross && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40 font-bold">
                              ✈️ Tăng cường
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-cyan-400/90">{staff.code || 'NV'}</span>
                          <span>•</span>
                          <span>{formatRoleVN(staff.role)}</span>
                          {isCross && <span className="text-slate-500">• Gốc: {homeBranch?.name}</span>}
                        </div>
                      </div>
                    </div>

                    {canManageSchedule && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCellClick(staff, selectedDailyDate);
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <span>✏️ Đổi ca</span>
                      </button>
                    )}
                  </div>

                  {/* Chi Tiết Ca Làm Việc */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Ca làm việc {formatDateHeader(selectedDailyDate).dayOfWeek} ({selectedDailyDate}):
                      </span>
                      {dayAsgs.length > 0 && !isOff && (
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {dayAsgs.reduce((s, a) => s + (a.hours || 0), 0).toFixed(1)}h công
                        </span>
                      )}
                    </div>

                    {isCaGay ? (
                      /* Ca Gãy */
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-200">
                          <div className="font-bold text-xs">☀️ Ca Sáng</div>
                          <div className="text-[10px] font-mono font-bold text-amber-300 mt-0.5">07:00 - 12:00 (5h)</div>
                        </div>
                        <div className="p-2 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-200">
                          <div className="font-bold text-xs">🌙 Ca Tối</div>
                          <div className="text-[10px] font-mono font-bold text-indigo-300 mt-0.5">17:00 - 22:00 (5h)</div>
                        </div>
                      </div>
                    ) : isMultiple ? (
                      /* 2 Ca độc lập */
                      <div className="grid grid-cols-2 gap-2">
                        {dayAsgs.map((asg, idx) => (
                          <div key={asg.id || idx} className={`p-2 rounded-lg border text-xs font-medium ${getShiftBadgeStyle(asg)}`}>
                            <div className="font-bold">{asg.shiftName}</div>
                            <div className="text-[10px] font-mono font-bold opacity-80 mt-0.5">{asg.startTime} - {asg.endTime} ({asg.hours}h)</div>
                          </div>
                        ))}
                      </div>
                    ) : dayAsgs.length === 1 ? (
                      /* 1 Ca đơn */
                      isOff ? (
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold flex items-center justify-between">
                          <span>🌴 Nghỉ luân phiên (OFF)</span>
                          <span className="text-[10px] text-slate-500 font-normal">Không tính giờ công</span>
                        </div>
                      ) : (
                        <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${getShiftBadgeStyle(dayAsgs[0])}`}>
                          <div>
                            <div className="font-bold">{dayAsgs[0].shiftName}</div>
                            <div className="text-[10px] font-mono opacity-80 mt-0.5">{dayAsgs[0].startTime} - {dayAsgs[0].endTime}</div>
                          </div>
                          <span className="font-mono font-bold text-xs">{dayAsgs[0].hours} giờ</span>
                        </div>
                      )
                    ) : (
                      /* Chưa xếp ca */
                      <div className="p-2.5 rounded-lg bg-slate-900/50 border border-dashed border-slate-800 text-slate-500 text-xs text-center">
                        <span>Chưa phân ca ngày này (Bấm để xếp ca)</span>
                      </div>
                    )}

                    {/* Trạng Thái Chấm Công Thực Tế GPS (Hôm nay) */}
                    {isToday && (() => {
                      const attStatus = getTodayAttendanceStatus(staff, dayAsgs);
                      if (!attStatus || attStatus.type === 'OFF') return null;
                      return (
                        <div className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold ${attStatus.badgeClass}`}>
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${attStatus.dotClass}`} />
                          <span>{attStatus.label}</span>
                          <span className="text-[10px] font-normal opacity-80 ml-auto hidden sm:inline">{attStatus.tooltip}</span>
                        </div>
                      );
                    })()}

                    {/* Đối Soát Ngày Quá Khứ */}
                    {isPast && dayAsgs.some(a => a.status !== 'OFF') && (() => {
                      const pastRecords = getStaffRecordsForDate(staff, selectedDailyDate);
                      if (pastRecords.length > 0) {
                        const rec = pastRecords[0];
                        const isCompensated = rec.notes?.includes('[CHẤM BÙ') || rec.disputeStatus === 'APPROVED' || !!rec.disputeHandledBy;
                        const firstIn = rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
                        const firstOut = rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '---';

                        if (isCompensated) {
                          return (
                            <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs shadow-sm">
                              <div className="flex items-center justify-between font-bold">
                                <span className="flex items-center gap-1 text-amber-300">
                                  <span>⚡</span>
                                  <span>ĐÃ CHẤM BÙ CÔNG</span>
                                </span>
                                <span className="font-mono text-[11px] text-amber-300">
                                  {rec.workHours ? `${rec.workHours}h` : ''} ({firstIn} - {firstOut})
                                </span>
                              </div>
                              <div className="text-[10.5px] text-slate-300 flex items-center justify-between">
                                <span>🛡️ Người duyệt: <strong className="text-amber-200">{rec.disputeHandledBy || 'Quản lý'}</strong></span>
                                <span className="text-[9.5px] text-amber-400/80 font-mono">Audit Trail ✓</span>
                              </div>
                              {rec.notes && (
                                <div className="text-[10px] text-slate-400 italic truncate font-mono mt-0.5">
                                  📝 {rec.notes}
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                            <span>✓ Đã chấm công GPS lúc:</span>
                            <span className="font-mono">{firstIn}</span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                              <span>Chưa có dữ liệu chấm công GPS</span>
                            </div>
                            {canManageSchedule && (
                              <span className="text-[10px] text-amber-400 underline font-normal">
                                Bấm để Chấm Bù 1 chạm ⚡
                              </span>
                            )}
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* CHẾ ĐỘ XEM MA TRẬN 15 NGÀY (TỐI ƯU CỘT GỌN CHO CẢ DI ĐỘNG & MÁY TÍNH) */
        <div className="glass-card rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400">
                  {/* Fixed Staff Column (w-32 on mobile, w-56 on desktop) */}
                  <th className="py-2.5 px-2 sm:px-4 w-32 sm:w-56 sticky left-0 bg-slate-950 z-20 border-r border-slate-800">
                    NHÂN SỰ ({currentBranch.name})
                  </th>

                  {/* 15 Days Columns */}
                  {cycleDates.map(dateStr => {
                    const { dayOfWeek, dayNum, isToday } = formatDateHeader(dateStr);
                    const hasOpenShiftOnDay = assignments.some(
                      a => a.workingBranchId === selectedBranchId && a.date === dateStr && a.status === 'OPEN_SHIFT'
                    );
                    const hasCrossBranchOnDay = assignments.some(
                      a => a.workingBranchId === selectedBranchId && a.date === dateStr && a.isCrossBranch && a.status !== 'OFF'
                    );

                    return (
                      <th
                        key={dateStr}
                        className={`py-2 px-0.5 sm:px-1 text-center min-w-[56px] sm:min-w-[68px] border-r border-slate-800/60 transition-colors relative ${
                          hasOpenShiftOnDay ? 'bg-rose-950/50 border-rose-500/60' :
                          hasCrossBranchOnDay ? 'bg-amber-950/40 border-amber-500/50' :
                          isToday ? 'bg-cyan-500/20 border-cyan-400/80 text-cyan-300 ring-1 ring-cyan-500/40' : ''
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-mono">
                          <span>{dayOfWeek}</span>
                          {isToday && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" title="Ngày hiện tại (Live Presence)" />
                          )}
                          {hasOpenShiftOnDay && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" title="Có ca trống cần gánh!" />
                          )}
                          {hasCrossBranchOnDay && (
                            <span className="text-[10px]" title="Có nhân sự tăng cường chéo!">✈️</span>
                          )}
                        </div>
                        <div className={`text-sm font-extrabold ${
                          hasOpenShiftOnDay ? 'text-rose-400 animate-pulse font-black' :
                          hasCrossBranchOnDay ? 'text-amber-400 font-black' :
                          isToday ? 'text-cyan-300 font-black' : 'text-slate-200'
                        }`}>
                          {dayNum}
                        </div>
                        {isToday && (
                          <div className="text-[7.5px] font-black uppercase text-cyan-400 tracking-wider font-mono">
                            HÔM NAY
                          </div>
                        )}
                      </th>
                    );
                  })}

                  {/* Total Column */}
                  <th className="py-2.5 px-3 text-center w-28 bg-slate-950 border-b border-slate-800" title="Tổng số giờ công kế hoạch theo lịch đã phân ca trong kỳ">
                    <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">GIỜ KẾ HOẠCH</div>
                    <div className="text-[9px] text-emerald-400/90 font-mono font-medium">(Dự kiến)</div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60 text-xs">
                {activeStaffForMatrix.map((staff) => {
                  const isCross = staff.branchId !== selectedBranchId;
                  const homeBranch = branches.find(b => b.id === (staff.homeBranchId || staff.branchId));
                  
                  // Calculate staff total hours in this cycle
                  let staffCycleHours = 0;

                  return (
                    <tr key={staff.id} className="hover:bg-slate-800/30 transition-colors group">
                      {/* Staff Profile Cell (w-32 on mobile, w-56 on desktop) */}
                      <td className="py-2 px-1.5 sm:px-4 w-32 sm:w-56 sticky left-0 bg-slate-900 group-hover:bg-slate-850 z-10 border-r border-slate-800">
                        <div className="flex items-center gap-1.5 sm:gap-2.5">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 border ${
                            isCross 
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          }`}>
                            {staff.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-200 text-[11px] sm:text-xs leading-tight line-clamp-2 sm:truncate block">
                                {staff.fullName}
                              </span>
                              {isCross && (
                                <span className="text-[8px] sm:text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded border border-amber-500/40 font-bold whitespace-nowrap hidden sm:inline-block">
                                  ✈️ Tăng cường
                                </span>
                              )}
                            </div>
                            <div className="text-[9px] sm:text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <span className="font-mono text-cyan-400/90">{staff.code || 'NV'}</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="text-slate-500 hidden sm:inline">
                                {isCross ? `Gốc: ${homeBranch?.name}` : staff.role}
                              </span>
                            </div>
                          </div>

                        {/* Nút Xóa Lịch Nhân Sự / Hủy Điều Động - Khóa hoàn toàn đối với Founder & Admin */}
                        {(['founder', 'admin'].includes(staff.role?.toLowerCase() || '') || staff.code === 'PK88-FOUNDER' || staff.code === 'PK88-ADMIN') ? (
                          <span className="text-xs select-none opacity-60 flex-shrink-0 px-1" title="Tài khoản Founder / Quản trị cấp cao (Được bảo vệ tối cao)">
                            👑
                          </span>
                        ) : canManageSchedule ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const promptText = isCross
                                ? `Bạn có chắc chắn muốn hủy điều động và xóa toàn bộ lịch của ${staff.fullName} tại ${currentBranch.name} trong kỳ này không?\n\n(LƯU Ý: Thao tác này chỉ xóa các ca làm việc trong kỳ, KHÔNG xóa tài khoản nhân sự!)`
                                : `Bạn có chắc chắn muốn xóa toàn bộ ca làm việc kỳ này của ${staff.fullName} tại ${currentBranch.name} không?\n\n(LƯU Ý: Thao tác này chỉ xóa các ca làm việc trong kỳ, KHÔNG xóa tài khoản nhân sự!)`;
                              if (window.confirm(promptText)) {
                                const next = clearStaffAssignmentsAtBranch(staff, selectedBranchId, cycleDates);
                                setAssignments(next);
                                showToast(`🗑️ Đã làm sạch ca lịch của ${staff.fullName} tại ${currentBranch.name}`);
                              }
                            }}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer flex-shrink-0 ${
                              isCross 
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                                : 'text-slate-500 hover:text-rose-400 hover:bg-slate-800 opacity-0 group-hover:opacity-100'
                            }`}
                            title={isCross ? `Hủy điều động và xóa lịch của ${staff.fullName} khỏi shop` : `Xóa lịch kỳ này của ${staff.fullName} (Không xóa tài khoản)`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </td>

                    {/* 15 Days Assignment Cells */}
                    {cycleDates.map(dateStr => {
                      const { isToday } = formatDateHeader(dateStr);
                      const dayAsgs = assignments.filter(
                        a => isAssignmentForStaff(a, staff) &&
                             a.date === dateStr &&
                             a.workingBranchId === selectedBranchId
                      );

                      dayAsgs.forEach(a => {
                        if (a.status !== 'OFF') {
                          staffCycleHours += (a.hours || 0);
                        }
                      });

                      const isCaGay = dayAsgs.length === 1 && (dayAsgs[0].shiftCode === 'CA_GAY' || dayAsgs[0].shiftName?.toLowerCase().includes('gãy'));
                      const isMultipleShifts = dayAsgs.length >= 2;

                      return (
                        <td
                          key={dateStr}
                          onClick={() => handleCellClick(staff, dateStr)}
                          className="py-1 px-1 text-center border-r border-slate-800/50 cursor-pointer relative group/cell hover:bg-cyan-500/5 transition-all align-middle"
                        >
                          {/* TRƯỜNG HỢP 1: CA GÃY (Hiển thị 2 thẻ nhỏ lồng nhau: Sáng & Tối) */}
                          {isCaGay ? (
                            <div className="flex flex-col gap-1 w-full p-1 rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-500/15 via-slate-900 to-indigo-500/15 hover:border-amber-400 transition-all shadow-md group/gay">
                              {/* Thẻ nhỏ 1: Sáng */}
                              <div className="py-1 px-1.5 rounded-lg bg-amber-500/25 border border-amber-500/50 text-amber-200 text-center leading-none">
                                <div className="font-extrabold text-[9px] flex items-center justify-center gap-1">
                                  <span>☀️</span> Sáng
                                </div>
                                <div className="text-[7.5px] font-mono text-amber-300 mt-0.5 font-bold">07:00-12:00</div>
                              </div>
                              {/* Thẻ nhỏ 2: Tối */}
                              <div className="py-1 px-1.5 rounded-lg bg-indigo-500/30 border border-indigo-500/60 text-indigo-200 text-center leading-none">
                                <div className="font-extrabold text-[9px] flex items-center justify-center gap-1">
                                  <span>🌙</span> Tối
                                </div>
                                <div className="text-[7.5px] font-mono text-indigo-300 mt-0.5 font-bold">17:00-22:00</div>
                              </div>
                              {/* Trạng thái chấm công trực tiếp hôm nay */}
                              {isToday && renderLiveAttendanceBadge(staff, dayAsgs)}
                              {/* Đối soát chấm công ngày quá khứ */}
                              {!isToday && dateStr < todayStr && renderPastAuditBadge(staff, dateStr, dayAsgs)}
                            </div>
                          ) : isMultipleShifts ? (
                            /* TRƯỜNG HỢP 2: 2 CA ĐỘC LẬP TRONG NGÀY (Hiển thị 2 thẻ lồng nhau) */
                            <div className="flex flex-col gap-1 w-full p-1 rounded-xl border border-cyan-500/30 bg-slate-950/60 hover:border-cyan-400 transition-all shadow-md">
                              {dayAsgs.map((asg, idx) => {
                                const badgeStyle = getShiftBadgeStyle(asg);
                                const isMorning = asg.shiftCode === 'CA_SANG' || asg.startTime < '13:00';
                                const icon = asg.shiftCode === 'TANG_CUONG' ? '⚡' : isMorning ? '☀️' : '🌙';
                                return (
                                  <div
                                    key={asg.id || idx}
                                    className={`py-1 px-1 rounded-lg border text-center leading-none shadow-sm ${badgeStyle}`}
                                  >
                                    <div className="font-extrabold text-[8.5px] truncate flex items-center justify-center gap-0.5">
                                      <span>{icon}</span> {getShiftDisplayName(asg)}
                                    </div>
                                    <div className="text-[7.5px] font-mono opacity-80 mt-0.5 font-bold">
                                      {asg.startTime}-{asg.endTime}
                                    </div>
                                  </div>
                                );
                              })}
                              {/* Trạng thái chấm công trực tiếp hôm nay */}
                              {isToday && renderLiveAttendanceBadge(staff, dayAsgs)}
                              {/* Đối soát chấm công ngày quá khứ */}
                              {!isToday && dateStr < todayStr && renderPastAuditBadge(staff, dateStr, dayAsgs)}
                            </div>
                          ) : dayAsgs.length === 1 ? (
                            /* TRƯỜNG HỢP 3: 1 CA ĐƠN BÌNH THƯỜNG */
                            (() => {
                              const asg = dayAsgs[0];
                              const badgeStyle = getShiftBadgeStyle(asg);
                              return (
                                <div className={`p-1.5 rounded-xl border text-[10px] font-medium leading-tight select-none shadow-sm ${badgeStyle}`}>
                                  {asg.status === 'OFF' ? (
                                    <div>
                                      <span className="text-[10px] font-bold text-slate-500">OFF</span>
                                      {isToday && renderLiveAttendanceBadge(staff, dayAsgs)}
                                    </div>
                                  ) : asg.status === 'OPEN_SHIFT' ? (
                                    <div>
                                      <div className="text-[9px] font-black text-rose-300">CẦN GÁNH</div>
                                      <div className="text-[8px] font-bold text-rose-400/90">+50k</div>
                                      {isToday && renderLiveAttendanceBadge(staff, dayAsgs)}
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="font-bold truncate text-[10px]">
                                        {getShiftDisplayName(asg)}
                                      </div>
                                      <div className="text-[8px] opacity-75 font-mono">
                                        {asg.startTime}-{asg.endTime}
                                      </div>
                                      {/* Trạng thái chấm công trực tiếp hôm nay */}
                                      {isToday && renderLiveAttendanceBadge(staff, dayAsgs)}
                                      {/* Đối soát chấm công ngày quá khứ */}
                                      {!isToday && dateStr < todayStr && renderPastAuditBadge(staff, dateStr, dayAsgs)}
                                    </div>
                                  )}
                                </div>
                              );
                            })()
                          ) : (
                            /* TRƯỜNG HỢP 4: Ô TRỐNG */
                            isToday ? (
                              (() => {
                                const attStatus = getTodayAttendanceStatus(staff, []);
                                if (attStatus && attStatus.type !== 'OFF') {
                                  return (
                                    <div className={`p-1.5 rounded-xl border text-[9px] font-bold text-center shadow-md ${attStatus.badgeClass}`} title={attStatus.tooltip}>
                                      <div className="flex items-center justify-center gap-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${attStatus.dotClass}`} />
                                        <span>{attStatus.label}</span>
                                      </div>
                                      <div className="text-[7px] text-amber-300/90 font-mono mt-0.5">
                                        (Ngoài lịch phân ca)
                                      </div>
                                    </div>
                                  );
                                }
                                return (
                                  <div className="w-full h-10 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 text-slate-500 hover:text-cyan-400">
                                    <Plus className="w-3.5 h-3.5" />
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="w-full h-10 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 text-slate-500 hover:text-cyan-400">
                                <Plus className="w-3.5 h-3.5" />
                              </div>
                            )
                          )}
                        </td>
                      );
                    })}

                    {/* Total Hours Cell */}
                    {(() => {
                      const salInfo = getStaffSalaryDisplay(staff, staffCycleHours);
                      return (
                        <td className="py-2.5 px-3 text-center font-mono bg-slate-950/60">
                          <span className={`block text-xs ${salInfo.hoursColor}`}>
                            {salInfo.hoursText}
                          </span>
                          <span className={`text-[9.5px] block mt-0.5 whitespace-nowrap ${salInfo.subColor}`}>
                            {salInfo.subText}
                          </span>
                        </td>
                      );
                    })()}
                  </tr>
                );
              })}
            </tbody>

            {/* Footer Summary: Total Hours per Day for the Store */}
            <tfoot>
              <tr className="bg-slate-950 border-t-2 border-slate-800 font-bold text-xs text-slate-300">
                <td className="py-3 px-4 sticky left-0 bg-slate-950 border-r border-slate-800 text-[11px] uppercase tracking-wider text-cyan-400 font-extrabold">
                  TỔNG GIỜ KẾ HOẠCH SHOP / NGÀY
                </td>
                {cycleDates.map(dateStr => {
                  const dayHours = assignments
                    .filter(a => a.workingBranchId === selectedBranchId && a.date === dateStr && a.status === 'SCHEDULED')
                    .reduce((sum, a) => sum + (a.hours || 0), 0);
                  
                  return (
                    <td key={dateStr} className="py-2 px-1 text-center font-mono text-[11px] border-r border-slate-800 text-slate-200">
                      {dayHours > 0 ? (
                        <span className="text-emerald-400 font-bold">{dayHours.toFixed(0)}h</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  );
                })}
                <td className="py-2.5 px-3 text-center font-mono bg-slate-950" title="Tổng giờ công kế hoạch toàn shop trong kỳ">
                  <div className="text-emerald-400 font-black text-sm">{totalHours.toFixed(0)}h</div>
                  <div className="text-[9px] text-slate-500 font-sans font-normal">Kế hoạch</div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      )}

      {/* Legend & Instructions */}
      <div className="flex flex-col gap-3 text-xs text-slate-400 bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-300">Chú thích ca:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40"></span>
            <span>Ca Sáng (07:00 - 15:30)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-500/20 border border-indigo-500/40"></span>
            <span>Ca Chiều (13:30 - 22:00)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-purple-500/20 border border-purple-500/40"></span>
            <span>Ca Trưa (12:00 - 22:00)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40"></span>
            <span>Ca Thử Việc (07:00 - 15:00)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/50"></span>
            <span>Ca Gãy (07:00-12:00 & 17:00-22:00)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500 text-rose-300 font-black animate-pulse"></span>
            <span className="text-rose-300 font-bold">Ca Trống (Cần Gánh)</span>
          </div>
        </div>

        {/* Live Attendance Legend */}
        <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-slate-800/80">
          <span className="font-bold text-cyan-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>Ký hiệu Chấm Công Hôm Nay:</span>
          </span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[10px]">
            <span>🟢 07:18 Đang làm</span>
            <span className="text-slate-400 font-normal">(Đã check-in GPS)</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[10px]">
            <span>☕ Nghỉ trưa / 🍱 Ăn tối</span>
            <span className="text-slate-400 font-normal">(Nghỉ luân phiên)</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-[10px]">
            <span>⚠️ Chưa check-in</span>
            <span className="text-slate-400 font-normal">(Đã quá giờ vào ca)</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-400/40 text-blue-300 font-bold text-[10px]">
            <span>🏁 Ra ca 15:35</span>
            <span className="text-slate-400 font-normal">(Đã check-out)</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 font-medium text-[10px]">
            <span>⏳ Chờ vào ca</span>
            <span className="text-slate-500 font-normal">(Chưa tới giờ)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-500 text-[11px] pt-1 border-t border-slate-800/40">
          <div>💡 Click vào ô bất kỳ để xem chi tiết chấm công GPS, đổi ca, thêm ca 2 hoặc chấm ngày OFF</div>
          <div className="text-cyan-400/90 font-medium">📋 Dữ liệu chấm công GPS đồng bộ tức thời theo thời gian thực</div>
        </div>
      </div>

      {/* MODAL 1: CELL QUICK EDIT & SICK LEAVE */}
      {selectedCellAssignment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>XỬ LÝ CA LÀM VIỆC</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedCellAssignment.staffName} • Ngày {selectedCellAssignment.date}
                </p>
              </div>
              <button 
                onClick={closeCellModal}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* THÔNG TIN CHẤM CÔNG GPS THỰC TẾ & LỊCH SỬ AUDIT TRAIL */}
            {selectedCellStaff && (() => {
              const staffRecords = getStaffRecordsForDate(selectedCellStaff, selectedCellAssignment.date);
              const isTodayCell = selectedCellAssignment.date === todayStr;
              const isPastCell = selectedCellAssignment.date < todayStr;
              
              if (staffRecords.length > 0) {
                const latest = staffRecords[0];
                const isCompensated = latest.notes?.includes('[CHẤM BÙ') || latest.disputeStatus === 'APPROVED' || !!latest.disputeHandledBy;
                const inTime = latest.checkIn ? new Date(latest.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '---';
                const outTime = latest.checkOut ? new Date(latest.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : (isTodayCell ? 'Đang trong ca' : 'Chưa check-out');
                
                if (isCompensated) {
                  return (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 space-y-2 shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-amber-400" />
                          <span>LỊCH SỬ CHẤM BÙ CÔNG (AUDIT TRAIL)</span>
                        </span>
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                          ĐÃ DUYỆT
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-200">
                        🛡️ Người phê duyệt: <strong className="text-amber-300">{latest.disputeHandledBy || 'Quản lý cấp cao'}</strong>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <div className="text-[10px] text-slate-400">Giờ vào (Check-in):</div>
                          <div className="text-amber-300 font-extrabold font-mono mt-0.5">{inTime}</div>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          <div className="text-[10px] text-slate-400">Giờ ra (Check-out):</div>
                          <div className="text-amber-300 font-extrabold font-mono mt-0.5">{outTime}</div>
                        </div>
                      </div>
                      {latest.notes && (
                        <div className="text-[10px] text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 font-mono leading-relaxed">
                          📝 {latest.notes}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/40 space-y-2 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>DỮ LIỆU CHẤM CÔNG GPS THỰC TẾ</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{selectedCellAssignment.date}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Giờ vào (Check-in):</div>
                        <div className="text-emerald-300 font-extrabold font-mono mt-0.5">{inTime}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Giờ ra (Check-out):</div>
                        <div className="text-cyan-300 font-extrabold font-mono mt-0.5">{outTime}</div>
                      </div>
                    </div>
                    {latest.notes && (
                      <div className="text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800/60 font-mono truncate">
                        📝 {latest.notes}
                      </div>
                    )}
                  </div>
                );
              } else if (isPastCell && selectedCellAssignment.status !== 'OFF') {
                return (
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>Không tìm thấy dữ liệu chấm công GPS ngày {selectedCellAssignment.date}. Nhân viên có thể đã quên chấm công.</span>
                  </div>
                );
              } else if (isTodayCell && selectedCellAssignment.status !== 'OFF') {
                return (
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>Chưa ghi nhận lượt chấm công GPS vào ca hôm nay!</span>
                  </div>
                );
              }
              return null;
            })()}

            {/* CHẤM BÙ CÔNG NHANH 1 CHẠM (DÀNH CHO FOUNDER, ADMIN, HR, CỬA HÀNG TRƯỞNG) */}
            {canManageSchedule && selectedCellAssignment.date <= todayStr && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-950 to-amber-950/20 border border-amber-500/40 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs shadow-md">
                      ⚡
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-300 tracking-wide flex items-center gap-1.5">
                        <span>CHẤM BÙ CÔNG NHANH 1 CHẠM</span>
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Xác nhận giờ công thực tế & lưu vết lịch sử hệ thống
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-200 border border-amber-500/30">
                    AUDIT TRAIL
                  </span>
                </div>

                {/* Form giờ vào / giờ ra */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">
                      Giờ vào ca (Check-in):
                    </label>
                    <input
                      type="time"
                      value={compensateCheckIn}
                      onChange={(e) => setCompensateCheckIn(e.target.value)}
                      className="w-full bg-slate-900 border border-amber-500/30 rounded-xl px-2.5 py-1.5 text-xs text-amber-200 font-mono font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">
                      Giờ ra ca (Check-out):
                    </label>
                    <input
                      type="time"
                      value={compensateCheckOut}
                      onChange={(e) => setCompensateCheckOut(e.target.value)}
                      className="w-full bg-slate-900 border border-amber-500/30 rounded-xl px-2.5 py-1.5 text-xs text-amber-200 font-mono font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Quick reason chips */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-300 block">
                    Lý do chấm bù (Lưu vết minh bạch):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Quên bấm máy chấm công',
                      'Lỗi mạng / Hết pin điện thoại',
                      'Cửa hàng trưởng xác nhận có mặt',
                      'Tăng cường đột xuất'
                    ].map(reason => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setCompensateReason(reason)}
                        className={`text-[9.5px] px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                          compensateReason === reason
                            ? 'bg-amber-500/30 border-amber-400 text-amber-200 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={compensateReason}
                    onChange={(e) => setCompensateReason(e.target.value)}
                    placeholder="Ghi chú chi tiết lý do..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 mt-1"
                  />
                </div>

                {/* Audit summary */}
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>🛡️ Người duyệt: <strong className="text-slate-200">{currentUser?.fullName || 'Quản lý'}</strong></span>
                  <span className="text-amber-400 font-mono font-bold">Lưu Supabase Cloud</span>
                </div>

                {/* Confirm Button */}
                <button
                  type="button"
                  onClick={handleConfirmAttendanceCompensation}
                  disabled={isSubmittingCompensation}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingCompensation ? (
                    <span>⏳ Đang ghi nhận Audit Trail...</span>
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>Xác Nhận Chấm Bù 1 Chạm & Ghi Nhận Audit Trail</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* NẾU LÀ NGÀY NGHỈ LUÂN PHIÊN (OFF) */}
            {selectedCellAssignment.status === 'OFF' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl">
                    🌴
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-100">HÔM NAY LÀ NGÀY NGHỈ LUÂN PHIÊN (OFF)</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    {canManageSchedule 
                      ? 'Nhân sự này đang được xếp nghỉ ngơi theo lịch luân phiên. Bạn có thể chọn ca bên dưới nếu cần huy động nhân sự đi làm lại.'
                      : 'Bạn không có ca làm việc trong ngày này theo lịch đã duyệt. Hãy tận hưởng ngày nghỉ ngơi phục hồi sức khỏe nhé!'}
                  </p>
                </div>

                {/* Nếu là Quản lý / HR: Có quyền chọn ca để xếp đi làm lại */}
                {canManageSchedule && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">Xếp lịch đi làm lại cho nhân sự:</label>
                      {canManageSchedule && (
                        <button
                          type="button"
                          onClick={handleResetDefaultShiftDefinitions}
                          className="text-[10px] text-slate-500 hover:text-cyan-400 cursor-pointer transition-colors"
                          title="Khôi phục lại các khung ca mặc định của công ty"
                        >
                          🔄 Khôi phục mặc định
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {shiftDefs.map(def => (
                        <div
                          key={def.id}
                          className="relative group/shift p-2 rounded-xl border border-slate-800 bg-slate-950 hover:border-cyan-500/50 transition-all flex items-center justify-between gap-1 shadow-sm"
                        >
                          <button
                            type="button"
                            onClick={() => handleQuickShiftChange(def)}
                            className="flex-1 text-left cursor-pointer min-w-0"
                          >
                            <div className="font-bold text-xs text-slate-200 truncate">{def.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {def.startTime} - {def.endTime} ({def.hours}h)
                            </div>
                          </button>
                          {canManageSchedule && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteShiftDefinition(def);
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-all opacity-40 group-hover/shift:opacity-100 flex-shrink-0 cursor-pointer"
                              title={`Xóa khung giờ "${def.name}"`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          if (window.confirm(`Xóa ô ca ngày ${selectedCellAssignment.date} của ${selectedCellAssignment.staffName}?`)) {
                            const next = deleteAssignment(selectedCellAssignment.id);
                            setAssignments(next);
                            closeCellModal();
                            showToast(`🗑️ Đã xóa ô ca ngày ${selectedCellAssignment.date}`);
                          }
                        }}
                        className="py-2 bg-slate-800/80 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa ô này</span>
                      </button>
                      <button
                        onClick={() => {
                          const targetStaff = staffList.find(s => s.id === selectedCellAssignment.staffId) || {
                            id: selectedCellAssignment.staffId,
                            phone: selectedCellAssignment.staffPhone,
                            fullName: selectedCellAssignment.staffName
                          };
                          if (window.confirm(`Xóa toàn bộ lịch phân ca kỳ này của ${selectedCellAssignment.staffName} tại ${currentBranch.name}?`)) {
                            const next = clearStaffAssignmentsAtBranch(targetStaff, selectedBranchId, cycleDates);
                            setAssignments(next);
                            closeCellModal();
                            showToast(`🗑️ Đã xóa toàn bộ ca kỳ này của ${selectedCellAssignment.staffName}`);
                          }
                        }}
                        className="py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span>Xóa cả kỳ bạn này</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Nếu là Nhân viên: Tùy chọn đăng ký tăng ca ngày nghỉ */}
                {!canManageSchedule && (
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => {
                        const def = shiftDefs.find(d => d.code === 'CA_SANG') || shiftDefs[0];
                        if (def) {
                          const updated: ShiftAssignment = {
                            ...selectedCellAssignment,
                            shiftDefinitionId: def.id,
                            shiftCode: def.code,
                            shiftName: `${def.name} (Tăng Ca Ngày OFF)`,
                            startTime: def.startTime,
                            endTime: def.endTime,
                            hours: def.hours,
                            status: 'SCHEDULED',
                            notes: '🙋 Nhân viên tự nguyện đăng ký tăng ca ngày nghỉ'
                          };
                          const nextList = saveAssignment(updated);
                          setAssignments(nextList);
                          closeCellModal();
                          showToast('✅ Bạn đã đăng ký đi làm tăng ca ngày OFF thành công!');
                        }
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>🙋 Đăng Ký Đi Làm Ngày OFF (Tăng Ca)</span>
                    </button>
                    <button
                      onClick={closeCellModal}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* NẾU LÀ NGÀY CÓ LỊCH LÀM VIỆC (SCHEDULED / OPEN_SHIFT) */
              <>
                {/* HIỂN THỊ DANH SÁCH CÁC CA TRONG NGÀY (NẾU CÓ 2 CA HOẶC CA GÃY) */}
                {dayAssignmentsForModal.length >= 2 ? (
                  <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-extrabold text-cyan-300">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span>Ngày có 2 ca làm việc (Tổng {dayAssignmentsForModal.reduce((s, a) => s + (a.hours || 0), 0).toFixed(1)}h)</span>
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {dayAssignmentsForModal.map((asg, idx) => (
                        <div key={asg.id || idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 shadow-sm">
                          <div>
                            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                              <span>{asg.shiftName}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {asg.startTime} - {asg.endTime} ({asg.hours}h)
                            </div>
                          </div>
                          {canManageSchedule && (
                            <button
                              onClick={() => handleDeleteAssignmentFromDay(asg.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-all"
                              title="Xóa ca này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : dayAssignmentsForModal.length === 1 && (dayAssignmentsForModal[0].shiftCode === 'CA_GAY' || dayAssignmentsForModal[0].shiftName?.toLowerCase().includes('gãy')) ? (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                    <div className="font-extrabold flex items-center gap-1.5 text-amber-300">
                      <span>☀️🌙 Ca Gãy Đang Xếp (Tổng 10.0h)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-center">
                        <div className="font-bold text-amber-200">☀️ Phiên Sáng</div>
                        <div className="text-amber-300">07:00 - 12:00 (5h)</div>
                      </div>
                      <div className="p-2 rounded-xl bg-indigo-500/25 border border-indigo-500/40 text-center">
                        <div className="font-bold text-indigo-200">🌙 Phiên Tối</div>
                        <div className="text-indigo-300">17:00 - 22:00 (5h)</div>
                      </div>
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      💡 Hiển thị 2 thẻ nhỏ lồng nhau trên ma trận và tự động ghi nhận 10 giờ công.
                    </div>
                  </div>
                ) : null}

                {/* Quick Shift Selection - Chỉ hiện nếu có quyền quản lý */}
                {canManageSchedule ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300">
                          {dayAssignmentsForModal.length >= 2 ? 'Đổi ca chính:' : 'Chọn loại ca:'}
                        </label>
                        {canManageSchedule && (
                          <button
                            type="button"
                            onClick={handleResetDefaultShiftDefinitions}
                            className="text-[10px] text-slate-500 hover:text-cyan-400 cursor-pointer transition-colors"
                            title="Khôi phục lại các khung ca mặc định của công ty"
                          >
                            🔄 Khôi phục mặc định
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {shiftDefs.map(def => (
                          <div
                            key={def.id}
                            className="relative group/shift p-2 rounded-xl border border-slate-800 bg-slate-950 hover:border-cyan-500/50 transition-all flex items-center justify-between gap-1 shadow-sm"
                          >
                            <button
                              type="button"
                              onClick={() => handleQuickShiftChange(def)}
                              className="flex-1 text-left cursor-pointer min-w-0"
                            >
                              <div className="font-bold text-xs text-slate-200 truncate">{def.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {def.startTime} - {def.endTime} ({def.hours}h)
                              </div>
                            </button>
                            {canManageSchedule && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteShiftDefinition(def);
                                }}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-all opacity-40 group-hover/shift:opacity-100 flex-shrink-0 cursor-pointer"
                                title={`Xóa khung giờ "${def.name}"`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* NÚT THÊM CA THỨ 2 TRONG NGÀY (NẾU MỚI CÓ 1 CA) */}
                    {dayAssignmentsForModal.length === 1 && !isAddingSecondShift && (
                      <button
                        onClick={() => setIsAddingSecondShift(true)}
                        className="w-full py-2.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Plus className="w-4 h-4 text-amber-400" />
                        <span>+ Thêm Ca Thứ 2 Trong Ngày (Ca Tối / Tăng Cường)</span>
                      </button>
                    )}

                    {/* BẢNG CHỌN CA THỨ 2 KHI BẤM NÚT */}
                    {isAddingSecondShift && (
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 space-y-2.5 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-amber-400" />
                            <span>Chọn ca thứ 2 muốn thêm:</span>
                          </span>
                          <button
                            onClick={() => setIsAddingSecondShift(false)}
                            className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 cursor-pointer"
                          >
                            Đóng
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {shiftDefs.map(def => (
                            <div
                              key={`sec_${def.id}`}
                              className="relative group/shift p-2 rounded-xl border border-amber-500/30 bg-slate-950 hover:border-amber-400 transition-all flex items-center justify-between gap-1 shadow-sm"
                            >
                              <button
                                type="button"
                                onClick={() => handleAddSecondShift(def)}
                                className="flex-1 text-left cursor-pointer min-w-0"
                              >
                                <div className="font-bold text-xs text-slate-200 truncate">{def.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {def.startTime} - {def.endTime} ({def.hours}h)
                                </div>
                              </button>
                              {canManageSchedule && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteShiftDefinition(def);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-all opacity-40 group-hover/shift:opacity-100 flex-shrink-0 cursor-pointer"
                                  title={`Xóa khung giờ "${def.name}"`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mark OFF & Xóa ca */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <button
                        onClick={handleMarkAsOff}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Chấm Ngày Nghỉ Luân Phiên (OFF)
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            if (window.confirm(`Xóa ô ca ngày ${selectedCellAssignment.date} của ${selectedCellAssignment.staffName}?`)) {
                              const next = deleteAssignment(selectedCellAssignment.id);
                              setAssignments(next);
                              closeCellModal();
                              showToast(`🗑️ Đã xóa ô ca ngày ${selectedCellAssignment.date}`);
                            }
                          }}
                          className="py-2 bg-slate-800/80 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa ca này</span>
                        </button>
                        <button
                          onClick={() => {
                            const targetStaff = staffList.find(s => s.id === selectedCellAssignment.staffId) || {
                              id: selectedCellAssignment.staffId,
                              phone: selectedCellAssignment.staffPhone,
                              fullName: selectedCellAssignment.staffName
                            };
                            if (window.confirm(`Xóa toàn bộ lịch phân ca kỳ này của ${selectedCellAssignment.staffName} tại ${currentBranch.name}?`)) {
                              const next = clearStaffAssignmentsAtBranch(targetStaff, selectedBranchId, cycleDates);
                              setAssignments(next);
                              closeCellModal();
                              showToast(`🗑️ Đã xóa toàn bộ ca kỳ này của ${selectedCellAssignment.staffName}`);
                            }
                          }}
                          className="py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Xóa cả kỳ bạn này</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs space-y-1">
                    <div className="font-extrabold flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-cyan-400" />
                      <span>Ca làm việc của bạn: {selectedCellAssignment.shiftName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Khung giờ: {selectedCellAssignment.startTime} - {selectedCellAssignment.endTime} ({selectedCellAssignment.hours} tiếng).
                      Nếu bạn bị ốm hoặc gặp việc đột xuất, vui lòng xác nhận bên dưới để hệ thống tìm đồng nghiệp làm thay.
                    </div>
                  </div>
                )}

                {/* Action Buttons: Sick Leave (Chỉ khi ca đang có lịch làm) */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-2xl space-y-2">
                    <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-rose-400" />
                      <span>Báo Nghỉ Ốm Đột Xuất (Biến thành Ca Trống)</span>
                    </div>
                    <input
                      type="text"
                      value={sickLeaveReason}
                      onChange={(e) => setSickLeaveReason(e.target.value)}
                      placeholder="Lý do nghỉ (sốt, gia đình có việc...)"
                      className="w-full bg-slate-950 border border-rose-500/30 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none"
                    />
                    <button
                      onClick={handleConfirmSickLeave}
                      className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-xl text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer"
                    >
                      Xác Nhận Nghỉ Ốm & Phát Sóng Tìm Người Gánh (+50k)
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: AUTO-FILL BI-WEEKLY (ĐỔ CA TỰ ĐỘNG 15 NGÀY) */}
      {showAutoFillModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAutoFillSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>ĐỔ CA TỰ ĐỘNG CẢ KỲ (15 NGÀY)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Áp dụng lịch mẫu cho nhân sự trong nháy mắt, chỉ mất 30 giây
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowAutoFillModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Chọn nhân sự:</label>
                <select
                  value={autoFillStaffId}
                  onChange={(e) => setAutoFillStaffId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                >
                  <optgroup label={`Nhân sự cơ hữu (${currentBranch.name})`}>
                    {activeStaffForMatrix.filter(s => s.branchId === selectedBranchId).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.code || 'NV'})
                      </option>
                    ))}
                  </optgroup>
                  {activeStaffForMatrix.some(s => s.branchId !== selectedBranchId) && (
                    <optgroup label="Nhân sự tăng cường từ chi nhánh khác">
                      {activeStaffForMatrix.filter(s => s.branchId !== selectedBranchId).map(s => (
                        <option key={s.id} value={s.id}>
                          ✈️ {s.fullName} ({s.code || 'NV'})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Ca làm việc mặc định:</label>
                <select
                  value={autoFillShiftDefId}
                  onChange={(e) => setAutoFillShiftDefId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                >
                  {shiftDefs.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.startTime} - {d.endTime} / {d.hours}h)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Chọn ngày nghỉ luân phiên hàng tuần (OFF):</label>
                <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                  {[
                    { label: 'T2', val: 1 },
                    { label: 'T3', val: 2 },
                    { label: 'T4', val: 3 },
                    { label: 'T5', val: 4 },
                    { label: 'T6', val: 5 },
                    { label: 'T7', val: 6 },
                    { label: 'CN', val: 0 },
                  ].map(day => {
                    const isSelected = autoFillOffDays.includes(day.val);
                    return (
                      <button
                        type="button"
                        key={day.val}
                        onClick={() => {
                          if (isSelected) {
                            setAutoFillOffDays(autoFillOffDays.filter(d => d !== day.val));
                          } else {
                            setAutoFillOffDays([...autoFillOffDays, day.val]);
                          }
                        }}
                        className={`py-2 rounded-xl border font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAutoFillModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                ⚡ Áp Dụng Cho Cả Kỳ 15 Ngày
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: CROSS-BRANCH DISPATCH (ĐIỀU ĐỘNG CHÉO CHI NHÁNH) */}
      {showDispatchModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleDispatchSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                  <Plane className="w-4 h-4 text-amber-400" />
                  <span>ĐIỀU ĐỘNG TĂNG CƯỜNG CHÉO CHI NHÁNH</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ví dụ: Điều động anh Phan Văn Thống từ Mỹ Tho sang Thủ Đức
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nhân sự điều động (từ chi nhánh khác):</label>
                <select
                  value={dispatchStaffId}
                  onChange={(e) => setDispatchStaffId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
                  required
                >
                  <option value="">-- Chọn nhân viên cần cử đi --</option>
                  {staffList.filter(s => 
                    s.role !== 'founder' && 
                    s.code !== 'PK88-FOUNDER' && 
                    !s.fullName?.toLowerCase().includes('founder')
                  ).map(s => {
                    const b = branches.find(item => item.id === s.branchId);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.fullName} - {s.role} (Gốc: {b?.name || 'Chưa rõ'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Chi nhánh đến làm việc:</label>
                {isHQAdmin ? (
                  <select
                    value={dispatchToBranchId}
                    onChange={(e) => setDispatchToBranchId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
                  >
                    {branches.filter(b => b.isActive).map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold flex items-center justify-between">
                    <span>{currentBranch.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">🔒 Chi nhánh của bạn</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Từ ngày:</label>
                  <input
                    type="date"
                    value={dispatchStartDate}
                    onChange={(e) => setDispatchStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Đến ngày:</label>
                  <input
                    type="date"
                    value={dispatchEndDate}
                    onChange={(e) => setDispatchEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Ca làm việc tăng cường:</label>
                <select
                  value={dispatchShiftDefId}
                  onChange={(e) => setDispatchShiftDefId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
                >
                  {shiftDefs.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.startTime} - {d.endTime} / {d.hours}h)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Ghi chú điều động:</label>
                <input
                  type="text"
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-md shadow-amber-500/20 cursor-pointer"
              >
                ✈️ Xác Nhận Điều Động
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: CHỢ CA KHẨN CẤP (OPEN SHIFTS MARKETPLACE) */}
      {showMarketplaceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500 animate-bounce" />
                  <span>CHỢ CA KHẨN CẤP • GÁNH CA NHẬN THƯỞNG NÓNG</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Các ca bị hổng người do ốm đau/đột xuất. Nhận ca làm thay để tăng thu nhập!
                </p>
              </div>
              <button 
                onClick={() => setShowMarketplaceModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {openShifts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <div className="text-xs font-bold text-slate-200">Hiện tại không có ca nào bị trống!</div>
                <div className="text-[11px] text-slate-500">Toàn bộ chi nhánh đều đủ người làm việc theo đúng lịch.</div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {openShifts.map(asg => {
                  const b = branches.find(item => item.id === asg.workingBranchId);
                  return (
                    <div 
                      key={asg.id} 
                      className="glass-card p-4 rounded-2xl border border-rose-500/40 bg-gradient-to-r from-slate-900 to-rose-950/20 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          {b?.name} • Ngày {asg.date}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-black text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-xl border border-amber-500/40">
                          <Award className="w-3.5 h-3.5" />
                          <span>+{(asg.bountyBonus || 50000).toLocaleString('vi-VN')} đ Thưởng</span>
                        </div>
                      </div>

                      <div className="text-xs font-extrabold text-slate-100">
                        {asg.shiftName} ({asg.startTime} - {asg.endTime} • {asg.hours} tiếng)
                      </div>

                      <p className="text-[11px] text-rose-300/90 italic">
                        {asg.notes || 'Cần người hỗ trợ khẩn cấp'}
                      </p>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                        <span className="text-[10px] text-slate-400">
                          Người xin nghỉ: <strong className="text-slate-300">{asg.staffName}</strong>
                        </span>
                        <button
                          onClick={() => handleClaimOpenShift(asg)}
                          className="px-4 py-1.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-extrabold rounded-xl text-xs shadow-md shadow-rose-500/20 cursor-pointer"
                        >
                          🎯 Bắt Ca Này
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 5: CUSTOM SHIFT DEFINITION SETTINGS */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateCustomShift} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>TÙY BIẾN CA CHI NHÁNH {currentBranch.name.toUpperCase()}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Thêm khung giờ ca mới linh hoạt, không bị cứng nhắc
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Tên ca làm việc:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ca trưa cao điểm, Ca tối tăng cường..."
                  value={newShiftName}
                  onChange={(e) => setNewShiftName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Giờ bắt đầu:</label>
                  <input
                    type="time"
                    value={newShiftStart}
                    onChange={(e) => setNewShiftStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Giờ kết thúc:</label>
                  <input
                    type="time"
                    value={newShiftEnd}
                    onChange={(e) => setNewShiftEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span>Số giờ công tự động tính:</span>
                <span className="font-mono font-extrabold text-cyan-400">
                  {calculateShiftHours(newShiftStart, newShiftEnd)} giờ
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Ghi chú:</label>
                <input
                  type="text"
                  placeholder="Áp dụng khi shop đông khách..."
                  value={newShiftNotes}
                  onChange={(e) => setNewShiftNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                + Lưu Khung Ca Mới
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
