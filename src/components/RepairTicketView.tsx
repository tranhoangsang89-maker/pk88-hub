import React, { useState, useEffect } from 'react';
import { RepairTicket, UserRole, Product } from '../types';
import { QrCode, Search, Wrench, Plus, CheckCircle2, Clock, Smartphone, UserCheck, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';interface RepairTicketViewProps {
  tickets: RepairTicket[];
  role: UserRole;
  onCreateTicket: (ticket: RepairTicket) => void;
  onUpdateTicket?: (ticketId: string, updates: Partial<RepairTicket>) => Promise<boolean>;
  currentUserName?: string;
}

export const RepairTicketView: React.FC<RepairTicketViewProps> = ({ tickets, role, onCreateTicket, onUpdateTicket, currentUserName }) => {
  const [searchCode, setSearchCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Customer Search State
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [searchedTicket, setSearchedTicket] = useState<RepairTicket | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceModel, setDeviceModel] = useState('iPhone 13 Pro Max');
  const [serviceType, setServiceType] = useState<RepairTicket['serviceType']>('EP_KINH');
  const [price, setPrice] = useState('850000');

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

  const filteredTickets = tickets.filter(
    (t) =>
      t.code.toLowerCase().includes(searchCode.toLowerCase()) ||
      t.customerPhone.includes(searchCode) ||
      t.customerName.toLowerCase().includes(searchCode.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newT: RepairTicket = {
      id: `t-${Date.now()}`,
      code: `PK88-SC-${Math.floor(1000 + Math.random() * 9000)}`,
      branchId: 'b1', // Tạm gắn cứng b1 cho demo
      customerName,
      customerPhone,
      deviceModel,
      serviceType,
      status: 'RECEIVED',
      price: Number(price),
      createdAt: new Date().toISOString(),
      technicianName: '' // Bỏ trống KTV để họ tự nhận
    };
    onCreateTicket(newT);
    setShowCreateModal(false);
    setCustomerName('');
    setCustomerPhone('');
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

        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Phiếu Sửa Chữa Mới</span>
        </button>
      </div>

      {/* Ticket List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTickets.map((t) => (
          <div key={t.id} className="glass-card rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-extrabold text-rose-400">{t.code}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(t.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
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
                {/* Staff Actions Dropdown (Simple buttons for now) */}
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

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-4 pb-2 border-b border-slate-800">
              Tạo Phiếu Dịch Vụ Sửa Chữa Mới
            </h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
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
                <label className="text-slate-400 block mb-1">Sản phẩm / Dịch vụ (Gõ để tìm kiếm):</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="VD: Cường lực URR 15 Pro Max..."
                    value={productSearchTerm}
                    onChange={(e) => {
                      setProductSearchTerm(e.target.value);
                      setDeviceModel(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                  />
                  {showProductDropdown && productSearchTerm && filteredProducts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-slate-800 border border-slate-700 rounded-xl shadow-2xl custom-scrollbar">
                      {filteredProducts.map(product => (
                        <div 
                          key={product.id}
                          className="px-3 py-2 cursor-pointer hover:bg-slate-700 border-b border-slate-700/50 last:border-0"
                          onClick={() => {
                            setProductSearchTerm(product.name);
                            setDeviceModel(product.name);
                            setPrice(product.price.toString());
                            setShowProductDropdown(false);
                            
                            if (product.category.toLowerCase().includes('cường lực') || product.category.toLowerCase().includes('ppf') || product.category.toLowerCase().includes('ốp')) {
                              setServiceType('DAN_PPF');
                            } else if (product.category.toLowerCase().includes('pin')) {
                              setServiceType('THAY_PIN');
                            } else {
                              setServiceType('KHAC');
                            }
                          }}
                        >
                          <div className="font-bold text-sm text-slate-200">{product.name}</div>
                          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                            <span className="bg-slate-900 px-1.5 rounded border border-slate-700">{product.category} {product.brand ? `- ${product.brand}` : ''}</span>
                            <span className="text-rose-400 font-mono font-bold">{product.price.toLocaleString('vi-VN')} đ</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Loại Phiếu Dịch Vụ:</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                >
                  <option value="EP_KINH">Ép Kính / Ép Cảm Ứng</option>
                  <option value="THAY_PIN">Thay Pin Dung Lượng Cao</option>
                  <option value="DAN_PPF">Bán Hàng / Dán PPF / Cường Lực</option>
                  <option value="THAY_MAN">Thay Màn Hình Zin</option>
                  <option value="KHAC">Sửa Chữa Khác</option>
                </select>
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
    </div>
  );
};
