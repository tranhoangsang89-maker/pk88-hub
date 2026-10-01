import React, { useState } from 'react';
import { X, Send, Facebook, Youtube, PlaySquare, MessageCircle } from 'lucide-react';
import { Branch, Staff, MarketingPlatform } from '../types';

interface MarketingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Staff;
  currentBranch: Branch;
  onSubmit: (platform: MarketingPlatform, url: string) => void;
}

export function MarketingModal({ isOpen, onClose, currentUser, currentBranch, onSubmit }: MarketingModalProps) {
  const [platform, setPlatform] = useState<MarketingPlatform>('facebook');
  const [url, setUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      alert('Vui lòng nhập đường link bài viết!');
      return;
    }
    onSubmit(platform, url.trim());
    setUrl('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/50">
          <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
            <Send className="w-5 h-5 text-amber-500" />
            Nộp Bài Đăng 1-Chạm
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Chọn Nền Tảng</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPlatform('facebook')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  platform === 'facebook'
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'
                }`}
              >
                <Facebook className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">Facebook</span>
              </button>
              
              <button
                type="button"
                onClick={() => setPlatform('tiktok')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  platform === 'tiktok'
                    ? 'border-slate-200 bg-slate-200/20 text-slate-100'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'
                }`}
              >
                <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.68a6.34 6.34 0 0 0 6.27 6.36 6.3 6.3 0 0 0 6.39-5.91 6.9 6.9 0 0 0 .14-1.37V9.58a8.3 8.3 0 0 0 4.2 1.53V7.63a5.41 5.41 0 0 1-2.41-.94z"/>
                </svg>
                <span className="text-[10px] font-bold">TikTok</span>
              </button>
              
              <button
                type="button"
                onClick={() => setPlatform('zalo')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  platform === 'zalo'
                    ? 'border-blue-400 bg-blue-400/20 text-blue-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'
                }`}
              >
                <MessageCircle className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">Zalo</span>
              </button>

              <button
                type="button"
                onClick={() => setPlatform('youtube')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  platform === 'youtube'
                    ? 'border-red-500 bg-red-500/20 text-red-400'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'
                }`}
              >
                <Youtube className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">YouTube</span>
              </button>
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Đường Link Bài Viết / Video</label>
            <input
              type="url"
              required
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Context Info */}
          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              <span className="block text-slate-500 mb-0.5">Chi nhánh hiện tại</span>
              <span className="font-bold text-amber-500">{currentBranch.name}</span>
            </div>
            <div className="text-right">
              <span className="block text-slate-500 mb-0.5">Người đăng</span>
              <span className="font-bold text-slate-300">{currentUser.fullName}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl transition-colors shadow-lg shadow-amber-500/20 flex justify-center items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Ghi Nhận Bài Đăng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
