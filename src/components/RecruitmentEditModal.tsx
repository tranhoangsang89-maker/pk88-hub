import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Briefcase, 
  Check, 
  AlertCircle, 
  Phone, 
  FileText, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  Layers
} from 'lucide-react';
import { 
  RecruitmentContentConfig, 
  JobPosition, 
  DEFAULT_RECRUITMENT_CONFIG, 
  saveRecruitmentConfig 
} from '../lib/recruitmentService';
import { Staff } from '../types';

interface RecruitmentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RecruitmentContentConfig;
  onSaveSuccess: (updated: RecruitmentContentConfig) => void;
  currentUser?: Staff | null;
  initialEditingPositionId?: string | null;
}

export const RecruitmentEditModal: React.FC<RecruitmentEditModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveSuccess,
  currentUser,
  initialEditingPositionId
}) => {
  const [activeTab, setActiveTab] = useState<'positions' | 'hero'>('positions');
  const [formData, setFormData] = useState<RecruitmentContentConfig>(config);
  const [selectedPosId, setSelectedPosId] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(config);
      if (initialEditingPositionId && config.positions.some(p => p.id === initialEditingPositionId)) {
        setSelectedPosId(initialEditingPositionId);
        setActiveTab('positions');
      } else if (config.positions.length > 0) {
        setSelectedPosId(config.positions[0].id);
      }
    }
  }, [isOpen, config, initialEditingPositionId]);

  if (!isOpen) return null;

  const currentPosition = formData.positions.find(p => p.id === selectedPosId) || formData.positions[0];

  const handleUpdateCurrentPosition = (updates: Partial<JobPosition>) => {
    if (!currentPosition) return;
    setFormData(prev => ({
      ...prev,
      positions: prev.positions.map(p => p.id === currentPosition.id ? { ...p, ...updates } : p)
    }));
  };

  const handleAddNewPosition = () => {
    const newId = `pos-${Date.now()}`;
    const newPos: JobPosition = {
      id: newId,
      title: 'Vị Trí Tuyển Dụng Mới',
      code: 'sales',
      salary: '8.000.000 - 12.000.000 đ',
      type: 'Toàn thời gian theo ca',
      description: 'Mô tả tóm tắt nhiệm vụ công việc chính tại cửa hàng hoặc phòng ban...',
      requirements: [
        'Độ tuổi từ 18 - 30, sức khỏe tốt, chăm chỉ.',
        'Tinh thần trách nhiệm cao, có thái độ cầu tiến.'
      ],
      benefits: [
        'Thu nhập cạnh tranh theo năng lực và hiệu quả công việc.',
        'Chế độ thưởng lễ Tết, du lịch hàng năm chu đáo.'
      ],
      recommendedRoles: 'sales',
      isActive: true
    };

    setFormData(prev => ({
      ...prev,
      positions: [...prev.positions, newPos]
    }));
    setSelectedPosId(newId);
  };

  const handleDeletePosition = (posId: string) => {
    if (formData.positions.length <= 1) {
      alert('Phải giữ lại ít nhất 1 vị trí tuyển dụng trên trang!');
      return;
    }
    const target = formData.positions.find(p => p.id === posId);
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vị trí "${target?.title}"?`)) return;

    setFormData(prev => {
      const filtered = prev.positions.filter(p => p.id !== posId);
      if (selectedPosId === posId && filtered.length > 0) {
        setSelectedPosId(filtered[0].id);
      }
      return { ...prev, positions: filtered };
    });
  };

  const handleToggleActivePosition = (posId: string) => {
    setFormData(prev => ({
      ...prev,
      positions: prev.positions.map(p => 
        p.id === posId ? { ...p, isActive: p.isActive === false ? true : false } : p
      )
    }));
  };

  const handleResetDefault = () => {
    if (!window.confirm('Bạn có chắc muốn khôi phục lại nội dung trang Tuyển Dụng về mẫu chuẩn mặc định của Phụ Kiện 88?')) return;
    setFormData(DEFAULT_RECRUITMENT_CONFIG);
    if (DEFAULT_RECRUITMENT_CONFIG.positions.length > 0) {
      setSelectedPosId(DEFAULT_RECRUITMENT_CONFIG.positions[0].id);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveToast(null);

    const res = await saveRecruitmentConfig(formData, currentUser);
    setIsSaving(false);

    if (res.success) {
      setSaveToast({ text: 'Đã lưu và xuất bản nội dung tuyển dụng lên toàn hệ thống thành công!', type: 'success' });
      onSaveSuccess(formData);
      setTimeout(() => {
        onClose();
      }, 900);
    } else {
      setSaveToast({ text: `Lỗi khi lưu lên Supabase: ${res.error || 'Vui lòng thử lại'}`, type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Quản Trị Nội Dung Tuyển Dụng</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Chỉ Founder • Admin • HR
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Chỉnh sửa tin tuyển dụng, mức lương và thông điệp hiển thị cho toàn bộ ứng viên công khai
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition ${
              activeTab === 'positions'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Vị Trí Tuyển Dụng ({formData.positions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('hero')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition ${
              activeTab === 'hero'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tiêu Đề Hero, Hotline & Cam Kết Vàng</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {activeTab === 'positions' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Cột trái: Danh sách các vị trí */}
              <div className="md:col-span-4 space-y-2 border-r border-slate-800/80 pr-0 md:pr-4">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Danh Sách Vị Trí</span>
                  <button
                    onClick={handleAddNewPosition}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm Mới</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {formData.positions.map((pos) => {
                    const isSelected = pos.id === currentPosition?.id;
                    const isHidden = pos.isActive === false;

                    return (
                      <div
                        key={pos.id}
                        onClick={() => setSelectedPosId(pos.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition relative group ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        } ${isHidden ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                            {pos.title}
                          </h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                            {pos.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                          {pos.salary}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px]">
                          <span className={isHidden ? 'text-rose-400' : 'text-slate-400'}>
                            {isHidden ? '🚫 Đang Ẩn' : '✅ Đang Tuyển'}
                          </span>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                            <button
                              title={isHidden ? 'Bật hiển thị vị trí này' : 'Tạm ẩn vị trí này'}
                              onClick={() => handleToggleActivePosition(pos.id)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                            >
                              {isHidden ? <EyeOff className="w-3.5 h-3.5 text-rose-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                            </button>
                            <button
                              title="Xóa vị trí này"
                              onClick={() => handleDeletePosition(pos.id)}
                              className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cột phải: Form biên tập vị trí đang chọn */}
              <div className="md:col-span-8 space-y-4">
                {currentPosition ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                          Đang Sửa Vị Trí: {currentPosition.title}
                        </span>
                        <p className="text-[11px] text-slate-400">ID: {currentPosition.id}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActivePosition(currentPosition.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition ${
                            currentPosition.isActive === false
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {currentPosition.isActive === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{currentPosition.isActive === false ? 'Trạng thái: ĐÃ ẨN' : 'Trạng thái: ĐANG HIỆN'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Tên Vị Trí / Tiêu Đề Tuyển Dụng *
                        </label>
                        <input
                          type="text"
                          value={currentPosition.title}
                          onChange={(e) => handleUpdateCurrentPosition({ title: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                          placeholder="Ví dụ: Nhân Viên Tư Vấn Bán Hàng"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Mã Vị Trí (Role Code) *
                        </label>
                        <select
                          value={currentPosition.code}
                          onChange={(e) => handleUpdateCurrentPosition({ code: e.target.value, recommendedRoles: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="sales">sales - Nhân Viên Bán Hàng</option>
                          <option value="technician">technician - Kỹ Thuật Viên</option>
                          <option value="manager">manager - Quản Lý / Cửa Hàng Trưởng</option>
                          <option value="marketing">marketing - Nhân Viên Marketing / Media</option>
                          <option value="warehouse_accountant">warehouse_accountant - Kế Toán Kho / Thu Ngân</option>
                          <option value="other">other - Vị Trí Khác</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Mức Thu Nhập Dự Kiến *</span>
                        </label>
                        <input
                          type="text"
                          value={currentPosition.salary}
                          onChange={(e) => handleUpdateCurrentPosition({ salary: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-semibold focus:outline-none focus:border-amber-500"
                          placeholder="Ví dụ: 7.000.000 - 12.000.000 đ"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Hình Thức Làm Việc / Khung Ca *</span>
                        </label>
                        <input
                          type="text"
                          value={currentPosition.type}
                          onChange={(e) => handleUpdateCurrentPosition({ type: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                          placeholder="Ví dụ: Toàn thời gian theo ca (Xoay ca linh hoạt)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Mô Tả Công Việc Ngắn Gọn
                      </label>
                      <textarea
                        rows={2}
                        value={currentPosition.description}
                        onChange={(e) => handleUpdateCurrentPosition({ description: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
                        placeholder="Mô tả các nhiệm vụ chính hằng ngày của nhân sự..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Yêu Cầu Ứng Viên (Mỗi dòng là 1 gạch đầu dòng)
                        </label>
                        <textarea
                          rows={4}
                          value={currentPosition.requirements.join('\n')}
                          onChange={(e) => handleUpdateCurrentPosition({
                            requirements: e.target.value.split('\n').filter(line => line.trim() !== '')
                          })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none font-mono"
                          placeholder="Độ tuổi từ 18 - 28&#10;Giao tiếp vui vẻ, hoạt bát&#10;Không yêu cầu kinh nghiệm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Quyền Lợi Nổi Bật (Mỗi dòng là 1 gạch đầu dòng)
                        </label>
                        <textarea
                          rows={4}
                          value={currentPosition.benefits.join('\n')}
                          onChange={(e) => handleUpdateCurrentPosition({
                            benefits: e.target.value.split('\n').filter(line => line.trim() !== '')
                          })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none font-mono"
                          placeholder="Lương cứng + Hoa hồng + Thưởng KPI&#10;Giảm 30% khi mua đồ công nghệ&#10;Cơ hội lên Quản lý sau 3-6 tháng"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Vui lòng chọn hoặc thêm một vị trí tuyển dụng.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'hero' && (
            <div className="space-y-5 max-w-3xl mx-auto">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Khu Vực Banner Chính (Hero Section)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Huy Hiệu Đầu Trang (Hero Badge)
                    </label>
                    <input
                      type="text"
                      value={formData.heroBadge}
                      onChange={(e) => setFormData(prev => ({ ...prev, heroBadge: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      placeholder="CAREERS • ĐỢT TUYỂN DỤNG THÁNG 10/2026"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span>Hotline HR Trực Tiếp (Hiển thị góc phải)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.hotline}
                      onChange={(e) => setFormData(prev => ({ ...prev, hotline: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                      placeholder="0394.336.726"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tiêu Đề Chính (Hero Title)
                  </label>
                  <input
                    type="text"
                    value={formData.heroTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, heroTitle: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                    placeholder="Gia Nhập Đội Ngũ Phụ Kiện 88"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Đoạn Mô Tả Giới Thiệu (Hero Subtitle)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.heroSubtitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
                    placeholder="Môi trường bán lẻ công nghệ trẻ trung, thu nhập hấp dẫn..."
                  />
                </div>
              </div>

              {/* 4 Thẻ Cam Kết Vàng */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>4 Quyền Lợi & Cam Kết Vàng</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.valueProps.map((vp, index) => (
                    <div key={vp.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                        <span>Cam kết #{index + 1}</span>
                      </div>
                      <input
                        type="text"
                        value={vp.title}
                        onChange={(e) => {
                          const updated = [...formData.valueProps];
                          updated[index] = { ...updated[index], title: e.target.value };
                          setFormData(prev => ({ ...prev, valueProps: updated }));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                        placeholder="Tiêu đề cam kết"
                      />
                      <input
                        type="text"
                        value={vp.desc}
                        onChange={(e) => {
                          const updated = [...formData.valueProps];
                          updated[index] = { ...updated[index], desc: e.target.value };
                          setFormData(prev => ({ ...prev, valueProps: updated }));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-amber-500"
                        placeholder="Mô tả cam kết ngắn gọn"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={handleResetDefault}
            className="px-3 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi Phục Mặc Định</span>
          </button>

          {saveToast && (
            <div className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-in fade-in ${
              saveToast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}>
              {saveToast.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{saveToast.text}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Hủy / Đóng
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Đang xuất bản...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>LƯU & XUẤT BẢN NGAY</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
