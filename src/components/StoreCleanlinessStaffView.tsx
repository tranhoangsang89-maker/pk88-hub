import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Branch, Staff, CleanlinessReport, CleanlinessShiftType } from '../types';
import { supabase } from '../lib/supabase';
import { 
  Sparkles, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Building2, 
  Calendar, 
  Eye, 
  Maximize2, 
  X, 
  FileText, 
  ShieldCheck, 
  ArrowLeft,
  RotateCw
} from 'lucide-react';
import { fetchCleanlinessReports, fetchMonthlyCleanlinessStats } from '../lib/cleanlinessService';
import { CleanlinessReportModal } from './CleanlinessReportModal';

interface StoreCleanlinessStaffViewProps {
  currentBranch: Branch;
  currentStaff: Staff;
  onNavigateToAttendance?: () => void;
}

export const StoreCleanlinessStaffView: React.FC<StoreCleanlinessStaffViewProps> = ({
  currentBranch,
  currentStaff,
  onNavigateToAttendance
}) => {
  const [reports, setReports] = useState<CleanlinessReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedShift, setSelectedShift] = useState<CleanlinessShiftType | undefined>(undefined);
  const [myMonthlyStats, setMyMonthlyStats] = useState<{ approvedCount: number; totalSubmitted: number }>({ approvedCount: 0, totalSubmitted: 0 });

  // Lightbox preview ảnh phóng to Full HD
  const [previewPhoto, setPreviewPhoto] = useState<{
    url: string;
    shiftName: string;
    staffName: string;
    time: string;
    status: string;
    notes?: string;
    reviewedBy?: string;
    reviewNote?: string;
  } | null>(null);

  // Helper so khớp chi nhánh
  const isReportForBranch = (report: CleanlinessReport, branch: Branch): boolean => {
    if (report.branchId && branch.id && report.branchId === branch.id) return true;
    if (report.branchName && branch.name) {
      const cleanR = report.branchName.toLowerCase().replace(/phụ kiện 88\s*-\s*/i, '').trim();
      const cleanB = branch.name.toLowerCase().replace(/phụ kiện 88\s*-\s*/i, '').trim();
      if (cleanR === cleanB) return true;
      if (cleanR && cleanB && (cleanR.includes(cleanB) || cleanB.includes(cleanR))) return true;
    }
    return false;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
      const allToday = await fetchCleanlinessReports(todayStr);
      const branchReports = allToday.filter(r => isReportForBranch(r, currentBranch));
      setReports(branchReports);

      const stats = await fetchMonthlyCleanlinessStats();
      const sStats = (currentStaff.id && stats.byStaffId[currentStaff.id]) ||
                     (currentStaff.fullName && stats.byStaffName[currentStaff.fullName.trim().toLowerCase()]);
      if (sStats) {
        setMyMonthlyStats({
          approvedCount: sStats.approvedCount,
          totalSubmitted: sStats.totalSubmitted
        });
      }
    } catch (err) {
      console.warn('Load cleanliness staff view data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener('pk88_cleanliness_updated', handleUpdate);

    // Kênh realtime Supabase
    const channel = supabase
      .channel(`store_cleanliness_staff_${currentBranch.id || 'all'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cleanliness_reports' },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('pk88_cleanliness_updated', handleUpdate);
      supabase.removeChannel(channel);
    };
  }, [currentBranch.id, currentStaff.id, currentStaff.fullName]);

  const handleOpenModal = (shift?: CleanlinessShiftType) => {
    setSelectedShift(shift);
    setShowModal(true);
  };

  const shiftConfigs: Array<{ type: CleanlinessShiftType; name: string; timeRange: string; icon: string }> = [
    { type: 'MORNING', name: 'Ca Sáng (Mở Cửa)', timeRange: '07:30 - 12:00', icon: '🌅' },
    { type: 'AFTERNOON', name: 'Ca Chiều', timeRange: '12:00 - 17:30', icon: '☀️' },
    { type: 'CLOSING', name: 'Ca Tối (Giao Ca)', timeRange: '17:30 - 22:00', icon: '🌙' }
  ];

  const submittedCount = reports.length;
  const progressPercent = Math.round((submittedCount / 3) * 100);

  const formattedDate = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="space-y-4 max-w-3xl mx-auto animate-fade-in pb-10">
      {/* 1. Header Card */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 border border-emerald-500/30 bg-slate-900/90 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            {onNavigateToAttendance && (
              <button
                type="button"
                onClick={onNavigateToAttendance}
                className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title="Quay lại Chấm Công GPS"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-slate-100 uppercase tracking-wide">
                  BÁO CÁO VỆ SINH CỬA HÀNG
                </h3>
                <span className="text-[10.5px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  {submittedCount}/3 Ca Hôm Nay
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold text-slate-200">{currentBranch.name}</span>
                <span>•</span>
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="capitalize">{formattedDate}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={() => loadData()}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="Làm mới dữ liệu"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>+ Gửi Báo Cáo Ca</span>
            </button>
          </div>
        </div>

        {/* Thanh tiến độ nộp ảnh của shop hôm nay */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <span>Tiến độ nộp ảnh sạch sẽ 3 ca hôm nay:</span>
              <strong className="text-emerald-400 font-mono">{submittedCount} / 3 ca ({progressPercent}%)</strong>
            </span>
            {myMonthlyStats.approvedCount > 0 && (
              <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                Tháng này: <strong>{myMonthlyStats.approvedCount}</strong> ca Đạt Chuẩn
              </span>
            )}
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Danh sách 3 Ca Làm Việc (Ca Sáng, Ca Chiều, Ca Tối) */}
      <div className="space-y-3">
        {shiftConfigs.map((s) => {
          const rep = reports.find(r => r.shiftType === s.type);

          return (
            <div 
              key={s.type}
              className={`glass-card rounded-2xl p-4 sm:p-5 border transition-all ${
                rep
                  ? rep.status === 'APPROVED'
                    ? 'border-emerald-500/40 bg-slate-900/90 shadow-lg shadow-emerald-950/20'
                    : (rep.status === 'NEEDS_REDO' || rep.status === 'REDO_REQUESTED')
                      ? 'border-rose-500/60 bg-rose-950/20 shadow-xl shadow-rose-950/30'
                      : 'border-amber-500/40 bg-slate-900/90 shadow-lg shadow-amber-950/20'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              {/* Header ca */}
              <div className="flex items-start sm:items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{s.icon}</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-100 flex items-center gap-2">
                      <span>{s.name}</span>
                      <span className="text-[10.5px] font-mono text-slate-400 font-normal">({s.timeRange})</span>
                    </h4>
                    {rep ? (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Đã gửi lúc <strong className="text-slate-200">{new Date(rep.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</strong> bởi <span className="text-emerald-300 font-bold">{rep.staffName}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Chưa có báo cáo hình ảnh cho ca trực này
                      </p>
                    )}
                  </div>
                </div>

                {/* Badge trạng thái */}
                <div>
                  {rep ? (
                    rep.status === 'APPROVED' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ĐẠT CHUẨN</span>
                      </span>
                    ) : (rep.status === 'NEEDS_REDO' || rep.status === 'REDO_REQUESTED') ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/25 text-rose-300 border border-rose-500/50 flex items-center gap-1.5 shadow-sm animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>YÊU CẦU LÀM LẠI</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
                        <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                        <span>ĐÃ GỬI • CHỜ DUYỆT</span>
                      </span>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenModal(s.type)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      <span>+ Gửi Ảnh Ca</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Chi tiết ca đã nộp */}
              {rep && (
                <div className="space-y-3 pt-3">
                  {/* Phê duyệt từ cấp trên */}
                  {rep.status === 'APPROVED' && rep.reviewedBy && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span>Đã được phê duyệt bởi <strong className="text-white">{rep.reviewedBy}</strong>.</span>
                        {rep.reviewNote && <p className="italic text-emerald-300 mt-0.5">"{rep.reviewNote}"</p>}
                      </div>
                    </div>
                  )}

                  {/* Cảnh báo yêu cầu làm lại */}
                  {(rep.status === 'NEEDS_REDO' || rep.status === 'REDO_REQUESTED') && (
                    <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/60 text-xs text-rose-200 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-rose-300">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Ý kiến phê bình từ {rep.reviewedBy || 'Cấp Trên'}:</span>
                      </div>
                      <p className="italic text-rose-100 bg-slate-950/60 p-2.5 rounded-lg border border-rose-900/60">
                        "{rep.reviewNote || 'Ảnh chụp chưa đạt chuẩn vệ sinh hoặc góc chụp chưa rõ, vui lòng dọn dẹp lại quầy kệ và chụp bổ sung.'}"
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenModal(s.type)}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 cursor-pointer active:scale-95 transition-all"
                      >
                        <Camera className="w-4 h-4" />
                        <span>CHỤP LẠI & NỘP BỔ SUNG CHO {s.name.toUpperCase()}</span>
                      </button>
                    </div>
                  )}

                  {/* Ghi chú khi nhân viên nộp */}
                  {rep.notes && (
                    <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-start gap-2">
                      <FileText className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="italic">{rep.notes}</span>
                    </div>
                  )}

                  {/* Bộ sưu tập ảnh thực tế đã gửi */}
                  {rep.images && rep.images.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-bold text-slate-300">Ảnh thực tế đã nộp ({rep.images.length} ảnh):</span>
                        <span className="text-cyan-400 flex items-center gap-1 text-[11px]">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chạm vào ảnh để phóng to toàn màn hình</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {rep.images.map((imgUrl, imgIdx) => (
                          <div
                            key={imgIdx}
                            onClick={() => setPreviewPhoto({
                              url: imgUrl,
                              shiftName: s.name,
                              staffName: rep.staffName,
                              time: new Date(rep.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                              status: rep.status,
                              notes: rep.notes,
                              reviewedBy: rep.reviewedBy,
                              reviewNote: rep.reviewNote
                            })}
                            className="relative group aspect-video rounded-xl overflow-hidden border border-slate-700 hover:border-emerald-500/80 bg-slate-950 cursor-pointer shadow-md transition-all hover:scale-[1.02] active:scale-95"
                          >
                            <img 
                              src={imgUrl} 
                              alt={`Ảnh vệ sinh ${s.name}`} 
                              className="w-full h-full object-cover" 
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2 text-white">
                              <span className="text-[11px] font-bold">Ảnh #{imgIdx + 1}</span>
                              <Maximize2 className="w-4 h-4 text-emerald-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal nộp báo cáo vệ sinh ca */}
      <CleanlinessReportModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentUser={currentStaff}
        currentBranch={currentBranch}
        initialShiftType={selectedShift}
        onSubmitted={() => {
          loadData();
        }}
      />

      {/* Lightbox phóng to xem ảnh sắc nét Full HD */}
      {previewPhoto && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[10000] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-fade-in select-none"
          onClick={() => setPreviewPhoto(null)}
        >
          {/* Top Bar */}
          <div 
            className="flex items-center justify-between max-w-4xl w-full mx-auto pb-3 border-b border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                  <span>{previewPhoto.shiftName}</span>
                  <span>•</span>
                  <span className="text-emerald-400">{currentBranch.name.replace('Phụ Kiện 88 - ', '')}</span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  Chụp bởi: <strong className="text-slate-200">{previewPhoto.staffName}</strong> lúc {previewPhoto.time}
                </p>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-all active:scale-95"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Ảnh trung tâm (Full resolution) */}
          <div 
            className="flex-1 flex items-center justify-center my-auto p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={previewPhoto.url} 
              alt="Ảnh báo cáo vệ sinh thực tế phóng to" 
              className="max-h-[70vh] sm:max-h-[75vh] max-w-full rounded-2xl shadow-2xl object-contain border border-slate-700/80 bg-slate-900/50" 
            />
          </div>

          {/* Footer thông tin phê duyệt & ghi chú */}
          <div 
            className="max-w-4xl w-full mx-auto p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 space-y-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Trạng thái duyệt:</span>
                {previewPhoto.status === 'APPROVED' ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ĐẠT CHUẨN {previewPhoto.reviewedBy ? `(Duyệt bởi ${previewPhoto.reviewedBy})` : ''}</span>
                  </span>
                ) : (previewPhoto.status === 'NEEDS_REDO' || previewPhoto.status === 'REDO_REQUESTED') ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500/25 text-rose-300 border border-rose-500/50 flex items-center gap-1 shadow-sm animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>YÊU CẦU LÀM LẠI</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>ĐÃ GỬI LÊN HỆ THỐNG • CHỜ CẤP TRÊN KIỂM TRA</span>
                  </span>
                )}
              </div>

              <button 
                type="button"
                onClick={() => setPreviewPhoto(null)} 
                className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline font-bold cursor-pointer"
              >
                ✕ Đóng cửa sổ xem ảnh
              </button>
            </div>

            {previewPhoto.reviewNote && (
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-amber-200">
                <strong className="text-amber-400">Ý kiến từ {previewPhoto.reviewedBy || 'Cấp Trên'}:</strong> "{previewPhoto.reviewNote}"
              </div>
            )}

            {previewPhoto.notes && (
              <div className="text-[11px] text-slate-400 flex items-start gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                <span><strong>Ghi chú của nhân viên:</strong> {previewPhoto.notes}</span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
