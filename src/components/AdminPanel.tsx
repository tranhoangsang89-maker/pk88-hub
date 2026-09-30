import React, { useState, useEffect } from 'react';
import { Branch, Staff, AttendanceRecord, StaffProgress, Course, Lesson } from '../types';
import { supabase } from '../lib/supabase';
import { MOCK_ATTENDANCE } from '../lib/mockData';
import { Cpu, Server, Database, Key, Radio, Plus, Settings2, ShieldCheck, RefreshCw, Activity, Terminal, Calculator, DollarSign, GraduationCap, BookOpen, CheckCircle2, Search, Filter, Users, Tag } from 'lucide-react';

interface AdminPanelProps {
  branches: Branch[];
  staffList: Staff[];
  attendanceLogs?: AttendanceRecord[];
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ branches, staffList, attendanceLogs = [] }) => {
  const [activeSubTab, setActiveSubTab] = useState<'branches' | 'staff' | 'webhooks' | 'ai' | 'logs' | 'payroll' | 'lms'>('payroll');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffBranch, setNewStaffBranch] = useState<string>(branches[0]?.id || 'b1');
  const [newStaffRole, setNewStaffRole] = useState<Staff['role']>('sales');
  const [localStaff, setLocalStaff] = useState<Staff[]>(staffList);
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [lmsProgress, setLmsProgress] = useState<StaffProgress[]>([]);
  const [lmsLessons, setLmsLessons] = useState<Lesson[]>([]);

  const fetchLmsData = async () => {
    const { data: progress } = await supabase.from('staff_progress').select('*');
    const { data: lessons } = await supabase.from('lessons').select('*');
    if (progress) {
      setLmsProgress(progress.map((p: any) => ({
        id: p.id,
        staffId: p.staff_id,
        lessonId: p.lesson_id,
        status: p.status,
        score: p.score,
        completedAt: p.completed_at
      })));
    }
    if (lessons) setLmsLessons(lessons);
  };

  useEffect(() => {
    if (activeSubTab === 'lms') {
      fetchLmsData();
    }
  }, [activeSubTab]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffPhone) return;

    const newS: Staff = {
      id: `s-${Date.now()}`,
      branchId: newStaffBranch,
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
          branch_id: newStaffBranch,
          role: newStaffRole,
          is_active: true
        }
      ]);
      alert(`✅ Đã thêm nhân sự mới: ${newStaffName} (${newStaffPhone}) thành công!`);
      setNewStaffName('');
      setNewStaffPhone('');
    } catch (err) {
      console.error('Error adding staff to Supabase:', err);
    }
  };

  const handleToggleStaffStatus = (staffId: string) => {
    setLocalStaff(prev => prev.map(s => s.id === staffId ? { ...s, isActive: !s.isActive } : s));
  };

  const handleDeleteStaff = (staffId: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa nhân sự ${name} khỏi hệ thống?`)) {
      setLocalStaff(prev => prev.filter(s => s.id !== staffId));
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
          onClick={() => setActiveSubTab('payroll')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'payroll'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 font-extrabold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>1. Bảng Chấm Công & Tính Lương</span>
        </button>

        <button
          onClick={() => setActiveSubTab('branches')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'branches'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>2. Cấu Hình 6 Chi Nhánh & GPS</span>
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

        <button
          onClick={() => setActiveSubTab('lms')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'lms'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>6. Tiến Độ Đào Tạo LMS</span>
        </button>
      </div>

      {/* Subtab Content */}
      {activeSubTab === 'payroll' && (() => {
        // Merge Supabase logs with MOCK_ATTENDANCE so mock staff have work hours
        const combinedLogs = [...attendanceLogs, ...MOCK_ATTENDANCE];

        const ROLE_PRIORITY: Record<string, number> = {
          founder: 1,
          admin: 2,
          sales_head: 3,
          accountant: 4,
          marketing: 5,
          hr: 6,
          manager: 7,
          technician: 8,
          sales: 9
        };

        const filteredStaff = localStaff
          .filter(s => {
            const matchBranch = selectedBranch === 'ALL' || s.branchId === selectedBranch;
            const matchSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone.includes(searchTerm);
            return matchBranch && matchSearch;
          })
          .sort((a, b) => {
            const pA = ROLE_PRIORITY[a.role] || 99;
            const pB = ROLE_PRIORITY[b.role] || 99;
            return pA - pB;
          });

        // Helper for role salary calculation
        const getRoleSalaryConfig = (staff: Staff, hours: number) => {
          switch (staff.role) {
            case 'sales': {
              const rate = 22700;
              return {
                salary: hours * rate,
                rateLabel: '22.700 đ/giờ',
                salaryType: 'Theo giờ'
              };
            }
            case 'technician': {
              const rate = 30000;
              return {
                salary: hours * rate,
                rateLabel: '30.000 đ/giờ',
                salaryType: 'Theo giờ'
              };
            }
            case 'manager': {
              return {
                salary: 8500000,
                rateLabel: '8.500.000 đ/tháng',
                salaryType: 'Lương cố định'
              };
            }
            case 'admin': {
              return {
                salary: 19000000,
                rateLabel: '19.000.000 đ/tháng (Chính thức)',
                salaryType: 'Lương cố định'
              };
            }
            case 'hr': {
              return {
                salary: 12000000,
                rateLabel: '12.000.000 đ/tháng',
                salaryType: 'Lương cố định'
              };
            }
            case 'marketing': {
              return {
                salary: 14000000,
                rateLabel: '14.000.000 đ/tháng',
                salaryType: 'Lương cố định'
              };
            }
            case 'accountant': {
              return {
                salary: 13500000,
                rateLabel: '13.500.000 đ/tháng',
                salaryType: 'Lương cố định'
              };
            }
            case 'sales_head': {
              return {
                salary: 15000000,
                rateLabel: '15.000.000 đ/tháng (+ KPI Chuỗi)',
                salaryType: 'Lương cứng + KPI'
              };
            }
            case 'founder': {
              return {
                salary: 0,
                rateLabel: 'Chủ sở hữu (Không nhận lương)',
                salaryType: 'Chủ doanh nghiệp'
              };
            }
            default: {
              return {
                salary: hours * 22700,
                rateLabel: '22.700 đ/giờ',
                salaryType: 'Theo giờ'
              };
            }
          }
        };

        // Calculate totals across filtered staff
        let grandTotalHours = 0;
        let grandTotalSalary = 0;

        filteredStaff.forEach(s => {
          const logs = combinedLogs.filter(log => log.staffId === s.id || (log.notes && log.notes.includes(s.phone)));
          const h = logs.reduce((sum, log) => sum + (log.workHours || 0), 0);
          const config = getRoleSalaryConfig(s, h);
          grandTotalHours += h;
          grandTotalSalary += config.salary;
        });

        return (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card p-4 rounded-2xl border border-rose-500/20 bg-gradient-to-br from-slate-900 to-rose-950/20">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Tổng Nhân Sự</span>
                  <Users className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-extrabold text-slate-100 font-mono">
                  {filteredStaff.length} <span className="text-xs text-slate-400 font-normal">/ {localStaff.length} người</span>
                </div>
              </div>

              <div className="glass-card p-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-emerald-950/20">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Tổng Giờ Làm Tháng này</span>
                  <Calculator className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                  {grandTotalHours.toFixed(1)} <span className="text-xs font-normal">giờ</span>
                </div>
              </div>

              <div className="glass-card p-4 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-amber-950/20">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Tổng Quỹ Lương Tạm Tính</span>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-extrabold text-amber-400 font-mono">
                  {grandTotalSalary.toLocaleString('vi-VN')} <span className="text-xs font-normal">đ</span>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="glass-card rounded-2xl p-5 border border-rose-500/30 bg-slate-900/90 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-rose-400" />
                    Bảng Tổng Hợp Lương Phụ Kiện 88 (Toàn Chuỗi 6 Chi Nhánh)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Cấu trúc lương đa vai trò (Bán hàng 22.7k/h, Kỹ thuật 30k/h, Quản lý & Admin lương tháng cố định).</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kỳ lương hiện tại</div>
                  <div className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-rose-400 font-mono font-bold text-xs">Tháng 09/2026</div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-cyan-400 shrink-0" />
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full sm:w-64 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-bold focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ALL">🏢 Tất cả 6 Chi nhánh (Toàn Chuỗi)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>📍 {b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc SĐT nhân viên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3 font-bold">Chi Nhánh</th>
                      <th className="p-3 font-bold">Nhân Viên</th>
                      <th className="p-3 font-bold text-center">Vai Trò</th>
                      <th className="p-3 font-bold text-center">Mức Lương / Chế Độ</th>
                      <th className="p-3 font-bold text-center">Tổng Giờ Làm (GPS)</th>
                      <th className="p-3 font-bold text-right">Lương Thực Lãnh (Tạm Tính)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredStaff.map(staff => {
                      const branch = branches.find(b => b.id === staff.branchId);
                      const logs = combinedLogs.filter(log => 
                        log.staffId === staff.id || (log.notes && log.notes.includes(staff.phone))
                      );
                      const totalHours = logs.reduce((sum, log) => sum + (log.workHours || 0), 0);
                      const config = getRoleSalaryConfig(staff, totalHours);

                      return (
                        <tr key={staff.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3">
                            <span className="text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-1 rounded-lg">
                              {branch ? branch.name.replace('Phụ Kiện 88 - ', '') : 'Toàn Chuỗi'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-200">{staff.fullName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{staff.phone}</div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold border ${
                              staff.role === 'sales_head' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                              staff.role === 'manager' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                              staff.role === 'technician' ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' :
                              staff.role === 'hr' ? 'bg-pink-500/10 text-pink-400 border-pink-500/30' :
                              staff.role === 'marketing' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                              staff.role === 'accountant' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                              staff.role === 'admin' || staff.role === 'founder' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                              'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {staff.role === 'sales_head' ? 'TP. KINH DOANH' : staff.role}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-[11px] font-mono text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800 font-semibold">
                              {config.rateLabel}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 text-xs">
                              {totalHours.toFixed(1)}h
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <span className="font-mono text-rose-400 font-bold text-sm">
                              {config.salary.toLocaleString('vi-VN')} đ
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredStaff.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                          Không tìm thấy nhân sự phù hợp với bộ lọc.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {activeSubTab === 'staff' && (
        <div className="space-y-6">
          {/* Form Create New Staff */}
          <div className="glass-card rounded-2xl p-5 border border-cyan-500/30 bg-slate-900/90 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Thêm Nhân Viên Mới Vào Hệ Thống (Thao tác 10 giây)</span>
            </h3>

            <form onSubmit={handleAddStaff} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Họ & Tên nhân viên:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn A"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Số điện thoại đăng nhập:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: 0988112233"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Chi Nhánh Công Tác:</label>
                <select
                  value={newStaffBranch}
                  onChange={(e) => setNewStaffBranch(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-bold focus:outline-none focus:border-cyan-500"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>📍 {b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Vai Trò Nghiệp Vụ:</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-bold focus:outline-none focus:border-cyan-500"
                >
                  <option value="sales">🛒 Bán Hàng Tại Quầy</option>
                  <option value="technician">🛠️ Kỹ Thuật Viên Sửa Chữa</option>
                  <option value="manager">🏢 Quản Lý Chi Nhánh</option>
                  <option value="sales_head">💼 Trưởng Phòng Kinh Doanh</option>
                  <option value="accountant">📊 Kế Toán Trưởng</option>
                  <option value="marketing">📢 Chuyên Viên Marketing</option>
                  <option value="hr">👥 Chuyên Viên HC-NS</option>
                  <option value="admin">💻 Admin Hệ Thống</option>
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
          <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Danh Sách Nhân Sự Đang Hoạt Động ({localStaff.length} Người)
              </h3>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto text-xs">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full sm:w-56 p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-bold focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">🏢 Tất cả 6 Chi nhánh</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>📍 {b.name}</option>
                  ))}
                </select>

                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc SĐT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {[...localStaff]
                .filter(s => {
                  const matchBranch = selectedBranch === 'ALL' || s.branchId === selectedBranch;
                  const matchSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone.includes(searchTerm);
                  return matchBranch && matchSearch;
                })
                .sort((a, b) => {
                  const map: Record<string, number> = { founder: 1, admin: 2, sales_head: 3, accountant: 4, marketing: 5, hr: 6, manager: 7, technician: 8, sales: 9 };
                  return (map[a.role] || 99) - (map[b.role] || 99);
                })
                .map((s) => {
                  const branch = branches.find(b => b.id === s.branchId);

                  return (
                    <div key={s.id} className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                      s.isActive ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-950/40 border-rose-900/30 opacity-60'
                    }`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="font-bold text-slate-200 flex items-center gap-1.5">
                            <span>{s.fullName}</span>
                            {!s.isActive && (
                              <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.2 rounded font-bold">
                                Đã nghỉ
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">{s.phone}</div>
                          <div className="text-[10px] text-cyan-400 mt-1 font-medium">
                            📍 {branch ? branch.name.replace('Phụ Kiện 88 - ', '') : 'Toàn Chuỗi'}
                          </div>
                        </div>

                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold border shrink-0 ${
                          s.role === 'sales_head' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                          s.role === 'manager' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          s.role === 'technician' ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' :
                          s.role === 'hr' ? 'bg-pink-500/10 text-pink-400 border-pink-500/30' :
                          s.role === 'marketing' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                          s.role === 'accountant' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          s.role === 'admin' || s.role === 'founder' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {s.role === 'sales_head' ? 'TP. KINH DOANH' : s.role}
                        </span>
                      </div>

                      {/* Management Actions */}
                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px]">
                        <button
                          onClick={() => handleToggleStaffStatus(s.id)}
                          className={`font-semibold hover:underline cursor-pointer ${
                            s.isActive ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {s.isActive ? '🟢 Đang làm việc' : '🔴 Đã nghỉ việc'}
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(s.id, s.fullName)}
                          className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  );
                })}
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

      {activeSubTab === 'lms' && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 bg-slate-900/90">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span>Báo Cáo Tiến Độ Đào Tạo Nhân Sự Mới (60 Ngày)</span>
              </h3>
              <button onClick={fetchLmsData} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-2 transition-all">
                <RefreshCw className="w-3 h-3" /> Cập nhật Data
              </button>
            </div>

            <div className="space-y-6">
              {branches.map(branch => {
                const staffInBranch = localStaff.filter(s => s.branchId === branch.id);
                if (staffInBranch.length === 0) return null;

                return (
                  <div key={branch.id}>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {branch.name}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {staffInBranch.map(staff => {
                        const staffProgress = lmsProgress.filter(p => p.staffId === staff.id);
                        const completedCount = staffProgress.filter(p => p.status === 'COMPLETED').length;
                        const totalLessons = lmsLessons.length || 60; // fallback 60
                        const percent = Math.round((completedCount / totalLessons) * 100);

                        return (
                          <div key={staff.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <div className="font-bold text-slate-200">{staff.fullName}</div>
                                <div className="text-[10px] text-slate-500 uppercase">{staff.role}</div>
                              </div>
                              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <span className="text-xs font-bold text-emerald-400">{percent}%</span>
                              </div>
                            </div>
                            
                            <div className="w-full bg-slate-800 rounded-full h-1.5 mb-3">
                              <div 
                                className="bg-emerald-500 h-1.5 rounded-full" 
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                            
                            <div className="text-[11px] text-slate-400 flex justify-between items-center">
                              <span>Đã học: {completedCount}/{totalLessons} bài</span>
                              {percent >= 100 ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Hoàn thành</span>
                              ) : (
                                <span className="text-amber-400 font-bold">Đang học...</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
