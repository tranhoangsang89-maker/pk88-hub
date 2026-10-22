import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Target, 
  Award, 
  Users, 
  MessageSquare, 
  PhoneCall, 
  Store, 
  Smile, 
  HandHeart,
  TrendingUp,
  FileText,
  SlidersHorizontal,
  X,
  Share2
} from 'lucide-react';
import { Staff } from '../types';

interface CultureHandbookViewProps {
  currentUser?: Staff | null;
}

interface SlidePage {
  pageNumber: number;
  category: string;
  title: string;
  subtitle?: string;
  quote?: string;
  badge?: string;
  type: 'cover' | 'history' | 'vision' | 'mission' | 'core_values' | 'qualities' | 'five_benefits' | 'commitments' | 'customer_rules' | 'language_transform' | 'internal_comms' | 'mentorship' | 'digital_rules' | 'discipline' | 'closing';
}

const PAGES_DATA: SlidePage[] = [
  {
    pageNumber: 1,
    category: 'CẨM NANG ĐÀO TẠO NỘI BỘ',
    title: 'Văn Hóa Doanh Nghiệp & Qui Tắc Ứng Xử',
    subtitle: 'Làm nghề bằng cả trái tim, tiên phong kiến tạo chuẩn mực phụ kiện & chăm sóc điện thoại tử tế.',
    quote: 'Hành Trình Kiến Tạo Vị Thế Mới • Hệ Thống Bán Lẻ & Chăm Sóc Điện Thoại',
    badge: 'PHỤC VỤ TỪ TRÁI TIM',
    type: 'cover'
  },
  {
    pageNumber: 2,
    category: 'KHỞI NGUỒN PHÁT TRIỂN',
    title: 'Từ Tiệm Nhỏ Đến Hệ Thống Phụ Kiện Tử Tế',
    subtitle: 'Giai đoạn 2020 – Hiện tại: Giữ trọn ngọn lửa đam mê từ ngày đầu mở tiệm',
    type: 'history'
  },
  {
    pageNumber: 3,
    category: 'ĐỊNH HƯỚNG CHIẾN LƯỢC',
    title: 'Tầm Nhìn Đến Năm 2030: SỐ 1 Miền Tây',
    subtitle: 'Xây dựng mạng lưới cửa hàng phủ rộng khắp các tỉnh thành Tây Nam Bộ với chất lượng phục vụ đồng bộ, đáng tin cậy.',
    badge: 'MỤC TIÊU 2030',
    type: 'vision'
  },
  {
    pageNumber: 4,
    category: 'MỤC ĐÍCH TỒN TẠI',
    title: 'Sứ Mệnh Tiên Phong Chuẩn Mực Mới',
    quote: 'Phụ Kiện 88 tiên phong xây dựng chuẩn mực mới cho ngành phụ kiện & chăm sóc điện thoại, với dịch vụ chuyên nghiệp, phục vụ tận tâm và minh bạch trong mọi giao dịch.',
    type: 'mission'
  },
  {
    pageNumber: 5,
    category: 'NỀN TẢNG ĐẠO ĐỨC',
    title: '5 Giá Trị Cốt Lõi Hệ Thống',
    subtitle: 'La bàn định hướng mọi suy nghĩ và hành động của từng thành viên Phụ Kiện 88',
    type: 'core_values'
  },
  {
    pageNumber: 6,
    category: 'CHÂN DUNG CON NGƯỜI',
    title: '5 Phẩm Chất Nhân Sự Phụ Kiện 88',
    subtitle: '5 lời tuyên thệ hành động mỗi ngày của đội ngũ phụng sự',
    type: 'qualities'
  },
  {
    pageNumber: 7,
    category: 'MÔ HÌNH PHÁT TRIỂN BỀN VỮNG',
    title: 'Triết Lý Ngũ Lợi Hài Hòa',
    subtitle: 'Kim chỉ nam cho mọi quyết định kinh doanh và đối nhân xử thế',
    type: 'five_benefits'
  },
  {
    pageNumber: 8,
    category: 'CHẤT LƯỢNG ĐI ĐẦU',
    title: '5 Cam Kết Vàng Với Khách Hàng',
    subtitle: 'Lời hứa danh dự của từng chuyên viên bán lẻ & kỹ thuật viên',
    type: 'commitments'
  },
  {
    pageNumber: 9,
    category: 'QUY CHUẨN GIAO TIẾP I',
    title: 'Ứng Xử Chuẩn Mực Với Khách Hàng',
    badge: 'KPI: Chào khách trong 5 giây đầu',
    subtitle: 'Mỉm cười niềm nở, tôn trọng và tuyệt đối không cãi lý hay cợt nhả',
    type: 'customer_rules'
  },
  {
    pageNumber: 10,
    category: 'KỸ NĂNG TƯ VẤN BÁN HÀNG',
    title: 'Chuyển Ngôn Từ Tiêu Cực Thành Tích Cực',
    subtitle: 'Bảng đối chiếu chuẩn mực giao tiếp giữ chân khách hàng',
    type: 'language_transform'
  },
  {
    pageNumber: 11,
    category: 'QUY CHUẨN GIAO TIẾP II',
    title: 'Giao Tiếp Hai Chiều & Tôn Trọng Nội Bộ',
    subtitle: 'Văn hóa ứng xử văn minh giữa Cấp Trên và Cấp Dưới',
    type: 'internal_comms'
  },
  {
    pageNumber: 12,
    category: 'PHÁT TRIỂN ĐỘI NGŨ',
    title: 'Đồng Hành & Hướng Dẫn Thực Chiến',
    subtitle: 'Kèm cặp 1-1 tận nơi, chuẩn hóa tay nghề và môi trường không giấu nghề',
    type: 'mentorship'
  },
  {
    pageNumber: 13,
    category: 'CHUẨN MỰC KÊNH SỐ',
    title: 'Giao Tiếp Online & Giải Quyết Tranh Chấp',
    subtitle: 'Quy tắc ứng xử trên mạng xã hội, tin nhắn, hotline và giải quyết mâu thuẫn',
    type: 'digital_rules'
  },
  {
    pageNumber: 14,
    category: 'ĐẢM BẢO THỰC THI',
    title: 'Hệ Thống Đo Lường & Chế Tài Kỷ Luật',
    subtitle: 'Giám sát 360° và quy trình xử lý vi phạm lũy tiến 4 bước minh bạch',
    type: 'discipline'
  },
  {
    pageNumber: 15,
    category: 'CHUNG TAY KIẾN TẠO VĂN HÓA',
    title: 'Phục Vụ Từ Trái Tim',
    quote: 'Mỗi nhân viên là một đại sứ mang lại giá trị trọn vẹn cho khách hàng',
    badge: 'VỮNG VÀNG TẦM NHÌN 2030',
    type: 'closing'
  }
];

export const CultureHandbookView: React.FC<CultureHandbookViewProps> = ({ currentUser }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'slide' | 'full'>('slide');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showTocMobile, setShowTocMobile] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const currentPage = PAGES_DATA[currentPageIndex];
  const totalPages = PAGES_DATA.length;

  // Lọc tìm kiếm theo từ khóa
  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return PAGES_DATA;
    const q = searchQuery.toLowerCase().trim();
    return PAGES_DATA.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q) ||
      (p.subtitle && p.subtitle.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Hỗ trợ phím mũi tên bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'slide') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentPageIndex(prev => Math.min(prev + 1, totalPages - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentPageIndex(prev => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, totalPages]);

  // Hỗ trợ sao chép link
  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'van-hoa');
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* Header Banner - Tông Đen Vàng Gold Sang Trọng */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border border-amber-500/30 p-5 md:p-7 shadow-2xl shadow-amber-500/5">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 animate-pulse" />
              <span>Phục Vụ Từ Trái Tim • Cẩm Nang 2026 - 2030</span>
            </div>
            
            <h1 className="text-xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Văn Hóa & Qui Tắc Ứng Xử</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                Phụ Kiện 88
              </span>
            </h1>

            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Làm nghề bằng cả trái tim, tiên phong kiến tạo chuẩn mực phụ kiện & chăm sóc điện thoại tử tế tại toàn bộ 7 chi nhánh.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Chuyển chế độ xem */}
            <div className="inline-flex p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('slide')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'slide'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Trình Chiếu (Slide)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('full')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'full'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Đọc Liền Mạch</span>
              </button>
            </div>

            {/* Nút Tải PDF */}
            <a
              href="/van-hoa-pk88.pdf"
              download="Van_Hoa_Qui_Tac_Ung_Xu_Phu_Kien_88_FINAL.pdf"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Tải tệp PDF gốc 15 trang chuẩn in ấn"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Tải PDF Gốc</span>
              <span className="sm:hidden">Tải PDF</span>
            </a>

            {/* Nút Chia sẻ link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all cursor-pointer"
              title="Sao chép liên kết cẩm nang"
            >
              {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Search Bar & Quick Jump Chips */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm: Chào khách 5s, Ngũ lợi, Kỷ luật 4 bước, hết hàng..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Jump Dropdown / Button on Mobile */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 hidden sm:inline">Trang:</span>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
              {[
                { idx: 2, label: 'Tầm Nhìn' },
                { idx: 4, label: '5 Giá Trị' },
                { idx: 6, label: 'Ngũ Lợi' },
                { idx: 8, label: 'Chào 5s' },
                { idx: 9, label: 'Đổi Câu Từ' },
                { idx: 13, label: 'Kỷ Luật 4 Bước' }
              ].map(chip => (
                <button
                  key={chip.idx}
                  type="button"
                  onClick={() => {
                    setCurrentPageIndex(chip.idx);
                    if (viewMode === 'full') {
                      const el = document.getElementById(`page-card-${chip.idx + 1}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-all cursor-pointer ${
                    currentPageIndex === chip.idx
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: 2 Chế Độ */}
      {viewMode === 'slide' ? (
        /* ================= CHẾ ĐỘ TRÌNH CHIẾU SLIDE ================= */
        <div className="space-y-4">
          {/* Slide Stage Container */}
          <div className="relative bg-slate-950 border border-slate-800/90 rounded-3xl p-5 md:p-8 shadow-2xl min-h-[460px] md:min-h-[520px] flex flex-col justify-between overflow-hidden">
            {/* Watermark Logo PK88 Background */}
            <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none select-none">
              <span className="text-8xl md:text-9xl font-black text-amber-400">88</span>
            </div>

            {/* Slide Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-black uppercase tracking-wider">
                  Trang {currentPage.pageNumber} / {totalPages}
                </span>
                <span className="text-xs font-bold text-slate-400 hidden sm:inline">
                  • {currentPage.category}
                </span>
              </div>

              {currentPage.badge && (
                <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-black animate-pulse">
                  {currentPage.badge}
                </span>
              )}
            </div>

            {/* Slide Body Content */}
            <div className="flex-1 flex flex-col justify-center py-2">
              <SlideContentRenderer page={currentPage} />
            </div>

            {/* Slide Bottom Controls (Thumb-Friendly on Mobile) */}
            <div className="border-t border-slate-800/80 pt-4 mt-4 flex items-center justify-between gap-3">
              {/* Nút Lùi */}
              <button
                type="button"
                onClick={() => setCurrentPageIndex(prev => Math.max(prev - 1, 0))}
                disabled={currentPageIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-black text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Trang trước</span>
                <span className="sm:hidden">Lùi</span>
              </button>

              {/* Progress Indicators */}
              <div className="flex items-center gap-1 max-w-[200px] sm:max-w-md overflow-x-auto no-scrollbar px-2">
                {PAGES_DATA.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentPageIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentPageIndex === idx
                        ? 'w-6 bg-gradient-to-r from-amber-400 to-amber-500'
                        : 'w-2 bg-slate-800 hover:bg-slate-700'
                    }`}
                    title={`Đến trang ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Nút Tiến */}
              <button
                type="button"
                onClick={() => setCurrentPageIndex(prev => Math.min(prev + 1, totalPages - 1))}
                disabled={currentPageIndex === totalPages - 1}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-xs font-black text-slate-950 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <span className="hidden sm:inline">Trang sau</span>
                <span className="sm:hidden">Tiếp</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ================= CHẾ ĐỘ ĐỌC LIỀN MẠCH (FULL READING) ================= */
        <div className="space-y-6">
          {filteredPages.map((page) => (
            <div
              key={page.pageNumber}
              id={`page-card-${page.pageNumber}`}
              className="bg-slate-950 border border-slate-800/90 rounded-3xl p-5 md:p-8 shadow-xl transition-all hover:border-amber-500/30"
            >
              {/* Page Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-black">
                    {page.pageNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {page.category}
                  </span>
                </div>
                {page.badge && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-black">
                    {page.badge}
                  </span>
                )}
              </div>

              {/* Page Content */}
              <SlideContentRenderer page={page} />
            </div>
          ))}
        </div>
      )}

      {/* Footer Ghi Chú & Tải Về */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 text-center space-y-2">
        <p className="text-xs text-slate-400">
          Cẩm nang này là tài sản đào tạo độc quyền của <strong className="text-amber-400">Hệ Thống Phụ Kiện 88</strong>. Toàn thể nhân viên tại 7 chi nhánh có trách nhiệm nắm vững và thực thi nghiêm túc trong mọi ca làm việc.
        </p>
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <span>• Phiên bản 2026 FINAL</span>
          <span>• Tầm nhìn 2030</span>
          <span>• 7 Chi Nhánh Chuẩn Hóa</span>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* COMPONENT CON: RENDER NỘI DUNG TỪNG TRANG THEO TYPE                       */
/* ========================================================================= */

const SlideContentRenderer: React.FC<{ page: SlidePage }> = ({ page }) => {
  switch (page.type) {
    case 'cover':
      return (
        <div className="text-center space-y-5 py-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 shadow-2xl shadow-amber-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
              <Heart className="w-10 h-10 text-amber-400 fill-amber-400/20 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black tracking-widest text-amber-400 uppercase">
              HỆ THỐNG BÁN LẺ & CHĂM SÓC ĐIỆN THOẠI
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              Văn Hóa Doanh Nghiệp & Qui Tắc Ứng Xử
            </h2>
            <p className="text-sm md:text-base text-amber-200/90 font-medium max-w-xl mx-auto italic">
              "Làm nghề bằng cả trái tim, tiên phong kiến tạo chuẩn mực phụ kiện & chăm sóc điện thoại tử tế."
            </p>
          </div>

          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
            <span>🏛️ 7 Chi Nhánh Miền Tây</span>
            <span>•</span>
            <span>📱 Phục Vụ Tử Tế</span>
            <span>•</span>
            <span>✨ Hành Trình Vươn Xa</span>
          </div>
        </div>
      );

    case 'history':
      return (
        <div className="space-y-5">
          <div className="space-y-1">
            <h3 className="text-xl md:text-2xl font-black text-white">Từ Tiệm Nhỏ Đến Hệ Thống Phụ Kiện Tử Tế</h3>
            <p className="text-xs md:text-sm text-slate-400">Giai đoạn 2020 – Hiện tại</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center font-black">
                ❤️
              </div>
              <h4 className="text-sm font-black text-amber-300">Làm nghề từ trái tim</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Phụ kiện không chỉ để bán lẻ, mà là cách phục vụ khách hàng tận tụy như người thân trong gia đình.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
                🔍
              </div>
              <h4 className="text-sm font-black text-amber-300">Chăm chút từng chi tiết</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Từng miếng dán kính, sợi cáp sạc đều được kiểm tra tỉ mỉ trước khi đến tay người tiêu dùng.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-black">
                🚀
              </div>
              <h4 className="text-sm font-black text-amber-300">Khát vọng vươn tầm</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Không ngừng mở rộng chi nhánh nhưng luôn giữ trọn cam kết phụ kiện chuẩn mực.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
            💡 <em>Dù mở rộng bao nhiêu cửa hàng, xuất phát điểm "Tử Tế - Chăm Chút - Tận Tụy" vẫn là cốt lõi bất di bất dịch của PK88.</em>
          </div>
        </div>
      );

    case 'vision':
      return (
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">ĐỊNH HƯỚNG CHIẾN LƯỢC</span>
            <h3 className="text-xl md:text-3xl font-black text-white">Tầm Nhìn Đến Năm 2030</h3>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border border-amber-500/40 space-y-3">
            <div className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
              SỐ 1
            </div>
            <h4 className="text-lg md:text-xl font-black text-white">
              Hệ Thống Bán Lẻ & Chăm Sóc Điện Thoại Miền Tây
            </h4>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Xây dựng mạng lưới cửa hàng phủ rộng khắp các tỉnh thành Tây Nam Bộ với chất lượng phục vụ đồng bộ, đáng tin cậy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <h5 className="text-xs font-black text-amber-400 uppercase tracking-wide">📍 Phủ Sóng Mạnh Mẽ</h5>
              <p className="text-xs text-slate-300">Hiện diện tại trung tâm các đô thị trọng điểm khu vực miền Tây.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <h5 className="text-xs font-black text-emerald-400 uppercase tracking-wide">✨ Dịch Vụ Đồng Bộ</h5>
              <p className="text-xs text-slate-300">Chất lượng chuẩn mực tại mọi điểm chạm, đem đến trải nghiệm như một.</p>
            </div>
          </div>
        </div>
      );

    case 'mission':
      return (
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">MỤC ĐÍCH TỒN TẠI</span>
            <h3 className="text-xl md:text-2xl font-black text-white">Sứ Mệnh Tiên Phong Chuẩn Mực Mới</h3>
          </div>

          <blockquote className="p-5 rounded-2xl bg-slate-900/90 border-l-4 border-amber-400 text-sm md:text-base text-amber-100 font-medium italic leading-relaxed">
            "{page.quote}"
          </blockquote>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="text-amber-400 text-lg">🏆</div>
              <h4 className="text-xs font-black text-white">Dịch Vụ Chuyên Nghiệp</h4>
              <p className="text-xs text-slate-400">Kỹ thuật tay nghề bài bản cùng tác phong chuẩn hóa.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="text-rose-400 text-lg">❤️</div>
              <h4 className="text-xs font-black text-white">Phục Vụ Tận Tâm</h4>
              <p className="text-xs text-slate-400">Chu đáo, chân tình và coi khách hàng như người nhà.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="text-cyan-400 text-lg">⚖️</div>
              <h4 className="text-xs font-black text-white">Minh Bạch Mọi Giao Dịch</h4>
              <p className="text-xs text-slate-400">Báo giá chính xác, tư vấn trung thực theo nhu cầu thực tế.</p>
            </div>
          </div>
        </div>
      );

    case 'core_values':
      return (
        <div className="space-y-5">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">NỀN TẢNG ĐẠO ĐỨC</span>
            <h3 className="text-xl md:text-2xl font-black text-white">5 Giá Trị Cốt Lõi Hệ Thống</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { num: '01', title: 'Trung Thực', desc: 'Ngay thẳng trong tư vấn giá và linh kiện phụ kiện.', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
              { num: '02', title: 'Trách Nhiệm', desc: 'Chịu trách nhiệm đến cùng với mọi máy móc của khách.', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
              { num: '03', title: 'Tận Tâm', desc: 'Lắng nghe và hết lòng hỗ trợ trong mọi tình huống.', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
              { num: '04', title: 'Tỉ Mỉ', desc: 'Cẩn trọng từng góc cạnh màn hình và mạch sạc.', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
              { num: '05', title: 'Tư Duy Cải Tiến', desc: 'Chủ động học hỏi sản phẩm mới và nâng cao năng suất phục vụ.', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10', full: true }
            ].map(item => (
              <div 
                key={item.num}
                className={`p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 ${item.full ? 'sm:col-span-2 md:col-span-1' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-lg border text-xs font-black ${item.color}`}>
                    {item.num}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">GIÁ TRỊ</span>
                </div>
                <h4 className="text-sm font-black text-white">{item.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'qualities':
      return (
        <div className="space-y-5">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">CHÂN DUNG CON NGƯỜI</span>
            <h3 className="text-xl md:text-2xl font-black text-white">5 Phẩm Chất Nhân Sự Phụ Kiện 88</h3>
          </div>

          <div className="space-y-2.5">
            {[
              { num: '01', title: 'Tôi Tận Tâm', desc: 'Hết lòng vì sự hài lòng của khách hàng.' },
              { num: '02', title: 'Tôi Chủ Động', desc: 'Tự giác trong công việc, không chờ đợi nhắc nhở.' },
              { num: '03', title: 'Tôi Trách Nhiệm', desc: 'Nhận lỗi khi sai sót và cam kết khắc phục ngay.' },
              { num: '04', title: 'Tôi Kỷ Luật', desc: 'Tuân thủ nghiêm ngặt giờ giấc và quy trình cửa hàng.' },
              { num: '05', title: 'Tôi Tôn Trọng – Đoàn Kết', desc: 'Hỗ trợ đồng nghiệp và cùng nhau phát triển tập thể.' }
            ].map(q => (
              <div 
                key={q.num}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all"
              >
                <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-black shrink-0">
                  {q.num}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-white">{q.title}</h4>
                  <p className="text-xs text-slate-300 truncate">{q.desc}</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'five_benefits':
      return (
        <div className="space-y-5">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">MÔ HÌNH PHÁT TRIỂN BỀN VỮNG</span>
            <h3 className="text-xl md:text-2xl font-black text-white">Triết Lý Ngũ Lợi Hài Hòa</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { target: '01', name: 'Lợi Khách Hàng', desc: 'Sản phẩm chất lượng cao, trải nghiệm dịch vụ xứng đáng.', icon: '🛍️' },
              { target: '02', name: 'Lợi Nhân Viên', desc: 'Môi trường làm việc ổn định, lộ trình thu nhập xứng đáng.', icon: '💼' },
              { target: '03', name: 'Lợi Đối Tác', desc: 'Hợp tác minh bạch, công bằng và đồng hành lâu dài.', icon: '🤝' },
              { target: '04', name: 'Lợi Xã Hội', desc: 'Lan tỏa năng lượng tích cực và các giá trị kinh doanh tử tế.', icon: '🌏' },
              { target: '05', name: 'Lợi Bản Thân', desc: 'Hệ thống phát triển bền vững, người làm nghề an tâm.', icon: '🌱', full: true }
            ].map(b => (
              <div 
                key={b.target}
                className={`p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 ${b.full ? 'sm:col-span-2 md:col-span-1' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{b.icon}</span>
                  <span className="text-xs font-bold text-amber-400">ĐỐI TƯỢNG {b.target}</span>
                </div>
                <h4 className="text-sm font-black text-white">{b.name}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 text-center">
            ❤️ <em>Một việc làm chỉ được coi là thành công tại Phụ Kiện 88 khi nó mang lại lợi ích hài hòa cho cả 5 đối tượng trên.</em>
          </div>
        </div>
      );

    case 'commitments':
      return (
        <div className="space-y-5">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">CHẤT LƯỢNG ĐI ĐẦU</span>
            <h3 className="text-xl md:text-2xl font-black text-white">5 Cam Kết Vàng Với Khách Hàng</h3>
          </div>

          <div className="space-y-2.5">
            {[
              { num: '1', title: 'Phục Vụ – Tận Tâm', desc: 'Đón tiếp chu đáo, tư vấn trọn vẹn từ lúc vào đến khi rời tiệm.', icon: '❤️' },
              { num: '2', title: 'Dán Máy – Tỉ Mỉ', desc: 'Từng góc cạnh màn hình không bám bụi, đạt độ thẩm mỹ cao nhất.', icon: '📱' },
              { num: '3', title: 'Tư Vấn – Chân Thành', desc: 'Đề xuất đúng dòng sản phẩm khách thực sự cần, không ép mua.', icon: '🤝' },
              { num: '4', title: 'Giá Cả – Minh Bạch', desc: 'Bảng giá rõ ràng từng hạng mục linh kiện và dịch vụ chăm sóc.', icon: '🏷️' },
              { num: '5', title: 'Bảo Hành – Nhanh Chóng', desc: 'Quy trình giải quyết bảo hành cấp tốc, không gây phiền hà.', icon: '⚡' }
            ].map(c => (
              <div 
                key={c.num}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800"
              >
                <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-black shrink-0">
                  {c.num}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                    <span>{c.icon}</span>
                    <span>{c.title}</span>
                  </h4>
                  <p className="text-xs text-slate-300">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'customer_rules':
      return (
        <div className="space-y-5">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">QUY CHUẨN GIAO TIẾP I</span>
            <h3 className="text-xl md:text-2xl font-black text-white">Ứng Xử Chuẩn Mực Với Khách Hàng</h3>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-between">
            <span className="text-xs font-black text-amber-300">⏱️ KPI BẮT BUỘC TẠI CỬA HÀNG:</span>
            <span className="text-xs font-black text-white bg-amber-500 px-3 py-1 rounded-xl text-slate-950">
              Chào khách trong 5 giây đầu
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tiêu chuẩn bắt buộc */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
              <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Tiêu Chuẩn Bắt Buộc</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Lời chào:</strong> Mỉm cười niềm nở, mở lời bằng <em>"Dạ, Em chào anh/chị"</em>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Kính ngữ:</strong> Luôn kèm <em>"Cảm ơn", "Xin lỗi"</em> đúng lúc và đúng mực.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span><strong>Giữ khoảng cách:</strong> Tôn trọng không gian riêng, xin phép khi chạm đồ khách.</span>
                </li>
              </ul>
            </div>

            {/* Nghiêm cấm vi phạm */}
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2.5">
              <h4 className="text-xs font-black text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Nghiêm Cấm Vi Phạm</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span><strong>Thái độ cợt nhả:</strong> Tuyệt đối không đùa cợt dù là khách quen hay bạn bè.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span><strong>Tranh cãi:</strong> Cấm cãi lý, đổ lỗi hoặc tỏ thái độ hơn thua với khách.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span><strong>Từ chối tiêu cực:</strong> Cấm buông câu <em>"Hết hàng", "Chị đi chỗ khác mua đi"</em>.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      );

    case 'language_transform':
      return (
        <div className="space-y-5">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">KỸ NĂNG TƯ VẤN BÁN HÀNG</span>
            <h3 className="text-xl md:text-2xl font-black text-white">Chuyển Ngôn Từ Tiêu Cực Thành Tích Cực</h3>
            <p className="text-xs text-slate-400">Cách giao tiếp khéo léo giữ chân khách hàng và tạo cảm tình trọn vẹn</p>
          </div>

          <div className="space-y-3">
            {[
              {
                bad: '"Cái này bên em không có"',
                good: '"Dạ, mẫu đó hiện em vừa hết, em mời anh/chị xem thử mẫu này tương tự ạ"'
              },
              {
                bad: '"Không biết"',
                good: '"Dạ anh/chị chờ em 30 giây để em kiểm tra thông tin chính xác nhất ạ"'
              },
              {
                bad: '"Hết hàng rồi, qua chỗ khác mua đi"',
                good: '"Dạ mẫu này dự kiến mai về thêm, hoặc em kiểm tra chi nhánh gần nhất ship ngay cho mình nhé"'
              }
            ].map((pair, idx) => (
              <div 
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800"
              >
                {/* Cách nói cần loại bỏ */}
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-black text-rose-400 uppercase">
                    <X className="w-3.5 h-3.5" />
                    <span>Cần loại bỏ</span>
                  </div>
                  <p className="text-xs font-bold text-rose-200 line-through opacity-80">{pair.bad}</p>
                </div>

                {/* Chuẩn mực PK88 */}
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-400 uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Chuẩn mực Phụ Kiện 88</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-200">{pair.good}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'internal_comms':
      return (
        <div className="space-y-5">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">QUY CHUẨN GIAO TIẾP II</span>
            <h3 className="text-xl md:text-2xl font-black text-white">Giao Tiếp Hai Chiều & Tôn Trọng Nội Bộ</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cấp dưới với cấp trên */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
              <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                <span>⬆️ Cấp Dưới Với Cấp Trên</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Thưa gửi rõ ràng:</strong> Bắt đầu bằng "Dạ", "Thưa", "Báo cáo" khi trình bày.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Góp ý có văn hóa:</strong> Ngôn từ cầu thị, tránh gay gắt hay đôi co.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span><strong>Không chống đối:</strong> Phản hồi có số liệu, không bỏ ngang khi bị nhắc nhở.</span>
                </li>
              </ul>
            </div>

            {/* Cấp trên với cấp dưới */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                <span>⬇️ Cấp Trên Với Cấp Dưới</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>Làm gương mẫu mực:</strong> Tiên phong về giờ giấc, chuẩn tác phong và lời nói.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>Góp ý tôn trọng:</strong> Tuyệt đối không quát tháo, xúc phạm nhân viên.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span><strong>Khen ngợi kịp thời:</strong> Ghi nhận nỗ lực tốt, chỉ xử lý lỗi theo quy trình kín.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      );

    case 'mentorship':
      return (
        <div className="space-y-5">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">PHÁT TRIỂN ĐỘI NGŨ</span>
            <h3 className="text-xl md:text-2xl font-black text-white">Đồng Hành & Hướng Dẫn Thực Chiến</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="text-2xl">👥</div>
              <h4 className="text-sm font-black text-amber-300">Kèm Cặp 1 - 1 Tận Nơi</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Quản lý và tiền bối luôn sát cánh cầm tay chỉ việc cho nhân sự mới trong suốt giai đoạn thử việc.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="text-2xl">🛠️</div>
              <h4 className="text-sm font-black text-cyan-300">Chuẩn Hóa Kỹ Năng Kỹ Thuật</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Đào tạo tỉ mỉ từ thao tác dán film, test máy đến xử lý phụ kiện lỗi không để xảy ra sai sót.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="text-2xl">🤝</div>
              <h4 className="text-sm font-black text-emerald-300">Môi Trường Không Giấu Nghề</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Khuyến khích chia sẻ kinh nghiệm xử lý ca khó để cùng nâng cao tay nghề toàn chuỗi.
              </p>
            </div>
          </div>
        </div>
      );

    case 'digital_rules':
      return (
        <div className="space-y-5">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">CHUẨN MỰC KÊNH SỐ</span>
            <h3 className="text-xl md:text-2xl font-black text-white">Giao Tiếp Online & Giải Quyết Tranh Chấp</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
              <h4 className="text-xs font-black text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                <span>Kênh Online & Hotline</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">•</span>
                  <span>Tin nhắn đầy đủ câu chữ, tuyệt đối không dùng icon/emoji thay lời.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">🚫</span>
                  <span><strong>Cấm "seen" tin nhắn</strong> của khách hoặc đồng nghiệp mà không phản hồi.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">•</span>
                  <span>Khi gọi điện: xưng hô đúng, giọng rõ ràng, tránh môi trường ồn ào.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Nguyên Tắc Giải Quyết Mâu Thuẫn</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Báo cáo quản lý trực tiếp, không tự ý đôi co gây ảnh hưởng cửa hàng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Không bàn tán hoặc lan truyền các thông tin nội bộ chưa kiểm chứng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">🚫</span>
                  <span><strong>Nghiêm cấm:</strong> Sử dụng MXH cá nhân để công kích nhau hay công ty.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      );

    case 'discipline':
      return (
        <div className="space-y-5">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">ĐẢM BẢO THỰC THI</span>
            <h3 className="text-xl md:text-2xl font-black text-white">Hệ Thống Đo Lường & Chế Tài Kỷ Luật</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <h5 className="text-xs font-black text-amber-400">📹 Giám Sát Khách Hàng</h5>
              <p className="text-xs text-slate-300">Kiểm tra định kỳ qua camera, khách hàng bí mật (mystery shopper) và khảo sát dịch vụ.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <h5 className="text-xs font-black text-cyan-400">📊 Đánh Giá Nội Bộ 360°</h5>
              <p className="text-xs text-slate-300">Bảng điểm KPI hàng tháng kết hợp phản hồi chéo giữa cấp trên, đồng nghiệp và cấp dưới.</p>
            </div>
          </div>

          {/* 4 Bước Kỷ Luật Lũy Tiến */}
          <div className="space-y-2">
            <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              QUY TRÌNH XỬ LÝ VI PHẠM LŨY TIẾN (4 BƯỚC):
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { step: '1', title: 'Nhắc Nhở', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
                { step: '2', title: 'Cảnh Cáo', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
                { step: '3', title: 'Kỷ Luật Nội Quy', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
                { step: '4', title: 'Chấm Dứt HĐ', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' }
              ].map(s => (
                <div 
                  key={s.step}
                  className={`p-3 rounded-2xl border text-center space-y-1 ${s.color}`}
                >
                  <span className="text-xs font-black">BƯỚC {s.step}</span>
                  <div className="text-xs font-extrabold">{s.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'closing':
      return (
        <div className="text-center space-y-6 py-6">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Heart className="w-8 h-8 text-rose-400 fill-rose-400/30 animate-bounce" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              CHUNG TAY KIẾN TẠO VĂN HÓA
            </span>
            <h3 className="text-2xl md:text-3xl font-black text-white">
              PHỤC VỤ TỪ TRÁI TIM
            </h3>
            <p className="text-sm md:text-base text-amber-200/90 font-medium italic">
              "Mỗi nhân viên là một đại sứ mang lại giá trị trọn vẹn cho khách hàng"
            </p>
          </div>

          <div className="inline-block px-5 py-2.5 rounded-full bg-slate-900 border border-amber-500/30 text-xs font-black text-slate-300">
            HỆ THỐNG PHỤ KIỆN 88 • VỮNG VÀNG TẦM NHÌN 2030
          </div>
        </div>
      );

    default:
      return null;
  }
};
