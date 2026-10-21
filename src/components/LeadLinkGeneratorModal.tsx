import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Branch } from '../types';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  QrCode, 
  Sparkles, 
  Building2, 
  CheckCircle2
} from 'lucide-react';

interface LeadLinkGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  defaultBranchCode?: string;
}

interface PlatformOption {
  id: string;
  name: string;
  code: string;
  icon: string;
  badgeBg: string;
  textColor: string;
  desc: string;
}

// Icon chuẩn thương hiệu thực tế của các mạng xã hội
export const PlatformBrandIcon: React.FC<{ platformId: string; className?: string }> = ({ 
  platformId, 
  className = "w-7 h-7" 
}) => {
  switch (platformId) {
    case 'facebook':
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="24" fill="#1877F2" />
          <path fillRule="evenodd" clipRule="evenodd" d="M30.6 25L31.3 20.3H26.8V17.3C26.8 16 27.5 14.7 29.5 14.7H31.6V10.7C31.6 10.7 29.7 10.4 27.9 10.4C24.1 10.4 21.6 12.7 21.6 16.9V20.3H17.5V25H21.6V36.3C22.6 36.5 23.6 36.6 24.6 36.6C25.4 36.6 26.1 36.5 26.8 36.4V25H30.6Z" fill="white" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="#010101" />
          <path d="M32.5 18.2C30.4 18.1 28.5 17 27.3 15.3V27.5C27.3 32.2 23.5 36 18.8 36C14.1 36 10.3 32.2 10.3 27.5C10.3 22.8 14.1 19 18.8 19C19.4 19 20 19.1 20.6 19.2V23.6C20 23.4 19.4 23.3 18.8 23.3C16.5 23.3 14.6 25.2 14.6 27.5C14.6 29.8 16.5 31.7 18.8 31.7C21.1 31.7 23 29.8 23 27.5V9.5H27.3C27.5 12.4 29.6 14.8 32.5 15.5V18.2Z" fill="#25F4EE" />
          <path d="M33.8 17.2C31.7 17.1 29.8 16 28.6 14.3V26.5C28.6 31.2 24.8 35 20.1 35C15.4 35 11.6 31.2 11.6 26.5C11.6 21.8 15.4 18 20.1 18C20.7 18 21.3 18.1 21.9 18.2V22.6C21.3 22.4 20.7 22.3 20.1 22.3C17.8 22.3 15.9 24.2 15.9 26.5C15.9 28.8 17.8 30.7 20.1 30.7C22.4 30.7 24.3 28.8 24.3 26.5V8.5H28.6C28.8 11.4 30.9 13.8 33.8 14.5V17.2Z" fill="#FE2C55" />
          <path d="M33.2 17.7C31.1 17.6 29.2 16.5 28 14.8V27C28 31.7 24.2 35.5 19.5 35.5C14.8 35.5 11 31.7 11 27C11 22.3 14.8 18.5 19.5 18.5C20.1 18.5 20.7 18.6 21.3 18.7V23.1C20.7 22.9 20.1 22.8 19.5 22.8C17.2 22.8 15.3 24.7 15.3 27C15.3 29.3 17.2 31.2 19.5 31.2C21.8 31.2 23.7 29.3 23.7 27V9H28C28.2 11.9 30.3 14.3 33.2 15V17.7Z" fill="#FFFFFF" />
        </svg>
      );
    case 'zalo':
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="#0068FF" />
          <path fillRule="evenodd" clipRule="evenodd" d="M38 23c0-6.6-6.3-12-14-12s-14 5.4-14 12c0 4.1 2.4 7.7 6 9.8l-1.5 4.4c-.2.6.4 1.1.9.8l5.2-2.7c1.1.4 2.2.5 3.4.5 7.7 0 14-5.4 14-12z" fill="#FFFFFF" />
          <text x="24" y="27" textAnchor="middle" fill="#0068FF" fontSize="12" fontWeight="900" style={{ fontFamily: 'Arial, -apple-system, sans-serif', letterSpacing: '-0.5px' }}>Zalo</text>
        </svg>
      );
    case 'youtube':
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="#FF0000" />
          <polygon points="19,16 33,24 19,32" fill="white" />
        </svg>
      );
    case 'website':
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="url(#grad-web)" />
          <circle cx="24" cy="24" r="13" stroke="white" strokeWidth="2.2" />
          <ellipse cx="24" cy="24" rx="6" ry="13" stroke="white" strokeWidth="1.8" />
          <line x1="11" y1="24" x2="37" y2="24" stroke="white" strokeWidth="1.8" />
          <line x1="14" y1="18" x2="34" y2="18" stroke="white" strokeWidth="1.5" />
          <line x1="14" y1="30" x2="34" y2="30" stroke="white" strokeWidth="1.5" />
          <defs>
            <linearGradient id="grad-web" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10B981" />
              <stop offset="1" stopColor="#047857" />
            </linearGradient>
          </defs>
        </svg>
      );
    case 'qr_table':
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="url(#grad-qr)" />
          <rect x="13" y="11" width="22" height="22" rx="3.5" fill="white" />
          <rect x="15.5" y="13.5" width="5.5" height="5.5" rx="1" fill="#D97706" />
          <rect x="17" y="15" width="2.5" height="2.5" fill="white" />
          <rect x="27" y="13.5" width="5.5" height="5.5" rx="1" fill="#D97706" />
          <rect x="28.5" y="15" width="2.5" height="2.5" fill="white" />
          <rect x="15.5" y="25" width="5.5" height="5.5" rx="1" fill="#D97706" />
          <rect x="17" y="26.5" width="2.5" height="2.5" fill="white" />
          <rect x="23.5" y="14" width="2" height="4.5" fill="#D97706" />
          <rect x="23.5" y="20.5" width="2" height="2" fill="#D97706" />
          <rect x="27" y="21.5" width="4" height="2" fill="#D97706" />
          <rect x="23" y="24.5" width="3.5" height="3" fill="#D97706" />
          <rect x="28" y="25" width="4" height="5" fill="#D97706" />
          <path d="M20 33L18 38H30L28 33H20Z" fill="white" opacity="0.85" />
          <rect x="14" y="38" width="20" height="2.5" rx="1.25" fill="white" />
          <defs>
            <linearGradient id="grad-qr" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F59E0B" />
              <stop offset="1" stopColor="#D97706" />
            </linearGradient>
          </defs>
        </svg>
      );
    case 'custom':
    default:
      return (
        <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="url(#grad-custom)" />
          <path d="M24 11L26.8 19.2L35 22L26.8 24.8L24 33L21.2 24.8L13 22L21.2 19.2L24 11Z" fill="white" />
          <path d="M34 11L35.2 14.8L39 16L35.2 17.2L34 21L32.8 17.2L29 16L32.8 14.8L34 11Z" fill="#F3E8FF" />
          <circle cx="15" cy="33" r="2" fill="#F3E8FF" />
          <defs>
            <linearGradient id="grad-custom" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#6D28D9" />
            </linearGradient>
          </defs>
        </svg>
      );
  }
};

const PLATFORMS: PlatformOption[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    code: 'facebook',
    icon: 'facebook',
    badgeBg: 'bg-blue-600/20 border-blue-500/40',
    textColor: 'text-blue-400',
    desc: 'Fanpage, Bài viết, Messenger tự động, Reels'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    code: 'tiktok',
    icon: 'tiktok',
    badgeBg: 'bg-pink-600/20 border-pink-500/40',
    textColor: 'text-pink-400',
    desc: 'Link Bio đầu kênh, Video clip, Livestream'
  },
  {
    id: 'zalo',
    name: 'Zalo',
    code: 'zalo',
    icon: 'zalo',
    badgeBg: 'bg-sky-600/20 border-sky-500/40',
    textColor: 'text-sky-400',
    desc: 'Zalo OA, Menu chat, Nhóm khách VIP'
  },
  {
    id: 'website',
    name: 'Website PK88',
    code: 'website',
    icon: 'website',
    badgeBg: 'bg-emerald-600/20 border-emerald-500/40',
    textColor: 'text-emerald-400',
    desc: 'Widget trang chủ, Banner khuyến mãi'
  },
  {
    id: 'qr_table',
    name: 'QR Bàn Shop',
    code: 'qr_table',
    icon: 'qr_table',
    badgeBg: 'bg-amber-600/20 border-amber-500/40',
    textColor: 'text-amber-400',
    desc: 'In Standee đặt quầy thu ngân, bàn kỹ thuật'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    code: 'youtube',
    icon: 'youtube',
    badgeBg: 'bg-rose-600/20 border-rose-500/40',
    textColor: 'text-rose-400',
    desc: 'Mô tả video review, YouTube Shorts'
  },
  {
    id: 'custom',
    name: 'Tùy Chỉnh',
    code: 'custom',
    icon: 'custom',
    badgeBg: 'bg-purple-600/20 border-purple-500/40',
    textColor: 'text-purple-400',
    desc: 'Tự đặt mã chiến dịch riêng (VD: fb_ads_tet)'
  }
];

export const LeadLinkGeneratorModal: React.FC<LeadLinkGeneratorModalProps> = ({
  isOpen,
  onClose,
  branches,
  defaultBranchCode
}) => {
  const activeBranches = branches.filter(b => b.isActive !== false);

  const [selectedPlatform, setSelectedPlatform] = useState<string>('facebook');
  const [customSource, setCustomSource] = useState<string>('');
  const [selectedBranchCode, setSelectedBranchCode] = useState<string>(() => {
    return defaultBranchCode || activeBranches[0]?.code || 'PK88_PHUKHUONG';
  });
  const [campaignTag, setCampaignTag] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);

  // Tính toán URL chuẩn theo các tham số
  const generatedUrl = React.useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://pk88-hub.vercel.app';
    const baseUrl = `${origin}/?tab=tu-van`;
    
    const params = new URLSearchParams();
    
    // Nguồn
    const sourceCode = selectedPlatform === 'custom' 
      ? (customSource.trim().toLowerCase().replace(/\s+/g, '_') || 'custom_campaign')
      : selectedPlatform;
    
    params.set('src', sourceCode);
    
    // Chi nhánh đích
    if (selectedBranchCode && selectedBranchCode !== 'ALL') {
      params.set('branch', selectedBranchCode);
    }

    // Tag chiến dịch nếu có
    if (campaignTag.trim()) {
      params.set('utm_campaign', campaignTag.trim().toLowerCase().replace(/\s+/g, '_'));
    }

    return `${baseUrl}&${params.toString()}`;
  }, [selectedPlatform, customSource, selectedBranchCode, campaignTag]);

  // Sinh Data URL mã QR chuẩn xác 100%, không bị che lấp hay tràn kích thước
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    setIsGeneratingQr(true);

    QRCode.toDataURL(generatedUrl, {
      width: 800,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#020617', // Đen slate thẫm
        light: '#ffffff' // Trắng sắc nét
      }
    })
      .then((url) => {
        if (!isCancelled) {
          setQrDataUrl(url);
          setIsGeneratingQr(false);
        }
      })
      .catch((err) => {
        console.error('Lỗi tạo mã QR:', err);
        if (!isCancelled) setIsGeneratingQr(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, generatedUrl]);

  if (!isOpen) return null;

  // Sao chép link vào Clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // Tải ảnh QR Code chất lượng cao về máy (PNG)
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    
    const branchName = activeBranches.find(b => b.code === selectedBranchCode)?.name || 'ToanChuoi';
    const cleanBranch = branchName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `PK88_QR_${selectedPlatform.toUpperCase()}_${cleanBranch}.png`;

    const downloadLink = document.createElement('a');
    downloadLink.href = qrDataUrl;
    downloadLink.download = fileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const selectedPlatformObj = PLATFORMS.find(p => p.id === selectedPlatform) || PLATFORMS[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-slate-700/50 my-auto">
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Tạo Link & Mã QR Đa Kênh
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Zero-API
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Đo lường chính xác khách từ Facebook, TikTok, Zalo hay bàn quầy từng shop
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NỘI DUNG CHÍNH (CUỘN THOÁNG ĐÃNG) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">

          {/* 1. CHỌN NỀN TẢNG / KÊNH MARKETING */}
          <div>
            <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
              1. Chọn Nền Tảng Đăng Link / Đặt Mã QR:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PLATFORMS.map((plat) => {
                const isSelected = selectedPlatform === plat.id;
                return (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => setSelectedPlatform(plat.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-800 border-rose-500 ring-2 ring-rose-500/30 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <PlatformBrandIcon platformId={plat.id} className="w-8 h-8 shrink-0 rounded-xl shadow-sm" />
                      {isSelected && <Check className="w-4 h-4 text-rose-400 shrink-0" />}
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">{plat.name}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{plat.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Ô nhập mã tùy chỉnh nếu chọn Custom */}
            {selectedPlatform === 'custom' && (
              <div className="mt-2.5">
                <input
                  type="text"
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  placeholder="Nhập mã nguồn tùy ý (VD: fb_ads_khuyenmai, livestream_01...)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-purple-500/50 text-purple-200 text-xs outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>
            )}
          </div>

          {/* 2. CHỌN CHI NHÁNH ĐÍCH */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Chi Nhánh Phục Vụ:</span>
              </label>
              <select
                value={selectedBranchCode}
                onChange={(e) => setSelectedBranchCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-bold outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="ALL">🌐 Tự động (Khách tự chọn hoặc mặc định Phú Khương)</option>
                {activeBranches.map(b => (
                  <option key={b.code} value={b.code}>
                    📍 {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>Tên Chiến Dịch (Tùy chọn):</span>
              </label>
              <input
                type="text"
                value={campaignTag}
                onChange={(e) => setCampaignTag(e.target.value)}
                placeholder="VD: voucher_10k, iphone_18_launch..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* 3. KHUNG HIỂN THỊ LINK & QR CODE */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-4">
            {/* Header kết quả */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                ✨ Đường Link & Mã QR Đã Tạo:
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${selectedPlatformObj.badgeBg} ${selectedPlatformObj.textColor} flex items-center gap-1.5`}>
                <PlatformBrandIcon platformId={selectedPlatform} className="w-4 h-4 shrink-0" />
                <span>Nguồn: {selectedPlatform === 'custom' ? (customSource || 'custom') : selectedPlatformObj.name}</span>
              </span>
            </div>

            {/* Ô hiển thị Link kèm nút Copy */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1.5 pr-2">
              <input
                type="text"
                readOnly
                value={generatedUrl}
                className="flex-1 bg-transparent px-2.5 py-1 text-xs font-mono text-slate-200 outline-none select-all truncate"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-md shadow-rose-600/20"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Đã Chép' : 'Sao Chép'}</span>
              </button>
              <a
                href={generatedUrl}
                target="_blank"
                rel="noreferrer"
                title="Mở thử nghiệm link"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Khung Mã QR và nút Download (Layout căn giữa, tỷ lệ hoàn hảo) */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-5 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/80">
              {/* Thẻ QR trắng bo góc sang trọng */}
              <div className="flex flex-col items-center shrink-0">
                <div className="p-3 bg-white rounded-2xl shadow-2xl ring-4 ring-amber-500/20 flex items-center justify-center">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="Mã QR PK88" 
                      className="w-44 h-44 sm:w-48 sm:h-48 rounded-lg object-contain block"
                    />
                  ) : (
                    <div className="w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center text-xs text-slate-500 font-bold">
                      Đang vẽ mã QR...
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-amber-400 font-bold mt-2 tracking-wide uppercase">
                  Phụ Kiện 88 • Quét Nhận 10%
                </span>
              </div>

              {/* Thông tin & Nút tải về */}
              <div className="space-y-3 text-center sm:text-left flex-1 min-w-0">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center justify-center sm:justify-start gap-1.5">
                    <span>Mã QR Chuẩn Chuỗi PK88</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Mã QR tiêu chuẩn độ phân giải cao (800×800 px), nhận diện cực nhạy trên mọi camera điện thoại (iPhone, Android, Zalo, TikTok).
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <span>💡 Ứng dụng thực tế:</span>
                  </div>
                  <div>• In Standee A5/A6 đặt bàn thu ngân, bàn kỹ thuật.</div>
                  <div>• Đăng lên ảnh bài viết Fanpage Facebook, Zalo OA.</div>
                  <div>• Chèn góc màn hình Livestream TikTok / YouTube.</div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadQr}
                  disabled={!qrDataUrl || isGeneratingQr}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>TẢI XUỐNG ẢNH MÃ QR (PNG)</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <span>💡 Khi khách quét mã hoặc nhấp link, hệ thống tự động ghi nhận nguồn vào Bảng CRM.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
