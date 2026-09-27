import React, { useState } from 'react';
import { Branch, Staff } from '../types';
import { supabase } from '../lib/supabase';
import { Cpu, Server, Database, Key, Radio, Plus, Settings2, ShieldCheck, RefreshCw, Activity, Terminal } from 'lucide-react';

interface AdminPanelProps {
  branches: Branch[];
  staffList: Staff[];
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ branches, staffList }) => {
  const [activeSubTab, setActiveSubTab] = useState<'branches' | 'staff' | 'webhooks' | 'ai' | 'logs'>('branches');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'sales' | 'technician' | 'manager'>('sales');
  const [localStaff, setLocalStaff] = useState<Staff[]>(staffList);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffPhone) return;

    const newS: Staff = {
      id: `s-${Date.now()}`,
      branchId: branches[0]?.id || 'b1',
      fullName: newStaffName,
      phone: newStaffPhone,
      role: newStaffRole,
      isActive: true
    };

    setLocalStaff((prev) => [...prev, newS]);

    // Insert to Supabase DB live
    try {
      await supabase.from('staff').insert([
        {
          full_name: newStaffName,
          phone: newStaffPhone,
          role: newStaffRole
        }
      ]);
      alert(`✅ Đã thêm nhân sự mới: ${newStaffName} (${newStaffPhone}) thành công!`);
      setNewStaffName('');
      setNewStaffPhone('');
    } catch (err) {
      console.error('Error adding staff to Supabase:', err);
    }
  };

  const webhookLogs = [
    { id: 'wh-1', event: 'KIOTVIET_ORDER_CREATED', source: 'KiotViet API', status: 'SUCCESS', time: '20:42:10', payload: 'Bill #1092 - PK88 Mỹ Tho (450.000đ)' },
    { id: 'wh-2', event: 'TELEGRAM_ALERT_SENT', source: 'n8n Workflow', status: 'SUCCESS', time: '20:30:00', payload: 'Red Flag: Cảnh báo tồn kho PK88 Bến Tre 1' },
    { id: 'wh-3', event: 'GEMINI_OCR_INVOICE', source: 'Gemini 1.5 Flash', status: 'SUCCESS', time: '19:15:22', payload: 'Đã bóc tách PDF Hóa đơn NCC Apple (12 sản phẩm)' },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Header Banner */}
      <div className="glass-card rounded-2xl p-5 border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-extrabold shadow-lg shadow-cyan-500/10">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-100">BẢNG QUẢN TRỊ KỸ THUẬT & AUTOMATION</h2>
                <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                  ADMIN SYSTEM
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Phụ trách bởi: **Trần Hoàng Sang** (Chuyên viên Công nghệ Phụ Kiện 88)</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">n8n Middleware: <strong className="text-emerald-400">ONLINE</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <Database className="w-4 h-4 text-sky-400" />
              <span className="text-slate-300">Supabase RLS: <strong className="text-sky-400">ACTIVE</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('branches')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'branches'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>1. Cấu Hình 6 Chi Nhánh & GPS</span>
        </button>

        <button
          onClick={() => setActiveSubTab('staff')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'staff'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>2. Thêm & Quản Lý Nhân Sự Mới</span>
        </button>

        <button
          onClick={() => setActiveSubTab('webhooks')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'webhooks'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>3. Kết Nối Webhook & POS (KiotViet/n8n)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ai')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'ai'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>4. Tham Số AI Engine (Chị 8 & Bé 8)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'logs'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>5. System Logs & Webhook Sync</span>
        </button>
      </div>

      {/* Subtab Content */}
      {activeSubTab === 'staff' && (
        <div className="space-y-6">
          {/* Form Create New Staff */}
          <div className="glass-card rounded-2xl p-5 border border-cyan-500/30 bg-slate-900/90">
            <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Thêm Nhân Viên Mới Vào Hệ Thống (Thao tác 10 giây)</span>
            </h3>

            <form onSubmit={handleAddStaff} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Họ & Tên nhân viên:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn A"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Số điện thoại đăng nhập:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: 0988112233"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Vai trò nghiệp vụ:</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
                >
                  <option value="sales">Bán Hàng Tại Quầy</option>
                  <option value="technician">Kỹ Thuật Viên Sửa Chữa</option>
                  <option value="manager">Quản Lý Chi Nhánh</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  + Tạo Tài Khoản Ngay
                </button>
              </div>
            </form>
          </div>

          {/* Current Staff List */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Danh Sách Nhân Sự Đang Hoạt Động Toàn Chuỗi</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {localStaff.map((s) => (
                <div key={s.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-200">{s.fullName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{s.phone}</div>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-cyan-400 border border-slate-700 px-2 py-0.5 rounded font-mono uppercase font-bold">
                    {s.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {activeSubTab === 'branches' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Danh sách Chi nhánh & Tọa độ Geofencing</h3>
            <button className="px-3 py-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-cyan-500/30">
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Chi Nhánh Mới (Store-in-a-Box)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((b) => (
              <div key={b.id} className="glass-card rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-400">{b.code}</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                    ONLINE
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-100">{b.name}</h4>
                <p className="text-xs text-slate-400">{b.address}</p>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>GPS: {b.lat}, {b.lng}</span>
                  <button className="text-cyan-400 hover:underline">Sửa tọa độ</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'webhooks' && (
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-100">Cấu Hình Kết Nối Hệ Thống Trung Gian (Middleware)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">KiotViet Webhook Integration</span>
                <span className="text-emerald-400 font-mono font-bold">CONNECTED</span>
              </div>
              <p className="text-slate-400 text-[11px]">Tự động kéo đơn hàng bán ra lúc 22h00 về Supabase</p>
              <input readOnly value="https://n8n.phukien88.vn/webhook/kiotviet-orders" className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-400 font-mono text-[11px]" />
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">Telegram Red Flags Alert Bot</span>
                <span className="text-emerald-400 font-mono font-bold">CONNECTED</span>
              </div>
              <p className="text-slate-400 text-[11px]">Bắn còi báo động khi doanh thu sụt giảm &gt;25%</p>
              <input readOnly value="Group ID: -100988776655 (Founder Executive Group)" className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-400 font-mono text-[11px]" />
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'ai' && (
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-100">Cấu Hình Mô Hình AI Engine (Gemini 1.5 Flash & Pro)</h3>
          <div className="space-y-3">
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">Chatbot Chị 8 (Tư Vấn Bán Hàng)</div>
                <div className="text-slate-400 text-[11px]">URL Live: https://chatbot-pk88.vercel.app/</div>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 font-mono">ACTIVE</span>
            </div>

            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">AI Invoice OCR Agent (Đọc Hóa Đơn NCC MISA)</div>
                <div className="text-slate-400 text-[11px]">Model: Gemini 1.5 Vision OCR API</div>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 font-mono">ACTIVE</span>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'logs' && (
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Nhật Ký Đồng Bộ Lớp Automation (System Sync Logs)</span>
          </h3>

          <div className="space-y-2 font-mono text-xs">
            {webhookLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-[11px]">{log.time}</span>
                  <span className="text-cyan-400 font-bold">{log.event}</span>
                  <span className="text-slate-400">({log.source})</span>
                </div>
                <span className="text-slate-300 text-[11px]">{log.payload}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
