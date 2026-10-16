import React, { useState } from 'react';
import { Branch, AttendanceRecord, MarketingPost, LeaveRequest, RepairTicket, Staff } from '../types';
import { supabase } from '../lib/supabase';
import { sortBranchesByPriority, getBranchOrderIndex } from '../lib/mockData';
import { 
  TrendingUp, 
  AlertTriangle, 
  Package, 
  CheckCircle, 
  Smartphone, 
  ArrowUpRight, 
  DollarSign, 
  Clock, 
  UserCheck, 
  Activity, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Bot, 
  ShieldCheck, 
  AlertCircle, 
  Wrench,
  Users,
  Phone,
  MessageSquare,
  MapPin,
  X,
  ExternalLink,
  Zap,
  Check,
  Store,
  Building2,
  ShieldAlert
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ReferenceLine
} from 'recharts';

export interface RedFlagAlert {
  id: string;
  type: string;
  category: 'CHECKOUT' | 'OPEN_SHIFT' | 'LEAVE' | 'GPS' | 'REPAIR';
  branch: string;
  branchId?: string;
  message: string;
  severity: 'HIGH' | 'MEDIUM';
  time: string;
  payload?: any;
}

interface ExecutiveDashboardProps {
  branches: Branch[];
  staffList?: Staff[];
  attendanceLogs?: AttendanceRecord[];
  marketingPosts?: MarketingPost[];
  leaveRequests?: LeaveRequest[];
  tickets?: RepairTicket[];
  onOpenAIHRModal?: () => void;
  onNavigateTab?: (tab: any) => void;
  onRefreshAttendance?: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ 
  branches, 
  staffList = [],
  attendanceLogs = [], 
  marketingPosts = [],
  leaveRequests = [],
  tickets = [],
  onOpenAIHRModal,
  onNavigateTab,
  onRefreshAttendance
}) => {
  const activeBranches = sortBranchesByPriority(branches.filter(b => b.isActive));
  const inactiveBranches = branches.filter(b => !b.isActive);
  const closedBranchNames = inactiveBranches.map(b => b.name.replace('Phụ Kiện 88 - ', '')).join(', ');

  // Thời gian thực tế hôm nay
  const today = new Date().toISOString().split('T')[0];
  const formattedToday = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // 1. Phân tích chấm công GPS thực tế hôm nay
  const todayLogs = attendanceLogs.filter(log => log.checkIn && log.checkIn.startsWith(today));
  const activeOnShift = todayLogs.filter(log => !log.checkOut);
  const latesCount = todayLogs.filter(log => log.isLate).length;
  const outsideGeofenceCount = todayLogs.filter(log => log.isOutsideGeofence).length;

  // 2. Phân tích doanh thu & đơn dịch vụ thực tế từ Supabase
  const completedTickets = tickets.filter(t => t.status === 'READY' || t.status === 'DELIVERED');
  const inProgressTickets = tickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'RECEIVED');
  const realRevenue = completedTickets.reduce((sum, t) => sum + (t.price || 0), 0);
  const totalOrders = tickets.length;

  // 3. Phân tích Marketing thực tế
  const todayPosts = marketingPosts.filter(p => p.created_at && p.created_at.startsWith(today));
  const branchCounts = todayPosts.reduce((acc, p) => {
    acc[p.branch_id] = (acc[p.branch_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topBranchId = Object.entries(branchCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topBranchName = branches.find(b => b.id === topBranchId)?.name.replace('Phụ Kiện 88 - ', '') || 'N/A';
  const missedBranches = activeBranches.filter(b => (branchCounts[b.id] || 0) === 0).map(b => b.name.replace('Phụ Kiện 88 - ', '')).join(', ') || 'Không có';

  // State điều khiển Modal kiểm tra chi tiết cảnh báo
  const [selectedAlert, setSelectedAlert] = useState<RedFlagAlert | null>(null);
  const [closingShiftIds, setClosingShiftIds] = useState<Record<string, boolean>>({});
  const [closedSuccessIds, setClosedSuccessIds] = useState<Record<string, boolean>>({});

  const handleForceCheckout = async (recordId: string, checkInTime: string) => {
    setClosingShiftIds(prev => ({ ...prev, [recordId]: true }));
    try {
      const checkInDate = new Date(checkInTime);
      const autoOut = new Date(checkInDate.getTime() + 8.5 * 3600000).toISOString();
      const { error } = await supabase.from('attendance').update({
        check_out: autoOut,
        work_hours: 8.5,
        notes: '[LÃNH ĐẠO ĐÃ ĐÓNG CA DO QUÊN CHECK-OUT]'
      }).eq('id', recordId);

      if (error) {
        console.warn('Lỗi đóng ca trên Supabase:', error.message);
      } else {
        setClosedSuccessIds(prev => ({ ...prev, [recordId]: true }));
        if (onRefreshAttendance) {
          onRefreshAttendance();
        }
      }
    } catch (err) {
      console.error('Lỗi ngoại lệ khi đóng ca:', err);
    } finally {
      setClosingShiftIds(prev => ({ ...prev, [recordId]: false }));
    }
  };

  // 4. Tổng hợp CẢNH BÁO ĐỎ (Real-time Red Flags) THỰC TẾ từ hệ thống
  const realAlerts: RedFlagAlert[] = [];

  // A. Đơn xin nghỉ phép đang chờ duyệt (PENDING)
  const pendingLeaves = leaveRequests.filter(r => r.status === 'PENDING');
  if (pendingLeaves.length > 0) {
    realAlerts.push({
      id: 'alt-leave-pending',
      type: 'ĐƠN PHÉP CHỜ DUYỆT',
      category: 'LEAVE',
      branch: 'Khối Nhân Sự (AI HR)',
      message: `Có ${pendingLeaves.length} đơn xin nghỉ phép đang chờ Cửa Hàng Trưởng / Khối HR phê duyệt`,
      severity: 'HIGH',
      time: 'Cần duyệt',
      payload: { pendingLeaves }
    });
  }

  // B. Vi phạm khoảng cách GPS chấm công hôm nay (> 200m)
  const outsideLogs = todayLogs.filter(log => log.isOutsideGeofence);
  if (outsideLogs.length > 0) {
    realAlerts.push({
      id: 'alt-gps-violation',
      type: 'VI PHẠM GPS',
      category: 'GPS',
      branch: 'Hệ Thống Chấm Công',
      message: `Ghi nhận ${outsideLogs.length} lượt check-in vượt quá bán kính GPS cho phép (> 200m)`,
      severity: 'HIGH',
      time: 'Hôm nay',
      payload: { outsideLogs }
    });
  }

  // C. Nhân viên quên check-out từ ca trước (> 16h hoặc từ ngày cũ)
  const unclosedShifts = attendanceLogs.filter(l => {
    if (l.checkOut || !l.checkIn) return false;
    const checkInDate = l.checkIn.split('T')[0];
    const isOldDay = checkInDate < today;
    const hoursOpen = (Date.now() - new Date(l.checkIn).getTime()) / 3600000;
    return isOldDay || hoursOpen > 16;
  });
  if (unclosedShifts.length > 0) {
    realAlerts.push({
      id: 'alt-unclosed-shift',
      type: 'QUÊN CHECK-OUT',
      category: 'CHECKOUT',
      branch: 'Toàn Chuỗi',
      message: `Có ${unclosedShifts.length} ca làm việc chưa bấm check-out từ ngày trước hoặc mở quá 16h`,
      severity: 'MEDIUM',
      time: 'Cần đóng ca',
      payload: { unclosedShifts }
    });
  }

  // D. Phiếu sửa chữa tồn đọng > 3 ngày chưa bàn giao
  const delayedTickets = tickets.filter(t => {
    if (t.status === 'DELIVERED' || t.status === 'READY') return false;
    const ageDays = (Date.now() - new Date(t.createdAt).getTime()) / (1000 * 3600 * 24);
    return ageDays > 3;
  });
  if (delayedTickets.length > 0) {
    realAlerts.push({
      id: 'alt-repair-delayed',
      type: 'TRỄ HẸN SỬA CHỮA',
      category: 'REPAIR',
      branch: 'Khối Kỹ Thuật',
      message: `Có ${delayedTickets.length} phiếu sửa chữa thiết bị tồn đọng > 3 ngày chưa bàn giao khách`,
      severity: 'HIGH',
      time: 'Khẩn cấp',
      payload: { delayedTickets }
    });
  }

  // E. Chi nhánh / Văn phòng đang mở nhưng chưa có ai mở ca sau 9h00 sáng
  const currentHour = new Date().getHours();
  if (currentHour >= 9) {
    activeBranches.forEach(b => {
      const hasCheckin = todayLogs.some(l => 
        l.branchId === b.id || 
        (b.code && l.notes?.includes(b.code)) || 
        (b.name && l.notes?.includes(b.name))
      );
      const isOffice = b.code === 'PK88_VANPHONG' || b.name.includes('Văn Phòng');
      if (!hasCheckin) {
        realAlerts.push({
          id: `alt-no-checkin-${b.id}`,
          type: 'CHƯA MỞ CA',
          category: 'OPEN_SHIFT',
          branch: b.name.replace('Phụ Kiện 88 - ', ''),
          branchId: b.id,
          message: isOffice 
            ? 'Văn phòng làm việc nhưng chưa ghi nhận nhân sự check-in ca hành chính' 
            : 'Cửa hàng trực tuyến nhưng chưa ghi nhận nhân sự check-in ca sáng',
          severity: 'HIGH',
          time: isOffice ? 'Ca VP' : 'Ca sáng',
          payload: { branch: b }
        });
      }
    });
  }

  // Sắp xếp Red Flags theo thứ tự ưu tiên chuẩn của chuỗi:
  // 1. Văn Phòng -> 2. Phú Khương -> 3. Đồng Khởi -> 4. Mỹ Tho -> 5. Cần Thơ -> 6. Vĩnh Long -> 7. Thủ Đức
  realAlerts.sort((a, b) => {
    if (a.category === 'OPEN_SHIFT' && b.category === 'OPEN_SHIFT') {
      return getBranchOrderIndex(a.branch) - getBranchOrderIndex(b.branch);
    }
    if (a.category !== 'OPEN_SHIFT' && b.category === 'OPEN_SHIFT') return -1;
    if (a.category === 'OPEN_SHIFT' && b.category !== 'OPEN_SHIFT') return 1;
    return 0;
  });

  // 5. Hiệu suất thực tế theo từng chi nhánh
  const branchMetrics = sortBranchesByPriority(branches).map(b => {
    const isOnline = b.isActive;
    const shortName = b.name.replace('Phụ Kiện 88 - ', 'PK88 ');
    const branchTickets = tickets.filter(t => t.branchId === b.id);
    const bRevenue = branchTickets
      .filter(t => t.status === 'READY' || t.status === 'DELIVERED')
      .reduce((sum, t) => sum + (t.price || 0), 0);
    const bOrders = branchTickets.length;
    const bStaffToday = todayLogs.filter(l => l.branchId === b.id).length;

    return {
      id: b.id,
      code: b.code,
      name: shortName,
      isActive: isOnline,
      revenue: bRevenue,
      orders: bOrders,
      staffToday: bStaffToday
    };
  }).sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    if (b.revenue !== a.revenue) return b.revenue - a.revenue;
    return b.staffToday - a.staffToday;
  });

  return (
    <div className="space-y-6">
      {/* 4 Overview KPI Cards (100% Real-time Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Doanh Thu Dịch Vụ */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Doanh Thu Dịch Vụ & Sửa Chữa</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-100 mt-2 font-mono">
            {realRevenue.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            {realRevenue > 0 ? (
              <span className="text-emerald-400 font-medium">✓ Đã đối soát {completedTickets.length} đơn</span>
            ) : (
              <span className="text-slate-500">Chưa có doanh thu phát sinh (Chờ POS bán lẻ)</span>
            )}
          </div>
        </div>

        {/* Card 2: Nhân Sự Điểm Danh Hôm Nay */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Nhân Sự Đang Trực (GPS)</span>
            <span className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-100 mt-2 font-mono">
            {activeOnShift.length} <span className="text-sm font-normal text-slate-400">/ {todayLogs.length} ca</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {latesCount > 0 ? (
              <span className="text-amber-400">⚠️ {latesCount} ca trễ giờ</span>
            ) : (
              <span className="text-emerald-400">✓ 100% đúng giờ hôm nay</span>
            )}
            {outsideGeofenceCount > 0 && (
              <span className="text-rose-400 ml-1.5">• {outsideGeofenceCount} lệch GPS</span>
            )}
          </div>
        </div>

        {/* Card 3: Chi Nhánh Mở Cửa */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Chi Nhánh Hoạt Động</span>
            <span className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-100 mt-2 font-mono">
            {activeBranches.length} / {branches.length} shop
          </div>
          {inactiveBranches.length > 0 ? (
            <div className="text-xs text-amber-400 font-bold mt-2 flex items-center gap-1">
              <span>⚠️ {inactiveBranches.length} shop tạm đóng ({closedBranchNames})</span>
            </div>
          ) : (
            <div className="text-xs text-emerald-400 mt-2">🟢 100% Chi nhánh mở cửa & Geofenced</div>
          )}
        </div>

        {/* Card 4: Cảnh Báo Đỏ (Real-time Red Flags) */}
        <div className={`glass-card rounded-2xl p-4 border transition-all ${
          realAlerts.length > 0 
            ? 'border-rose-500/40 bg-rose-950/20 shadow-lg shadow-rose-950/30' 
            : 'border-slate-800 bg-slate-900/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${realAlerts.length > 0 ? 'text-rose-300' : 'text-slate-400'}`}>
              Cảnh Báo Đỏ (Red Flags)
            </span>
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              realAlerts.length > 0 ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              {realAlerts.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </span>
          </div>
          <div className={`text-xl font-extrabold mt-2 font-mono ${realAlerts.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {realAlerts.length > 0 ? `${realAlerts.length} Cảnh Báo` : '0 Cảnh Báo'}
          </div>
          <div className={`text-xs mt-2 ${realAlerts.length > 0 ? 'text-rose-300' : 'text-slate-400'}`}>
            {realAlerts.length > 0 ? 'Tự động gửi Telegram Founder' : 'Toàn chuỗi vận hành an toàn'}
          </div>
        </div>
      </div>

      {/* CHARTS SECTION - HIỂN THỊ TRẠNG THÁI DỮ LIỆU THẬT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Chart State */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Biến động Doanh Thu & Lợi Nhuận (7 Ngày)</span>
            </h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded font-mono border border-slate-700">
              Đồng Bộ POS
            </span>
          </div>
          
          <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <DollarSign className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-slate-200">Chưa có luồng dữ liệu bán hàng POS bán lẻ</h4>
            <p className="text-[11px] text-slate-400 max-w-sm mt-1.5 leading-relaxed">
              Hệ thống đã làm sạch hoàn toàn dữ liệu giả. Biểu đồ doanh thu 7 ngày sẽ tự động vẽ đồ thị và phân tích biên lợi nhuận ròng ngay khi phát sinh hóa đơn thực tế.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-3 py-1 rounded-full border border-slate-800">
                Trạng thái: Sẵn sàng ghi nhận đơn
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Chart State */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/40 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-sky-400" />
              <span>Theo Dõi Tồn Kho Mặt Hàng Chủ Lực</span>
            </h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded font-mono border border-slate-700">
              Kho Tổng Chuỗi
            </span>
          </div>

          <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-slate-200">Chưa có dữ liệu kiểm kê tồn kho thực tế</h4>
            <p className="text-[11px] text-slate-400 max-w-sm mt-1.5 leading-relaxed">
              Dữ liệu giả đã được gỡ bỏ. Khi bộ phận kho nhập số lượng tồn kho (Kính cường lực, Pin, Sạc, Cáp), biểu đồ cột và hạn mức Safety Stock sẽ tự động kích hoạt.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-3 py-1 rounded-full border border-slate-800">
                Hạn mức tối thiểu: Safety Stock (10 cái)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Red Flags Alert Center (100% Real Issues) */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${realAlerts.length > 0 ? 'text-rose-500' : 'text-slate-500'}`} />
            <h3 className="text-sm font-bold text-slate-100">Trung Tâm Cảnh Báo Đỏ Telegram (Real-time Red Flags)</h3>
          </div>
          <span className="text-xs text-slate-400">Tự động kiểm soát bởi AI Engine</span>
        </div>

        {realAlerts.length > 0 ? (
          <div className="space-y-3">
            {realAlerts.map(alt => (
              <div key={alt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 gap-2">
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0 animate-ping"></span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{alt.branch}</span>
                      <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                        {alt.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{alt.message}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                  <span className="text-slate-500 text-[11px] font-mono">{alt.time}</span>
                  <button 
                    onClick={() => setSelectedAlert(alt)}
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold rounded-lg border border-rose-500/30 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-sm"
                    title="Bấm để xem phân tích chi tiết và hành động xử lý"
                  >
                    <span>Kiểm tra</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-200">Toàn chuỗi vận hành an toàn</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Không ghi nhận vi phạm khoảng cách GPS, ca trực quên check-out hay đơn phép quá hạn lúc này.</p>
          </div>
        )}
      </div>

      {/* Leave Requests Center (AI HR Engine) */}
      <div className="glass-card rounded-2xl p-5 border border-rose-500/30 bg-slate-900/90 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <span>Danh Sách Đơn Xin Nghỉ Phép</span>
                <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                  AI HR ENGINE
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Tự động kiểm soát tải ca trực, gợi ý nhân sự thay thế & đồng bộ bảng lương</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full font-bold">
              DANH SÁCH ({leaveRequests.length} ĐƠN)
            </span>
            {onOpenAIHRModal && (
              <button
                onClick={onOpenAIHRModal}
                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Mở AI HR</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2.5 max-h-72 overflow-y-auto">
          {leaveRequests.length > 0 ? (
            leaveRequests.map((req) => {
              const branch = branches.find(b => b.id === req.branchId);
              return (
                <div key={req.id} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-100 text-sm">{req.staffName}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono uppercase font-bold">
                        {req.role}
                      </span>
                      <span className="text-[10px] text-cyan-400 font-medium bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                        📍 {branch ? branch.name.replace('Phụ Kiện 88 - ', '') : 'Toàn Chuỗi'}
                      </span>
                    </div>

                    <div className="text-slate-300 font-medium">
                      Lý do: <span className="italic text-slate-200 font-semibold">"{req.reason}"</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono flex-wrap">
                      <span>📅 Từ: <strong className="text-cyan-300">{req.startDate}</strong> đến <strong className="text-cyan-300">{req.endDate}</strong></span>
                      <span>• Loại: <strong className="text-amber-300">{req.type === 'PAID_LEAVE' ? 'Nghỉ Phép Năm (Có Lương)' : req.type === 'SICK_LEAVE' ? 'Nghỉ Ốm Đột Xuất' : 'Nghỉ Không Lương'}</strong></span>
                      {req.replacementStaffName && (
                        <span>• Trực thay: <strong className="text-emerald-300">{req.replacementStaffName}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase flex items-center gap-1.5 ${
                      req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      req.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                    }`}>
                      {req.status === 'APPROVED' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> :
                       req.status === 'REJECTED' ? <XCircle className="w-3 h-3 text-rose-400" /> :
                       <Clock className="w-3 h-3 text-amber-400" />}
                      <span>{req.status === 'APPROVED' ? 'ĐÃ DUYỆT' : req.status === 'REJECTED' ? 'TỪ CHỐI' : 'CHỜ DUYỆT'}</span>
                    </span>

                    {req.aiRiskAssessment && (
                      <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                        <Bot className="w-3 h-3 text-cyan-400" />
                        <span className="truncate max-w-[200px]">{req.aiRiskAssessment}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-slate-500 text-xs">Chưa có đơn xin nghỉ phép nào trong hệ thống.</div>
          )}
        </div>
      </div>

      {/* Branch Breakdown & Real-time AI Copilot Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Branch Real Performance */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Tình Trạng Vận Hành & Doanh Số Chi Nhánh</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
              Thời Gian Thực
            </span>
          </div>
          <div className="space-y-3">
            {branchMetrics.map((b, i) => (
              <div key={b.id || i} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${b.isActive ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-950/40 border-slate-900/60 opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center ${b.isActive ? 'bg-slate-800 text-slate-300' : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'}`}>
                    {b.isActive ? `#${i + 1}` : '✕'}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span>{b.name}</span>
                      {!b.isActive && (
                        <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                          TẠM ĐÓNG
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {b.isActive ? (
                        <span>{b.staffToday > 0 ? `🟢 ${b.staffToday} nhân sự đã check-in` : '⚪ Chưa có check-in'}</span>
                      ) : (
                        <span>Cửa hàng đang tạm dừng hoạt động</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold font-mono ${b.isActive ? 'text-slate-100' : 'text-slate-500'}`}>
                    {b.revenue.toLocaleString('vi-VN')} đ
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">
                    {b.isActive ? `${b.orders} đơn hoàn tất` : 'Offline'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Executive Report (AI Copilot) */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Báo Cáo Điều Hành 22h15 (AI Copilot)</h3>
                <p className="text-xs text-slate-400">Tóm tắt tự động từ dữ liệu thời gian thực gửi Telegram Founder</p>
              </div>
              <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-mono">
                22:15 AUTO
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-sans text-xs space-y-3 leading-relaxed text-slate-300">
              <p className="font-bold text-emerald-400">📊 TÌNH HÌNH VẬN HÀNH TOÀN CHUỖI PHỤ KIỆN 88 ({formattedToday}):</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  <strong className="text-slate-100">Cửa hàng hoạt động:</strong> Có <span className="text-cyan-400 font-bold">{activeBranches.length}/{branches.length} chi nhánh</span> đang mở cửa phục vụ. {inactiveBranches.length > 0 && `(Chi nhánh ${closedBranchNames} đang tạm đóng).`}
                </li>
                <li>
                  <strong className="text-slate-100">Nhân sự ca trực:</strong> Ghi nhận <span className="text-emerald-400 font-bold">{todayLogs.length} lượt check-in</span> ({activeOnShift.length} nhân sự đang trực{latesCount > 0 ? `, ${latesCount} ca đi trễ` : ', 100% đúng giờ'}).
                </li>
                <li>
                  <strong className="text-slate-100">Doanh thu phát sinh:</strong> {realRevenue > 0 ? `${realRevenue.toLocaleString('vi-VN')} đ từ dịch vụ kỹ thuật.` : 'Chưa có dữ liệu giao dịch phát sinh từ máy POS bán lẻ.'}
                </li>
                <li>
                  <strong className="text-slate-100">Truyền thông Marketing:</strong> Toàn chuỗi đã đăng <span className="font-bold text-blue-400">{todayPosts.length} bài</span> hôm nay. {topBranchId ? `Chi nhánh ${topBranchName} tích cực nhất.` : 'Chưa có bài đăng nào hôm nay.'} {missedBranches && missedBranches !== 'Không có' && `Chi nhánh ${missedBranches} chưa nộp bài.`}
                </li>
                <li>
                  <strong className="text-slate-100">Đơn nghỉ phép (AI HR):</strong> {pendingLeaves.length > 0 ? `Đang có ${pendingLeaves.length} đơn xin nghỉ phép chờ phê duyệt.` : 'Không có đơn nghỉ phép tồn đọng.'}
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between mt-4">
            <span className="text-[11px] text-slate-500 font-mono">Đồng bộ tự động mỗi 5 phút</span>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition-all border border-slate-700 cursor-pointer flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Làm Mới Số Liệu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert Inspection Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/50">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl border flex-shrink-0 ${
                  selectedAlert.category === 'CHECKOUT' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                  selectedAlert.category === 'OPEN_SHIFT' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                  selectedAlert.category === 'LEAVE' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                  selectedAlert.category === 'GPS' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                  'bg-orange-500/10 border-orange-500/30 text-orange-400'
                }`}>
                  {selectedAlert.category === 'CHECKOUT' && <Clock className="w-5 h-5" />}
                  {selectedAlert.category === 'OPEN_SHIFT' && (
                    selectedAlert.branch.includes('Văn Phòng') ? <Building2 className="w-5 h-5" /> : <Store className="w-5 h-5" />
                  )}
                  {selectedAlert.category === 'LEAVE' && <Calendar className="w-5 h-5" />}
                  {selectedAlert.category === 'GPS' && <MapPin className="w-5 h-5" />}
                  {selectedAlert.category === 'REPAIR' && <Wrench className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {selectedAlert.type}
                    </span>
                    <span className="text-xs text-slate-400 font-mono font-bold">
                      {selectedAlert.branch}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-100 mt-1">
                    {selectedAlert.message}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Category 1: QUÊN CHECK-OUT */}
              {selectedAlert.category === 'CHECKOUT' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 leading-relaxed flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Các ca làm việc dưới đây đã quá 16 giờ hoặc sang ngày làm việc mới mà nhân sự chưa bấm Check-Out. Quản lý có thể đóng ca tức thì hoặc xem nhật ký.</span>
                  </div>

                  <div className="space-y-2">
                    {unclosedShifts.map((shift, idx) => {
                      const staff = staffList.find(s => s.id === shift.staffId);
                      const branch = branches.find(b => b.id === shift.branchId);
                      const isClosing = closingShiftIds[shift.id];
                      const isClosed = closedSuccessIds[shift.id];
                      const hoursOpen = Math.round((Date.now() - new Date(shift.checkIn).getTime()) / 3600000);

                      return (
                        <div key={shift.id || idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center border border-slate-700">
                              {staff?.fullName ? staff.fullName.charAt(0) : 'NV'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-200">{staff?.fullName || 'Nhân sự (Mã: ' + shift.staffId + ')'}</span>
                                <span className="text-[10px] text-slate-400 font-mono">({branch?.name.replace('Phụ Kiện 88 - ', '') || 'Chi nhánh'})</span>
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>Check-in: <strong className="text-slate-300">{new Date(shift.checkIn).toLocaleString('vi-VN')}</strong></span>
                                <span className="text-rose-400 font-mono font-bold">({hoursOpen}h trước)</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {isClosed ? (
                              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Đã đóng ca</span>
                              </span>
                            ) : (
                              <button
                                disabled={isClosing}
                                onClick={() => handleForceCheckout(shift.id, shift.checkIn)}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                <span>{isClosing ? 'Đang đóng...' : '⚡ Đóng Ca Tức Thì'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category 2: CHƯA MỞ CA */}
              {selectedAlert.category === 'OPEN_SHIFT' && (() => {
                const branchObj = selectedAlert.payload?.branch || branches.find(b => b.id === selectedAlert.branchId);
                const assignedStaff = staffList.filter(s => s.branchId === branchObj?.id && s.isActive);
                const isOffice = branchObj?.code === 'PK88_VANPHONG' || branchObj?.name?.includes('Văn Phòng');

                return (
                  <div className="space-y-4">
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 leading-relaxed flex items-start gap-2">
                      {isOffice ? <Building2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" /> : <Store className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                      <div>
                        <p className="font-bold">
                          {isOffice 
                            ? 'Văn phòng chưa có nhân sự check-in mở ca hành chính sau 09:00 sáng:' 
                            : 'Cửa hàng chưa có nhân sự check-in mở ca sau 09:00 sáng:'}
                        </p>
                        <p className="text-slate-400 text-[11px] mt-0.5">{branchObj?.address || 'Địa chỉ đang cập nhật'}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        {isOffice ? `Danh sách nhân sự văn phòng (${assignedStaff.length} người):` : `Danh sách nhân sự thuộc chi nhánh (${assignedStaff.length} người):`}
                      </h4>
                      {assignedStaff.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-3 bg-slate-950 rounded-xl">Chưa có nhân viên nào được phân bổ vào chi nhánh này trong danh bạ.</p>
                      ) : (
                        <div className="space-y-2">
                          {assignedStaff.map(s => (
                            <div key={s.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-800 text-cyan-400 font-bold text-xs flex items-center justify-center border border-slate-700">
                                  {s.fullName.charAt(0)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-200">{s.fullName}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                      s.role === 'manager' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                      s.role === 'technician' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    }`}>
                                      {s.role}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-mono">{s.phone}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <a
                                  href={`tel:${s.phone}`}
                                  className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 border border-emerald-500/30 transition-all cursor-pointer"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>Gọi điện</span>
                                </a>
                                <a
                                  href={`https://zalo.me/${s.phone.replace(/^0/, '84')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-xs font-bold flex items-center gap-1 border border-blue-500/30 transition-all cursor-pointer"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Zalo</span>
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Category 3: ĐƠN PHÉP CHỜ DUYỆT */}
              {selectedAlert.category === 'LEAVE' && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 leading-relaxed flex items-center gap-2">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>Có {pendingLeaves.length} đơn xin nghỉ phép đang cần được phê duyệt. Hệ thống AI HR đã tự động kiểm tra xung đột tải ca.</span>
                  </div>

                  <div className="space-y-2">
                    {pendingLeaves.map(r => (
                      <div key={r.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">{r.staffName}</span>
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold">
                            {r.type === 'SICK_LEAVE' ? 'Nghỉ Ốm' : r.type === 'PAID_LEAVE' ? 'Phép Hưởng Lương' : 'Nghỉ Không Lương'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 italic font-serif">"{r.reason}"</p>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
                          <span>Từ: <strong className="text-slate-300">{r.startDate}</strong> đến <strong className="text-slate-300">{r.endDate}</strong></span>
                          {r.aiRiskAssessment && (
                            <span className="text-amber-400 font-bold">{r.aiRiskAssessment}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 4: VI PHẠM GPS */}
              {selectedAlert.category === 'GPS' && (
                <div className="space-y-3">
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-300 leading-relaxed flex items-center gap-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>Ghi nhận các lượt check-in ngoài bán kính cho phép (chuẩn hệ thống &gt; 100m). Cần kiểm tra giải trình của nhân viên.</span>
                  </div>

                  <div className="space-y-2">
                    {outsideLogs.map((log, idx) => {
                      const staff = staffList.find(s => s.id === log.staffId);
                      const branch = branches.find(b => b.id === log.branchId);

                      return (
                        <div key={log.id || idx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-200">{staff?.fullName || 'Nhân sự'}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({branch?.name.replace('Phụ Kiện 88 - ', '')})</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Lúc: <strong className="text-slate-300">{new Date(log.checkIn).toLocaleString('vi-VN')}</strong>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                              +{Math.round(log.distanceMeters || 0)}m
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {log.disputeStatus === 'PENDING' ? '⏳ Đã nộp giải trình' : '⚠️ Chưa giải trình'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category 5: TRỄ HẸN SỬA CHỮA */}
              {selectedAlert.category === 'REPAIR' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 leading-relaxed flex items-center gap-2">
                    <Wrench className="w-4 h-4 flex-shrink-0" />
                    <span>Các thiết bị khách hàng đã tiếp nhận sửa chữa quá 3 ngày chưa bàn giao hoặc chưa xong. Cần đôn đốc bộ phận kỹ thuật.</span>
                  </div>

                  <div className="space-y-2">
                    {delayedTickets.map(t => {
                      const ageDays = Math.round((Date.now() - new Date(t.createdAt).getTime()) / (1000 * 3600 * 24));
                      const branch = branches.find(b => b.id === t.branchId);

                      return (
                        <div key={t.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-200">#{t.code} - {t.customerName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({branch?.name.replace('Phụ Kiện 88 - ', '')})</span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5">{t.deviceModel} ({t.serviceType})</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                              Trễ {ageDays} ngày
                            </span>
                            <div className="text-[11px] text-slate-400 mt-0.5">{(t.price || 0).toLocaleString('vi-VN')} đ</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                {selectedAlert.category === 'LEAVE' && onOpenAIHRModal && (
                  <button
                    onClick={() => {
                      setSelectedAlert(null);
                      onOpenAIHRModal();
                    }}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-rose-500/20 cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Mở AI HR Phê Duyệt</span>
                  </button>
                )}

                {(selectedAlert.category === 'CHECKOUT' || selectedAlert.category === 'GPS' || selectedAlert.category === 'OPEN_SHIFT') && onNavigateTab && (
                  <button
                    onClick={() => {
                      setSelectedAlert(null);
                      onNavigateTab('hr_hub');
                    }}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-rose-500/20 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Đến Trung Tâm Vận Hành Nhân Lực (HR Hub)</span>
                  </button>
                )}

                {selectedAlert.category === 'REPAIR' && onNavigateTab && (
                  <button
                    onClick={() => {
                      setSelectedAlert(null);
                      onNavigateTab('counter');
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Đến Quầy Sửa Chữa (POS & Tickets)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
