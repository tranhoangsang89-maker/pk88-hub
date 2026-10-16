import React, { useState } from 'react';
import { Branch } from '../types';
import { supabase } from '../lib/supabase';
import { RecruitmentChatBot } from './RecruitmentChatBot';
import { 
  Briefcase, 
  MapPin, 
  Phone, 
  User, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  GraduationCap, 
  TrendingUp, 
  ShieldCheck, 
  HeartHandshake, 
  ChevronRight,
  Clock,
  DollarSign,
  ArrowLeft,
  Building2,
  AlertCircle
} from 'lucide-react';

interface PublicRecruitmentViewProps {
  branches: Branch[];
  onBackToApp?: () => void;
}

interface JobPosition {
  id: string;
  title: string;
  code: string;
  salary: string;
  type: string;
  description: string;
  requirements: string[];
  benefits: string[];
  recommendedRoles: string;
}

const FEATURED_POSITIONS: JobPosition[] = [
  {
    id: 'pos-sales',
    title: 'Nhân Viên Tư Vấn Bán Hàng & Phụ Kiện',
    code: 'sales',
    salary: '7.000.000 - 12.000.000 đ',
    type: 'Toàn thời gian theo ca (Xoay ca linh hoạt)',
    description: 'Đón tiếp, tư vấn khách hàng về các sản phẩm phụ kiện điện thoại, đồ chơi công nghệ, dán kính cường lực và thanh toán tại quầy.',
    requirements: [
      'Độ tuổi từ 18 - 28, ngoại hình chỉn chu, tươi tắn.',
      'Giao tiếp vui vẻ, hoạt bát, có tinh thần phục vụ khách hàng.',
      'Không yêu cầu kinh nghiệm, sẽ được đào tạo bài bản 60 ngày trên hệ thống LMS nội bộ.'
    ],
    benefits: [
      'Thu nhập: Lương cứng + Hoa hồng sản phẩm + Thưởng doanh số chi nhánh.',
      'Giảm giá 30% khi mua sắm các sản phẩm công nghệ tại chuỗi PK88.',
      'Cơ hội thăng tiến lên Trưởng ca / Cửa hàng phó sau 3 - 6 tháng.'
    ],
    recommendedRoles: 'sales'
  },
  {
    id: 'pos-tech',
    title: 'Kỹ Thuật Viên Sửa Chữa & Ép Kính Điện Thoại',
    code: 'technician',
    salary: '9.000.000 - 18.000.000 đ',
    type: 'Toàn thời gian (08:00 - 17:30 hoặc 13:30 - 21:30)',
    description: 'Thực hiện thay pin, thay màn hình, ép kính chân không, sửa chữa phần cứng điện thoại thông minh (iPhone, Samsung, Xiaomi...).',
    requirements: [
      'Biết tháo ráp các dòng máy thông dụng, ưu tiên có tay nghề ép kính màn hình cong hoặc phẳng.',
      'Cẩn thận, tỉ mỉ, trung thực với thiết bị của khách hàng.',
      'Ứng viên tay nghề yếu nhưng có đam mê sẽ được Kỹ thuật trưởng kèm cặp 1-1.'
    ],
    benefits: [
      'Thu nhập: Lương chuyên môn + Thưởng trực tiếp theo số vé sửa chữa hoàn thành.',
      'Trang bị máy ép kính, máy hút chân không, kính hiển vi hiện đại tại mỗi shop.',
      'Thưởng chuyên cần và hỗ trợ công cụ đồ nghề định kỳ.'
    ],
    recommendedRoles: 'technician'
  },
  {
    id: 'pos-manager',
    title: 'Quản Lý Cửa Hàng / Cửa Hàng Trưởng',
    code: 'manager',
    salary: '12.000.000 - 22.000.000 đ',
    type: 'Toàn thời gian',
    description: 'Quản lý toàn diện hoạt động kinh doanh tại chi nhánh, điều phối nhân sự, kiểm soát tồn kho và thúc đẩy doanh thu cửa hàng.',
    requirements: [
      'Tối thiểu 1 năm kinh nghiệm quản lý cửa hàng bán lẻ (F&B, thời trang, viễn thông, công nghệ).',
      'Kỹ năng lãnh đạo, giải quyết khiếu nại khách hàng khéo léo.',
      'Sử dụng thành thạo máy tính, quản trị bằng phần mềm.'
    ],
    benefits: [
      'Lương cơ bản + Thưởng % KPI lợi nhuận cửa hàng hàng tháng.',
      'Được đào tạo kỹ năng quản trị chuỗi từ Ban Lãnh Đạo.',
      'Chế độ bảo hiểm, du lịch nghỉ dưỡng hàng năm của công ty.'
    ],
    recommendedRoles: 'manager'
  },
  {
    id: 'pos-marketing',
    title: 'Nhân Viên Sáng Tạo Nội Dung & TikToker Chi Nhánh',
    code: 'marketing',
    salary: '8.000.000 - 15.000.000 đ',
    type: 'Toàn thời gian / Bán thời gian linh hoạt',
    description: 'Quay dựng video ngắn review phụ kiện, unbox sản phẩm mới, livestream bán hàng tại quầy và xây dựng kênh TikTok Phụ Kiện 88.',
    requirements: [
      'Tự tin trước ống kính, có khiếu hài hước hoặc khả năng diễn đạt tốt.',
      'Biết sử dụng CapCut trên điện thoại, nắm bắt xu hướng (trend) TikTok nhanh nhạy.',
      'Ưu tiên ứng viên có kênh cá nhân hoặc từng có clip lên xu hướng.'
    ],
    benefits: [
      'Thưởng thêm trực tiếp theo lượng view / tương tác của video.',
      'Hỗ trợ máy ảnh, micro thu âm, studio mini ngay tại shop.',
      'Môi trường thỏa sức sáng tạo không gò bó.'
    ],
    recommendedRoles: 'marketing'
  }
];

export const PublicRecruitmentView: React.FC<PublicRecruitmentViewProps> = ({
  branches,
  onBackToApp
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || '');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [roleApplied, setRoleApplied] = useState<string>('sales');
  const [experienceNote, setExperienceNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const activeBranches = branches.filter(b => b.isActive !== false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập Họ và tên của bạn.');
      return;
    }
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 9 || cleanPhone.length > 11) {
      setErrorMessage('Số điện thoại không hợp lệ. Vui lòng nhập đúng số điện thoại (có Zalo) để HR liên hệ.');
      return;
    }
    if (!selectedBranchId) {
      setErrorMessage('Vui lòng chọn chi nhánh bạn muốn ứng tuyển.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      branch_id: selectedBranchId,
      full_name: fullName.trim(),
      phone: phone.trim(),
      role_applied: roleApplied,
      experience_note: experienceNote.trim() || 'Ứng viên chưa điền ghi chú thêm.',
      status: 'pending'
    };

    try {
      // 1. Ghi trực tiếp lên Supabase table job_applications
      const { error } = await supabase.from('job_applications').insert([payload]);

      if (error) {
        console.warn('Lỗi lưu Supabase (lưu cache tạm):', error.message);
        // Lưu tạm vào localStorage để không làm mất đơn của ứng viên
        const cached = JSON.parse(localStorage.getItem('pk88_job_applications') || '[]');
        cached.unshift({
          id: `local-${Date.now()}`,
          ...payload,
          created_at: new Date().toISOString()
        });
        localStorage.setItem('pk88_job_applications', JSON.stringify(cached));
      }

      setSubmitSuccess(true);
      setFullName('');
      setPhone('');
      setExperienceNote('');
    } catch (err: any) {
      console.error('Lỗi khi nộp hồ sơ:', err);
      setErrorMessage('Không thể gửi hồ sơ lúc này. Vui lòng thử lại hoặc gọi trực tiếp Hotline Tuyển Dụng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScrollToForm = () => {
    const formEl = document.getElementById('application-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
      const inputEl = formEl.querySelector('input');
      inputEl?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-500/20">
              88
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-wide">PHỤ KIỆN 88</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  CAREERS
                </span>
              </div>
              <p className="text-xs text-slate-400">Cổng Tuyển Dụng & Đào Tạo Chuỗi 8 Cửa Hàng Miền Tây</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Về Cổng Nội Bộ</span>
              </button>
            )}
            <a
              href="tel:0394336726"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hotline HR:</span>
              <span className="font-bold">0394.336.726</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 px-4 sm:px-6 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Tuyển Dụng Tháng 10/2026 - Đi Làm Ngay Tại 8 Chi Nhánh
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Gia Nhập Đội Ngũ <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">Phụ Kiện 88</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            Môi trường bán lẻ công nghệ trẻ trung, thu nhập hấp dẫn, áp dụng hệ thống tự động hóa AI và lộ trình đào tạo bài bản 60 ngày giúp bạn bứt phá sự nghiệp!
          </p>

          {/* Value Props Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 text-left">
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
              <DollarSign className="w-5 h-5 text-emerald-400 mb-1.5" />
              <h4 className="text-xs font-bold text-white">Thu Nhập Hấp Dẫn</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Lương cứng + Hoa hồng + Thưởng KPI tháng</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
              <GraduationCap className="w-5 h-5 text-cyan-400 mb-1.5" />
              <h4 className="text-xs font-bold text-white">LMS Đào Tạo 60 Ngày</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Cầm tay chỉ việc từ chưa biết gì đến chuyên nghiệp</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
              <TrendingUp className="w-5 h-5 text-amber-400 mb-1.5" />
              <h4 className="text-xs font-bold text-white">Lộ Trình Thăng Tiến</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Cơ hội lên Quản lý chi nhánh sau 3 - 6 tháng</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
              <HeartHandshake className="w-5 h-5 text-pink-400 mb-1.5" />
              <h4 className="text-xs font-bold text-white">Văn Hóa Tương Trợ</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Đồng đội thân thiện, thưởng lễ Tết, du lịch hàng năm</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Positions List & Fast Application Form */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Job Positions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-400" />
              Vị Trí Đang Tuyển Dụng
            </h2>
            <span className="text-xs text-slate-400">
              8 chi nhánh đang mở đợt phỏng vấn
            </span>
          </div>

          <div className="space-y-4">
            {FEATURED_POSITIONS.map((pos) => (
              <div 
                key={pos.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition rounded-2xl p-5 space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-white">{pos.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        {pos.salary}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-xs text-slate-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {pos.type}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setRoleApplied(pos.recommendedRoles);
                      const formEl = document.getElementById('application-form');
                      formEl?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="self-start sm:self-auto px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-1 shadow-md shadow-amber-500/10"
                  >
                    <span>Ứng tuyển ngay</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{pos.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                    <span className="font-semibold text-amber-300 block mb-1">Yêu cầu công việc:</span>
                    <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[11px]">
                      {pos.requirements.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                    <span className="font-semibold text-emerald-300 block mb-1">Quyền lợi nổi bật:</span>
                    <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[11px]">
                      {pos.benefits.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 8 Branch List Section */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              Mạng Lưới 8 Chi Nhánh Ứng Tuyển
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeBranches.map((b) => (
                <div 
                  key={b.id} 
                  className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 transition cursor-pointer ${
                    selectedBranchId === b.id 
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' 
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
                  }`}
                  onClick={() => setSelectedBranchId(b.id)}
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">{b.name}</span>
                    <span className="text-[11px] text-slate-400 block line-clamp-1">{b.address}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Fast Application Form (5 cols) */}
        <div className="lg:col-span-5" id="application-form">
          <div className="sticky top-20 bg-slate-900/95 border border-amber-500/30 rounded-2xl p-6 shadow-2xl shadow-black/80 space-y-5">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Send className="w-3.5 h-3.5" />
                Nộp Hồ Sơ Nhanh (1 Phút)
              </div>
              <h3 className="text-lg font-extrabold text-white">Đăng Ký Ứng Tuyển Online</h3>
              <p className="text-xs text-slate-400 mt-1">
                Điền thông tin bên dưới, Bộ phận Nhân sự Phụ Kiện 88 sẽ liên hệ bạn qua Zalo/SĐT để xếp lịch phỏng vấn sớm nhất.
              </p>
            </div>

            {submitSuccess ? (
              <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-5 text-center space-y-3 animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-white text-base">Hồ Sơ Của Bạn Đã Được Gửi!</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Cảm ơn bạn đã quan tâm đến Phụ Kiện 88. Chúng mình đã nhận được thông tin ứng tuyển và sẽ chủ động gọi điện hoặc nhắn tin Zalo cho bạn trong vòng 24h làm việc.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
                  >
                    Gửi hồ sơ khác
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Họ và tên */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Họ và tên <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Nguyễn Văn An"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                {/* Số điện thoại (Zalo) */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Số điện thoại / Zalo <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="Ví dụ: 0912345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">HR sẽ nhắn tin qua Zalo này để thông báo lịch hẹn</span>
                </div>

                {/* Chi nhánh ứng tuyển */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Chi nhánh mong muốn làm việc <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                    >
                      {activeBranches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} - {b.address}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Vị trí ứng tuyển */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Vị trí ứng tuyển <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={roleApplied}
                      onChange={(e) => setRoleApplied(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                    >
                      <option value="sales">Nhân viên Bán hàng & Tư vấn phụ kiện</option>
                      <option value="technician">Kỹ thuật viên Sửa chữa / Ép kính điện thoại</option>
                      <option value="manager">Cửa hàng trưởng / Quản lý ca</option>
                      <option value="marketing">Nhân viên Marketing / Video Creator TikTok</option>
                      <option value="warehouse_accountant">Kế toán kho / Thu ngân</option>
                    </select>
                  </div>
                </div>

                {/* Kinh nghiệm / Lời nhắn */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Kinh nghiệm làm việc ngắn gọn / Lời nhắn gửi
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ví dụ: Từng bán hàng thời trang 6 tháng, biết dán màn hình cơ bản, có thể đi làm theo ca..."
                    value={experienceNote}
                    onChange={(e) => setExperienceNote(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition resize-none"
                  />
                </div>

                {/* Nút gửi */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Đang nộp hồ sơ...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>GỬI HỒ SƠ ỨNG TUYỂN</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-slate-500">
                  Thông tin ứng tuyển được bảo mật tuyệt đối và chỉ dùng cho mục đích tuyển dụng tại Phụ Kiện 88.
                </p>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500 space-y-2">
        <p className="font-semibold text-slate-400">© 2026 Hệ Thống Bán Lẻ & Sửa Chữa Phụ Kiện 88</p>
        <p>Phụ Kiện 88 • Bến Tre • Tiền Giang • Cần Thơ • Vĩnh Long • Trà Vinh • Sóc Trăng • Long An</p>
      </footer>

      {/* Trợ Lý AI Tuyển Dụng Bé 8 (Gemini Flash Lite) */}
      <RecruitmentChatBot 
        branches={branches}
        onScrollToForm={handleScrollToForm}
      />
    </div>
  );
};
