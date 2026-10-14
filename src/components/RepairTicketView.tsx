import React, { useState, useEffect } from 'react';
import { RepairTicket, UserRole, Product, Branch, Staff } from '../types';
import { QrCode, Search, Wrench, Plus, CheckCircle2, Clock, Smartphone, UserCheck, ArrowRight, Cpu, Sparkles, MapPin, Building, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AITechnicianModal } from './AITechnicianModal';

interface RepairTicketViewProps {
  tickets: RepairTicket[];
  role: UserRole;
  currentUser?: Staff | null;
  currentBranch?: Branch;
  branches?: Branch[];
  onCreateTicket: (ticket: RepairTicket) => void;
  onUpdateTicket?: (ticketId: string, updates: Partial<RepairTicket>) => Promise<boolean>;
  currentUserName?: string;
}

export const RepairTicketView: React.FC<RepairTicketViewProps> = ({ 
  tickets, 
  role, 
  currentUser,
  currentBranch,
  branches = [],
  onCreateTicket, 
  onUpdateTicket, 
  currentUserName 
}) => {
  const [searchCode, setSearchCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // Customer Search State
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [searchedTicket, setSearchedTicket] = useState<RepairTicket | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-detect branch based on logged in staff
  const staffBranch = branches.find(b => b.id === currentUser?.branchId) || currentBranch || branches[0];
  const [selectedBranchId, setSelectedBranchId] = useState<string>(staffBranch?.id || 'b1');

  useEffect(() => {
    if (currentUser?.branchId) {
      setSelectedBranchId(currentUser.branchId);
    } else if (currentBranch?.id) {
      setSelectedBranchId(currentBranch.id);
    }
  }, [currentUser?.branchId, currentBranch?.id]);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceModel, setDeviceModel] = useState('iPhone 13 Pro Max');
  const [serviceType, setServiceType] = useState<string>('Ép Kính / Ép Cảm Ứng');
  const [price, setPrice] = useState('850000');

  // Popular Hardware Repair Services presets for quick 1-touch selection
  const POPULAR_SERVICES = [
    'Ép Kính / Ép Cảm Ứng',
    'Thay Màn Hình Zin / Linh Kiện',
    'Thay Pin Dung Lượng Cao (Bison / Chuẩn)',
    'Sửa Face ID / Camera Trước & Sau',
    'Sửa Chân Sạc / Cụm Cáp Sạc Trong Máy',
    'Sửa Loa / Mic / Rung / Chuông',
    'Sửa Mainboard / Mất Nguồn / Mất Sóng',
    'Thay Vỏ / Độ Vỏ / Thay Kính Lưng',
    'Chạy Phần Mềm / Mở Khóa / Cứu Dữ Liệu',
    'Vệ Sinh / Sấy Nước / Bảo Dưỡng Main'
  ];

  const autoDetectServiceType = (text: string, category?: string): string => {
    const fullText = `${text || ''} ${category || ''}`.toLowerCase();

    // 1. Phụ kiện: Pin dự phòng, Sạc dự phòng (BẮT BUỘC kiểm tra đầu tiên để không bị 'pin' hay 'sạc' nuốt chửng)
    if (
      fullText.includes('dự phòng') || 
      fullText.includes('powerbank') || 
      fullText.includes('power bank') ||
      fullText.includes('sạc dự phòng') ||
      fullText.includes('pin dự phòng')
    ) {
      return 'Bán Hàng / Phụ Kiện / Pin Dự Phòng';
    }

    // 2. Phụ kiện sạc & âm thanh & đồ chơi công nghệ (Cáp sạc, củ sạc, tai nghe, loa...)
    if (
      fullText.includes('cáp sạc') || 
      fullText.includes('dây sạc') || 
      fullText.includes('củ sạc') || 
      fullText.includes('cốc sạc') || 
      fullText.includes('tẩu sạc') || 
      fullText.includes('dock sạc') || 
      fullText.includes('magsafe') || 
      fullText.includes('sạc không dây') ||
      fullText.includes('tai nghe') || 
      fullText.includes('airpods') || 
      fullText.includes('earphone') || 
      fullText.includes('headphone') ||
      fullText.includes('loa bluetooth') || 
      fullText.includes('gậy chụp') || 
      fullText.includes('giá đỡ') || 
      fullText.includes('túi chống nước') ||
      fullText.includes('dây đeo') ||
      fullText.includes('chuột') || 
      fullText.includes('bàn phím')
    ) {
      return 'Bán Hàng / Phụ Kiện / Pin Dự Phòng';
    }

    // 3. Phụ kiện bảo vệ màn & máy (Dán PPF, Cường lực, Ốp lưng)
    if (
      fullText.includes('ppf') || 
      fullText.includes('cường lực') || 
      fullText.includes('kính bảo vệ') || 
      fullText.includes('dán full') || 
      fullText.includes('ốp lưng') || 
      fullText.includes('ốp') || 
      fullText.includes('bao da') || 
      fullText.includes('dán')
    ) {
      return 'Bán Hàng / Dán PPF / Cường Lực';
    }

    // 4. Dịch vụ Sửa chữa / Thay thế Pin điện thoại (CHỈ kích hoạt khi KHÔNG PHẢI pin dự phòng)
    if (
      fullText.includes('thay pin') || 
      fullText.includes('bison') || 
      fullText.includes('deji') || 
      fullText.includes('pisen') || 
      fullText.includes('eu teck') || 
      fullText.includes('cell pin') || 
      fullText.includes('sàng cổ pin') || 
      fullText.includes('pin dung lượng cao') ||
      (fullText.includes('pin') && !fullText.includes('dự phòng'))
    ) {
      return 'Thay Pin Dung Lượng Cao (Bison / Chuẩn)';
    }

    // 5. Ép Kính / Ép Cảm Ứng
    if (fullText.includes('ép kính') || fullText.includes('cảm ứng') || fullText.includes('mặt kính') || fullText.includes('thay kính')) {
      return 'Ép Kính / Ép Cảm Ứng';
    }

    // 6. Thay màn hình
    if (fullText.includes('màn') || fullText.includes('display') || fullText.includes('lcd') || fullText.includes('oled')) {
      return 'Thay Màn Hình Zin / Linh Kiện';
    }

    // 7. Sửa Face ID / Camera
    if (fullText.includes('face id') || fullText.includes('faceid') || fullText.includes('camera') || fullText.includes('cam')) {
      return 'Sửa Face ID / Camera Trước & Sau';
    }

    // 8. Sửa phần cứng chân sạc, loa, mic, rung (chỉ khi là sửa/thay cụm chân sạc máy)
    if (
      fullText.includes('chân sạc') || 
      fullText.includes('cổng sạc') || 
      fullText.includes('cụm sạc') || 
      fullText.includes('sửa sạc') ||
      fullText.includes('loa') || 
      fullText.includes('mic') || 
      fullText.includes('rung') || 
      fullText.includes('chuông')
    ) {
      return 'Sửa Chân Sạc / Loa / Mic / Rung';
    }

    // 9. Mainboard / Mất nguồn / Mất sóng
    if (fullText.includes('main') || fullText.includes('nguồn') || fullText.includes('sóng') || fullText.includes('ic') || fullText.includes('chập')) {
      return 'Sửa Mainboard / Mất Nguồn / Mất Sóng';
    }

    // 10. Vỏ / Độ vỏ / Kính lưng
    if (fullText.includes('vỏ') || fullText.includes('lưng') || fullText.includes('khung') || fullText.includes('sườn')) {
      return 'Thay Vỏ / Độ Vỏ / Thay Kính Lưng';
    }

    // 11. Phần mềm
    if (fullText.includes('phần mềm') || fullText.includes('treo táo') || fullText.includes('icloud') || fullText.includes('restore') || fullText.includes('passcode')) {
      return 'Chạy Phần Mềm / Mở Khóa / Cứu Dữ Liệu';
    }

    // 12. Vệ sinh / Sấy nước
    if (fullText.includes('vệ sinh') || fullText.includes('nước') || fullText.includes('sấy')) {
      return 'Vệ Sinh / Bảo Dưỡng / Sấy Nước';
    }

    return '';
  };

  // Product Search State
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('category', { ascending: true });
      if (data && !error) {
        setProducts(data);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(productSearchTerm.toLowerCase()))
  ).slice(0, 50); // Limit to 50 for performance

  // Chỉ hiển thị các phiếu sửa chữa phần cứng (loại trừ các hóa đơn bán lẻ POS)
  const repairTickets = tickets.filter(
    (t) => !t.code.startsWith('PK88-POS-') && t.serviceType !== 'Bán Hàng & Dịch Vụ Nhanh (POS)'
  );

  const filteredTickets = repairTickets.filter(
    (t) =>
      t.code.toLowerCase().includes(searchCode.toLowerCase()) ||
      t.customerPhone.includes(searchCode) ||
      t.customerName.toLowerCase().includes(searchCode.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedBranch = branches.find(b => b.id === selectedBranchId) || staffBranch;
    const newT: RepairTicket = {
      id: `t-${Date.now()}`,
      code: `PK88-SC-${Math.floor(1000 + Math.random() * 9000)}`,
      branchId: assignedBranch?.id || staffBranch?.id || 'b1',
      customerName,
      customerPhone,
      deviceModel,
      serviceType,
      status: 'RECEIVED',
      price: Number(price),
      createdAt: new Date().toISOString(),
      technicianName: '', // Bỏ trống KTV để họ tự nhận
      createdByStaffId: currentUser?.id,
      createdByStaffName: currentUser?.fullName || currentUserName
    };
    onCreateTicket(newT);
    setShowCreateModal(false);
    setCustomerName('');
    setCustomerPhone('');
    setProductSearchTerm('');
  };

  const handleCustomerSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const search = customerSearchInput.trim().toLowerCase();
    const found = tickets.find(t => t.code.toLowerCase() === search || t.customerPhone.trim() === search);
    setSearchedTicket(found || null);
    setHasSearched(true);
    
    // Phát tín hiệu Context cho Chatbot
    if (found) {
      window.dispatchEvent(new CustomEvent('AI_CONTEXT_UPDATE', { 
        detail: { 
          userName: found.customerName, 
          phone: found.customerPhone, 
          ticketCode: found.code,
          device: found.deviceModel,
          status: found.status
        }
      }));
    }
  };

  const handleClaimTicket = async (ticketId: string) => {
    if (onUpdateTicket && currentUserName) {
      await onUpdateTicket(ticketId, { status: 'IN_PROGRESS', technicianName: currentUserName });
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: RepairTicket['status']) => {
    if (onUpdateTicket) {
      await onUpdateTicket(ticketId, { status: newStatus });
    }
  };

  const getStatusBadge = (status: RepairTicket['status']) => {
    switch (status) {
      case 'RECEIVED':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">1. Đã Tiếp Nhận</span>;
      case 'IN_PROGRESS':
        return <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">2. Đang Sửa Chữa</span>;
      case 'READY':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">3. Sẵn Sàng Giao Máy</span>;
      case 'DELIVERED':
        return <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold">4. Đã Hoàn Thành</span>;
    }
  };

  // If role is customer, show the simplified Public Lookup View!
  if (role === 'customer') {
    return (
      <div className="max-w-md mx-auto glass-card rounded-3xl p-6 border border-slate-800 shadow-2xl">
        <div className="text-center pb-5 border-b border-slate-800">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-rose-500/20">
            <QrCode className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">Tra Cứu Bảo Hành & Sửa Chữa</h2>
          <p className="text-xs text-slate-400 mt-1">Hệ Thống Chuỗi Phụ Kiện 88 Minh Bạch 24/7</p>
        </div>

        <form onSubmit={handleCustomerSearch} className="mt-5 mb-5 relative">
          <input 
            type="text" 
            placeholder="Nhập mã phiếu (VD: PK88-SC-1420) hoặc SĐT..." 
            value={customerSearchInput}
            onChange={(e) => setCustomerSearchInput(e.target.value)}
            className="w-full pl-4 pr-12 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-rose-500 transition-colors"
            required
          />
          <button type="submit" className="absolute right-2 top-2 p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </form>

        {hasSearched && !searchedTicket && (
          <div className="text-center py-8 text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">Không tìm thấy mã phiếu này!</p>
            <p className="text-xs mt-1">Vui lòng kiểm tra lại mã trên biên nhận hoặc SĐT của bạn.</p>
          </div>
        )}

        {searchedTicket && (
          <div className="mt-5 space-y-4">
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">Mã phiếu:</span>
                <span className="text-xs font-mono font-bold text-rose-400">{searchedTicket.code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Khách hàng:</span>
                <span className="text-xs font-bold text-slate-200">{searchedTicket.customerName} ({searchedTicket.customerPhone})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Dòng máy:</span>
                <span className="text-xs font-bold text-slate-200">{searchedTicket.deviceModel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Dịch vụ:</span>
                <span className="text-xs font-bold text-emerald-400">{searchedTicket.serviceType}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400">Chi phí tạm tính:</span>
                <span className="text-sm font-bold font-mono text-slate-100">{searchedTicket.price.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* Stepper Status */}
            <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-300 block mb-3">Tiến Độ Xử Lý Thực Tế:</span>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${searchedTicket.status === 'RECEIVED' || searchedTicket.status === 'IN_PROGRESS' || searchedTicket.status === 'READY' || searchedTicket.status === 'DELIVERED' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>✓</div>
                  <span className={`text-xs font-medium ${searchedTicket.status === 'RECEIVED' || searchedTicket.status === 'IN_PROGRESS' || searchedTicket.status === 'READY' || searchedTicket.status === 'DELIVERED' ? 'text-slate-200' : 'text-slate-500'}`}>1. Tiếp nhận thiết bị tại quầy</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${searchedTicket.status === 'IN_PROGRESS' ? 'bg-sky-500 text-slate-950 shadow-[0_0_10px_rgba(14,165,233,0.5)]' : (searchedTicket.status === 'READY' || searchedTicket.status === 'DELIVERED' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400')}`}>2</div>
                  <span className={`text-xs font-bold ${searchedTicket.status === 'IN_PROGRESS' ? 'text-sky-400' : (searchedTicket.status === 'READY' || searchedTicket.status === 'DELIVERED' ? 'text-slate-200' : 'text-slate-500')}`}>2. Đang sửa chữa {searchedTicket.technicianName ? `(Bởi KTV: ${searchedTicket.technicianName})` : ''}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${searchedTicket.status === 'READY' ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : (searchedTicket.status === 'DELIVERED' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400')}`}>3</div>
                  <span className={`text-xs font-bold ${searchedTicket.status === 'READY' ? 'text-amber-400' : (searchedTicket.status === 'DELIVERED' ? 'text-slate-200' : 'text-slate-500')}`}>3. Sẵn sàng giao máy & Bàn giao</span>
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <span className="text-[11px] text-slate-500">Cần hỗ trợ gấp? Gọi hotline chi nhánh: <strong>0988.888.888</strong></span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Internal Management / Staff view
  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo Mã phiếu, SĐT hoặc Tên khách..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowAIModal(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Cpu className="w-4 h-4" />
            <span>✨ AI Kỹ Thuật PK88</span>
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tạo Phiếu Sửa Chữa Mới</span>
            <span className="sm:hidden">Tạo Phiếu</span>
          </button>
        </div>
      </div>

      {/* Ticket List */}
      {filteredTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTickets.map((t) => (
            <div key={t.id} className="glass-card rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-extrabold text-rose-400">{t.code}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(t.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {(() => {
                    const b = branches.find(item => item.id === t.branchId);
                    return (
                      <span className="text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        📍 {b ? b.name.replace('Phụ Kiện 88 - ', '') : 'Toàn Chuỗi'}
                      </span>
                    );
                  })()}
                </div>
                {getStatusBadge(t.status)}
              </div>

              <div className="py-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Khách hàng:</span>
                  <span className="font-bold text-slate-200">{t.customerName} - {t.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Thiết bị:</span>
                  <span className="font-semibold text-slate-300">{t.deviceModel} ({t.serviceType})</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Tiếp nhận (KPI):</span>
                  <span className="font-semibold text-slate-300">{t.createdByStaffName || 'Nhân viên quầy'}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-slate-400">Kỹ thuật viên:</span>
                  {t.technicianName ? (
                    <span className="font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">{t.technicianName}</span>
                  ) : (
                    <button 
                      onClick={() => handleClaimTicket(t.id)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1 rounded shadow-[0_0_10px_rgba(245,158,11,0.3)] transition-all animate-pulse"
                    >
                      Bấm Nhận Việc
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-sm font-extrabold font-mono text-slate-100">{t.price.toLocaleString('vi-VN')} đ</span>
                
                <div className="flex gap-2">
                  {/* Staff Actions Dropdown */}
                  {t.technicianName && t.status !== 'DELIVERED' && (
                    <select 
                      value={t.status}
                      onChange={(e) => handleUpdateStatus(t.id, e.target.value as any)}
                      className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded px-2 outline-none focus:border-rose-500"
                    >
                      <option value="RECEIVED">Đã tiếp nhận</option>
                      <option value="IN_PROGRESS">Đang sửa chữa</option>
                      <option value="READY">Sẵn sàng giao</option>
                      <option value="DELIVERED">Đã bàn giao</option>
                    </select>
                  )}
                  
                  <button className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>In QR</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center mb-3">
            <Wrench className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-300">Chưa có phiếu sửa chữa nào</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Toàn bộ dữ liệu phiếu mẫu đã được làm sạch. Bấm "Tạo Phiếu Sửa Chữa Mới" để tiếp nhận máy thực tế từ khách hàng.
          </p>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-rose-500" />
              <span>Tiếp Nhận Sửa Chữa Phần Cứng Mới</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              {/* AI Branch & Staff Auto-Detection Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/10 border border-emerald-500/30 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase text-emerald-400 tracking-wide flex items-center gap-1">
                      AI Tự Động Định Danh Chi Nhánh & KPI
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                      +KPI Cá Nhân
                    </span>
                  </div>
                  <div className="text-xs text-slate-100 font-bold flex items-center gap-1.5 flex-wrap">
                    <span className="text-cyan-300">📍 {staffBranch?.name || 'Phụ Kiện 88'}</span>
                    <span className="text-slate-400 font-normal">
                      • Tiếp nhận: <strong className="text-slate-200">{currentUser?.fullName || currentUserName || 'Nhân sự'}</strong> ({currentUser?.role?.toUpperCase() || 'NV'})
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    Doanh thu và điểm tích lũy của phiếu sửa chữa này được tự động gán vào Chi nhánh & tính trực tiếp vào KPI cá nhân của bạn.
                  </p>
                </div>
              </div>

              {/* Tùy chọn chuyển chi nhánh cho Admin/Founder nếu cần tạo hộ */}
              {(currentUser?.role === 'admin' || currentUser?.role === 'founder') && branches.length > 0 && (
                <div>
                  <label className="text-slate-400 block mb-1">Chuyển quyền tạo cho Chi nhánh (Admin/Founder tùy chọn):</label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-medium"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-slate-400 block mb-1">Tên khách hàng:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Anh Minh"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Số điện thoại Zalo:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: 0912345678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold text-slate-200">
                  Dòng máy khách gửi sửa chữa:
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: iPhone 13 Pro Max, Samsung S24 Ultra, iPad Pro M2..."
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-bold focus:border-rose-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-rose-400" />
                    <span>Lỗi / Dịch vụ kỹ thuật cần sửa chữa:</span>
                  </label>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="VD: Thay Màn Hình Zin, Ép Kính, Thay Pin Bison, Sửa Face ID, Mất Nguồn..."
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-semibold focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Gợi ý chọn nhanh 1 chạm */}
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] text-slate-400 font-medium block">⚡ Gợi ý dịch vụ sửa chữa phần cứng:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-0.5">
                    {POPULAR_SERVICES.map((srv) => (
                      <button
                        key={srv}
                        type="button"
                        onClick={() => setServiceType(srv)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                          serviceType === srv 
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500 font-bold shadow-sm' 
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {srv}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Giá báo khách (VNĐ):</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono"
                />
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl"
                >
                  Lưu & Tạo QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AITechnicianModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} />
    </div>
  );
};
