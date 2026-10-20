import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Branch, Staff, CleanlinessShiftType } from '../types';
import { 
  X, 
  Camera, 
  Upload, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Building2, 
  FileText,
  Zap,
  Info
} from 'lucide-react';
import { compressCleanlinessImage, submitCleanlinessReport } from '../lib/cleanlinessService';

interface CleanlinessReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Staff;
  currentBranch: Branch;
  initialShiftType?: CleanlinessShiftType;
  onSubmitted?: () => void;
}

export const CleanlinessReportModal: React.FC<CleanlinessReportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentBranch,
  initialShiftType,
  onSubmitted
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [shiftType, setShiftType] = useState<CleanlinessShiftType>(() => {
    if (initialShiftType) return initialShiftType;
    const hour = new Date().getHours();
    if (hour < 12) return 'MORNING';
    if (hour < 18) return 'AFTERNOON';
    return 'CLOSING';
  });

  useEffect(() => {
    if (initialShiftType) {
      setShiftType(initialShiftType);
    }
  }, [initialShiftType]);

  const [images, setImages] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Khóa cuộn trang nền khi mở modal
  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const quickNotes = [
    '✨ Đã lau kính tủ phụ kiện & quầy thu ngân',
    '🧹 Đã quét dọn và lau sàn sạch sẽ',
    '🗑️ Đã đổ rác & dọn bàn kỹ thuật gọn gàng',
    '📱 Đã sắp xếp lại ốp lưng & cường lực ngay ngắn'
  ];

  const handleAddQuickNote = (noteText: string) => {
    if (!notes) {
      setNotes(noteText);
    } else if (!notes.includes(noteText)) {
      setNotes(`${notes}. ${noteText}`);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 6) {
      setErrorMessage('Tối đa mỗi lượt báo cáo được chọn 6 ảnh.');
      return;
    }

    setErrorMessage(null);
    setIsCompressing(true);

    try {
      const compressedList: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const compressed = await compressCleanlinessImage(file);
          compressedList.push(compressed);
        }
      }
      setImages(prev => [...prev, ...compressedList]);
    } catch (err) {
      console.error('Lỗi nén ảnh:', err);
      setErrorMessage('Không thể xử lý một số ảnh, vui lòng thử lại.');
    } finally {
      setIsCompressing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      setErrorMessage('Vui lòng chụp hoặc tải lên ít nhất 1 ảnh vệ sinh cửa hàng.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());

      await submitCleanlinessReport({
        branchId: currentBranch.id,
        branchName: currentBranch.name,
        staffId: currentUser.id,
        staffName: currentUser.fullName,
        staffPhone: currentUser.phone,
        staffRole: currentUser.role,
        shiftType,
        reportDate: todayStr,
        images,
        notes: notes.trim(),
        status: 'SUBMITTED'
      });

      setSuccessMessage('Gửi báo cáo vệ sinh thành công! Founder và CHT đã có thể xem.');
      setTimeout(() => {
        setSuccessMessage(null);
        setImages([]);
        setNotes('');
        if (onSubmitted) onSubmitted();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Lỗi nộp báo cáo:', err);
      setErrorMessage('Đã xảy ra sự cố khi lưu báo cáo, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in select-none">
      <div 
        className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto border-t-2 border-t-emerald-400"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <span>BÁO CÁO VỆ SINH CỬA HÀNG</span>
              </h3>
              <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3 h-3 text-cyan-400" />
                <span className="font-semibold text-slate-200">{currentBranch.name.replace('Phụ Kiện 88 - ', '')}</span>
                <span>•</span>
                <span className="text-emerald-300">{currentUser.fullName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Notifications */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in font-bold">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-fade-in font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Chọn Ca Làm Việc / Thời điểm nộp */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>1. Thời điểm báo cáo:</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setShiftType('MORNING')}
                className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                  shiftType === 'MORNING'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                🌅 Ca Sáng (Mở cửa)
              </button>
              <button
                type="button"
                onClick={() => setShiftType('AFTERNOON')}
                className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                  shiftType === 'AFTERNOON'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                ☀️ Ca Chiều
              </button>
              <button
                type="button"
                onClick={() => setShiftType('CLOSING')}
                className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                  shiftType === 'CLOSING'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/60 shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                🌙 Ca Tối (Giao ca)
              </button>
            </div>
          </div>

          {/* 2. Chụp & Tải Ảnh */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Hình ảnh vệ sinh thực tế ({images.length}/6 ảnh):</span>
              </label>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <Zap className="w-3 h-3" />
                <span>Tự động nén WebP ~50KB</span>
              </span>
            </div>

            {/* Hidden inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Action Buttons to capture/upload */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isCompressing}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Camera className="w-4 h-4 fill-slate-950" />
                <span>Chụp Ảnh Ngay</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Chọn Từ Thư Viện</span>
              </button>
            </div>

            {/* Compressing Indicator */}
            {isCompressing && (
              <div className="p-2.5 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-center gap-2 animate-pulse">
                <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Đang nén tối ưu hóa dung lượng ảnh...</span>
              </div>
            )}

            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video shadow-md">
                    <img 
                      src={img} 
                      alt={`Ảnh vệ sinh ${idx + 1}`}
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white transition-all cursor-pointer shadow-lg"
                        title="Xóa ảnh này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-slate-950/80 text-emerald-400 border border-emerald-500/40">
                      WebP ~50KB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Ghi Chú & Quick Tags */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>3. Ghi chú tình trạng vệ sinh:</span>
            </label>

            {/* Quick tags */}
            <div className="flex flex-wrap gap-1.5">
              {quickNotes.map((qn, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddQuickNote(qn)}
                  className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10.5px] text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all cursor-pointer text-left"
                >
                  {qn}
                </button>
              ))}
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập thêm chi tiết về tình trạng vệ sinh quầy kệ, sàn nhà, khu vực kỹ thuật..."
              rows={3}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Informational Policy Note */}
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-400 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Ảnh chụp được tối ưu hóa dung lượng tự động và lưu trữ trên hệ thống trong vòng <strong>14 ngày</strong> để Ban Điều Hành đối soát chất lượng trước khi tự động giải phóng bộ nhớ.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting || images.length === 0}
              className="w-full py-3 px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Đang gửi báo cáo lên hệ thống...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 fill-slate-950" />
                  <span>GỬI BÁO CÁO VỆ SINH NGAY</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
