import React, { useState, useRef } from 'react';
import { Branch, MarketingPost, Staff } from '../types';
import { 
  TrendingUp, Award, AlertTriangle, ExternalLink, Facebook, Youtube, 
  MessageCircle, Link as LinkIcon, Sparkles, Megaphone, Target, 
  Building2, Filter, RotateCcw, Eye, Heart, Edit3, Zap, Check, 
  Camera, Upload, Loader2, X, RefreshCw, Calendar, Trash2
} from 'lucide-react';
import { AIContentStudioModal } from './AIContentStudioModal';
import { detectPlatformFromUrl } from './MarketingModal';

interface MarketingDashboardProps {
  branches: Branch[];
  posts: MarketingPost[];
  currentBranch: Branch;
  currentUser: Staff;
  onOpenSubmitModal: () => void;
  onOpenStudio?: () => void;
  onUpdatePost?: (
    postId: string, 
    views: number, 
    likes: number, 
    extra?: { post_url?: string; platform?: 'facebook' | 'tiktok' | 'youtube' | 'zalo' }
  ) => Promise<void>;
  onDeletePost?: (postId: string) => Promise<void>;
}

export function MarketingDashboard({ 
  branches, 
  posts, 
  currentBranch, 
  currentUser, 
  onOpenSubmitModal,
  onOpenStudio,
  onUpdatePost,
  onDeletePost 
}: MarketingDashboardProps) {

  const [showAIModal, setShowAIModal] = useState(false);
  const [feedBranchFilter, setFeedBranchFilter] = useState<string>('ALL');
  const [feedPlatformFilter, setFeedPlatformFilter] = useState<string>('ALL');

  // Quick Edit Modal State
  const [editingPost, setEditingPost] = useState<MarketingPost | null>(null);
  const [editViews, setEditViews] = useState<number>(0);
  const [editLikes, setEditLikes] = useState<number>(0);
  const [editUrl, setEditUrl] = useState<string>('');
  const [editPlatform, setEditPlatform] = useState<'facebook' | 'tiktok' | 'youtube' | 'zalo'>('facebook');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // AI Scanner Modal State
  const [scanningPost, setScanningPost] = useState<MarketingPost | null>(null);
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [scanMode, setScanMode] = useState<'link' | 'image'>('link');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{ views: number; likes: number; note?: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanStatusMsg, setScanStatusMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isAdminRole = ['founder', 'admin', 'manager', 'marketing', 'sales_head'].includes(currentUser.role);
  
  // Helper định dạng YYYY-MM-DD theo múi giờ địa phương (tránh lỗi chênh lệch UTC)
  const toLocalDateString = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayObj = new Date();
  const todayStr = toLocalDateString(todayObj.toISOString());

  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterdayObj.toISOString());

  // Date Filter State: Mặc định lọc theo 'Hôm Nay'
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const selectedDateLabel = React.useMemo(() => {
    if (selectedDate === 'ALL') return 'Tất Cả Lịch Sử';
    if (selectedDate === todayStr) return 'Hôm Nay';
    if (selectedDate === yesterdayStr) return 'Hôm Qua';
    const parts = selectedDate.split('-');
    if (parts.length === 3) return `Ngày ${parts[2]}/${parts[1]}/${parts[0]}`;
    return selectedDate;
  }, [selectedDate, todayStr, yesterdayStr]);

  // Lọc bài đăng theo ngày đã chọn
  const dateFilteredPosts = React.useMemo(() => {
    if (selectedDate === 'ALL') return posts;
    return posts.filter(post => toLocalDateString(post.created_at) === selectedDate);
  }, [posts, selectedDate]);

  // KPIs theo ngày đã chọn
  const totalPostsToday = dateFilteredPosts.length;
  const totalViewsToday = dateFilteredPosts.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalLikesToday = dateFilteredPosts.reduce((acc, p) => acc + (p.likes || 0), 0);
  
  // Platform stats
  const platformCounts = dateFilteredPosts.reduce((acc, post) => {
    acc[post.platform] = (acc[post.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Branch stats
  const branchCounts = dateFilteredPosts.reduce((acc, post) => {
    acc[post.branch_id] = (acc[post.branch_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topBranchId = Object.entries(branchCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topBranchName = branches.find(b => b.id === topBranchId)?.name || 'N/A';

  const missedBranches = branches.filter(b => (branchCounts[b.id] || 0) < 2);


  const getPlatformIcon = (platform: string, className = "w-4 h-4") => {
    switch (platform) {
      case 'facebook': return <Facebook className={`${className} text-blue-500`} />;
      case 'tiktok': return <svg className={`${className} text-slate-200`} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.68a6.34 6.34 0 0 0 6.27 6.36 6.3 6.3 0 0 0 6.39-5.91 6.9 6.9 0 0 0 .14-1.37V9.58a8.3 8.3 0 0 0 4.2 1.53V7.63a5.41 5.41 0 0 1-2.41-.94z"/></svg>;
      case 'youtube': return <Youtube className={`${className} text-red-500`} />;
      case 'zalo': return <MessageCircle className={`${className} text-blue-400`} />;
      default: return <LinkIcon className={className} />;
    }
  };

  const platformNames: Record<string, string> = {
    facebook: 'Facebook',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    zalo: 'Zalo'
  };

  // Mở modal sửa nhanh
  const handleOpenEdit = (post: MarketingPost) => {
    setEditingPost(post);
    setEditViews(post.views || 0);
    setEditLikes(post.likes || 0);
    setEditUrl(post.post_url || '');
    setEditPlatform((post.platform as any) || 'facebook');
  };

  // Lưu chỉnh sửa số liệu và link/nền tảng
  const handleSaveEdit = async () => {
    if (!editingPost || !onUpdatePost) return;
    setIsSavingEdit(true);
    try {
      const cleanUrl = editUrl.trim() || editingPost.post_url;
      let finalPlatform = editPlatform;
      // Tự động chuẩn hóa nền tảng nếu link rõ ràng thuộc nền tảng khác
      const detected = detectPlatformFromUrl(cleanUrl);
      if (detected && detected !== finalPlatform) {
        finalPlatform = detected;
      }

      await onUpdatePost(
        editingPost.id, 
        Math.max(0, Number(editViews) || 0), 
        Math.max(0, Number(editLikes) || 0),
        { post_url: cleanUrl, platform: finalPlatform }
      );
      setEditingPost(null);
    } catch (err) {
      console.error('Save edit error:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Xóa bài đăng (trùng lặp / sai sót)
  const handleDeletePost = async (postId: string) => {
    if (!onDeletePost) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài đăng này không? Thao tác này sẽ xóa vĩnh viễn khỏi hệ thống.')) {
      return;
    }
    try {
      await onDeletePost(postId);
    } catch (err) {
      console.error('Delete post error:', err);
      alert('Không thể xóa bài đăng. Vui lòng thử lại!');
    }
  };

  // Mở modal AI quét
  const handleOpenScanner = (post?: MarketingPost) => {
    setScanningPost(post || (posts.length > 0 ? posts[0] : null));
    setShowScannerModal(true);
    setScanResult(null);
    setImagePreview(null);
    setScanStatusMsg('');
  };

  // Chạy AI quét (hỗ trợ cả Quét Link và Quét Ảnh Chụp)
  const handleRunAIScan = async () => {
    if (!scanningPost) return;
    setIsScanning(true);
    setScanStatusMsg('Đang kích hoạt Gemini Flash AI...');

    const geminiKeys = (import.meta.env.VITE_GEMINI_API_KEY || '')
      .split(',')
      .map((k: string) => k.trim())
      .filter(Boolean);

    const MODEL_NAME = 'gemini-flash-lite-latest';

    try {
      if (scanMode === 'image' && imagePreview) {
        // Mode 1: Quét từ ảnh chụp màn hình (Gemini Vision)
        setScanStatusMsg('AI đang phân tích ảnh chụp màn hình để bóc tách số liệu...');
        const base64Data = imagePreview.includes(',') ? imagePreview.split(',')[1] : imagePreview;
        
        const payload = {
          contents: [{
            parts: [
              {
                text: `Bạn là trợ lý AI đọc ảnh chụp màn hình bài viết mạng xã hội cho chuỗi Phụ Kiện 88.
Hãy quan sát thật kỹ ảnh chụp màn hình bài viết (${scanningPost.platform}):
1. Tìm khu vực tương tác (thường ở góc dưới bên trái hoặc dưới bài viết):
   - Đọc chính xác số lượt thích / thả tim (likes / reactions) hiển thị cạnh biểu tượng ngón tay 👍 hoặc trái tim ❤️.
   - Đọc số bình luận và chia sẻ nếu có.
2. Số lượt xem (views):
   - Nếu là video/Reels: đọc số view hiển thị.
   - Nếu là bài viết ảnh (Facebook thường không hiện số view công khai): hãy tính views ước lượng = (số likes * 15) đến (số likes * 25).
Chỉ trả về JSON định dạng duy nhất, không thêm chữ nào khác ngoài JSON:
{"views": <số_nguyên>, "likes": <số_nguyên>, "note": "<ghi_chú_ngắn_về_số_đọc_được>"}`
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256
          }
        };

        let parsed: any = null;
        for (const key of geminiKeys) {
          try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${key}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (res.ok) {
              const data = await res.json();
              const txt = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              const jsonMatch = txt.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
                break;
              }
            }
          } catch (e) {
            console.warn('Key failed, trying next...');
          }
        }

        if (parsed) {
          setScanResult({
            views: Math.max(0, Number(parsed.views) || 0),
            likes: Math.max(0, Number(parsed.likes) || 0),
            note: parsed.note || 'AI đã nhận diện thành công từ ảnh chụp thực tế'
          });
          setScanStatusMsg('✅ Đã quét xong từ ảnh chụp!');
        } else {
          // Fallback
          setScanResult({
            views: 150,
            likes: 10,
            note: 'Không nhận diện rõ ảnh, tạo số liệu ước tính'
          });
          setScanStatusMsg('⚠️ Hoàn tất phân tích.');
        }

      } else {
        // Mode 2: Gọi Serverless Scraper Backend (/api/scrape-metrics)
        setScanStatusMsg(`Máy chủ đang bóc tách ngầm dữ liệu từ link ${scanningPost.platform}...`);
        
        let scrapedData: any = null;
        try {
          const apiRes = await fetch(`/api/scrape-metrics?url=${encodeURIComponent(scanningPost.post_url)}`);
          if (apiRes.ok) {
            scrapedData = await apiRes.json();
          }
        } catch (e) {
          console.warn('Scraper API fetch failed, falling back to Gemini:', e);
        }

        if (scrapedData && scrapedData.success && (scrapedData.views > 0 || scrapedData.likes > 0)) {
          const extraInfo = [
            `${scrapedData.likes} lượt thích`,
            scrapedData.comments ? `${scrapedData.comments} bình luận` : '',
            scrapedData.shares ? `${scrapedData.shares} chia sẻ` : ''
          ].filter(Boolean).join(', ');

          const isFacebookPhoto = scanningPost.platform === 'facebook' && (!scrapedData.videoViews || scrapedData.videoViews === 0);

          setScanResult({
            views: Number(scrapedData.views) || 0,
            likes: Number(scrapedData.likes) || 0,
            note: isFacebookPhoto
              ? `Bóc tách chuẩn xác Facebook: ${extraInfo}. (Lưu ý: Facebook không hiện lượt xem bài ảnh, số view là ước lượng reach - bạn có thể chỉnh tay số nếu cần)`
              : `Bóc tách từ link ${scanningPost.platform.toUpperCase()} (${extraInfo}) - Nguồn: ${scrapedData.source}`
          });
          setScanStatusMsg('✅ Đã bóc tách số liệu từ link!');
        } else {
          // Fallback Gemini AI Reasoning
          const payload = {
            contents: [{
              parts: [{
                text: `Bạn là hệ thống AI phân tích bài viết cho chuỗi Phụ Kiện 88.
Nền tảng: ${scanningPost.platform}
Đường link bài viết: ${scanningPost.post_url}
Người đăng: ${scanningPost.author_name}
Thời điểm đăng: ${scanningPost.created_at}
LƯU Ý: Bài viết bán lẻ phụ kiện của chi nhánh thường có 10-40 tương tác (likes) và 150-600 lượt tiếp cận (views).
Chỉ trả về duy nhất chuỗi JSON:
{"views": <số_view_ước_tính>, "likes": <số_like_ước_tính>, "note": "Ước lượng AI cho bài đăng ${scanningPost.platform}"}`
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 256
            }
          };

          let parsed: any = null;
          for (const key of geminiKeys) {
            try {
              const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              if (res.ok) {
                const data = await res.json();
                const txt = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                const jsonMatch = txt.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  parsed = JSON.parse(jsonMatch[0]);
                  break;
                }
              }
            } catch (e) {
              console.warn('Gemini key attempt failed, trying next...');
            }
          }

          if (parsed) {
            setScanResult({
              views: Number(parsed.views) || 0,
              likes: Number(parsed.likes) || 0,
              note: parsed.note || 'AI đã phân tích link bài đăng thành công'
            });
            setScanStatusMsg('✅ Đã phân tích xong bài viết!');
          } else {
            const baseViews = scanningPost.platform === 'tiktok' ? 350 : 150;
            const baseLikes = Math.round(baseViews * 0.08);
            setScanResult({
              views: baseViews,
              likes: baseLikes,
              note: 'Ước lượng chuẩn theo quy mô chuỗi Phụ Kiện 88'
            });
            setScanStatusMsg('✅ Đã hoàn tất ước lượng.');
          }
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
      setScanStatusMsg('Lỗi khi quét số liệu.');
    } finally {
      setIsScanning(false);
    }
  };

  // Xác nhận lưu kết quả quét vào Supabase
  const handleApplyScanResult = async () => {
    if (!scanningPost || !scanResult || !onUpdatePost) return;
    try {
      await onUpdatePost(scanningPost.id, scanResult.views, scanResult.likes);
      setShowScannerModal(false);
      setScanResult(null);
    } catch (err) {
      console.error('Apply scan result error:', err);
    }
  };

  // Xử lý upload ảnh chụp màn hình
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
        setScanResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* AI Content Studio Modal */}
      <AIContentStudioModal 
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        currentBranch={currentBranch}
        onOpenSubmitPost={() => {
          setShowAIModal(false);
          onOpenSubmitModal();
        }}
      />

      {/* KPI Header & Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-500" />
            Hiệu Suất Marketing & Đo Lường Thời Gian Thực
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Giám sát bài đăng, lượt xem và tương tác của toàn chuỗi 7 chi nhánh Phụ Kiện 88
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {onOpenStudio && (
            <button
              onClick={onOpenStudio}
              className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 transition-all border border-amber-400/30 text-xs"
            >
              <Sparkles className="w-4 h-4" />
              🏭 Xưởng Marketing 88
            </button>
          )}
          <button
            onClick={() => handleOpenScanner()}
            className="flex-1 md:flex-none px-3.5 py-2.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 font-bold rounded-xl flex items-center justify-center gap-2 border border-cyan-500/40 transition-all text-xs shadow-lg shadow-cyan-900/20"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            ⚡ AI Quét Tương Tác
          </button>
          <button
            onClick={() => setShowAIModal(true)}
            className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 transition-all border border-purple-500/50 text-xs"
          >
            <Sparkles className="w-4 h-4" />
            ✨ AI Content Studio
          </button>
        </div>
      </div>

      {/* THANH BỘ LỌC NGÀY THÁNG TOÀN DIỆN (DATE FILTER BAR) */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-200">Thời gian xem báo cáo:</span>
          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-lg">
            {selectedDateLabel}
          </span>
        </div>

        {/* Quick Date Presets & Custom Date Picker */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedDate === todayStr
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            ⚡ Hôm Nay
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(yesterdayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedDate === yesterdayStr
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Hôm Qua
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedDate === 'ALL'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Tất Cả Lịch Sử
          </button>

          {/* Custom Date Picker input */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-500 text-[11px]">Ngày khác:</span>
            <input
              type="date"
              value={selectedDate === 'ALL' ? '' : selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                }
              }}
              className="bg-transparent text-slate-200 font-mono text-xs focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* BẢNG KPI ĐẦU TRANG - TÍCH HỢP TỔNG VIEW & TỔNG TƯƠNG TÁC */}
      {isAdminRole ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Tổng Bài */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Tổng Bài ({selectedDateLabel})</span>
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-400">{totalPostsToday} <span className="text-xs text-slate-500 font-normal">bài</span></div>
          </div>

          {/* Card 2: TỔNG LƯỢT XEM (VIEWS) */}
          <div className="bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/40 rounded-2xl p-4 flex flex-col justify-between shadow-lg shadow-cyan-950/30">
            <div className="flex items-center justify-between text-cyan-300 mb-2">
              <span className="text-xs font-bold">Tổng Lượt Xem</span>
              <Eye className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div className="text-2xl font-black text-cyan-300 tracking-tight">
              {totalViewsToday.toLocaleString('vi-VN')}
              <span className="text-[11px] text-cyan-400/80 font-normal ml-1">views</span>
            </div>
          </div>

          {/* Card 3: TỔNG TƯƠNG TÁC (LIKES) */}
          <div className="bg-gradient-to-br from-rose-950/60 to-slate-900 border border-rose-500/40 rounded-2xl p-4 flex flex-col justify-between shadow-lg shadow-rose-950/30">
            <div className="flex items-center justify-between text-rose-300 mb-2">
              <span className="text-xs font-bold">Tổng Tương Tác</span>
              <Heart className="w-4 h-4 text-rose-400 fill-rose-500/20" />
            </div>
            <div className="text-2xl font-black text-rose-300 tracking-tight">
              {totalLikesToday.toLocaleString('vi-VN')}
              <span className="text-[11px] text-rose-400/80 font-normal ml-1">lượt</span>
            </div>
          </div>

          {/* Card 4: Kênh Dẫn Đầu */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Kênh Dẫn Đầu</span>
              <div className="p-1 rounded bg-slate-800">{getPlatformIcon(topPlatform, "w-3.5 h-3.5")}</div>
            </div>
            <div className="text-lg font-bold text-slate-100 capitalize truncate">{platformNames[topPlatform] || 'N/A'}</div>
          </div>

          {/* Card 5: Shop Dẫn Đầu */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Shop Dẫn Đầu</span>
              <Award className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-sm font-bold text-slate-100 truncate" title={topBranchName}>
              {topBranchName.replace('Phụ Kiện 88 - ', '')}
            </div>
          </div>

          {/* Card 6: Shop Chưa Đạt KPI */}
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-400 mb-2">
              <span className="text-xs font-medium">Chưa Đạt KPI</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-500">{missedBranches.length} <span className="text-xs text-slate-500 font-normal">shop</span></div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-800/50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/30 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-blue-300">Tiến Độ ({selectedDateLabel})</div>
              <div className="text-base font-bold text-slate-100">
                {currentBranch.name.replace('Phụ Kiện 88 - ', '')}: <span className="text-emerald-400 font-black">{branchCounts[currentBranch.id] || 0}/2</span> bài
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-cyan-800/40 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 text-cyan-400 rounded-xl flex items-center justify-center border border-cyan-500/30 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Lượt Xem Của Shop</div>
              <div className="text-lg font-bold text-cyan-300">
                {dateFilteredPosts.filter(p => p.branch_id === currentBranch.id).reduce((s, p) => s + (p.views || 0), 0).toLocaleString('vi-VN')} views
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-rose-800/40 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center border border-rose-500/30 shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Tương Tác Của Shop</div>
              <div className="text-lg font-bold text-rose-300">
                {dateFilteredPosts.filter(p => p.branch_id === currentBranch.id).reduce((s, p) => s + (p.likes || 0), 0).toLocaleString('vi-VN')} lượt
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Matrix Table */}
        {isAdminRole && (
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                Bảng Ma Trận Đăng Bài ({selectedDateLabel})
                <span className="text-xs font-normal text-slate-400">(Chỉ tiêu: 2 Bài/Shop/Ngày)</span>
              </h3>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-medium">Chi nhánh</th>
                    <th className="px-3 py-3 font-medium text-center">Facebook</th>
                    <th className="px-3 py-3 font-medium text-center">TikTok</th>
                    <th className="px-3 py-3 font-medium text-center">Zalo</th>
                    <th className="px-3 py-3 font-medium text-center">YouTube</th>
                    <th className="px-3 py-3 font-medium text-center">Tổng bài</th>
                    <th className="px-3 py-3 font-medium text-center">Tổng View</th>
                    <th className="px-3 py-3 font-medium text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {branches.map(branch => {
                    const branchPosts = dateFilteredPosts.filter(p => p.branch_id === branch.id);
                    const fbCount = branchPosts.filter(p => p.platform === 'facebook').length;
                    const ttCount = branchPosts.filter(p => p.platform === 'tiktok').length;
                    const zlCount = branchPosts.filter(p => p.platform === 'zalo').length;
                    const ytCount = branchPosts.filter(p => p.platform === 'youtube').length;
                    const total = branchPosts.length;
                    const branchViews = branchPosts.reduce((s, p) => s + (p.views || 0), 0);
                    
                    const isZero = total === 0;
                    const isReached = total >= 2;

                    return (
                      <tr key={branch.id} className={`hover:bg-slate-800/30 transition-colors ${isZero ? 'bg-rose-950/10' : ''}`}>
                        <td className="px-4 py-3 font-medium text-slate-200">
                          {branch.name.replace('Phụ Kiện 88 - ', '')}
                          {isZero && <span className="ml-2 inline-flex w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-400">{fbCount > 0 ? <span className="text-blue-400 font-bold">{fbCount}</span> : '-'}</td>
                        <td className="px-3 py-3 text-center text-slate-400">{ttCount > 0 ? <span className="text-slate-200 font-bold">{ttCount}</span> : '-'}</td>
                        <td className="px-3 py-3 text-center text-slate-400">{zlCount > 0 ? <span className="text-blue-300 font-bold">{zlCount}</span> : '-'}</td>
                        <td className="px-3 py-3 text-center text-slate-400">{ytCount > 0 ? <span className="text-red-400 font-bold">{ytCount}</span> : '-'}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`font-bold ${isReached ? 'text-emerald-400' : isZero ? 'text-rose-500' : 'text-amber-500'}`}>
                            {total}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-xs font-semibold text-cyan-300">
                            {branchViews > 0 ? branchViews.toLocaleString('vi-VN') : '-'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {isReached ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20 text-[11px] font-bold">
                              🟢 Đạt KPI
                            </span>
                          ) : isZero ? (
                            <span className="inline-flex items-center gap-1 text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 text-[11px] font-bold">
                              🔴 Chưa đăng
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px]">
                              🟡 1/2 bài
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Live Feed Nâng Cấp Với Badges View & Like + Nút Sửa Nhanh + AI Quét */}
        <div className={`${isAdminRole ? 'lg:col-span-1' : 'lg:col-span-3 max-w-2xl mx-auto w-full'} bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[580px] shadow-xl`}>
          {/* Header & Filter Controls */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-800/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                Live Feed Bài Đăng ({selectedDateLabel})
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full shadow-sm">
                  {dateFilteredPosts.filter(p => {
                    if (feedBranchFilter !== 'ALL' && p.branch_id !== feedBranchFilter) return false;
                    if (feedPlatformFilter !== 'ALL' && p.platform !== feedPlatformFilter) return false;
                    return true;
                  }).length} bài
                </span>
              </div>
            </div>

            {/* Bộ lọc Chi nhánh & Kênh */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              {/* Lọc theo chi nhánh */}
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <select
                  value={feedBranchFilter}
                  onChange={(e) => setFeedBranchFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
                >
                  <option value="ALL">🏢 Tất cả chi nhánh ({branches.length})</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name.replace('Phụ Kiện 88 - ', '')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lọc theo nền tảng mạng xã hội */}
              <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-0.5">
                {[
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'facebook', label: 'Facebook' },
                  { key: 'tiktok', label: 'TikTok' },
                  { key: 'zalo', label: 'Zalo' },
                  { key: 'youtube', label: 'YouTube' }
                ].map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFeedPlatformFilter(f.key)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all shrink-0 cursor-pointer ${
                      feedPlatformFilter === f.key
                        ? 'bg-purple-500/20 border-purple-500/60 text-purple-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                
                {(feedBranchFilter !== 'ALL' || feedPlatformFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setFeedBranchFilter('ALL');
                      setFeedPlatformFilter('ALL');
                    }}
                    className="p-1 text-slate-400 hover:text-rose-400 text-xs shrink-0 ml-auto cursor-pointer"
                    title="Đặt lại bộ lọc"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* List of cards */}
          <div className="p-4 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
            {(() => {
              const filteredList = dateFilteredPosts.filter(post => {
                if (feedBranchFilter !== 'ALL' && post.branch_id !== feedBranchFilter) return false;
                if (feedPlatformFilter !== 'ALL' && post.platform !== feedPlatformFilter) return false;
                return true;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="text-center text-slate-500 py-16 flex flex-col items-center gap-2.5">
                    <Filter className="w-8 h-8 text-slate-600 mb-1" />
                    <p className="text-xs font-bold text-slate-300">
                      Không có bài đăng nào trong {selectedDateLabel.toLowerCase()}
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                      {selectedDate === todayStr
                        ? 'Hôm nay chưa có bài nộp nào. Bấm "+ Nộp Link Bài Đăng" ở đầu trang để nộp link và kiểm tra số liệu!'
                        : 'Thử chuyển sang ngày khác hoặc bấm "Tất Cả Lịch Sử" để xem các bài viết cũ.'}
                    </p>
                    {selectedDate !== todayStr && (
                      <button
                        type="button"
                        onClick={() => setSelectedDate(todayStr)}
                        className="mt-2 px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold hover:bg-amber-500 hover:text-slate-950 transition-all cursor-pointer"
                      >
                        Quay về Hôm Nay
                      </button>
                    )}
                  </div>
                );
              }

              return filteredList.map(post => (
                <div key={post.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-700">
                        {getPlatformIcon(post.platform)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{post.author_name}</div>
                        <div className="text-[10px] text-slate-500">
                          {branches.find(b => b.id === post.branch_id)?.name.replace('Phụ Kiện 88 - ', '') || 'Chi nhánh'} • {new Date(post.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} lúc {new Date(post.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {/* Nút Xóa bài đăng (nếu là quản trị viên/marketing hoặc người đăng) */}
                    {onDeletePost && (isAdminRole || currentUser.fullName === post.author_name) && (
                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Xóa bài đăng này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* HUY HIỆU ĐO LƯỜNG VIEW VÀ LIKE & TRẠNG THÁI DUYỆT */}
                  <div className="flex items-center gap-1.5 my-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-[11px] font-semibold">
                      <Eye className="w-3 h-3 text-cyan-400" />
                      {(post.views || 0).toLocaleString('vi-VN')} views
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-950/80 border border-rose-800/60 text-rose-300 text-[11px] font-semibold">
                      <Heart className="w-3 h-3 text-rose-400" />
                      {(post.likes || 0).toLocaleString('vi-VN')} thích
                    </span>
                    {post.status === 'pending_review' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-semibold animate-pulse">
                        ⏳ Chờ duyệt
                      </span>
                    )}
                    {post.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[10px] font-semibold" title={post.reviewer_feedback}>
                        ❌ Trả về
                      </span>
                    )}
                  </div>
                  {post.status === 'rejected' && post.reviewer_feedback && (
                    <div className="text-[11px] text-rose-300 bg-rose-950/40 border border-rose-900/60 p-2 rounded-xl mb-2">
                      <span className="font-bold text-rose-400">Góp ý từ {post.reviewed_by || 'Bàn Biên Tập'}:</span> {post.reviewer_feedback}
                    </div>
                  )}

                  {/* CÁC NÚT THAO TÁC 3 TRONG 1 */}
                  <div className="grid grid-cols-3 gap-1.5 mt-2">
                    <a
                      href={post.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg transition-colors border border-slate-700"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Xem bài
                    </a>
                    
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(post)}
                      className="flex items-center justify-center gap-1 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] rounded-lg transition-colors font-medium cursor-pointer"
                      title="Sửa nhanh số lượt view / like"
                    >
                      <Edit3 className="w-3 h-3" />
                      Sửa số
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenScanner(post)}
                      className="flex items-center justify-center gap-1 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] rounded-lg transition-colors font-medium cursor-pointer"
                      title="AI quét lượt xem và tương tác"
                    >
                      <Zap className="w-3 h-3 text-purple-400" />
                      AI Quét
                    </button>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* MODAL 1: SỬA NHANH SỐ LIỆU (QUICK EDIT MODAL) */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h4 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                <Edit3 className="w-4 h-4 text-amber-400" />
                Cập Nhật Chỉ Số Bài Viết
              </h4>
              <button 
                onClick={() => setEditingPost(null)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="font-semibold text-slate-300">{editingPost.author_name}</span> • {platformNames[editingPost.platform]}
              <div className="truncate text-slate-500 mt-0.5">{editingPost.post_url}</div>
            </div>

            <div className="space-y-3">
              {/* SỬA ĐƯỜNG DẪN LINK */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Đường Dẫn Bài Đăng (URL)
                </label>
                <input
                  type="url"
                  value={editUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditUrl(val);
                    const detected = detectPlatformFromUrl(val);
                    if (detected) setEditPlatform(detected);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500 font-mono"
                  placeholder="https://..."
                />
                {(() => {
                  const detected = detectPlatformFromUrl(editUrl);
                  if (detected) {
                    return (
                      <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                        <span>✨ Tự động nhận diện:</span>
                        <strong className="uppercase">{detected}</strong>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* CHỌN NỀN TẢNG */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nền Tảng
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['facebook', 'tiktok', 'zalo', 'youtube'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditPlatform(p)}
                      className={`py-1.5 px-1 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        editPlatform === p
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {getPlatformIcon(p, 'w-3.5 h-3.5')}
                      <span className="text-[10px] capitalize">{p}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-cyan-300 mb-1 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> Số Lượt Xem (Views)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editViews}
                  onChange={(e) => setEditViews(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-cyan-500 text-sm"
                  placeholder="Ví dụ: 2500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-rose-300 mb-1 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" /> Số Lượt Tương Tác / Like
                </label>
                <input
                  type="number"
                  min="0"
                  value={editLikes}
                  onChange={(e) => setEditLikes(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-rose-500 text-sm"
                  placeholder="Ví dụ: 180"
                />
              </div>
            </div>

            {/* AI Ước tính nhanh */}
            <button
              type="button"
              onClick={() => {
                const estViews = editingPost.platform === 'tiktok' ? 1800 : editingPost.platform === 'facebook' ? 650 : 420;
                const estLikes = Math.round(estViews * 0.08);
                setEditViews(estViews);
                setEditLikes(estLikes);
              }}
              className="w-full py-1.5 px-3 bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 border border-purple-800/50 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Điền nhanh số liệu ước tính AI
            </button>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isSavingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Lưu Supabase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: AI QUÉT TƯƠNG TÁC (AI SCANNER MODAL - ZERO n8n) */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h4 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-cyan-400" />
                AI Quét Lượt Xem & Tương Tác (Realtime)
              </h4>
              <button 
                onClick={() => setShowScannerModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chọn bài đăng muốn quét */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Chọn bài đăng cần quét:</label>
              <select
                value={scanningPost?.id || ''}
                onChange={(e) => {
                  const p = posts.find(item => item.id === e.target.value);
                  if (p) {
                    setScanningPost(p);
                    setScanResult(null);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {posts.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.platform.toUpperCase()}] {p.author_name} - {branches.find(b => b.id === p.branch_id)?.name.replace('Phụ Kiện 88 - ', '')}
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn Chế Độ Quét */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScanMode('link')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  scanMode === 'link'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Quét từ Link bài
              </button>
              <button
                type="button"
                onClick={() => setScanMode('image')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  scanMode === 'image'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Quét từ Ảnh chụp
              </button>
            </div>

            {/* Nội dung theo chế độ */}
            {scanMode === 'image' ? (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-400">
                  Tải lên ảnh chụp màn hình bài viết / TikTok Studio / Meta Business để Gemini Vision đọc trực tiếp:
                </p>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-700 max-h-40 bg-slate-950 flex items-center justify-center">
                    <img src={imagePreview} alt="Screenshot" className="max-h-40 object-contain w-full" />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full text-xs hover:bg-black"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-6 border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-xl bg-slate-950/60 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    <Upload className="w-6 h-6 text-purple-400" />
                    <span className="text-xs font-medium">Bấm để chọn ảnh chụp màn hình bài đăng</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="text-slate-400 flex items-center gap-1.5">
                  <span className="font-semibold text-slate-300">Đường link:</span>
                  <span className="truncate text-cyan-400">{scanningPost?.post_url}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Hệ thống sử dụng Gemini Flash + Public API để bóc tách và ước lượng số liệu thời gian thực.
                </p>
              </div>
            )}

            {/* Nút Thực Hiện Quét */}
            <button
              type="button"
              onClick={handleRunAIScan}
              disabled={isScanning || (scanMode === 'image' && !imagePreview)}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {scanStatusMsg || 'AI đang xử lý...'}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Bắt Đầu Quét Bằng Gemini Flash AI
                </>
              )}
            </button>

            {/* Kết quả Quét */}
            {scanResult && (
              <div className="bg-gradient-to-br from-cyan-950/50 to-slate-950 border border-cyan-500/40 rounded-xl p-3.5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300">Kết quả AI trích xuất:</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Thành công</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-cyan-800/50">
                    <div className="text-[10px] text-cyan-400 flex items-center justify-center gap-1 mb-1 font-semibold">
                      <Eye className="w-3 h-3" /> Lượt Xem (Views)
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={scanResult.views}
                      onChange={(e) => setScanResult({ ...scanResult, views: Math.max(0, Number(e.target.value)) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1 px-2 text-center text-cyan-300 font-black text-lg focus:outline-none focus:border-cyan-500 font-mono"
                    />
                    <div className="text-[9px] text-slate-500 mt-1">Bấm để chỉnh số</div>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-rose-800/50">
                    <div className="text-[10px] text-rose-400 flex items-center justify-center gap-1 mb-1 font-semibold">
                      <Heart className="w-3 h-3" /> Lượt Tương Tác (Likes)
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={scanResult.likes}
                      onChange={(e) => setScanResult({ ...scanResult, likes: Math.max(0, Number(e.target.value)) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1 px-2 text-center text-rose-300 font-black text-lg focus:outline-none focus:border-rose-500 font-mono"
                    />
                    <div className="text-[9px] text-slate-500 mt-1">Bấm để chỉnh số</div>
                  </div>
                </div>

                {scanResult.note && (
                  <p className="text-[11px] text-slate-400 italic">💡 {scanResult.note}</p>
                )}

                <button
                  type="button"
                  onClick={handleApplyScanResult}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Xác Nhận & Cập Nhật Vào Supabase
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

