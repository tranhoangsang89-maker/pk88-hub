import React, { useState, useRef } from 'react';
import { Branch, Staff, ShiftType, DisputeType, AttendanceRecord } from '../types';
import { compressProofImage, CompressedImageResult } from '../lib/imageCompression';
import { formatDistance } from '../lib/geoUtils';
import { 
  X, 
  AlertTriangle, 
  Camera, 
  Upload, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Sparkles, 
  FileText, 
  Link as LinkIcon,
  ShieldAlert,
  Loader2,
  Trash2
} from 'lucide-react';

interface AttendanceDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStaff: Staff;
  currentBranch: Branch;
  currentCoords?: { lat: number; lng: number } | null;
  distanceMeters?: number;
  initialDisputeType?: DisputeType;
  existingRecord?: AttendanceRecord | null;
  onSubmitDispute: (disputeData: {
    disputeType: DisputeType;
    shiftType: ShiftType;
    workDate: string;
    checkInTime: string;
    checkOutTime?: string;
    disputeReason: string;
    proofImageUrl: string;
    lat?: number;
    lng?: number;
    distanceMeters?: number;
    existingRecordId?: string;
  }) => Promise<void> | void;
}

const getTodayDateStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getCurrentTimeStr = () => {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

export const AttendanceDisputeModal: React.FC<AttendanceDisputeModalProps> = ({
  isOpen,
  onClose,
  currentStaff,
  currentBranch,
  currentCoords,
  distanceMeters = 0,
  initialDisputeType = 'OUTSIDE_GEOFENCE',
  existingRecord = null,
  onSubmitDispute
}) => {
  if (!isOpen) return null;

  const isOffice = 
    currentBranch.code === 'PK88_VANPHONG' || 
    currentBranch.name?.toLowerCase().includes('văn phòng') ||
    ['founder', 'admin', 'hr', 'accountant', 'warehouse_accountant', 'marketing', 'media', 'sales_head'].includes(currentStaff.role);

  const [disputeType, setDisputeType] = useState<DisputeType>(
    existingRecord?.disputeType || initialDisputeType
  );
  const [shiftType, setShiftType] = useState<ShiftType>(
    existingRecord?.shiftType || (isOffice ? 'HANH_CHINH' : 'CA_SANG')
  );
  const [workDate, setWorkDate] = useState<string>(
    existingRecord ? existingRecord.checkIn.slice(0, 10) : getTodayDateStr()
  );
  const [checkInTime, setCheckInTime] = useState<string>(() => {
    if (existingRecord) {
      const d = new Date(existingRecord.checkIn);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return getCurrentTimeStr();
  });
  const [checkOutTime, setCheckOutTime] = useState<string>(() => {
    if (existingRecord?.checkOut) {
      const d = new Date(existingRecord.checkOut);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return '';
  });

  const [disputeReason, setDisputeReason] = useState<string>(
    existingRecord?.disputeReason || ''
  );
  const [proofImageUrl, setProofImageUrl] = useState<string>(
    existingRecord?.proofImageUrl || ''
  );

  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [rawUrlInput, setRawUrlInput] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressedStats, setCompressedStats] = useState<CompressedImageResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick preset reasons
  const quickReasons = [
    'GPS bị trôi lệch tọa độ, em đã có mặt tại quầy',
    'Điện thoại yếu sóng 4G/Wifi cửa hàng chập chờn',
    'Quên bấm chấm công vào ca do tiếp khách sửa máy gấp',
    'Đi giao hàng / chuyển máy bảo hành cho chi nhánh khác',
    'Làm ca tăng cường ngoài giờ theo điều động của Quản lý'
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsCompressing(true);

    try {
      const result = await compressProofImage(file, {
        maxWidth: 900,
        maxHeight: 900,
        quality: 0.75
      });
      setCompressedStats(result);
      setProofImageUrl(result.dataUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi nén ảnh. Vui lòng thử lại!');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (!rawUrlInput.trim()) {
      setErrorMsg('Vui lòng nhập đường dẫn hình ảnh!');
      return;
    }
    setProofImageUrl(rawUrlInput.trim());
    setCompressedStats(null);
    setErrorMsg(null);
  };

  const handleRemoveImage = () => {
    setProofImageUrl('');
    setCompressedStats(null);
    setRawUrlInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!disputeReason.trim()) {
      setErrorMsg('Vui lòng nhập lý do giải trình chi tiết!');
      return;
    }

    if (!proofImageUrl) {
      setErrorMsg('Vui lòng đính kèm ảnh bằng chứng tại quầy (hoặc ảnh camera) để Quản lý dễ đối soát!');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitDispute({
        disputeType,
        shiftType,
        workDate,
        checkInTime,
        checkOutTime: checkOutTime || undefined,
        disputeReason: disputeReason.trim(),
        proofImageUrl,
        lat: currentCoords?.lat,
        lng: currentCoords?.lng,
        distanceMeters: distanceMeters > 0 ? distanceMeters : undefined,
        existingRecordId: existingRecord?.id
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi gửi giải trình. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-amber-500/40 bg-slate-900/95 shadow-2xl p-5 sm:p-6 text-slate-100"
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
              <span>Phiếu Giải Trình Chấm Công</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Chờ Quản Lý Duyệt
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Xác thực ca làm việc tại <span className="text-cyan-400 font-bold">{currentBranch.name}</span>
            </p>
          </div>
        </div>

        {/* GPS Alert Box if Outside 100m */}
        {distanceMeters > 100 && (
          <div className="mb-4 p-3.5 bg-rose-950/30 border border-rose-500/40 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200">
              <span className="font-bold">Cảnh báo ngoài bán kính Geofence:</span> Bạn đang ở cách cửa hàng{' '}
              <span className="font-mono font-black text-rose-300">{formatDistance(distanceMeters)}</span>{' '}
              (vượt chuẩn an toàn <span className="font-bold">100m</span>). Vui lòng cung cấp lý do và ảnh bằng chứng tại quầy để Cửa hàng trưởng phê duyệt.
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 1. Loại giải trình */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-300 mb-1.5">
              1. Phân loại sự cố chấm công <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDisputeType('OUTSIDE_GEOFENCE')}
                className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                  disputeType === 'OUTSIDE_GEOFENCE'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs">Lệch GPS / Ngoài 100m</span>
                </div>
                <div className="text-[10px] text-slate-400 font-normal">Đã đến shop nhưng định vị trôi</div>
              </button>

              <button
                type="button"
                onClick={() => setDisputeType('FORGOT_CHECKIN')}
                className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                  disputeType === 'FORGOT_CHECKIN'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs">Quên Chấm Công Vào</span>
                </div>
                <div className="text-[10px] text-slate-400 font-normal">Chấm công bù giờ bắt đầu</div>
              </button>

              <button
                type="button"
                onClick={() => setDisputeType('FORGOT_CHECKOUT')}
                className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                  disputeType === 'FORGOT_CHECKOUT'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-md ring-1 ring-purple-500/30'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs">Quên Bấm Tan Ca</span>
                </div>
                <div className="text-[10px] text-slate-400 font-normal">Chốt giờ ra thực tế</div>
              </button>

              <button
                type="button"
                onClick={() => setDisputeType('OFFSITE_DUTY')}
                className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                  disputeType === 'OFFSITE_DUTY'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs">Công Tác / Giao Hàng</span>
                </div>
                <div className="text-[10px] text-slate-400 font-normal">Đi giao máy, hỗ trợ shop khác</div>
              </button>
            </div>
          </div>

          {/* 2. Ca làm việc & Thời gian */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Ngày làm việc
                </label>
                <input
                  type="date"
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-bold focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Ca làm việc
                </label>
                <select
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value as ShiftType)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-bold focus:outline-none focus:border-amber-400"
                >
                  <option value="CA_SANG">Ca Sáng (07:00 - 15:30)</option>
                  <option value="CA_CHIEU">Ca Chiều (13:30 - 22:00)</option>
                  <option value="HANH_CHINH">Ca Văn Phòng (07:30 - 17:30)</option>
                  <option value="TANG_CUONG">Ca Tăng Cường (Linh hoạt)</option>
                  <option value="TUY_CHINH">Ca Tùy Chỉnh</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Giờ Vào Thực Tế <span className="text-rose-400">*</span>
                </label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Giờ Ra Thực Tế (nếu có)
                </label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* 3. Lý do giải trình chi tiết */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-extrabold uppercase text-slate-300">
                2. Lý do giải trình chi tiết <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-slate-500">Minh bạch & rõ ràng</span>
            </div>

            {/* Quick Reason Chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickReasons.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDisputeReason(chip)}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  + {chip}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Nhập lý do cụ thể (VD: Em đến shop lúc 07:00 nhưng app báo cách 1.5km do thời tiết mưa bão làm trôi GPS, camera quầy có ghi nhận hình ảnh...)"
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400 font-medium leading-relaxed"
              required
            />
          </div>

          {/* 4. Đính kèm ảnh bằng chứng tại quầy */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-extrabold uppercase text-slate-300 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>3. Ảnh bằng chứng tại quầy / Camera <span className="text-rose-400">*</span></span>
              </label>

              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setImageInputMode('upload')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    imageInputMode === 'upload' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
                  }`}
                >
                  Tải ảnh / Chụp
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    imageInputMode === 'url' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                  }`}
                >
                  Dán link URL
                </button>
              </div>
            </div>

            {imageInputMode === 'upload' ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!proofImageUrl ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-slate-950 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                  >
                    {isCompressing ? (
                      <>
                        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                        <span className="text-xs font-bold text-slate-300">Đang tối ưu & nén ảnh Canvas (~20KB)...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-bold text-slate-200">
                            Bấm để chụp ảnh hoặc tải ảnh tại quầy
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Tự động nén siêu nhẹ WebP (~20KB) - Bảo vệ bộ nhớ Supabase
                          </div>
                        </div>
                      </>
                    )}
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Dán link ảnh (https://...)"
                  value={rawUrlInput}
                  onChange={(e) => setRawUrlInput(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-3.5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Áp dụng
                </button>
              </div>
            )}

            {/* Image Preview & Compression Stats */}
            {proofImageUrl && (
              <div className="mt-2.5 p-3 bg-slate-950 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 shrink-0 bg-slate-900">
                    <img 
                      src={proofImageUrl} 
                      alt="Bằng chứng tại quầy" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Đã đính kèm ảnh bằng chứng</span>
                    </div>
                    {compressedStats && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Gốc: {compressedStats.originalSizeKB}KB ➔ Nén: <span className="text-emerald-400 font-bold">{compressedStats.compressedSizeKB}KB (-{compressedStats.savedPercent}%)</span>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-500">Quản lý sẽ xem ảnh này khi duyệt công</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-500/20 transition-colors cursor-pointer"
                  title="Xóa ảnh này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl font-black bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 shadow-lg shadow-amber-950/40 ring-1 ring-amber-400/40 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Đang gửi giải trình...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>GỬI GIẢI TRÌNH CHO QUẢN LÝ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
