import { Staff, AttendanceRecord, LeaveRequest } from '../types';

export interface StaffStatusBadge {
  code: 'WORKING' | 'ON_BREAK' | 'ON_LEAVE' | 'OFF_DUTY_HOURS' | 'SHIFT_ENDED' | 'NOT_CHECKED_IN' | 'INACTIVE';
  label: string;
  colorClass: string;
  dotColor: string;
  description: string;
}

/**
 * Tính toán trạng thái làm việc thực tế theo thời gian thực (Real-time Shift & Leave Status)
 * @param staff Thông tin nhân sự
 * @param attendanceLogs Nhật ký chấm công GPS
 * @param leaveRequests Danh sách đơn xin nghỉ phép
 */
export function getStaffRealtimeStatus(
  staff: Staff,
  attendanceLogs: AttendanceRecord[] = [],
  leaveRequests: LeaveRequest[] = []
): StaffStatusBadge {
  // 1. Nếu nhân sự đã thôi việc / tài khoản tạm khóa
  if (!staff.isActive) {
    return {
      code: 'INACTIVE',
      label: 'Đã thôi việc',
      colorClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dotColor: 'bg-rose-500',
      description: 'Nhân sự đã ngưng công tác tại chuỗi Phụ Kiện 88'
    };
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeVal = currentHour + currentMinutes / 60;

  // Lấy ngày hôm nay định dạng YYYY-MM-DD theo giờ địa phương
  const localYear = now.getFullYear();
  const localMonth = String(now.getMonth() + 1).padStart(2, '0');
  const localDay = String(now.getDate()).padStart(2, '0');
  const todayStr = `${localYear}-${localMonth}-${localDay}`;

  // 2. Kiểm tra xem hôm nay nhân sự có ĐƠN NGHỈ PHÉP ĐÃ DUYỆT hay không
  const activeLeave = leaveRequests.find(req => {
    if (req.status !== 'APPROVED') return false;
    const isMatch = req.staffId === staff.id || (staff.phone && req.phone === staff.phone);
    if (!isMatch) return false;
    return todayStr >= req.startDate && todayStr <= req.endDate;
  });

  if (activeLeave) {
    const isPaid = activeLeave.type === 'PAID_LEAVE';
    return {
      code: 'ON_LEAVE',
      label: isPaid ? '🏖️ Nghỉ phép' : '🏖️ Nghỉ không lương',
      colorClass: 'bg-pink-500/15 text-pink-300 border-pink-500/40 ring-1 ring-pink-500/30',
      dotColor: 'bg-pink-400',
      description: `Đang trong kỳ nghỉ phép đã duyệt (${activeLeave.startDate} → ${activeLeave.endDate})`
    };
  }

  // 3. Kiểm tra khung giờ hoạt động của cửa hàng (Quy định chuỗi PK88: 07:30 - 22:00)
  // Ngoài khung giờ này (sau 22h00 tối đến trước 07h30 sáng hôm sau): Toàn chuỗi đóng cửa
  const isOutsideBusinessHours = currentTimeVal >= 22.0 || currentTimeVal < 7.5;

  // 4. Kiểm tra dữ liệu chấm công GPS của nhân sự trong ngày hôm nay
  const todayLogs = attendanceLogs.filter(log => {
    const isMatch = log.staffId === staff.id || (log.notes && log.notes.includes(staff.phone));
    if (!isMatch) return false;
    if (!log.checkIn) return false;
    const logDateStr = log.checkIn.slice(0, 10);
    return logDateStr === todayStr;
  });

  // Tìm ca làm gần nhất trong ngày
  const latestLog = todayLogs.length > 0
    ? [...todayLogs].sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())[0]
    : null;

  // Nếu đã check-in và CHƯA check-out -> Đang trực ca tại shop hoặc tạm nghỉ trưa / ăn tối luân phiên
  if (latestLog && !latestLog.checkOut) {
    const isBreak = latestLog.isOnBreak || 
      (latestLog.notes && 
        (latestLog.notes.includes('[ĐANG NGHỈ TRƯA]') || latestLog.notes.includes('[ĐANG NGHỈ ĂN TỐI]') || latestLog.notes.includes('[ĐANG NGHỈ GIỮA CA]')) && 
        !latestLog.notes.includes('[KẾT THÚC NGHỈ TRƯA]') && !latestLog.notes.includes('[KẾT THÚC NGHỈ ĂN TỐI]') && !latestLog.notes.includes('[KẾT THÚC NGHỈ GIỮA CA]'));

    if (isBreak) {
      const isEveningBreak = latestLog.shiftType === 'CA_CHIEU' || 
        (latestLog.notes && latestLog.notes.includes('ĂN TỐI')) || 
        currentTimeVal >= 16.0;

      return {
        code: 'ON_BREAK',
        label: isEveningBreak ? '🍱 Đang ăn tối' : '☕ Đang nghỉ trưa',
        colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20 ring-1 ring-amber-500/30',
        dotColor: 'bg-amber-400',
        description: `Đang tạm nghỉ ${isEveningBreak ? 'ăn tối' : 'ăn trưa'} luân phiên tại shop (Bắt đầu lúc: ${latestLog.breakStart ? new Date(latestLog.breakStart).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'gần đây'})`
      };
    }

    return {
      code: 'WORKING',
      label: '🟢 Đang trong ca',
      colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20 animate-pulse',
      dotColor: 'bg-emerald-400',
      description: `Đang làm việc tại cửa hàng (Vào ca lúc: ${new Date(latestLog.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})`
    };
  }

  // Nếu hôm nay đã hoàn thành ca làm và ĐÃ check-out
  if (latestLog && latestLog.checkOut) {
    return {
      code: 'SHIFT_ENDED',
      label: '🏠 Đã tan ca',
      colorClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      dotColor: 'bg-blue-400',
      description: `Đã kết thúc ca làm hôm nay (Ra ca lúc: ${new Date(latestLog.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})`
    };
  }

  // Nếu ngoài khung giờ làm việc của chuỗi (22h00 - 07h30)
  if (isOutsideBusinessHours) {
    return {
      code: 'OFF_DUTY_HOURS',
      label: '🌙 Ngoài giờ làm',
      colorClass: 'bg-slate-800/80 text-slate-400 border-slate-700/60',
      dotColor: 'bg-slate-500',
      description: 'Ngoài khung giờ hoạt động của chuỗi (Cửa hàng đóng cửa từ 22h00 đến 07h30)'
    };
  }

  // Trong khung giờ hoạt động bình thường nhưng chưa bấm chấm công vào ca
  return {
    code: 'NOT_CHECKED_IN',
    label: '⏳ Chưa vào ca',
    colorClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotColor: 'bg-amber-400',
    description: 'Chưa ghi nhận lượt chấm công GPS vào ca hôm nay'
  };
}
