import React, { useState, useMemo, useEffect } from 'react';
import { Branch, MarketingPost, MarketingPlatform } from '../types';
import { 
  Megaphone, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Eye, 
  Sparkles, 
  Building2, 
  ExternalLink, 
  Share2, 
  Copy, 
  Check, 
  Filter, 
  RefreshCw,
  Clock,
  Layers,
  Facebook,
  Youtube,
  MessageCircle,
  Video
} from 'lucide-react';
import { sortBranchesByPriority } from '../lib/mockData';
import { supabase } from '../lib/supabase';

interface ExecutiveMarketingMatrixProps {
  branches: Branch[];
  marketingPosts?: MarketingPost[];
  onNavigateTab?: (tab: string) => void;
  onRefreshMarketing?: () => void;
}

export const ExecutiveMarketingMatrix: React.FC<ExecutiveMarketingMatrixProps> = ({
  branches,
  marketingPosts = [],
  onNavigateTab,
  onRefreshMarketing
}) => {
  const activeBranches = useMemo(() => {
    return sortBranchesByPriority(branches.filter(b => b.isActive));
  }, [branches]);

  // Helper định dạng YYYY-MM-DD theo giờ Việt Nam
  const getTodayVn = () => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
  };

  const getYesterdayVn = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(d);
  };

  const todayStr = useMemo(() => getTodayVn(), []);
  const yesterdayStr = useMemo(() => getYesterdayVn(), []);

  // State bộ lọc ngày (mặc định: Hôm Nay)
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MISSED' | 'REACHED' | 'PARTIAL'>('ALL');
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Local state lưu bài đăng để đồng bộ Realtime độc lập nếu cần
  const [posts, setPosts] = useState<MarketingPost[]>(marketingPosts);

  useEffect(() => {
    setPosts(marketingPosts);
  }, [marketingPosts]);

  // Đăng ký kênh Realtime Supabase cho marketing_posts
  useEffect(() => {
    const channel = supabase
      .channel('executive_marketing_matrix_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'marketing_posts' },
        async () => {
          try {
            const { data } = await supabase
              .from('marketing_posts')
              .select('*')
              .order('created_at', { ascending: false });
            if (data) {
              setPosts(data as MarketingPost[]);
            }
            if (onRefreshMarketing) onRefreshMarketing();
          } catch (e) {
            console.warn('Realtime marketing update error:', e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onRefreshMarketing]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { data } = await supabase
        .from('marketing_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        setPosts(data as MarketingPost[]);
      }
      if (onRefreshMarketing) onRefreshMarketing();
    } catch (e) {
      console.warn('Manual refresh error:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Helper chuyển đổi ngày tạo sang YYYY-MM-DD
  const toLocalDateString = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(d);
    } catch {
      return '';
    }
  };

  // Lọc bài đăng theo ngày đã chọn
  const filteredPosts = useMemo(() => {
    if (selectedDate === 'ALL') return posts;
    return posts.filter(p => toLocalDateString(p.created_at) === selectedDate);
  }, [posts, selectedDate]);

  // Helper so khớp bài đăng với chi nhánh
  const getBranchPosts = (branch: Branch) => {
    return filteredPosts.filter(p => {
      if (p.branch_id === branch.id) return true;
      // Fallback khớp theo code hoặc tên
      if (branch.code && p.branch_id === branch.code) return true;
      return false;
    });
  };

  // Tính toán dữ liệu thống kê theo từng chi nhánh
  const branchStats = useMemo(() => {
    return activeBranches.map(branch => {
      const bPosts = getBranchPosts(branch);
      const fbCount = bPosts.filter(p => p.platform === 'facebook').length;
      const ttCount = bPosts.filter(p => p.platform === 'tiktok').length;
      const zlCount = bPosts.filter(p => p.platform === 'zalo').length;
      const ytCount = bPosts.filter(p => p.platform === 'youtube').length;
      const totalPosts = bPosts.length;
      const totalViews = bPosts.reduce((acc, p) => acc + (p.views || 0), 0);
      const totalLikes = bPosts.reduce((acc, p) => acc + (p.likes || 0), 0);

      // KPI chuẩn: 2 bài/ngày/chi nhánh
      const isReached = totalPosts >= 2;
      const isZero = totalPosts === 0;
      const isPartial = totalPosts === 1;

      return {
        branch,
        posts: bPosts,
        fbCount,
        ttCount,
        zlCount,
        ytCount,
        totalPosts,
        totalViews,
        totalLikes,
        isReached,
        isZero,
        isPartial,
        status: isReached ? 'REACHED' : isZero ? 'ZERO' : 'PARTIAL'
      };
    });
  }, [activeBranches, filteredPosts]);

  // Tổng hợp chỉ số KPI toàn chuỗi
  const totalPostsToday = filteredPosts.length;
  const totalViewsToday = filteredPosts.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalLikesToday = filteredPosts.reduce((acc, p) => acc + (p.likes || 0), 0);
  const targetTotalPosts = activeBranches.length * 2;

  const reachedBranches = branchStats.filter(s => s.isReached);
  const partialBranches = branchStats.filter(s => s.isPartial);
  const zeroBranches = branchStats.filter(s => s.isZero);

  const reachedPercent = activeBranches.length > 0 
    ? Math.round((reachedBranches.length / activeBranches.length) * 100) 
    : 0;

  // Lọc danh sách theo bộ lọc trạng thái
  const displayedStats = useMemo(() => {
    if (statusFilter === 'REACHED') return branchStats.filter(s => s.isReached);
    if (statusFilter === 'PARTIAL') return branchStats.filter(s => s.isPartial);
    if (statusFilter === 'MISSED') return branchStats.filter(s => !s.isReached);
    return branchStats;
  }, [branchStats, statusFilter]);

  // Định dạng nhãn ngày hiển thị
  const selectedDateLabel = useMemo(() => {
    if (selectedDate === 'ALL') return 'Tất Cả Lịch Sử';
    if (selectedDate === todayStr) return 'Hôm Nay';
    if (selectedDate === yesterdayStr) return 'Hôm Qua';
    const parts = selectedDate.split('-');
    if (parts.length === 3) return `Ngày ${parts[2]}/${parts[1]}/${parts[0]}`;
    return selectedDate;
  }, [selectedDate, todayStr, yesterdayStr]);

  // Sao chép báo cáo nhanh để Founder gửi vào nhóm Telegram/Zalo Quản lý
  const handleCopyReport = () => {
    const dateFormatted = selectedDate === 'ALL' ? 'Toàn bộ' : selectedDate.split('-').reverse().join('/');
    
    let reportText = `📢 [BÁO CÁO TIẾN ĐỘ MARKETING PK88 - ${dateFormatted}]\n`;
    reportText += `🎯 Chỉ tiêu: 2 Bài / Shop / Ngày\n`;
    reportText += `📊 Tiến độ: ${reachedBranches.length}/${activeBranches.length} Shop đạt KPI (${reachedPercent}%) | Tổng: ${totalPostsToday} bài (${totalViewsToday.toLocaleString('vi-VN')} views)\n`;
    reportText += `━━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (reachedBranches.length > 0) {
      reportText += `🟢 ĐẠT KPI (${reachedBranches.length} Shop):\n`;
      reachedBranches.forEach(s => {
        reportText += `  • ${s.branch.name.replace('Phụ Kiện 88 - ', '')}: ${s.totalPosts} bài (FB:${s.fbCount} TT:${s.ttCount} ZL:${s.zlCount} YT:${s.ytCount}) - ${s.totalViews.toLocaleString('vi-VN')} views\n`;
      });
    }

    if (partialBranches.length > 0) {
      reportText += `🟡 ĐANG LÊN BÀI (${partialBranches.length} Shop - Còn thiếu 1 bài):\n`;
      partialBranches.forEach(s => {
        reportText += `  • ${s.branch.name.replace('Phụ Kiện 88 - ', '')}: 1/2 bài - ${s.totalViews.toLocaleString('vi-VN')} views\n`;
      });
    }

    if (zeroBranches.length > 0) {
      reportText += `🔴 CHƯA ĐĂNG BÀI (${zeroBranches.length} Shop - Cần đôn đốc gấp):\n`;
      zeroBranches.forEach(s => {
        reportText += `  • ${s.branch.name.replace('Phụ Kiện 88 - ', '')}: 0 bài\n`;
      });
    }

    reportText += `━━━━━━━━━━━━━━━━━━━━━\n`;
    reportText += `👉 Đề nghị CHT các chi nhánh chưa hoàn thành đôn đốc nhân sự nộp link trước 21h00 hàng ngày!`;

    navigator.clipboard.writeText(reportText).then(() => {
      setCopyToast('✅ Đã sao chép báo cáo Marketing vào Clipboard! Sẵn sàng dán vào Zalo/Telegram.');
      setTimeout(() => setCopyToast(null), 3500);
    }).catch(() => {
      setCopyToast('⚠️ Không thể tự động sao chép. Vui lòng thử lại.');
      setTimeout(() => setCopyToast(null), 2500);
    });
  };

  return (
    <div className="relative glass-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950/90 shadow-2xl overflow-hidden mb-6">
      {/* Background Glow Effect */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-violet-600/15 via-fuchsia-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-tr from-cyan-600/10 via-emerald-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Toast thông báo */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-emerald-500/95 text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 backdrop-blur-md border border-emerald-400 text-xs sm:text-sm animate-bounce">
          <Check className="w-4 h-4 shrink-0" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* 1. HEADER SECTION & HÀNH ĐỘNG CỦA FOUNDER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-4 border-b border-slate-800/80">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-pink-500/10 border border-violet-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-100 tracking-tight flex items-center gap-1.5">
                BẢNG MA TRẬN ĐĂNG BÀI MARKETING TOÀN CHUỖI
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                CLOUD LIVE
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/30">
                🎯 Chỉ tiêu: 2 Bài / Shop / Ngày
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Giám sát tiến độ truyền thông 4 nền tảng (Facebook, TikTok, Zalo, YouTube) & lượt tiếp cận của 8 chi nhánh
            </p>
          </div>
        </div>

        {/* Nút hành động nhanh của Founder */}
        <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Làm mới dữ liệu Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            onClick={handleCopyReport}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 hover:from-violet-600/50 hover:to-fuchsia-600/50 text-violet-200 border border-violet-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Sao chép báo cáo gửi nhóm Zalo/Telegram"
          >
            <Copy className="w-3.5 h-3.5 text-violet-300" />
            <span>Copy Báo Cáo Zalo / Telegram</span>
          </button>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('marketing')}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 group"
            >
              <span>Xưởng & Feed MKT</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {/* 2. DATE SELECTOR & STATUS FILTER CHIPS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 my-4">
        {/* Bộ chọn ngày */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1 shrink-0 mr-1">
            <Calendar className="w-3.5 h-3.5 text-violet-400" />
            <span>Ngày xem:</span>
          </span>

          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedDate === todayStr
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/20 border border-violet-400/30'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            ⚡ Hôm Nay
          </button>

          <button
            onClick={() => setSelectedDate(yesterdayStr)}
            className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedDate === yesterdayStr
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/20 border border-violet-400/30'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            Hôm Qua
          </button>

          <button
            onClick={() => setSelectedDate('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedDate === 'ALL'
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/20 border border-violet-400/30'
                : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            Tất Cả Lịch Sử
          </button>

          <div className="relative shrink-0">
            <input
              type="date"
              value={selectedDate === 'ALL' ? '' : selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              className="bg-slate-900 text-slate-200 text-xs px-2.5 py-1 rounded-xl border border-slate-800 focus:outline-none focus:border-violet-500 font-mono cursor-pointer"
            />
          </div>
        </div>

        {/* Bộ lọc trạng thái shop */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold shrink-0 transition-colors ${
              statusFilter === 'ALL' ? 'bg-slate-800 text-white border border-slate-600' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tất cả ({branchStats.length})
          </button>

          <button
            onClick={() => setStatusFilter('REACHED')}
            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold shrink-0 transition-colors flex items-center gap-1 ${
              statusFilter === 'REACHED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Đạt KPI ({reachedBranches.length})
          </button>

          <button
            onClick={() => setStatusFilter('PARTIAL')}
            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold shrink-0 transition-colors flex items-center gap-1 ${
              statusFilter === 'PARTIAL' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            1/2 bài ({partialBranches.length})
          </button>

          <button
            onClick={() => setStatusFilter('MISSED')}
            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold shrink-0 transition-colors flex items-center gap-1 ${
              statusFilter === 'MISSED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Chưa đạt ({partialBranches.length + zeroBranches.length})
          </button>
        </div>
      </div>

      {/* 3. KPI SUMMARY GRID (4 CARDS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 mb-4">
        {/* Card 1: Tiến độ Đạt KPI Shop */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tiến Độ Chuỗi</span>
            <span className="text-xs font-mono font-bold text-emerald-400">{reachedPercent}%</span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-100">
              {reachedBranches.length}
            </span>
            <span className="text-xs text-slate-400">/ {activeBranches.length} Shop Đạt</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${reachedPercent}%` }}
            />
          </div>
        </div>

        {/* Card 2: Tổng bài đăng nộp */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Bài Đăng</span>
            <span className="text-[10px] text-slate-500 font-mono">Mục tiêu: {targetTotalPosts}</span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-violet-400">
              {totalPostsToday}
            </span>
            <span className="text-xs text-slate-400">bài nộp</span>
          </div>
          <span className="text-[11px] text-slate-500 truncate">
            {totalPostsToday >= targetTotalPosts ? '🎉 Vượt chỉ tiêu toàn chuỗi' : `Còn thiếu ${Math.max(0, targetTotalPosts - totalPostsToday)} bài`}
          </span>
        </div>

        {/* Card 3: Tổng lượt xem (Reach Views) */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lượt Tiếp Cận</span>
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono">
              {totalViewsToday.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400">views</span>
          </div>
          <span className="text-[11px] text-slate-500 truncate">
            ❤️ {totalLikesToday.toLocaleString('vi-VN')} lượt yêu thích
          </span>
        </div>

        {/* Card 4: Cảnh báo chưa đăng */}
        <div className={`border rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between shadow-sm transition-colors ${
          zeroBranches.length > 0 
            ? 'bg-rose-950/20 border-rose-500/30' 
            : 'bg-emerald-950/20 border-emerald-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chưa Đăng Bài</span>
            {zeroBranches.length > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className={`text-xl sm:text-2xl font-black ${zeroBranches.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {zeroBranches.length}
            </span>
            <span className="text-xs text-slate-400">/ {activeBranches.length} Shop</span>
          </div>
          <span className={`text-[11px] font-medium truncate ${zeroBranches.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {zeroBranches.length > 0 ? '⚠️ Cần CHT nhắc nhở nộp' : '✅ 100% shop có bài đăng'}
          </span>
        </div>
      </div>

      {/* 4. GIAO DIỆN MÁY TÍNH (DESKTOP MATRIX TABLE) */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3.5">Chi nhánh</th>
              <th className="px-3 py-3.5 text-center">
                <span className="inline-flex items-center gap-1 text-blue-400">
                  <Facebook className="w-3.5 h-3.5" /> Facebook
                </span>
              </th>
              <th className="px-3 py-3.5 text-center">
                <span className="inline-flex items-center gap-1 text-slate-200">
                  <Video className="w-3.5 h-3.5" /> TikTok
                </span>
              </th>
              <th className="px-3 py-3.5 text-center">
                <span className="inline-flex items-center gap-1 text-sky-400">
                  <MessageCircle className="w-3.5 h-3.5" /> Zalo
                </span>
              </th>
              <th className="px-3 py-3.5 text-center">
                <span className="inline-flex items-center gap-1 text-red-400">
                  <Youtube className="w-3.5 h-3.5" /> YouTube
                </span>
              </th>
              <th className="px-3 py-3.5 text-center">Tổng Bài</th>
              <th className="px-3 py-3.5 text-center">Tổng View</th>
              <th className="px-4 py-3.5 text-center">Trạng Thái KPI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {displayedStats.map(stat => {
              const cleanName = stat.branch.name.replace('Phụ Kiện 88 - ', '');
              const isVp = stat.branch.code === 'PK88_VANPHONG';

              return (
                <tr 
                  key={stat.branch.id} 
                  className={`hover:bg-slate-800/40 transition-colors ${
                    stat.isZero ? 'bg-rose-950/10' : stat.isReached ? 'bg-emerald-950/5' : ''
                  }`}
                >
                  {/* Chi nhánh */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className={`w-4 h-4 shrink-0 ${isVp ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className={`font-bold ${isVp ? 'text-amber-300' : 'text-slate-100'}`}>
                        {cleanName}
                      </span>
                      {stat.isZero && (
                        <span className="inline-flex w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Chưa có bài đăng nào hôm nay" />
                      )}
                    </div>
                  </td>

                  {/* Facebook */}
                  <td className="px-3 py-3 text-center">
                    {stat.fbCount > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md bg-blue-500/15 text-blue-400 font-bold text-xs border border-blue-500/30">
                        {stat.fbCount}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  {/* TikTok */}
                  <td className="px-3 py-3 text-center">
                    {stat.ttCount > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md bg-slate-700/50 text-slate-200 font-bold text-xs border border-slate-600">
                        {stat.ttCount}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  {/* Zalo */}
                  <td className="px-3 py-3 text-center">
                    {stat.zlCount > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md bg-sky-500/15 text-sky-400 font-bold text-xs border border-sky-500/30">
                        {stat.zlCount}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  {/* YouTube */}
                  <td className="px-3 py-3 text-center">
                    {stat.ytCount > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md bg-red-500/15 text-red-400 font-bold text-xs border border-red-500/30">
                        {stat.ytCount}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  {/* Tổng bài */}
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-xl text-xs font-black ${
                      stat.isReached 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : stat.isZero 
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {stat.totalPosts} bài
                    </span>
                  </td>

                  {/* Tổng View */}
                  <td className="px-3 py-3 text-center">
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      {stat.totalViews > 0 ? stat.totalViews.toLocaleString('vi-VN') : '-'}
                    </span>
                  </td>

                  {/* Trạng thái KPI */}
                  <td className="px-4 py-3 text-center">
                    {stat.isReached ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30 text-xs font-bold shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đạt KPI (≥2 bài)
                      </span>
                    ) : stat.isZero ? (
                      <span className="inline-flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/30 text-xs font-bold shadow-sm animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Chưa đăng (0/2)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30 text-xs font-bold shadow-sm">
                        <Clock className="w-3.5 h-3.5" />
                        Đang lên (1/2)
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. GIAO DIỆN ĐIỆN THOẠI (MOBILE RESPONSIVE CARD-LIST) - TỐI ƯU SIÊU MƯỢT */}
      <div className="block md:hidden space-y-2.5">
        {displayedStats.map(stat => {
          const cleanName = stat.branch.name.replace('Phụ Kiện 88 - ', '');
          const isVp = stat.branch.code === 'PK88_VANPHONG';

          return (
            <div 
              key={stat.branch.id}
              className={`p-3 rounded-2xl border transition-all ${
                stat.isReached 
                  ? 'bg-slate-900/90 border-emerald-500/30 shadow-emerald-950/20 shadow-md' 
                  : stat.isZero 
                    ? 'bg-rose-950/20 border-rose-500/40 shadow-rose-950/20 shadow-md' 
                    : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              {/* Row 1: Tên Chi Nhánh & Trạng Thái KPI */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className={`w-4 h-4 shrink-0 ${isVp ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className={`text-sm font-bold truncate ${isVp ? 'text-amber-300' : 'text-slate-100'}`}>
                    {cleanName}
                  </span>
                </div>

                <div>
                  {stat.isReached ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-lg border border-emerald-500/30 text-[11px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      Đạt KPI (≥2 bài)
                    </span>
                  ) : stat.isZero ? (
                    <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/15 px-2.5 py-0.5 rounded-lg border border-rose-500/30 text-[11px] font-bold">
                      <AlertTriangle className="w-3 h-3" />
                      Chưa đăng bài
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-lg border border-amber-500/30 text-[11px] font-bold">
                      <Clock className="w-3 h-3" />
                      1 / 2 bài
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Thanh tiến độ 2 bài trực quan */}
              <div className="grid grid-cols-2 gap-1.5 my-2">
                <div className={`h-1.5 rounded-full transition-colors ${
                  stat.totalPosts >= 1 ? 'bg-emerald-400' : 'bg-slate-800'
                }`} />
                <div className={`h-1.5 rounded-full transition-colors ${
                  stat.totalPosts >= 2 ? 'bg-emerald-400' : 'bg-slate-800'
                }`} />
              </div>

              {/* Row 3: 4 Badges Nền Tảng (FB, TikTok, Zalo, YouTube) */}
              <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                    stat.fbCount > 0 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-slate-800/50 text-slate-500'
                  }`}>
                    FB: {stat.fbCount}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                    stat.ttCount > 0 ? 'bg-slate-700/60 text-slate-100 border border-slate-600' : 'bg-slate-800/50 text-slate-500'
                  }`}>
                    TT: {stat.ttCount}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                    stat.zlCount > 0 ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-slate-800/50 text-slate-500'
                  }`}>
                    ZL: {stat.zlCount}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                    stat.ytCount > 0 ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-slate-800/50 text-slate-500'
                  }`}>
                    YT: {stat.ytCount}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-bold text-cyan-300">
                    👁️ {stat.totalViews.toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>

              {/* Thông báo nhắc nhở nếu chưa đăng */}
              {stat.isZero && (
                <div className="mt-2 text-[10px] text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20 flex items-center justify-between">
                  <span>⚠️ Cần CHT đôn đốc hoàn thành</span>
                  <span className="font-bold">Hạn 21h00</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
