import React, { useState, useEffect } from 'react';
import { Branch, Staff } from '../types';
import { supabase } from '../lib/supabase';
import { RecruitmentChatBot } from './RecruitmentChatBot';
import { RecruitmentEditModal } from './RecruitmentEditModal';
import { 
  canUserEditRecruitment, 
  getRecruitmentConfigCached, 
  fetchRecruitmentConfigFromSupabase, 
  RecruitmentContentConfig, 
  JobPosition 
} from '../lib/recruitmentService';
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
  AlertCircle,
  Edit3,
  Plus,
  EyeOff,
  Sliders,
  Check
} from 'lucide-react';

interface PublicRecruitmentViewProps {
  branches: Branch[];
  onBackToApp?: () => void;
  currentUser?: Staff | null;
}

export const PublicRecruitmentView: React.FC<PublicRecruitmentViewProps> = ({
  branches,
  onBackToApp,
  currentUser
}) => {
  // Cấu hình nội dung trang tuyển dụng (có thể sửa động bởi Founder, Admin, HR Khánh)
  const [recruitmentConfig, setRecruitmentConfig] = useState<RecruitmentContentConfig>(() => {
    return getRecruitmentConfigCached();
  });
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);

  // Form đăng ký ứng tuyển
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || '');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [roleApplied, setRoleApplied] = useState<string>('sales');
  const [experienceNote, setExperienceNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Kiểm tra phân quyền: Chỉ Founder, Admin và HR Phan Hoàng Khánh mới có quyền sửa
  const canEdit = canUserEditRecruitment(currentUser);

  // Tải cấu hình mới nhất từ Supabase Cloud khi trang mở
  useEffect(() => {
    fetchRecruitmentConfigFromSupabase().then(latest => {
      if (latest) {
        setRecruitmentConfig(latest);
      }
    });
  }, []);

  const activeBranches = branches.filter(b => b.isActive !== false);

  // Danh sách vị trí tuyển dụng: Quản trị viên thấy tất cả; ứng viên chỉ thấy vị trí đang kích hoạt
  const visiblePositions = canEdit 
    ? recruitmentConfig.positions 
    : recruitmentConfig.positions.filter(p => p.isActive !== false);

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

    try {
      const payload = {
        branch_id: selectedBranchId,
        full_name: fullName.trim(),
        phone: cleanPhone,
        role_applied: roleApplied,
        experience_note: experienceNote.trim() || 'Ứng viên nộp hồ sơ từ Cổng Tuyển Dụng Online',
        status: 'pending',
        notes: `Nộp hồ sơ trực tuyến lúc ${new Date().toLocaleTimeString('vi-VN')} ngày ${new Date().toLocaleDateString('vi-VN')}`
      };

      // 1. Ghi trực tiếp lên Supabase table job_applications
      const { error } = await supabase.from('job_applications').insert([payload]);

      if (error) {
        console.warn('Lỗi ghi Supabase (dùng cache local):', error.message);
        // Fallback ghi vào LocalStorage
        const cached = JSON.parse(localStorage.getItem('pk88_job_applications') || '[]');
        cached.unshift({
          ...payload,
          id: `app-local-${Date.now()}`,
          created_at: new Date().toISOString()
        });
        localStorage.setItem('pk88_job_applications', JSON.stringify(cached));
      }

      setSubmitSuccess(true);
      setFullName('');
      setPhone('');
      setExperienceNote('');
    } catch (err: any) {
      console.error('Lỗi khi nộp hồ sơ ứng tuyển:', err);
      setErrorMessage('Có lỗi xảy ra trong quá trình nộp hồ sơ. Vui lòng thử lại hoặc gọi Hotline HR.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScrollToForm = (recommendedRole?: string) => {
    if (recommendedRole) {
      setRoleApplied(recommendedRole);
    }
    const formElement = document.getElementById('application-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Render icon linh hoạt cho các thẻ cam kết vàng
  const renderValuePropIcon = (iconName: string) => {
    switch (iconName) {
      case 'DollarSign':
        return <DollarSign className="w-5 h-5 text-emerald-400 mb-1.5" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-cyan-400 mb-1.5" />;
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5 text-amber-400 mb-1.5" />;
      case 'HeartHandshake':
      default:
        return <HeartHandshake className="w-5 h-5 text-pink-400 mb-1.5" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-amber-500/20">
              88
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wider text-white">PHỤ KIỆN 88</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  CAREERS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Cổng Tuyển Dụng & Đào Tạo Chuỗi 8 Cửa Hàng Miền Tây</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút Chỉnh Sửa Dành Riêng Cho Founder, Admin và HR Phan Hoàng Khánh */}
            {canEdit && (
              <button
                onClick={() => {
                  setEditingPositionId(null);
                  setShowEditModal(true);
                }}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition active:scale-95 animate-pulse"
                title="Quyền biên tập: Founder, Admin & HR Phan Hoàng Khánh"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tùy Chỉnh Nội Dung</span>
                <span className="sm:hidden">Sửa</span>
              </button>
            )}

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
              href={`tel:${recruitmentConfig.hotline.replace(/\D/g, '')}`}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hotline HR:</span>
              <span className="font-bold">{recruitmentConfig.hotline}</span>
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
            {recruitmentConfig.heroBadge}
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {recruitmentConfig.heroTitle}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            {recruitmentConfig.heroSubtitle}
          </p>

          {/* Value Props Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 text-left">
            {recruitmentConfig.valueProps.map((vp) => (
              <div key={vp.id} className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
                {renderValuePropIcon(vp.icon)}
                <h4 className="text-xs font-bold text-white">{vp.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{vp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content: Positions List & Fast Application Form */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Job Positions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Thanh thông báo quản trị khi Founder / Admin / HR xem trang */}
          {canEdit && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Đang đăng nhập với quyền: <strong>{currentUser?.fullName}</strong> ({currentUser?.role?.toUpperCase()}) - Có quyền chỉnh sửa nội dung trang.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditingPositionId(null);
                    setShowEditModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm vị trí mới</span>
                </button>
                <button
                  onClick={() => {
                    setEditingPositionId(null);
                    setShowEditModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Biên tập trang</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-400" />
              Vị Trí Đang Tuyển Dụng
            </h2>
            <span className="text-xs text-slate-400">
              {branches.length} chi nhánh đang mở đợt phỏng vấn
            </span>
          </div>

          <div className="space-y-4">
            {visiblePositions.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400 text-sm">
                Hiện tại các vị trí đang được cập nhật. Vui lòng liên hệ Hotline HR {recruitmentConfig.hotline} để biết thêm chi tiết.
              </div>
            ) : (
              visiblePositions.map((pos) => {
                const isHidden = pos.isActive === false;

                return (
                  <div 
                    key={pos.id}
                    className={`bg-slate-900/80 border transition rounded-2xl p-5 space-y-4 shadow-sm relative group ${
                      isHidden ? 'border-dashed border-rose-500/40 bg-slate-900/40' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Badge thông báo đã ẩn (chỉ quản trị viên thấy) */}
                    {isHidden && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 mb-2">
                        <EyeOff className="w-3 h-3" />
                        <span>VỊ TRÍ NÀY ĐANG TẠM ẨN (ỨNG VIÊN BÊN NGOÀI KHÔNG THẤY)</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-white">{pos.title}</h3>
                          {canEdit && (
                            <button
                              onClick={() => {
                                setEditingPositionId(pos.id);
                                setShowEditModal(true);
                              }}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 text-xs transition"
                              title="Chỉnh sửa vị trí này"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

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

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {canEdit && (
                          <button
                            onClick={() => {
                              setEditingPositionId(pos.id);
                              setShowEditModal(true);
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3 text-amber-400" />
                            <span>Sửa</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setRoleApplied(pos.code);
                            const formEl = document.getElementById('application-form');
                            formEl?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-1 shadow-md shadow-amber-500/10"
                        >
                          <span>Ứng tuyển ngay</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Application Form (5 cols) */}
        <div id="application-form" className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-6 shadow-xl shadow-amber-500/5 space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-2">
                <Send className="w-3 h-3" />
                NỘP HỒ SƠ NHANH (1 PHÚT)
              </div>
              <h3 className="text-lg font-bold text-white">Đăng Ký Ứng Tuyển Online</h3>
              <p className="text-xs text-slate-400 mt-1">
                Điền thông tin bên dưới, Bộ phận Nhân sự Phụ Kiện 88 sẽ liên hệ bạn qua Zalo/SĐT để xếp lịch phỏng vấn sớm nhất.
              </p>
            </div>

            {submitSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 text-center space-y-3 animate-in fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white text-base">Hồ Sơ Đã Được Gửi Thành Công!</h4>
                <p className="text-xs text-slate-300">
                  Cảm ơn bạn đã quan tâm ứng tuyển tại Phụ Kiện 88. Bộ phận HR sẽ gọi điện hoặc nhắn tin Zalo hẹn lịch phỏng vấn trong vòng 24h làm việc.
                </p>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
                >
                  Nộp Thêm Hồ Sơ Khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
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
                      placeholder="Ví dụ: Nguyễn Văn An"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                {/* Số điện thoại / Zalo */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Số điện thoại / Zalo <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="Ví dụ: 0912345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">HR sẽ nhắn tin qua Zalo này để thông báo lịch hẹn</p>
                </div>

                {/* Chi nhánh muốn làm việc */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Chi nhánh ứng tuyển gần bạn nhất <span className="text-red-400">*</span>
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

                {/* Vị trí ứng tuyển (Tự động cập nhật theo các vị trí đang tuyển) */}
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
                      {recruitmentConfig.positions.map((pos) => (
                        <option key={pos.id} value={pos.code}>
                          {pos.title}
                        </option>
                      ))}
                      <option value="other">Vị trí khác</option>
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

      {/* Modal Biên Tập Nội Dung Tuyển Dụng Dành Cho Founder, Admin & HR Phan Hoàng Khánh */}
      {canEdit && (
        <RecruitmentEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          config={recruitmentConfig}
          currentUser={currentUser}
          initialEditingPositionId={editingPositionId}
          onSaveSuccess={(updated) => {
            setRecruitmentConfig(updated);
          }}
        />
      )}
    </div>
  );
};
