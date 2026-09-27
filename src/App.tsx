import React, { useState } from 'react';
import { UserRole, Branch, AttendanceRecord, RepairTicket, Staff } from './types';
import { INITIAL_BRANCHES, MOCK_STAFF, MOCK_ATTENDANCE, MOCK_REPAIR_TICKETS } from './lib/mockData';
import { AttendanceCard } from './components/AttendanceCard';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { RepairTicketView } from './components/RepairTicketView';
import { AIChatDrawer } from './components/AIChatDrawer';
import { AdminPanel } from './components/AdminPanel';
import { LoginModal } from './components/LoginModal';
import { Building2, Clock, LayoutDashboard, TicketCheck, Cpu, LogOut, UserCheck, ShieldCheck, QrCode } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<Staff | null>(MOCK_STAFF[1]); // Default Admin Sang logged in
  const [isCustomerMode, setIsCustomerMode] = useState<boolean>(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch>(INITIAL_BRANCHES[0]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admin' | 'attendance' | 'tickets'>('admin');
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);
  const [tickets, setTickets] = useState<RepairTicket[]>(MOCK_REPAIR_TICKETS);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  const role: UserRole = isCustomerMode ? 'customer' : currentUser ? currentUser.role : 'customer';

  const handleLoginSuccess = (staff: Staff) => {
    setCurrentUser(staff);
    setIsCustomerMode(false);
    setShowLoginModal(false);

    if (staff.role === 'admin') setActiveTab('admin');
    else if (staff.role === 'founder') setActiveTab('dashboard');
    else setActiveTab('attendance');
  };

  const handleCheckInSuccess = (record: AttendanceRecord) => {
    setAttendanceHistory((prev) => [record, ...prev]);
  };

  const handleCreateTicket = (newTicket: RepairTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Login Modal Popup */}
      {showLoginModal && <LoginModal onLoginSuccess={handleLoginSuccess} />}

      {/* Main Header Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 py-3 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center font-extrabold text-white text-lg shadow-lg shadow-rose-500/20">
              88
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-100">PK88 AUTOMATION PORTAL</h1>
                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  VERIFIED
                </span>
              </div>
              <p className="text-xs text-slate-400">Hệ Thống Vận Hành Tự Động Hóa Chuỗi Phụ Kiện 88</p>
            </div>
          </div>

          {/* User Account / Login & Branch Bar */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Branch Selector */}
            {!isCustomerMode && (
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <Building2 className="w-4 h-4 text-rose-500" />
                <select
                  value={selectedBranch.id}
                  onChange={(e) => {
                    const b = INITIAL_BRANCHES.find((x) => x.id === e.target.value);
                    if (b) setSelectedBranch(b);
                  }}
                  className="bg-transparent text-xs font-bold text-slate-200 pr-2 py-0.5 focus:outline-none cursor-pointer"
                >
                  {INITIAL_BRANCHES.map((b) => (
                    <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Authenticated User Status or Login Trigger */}
            {currentUser && !isCustomerMode ? (
              <div className="flex items-center gap-2">
                <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center border border-rose-500/30">
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-xs font-bold text-slate-200">{currentUser.fullName}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono">{currentUser.role}</div>
                  </div>
                </div>

                <button
                  onClick={() => setShowLoginModal(true)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1"
                  title="Đổi tài khoản đăng nhập"
                >
                  <LogOut className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Đăng Nhập Nhân Sự</span>
              </button>
            )}

            {/* Toggle Customer Mode View */}
            <button
              onClick={() => {
                setIsCustomerMode(!isCustomerMode);
                if (!isCustomerMode) setActiveTab('tickets');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                isCustomerMode
                  ? 'bg-sky-500 text-slate-950 border-sky-400 font-extrabold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>{isCustomerMode ? 'Thoát Khách QR' : 'Xem Giao Diện Khách'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs for Logged-In Users */}
        {!isCustomerMode && currentUser && (
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'admin'
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-extrabold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>Quản Trị Hệ Thống (System Admin)</span>
              </button>
            )}

            {(currentUser.role === 'founder' || currentUser.role === 'admin') && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Executive Dashboard (Toàn Chuỗi)</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'attendance'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Chấm Công GPS Geofence</span>
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'tickets'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <TicketCheck className="w-4 h-4" />
              <span>Phiếu Dịch Vụ & Sửa Chữa (QR)</span>
            </button>
          </div>
        )}

        {/* Tab Render Views */}
        {isCustomerMode ? (
          <RepairTicketView tickets={tickets} role="customer" onCreateTicket={handleCreateTicket} />
        ) : (
          <>
            {activeTab === 'admin' && currentUser?.role === 'admin' && (
              <AdminPanel branches={INITIAL_BRANCHES} staffList={MOCK_STAFF} />
            )}

            {activeTab === 'dashboard' && (currentUser?.role === 'founder' || currentUser?.role === 'admin') && (
              <ExecutiveDashboard branches={INITIAL_BRANCHES} />
            )}

            {activeTab === 'attendance' && currentUser && (
              <div className="max-w-xl mx-auto">
                <AttendanceCard
                  currentBranch={selectedBranch}
                  currentStaff={currentUser}
                  onCheckInSuccess={handleCheckInSuccess}
                  attendanceHistory={attendanceHistory}
                />
              </div>
            )}

            {activeTab === 'tickets' && currentUser && (
              <RepairTicketView tickets={tickets} role={currentUser.role} onCreateTicket={handleCreateTicket} />
            )}
          </>
        )}
      </main>

      {/* Floating AI Chat Assistant */}
      <AIChatDrawer />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 px-4 text-center text-[11px] text-slate-500">
        PK88 Automation Portal © 2026 - Chuỗi Phụ Kiện 88 (Bến Tre • Mỹ Tho • Cần Thơ • Vĩnh Long • Trà Vinh)
      </footer>
    </div>
  );
}
