import React, { useState } from 'react';
import { RepairTicket, UserRole } from '../types';
import { QrCode, Search, Wrench, Plus, CheckCircle2, Clock, Smartphone, UserCheck, ArrowRight } from 'lucide-react';

interface RepairTicketViewProps {
  tickets: RepairTicket[];
  role: UserRole;
  onCreateTicket: (ticket: RepairTicket) => void;
}

export const RepairTicketView: React.FC<RepairTicketViewProps> = ({ tickets, role, onCreateTicket }) => {
  const [searchCode, setSearchCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deviceModel, setDeviceModel] = useState('iPhone 13 Pro Max');
  const [serviceType, setServiceType] = useState<RepairTicket['serviceType']>('EP_KINH');
  const [price, setPrice] = useState('850000');

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
      branchId: 'b1',
      customerName,
      customerPhone,
      deviceModel,
      serviceType,
      status: 'RECEIVED',
      price: Number(price),
      createdAt: new Date().toISOString(),
      technicianName: 'Lê Hoàng Nam'
    };
    onCreateTicket(newT);
    setShowCreateModal(false);
    setCustomerName('');
    setCustomerPhone('');
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
    const selectedTicket = tickets[0]; // Display top sample ticket
    return (
      <div className="max-w-md mx-auto glass-card rounded-3xl p-6 border border-slate-800 shadow-2xl">
        <div className="text-center pb-5 border-b border-slate-800">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-rose-500/20">
            <QrCode className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">Tra Cứu Bảo Hành & Sửa Chữa</h2>
          <p className="text-xs text-slate-400 mt-1">Hệ Thống Chuỗi Phụ Kiện 88 Minh Bạch 24/7</p>
        </div>

        {selectedTicket && (
          <div className="mt-5 space-y-4">
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">Mã phiếu:</span>
                <span className="text-xs font-mono font-bold text-rose-400">{selectedTicket.code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Khách hàng:</span>
                <span className="text-xs font-bold text-slate-200">{selectedTicket.customerName} ({selectedTicket.customerPhone})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Dòng máy:</span>
                <span className="text-xs font-bold text-slate-200">{selectedTicket.deviceModel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Dịch vụ:</span>
                <span className="text-xs font-bold text-emerald-400">{selectedTicket.serviceType}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400">Chi phí tạm tính:</span>
                <span className="text-sm font-bold font-mono text-slate-100">{selectedTicket.price.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* Stepper Status */}
            <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-300 block mb-3">Tiến Độ Xử Lý Thực Tế:</span>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs">✓</div>
                  <span className="text-xs text-slate-200 font-medium">1. Tiếp nhận thiết bị tại quầy</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center font-bold text-xs">2</div>
                  <span className="text-xs text-sky-400 font-bold">2. Đang tháo máy & ép kính (Kỹ thuật viên Nam)</span>
                </div>
                <div className="flex items-center gap-3 opacity-40">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs">3</div>
                  <span className="text-xs text-slate-400">3. Sẵn sàng giao máy & Dán tem bảo hành</span>
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
              <div className="flex justify-between">
                <span className="text-slate-400">Kỹ thuật viên:</span>
                <span className="text-slate-300">{t.technicianName}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-sm font-extrabold font-mono text-slate-100">{t.price.toLocaleString('vi-VN')} đ</span>
              <button className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1">
                <span>In QR / Gửi Zalo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
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
                <label className="text-slate-400 block mb-1">Dòng điện thoại / iPad:</label>
                <input
                  type="text"
                  required
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Dịch vụ kỹ thuật:</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                >
                  <option value="EP_KINH">Ép Kính / Ép Cảm Ứng</option>
                  <option value="THAY_PIN">Thay Pin Dung Lượng Cao</option>
                  <option value="DAN_PPF">Dán PPF / Cường Lực</option>
                  <option value="THAY_MAN">Thay Màn Hình Zin</option>
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
