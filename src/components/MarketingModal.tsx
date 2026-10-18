import React, { useState, useEffect } from 'react';
import { X, Send, Facebook, Youtube, PlaySquare, MessageCircle, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { Branch, Staff, MarketingPlatform, MarketingPost, MarketingPostStatus } from '../types';

interface MarketingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Staff;
  currentBranch: Branch;
  existingPosts?: MarketingPost[];
  onSubmit: (platform: MarketingPlatform, url: string, status?: MarketingPostStatus) => void;
}

export const detectPlatformFromUrl = (url: string): MarketingPlatform | null => {
  const lower = url.toLowerCase().trim();
  if (lower.includes('tiktok.com') || lower.includes('vt.tiktok.com') || lower.includes('vm.tiktok.com') || lower.includes('douyin.com')) {
    return 'tiktok';
  }
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.com') || lower.includes('m.facebook.com')) {
    return 'facebook';
  }
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return 'youtube';
  }
  if (lower.includes('zalo.me') || lower.includes('zalo.vn')) {
    return 'zalo';
  }
  return null;
};

export function MarketingModal({ isOpen, onClose, currentUser, currentBranch, existingPosts = [], onSubmit }: MarketingModalProps) {
  const [platform, setPlatform] = useState<MarketingPlatform>('facebook');
  const [url, setUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<MarketingPlatform | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [needReview, setNeedReview] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setUrl('');
      setDetectedPlatform(null);
      setDuplicateWarning(null);
      setNeedReview(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);

    // 1. Tự động nhận diện nền tảng từ URL
    const detected = detectPlatformFromUrl(newUrl);
    setDetectedPlatform(detected);
    if (detected) {
      setPlatform(detected);
    }

    // 2. Kiểm tra trùng lặp thời gian thực
    const cleanUrl = newUrl.trim().toLowerCase().split('?')[0];
    if (cleanUrl && cleanUrl.length > 10) {
      const dup = existingPosts.find(p => p.post_url.trim().toLowerCase().split('?')[0] === cleanUrl);
      if (dup) {
        setDuplicateWarning(`⚠️ Link này đã được nộp bởi ${dup.author_name} (${new Date(dup.created_at).toLocaleDateString('vi-VN')})! Vui lòng kiểm tra lại.`);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      alert('Vui lòng nhập đường link bài viết!');
      return;
    }

    // Kiểm tra trùng lặp
    const cleanUrlNoQuery = cleanUrl.toLowerCase().split('?')[0];
    const dup = existingPosts.find(p => p.post_url.trim().toLowerCase().split('?')[0] === cleanUrlNoQuery);
    if (dup) {
      alert(`⚠️ Link bài viết này đã được gửi trước đó bởi "${dup.author_name}" vào ngày ${new Date(dup.created_at).toLocaleDateString('vi-VN')}!\n\nHệ thống từ chối nộp trùng để tránh sai lệch KPI.`);
      return;
    }

    // Tự động chuẩn hóa nền tảng nếu link rõ ràng thuộc nền tảng khác
    const detected = detectPlatformFromUrl(cleanUrl);
    let finalPlatform = platform;
    if (detected && detected !== platform) {
      finalPlatform = detected;
    }

    onSubmit(finalPlatform, cleanUrl, needReview ? 'pending_review' : 'approved');
    setUrl('');
    setNeedReview(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/50">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <Send className="w-5 h-5 text-amber-500" />
            Nộp Link Bài Đăng (Kiểm Tra Thông Minh)
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-xl text-slate-400 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* URL Input First */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Dán Đường Link Bài Viết / Video:
              </label>
              {detectedPlatform && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3 h-3" />
                  Đã nhận diện: {detectedPlatform.toUpperCase()}
                </span>
              )}
            </div>
            
            <input
              type="url"
              required
              placeholder="Dán link Facebook, TikTok, Zalo, YouTube vào đây..."
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />

            {/* Cảnh báo trùng lặp tức thì */}
            {duplicateWarning && (
              <div className="mt-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2 text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-tight">{duplicateWarning}</span>
              </div>
            )}
          </div>

          {/* Platform Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Nền Tảng Đăng Bài (Tự động cập nhật khi dán link):
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPlatform('facebook')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                  platform === 'facebook'
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400 font-extrabold shadow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Facebook className="w-5 h-5 mb-1" />
                <span className="text-[10px]">Facebook</span>
              </button>
              
              <button
                type="button"
                onClick={() => setPlatform('tiktok')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                  platform === 'tiktok'
                    ? 'border-slate-200 bg-slate-200/20 text-slate-100 font-extrabold shadow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <svg className="w-5 h-5 mb-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.68a6.34 6.34 0 0 0 6.27 6.36 6.3 6.3 0 0 0 6.39-5.91 6.9 6.9 0 0 0 .14-1.37V9.58a8.3 8.3 0 0 0 4.2 1.53V7.63a5.41 5.41 0 0 1-2.41-.94z"/>
                </svg>
                <span className="text-[10px]">TikTok</span>
              </button>
              
              <button
                type="button"
                onClick={() => setPlatform('zalo')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                  platform === 'zalo'
                    ? 'border-blue-400 bg-blue-400/20 text-blue-300 font-extrabold shadow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <MessageCircle className="w-5 h-5 mb-1" />
                <span className="text-[10px]">Zalo</span>
              </button>

              <button
                type="button"
                onClick={() => setPlatform('youtube')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                  platform === 'youtube'
                    ? 'border-red-500 bg-red-500/20 text-red-400 font-extrabold shadow-sm'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Youtube className="w-5 h-5 mb-1" />
                <span className="text-[10px]">YouTube</span>
              </button>
            </div>
          </div>

          {/* Context Info */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              <span className="block text-slate-500 text-[10px] mb-0.5">Chi nhánh ghi nhận:</span>
              <span className="font-bold text-amber-400">{currentBranch?.name?.replace('Phụ Kiện 88 - ', '') || 'Chi nhánh'}</span>
            </div>
            <div className="text-right">
              <span className="block text-slate-500 text-[10px] mb-0.5">Người đăng:</span>
              <span className="font-bold text-slate-200">{currentUser.fullName}</span>
            </div>
          </div>

          {/* Tùy chọn gửi Bàn Biên Tập kiểm duyệt */}
          <label className="flex items-start gap-2.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={needReview}
              onChange={(e) => setNeedReview(e.target.checked)}
              className="mt-0.5 rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700 w-4 h-4 cursor-pointer accent-amber-500"
            />
            <div className="text-left">
              <span className="text-xs font-bold text-slate-200 block">
                📋 Gửi Bàn Biên Tập duyệt bài trước khi công bố
              </span>
              <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                Chuyển bài sang hàng đợi Bàn Tổng Biên Tập (Leader Khả Tú / Media Quốc Việt) duyệt 1-click.
              </span>
            </div>
          </label>

          {/* Actions */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={Boolean(duplicateWarning)}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-extrabold py-3 rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex justify-center items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{needReview ? 'Gửi Duyệt Bài Ngay' : 'Ghi Nhận Bài Đăng Ngay'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

