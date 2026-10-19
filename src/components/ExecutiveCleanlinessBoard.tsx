import React, { useState, useEffect, useMemo } from 'react';
import { Branch, Staff, CleanlinessReport, CleanlinessStatus } from '../types';
import { 
  Sparkles, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Trash2, 
  Eye, 
  X, 
  Check, 
  Clock, 
  ThumbsUp, 
  AlertCircle,
  Filter,
  ShieldCheck,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { 
  fetchCleanlinessReports, 
  reviewCleanlinessReport, 
  purgeOldCleanlinessReports 
} from '../lib/cleanlinessService';
import { sortBranchesByPriority, getBranchOrderIndex } from '../lib/mockData';
import { supabase } from '../lib/supabase';

// Helper so khớp báo cáo với chi nhánh (theo branchId hoặc branchName)
const isReportForBranch = (report: CleanlinessReport, branch: Branch): boolean => {
  if (report.branchId && branch.id && report.branchId === branch.id) {
    return true;
  }
  if (report.branchName && branch.name) {
    const cleanR = report.branchName.toLowerCase().replace(/phụ kiện 88\s*-\s*/i, '').trim();
    const cleanB = branch.name.toLowerCase().replace(/phụ kiện 88\s*-\s*/i, '').trim();
    if (cleanR === cleanB) return true;
    if (cleanR && cleanB && (cleanR.includes(cleanB) || cleanB.includes(cleanR))) return true;
  }
  return false;
};

interface ExecutiveCleanlinessBoardProps {
  branches: Branch[];
  staffList: Staff[];
  currentUser?: Staff | null;
}

export const ExecutiveCleanlinessBoard: React.FC<ExecutiveCleanlinessBoardProps> = ({
  branches,
  staffList,
  currentUser
}) => {
  const [reports, setReports] = useState<CleanlinessReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');

  // Ngày được chọn để xem báo cáo (mặc định là Hôm nay)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
  });

  // State Lightbox phóng to ảnh
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    branchName: string;
    staffName: string;
    shiftName: string;
    time: string;
    notes?: string;
  } | null>(null);

  // Thông báo dọn dẹp ảnh cũ
  const [purgeNotice, setPurgeNotice] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState<boolean>(false);

  // Tải danh sách báo cáo
  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await fetchCleanlinessReports(selectedDate);
      setReports(data);
    } catch (err) {
      console.error('Load cleanliness reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();

    const handleUpdate = () => {
      loadReports();
    };

    window.addEventListener('pk88_cleanliness_updated', handleUpdate);

    // Lắng nghe realtime từ Supabase khi có bất kỳ nhân viên nào nộp báo cáo ảnh mới
    const channel = supabase
      .channel('cleanliness_reports_realtime_board')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cleanliness_reports' },
        () => {
          loadReports();
        }
      )
      .subscribe();

    // Tự động kiểm tra làm mới mỗi 12 giây đảm bảo không sót dữ liệu
    const interval = setInterval(() => {
      loadReports();
    }, 12000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      window.removeEventListener('pk88_cleanliness_updated', handleUpdate);
    };
  }, [selectedDate]);

  // Chi nhánh active sắp xếp theo thứ tự ưu tiên chuẩn
  const activeBranches = useMemo(() => {
    return sortBranchesByPriority(branches.filter(b => b.isActive));
  }, [branches]);

  // Thống kê tiến độ nộp báo cáo hôm nay của các chi nhánh
  const stats = useMemo(() => {
    const submittedCount = activeBranches.filter(b => reports.some(r => isReportForBranch(r, b))).length;
    const missingBranches = activeBranches.filter(b => !reports.some(r => isReportForBranch(r, b)));

    return {
      totalBranches: activeBranches.length,
      submittedCount,
      missingBranches,
      percentage: activeBranches.length > 0 ? Math.round((submittedCount / activeBranches.length) * 100) : 0
    };
  }, [activeBranches, reports]);

  // Gom nhóm báo cáo theo chi nhánh chuẩn và thu thập các báo cáo chưa gắn chi nhánh
  const { groupedReports, unassignedReports } = useMemo(() => {
    const list = [...reports].sort((a, b) => {
      const bA = getBranchOrderIndex(a.branchName);
      const bB = getBranchOrderIndex(b.branchName);
      if (bA !== bB) return bA - bB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const groups: Array<{
      branch: Branch;
      reports: CleanlinessReport[];
    }> = [];

    const matchedReportIds = new Set<string>();

    activeBranches.forEach(branch => {
      if (selectedBranchId !== 'ALL' && branch.id !== selectedBranchId) return;
      const bReports = list.filter(r => isReportForBranch(r, branch));
      bReports.forEach(r => matchedReportIds.add(r.id));
      groups.push({
        branch,
        reports: bReports
      });
    });

    const unassigned = (selectedBranchId === 'ALL')
      ? list.filter(r => !matchedReportIds.has(r.id))
      : [];

    return { groupedReports: groups, unassignedReports: unassigned };
  }, [reports, activeBranches, selectedBranchId]);

  // Xử lý duyệt / nhắc nhở báo cáo
  const handleReview = async (reportId: string, status: CleanlinessStatus) => {
    const reviewerName = currentUser?.fullName || 'Founder / Admin';
    await reviewCleanlinessReport(reportId, status, reviewerName);
    loadReports();
  };

  // Xử lý dọn dẹp ảnh cũ (>14 ngày)
  const handlePurge = async () => {
    setIsPurging(true);
    try {
      const purged = await purgeOldCleanlinessReports(14);
      setPurgeNotice(`Đã dọn dẹp thành công ${purged} ảnh báo cáo cũ (>14 ngày).`);
      setTimeout(() => setPurgeNotice(null), 4000);
      loadReports();
    } catch {
      setPurgeNotice('Lỗi dọn dẹp ảnh cũ.');
    } finally {
      setIsPurging(false);
    }
  };

  const getShiftBadge = (shiftType: string) => {
    switch (shiftType) {
      case 'MORNING':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">🌅 Ca Sáng (Mở cửa)</span>;
      case 'AFTERNOON':
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">☀️ Ca Chiều</span>;
      case 'CLOSING':
      default:
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">🌙 Ca Tối (Giao ca)</span>;
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 border border-emerald-500/30 bg-slate-900/90 shadow-2xl space-y-4">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-100 flex items-center gap-2 flex-wrap">
              <span>Bảng Giám Sát Vệ Sinh Chuỗi Cửa Hàng</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Live Audit</span>
              </span>
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap mt-0.5">
              <span>Hình ảnh báo cáo thực tế từ từng chi nhánh</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-mono text-[11px]">Lưu trữ luân chuyển 14 ngày</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePurge}
            disabled={isPurging}
            className="px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 text-xs font-semibold border border-slate-800 hover:border-rose-500/40 transition-all cursor-pointer flex items-center gap-1.5"
            title="Tự động dọn dẹp ảnh cũ >14 ngày để giải phóng dung lượng"
          >
            <Trash2 className="w-3 h-3 text-rose-400" />
            <span>Dọn ảnh cũ (&gt;14 ngày)</span>
          </button>

          <button
            type="button"
            onClick={loadReports}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="Đồng bộ ngay ảnh mới"
          >
            <RefreshCw className={`w-3 h-3 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Đồng bộ</span>
          </button>
        </div>
      </div>

      {/* Notice Message */}
      {purgeNotice && (
        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{purgeNotice}</span>
        </div>
      )}

      {/* 2. Thống Kê Tiến Độ Vệ Sinh Chuỗi Hôm Nay */}
      <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800/80 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-200">Tiến độ nộp báo cáo vệ sinh hôm nay:</span>
            <span className="px-2 py-0.5 rounded-full font-mono font-black text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {stats.submittedCount} / {stats.totalBranches} Chi Nhánh ({stats.percentage}%)
            </span>
          </div>

          {stats.missingBranches.length > 0 ? (
            <div className="text-[11px] text-amber-300 flex items-center gap-1.5 font-medium flex-wrap">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-bounce" />
              <span>Chưa nộp hôm nay:</span>
              <span className="font-bold text-amber-200">
                {stats.missingBranches.map(b => b.name.replace('Phụ Kiện 88 - ', '')).join(', ')}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% Cửa hàng đã hoàn thành báo cáo vệ sinh!</span>
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
      </div>

      {/* 3. Filter Controls: Date Selector + Branch Pills */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Quick Date Pills */}
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <span className="text-slate-400 font-bold flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Ngày:
            </span>

            {(() => {
              const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
              const yest = new Date();
              yest.setDate(yest.getDate() - 1);
              const yestStr = yest.toISOString().slice(0, 10);

              return (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(today)}
                    className={`px-2.5 py-1 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      selectedDate === today
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950/80 text-slate-400 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    ⚡ Hôm Nay
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedDate(yestStr)}
                    className={`px-2.5 py-1 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      selectedDate === yestStr
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950/80 text-slate-400 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    Hôm Qua
                  </button>

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </>
              );
            })()}
          </div>
        </div>

        {/* Branch Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setSelectedBranchId('ALL')}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
              selectedBranchId === 'ALL'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            🏢 Toàn Chuỗi
          </button>

          {activeBranches.map(branch => {
            const shortName = branch.name.replace('Phụ Kiện 88 - ', '');
            const isSelected = selectedBranchId === branch.id;
            const bReportsCount = reports.filter(r => isReportForBranch(r, branch)).length;

            return (
              <button
                key={branch.id}
                type="button"
                onClick={() => setSelectedBranchId(branch.id)}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>📍 {shortName}</span>
                {bReportsCount > 0 && (
                  <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-emerald-500/20 text-emerald-400 font-bold'
                  }`}>
                    {bReportsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Thư Viện Ảnh Báo Cáo Phân Nhóm Theo Chi Nhánh Chuẩn */}
      <div className="space-y-4 pt-2">
        {groupedReports.map(({ branch, reports: bReports }) => {
          const branchShortName = branch.name.replace('Phụ Kiện 88 - ', '');

          return (
            <div key={branch.id} className="space-y-2.5">
              {/* Branch Title Bar */}
              <div className="flex items-center justify-between pt-2 pb-1.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                    <span>📍 {branchShortName}</span>
                  </h4>
                </div>
                <span className={`text-[10px] sm:text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  bReports.length > 0 
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                }`}>
                  {bReports.length > 0 ? `${bReports.length} báo cáo hôm nay` : '⚠️ Chưa có báo cáo'}
                </span>
              </div>

              {/* Reports Grid */}
              {bReports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {bReports.map((report) => {
                    const timeStr = new Date(report.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div 
                        key={report.id} 
                        className="rounded-2xl p-3 bg-slate-950/70 border border-slate-800/90 hover:border-emerald-500/50 transition-all space-y-2.5 shadow-md flex flex-col justify-between"
                      >
                        {/* Report Top Meta */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              {getShiftBadge(report.shiftType)}
                              <span className="text-[11px] font-mono text-slate-400">
                                {timeStr}
                              </span>
                            </div>
                            <div className="text-xs font-extrabold text-slate-200 mt-1">
                              {report.staffName}
                              {report.staffRole && (
                                <span className="text-[10px] text-slate-400 font-normal ml-1">
                                  ({report.staffRole})
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {report.status === 'APPROVED' ? (
                              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Đạt chuẩn
                              </span>
                            ) : report.status === 'NEEDS_REDO' ? (
                              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Làm lại
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                ⏳ Chờ duyệt
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Image Gallery */}
                        {report.images && report.images.length > 0 && (
                          <div className={`grid gap-1.5 ${report.images.length === 1 ? 'grid-cols-1' : report.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                            {report.images.map((img, imgIdx) => (
                              <div
                                key={imgIdx}
                                onClick={() => setPreviewImage({
                                  url: img,
                                  branchName: report.branchName,
                                  staffName: report.staffName,
                                  shiftName: report.shiftType === 'MORNING' ? 'Ca Sáng' : report.shiftType === 'AFTERNOON' ? 'Ca Chiều' : 'Ca Tối',
                                  time: timeStr,
                                  notes: report.notes
                                })}
                                className="relative rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-800 cursor-pointer group hover:border-emerald-400 transition-all shadow-inner"
                                title="Nhấp để phóng to ảnh xem chi tiết"
                              >
                                <img
                                  src={img}
                                  alt={`Vệ sinh ${imgIdx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Maximize2 className="w-4 h-4 text-white drop-shadow" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Notes */}
                        {report.notes && (
                          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/60 text-[11px] text-slate-300 italic">
                            "{report.notes}"
                          </div>
                        )}

                        {/* Founder Quick Actions: Duyệt / Nhắc nhở */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs">
                          <button
                            type="button"
                            onClick={() => handleReview(report.id, 'APPROVED')}
                            className="flex-1 py-1 px-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40 transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Đạt Chuẩn</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReview(report.id, 'NEEDS_REDO')}
                            className="flex-1 py-1 px-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold border border-rose-500/40 transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Làm Lại</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  Chưa có báo cáo vệ sinh nào cho chi nhánh này trong ngày {selectedDate}.
                </div>
              )}
            </div>
          );
        })}

        {/* Unassigned Reports Section (Báo cáo khác / Chưa phân nhóm) */}
        {unassignedReports.length > 0 && (
          <div className="space-y-2.5 pt-4 border-t border-amber-500/30">
            <div className="flex items-center justify-between pt-2 pb-1.5 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <h4 className="text-xs sm:text-sm font-extrabold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                  <span>📌 Báo Cáo Khác / Chưa Phân Nhóm ({unassignedReports.length})</span>
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {unassignedReports.map((report) => {
                const timeStr = new Date(report.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div 
                    key={report.id} 
                    className="rounded-2xl p-3 bg-slate-950/70 border border-amber-500/30 hover:border-amber-400 transition-all space-y-2.5 shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {getShiftBadge(report.shiftType)}
                          <span className="text-[11px] font-mono text-slate-400">{timeStr}</span>
                        </div>
                        <span className="text-[11px] font-bold text-amber-400">{report.branchName || 'Chưa rõ shop'}</span>
                      </div>
                      <div className="text-xs font-extrabold text-slate-200 mt-1">
                        {report.staffName}
                      </div>
                    </div>

                    {report.images && report.images.length > 0 && (
                      <div className={`grid gap-1.5 ${report.images.length === 1 ? 'grid-cols-1' : report.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                        {report.images.map((img, imgIdx) => (
                          <div 
                            key={imgIdx}
                            onClick={() => setPreviewImage({
                              url: img,
                              branchName: report.branchName || 'Chi nhánh',
                              staffName: report.staffName,
                              shiftName: report.shiftType === 'MORNING' ? 'Ca Sáng' : report.shiftType === 'AFTERNOON' ? 'Ca Chiều' : 'Ca Tối',
                              time: timeStr,
                              notes: report.notes
                            })}
                            className="relative group rounded-xl overflow-hidden bg-slate-900 border border-slate-800 aspect-video cursor-pointer hover:border-amber-400 transition-all"
                          >
                            <img 
                              src={img} 
                              alt={`Báo cáo ${imgIdx + 1}`} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Maximize2 className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {report.notes && (
                      <p className="text-[11px] text-slate-300 italic line-clamp-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                        "{report.notes}"
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80 text-xs">
                      <button
                        type="button"
                        onClick={() => handleReview(report.id, 'APPROVED')}
                        className="flex-1 py-1 px-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40 transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Đạt Chuẩn</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReview(report.id, 'NEEDS_REDO')}
                        className="flex-1 py-1 px-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold border border-rose-500/40 transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Làm Lại</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. Lightbox Modal Phóng To Ảnh Vệ Sinh Sắc Nét */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in select-none"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-slate-900 border border-cyan-500/40 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950">
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                  <span>📍 {previewImage.branchName}</span>
                  <span>•</span>
                  <span className="text-emerald-400">{previewImage.shiftName} ({previewImage.time})</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Báo cáo bởi: <strong className="text-slate-200">{previewImage.staffName}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lightbox Image Viewport */}
            <div className="max-h-[70vh] bg-slate-950 flex items-center justify-center p-2 overflow-hidden">
              <img 
                src={previewImage.url} 
                alt="Chi tiết vệ sinh"
                className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl" 
              />
            </div>

            {/* Lightbox Footer Notes */}
            {previewImage.notes && (
              <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 text-xs text-slate-300 italic">
                "{previewImage.notes}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
