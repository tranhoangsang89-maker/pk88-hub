import React from 'react';
import { Branch } from '../types';
import { TrendingUp, AlertTriangle, Package, CheckCircle, Smartphone, ArrowUpRight, DollarSign } from 'lucide-react';

interface ExecutiveDashboardProps {
  branches: Branch[];
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ branches }) => {
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
    { name: 'PK88 Bến Tre', revenue: 12200000, orders: 38, growth: '+8%' },
    { name: 'PK88 Vĩnh Long', revenue: 9800000, orders: 27, growth: '+4%' },
    { name: 'PK88 Cần Thơ', revenue: 6400000, orders: 19, growth: '-28%' },
  ];

  const totalRevenue = branchMetrics.reduce((sum, b) => sum + b.revenue, 0);

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
          <div className="text-xl font-extrabold text-slate-100 mt-2 font-mono">6 / 6 shop</div>
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
