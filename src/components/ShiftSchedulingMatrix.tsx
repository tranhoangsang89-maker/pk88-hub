import React, { useState, useMemo, useEffect } from 'react';
import { Staff, Branch, ShiftDefinition, ShiftAssignment, ShiftAssignmentStatus } from '../types';
import { 
  getShiftDefinitions, 
  getAllAssignments, 
  saveAssignment, 
  autoFillBiWeeklyCycle, 
  reportSickLeaveAndOpenShift, 
  claimOpenShift, 
  dispatchCrossBranchStaff, 
  saveShiftDefinition, 
  calculateShiftHours, 
  getBiWeeklyDates,
  clearBranchAssignments,
  clearAllAssignments,
  deleteAssignment,
  clearStaffAssignmentsAtBranch
} from '../lib/shiftService';
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
  Sparkles, 
  X, 
  DollarSign, 
  HeartPulse, 
  Flame, 
  Award,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ShiftSchedulingMatrixProps {
  branches: Branch[];
  staffList: Staff[];
  currentUser?: Staff;
  onRefreshStaff?: () => void;
  defaultBranchId?: string;
}

export const ShiftSchedulingMatrix: React.FC<ShiftSchedulingMatrixProps> = ({
  branches,
  staffList,
  currentUser,
  onRefreshStaff,
  defaultBranchId
}) => {
  // RBAC Permissions
  // 1. Quản trị cấp cao (Toàn quyền xếp lịch tất cả chi nhánh)
  const isHQAdmin = currentUser?.role === 'founder' || currentUser?.role === 'admin' || currentUser?.role === 'hr' || currentUser?.role === 'sales_head';

  // State for Cycle & Branch (Mặc định chọn chi nhánh của người đang đăng nhập hoặc defaultBranchId)
  const initialBranchId = defaultBranchId || (currentUser && currentUser.branchId) ? (defaultBranchId || currentUser?.branchId) : (branches[0]?.id || 'c65f5a81-a5c3-45a2-b01c-4c842e41f61e');
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
  const defaultInitialCycle: 'cycle1' | 'cycle2' = currentRealDay <= 15 ? 'cycle1' : 'cycle2';

  const [cycle, setCycle] = useState<'cycle1' | 'cycle2'>(defaultInitialCycle);
  const [selectedYear, setSelectedYear] = useState<number>(currentRealYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentRealMonth);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  useEffect(() => {
    setAssignments(getAllAssignments(staffList, branches));
  }, [staffList, branches]);

  // Modals state
  const [showAutoFillModal, setShowAutoFillModal] = useState<boolean>(false);
  const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showMarketplaceModal, setShowMarketplaceModal] = useState<boolean>(false);
  const [selectedCellAssignment, setSelectedCellAssignment] = useState<ShiftAssignment | null>(null);
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'CROSS_BRANCH' | 'OPEN_SHIFT'>('ALL');

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
    }
  }, [cycleDates]);

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
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    return { dayOfWeek, dayNum, isToday };
  };

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

    const existing = assignments.find(
      a => isAssignmentForStaff(a, staff) &&
           a.date === dateStr &&
           a.workingBranchId === selectedBranchId
    );
    if (existing) {
      setSelectedCellAssignment(existing);
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
    } else {
      showToast('🔒 Bạn không có quyền tự tạo thêm ca làm việc.');
    }
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
    setSelectedCellAssignment(null);
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
    setSelectedCellAssignment(null);
  };

  // Report Sick Leave
  const handleConfirmSickLeave = () => {
    if (!selectedCellAssignment) return;
    const nextList = reportSickLeaveAndOpenShift(selectedCellAssignment.id, sickLeaveReason, sickLeaveBounty);
    setAssignments(nextList);
    setSelectedCellAssignment(null);
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
    // Ca Trưa / Gãy
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
          const asg = assignments.find(
            a => isAssignmentForStaff(a, staff) &&
                 a.date === dateStr &&
                 a.workingBranchId === selectedBranchId
          );

          if (!asg || asg.status === 'OFF') {
            row.push('OFF');
          } else if (asg.status === 'OPEN_SHIFT') {
            row.push('CẦN GÁNH');
          } else {
            row.push(getExcelShiftLabel(asg));
            staffTotalHours += (asg.hours || 0);
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
            {/* Branch Selector */}
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

        <div className="glass-card p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng Giờ Công Kỳ</div>
            <div className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">
              {totalHours.toFixed(1)} <span className="text-xs text-slate-400 font-normal">giờ</span>
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

      {/* Main Bi-weekly Matrix Table */}
      <div className="glass-card rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400">
                {/* Fixed Staff Column */}
                <th className="py-3 px-4 w-56 sticky left-0 bg-slate-950 z-20 border-r border-slate-800">
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
                      className={`py-2 px-1 text-center min-w-[64px] border-r border-slate-800/60 transition-colors relative ${
                        hasOpenShiftOnDay ? 'bg-rose-950/50 border-rose-500/60' :
                        hasCrossBranchOnDay ? 'bg-amber-950/40 border-amber-500/50' :
                        isToday ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' : ''
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-mono">
                        <span>{dayOfWeek}</span>
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
                        isToday ? 'text-cyan-400' : 'text-slate-200'
                      }`}>
                        {dayNum}
                      </div>
                    </th>
                  );
                })}

                {/* Total Column */}
                <th className="py-3 px-3 text-center w-24 bg-slate-950">
                  TỔNG GIỜ
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
                    {/* Staff Profile Cell */}
                    <td className="py-2.5 px-4 sticky left-0 bg-slate-900 group-hover:bg-slate-850 z-10 border-r border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 border ${
                          isCross 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        }`}>
                          {staff.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-200 truncate block text-xs">
                              {staff.fullName}
                            </span>
                            {isCross && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded border border-amber-500/40 font-bold whitespace-nowrap">
                                ✈️ Tăng cường
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span className="font-mono">{staff.code || 'NV'}</span>
                            <span>•</span>
                            <span className="text-slate-500">
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
                      const asg = assignments.find(
                        a => isAssignmentForStaff(a, staff) &&
                             a.date === dateStr &&
                             a.workingBranchId === selectedBranchId
                      );

                      if (asg && asg.status !== 'OFF') {
                        staffCycleHours += (asg.hours || 0);
                      }

                      const badgeStyle = asg ? getShiftBadgeStyle(asg) : 'bg-transparent text-slate-600 hover:bg-slate-800/40';

                      return (
                        <td
                          key={dateStr}
                          onClick={() => handleCellClick(staff, dateStr)}
                          className="py-1.5 px-1 text-center border-r border-slate-800/50 cursor-pointer relative group/cell hover:bg-cyan-500/5 transition-all"
                        >
                          {asg ? (
                            <div className={`p-1 rounded-lg border text-[10px] font-medium leading-tight select-none ${badgeStyle}`}>
                              {asg.status === 'OFF' ? (
                                <span className="text-[10px] font-bold text-slate-500">OFF</span>
                              ) : asg.status === 'OPEN_SHIFT' ? (
                                <div>
                                  <div className="text-[9px] font-black text-rose-300">CẦN GÁNH</div>
                                  <div className="text-[8px] font-bold text-rose-400/90">+50k</div>
                                </div>
                              ) : (
                                <div>
                                  <div className="font-bold truncate text-[10px]">
                                    {getShiftDisplayName(asg)}
                                  </div>
                                  <div className="text-[8px] opacity-75 font-mono">
                                    {asg.startTime}-{asg.endTime}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-full h-8 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 text-slate-500 hover:text-cyan-400">
                              <Plus className="w-3.5 h-3.5" />
                            </div>
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
                  TỔNG GIỜ CÔNG SHOP / NGÀY
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
                <td className="py-3 px-3 text-center font-mono text-cyan-400 font-black text-sm">
                  {totalHours.toFixed(0)}h
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Legend & Instructions */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800">
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
            <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500 text-rose-300 font-black animate-pulse"></span>
            <span className="text-rose-300 font-bold">Ca Trống (Nghỉ Ốm - Cần Gánh)</span>
          </div>
        </div>
        <div className="text-slate-500 text-[11px]">
          💡 Click vào ô bất kỳ để đổi ca, chấm ngày OFF hoặc báo nghỉ ốm đột xuất
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
                onClick={() => setSelectedCellAssignment(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
                    <label className="text-xs font-bold text-slate-300">Xếp lịch đi làm lại cho nhân sự:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {shiftDefs.map(def => (
                        <button
                          key={def.id}
                          onClick={() => handleQuickShiftChange(def)}
                          className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:border-cyan-500/50 text-left transition-all cursor-pointer"
                        >
                          <div className="font-bold text-xs text-slate-200">{def.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {def.startTime} - {def.endTime} ({def.hours}h)
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          if (window.confirm(`Xóa ô ca ngày ${selectedCellAssignment.date} của ${selectedCellAssignment.staffName}?`)) {
                            const next = deleteAssignment(selectedCellAssignment.id);
                            setAssignments(next);
                            setSelectedCellAssignment(null);
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
                            setSelectedCellAssignment(null);
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
                          setSelectedCellAssignment(null);
                          showToast('✅ Bạn đã đăng ký đi làm tăng ca ngày OFF thành công!');
                        }
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>🙋 Đăng Ký Đi Làm Ngày OFF (Tăng Ca)</span>
                    </button>
                    <button
                      onClick={() => setSelectedCellAssignment(null)}
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
                {/* Quick Shift Selection - Chỉ hiện nếu có quyền quản lý */}
                {canManageSchedule ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300">Chọn ca thay thế:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {shiftDefs.map(def => (
                          <button
                            key={def.id}
                            onClick={() => handleQuickShiftChange(def)}
                            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:border-cyan-500/50 text-left transition-all cursor-pointer"
                          >
                            <div className="font-bold text-xs text-slate-200">{def.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {def.startTime} - {def.endTime} ({def.hours}h)
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

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
                              setSelectedCellAssignment(null);
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
                              setSelectedCellAssignment(null);
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
