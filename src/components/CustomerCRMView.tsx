import React, { useState, useEffect, useMemo } from 'react';
import { CustomerProfile, CustomerTier, CustomerCareReminder, CustomerCareLog, Branch, Staff } from '../types';
import { fetchAllCustomerProfiles, saveCustomerProfileToCloud, addCustomerCareLogToCloud, normalizePhone } from '../lib/customerService';
import { 
  Users, Search, Filter, Phone, MessageSquare, Sparkles, ShieldCheck, 
  Crown, Award, Star, RefreshCw, ChevronRight, X, Clock, ShoppingBag, 
  Wrench, Bot, Calendar, MapPin, Smartphone, FileText, CheckCircle2, 
  AlertCircle, Copy, Check, Send, HeartHandshake, ArrowUpRight, Plus
} from 'lucide-react';

interface CustomerCRMViewProps {
  branches: Branch[];
  currentUser?: Staff | null;
  onOpenLeadsModal?: () => void;
}

export function CustomerCRMView({ branches, currentUser, onOpenLeadsModal }: CustomerCRMViewProps) {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [onlyReminders, setOnlyReminders] = useState<boolean>(false);
  const [activeCustomer, setActiveCustomer] = useState<CustomerProfile | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'orders' | 'tickets' | 'chat' | 'care'>('care');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Form thêm nhật ký chăm sóc
  const [newLogType, setNewLogType] = useState<string>('CALL');
  const [newLogContent, setNewLogContent] = useState<string>('');
  const [isSavingLog, setIsSavingLog] = useState<boolean>(false);

  // Form chỉnh sửa hồ sơ khách
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editDevice, setEditDevice] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editBirthday, setEditBirthday] = useState<string>('');
  const [editBranchId, setEditBranchId] = useState<string>('');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  // Toast thông báo
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Tải danh sách khách hàng từ Cloud
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAllCustomerProfiles(branches);
      setCustomers(data);
      if (activeCustomer) {
        const refreshed = data.find(c => c.phone === activeCustomer.phone);
        if (refreshed) setActiveCustomer(refreshed);
      }
    } catch (e) {
      console.error('Lỗi loadData CRM:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [branches]);

  // Bộ lọc khách hàng
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // 1. Tìm kiếm theo tên hoặc SĐT
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const normQ = normalizePhone(q);
        const matchName = c.fullName.toLowerCase().includes(q);
        const matchPhone = c.phone.includes(normQ || q);
        const matchDevice = (c.deviceModel || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchDevice) return false;
      }

      // 2. Lọc theo Tier
      if (selectedTier !== 'ALL' && c.tier !== selectedTier) {
        return false;
      }

      // 3. Lọc theo Chi nhánh
      if (selectedBranchId !== 'ALL') {
        const branchMatch = c.homeBranchId === selectedBranchId || 
          branches.find(b => b.id === selectedBranchId)?.name === c.homeBranchName;
        if (!branchMatch) return false;
      }

      // 4. Lọc chỉ khách có nhắc nhở CSKH
      if (onlyReminders && (!c.reminders || c.reminders.length === 0)) {
        return false;
      }

      return true;
    });
  }, [customers, searchQuery, selectedTier, selectedBranchId, onlyReminders, branches]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = customers.length;
    const vipCount = customers.filter(c => c.tier === 'GOLD' || c.tier === 'DIAMOND').length;
    const totalRevenue = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
    const reminderCount = customers.filter(c => c.reminders && c.reminders.length > 0).length;
    const urgentReminders = customers.reduce((acc, c) => {
      return acc + (c.reminders?.filter(r => r.isUrgent)?.length || 0);
    }, 0);

    return { total, vipCount, totalRevenue, reminderCount, urgentReminders };
  }, [customers]);

  const handleCopyPhone = (phone: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    showToast(`Đã sao chép SĐT: ${phone}`);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleOpenDetail = (customer: CustomerProfile) => {
    setActiveCustomer(customer);
    setActiveDetailTab(customer.reminders?.length ? 'care' : (customer.orders?.length ? 'orders' : 'chat'));
    setIsEditingProfile(false);
  };

  // Bắt đầu chỉnh sửa hồ sơ
  const handleStartEdit = () => {
    if (!activeCustomer) return;
    setEditName(activeCustomer.fullName);
    setEditDevice(activeCustomer.deviceModel || '');
    setEditNotes(activeCustomer.notes || '');
    setEditBirthday(activeCustomer.birthday || '');
    setEditBranchId(activeCustomer.homeBranchId || '');
    setIsEditingProfile(true);
  };

  // Lưu hồ sơ đã sửa lên Supabase
  const handleSaveProfile = async () => {
    if (!activeCustomer) return;
    setIsSavingProfile(true);
    try {
      const branchObj = branches.find(b => b.id === editBranchId);
      const success = await saveCustomerProfileToCloud({
        phone: activeCustomer.phone,
        fullName: editName.trim() || activeCustomer.fullName,
        deviceModel: editDevice.trim(),
        notes: editNotes.trim(),
        birthday: editBirthday.trim(),
        homeBranchId: editBranchId,
        homeBranchName: branchObj?.name || activeCustomer.homeBranchName
      });

      if (success) {
        showToast('✅ Đã lưu hồ sơ khách hàng lên Cloud!');
        setIsEditingProfile(false);
        await loadData();
      } else {
        showToast('❌ Lỗi lưu dữ liệu. Vui lòng thử lại!');
      }
    } catch {
      showToast('❌ Lỗi kết nối máy chủ.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Thêm nhật ký CSKH
  const handleAddCareLog = async () => {
    if (!activeCustomer || !newLogContent.trim()) return;
    setIsSavingLog(true);
    try {
      const staffName = currentUser?.fullName || 'Nhân sự PK88';
      const success = await addCustomerCareLogToCloud({
        phone: activeCustomer.phone,
        actionType: newLogType,
        content: newLogContent.trim(),
        staffName
      });

      if (success) {
        showToast('✅ Đã lưu nhật ký CSKH vào hồ sơ Cloud!');
        setNewLogContent('');
        await loadData();
      } else {
        showToast('❌ Không thể lưu nhật ký. Vui lòng thử lại!');
      }
    } catch {
      showToast('❌ Lỗi kết nối.');
    } finally {
      setIsSavingLog(false);
    }
  };

  // Helper format
  const formatCurrency = (val: number) => {
    return (val || 0).toLocaleString('vi-VN') + ' đ';
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Chưa rõ';
    const date = new Date(isoString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 30) return `${diffDays} ngày trước`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} tháng trước`;
    return `${Math.floor(diffMonths / 12)} năm trước`;
  };

  const getTierBadge = (tier: CustomerTier) => {
    switch (tier) {
      case 'DIAMOND':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm shadow-cyan-500/20">
            <Crown className="w-3 h-3 text-cyan-300 animate-pulse" /> Kim Cương
          </span>
        );
      case 'GOLD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm shadow-amber-500/20">
            <Award className="w-3 h-3 text-amber-300" /> Vàng VIP
          </span>
        );
      case 'SILVER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-700/50 text-slate-200 border border-slate-600">
            <Star className="w-3 h-3 text-slate-300" /> Bạc
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            ✨ Mới
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-amber-500/40 text-amber-300 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 backdrop-blur-md animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header & Quick Action */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  HỒ SƠ KHÁCH HÀNG 360 & CSKH
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full">
                    Supabase Realtime
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quản lý vòng đời khách hàng, lịch sử mua hàng POS, sửa chữa & kích hoạt nhắc nhở CSKH thông minh
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
            {/* Nút Sao Chép Link Chatbot Công Khai */}
            <button
              onClick={() => {
                const chatbotUrl = `${window.location.origin}/?tab=tu-van`;
                navigator.clipboard.writeText(chatbotUrl);
                showToast(`Đã sao chép link Chatbot: ${chatbotUrl}`);
              }}
              className="px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Sao chép đường link công khai của Chatbot Bé 8 để gửi khách hàng hoặc đăng MXH"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Copy Link Chatbot Bé 8</span>
            </button>

            {/* Nút Xem Chatbot Bé 8 */}
            <a
              href="/?tab=tu-van"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Mở trang Chatbot Bé 8 tab mới"
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mở Bé 8</span>
              <ArrowUpRight className="w-3 h-3 text-slate-500" />
            </a>

            <button
              onClick={loadData}
              disabled={loading}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Đồng bộ lại từ Cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>

            {onOpenLeadsModal && (
              <button
                onClick={onOpenLeadsModal}
                className="px-3.5 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>Khách Chốt Đơn (Telesales)</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Cards Thống kê KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Tổng Khách Hàng</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-white">{stats.total.toLocaleString('vi-VN')}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">POS + Sửa chữa + Chatbot</div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Khách VIP (Vàng & Kim Cương)</span>
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-amber-400">{stats.vipCount}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {stats.total > 0 ? `${Math.round((stats.vipCount / stats.total) * 100)}% tổng tệp khách` : '0%'}
              </div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Doanh Thu Tích Lũy</span>
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-emerald-400">{formatCurrency(stats.totalRevenue)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Giá trị đơn & phiếu dịch vụ</div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Cần CSKH Hôm Nay</span>
              <HeartHandshake className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-xl sm:text-2xl font-black text-rose-400">{stats.reminderCount}</div>
              {stats.urgentReminders > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-md">
                  {stats.urgentReminders} gấp
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Dán kính, pin, tri ân VIP</div>
          </div>
        </div>
      </div>

      {/* Thanh Tìm Kiếm & Bộ Lọc Nhanh */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Tên khách, Số điện thoại hoặc Dòng máy (VD: iPhone 15 Pro)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lọc chi nhánh */}
          <div className="w-full md:w-56 shrink-0">
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">🏢 Tất cả chi nhánh ({branches.length})</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Nút lọc Chỉ khách có lời nhắc CSKH */}
          <button
            onClick={() => setOnlyReminders(!onlyReminders)}
            className={`w-full md:w-auto px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 ${
              onlyReminders
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
            <span>Chỉ khách cần CSKH ({stats.reminderCount})</span>
          </button>
        </div>

        {/* Lọc theo Tier Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] shrink-0">Hạng Hội Viên:</span>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'DIAMOND', label: '💎 Kim Cương (≥ 5tr)' },
            { id: 'GOLD', label: '👑 Vàng VIP (≥ 2tr)' },
            { id: 'SILVER', label: '🥈 Bạc (≥ 500k)' },
            { id: 'NEW', label: '✨ Khách Mới' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTier(t.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                selectedTier === t.id
                  ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                  : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              {t.label}
            </button>
          ))}
          <span className="text-slate-500 text-[11px] ml-auto shrink-0 hidden sm:inline">
            Tìm thấy {filteredCustomers.length} khách hàng
          </span>
        </div>
      </div>

      {/* Danh Sách Khách Hàng */}
      {loading ? (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Đang đồng bộ hồ sơ khách hàng từ Supabase Cloud...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">Không tìm thấy khách hàng nào</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc chi nhánh / hạng hội viên khác.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          {/* View Bảng (Desktop) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Khách Hàng</th>
                  <th className="py-3.5 px-4">Hạng Hội Viên</th>
                  <th className="py-3.5 px-4">Dòng Máy</th>
                  <th className="py-3.5 px-4">Chi Nhánh Quen</th>
                  <th className="py-3.5 px-4">Tổng Chi Tiêu</th>
                  <th className="py-3.5 px-4">Lần Cuối Ghé</th>
                  <th className="py-3.5 px-4">Nhắc Nhở CSKH</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.phone}
                    onClick={() => handleOpenDetail(cust)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-black text-sm flex items-center justify-center border border-amber-300/40 shrink-0">
                          {cust.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-200 group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                            <span>{cust.fullName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] mt-0.5">
                            <span>{cust.phone}</span>
                            <button
                              onClick={(e) => handleCopyPhone(cust.phone, e)}
                              className="text-slate-500 hover:text-amber-400 p-0.5 transition-colors"
                              title="Sao chép SĐT"
                            >
                              {copiedPhone === cust.phone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {getTierBadge(cust.tier)}
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {cust.deviceModel ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-200 text-[11px] font-medium border border-slate-700/60">
                          <Smartphone className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate max-w-[120px]">{cust.deviceModel}</span>
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">Chưa có</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                        <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>{cust.homeBranchName || 'Phụ Kiện 88'}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-extrabold text-amber-400">{formatCurrency(cust.totalSpent)}</div>
                      <div className="text-[10px] text-slate-500">
                        {cust.orderCount} đơn POS • {cust.ticketCount} sửa chữa
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-200 font-medium">{formatRelativeTime(cust.lastSeenAt)}</div>
                      <div className="text-[10px] text-slate-500">{new Date(cust.lastSeenAt).toLocaleDateString('vi-VN')}</div>
                    </td>

                    <td className="py-3 px-4">
                      {cust.reminders && cust.reminders.length > 0 ? (
                        <div className="space-y-1">
                          {cust.reminders.slice(0, 1).map((r, idx) => (
                            <span 
                              key={idx} 
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                                r.isUrgent 
                                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 animate-pulse'
                                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              }`}
                              title={r.message}
                            >
                              <HeartHandshake className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[150px]">{r.title}</span>
                            </span>
                          ))}
                          {cust.reminders.length > 1 && (
                            <span className="text-[10px] text-slate-500 ml-1">+{cust.reminders.length - 1}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={`tel:${cust.phone}`}
                          className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs transition-colors"
                          title="Gọi điện ngay"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`https://zalo.me/${cust.phone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs transition-colors"
                          title="Mở Zalo"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleOpenDetail(cust)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>Hồ sơ</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* View Dạng Thẻ (Mobile) */}
          <div className="lg:hidden divide-y divide-slate-800/80">
            {filteredCustomers.map((cust) => (
              <div
                key={cust.phone}
                onClick={() => handleOpenDetail(cust)}
                className="p-4 hover:bg-slate-800/40 transition-colors space-y-3 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-black text-sm flex items-center justify-center border border-amber-300/40 shrink-0">
                      {cust.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-200 text-sm">{cust.fullName}</div>
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-mono mt-0.5">
                        <span>{cust.phone}</span>
                        <button
                          onClick={(e) => handleCopyPhone(cust.phone, e)}
                          className="text-slate-500 hover:text-amber-400 p-0.5"
                        >
                          {copiedPhone === cust.phone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>{getTierBadge(cust.tier)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Tổng chi tiêu:</span>
                    <span className="font-extrabold text-amber-400">{formatCurrency(cust.totalSpent)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Lần cuối ghé:</span>
                    <span className="text-slate-300 font-medium">{formatRelativeTime(cust.lastSeenAt)}</span>
                  </div>
                  {cust.deviceModel && (
                    <div className="col-span-2">
                      <span className="text-slate-500 text-[10px] block">Dòng máy:</span>
                      <span className="text-cyan-400 font-medium">{cust.deviceModel}</span>
                    </div>
                  )}
                </div>

                {cust.reminders && cust.reminders.length > 0 && (
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-bold truncate">{cust.reminders[0].title}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${cust.phone}`}
                      className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" /> Gọi
                    </a>
                    <a
                      href={`https://zalo.me/${cust.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" /> Zalo
                    </a>
                  </div>
                  <button
                    onClick={() => handleOpenDetail(cust)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Xem 360</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DRAWER / MODAL CHI TIẾT HỒ SƠ KHÁCH HÀNG 360 */}
      {activeCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header Drawer */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800 relative">
              <button
                onClick={() => setActiveCustomer(null)}
                className="absolute top-5 right-5 p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center border-2 border-amber-300/40 shadow-lg shadow-amber-500/20 shrink-0">
                    {activeCustomer.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-black text-white">{activeCustomer.fullName}</h2>
                      {getTierBadge(activeCustomer.tier)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                      <span className="text-slate-200 font-bold">{activeCustomer.phone}</span>
                      <button
                        onClick={() => handleCopyPhone(activeCustomer.phone)}
                        className="text-slate-500 hover:text-amber-400 p-0.5"
                        title="Sao chép SĐT"
                      >
                        {copiedPhone === activeCustomer.phone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick actions header */}
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`tel:${activeCustomer.phone}`}
                    className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Gọi Ngay</span>
                  </a>
                  <a
                    href={`https://zalo.me/${activeCustomer.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Mở Zalo</span>
                  </a>
                  <button
                    onClick={handleStartEdit}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sửa Hồ Sơ</span>
                  </button>
                </div>
              </div>

              {/* Dải thông số nhanh */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-5 pt-4 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block">Tổng chi tiêu:</span>
                  <span className="font-black text-amber-400 text-sm">{formatCurrency(activeCustomer.totalSpent)}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Dòng máy:</span>
                  <span className="font-bold text-cyan-300 truncate block">
                    {activeCustomer.deviceModel || 'Chưa cập nhật'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Chi nhánh quen:</span>
                  <span className="font-bold text-slate-200 truncate block">
                    {activeCustomer.homeBranchName || 'Phụ Kiện 88'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Lần cuối ghé:</span>
                  <span className="font-bold text-slate-300">
                    {formatRelativeTime(activeCustomer.lastSeenAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-Tabs Navigation */}
            <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 bg-slate-950/60 border-b border-slate-800 overflow-x-auto text-xs shrink-0">
              <button
                onClick={() => setActiveDetailTab('care')}
                className={`px-4 py-2.5 rounded-t-xl font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
                  activeDetailTab === 'care'
                    ? 'border-amber-400 text-amber-400 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Nhật Ký CSKH & AI Gợi Ý</span>
                {activeCustomer.reminders?.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>

              <button
                onClick={() => setActiveDetailTab('orders')}
                className={`px-4 py-2.5 rounded-t-xl font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
                  activeDetailTab === 'orders'
                    ? 'border-amber-400 text-amber-400 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Đơn Hàng POS ({activeCustomer.orders?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveDetailTab('tickets')}
                className={`px-4 py-2.5 rounded-t-xl font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
                  activeDetailTab === 'tickets'
                    ? 'border-amber-400 text-amber-400 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Phiếu Sửa Chữa ({activeCustomer.tickets?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveDetailTab('chat')}
                className={`px-4 py-2.5 rounded-t-xl font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
                  activeDetailTab === 'chat'
                    ? 'border-amber-400 text-amber-400 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Chatbot Bé 8 ({activeCustomer.leads?.length || 0})</span>
              </button>
            </div>

            {/* Body Nội Dung Modal (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Form Chỉnh sửa Hồ Sơ Khách Hàng */}
              {isEditingProfile && (
                <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      Cập Nhật Hồ Sơ Khách Hàng Trên Cloud
                    </h3>
                    <button onClick={() => setIsEditingProfile(false)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Họ & Tên khách hàng:</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Dòng máy đang dùng:</label>
                      <input
                        type="text"
                        value={editDevice}
                        onChange={(e) => setEditDevice(e.target.value)}
                        placeholder="VD: iPhone 14 Pro Max 256GB"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Chi nhánh quen thuộc:</label>
                      <select
                        value={editBranchId}
                        onChange={(e) => setEditBranchId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="">Chọn chi nhánh</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Ngày sinh nhật (nếu có):</label>
                      <input
                        type="date"
                        value={editBirthday}
                        onChange={(e) => setEditBirthday(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 font-bold mb-1">Ghi chú đặc biệt về khách:</label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={2}
                        placeholder="Thói quen mua hàng, người thân đi cùng, sở thích phụ kiện..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3.5 py-1.5 bg-slate-900 text-slate-400 hover:text-white rounded-xl text-xs font-bold"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      {isSavingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Lưu Lên Cloud</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 1: NHẬT KÝ CSKH & AI GỢI Ý */}
              {activeDetailTab === 'care' && (
                <div className="space-y-6">
                  {/* AI Care Triggers / Lời Nhắc CSKH Thông Minh */}
                  {activeCustomer.reminders && activeCustomer.reminders.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Gợi Ý Chăm Sóc Khách Hàng Tự Động (AI Triggers)
                      </h3>
                      <div className="space-y-2">
                        {activeCustomer.reminders.map((rem, idx) => (
                          <div 
                            key={idx}
                            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                              rem.isUrgent
                                ? 'bg-rose-500/10 border-rose-500/30'
                                : 'bg-amber-500/10 border-amber-500/30'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-white">{rem.title}</span>
                                {rem.isUrgent && (
                                  <span className="text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded">
                                    Ưu tiên cao
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-300">{rem.message}</p>
                              <div className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
                                <span>👉 Gợi ý:</span>
                                <span>{rem.suggestedAction}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setNewLogType('ZALO');
                                setNewLogContent(`Đã gửi tin nhắn chăm sóc: "${rem.title}". Khách phản hồi: `);
                              }}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer"
                            >
                              + Điền vào Nhật Ký
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Form Ghi Nhật Ký Chăm Sóc Khách Hàng Mới */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                    <h3 className="text-xs font-black uppercase text-slate-200 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-emerald-400" />
                      Ghi Nhật Ký Chăm Sóc Mới (Lưu Supabase Cloud)
                    </h3>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={newLogType}
                        onChange={(e) => setNewLogType(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 shrink-0"
                      >
                        <option value="CALL">📞 Gọi điện thoại</option>
                        <option value="ZALO">💬 Nhắn tin Zalo</option>
                        <option value="GIFT">🎁 Tặng Voucher / Quà</option>
                        <option value="WARRANTY_REMINDER">🛡️ Nhắc bảo hành / Vệ sinh máy</option>
                        <option value="NOTE">📝 Ghi chú chung</option>
                      </select>

                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={newLogContent}
                          onChange={(e) => setNewLogContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddCareLog();
                          }}
                          placeholder="Nội dung tương tác với khách (VD: Khách hẹn chiều ghé dán kính, thích mẫu KingKong)..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-3 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          onClick={handleAddCareLog}
                          disabled={isSavingLog || !newLogContent.trim()}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-lg transition-colors cursor-pointer"
                          title="Lưu nhật ký"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lịch Sử Các Lần Chăm Sóc */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase text-slate-400">
                      Lịch Sử Chăm Sóc & Tương Tác ({activeCustomer.careLogs?.length || 0})
                    </h3>

                    {activeCustomer.careLogs && activeCustomer.careLogs.length > 0 ? (
                      <div className="space-y-2">
                        {activeCustomer.careLogs.map((log, idx) => (
                          <div key={idx} className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-start justify-between gap-3 text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-amber-400">
                                  {log.action_type === 'CALL' ? '📞 Gọi điện' : 
                                   log.action_type === 'ZALO' ? '💬 Nhắn Zalo' : 
                                   log.action_type === 'GIFT' ? '🎁 Tặng quà' : '📝 Ghi chú'}
                                </span>
                                <span className="text-slate-500">•</span>
                                <span className="text-slate-400 font-medium">Bởi: {log.staff_name || 'Nhân sự'}</span>
                              </div>
                              <p className="text-slate-200">{log.content}</p>
                            </div>
                            <span className="text-[10px] text-slate-500 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString('vi-VN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 text-xs text-slate-500">
                        Chưa có nhật ký chăm sóc nào cho khách hàng này.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: ĐƠN HÀNG POS */}
              {activeDetailTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-slate-300">
                      Lịch Sử Đơn Hàng Tại Quầy POS ({activeCustomer.orders?.length || 0} đơn)
                    </h3>
                    <span className="text-xs text-amber-400 font-bold">
                      Tổng tiền: {formatCurrency(activeCustomer.orders?.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0) || 0)}
                    </span>
                  </div>

                  {activeCustomer.orders && activeCustomer.orders.length > 0 ? (
                    <div className="space-y-3">
                      {activeCustomer.orders.map((ord, idx) => (
                        <div key={idx} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-200">#{ord.code || ord.id}</span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                {ord.branchName || 'PK88'}
                              </span>
                            </div>
                            <span className="text-slate-400 text-[11px]">
                              {new Date(ord.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>

                          {/* Danh sách món hàng */}
                          <div className="divide-y divide-slate-800/50 text-xs">
                            {(ord.items || []).map((item: any, itemIdx: number) => (
                              <div key={itemIdx} className="py-2 flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <div className="text-slate-200 font-medium">{item.product?.name || 'Sản phẩm'}</div>
                                  <div className="text-[11px] text-slate-500">
                                    Số lượng: {item.quantity} x {formatCurrency(item.price)}
                                  </div>
                                </div>
                                <div className="font-bold text-slate-200">
                                  {formatCurrency((item.quantity || 1) * (item.price || 0))}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                            <span className="text-slate-400">Thu ngân: {ord.cashierName || 'PK88 Staff'}</span>
                            <span className="font-black text-amber-400 text-sm">{formatCurrency(ord.totalAmount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 text-xs text-slate-500">
                      Chưa có đơn hàng nào tại quầy POS.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PHIẾU SỬA CHỮA */}
              {activeDetailTab === 'tickets' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-slate-300">
                      Lịch Sử Tiếp Nhận & Sửa Chữa ({activeCustomer.tickets?.length || 0} phiếu)
                    </h3>
                    <span className="text-xs text-amber-400 font-bold">
                      Tổng phí: {formatCurrency(activeCustomer.tickets?.reduce((acc, t) => acc + (Number(t.price) || 0), 0) || 0)}
                    </span>
                  </div>

                  {activeCustomer.tickets && activeCustomer.tickets.length > 0 ? (
                    <div className="space-y-3">
                      {activeCustomer.tickets.map((t, idx) => (
                        <div key={idx} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-200">#{t.id}</span>
                              <span className="font-bold text-cyan-400">{t.deviceModel || t.device_model}</span>
                            </div>
                            <span className="text-slate-500 text-[11px]">
                              {new Date(t.createdAt || t.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          </div>

                          <div className="text-slate-300">
                            <span className="text-slate-500">Dịch vụ:</span> {t.serviceType || t.issue_description || 'Sửa chữa điện thoại'}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                            <span className="text-slate-400">KTV: {t.technicianName || t.technician_name || 'Kỹ thuật PK88'}</span>
                            <span className="font-black text-amber-400">{formatCurrency(t.price)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 text-xs text-slate-500">
                      Chưa có phiếu sửa chữa nào.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CHATBOT BÉ 8 & CUỘC HỘI THOẠI */}
              {activeDetailTab === 'chat' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-slate-300">
                      Lịch Sử Tư Vấn Chatbot Bé 8 ({activeCustomer.leads?.length || 0} phiên)
                    </h3>
                  </div>

                  {activeCustomer.leads && activeCustomer.leads.length > 0 ? (
                    <div className="space-y-4">
                      {activeCustomer.leads.map((lead, idx) => (
                        <div key={idx} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-400">{lead.product_interest || lead.need || 'Quan tâm phụ kiện'}</span>
                              {lead.voucher_code && (
                                <span className="font-mono text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                                  {lead.voucher_code}
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 text-[11px]">
                              {new Date(lead.created_at).toLocaleString('vi-VN')}
                            </span>
                          </div>

                          {lead.conversation_summary && (
                            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-slate-300">
                              <span className="text-slate-500 font-bold block mb-1">Tóm tắt nhu cầu khách:</span>
                              {lead.conversation_summary}
                            </div>
                          )}

                          {/* Đoạn hội thoại thực tế */}
                          {lead.activity_log && Array.isArray(lead.activity_log) && (
                            <div className="space-y-2 pt-2">
                              <span className="text-[11px] font-bold text-slate-400">Chi tiết đối thoại AI & Khách:</span>
                              <div className="max-h-56 overflow-y-auto space-y-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800/60">
                                {lead.activity_log.map((msg: any, mIdx: number) => (
                                  <div
                                    key={mIdx}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                  >
                                    <div
                                      className={`max-w-[85%] p-2.5 rounded-2xl text-xs ${
                                        msg.sender === 'user'
                                          ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none'
                                          : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-none'
                                      }`}
                                    >
                                      <div className="text-[10px] font-bold opacity-75 mb-0.5">
                                        {msg.sender === 'user' ? 'Khách hàng' : 'Bé 8 (Trợ lý AI)'}
                                      </div>
                                      <div className="whitespace-pre-wrap">{msg.text}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 text-xs text-slate-500">
                      Khách hàng này chưa từng tương tác qua Chatbot Bé 8.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Dữ liệu đồng bộ trực tiếp Supabase Cloud PostgreSQL
              </span>
              <button
                onClick={() => setActiveCustomer(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
