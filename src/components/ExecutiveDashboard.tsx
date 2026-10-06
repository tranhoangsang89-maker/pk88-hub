import React from 'react';
import { Branch, AttendanceRecord, MarketingPost, LeaveRequest } from '../types';
import { TrendingUp, AlertTriangle, Package, CheckCircle, Smartphone, ArrowUpRight, DollarSign, Clock, UserCheck, Activity, Calendar, FileText, CheckCircle2, XCircle, Bot } from 'lucide-react';
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

interface ExecutiveDashboardProps {
  branches: Branch[];
  attendanceLogs?: AttendanceRecord[];
  marketingPosts?: MarketingPost[];
  leaveRequests?: LeaveRequest[];
  onOpenAIHRModal?: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ 
  branches, 
  attendanceLogs = [], 
  marketingPosts = [],
  leaveRequests = [],
  onOpenAIHRModal
}) => {
  const alerts = [
    {
      type: 'REVENUE_DROP',
      branch: 'Phụ Kiện 88 - Cần Thơ',
      message: 'Doanh thu sụt giảm 28% so với trung bình 3 ngày trước',
      severity: 'HIGH',
      time: '18:30 Hôm nay'
    },
    {
      type: 'REPAIR_DELAY',
      branch: 'Phụ Kiện 88 - Bến Tre',
      message: 'Có 2 phiếu sửa chữa iPhone 13 Pro Max tồn > 5 ngày chưa giao',
      severity: 'HIGH',
      time: '15:10 Hôm nay'
    },
    {
      type: 'LOW_STOCK',
      branch: 'Phụ Kiện 88 - Mỹ Tho',
      message: 'Kính cường lực Kingkong iPhone 14 Pro còn dưới 5 cái',
      severity: 'MEDIUM',
      time: '12:00 Hôm nay'
    }
  ];

  const branchMetrics = [
    { name: 'PK88 Mỹ Tho', revenue: 14500000, orders: 42, growth: '+15%' },
    { name: 'PK88 Bến Tre 1', revenue: 12200000, orders: 38, growth: '+8%' },
    { name: 'PK88 Vĩnh Long', revenue: 9800000, orders: 27, growth: '+4%' },
    { name: 'PK88 Bến Tre 2', revenue: 8500000, orders: 24, growth: '+2%' },
    { name: 'PK88 Trà Vinh', revenue: 7200000, orders: 20, growth: '-5%' },
    { name: 'PK88 Cần Thơ', revenue: 6400000, orders: 19, growth: '-28%' },
    { name: 'PK88 Thủ Đức', revenue: 0, orders: 0, growth: '0%' },
  ];

  const totalRevenue = branchMetrics.reduce((sum, b) => sum + b.revenue, 0);

  // Dữ liệu biểu đồ Doanh thu & Lợi nhuận (7 ngày qua)
  const revenueData = [
    { date: '21/09', revenue: 28000000, profit: 9500000 },
    { date: '22/09', revenue: 32000000, profit: 11000000 },
    { date: '23/09', revenue: 25000000, profit: 8200000 },
    { date: '24/09', revenue: 35000000, profit: 12500000 },
    { date: '25/09', revenue: 39000000, profit: 14000000 },
    { date: '26/09', revenue: 34000000, profit: 11500000 },
    { date: '27/09', revenue: 42900000, profit: 14670000 },
  ];

  // Dữ liệu Tồn kho các mặt hàng chủ lực giữa các chi nhánh
  const inventoryData = [
    { name: 'Kính KK 14PM', 'Mỹ Tho': 45, 'Bến Tre 1': 12, 'Bến Tre 2': 18, 'Vĩnh Long': 35, 'Cần Thơ': 180, 'Trà Vinh': 25, 'Thủ Đức': 50 },
    { name: 'Pin Bison 11PM', 'Mỹ Tho': 20, 'Bến Tre 1': 8, 'Bến Tre 2': 15, 'Vĩnh Long': 22, 'Cần Thơ': 30, 'Trà Vinh': 10, 'Thủ Đức': 15 },
    { name: 'Ốp Magsafe 15PM', 'Mỹ Tho': 60, 'Bến Tre 1': 35, 'Bến Tre 2': 20, 'Vĩnh Long': 45, 'Cần Thơ': 5, 'Trà Vinh': 15, 'Thủ Đức': 30 }, // Cần Thơ cảnh báo đỏ
    { name: 'Sạc 20W Zin', 'Mỹ Tho': 120, 'Bến Tre 1': 80, 'Bến Tre 2': 65, 'Vĩnh Long': 90, 'Cần Thơ': 150, 'Trà Vinh': 50, 'Thủ Đức': 75 },
  ];

  const formatCurrency = (value: number) => {
    return `${(value / 1000000).toFixed(1)}M`;
  };

  // Calculate Marketing Stats for AI Copilot
  const today = new Date().toISOString().split('T')[0];
  const todayPosts = marketingPosts.filter(p => p.created_at.startsWith(today));
  const branchCounts = todayPosts.reduce((acc, p) => {
    acc[p.branch_id] = (acc[p.branch_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topBranchId = Object.entries(branchCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topBranchName = branches.find(b => b.id === topBranchId)?.name.replace('Phụ Kiện 88 - ', '') || 'N/A';
  const missedBranches = branches.filter(b => (branchCounts[b.id] || 0) === 0).map(b => b.name.replace('Phụ Kiện 88 - ', '')).join(', ') || 'Không có';

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Doanh thu Real-time</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-100 mt-2 font-mono">
            {totalRevenue.toLocaleString('vi-VN')} đ
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-400 mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12.4% so với hôm qua</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tổng Đơn Hàng</span>
            <span className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-100 mt-2 font-mono">126 đơn</div>
          <div className="text-xs text-slate-400 mt-2">Trung bình 31.5 đơn/shop</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Chi Nhánh Hoạt Động</span>
            <span className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-slate-100 mt-2 font-mono">{branches.length} / {branches.length} shop</div>
          <div className="text-xs text-emerald-400 mt-2">All Online & Geofenced</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-rose-500/30 bg-rose-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300">Cảnh Báo Đỏ (Red Flags)</span>
            <span className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-rose-400 mt-2 font-mono">3 Cảnh Báo</div>
          <div className="text-xs text-rose-300 mt-2">Tự động gửi Telegram Founder</div>
        </div>
      </div>

      {/* CHARTS SECTION - BIỂU ĐỒ BÁO CÁO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue & Profit Area Chart */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Biến động Doanh Thu & Lợi Nhuận (7 Ngày)</span>
            </h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded font-mono">Real-time</span>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#f1f5f9' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')} đ`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" name="Doanh Thu" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" name="Lợi Nhuận Ròng" dataKey="profit" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Bar Chart */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-sky-400" />
              <span>Theo Dõi Tồn Kho Mặt Hàng Chủ Lực</span>
            </h3>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded font-mono border border-amber-500/20">Cần Luân Chuyển</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <ReferenceLine y={10} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'top', value: 'Safety Stock (10)', fill: '#f43f5e', fontSize: 10 }} />
                <Bar name="Mỹ Tho" dataKey="Mỹ Tho" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar name="Bến Tre 1" dataKey="Bến Tre 1" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar name="Bến Tre 2" dataKey="Bến Tre 2" fill="#d946ef" radius={[4, 4, 0, 0]} />
                <Bar name="Vĩnh Long" dataKey="Vĩnh Long" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                <Bar name="Cần Thơ" dataKey="Cần Thơ" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar name="Trà Vinh" dataKey="Trà Vinh" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar name="Thủ Đức" dataKey="Thủ Đức" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Red Flags Alert Center */}
      <div className="glass-card rounded-2xl p-5 border border-rose-500/30 bg-slate-900/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h3 className="text-sm font-bold text-slate-100">Trung Tâm Cảnh Báo Đỏ Telegram (Real-time Red Flags)</h3>
          </div>
          <span className="text-xs text-slate-400">Tự động kiểm soát bởi AI Engine</span>
        </div>

        <div className="space-y-3">
          {alerts.map((alt, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 gap-2">
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0 animate-ping"></span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{alt.branch}</span>
                    <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-mono">
                      {alt.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{alt.message}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                <span className="text-slate-500 text-[11px]">{alt.time}</span>
                <button className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium rounded-lg border border-rose-500/30">
                  Xử lý ngay
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leave Requests Center (Replaced GPS Attendance Log) */}
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

      {/* Branch Revenue Breakdown & Executive Night Summary Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Ranking */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Xếp Hạng Doanh Số Theo Chi Nhánh</span>
          </h3>
          <div className="space-y-3">
            {branchMetrics.map((b, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-800 font-bold text-xs flex items-center justify-center text-slate-400">
                    #{i + 1}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{b.name}</div>
                    <div className="text-[11px] text-slate-400">{b.orders} đơn hàng thành công</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-slate-100">{b.revenue.toLocaleString('vi-VN')} đ</div>
                  <span className={`text-[11px] font-semibold ${b.growth.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {b.growth}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 22h15 Night Executive Report Simulation */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 bg-slate-900/90">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Báo Cáo Điều Hành 22h15 (AI Copilot)</h3>
              <p className="text-xs text-slate-400">Tóm tắt 3 gạch đầu dòng gửi về Telegram Founder</p>
            </div>
            <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-mono">
              22:15 AUTO
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-sans text-xs space-y-3 leading-relaxed text-slate-300">
            <p className="font-bold text-emerald-400">📊 TÌNH HÌNH KINH DOANH TOÀN CHUỖI PHỤ KIỆN 88 (27/09):</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong className="text-slate-100">Tổng doanh thu:</strong> 42.900.000đ (Biên lợi nhuận ròng tạm tính: <span className="text-emerald-400 font-mono font-bold">34.2%</span>).
              </li>
              <li>
                <strong className="text-slate-100">Chi nhánh xuất sắc nhất:</strong> PK88 Mỹ Tho (14.5 trđ). PK88 Cần Thơ cần điều chỉnh khuyến mãi upsell.
              </li>
              <li>
                <strong className="text-slate-100">Đề xuất luân chuyển kho:</strong> Chuyển 20 ốp lưng iPhone 15 Promax từ Mỹ Tho ➔ Cần Thơ (Cần Thơ đang cháy hàng).
              </li>
              <li>
                <strong className="text-slate-100">📢 Marketing:</strong> Toàn chuỗi đăng <span className="font-bold text-blue-400">{todayPosts.length} bài</span> hôm nay. Chi nhánh <span className="font-bold text-amber-400">{topBranchName}</span> tích cực nhất. Cảnh báo chi nhánh <span className="font-bold text-rose-400">{missedBranches}</span> chưa đăng bài.
              </li>
            </ul>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-end">
              <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md">
                ✓ Duyệt 1-Chạm Điều Chuyển Kho
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
