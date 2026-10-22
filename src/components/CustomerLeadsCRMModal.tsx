import React, { useState, useEffect } from 'react';
import { Branch, Staff, CustomerLead, CustomerLeadStatus } from '../types';
import { fetchCustomerLeads, updateCustomerLeadStatus, deleteCustomerLead } from '../lib/leadService';
import { 
  Phone, 
  MessageSquare, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Sparkles, 
  User, 
  Search, 
  Filter, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  Trash2, 
  AlertCircle,
  Tag,
  Gift,
  Building2,
  Share2,
  Globe,
  QrCode
} from 'lucide-react';
import { LeadLinkGeneratorModal, PlatformBrandIcon } from './LeadLinkGeneratorModal';

interface CustomerLeadsCRMModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  currentUser?: Staff | null;
  defaultBranchId?: string;
}

export const CustomerLeadsCRMModal: React.FC<CustomerLeadsCRMModalProps> = ({
  isOpen,
  onClose,
  branches,
  currentUser,
  defaultBranchId
}) => {
  const [leads, setLeads] = useState<CustomerLead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showLinkGenModal, setShowLinkGenModal] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null);
  const [expandedChatLeadId, setExpandedChatLeadId] = useState<string | number | null>(null);
  const [activeLeadTab, setActiveLeadTab] = useState<'with_phone' | 'chatting'>('with_phone');

  // Khởi tạo lọc theo chi nhánh của nhân viên nếu không phải lãnh đạo cấp cao
  useEffect(() => {
    if (currentUser) {
      const isLeadership = currentUser.role === 'admin' || currentUser.role === 'founder' || currentUser.role === 'hr';
      if (!isLeadership && currentUser.branchId) {
        const myBranch = branches.find(b => b.id === currentUser.branchId);
        if (myBranch) {
          // Lọc theo tên rút gọn của branch
          setSelectedBranchFilter(myBranch.name.replace('Phụ Kiện 88 - ', ''));
        }
      }
    }
  }, [currentUser, branches]);

  const loadLeads = async () => {
    setIsLoading(true);
    const data = await fetchCustomerLeads();
    setLeads(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadLeads();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Lọc danh sách leads
  const filteredLeads = leads.filter(lead => {
    // 1. Lọc chi nhánh
    if (selectedBranchFilter !== 'ALL') {
      const bName = lead.branch || '';
      if (!bName.toLowerCase().includes(selectedBranchFilter.toLowerCase())) {
        return false;
      }
    }

    // 2. Lọc trạng thái
    if (selectedStatusFilter !== 'ALL') {
      if (lead.status !== selectedStatusFilter) {
        return false;
      }
    }

    // 3. Lọc kênh nguồn
    if (selectedSourceFilter !== 'ALL') {
      const src = (lead.source || '').toLowerCase();
      if (!src.includes(selectedSourceFilter.toLowerCase())) {
        return false;
      }
    }

    // 4. Tìm kiếm theo tên hoặc SĐT
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = lead.customer_name?.toLowerCase().includes(q);
      const matchPhone = lead.phone?.includes(q);
      const matchNeed = lead.need?.toLowerCase().includes(q);
      const matchVoucher = lead.voucher_code?.toLowerCase().includes(q);
      const matchSource = lead.source?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchNeed && !matchVoucher && !matchSource) {
        return false;
      }
    }

    return true;
  });

  // Phân chia 2 nhóm: Khách có SĐT (Telesales gọi ngay) và Khách đang chat / chưa có SĐT (Marketing & Quản lý theo dõi)
  const leadsWithPhone = filteredLeads.filter(l => Boolean(l.phone && l.phone.trim().length >= 8 && l.status !== 'CHATTING'));
  const leadsChatting = filteredLeads.filter(l => !l.phone || l.phone.trim().length < 8 || l.status === 'CHATTING');
  const displayLeads = activeLeadTab === 'with_phone' ? leadsWithPhone : leadsChatting;

  // Đổi trạng thái lead
  const handleStatusChange = async (leadId: string | number, newStatus: CustomerLeadStatus) => {
    setActionLoadingId(leadId);
    const success = await updateCustomerLeadStatus(
      leadId, 
      newStatus, 
      undefined, 
      currentUser?.fullName || 'Nhân sự PK88'
    );
    setActionLoadingId(null);
    if (success) {
      setLeads(prev => prev.map(item => {
        if (item.id === leadId || String(item.id) === String(leadId)) {
          return { ...item, status: newStatus, last_action_at: new Date().toISOString() };
        }
        return item;
      }));
    }
  };

  // Xóa lead (chỉ dành cho Admin/Founder)
  const handleDeleteLead = async (leadId: string | number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này khỏi danh sách?')) return;
    setActionLoadingId(leadId);
    const success = await deleteCustomerLead(leadId);
    setActionLoadingId(null);
    if (success) {
      setLeads(prev => prev.filter(item => item.id !== leadId && String(item.id) !== String(leadId)));
    }
  };

  // Sao chép link chatbot để gửi khách
  const handleCopyChatbotLink = () => {
    const url = window.location.origin + window.location.pathname + '?tab=tu-van';
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>MỚI CHƯA GỌI</span>
          </span>
        );
      case 'CONTACTED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            ĐÃ GỌI / TƯ VẤN
          </span>
        );
      case 'APPOINTED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            HẸN GHÉ SHOP
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>ĐÃ MUA THÀNH CÔNG</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            HỦY / KHÔNG LIÊN HỆ ĐƯỢC
          </span>
        );
      case 'CHATTING':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>ĐANG TƯ VẤN</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-scale-up">
        {/* 1. Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-purple-950/30 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 p-0.5 shadow-lg shadow-rose-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-rose-400">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  KHÁCH HÀNG TIỀM NĂNG & CHỐT ĐƠN TELESALES
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-slate-950 text-[10px] font-black">
                  {filteredLeads.filter(l => l.status === 'NEW').length} Chờ Gọi
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dữ liệu khách hàng để lại từ Chatbot Bé 8 • Phân bổ về 7 chi nhánh gọi điện chốt đơn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyChatbotLink}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-slate-700 transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Đã chép link Chatbot' : 'Copy Link Chatbot'}</span>
            </button>

            <button
              type="button"
              onClick={loadLeads}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              title="Tải lại dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-rose-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setShowLinkGenModal(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Tạo Link & Mã QR</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Banner Link Chatbot Bé 8 Công Khai */}
        <div className="mx-4 sm:mx-5 mt-3 p-3 bg-gradient-to-r from-cyan-950/70 via-slate-900 to-amber-950/40 border border-cyan-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-inner">
          <div className="flex items-center gap-2.5">
            <img src="/be8-avatar.jpg" alt="Bé 8" className="w-9 h-9 rounded-full border border-cyan-400 object-cover shrink-0 shadow-sm shadow-cyan-500/20" />
            <div>
              <div className="font-extrabold text-cyan-300 flex items-center gap-1.5">
                <span>Trang Chatbot Bé 8 Công Khai (Tặng Voucher & Thu Thập SĐT)</span>
              </div>
              <span className="text-[11px] text-slate-300 font-mono select-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/?tab=tu-van` : '/?tab=tu-van'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopyChatbotLink}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Đã sao chép!' : 'Sao chép link'}</span>
            </button>
            <a
              href={`${typeof window !== 'undefined' ? window.location.origin : ''}/?tab=tu-van`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Mở thử</span>
            </a>
          </div>
        </div>

        {/* THANH CHUYỂN TAB: CÓ SĐT (TELESALES) vs ĐANG CHAT (GIÁM SÁT / MARKETING) */}
        <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-slate-800 bg-slate-900/60 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveLeadTab('with_phone')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeLeadTab === 'with_phone'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-600/30 ring-1 ring-white/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <Phone className="w-3.5 h-3.5 text-amber-300" />
            <span>🔥 Khách Có SĐT - Cần Gọi Ngay</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeLeadTab === 'with_phone' ? 'bg-slate-950/80 text-amber-300' : 'bg-slate-900 text-slate-400'
            }`}>
              {leadsWithPhone.length}
            </span>
            {leadsWithPhone.filter(l => l.status === 'NEW').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveLeadTab('chatting')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeLeadTab === 'chatting'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30 ring-1 ring-white/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-cyan-300" />
            <span>💬 Khách Đang Chat / Chưa Có SĐT</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeLeadTab === 'chatting' ? 'bg-slate-950/80 text-cyan-300' : 'bg-slate-900 text-slate-400'
            }`}>
              {leadsChatting.length}
            </span>
          </button>
        </div>

        {/* 2. Thanh lọc & Tìm kiếm */}
        <div className="p-3 sm:p-4 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, voucher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Lọc chi nhánh */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 font-bold rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="ALL">Tất cả chi nhánh</option>
                <option value="Phú Khương">Phú Khương (Bến Tre)</option>
                <option value="Đồng Khởi">Đồng Khởi (Bến Tre)</option>
                <option value="Mỹ Tho">Mỹ Tho (Tiền Giang)</option>
                <option value="Cần Thơ">Cần Thơ</option>
                <option value="Vĩnh Long">Vĩnh Long</option>
                <option value="Thủ Đức">Thủ Đức (TP.HCM)</option>
                <option value="Văn Phòng">Văn Phòng Chuỗi</option>
              </select>
            </div>

            {/* Lọc trạng thái */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 font-bold rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="ALL">Mọi trạng thái</option>
                <option value="NEW">🚨 Mới chưa gọi</option>
                <option value="CONTACTED">📞 Đã gọi / Tư vấn</option>
                <option value="APPOINTED">🗓️ Hẹn ghé shop</option>
                <option value="COMPLETED">✅ Đã mua thành công</option>
                <option value="CANCELLED">❌ Đã hủy</option>
                <option value="CHATTING">💬 Đang chat / Vãng lai</option>
              </select>
            </div>

            {/* Lọc kênh nguồn */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Globe className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <select
                value={selectedSourceFilter}
                onChange={(e) => setSelectedSourceFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 font-bold rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="ALL">Mọi kênh nguồn</option>
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
                <option value="zalo">Zalo</option>
                <option value="qr">QR Bàn Shop</option>
                <option value="website">Website PK88</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Danh sách Leads */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-400 mb-2" />
              <span>Đang tải danh sách khách hàng từ Supabase Cloud...</span>
            </div>
          ) : displayLeads.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-slate-900/50 rounded-2xl border border-slate-800">
              <User className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="font-bold text-slate-300">
                {activeLeadTab === 'with_phone' 
                  ? 'Chưa có khách hàng có SĐT nào phù hợp bộ lọc'
                  : 'Chưa có phiên chat vãng lai nào phù hợp bộ lọc'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Hãy chia sẻ link Chatbot <code className="text-amber-400">?tab=tu-van</code> lên Facebook, Zalo để thu hút thêm khách hàng mới!
              </p>
            </div>
          ) : (
            displayLeads.map((lead) => {
              const isActionLoading = actionLoadingId === lead.id;
              const formattedTime = lead.created_at
                ? new Date(lead.created_at).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Mới đây';

              return (
                <div
                  key={lead.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    lead.status === 'NEW'
                      ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/20 ring-1 ring-rose-500/30'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2.5">
                    {/* Tên khách & SĐT */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-400 font-black text-sm">
                        {lead.customer_name ? lead.customer_name.charAt(0).toUpperCase() : 'K'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-white">
                            {lead.customer_name || 'Khách vãng lai'}
                          </h4>
                          {lead.phone && lead.phone.trim().length >= 8 ? (
                            <span className="font-mono text-sm font-black text-amber-400 tracking-wider">
                              {lead.phone}
                            </span>
                          ) : (
                            <span className="font-sans text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-cyan-400" />
                              <span>Chưa để lại SĐT</span>
                            </span>
                          )}
                          {getStatusBadge(lead.status)}
                          {/* Huy hiệu Nguồn */}
                          {(() => {
                            const src = (lead.source || '').toLowerCase();
                            let platId = '';
                            let label = lead.source || '';
                            let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';

                            if (src.includes('facebook') || src.includes('fb')) {
                              platId = 'facebook';
                              label = 'Facebook';
                              badgeStyle = 'bg-blue-600/15 text-blue-300 border-blue-500/30';
                            } else if (src.includes('tiktok')) {
                              platId = 'tiktok';
                              label = 'TikTok';
                              badgeStyle = 'bg-pink-600/15 text-pink-300 border-pink-500/30';
                            } else if (src.includes('zalo')) {
                              platId = 'zalo';
                              label = 'Zalo';
                              badgeStyle = 'bg-sky-600/15 text-sky-300 border-sky-500/30';
                            } else if (src.includes('youtube')) {
                              platId = 'youtube';
                              label = 'YouTube';
                              badgeStyle = 'bg-rose-600/15 text-rose-300 border-rose-500/30';
                            } else if (src.includes('qr')) {
                              platId = 'qr_table';
                              label = 'QR Bàn Shop';
                              badgeStyle = 'bg-amber-600/15 text-amber-300 border-amber-500/30';
                            } else if (src.includes('website') || src.includes('web')) {
                              platId = 'website';
                              label = 'Website';
                              badgeStyle = 'bg-emerald-600/15 text-emerald-300 border-emerald-500/30';
                            }

                            if (!src) return null;

                            return (
                              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                                {platId ? (
                                  <PlatformBrandIcon platformId={platId} className="w-3.5 h-3.5 shrink-0 rounded-[3px]" />
                                ) : (
                                  <span className="text-[11px]">🎯</span>
                                )}
                                <span>{label}</span>
                              </span>
                            );
                          })()}
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formattedTime}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-amber-300 font-semibold">
                            <MapPin className="w-3 h-3" />
                            <span>{lead.branch || 'Chưa chọn shop'}</span>
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Nút hành động */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {lead.phone && lead.phone.trim().length >= 8 ? (
                        <>
                          <a
                            href={`tel:${lead.phone}`}
                            onClick={() => {
                              if (lead.status === 'NEW') {
                                handleStatusChange(lead.id, 'CONTACTED');
                              }
                            }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>GỌI ĐIỆN</span>
                          </a>

                          <a
                            href={`https://zalo.me/${lead.phone}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => {
                              if (lead.status === 'NEW') {
                                handleStatusChange(lead.id, 'CONTACTED');
                              }
                            }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>CHAT ZALO</span>
                          </a>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setExpandedChatLeadId(expandedChatLeadId === lead.id ? null : lead.id)}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{expandedChatLeadId === lead.id ? 'ĐÓNG HỘI THOẠI' : 'XEM HỘI THOẠI'}</span>
                        </button>
                      )}

                      {/* Nút xóa cho Admin/Founder */}
                      {(currentUser?.role === 'founder' || currentUser?.role === 'admin') && (
                        <button
                          type="button"
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-all cursor-pointer"
                          title="Xóa khách này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chi tiết nhu cầu & Mã voucher */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-slate-300">
                        <span className="font-bold text-slate-400">Nhu cầu:</span>{' '}
                        <span className="text-amber-200">{lead.need || 'Tư vấn mua phụ kiện'}</span>
                      </p>

                      {lead.voucher_code && (
                        <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex-shrink-0">
                          <Gift className="w-3 h-3" />
                          <span>Mã: {lead.voucher_code}</span>
                        </div>
                      )}
                    </div>

                    {/* Nút Xem Chi Tiết Lịch Sử Phiên Chat */}
                    <div className="pt-1.5 flex items-center justify-between border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => setExpandedChatLeadId(expandedChatLeadId === lead.id ? null : lead.id)}
                        className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {expandedChatLeadId === lead.id 
                            ? 'Thu gọn Lịch Sử Chat ▲' 
                            : `Xem Lịch Sử Phiên Chat Với Bé 8 (${Array.isArray(lead.activity_log) ? lead.activity_log.length : 1} tin nhắn) ▼`}
                        </span>
                      </button>

                      <span className="text-[10px] text-slate-400">
                        Nguồn: <strong className="text-slate-300">{lead.source === 'web_chatbot_inline' ? 'Nhập SĐT trong chat' : 'Form E-Voucher'}</strong>
                      </span>
                    </div>

                    {/* Hộp Thoại Lịch Sử Phiên Chat Khi Bấm Mở */}
                    {expandedChatLeadId === lead.id && (
                      <div className="mt-2.5 p-3 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2.5 max-h-80 overflow-y-auto scrollbar-thin">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px] text-slate-400">
                          <span className="font-bold text-amber-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>Lịch Sử Từng Tin Nhắn Của Khách Hàng Với Bé 8 AI</span>
                          </span>
                          <span className="font-mono text-slate-400">Chi nhánh: {lead.branch}</span>
                        </div>

                        {Array.isArray(lead.activity_log) && lead.activity_log.length > 0 ? (
                          lead.activity_log.map((chat, idx) => (
                            <div
                              key={idx}
                              className={`flex gap-2 text-xs ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              {chat.sender !== 'user' && (
                                <img
                                  src="/be8-avatar.jpg"
                                  alt="Bé 8"
                                  className="w-6 h-6 rounded-lg object-cover ring-1 ring-rose-500/40 flex-shrink-0 mt-0.5"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/logo-pk88.jpg';
                                  }}
                                />
                              )}
                              <div
                                className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                                  chat.sender === 'user'
                                    ? 'bg-rose-500/20 text-rose-200 border border-rose-500/30 rounded-tr-none'
                                    : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
                                }`}
                              >
                                <div className="text-[10px] text-slate-400 font-semibold mb-0.5 flex items-center justify-between gap-2">
                                  <span>{chat.sender === 'user' ? '👤 Khách hàng' : '🤖 Bé 8 AI CSKH'}</span>
                                  <span className="text-[9px] text-slate-400 font-normal">{chat.time}</span>
                                </div>
                                <div className="whitespace-pre-line text-xs font-medium">
                                  {chat.text}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-slate-300 font-sans whitespace-pre-line text-xs">
                            {lead.conversation_summary || 'Chưa ghi nhận hội thoại chi tiết.'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Thanh cập nhật trạng thái */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span>Tiến độ:</span>
                        <select
                          disabled={isActionLoading}
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as CustomerLeadStatus)}
                          className="bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 rounded-lg px-2 py-1 outline-none focus:border-rose-500 cursor-pointer"
                        >
                          <option value="NEW">🚨 Mới chưa gọi</option>
                          <option value="CONTACTED">📞 Đã gọi tư vấn</option>
                          <option value="APPOINTED">🗓️ Hẹn ghé shop</option>
                          <option value="COMPLETED">✅ Đã mua thành công</option>
                          <option value="CANCELLED">❌ Khách hủy / Không nghe</option>
                          <option value="CHATTING">💬 Đang chat / Vãng lai</option>
                        </select>
                      </div>

                      {/* Các nút bấm nhanh 1-chạm đổi tiến độ */}
                      {lead.status === 'NEW' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(lead.id, 'CONTACTED')}
                          className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold border border-amber-500/40 cursor-pointer"
                        >
                          ✓ Đánh dấu đã gọi
                        </button>
                      )}

                      {lead.status === 'CONTACTED' && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(lead.id, 'APPOINTED')}
                            className="px-2 py-0.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[11px] font-bold border border-purple-500/40 cursor-pointer"
                          >
                            🗓️ Hẹn ghé shop
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(lead.id, 'COMPLETED')}
                            className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 cursor-pointer"
                          >
                            ✅ Đã mua
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(lead.id, 'CANCELLED')}
                            className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-[11px] font-bold border border-slate-700 cursor-pointer"
                          >
                            ❌ Hủy
                          </button>
                        </div>
                      )}

                      {lead.status === 'APPOINTED' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(lead.id, 'COMPLETED')}
                          className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Khách đã ghé mua xong</span>
                        </button>
                      )}
                    </div>

                    {lead.assigned_to && (
                      <span className="text-[11px] text-slate-400">
                        Nhân viên hỗ trợ: <strong className="text-slate-300">{lead.assigned_to}</strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL TẠO LINK & MÃ QR ĐA KÊNH */}
      <LeadLinkGeneratorModal
        isOpen={showLinkGenModal}
        onClose={() => setShowLinkGenModal(false)}
        branches={branches}
      />
    </div>
  );
};
