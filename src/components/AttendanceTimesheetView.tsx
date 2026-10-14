import React, { useState, useMemo } from 'react';
import { Branch, Staff, AttendanceRecord, ShiftType } from '../types';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  FileSpreadsheet, 
  Sparkles,
  RefreshCw,
  Building2,
  Sun,
  Moon,
  Zap,
  LogOut,
  X,
  Check,
  Sliders
} from 'lucide-react';

interface AttendanceTimesheetViewProps {
  branches: Branch[];
  staffList: Staff[];
  attendanceLogs: AttendanceRecord[];
  onRefreshLogs?: () => void;
}

const getLocalYMD = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AttendanceTimesheetView: React.FC<AttendanceTimesheetViewProps> = ({
  branches,
  staffList,
  attendanceLogs,
  onRefreshLogs
}) => {
  // Default filter is strictly TODAY for real-time tracking
  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | '7days' | 'month' | 'all' | 'custom'>('today');
  const [startDate, setStartDate] = useState<string>(getLocalYMD());
  const [endDate, setEndDate] = useState<string>(getLocalYMD());
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedShift, setSelectedShift] = useState<string>('ALL');
  const [warningOnly, setWarningOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual Checkout modal states for Admin / HR to close open or forgotten shifts
  const [checkoutTarget, setCheckoutTarget] = useState<AttendanceRecord | null>(null);
  const [manualTime, setManualTime] = useState<string>('17:30');
  const [manualNotes, setManualNotes] = useState<string>('');
  const [isUpdatingDb, setIsUpdatingDb] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSelectPreset = (preset: 'today' | 'yesterday' | '7days' | 'month' | 'all') => {
    setDatePreset(preset);
    const today = getLocalYMD();
    if (preset === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yesterday = getLocalYMD(y);
      setStartDate(yesterday);
      setEndDate(yesterday);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setStartDate(getLocalYMD(past));
      setEndDate(today);
    } else if (preset === 'month') {
      const m = new Date();
      const monthStart = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-01`;
      setStartDate(monthStart);
      setEndDate(today);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleOpenCheckoutModal = (record: AttendanceRecord) => {
    setCheckoutTarget(record);
    let defTime = '17:30';
    if (record.shiftType === 'CA_SANG') defTime = '15:30';
    else if (record.shiftType === 'CA_CHIEU') defTime = '22:00';
    else if (record.shiftType === 'HANH_CHINH') defTime = '17:30';
    else if (record.shiftType === 'TUY_CHINH') {
      const match = record.notes?.match(/Ca Tùy Chỉnh \([^ -]+ - ([^)]+)\)/);
      if (match && match[1]) defTime = match[1].trim();
    }
    setManualTime(defTime);
    setManualNotes(`Quản trị viên chốt ca lúc ${defTime}`);
  };

  const handleConfirmCheckout = async () => {
    if (!checkoutTarget) return;
    setIsUpdatingDb(true);

    try {
      const checkInDate = new Date(checkoutTarget.checkIn);
      const [h, m] = manualTime.split(':').map(Number);
      
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setHours(h, m, 0, 0);

      // If checkOut is earlier than checkIn, adjust date
      if (checkOutDate.getTime() < checkInDate.getTime()) {
        checkOutDate.setDate(checkOutDate.getDate() + 1);
      }

      const diffMs = checkOutDate.getTime() - checkInDate.getTime();
      const workHours = Math.max(0.1, +(diffMs / (1000 * 60 * 60)).toFixed(1));

      const updatedNotes = checkoutTarget.notes 
        ? `${checkoutTarget.notes} | ${manualNotes}`
        : manualNotes;

      const { error } = await supabase
        .from('attendance')
        .update({
          check_out: checkOutDate.toISOString(),
          work_hours: workHours,
          notes: updatedNotes
        })
        .eq('id', checkoutTarget.id);

      if (error) {
        showToast(`❌ Lỗi cập nhật Supabase: ${error.message}`);
      } else {
        showToast(`✅ Đã chốt ca ra (${manualTime}) thành công!`);
        setCheckoutTarget(null);
        onRefreshLogs?.();
      }
    } catch (err: any) {
      showToast(`❌ Lỗi: ${err.message}`);
    } finally {
      setIsUpdatingDb(false);
    }
  };

  // Branch map for quick lookup
  const branchMap = useMemo(() => {
    const map = new Map<string, Branch>();
    branches.forEach(b => map.set(b.id, b));
    return map;
  }, [branches]);

  // Staff map for quick lookup
  const staffMap = useMemo(() => {
    const map = new Map<string, Staff>();
    staffList.forEach(s => {
      map.set(s.id, s);
      if (s.phone) map.set(s.phone, s);
    });
    return map;
  }, [staffList]);

  // Helper to extract staff info from record
  const getStaffInfo = (record: AttendanceRecord): { name: string; phone: string; code: string; role: string } => {
    let staff = staffMap.get(record.staffId);
    if (!staff && record.notes) {
      // Try finding by phone in notes: e.g. "Nguyen Van A (0901234567)"
      const match = record.notes.match(/\((0\d{9,10})\)/);
      if (match && match[1]) {
        staff = staffMap.get(match[1]);
      }
    }

    if (staff) {
      return {
        name: staff.fullName,
        phone: staff.phone,
        code: staff.code || `PK88-${staff.id.slice(-4).toUpperCase()}`,
        role: staff.role
      };
    }

    // Fallback parsing from notes
    const noteNameMatch = record.notes?.split('(')[0]?.trim();
    return {
      name: noteNameMatch || 'Nhân sự PK88',
      phone: record.notes?.match(/\((0\d{9,10})\)/)?.[1] || '---',
      code: `PK88-NV`,
      role: 'sales'
    };
  };

  // Helper to get branch name
  const getBranchName = (record: AttendanceRecord): string => {
    const b = branchMap.get(record.branchId);
    if (b) return b.name.replace('Phụ Kiện 88 - ', '');
    // Try parsing from notes: "... Hợp lệ (Phú Khương)"
    const match = record.notes?.match(/\(([^)]+)\)$/);
    if (match && match[1]) return match[1].replace('Phụ Kiện 88 - ', '');
    return 'Chi Nhánh PK88';
  };

  // Helper to get Shift label & badge
  const getShiftBadge = (shift?: ShiftType, notes?: string) => {
    switch (shift) {
      case 'CA_SANG':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sun className="w-3 h-3" /> Ca Sáng (07:00 - 15:30)
          </span>
        );
      case 'CA_CHIEU':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Moon className="w-3 h-3" /> Ca Chiều (13:30 - 22:00)
          </span>
        );
      case 'HANH_CHINH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Building2 className="w-3 h-3" /> Ca Văn Phòng (07:30 - 17:30)
          </span>
        );
      case 'TANG_CUONG':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Zap className="w-3 h-3" /> Ca Tăng Cường (Linh hoạt)
          </span>
        );
      case 'TUY_CHINH': {
        const timeMatch = notes?.match(/Ca Tùy Chỉnh \(([^)]+)\)/);
        const timeLabel = timeMatch ? `Ca Tùy Chỉnh (${timeMatch[1]})` : 'Ca Tùy Chỉnh';
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sliders className="w-3 h-3" /> {timeLabel}
          </span>
        );
      }
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            {shift || 'Ca Tiêu Chuẩn'}
          </span>
        );
    }
  };

  // Helper to determine status flags and overtime
  const getStatusFlags = (record: AttendanceRecord) => {
    const isOutside = record.isOutsideGeofence || (record.distanceMeters !== undefined && record.distanceMeters > 200);
    const isLate = record.isLate || record.notes?.toLowerCase().includes('đi trễ') || false;

    // Check elapsed hours and check-out status
    const checkInDate = new Date(record.checkIn);
    const todayStr = getLocalYMD();
    const recordDateStr = getLocalYMD(checkInDate);
    const isToday = recordDateStr === todayStr;
    const elapsedHours = (Date.now() - checkInDate.getTime()) / (1000 * 60 * 60);

    // If no checkOut:
    // If it's today AND elapsedHours < 16h: legitimate "Đang trực"
    // If it's NOT today OR elapsedHours >= 16h: "Quên check-out"
    const isCurrentlyWorking = !record.checkOut && isToday && elapsedHours < 16;
    const isMissedCheckout = !record.checkOut && (!isToday || elapsedHours >= 16);

    // Overtime (OT) detection
    let otHours = 0;
    if (record.workHours) {
      if (record.shiftType === 'CA_SANG' && record.workHours > 8.5) {
        otHours = +(record.workHours - 8.5).toFixed(1);
      } else if (record.shiftType === 'CA_CHIEU' && record.workHours > 8.5) {
        otHours = +(record.workHours - 8.5).toFixed(1);
      } else if (record.shiftType === 'HANH_CHINH' && record.workHours > 10.0) {
        otHours = +(record.workHours - 10.0).toFixed(1);
      } else if (record.shiftType === 'TANG_CUONG') {
        otHours = +record.workHours.toFixed(1);
      }
    }

    return { isOutside, isLate, otHours, isCurrentlyWorking, isMissedCheckout };
  };

  // Filtered attendance records
  const filteredRecords = useMemo(() => {
    return attendanceLogs.filter(record => {
      // 1. Branch filter
      if (selectedBranch !== 'ALL' && record.branchId !== selectedBranch) {
        return false;
      }

      // 2. Shift filter
      if (selectedShift !== 'ALL' && record.shiftType !== selectedShift) {
        return false;
      }

      // 3. Date range filter (Strict local date comparison)
      const checkInDateStr = getLocalYMD(new Date(record.checkIn));
      if (startDate && checkInDateStr < startDate) return false;
      if (endDate && checkInDateStr > endDate) return false;

      // 4. Warning only filter
      const { isOutside, isLate, isMissedCheckout } = getStatusFlags(record);
      if (warningOnly && !isOutside && !isLate && !isMissedCheckout) {
        return false;
      }

      // 5. Search filter (Name, Phone, Code)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const staff = getStaffInfo(record);
        const matchName = staff.name.toLowerCase().includes(term);
        const matchPhone = staff.phone.includes(term);
        const matchCode = staff.code.toLowerCase().includes(term);
        const matchNote = record.notes?.toLowerCase().includes(term) || false;
        if (!matchName && !matchPhone && !matchCode && !matchNote) return false;
      }

      return true;
    });
  }, [attendanceLogs, selectedBranch, selectedShift, startDate, endDate, warningOnly, searchTerm, staffMap, branchMap]);

  // KPI Calculations
  const todayRecords = useMemo(() => {
    const todayStr = getLocalYMD();
    return attendanceLogs.filter(r => {
      const d = getLocalYMD(new Date(r.checkIn));
      return d === todayStr;
    });
  }, [attendanceLogs]);

  const uniqueStaffToday = useMemo(() => {
    const ids = new Set<string>();
    todayRecords.forEach(r => ids.add(r.staffId));
    return ids.size;
  }, [todayRecords]);

  const totalActiveStaff = staffList.filter(s => s.isActive).length || 1;
  const attendanceRateToday = Math.min(100, Math.round((uniqueStaffToday / totalActiveStaff) * 100));

  const lateCountToday = useMemo(() => {
    return todayRecords.filter(r => getStatusFlags(r).isLate).length;
  }, [todayRecords]);

  const outsideGpsCountToday = useMemo(() => {
    return todayRecords.filter(r => getStatusFlags(r).isOutside).length;
  }, [todayRecords]);

  const totalFilteredHours = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + (r.workHours || 0), 0);
  }, [filteredRecords]);

  // Export to Excel function using SheetJS (xlsx)
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      showToast('⚠️ Không có dữ liệu để xuất Excel.');
      return;
    }

    try {
      const exportData = filteredRecords.map((r, index) => {
        const staff = getStaffInfo(r);
        const branchName = getBranchName(r);
        const checkInDate = new Date(r.checkIn);
        const dateStr = checkInDate.toLocaleDateString('vi-VN');
        const inTimeStr = checkInDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const outTimeStr = r.checkOut ? new Date(r.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Đang trong ca';
        const { isOutside, isLate, otHours } = getStatusFlags(r);

        let statusText = 'Đúng giờ / Hợp lệ';
        if (isOutside && isLate) statusText = 'CẢNH BÁO: Đi trễ & Ngoài GPS';
        else if (isOutside) statusText = 'CẢNH BÁO: Ngoài phạm vi GPS (>200m)';
        else if (isLate) statusText = 'Đi trễ';
        if (otHours > 0) statusText += ` | ⭐ Tăng ca: +${otHours}h`;

        let shiftName = 'Ca Tiêu Chuẩn';
        if (r.shiftType === 'CA_SANG') shiftName = 'Ca Sáng (07:00 - 15:30)';
        else if (r.shiftType === 'CA_CHIEU') shiftName = 'Ca Chiều (13:30 - 22:00)';
        else if (r.shiftType === 'HANH_CHINH') shiftName = 'Ca Văn Phòng (07:30 - 17:30)';
        else if (r.shiftType === 'TANG_CUONG') shiftName = 'Ca Tăng Cường (Linh hoạt)';
        else if (r.shiftType === 'TUY_CHINH') {
          const match = r.notes?.match(/Ca Tùy Chỉnh \(([^)]+)\)/);
          shiftName = match ? `Ca Tùy Chỉnh (${match[1]})` : 'Ca Tùy Chỉnh';
        }

        return {
          'STT': index + 1,
          'Mã Nhân Viên': staff.code,
          'Họ Và Tên': staff.name,
          'Số Điện Thoại': staff.phone,
          'Chi Nhánh': branchName,
          'Ngày Chấm Công': dateStr,
          'Ca Làm Việc': shiftName,
          'Giờ Vào (Check-in)': inTimeStr,
          'Giờ Ra (Check-out)': outTimeStr,
          'Tổng Giờ Làm (Giờ)': r.workHours || 0,
          'Giờ Tăng Ca (OT)': otHours > 0 ? `+${otHours}h` : '0h',
          'Khoảng Cách GPS (Mét)': r.distanceMeters !== undefined ? `${Math.round(r.distanceMeters)}m` : '---',
          'Trạng Thái': statusText,
          'Ghi Chú': r.notes || ''
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Auto-fit column widths
      const colWidths = [
        { wch: 6 },  // STT
        { wch: 14 }, // Mã NV
        { wch: 24 }, // Họ và tên
        { wch: 14 }, // SĐT
        { wch: 18 }, // Chi nhánh
        { wch: 14 }, // Ngày
        { wch: 26 }, // Ca làm việc
        { wch: 18 }, // Giờ vào
        { wch: 18 }, // Giờ ra
        { wch: 16 }, // Tổng giờ làm
        { wch: 18 }, // Khoảng cách GPS
        { wch: 30 }, // Trạng thái
        { wch: 40 }, // Ghi chú
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Bang_Cham_Cong');

      const fileDate = getLocalYMD().replace(/-/g, '_');
      const fileName = `bang_cham_cong_pk88_${fileDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      showToast(`✅ Đã xuất thành công tệp Excel: ${fileName}!`);
    } catch (err: any) {
      console.error('Lỗi xuất Excel:', err);
      showToast(`❌ Lỗi xuất file Excel: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl animate-in slide-in-from-bottom-5">
          <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Banner & Action */}
      <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 bg-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                <span>Nhật Ký & Quản Trị Chấm Công Chi Tiết (GPS Timesheet)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Chuẩn AFOODS Hub
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Theo dõi chi tiết từng lượt vào/ra, đối soát bán kính GPS Geofence (200m), phát hiện đi trễ và xuất báo cáo Excel (.xlsx).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onRefreshLogs && (
            <button
              onClick={onRefreshLogs}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Làm mới dữ liệu từ Supabase"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Đồng Bộ Data</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Dashboard Summary Cards (Hôm Nay) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1 */}
        <div className="glass-card rounded-2xl p-4 border border-cyan-500/30 bg-slate-900/80 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1">
            <span>Hiện Diện Hôm Nay</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300 font-mono">
            {uniqueStaffToday} <span className="text-xs text-slate-400 font-normal">/ {totalActiveStaff} NV</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${attendanceRateToday}%` }}
              ></div>
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-400">{attendanceRateToday}%</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-card rounded-2xl p-4 border border-amber-500/30 bg-slate-900/80 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1">
            <span>Lượt Đi Trễ Hôm Nay</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {lateCountToday} <span className="text-xs text-slate-400 font-normal">lượt</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            {lateCountToday === 0 ? '🎉 Toàn bộ nhân sự đúng giờ' : '⚠️ Cần nhắc nhở kỷ luật ca trực'}
          </p>
        </div>

        {/* KPI 3 */}
        <div className="glass-card rounded-2xl p-4 border border-rose-500/30 bg-slate-900/80 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1">
            <span>Cảnh Báo Ngoài GPS</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {outsideGpsCountToday} <span className="text-xs text-slate-400 font-normal">lượt (&gt;200m)</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            {outsideGpsCountToday === 0 ? '🛡️ 100% Check-in tại shop' : '🔴 Cần đối soát GPS bất thường'}
          </p>
        </div>

        {/* KPI 4 */}
        <div className="glass-card rounded-2xl p-4 border border-emerald-500/30 bg-slate-900/80 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-1">
            <span>Tổng Giờ Công Đang Lọc</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono">
            {totalFilteredHours.toFixed(1)} <span className="text-xs text-slate-400 font-normal">giờ</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Tổng {filteredRecords.length} lượt chấm công trong kỳ
          </p>
        </div>
      </div>

      {/* 3. Multi-Criteria Filter Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-900/90 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-2 border-b border-slate-800/80 flex-wrap gap-2">
          <span className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-emerald-400" />
            <span>Bộ Lọc Dữ Liệu Chấm Công Đa Tiêu Chí</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Tìm thấy: <strong className="text-emerald-400">{filteredRecords.length}</strong> bản ghi
          </span>
        </div>

        {/* Quick Date Presets Selector */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Khoảng Thời Gian:</span>
          <button
            type="button"
            onClick={() => handleSelectPreset('today')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              datePreset === 'today'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black ring-1 ring-emerald-400'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            ⚡ Hôm Nay (Real-time)
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('yesterday')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              datePreset === 'yesterday'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black ring-1 ring-emerald-400'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            Hôm Qua
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('7days')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              datePreset === '7days'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black ring-1 ring-emerald-400'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            7 Ngày Qua
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('month')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              datePreset === 'month'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black ring-1 ring-emerald-400'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            Tháng Này
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              datePreset === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black ring-1 ring-emerald-400'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            Tất Cả Lịch Sử
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Filter 1: Chi nhánh */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Chi Nhánh</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">🏢 Toàn Chuỗi ({branches.length} Chi Nhánh)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name.replace('Phụ Kiện 88 - ', '')}</option>
              ))}
            </select>
          </div>

          {/* Filter 2: Ca làm việc */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Loại Ca</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">🕒 Tất Cả Ca</option>
              <option value="CA_SANG">☀️ Ca Sáng (07:00 - 15:30)</option>
              <option value="CA_CHIEU">🌙 Ca Chiều (13:30 - 22:00)</option>
              <option value="HANH_CHINH">🏢 Ca Văn Phòng (07:30 - 17:30)</option>
              <option value="TANG_CUONG">⚡ Ca Tăng Cường (Linh hoạt)</option>
              <option value="TUY_CHINH">⚙️ Ca Tùy Chỉnh</option>
            </select>
          </div>

          {/* Filter 3: Từ ngày */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Từ Ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('custom');
              }}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          {/* Filter 4: Đến ngày */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Đến Ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('custom');
              }}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          {/* Filter 5: Tìm kiếm */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tìm Nhân Viên</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Tên, SĐT, Mã NV..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Warning Only Toggle & Reset */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800/60 flex-wrap gap-2">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={warningOnly}
              onChange={(e) => setWarningOnly(e.target.checked)}
              className="w-4 h-4 rounded accent-rose-500 bg-slate-950 border-slate-700"
            />
            <span className={`text-xs font-bold flex items-center gap-1 ${warningOnly ? 'text-rose-400' : 'text-slate-400'}`}>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Chỉ lọc bản ghi Có Cảnh Báo (Đi trễ hoặc Ngoài vùng GPS &gt; 200m)</span>
            </span>
          </label>

          {(selectedBranch !== 'ALL' || selectedShift !== 'ALL' || startDate || endDate || warningOnly || searchTerm) && (
            <button
              onClick={() => {
                setSelectedBranch('ALL');
                setSelectedShift('ALL');
                setStartDate('');
                setEndDate('');
                setWarningOnly(false);
                setSearchTerm('');
              }}
              className="text-[11px] font-medium text-slate-400 hover:text-emerald-400 underline cursor-pointer"
            >
              Đặt lại toàn bộ bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* 4. Detailed Timesheet Grid Table */}
      <div className="glass-card rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="p-3.5 text-center w-12">STT</th>
                <th className="p-3.5">Mã NV</th>
                <th className="p-3.5">Nhân Viên</th>
                <th className="p-3.5">Chi Nhánh</th>
                <th className="p-3.5 text-center">Ngày</th>
                <th className="p-3.5">Ca Làm Việc</th>
                <th className="p-3.5 text-center">Giờ Vào</th>
                <th className="p-3.5 text-center">Giờ Ra</th>
                <th className="p-3.5 text-center">Tổng Giờ</th>
                <th className="p-3.5 text-center">Khoảng Cách GPS</th>
                <th className="p-3.5 text-center">Trạng Thái Đối Soát</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRecords.map((record, idx) => {
                const staff = getStaffInfo(record);
                const branchName = getBranchName(record);
                const checkInDate = new Date(record.checkIn);
                const dateFormatted = checkInDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                const timeIn = checkInDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                const timeOut = record.checkOut ? new Date(record.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : null;
                const { isOutside, isLate, otHours, isCurrentlyWorking, isMissedCheckout } = getStatusFlags(record);

                return (
                  <tr key={record.id || idx} className="hover:bg-slate-800/40 transition-colors">
                    {/* STT */}
                    <td className="p-3.5 text-center text-slate-500 font-mono text-[11px]">
                      {idx + 1}
                    </td>

                    {/* Mã NV */}
                    <td className="p-3.5">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                        {staff.code}
                      </span>
                    </td>

                    {/* Họ và tên */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-200">{staff.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{staff.phone}</div>
                    </td>

                    {/* Chi nhánh */}
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-300">
                        <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>{branchName}</span>
                      </span>
                    </td>

                    {/* Ngày */}
                    <td className="p-3.5 text-center font-mono text-slate-300 text-[11px]">
                      {dateFormatted}
                    </td>

                    {/* Ca Làm Việc */}
                    <td className="p-3.5">
                      {getShiftBadge(record.shiftType, record.notes)}
                    </td>

                    {/* Giờ Vào */}
                    <td className="p-3.5 text-center font-mono font-bold text-emerald-400">
                      {timeIn}
                    </td>

                    {/* Giờ Ra */}
                    <td className="p-3.5 text-center font-mono">
                      {timeOut ? (
                        <span className="text-slate-300 font-bold">{timeOut}</span>
                      ) : isCurrentlyWorking ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                            Đang trực
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenCheckoutModal(record)}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold hover:underline cursor-pointer"
                          >
                            Chốt ca
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            Quên check-out
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenCheckoutModal(record)}
                            className="text-[10px] text-amber-400 hover:text-amber-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Clock className="w-3 h-3" /> Chốt giờ ra
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Tổng Giờ */}
                    <td className="p-3.5 text-center font-mono font-extrabold text-cyan-300">
                      <div>{record.workHours ? `${record.workHours}h` : '---'}</div>
                      {otHours > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mt-1 rounded text-[9px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          ⭐ OT: +{otHours}h
                        </span>
                      )}
                    </td>

                    {/* Khoảng Cách GPS */}
                    <td className="p-3.5 text-center font-mono">
                      {record.distanceMeters !== undefined ? (
                        <span className={`font-bold ${record.distanceMeters <= 200 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {Math.round(record.distanceMeters)}m
                        </span>
                      ) : (
                        <span className="text-slate-500">---</span>
                      )}
                    </td>

                    {/* Trạng Thái Badge */}
                    <td className="p-3.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {isMissedCheckout && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Quên Check-out</span>
                          </span>
                        )}

                        {isOutside ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Ngoài GPS (&gt;200m)</span>
                          </span>
                        ) : null}

                        {isLate ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            <span>Đi trễ</span>
                          </span>
                        ) : null}

                        {!isOutside && !isLate && !isMissedCheckout ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đúng giờ / Hợp lệ</span>
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500 space-y-2">
                    <Filter className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-sm font-bold text-slate-400">Không tìm thấy bản ghi chấm công nào phù hợp với bộ lọc.</p>
                    <p className="text-xs text-slate-600">Hãy thử đổi khoảng ngày hoặc xóa tìm kiếm để xem thêm kết quả.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal Chốt Ca Ra Thủ Công cho Admin / HR */}
      {checkoutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-emerald-500/30 bg-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-slate-100">Chốt Giờ Ra & Hoàn Tất Ca</h3>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutTarget(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Nhân viên:</span>
                <span className="font-bold text-slate-200">{getStaffInfo(checkoutTarget).name} ({getStaffInfo(checkoutTarget).code})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Chi nhánh:</span>
                <span className="font-semibold text-cyan-400">{getBranchName(checkoutTarget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Giờ vào:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {new Date(checkoutTarget.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ({new Date(checkoutTarget.checkIn).toLocaleDateString('vi-VN')})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Loại ca:</span>
                <span>{getShiftBadge(checkoutTarget.shiftType, checkoutTarget.notes)}</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                Giờ Check-out Thực Tế (HH:mm)
              </label>
              <input
                type="time"
                value={manualTime}
                onChange={(e) => setManualTime(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Gợi ý: Ca Sáng (15:30), Ca Chiều (22:00), Văn Phòng (17:30).
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                Ghi Chú Chốt Ca
              </label>
              <input
                type="text"
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="Ví dụ: Nhân viên quên checkout, HR chốt theo giờ quy định"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCheckoutTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckout}
                disabled={isUpdatingDb}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isUpdatingDb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{isUpdatingDb ? 'Đang lưu...' : 'Xác Nhận & Lưu Supabase'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
