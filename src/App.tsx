import React, { useState, useEffect } from 'react';
import { UserRole, Branch, AttendanceRecord, RepairTicket, Staff } from './types';
import { INITIAL_BRANCHES, MOCK_STAFF, MOCK_ATTENDANCE, MOCK_REPAIR_TICKETS } from './lib/mockData';
import { AttendanceCard } from './components/AttendanceCard';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { RepairTicketView } from './components/RepairTicketView';
import { AIChatDrawer } from './components/AIChatDrawer';
import { AdminPanel } from './components/AdminPanel';
import { LoginModal } from './components/LoginModal';
import { TrainingLMS } from './components/TrainingLMS';
import { supabase } from './lib/supabase';
import { Building2, Clock, LayoutDashboard, TicketCheck, Cpu, LogOut, ShieldCheck, QrCode, Lock, RefreshCw, GraduationCap } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const [isCustomerMode, setIsCustomerMode] = useState<boolean>(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch>(INITIAL_BRANCHES[0]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admin' | 'attendance' | 'tickets' | 'training'>('attendance');
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);
  const [tickets, setTickets] = useState<RepairTicket[]>(MOCK_REPAIR_TICKETS);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(true);
  const [loadingDb, setLoadingDb] = useState<boolean>(false);

  // Fetch real attendance records directly from Supabase Cloud DB!
  const fetchRealAttendance = async () => {
    setLoadingDb(true);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .order('check_in', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching Supabase attendance:', error);
      } else if (data && data.length > 0) {
        const formatted: AttendanceRecord[] = data.map((item: any) => {
          return {
            id: item.id,
            staffId: item.staff_id || 'unknown',
            branchId: item.branch_id || 'b1',
            checkIn: item.check_in,
            checkOut: item.check_out,
            shiftType: item.shift_type,
            workHours: item.work_hours,
            lat: item.lat,
            lng: item.lng,
            distanceMeters: item.distance_meters,
            isVerified: item.is_verified,
            notes: item.notes || 'Check-in GPS Hợp lệ'
          };
        });
        setAttendanceHistory(formatted);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoadingDb(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('repair_tickets')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Fetch tickets error:', error);
      } else if (data) {
        const formatted: RepairTicket[] = data.map(item => ({
          id: item.id,
          code: item.code,
          branchId: item.branch_id || 'b1',
          customerName: item.customer_name,
          customerPhone: item.customer_phone,
          deviceModel: item.device_model,
          serviceType: item.service_type,
          status: item.status,
          price: Number(item.price),
          createdAt: item.created_at,
          technicianName: item.technician_name
        }));
        setTickets(formatted);
      }
    } catch (err) {
      console.error('Fetch tickets error:', err);
    }
  };

  useEffect(() => {
    fetchRealAttendance();
    fetchTickets();
  }, []);

  const role: UserRole = isCustomerMode ? 'customer' : currentUser ? currentUser.role : 'customer';

  const handleLoginSuccess = (staff: Staff) => {
    setCurrentUser(staff);
    setIsCustomerMode(false);
    setShowLoginModal(false);
    
    // Auto-select staff's branch
    const staffBranch = INITIAL_BRANCHES.find(b => b.id === staff.branchId);
    if (staffBranch) {
      setSelectedBranch(staffBranch);
    }

    // Refresh real attendance logs on login
    fetchRealAttendance();
    fetchTickets();

    if (staff.role === 'admin') setActiveTab('admin');
    else if (staff.role === 'founder') setActiveTab('dashboard');
    else setActiveTab('attendance');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowLoginModal(true);
  };

  const handleCheckInSuccess = (record: AttendanceRecord) => {
    fetchRealAttendance();
  };

  const handleCreateTicket = async (newTicket: RepairTicket) => {
    try {
      const { data, error } = await supabase.from('repair_tickets').insert([{
        code: newTicket.code,
        customer_name: newTicket.customerName,
        customer_phone: newTicket.customerPhone,
        device_model: newTicket.deviceModel,
        service_type: newTicket.serviceType,
        status: newTicket.status,
        price: newTicket.price,
        technician_name: newTicket.technicianName === '' ? null : newTicket.technicianName
      }]).select();

      if (error) {
        alert('Lỗi lưu CSDL Supabase: ' + error.message);
        console.error(error);
        return;
      }
      
      if (data && data.length > 0) {
        const savedItem = data[0];
        const savedTicket: RepairTicket = {
          id: savedItem.id, // Use real UUID from DB
          code: savedItem.code,
          branchId: savedItem.branch_id || 'b1',
          customerName: savedItem.customer_name,
          customerPhone: savedItem.customer_phone,
          deviceModel: savedItem.device_model,
          serviceType: savedItem.service_type,
          status: savedItem.status,
          price: Number(savedItem.price),
          createdAt: savedItem.created_at,
          technicianName: savedItem.technician_name
        };
        setTickets((prev) => [savedTicket, ...prev]);
      }
    } catch (e: any) {
      alert('Lỗi ngoại lệ: ' + e.message);
    }
  };

  const handleUpdateTicket = async (ticketId: string, updates: Partial<RepairTicket>): Promise<boolean> => {
    try {
      let query = supabase.from('repair_tickets').update({
        status: updates.status,
        technician_name: updates.technicianName
      }).eq('id', ticketId);

      // Nếu là thao tác "Nhận việc", đảm bảo tên KTV đang trống (race condition lock)
      if (updates.technicianName && updates.status === 'IN_PROGRESS') {
        query = query.is('technician_name', null);
      }

      const { data, error } = await query.select();

      if (error) {
        console.error('Lỗi cập nhật CSDL:', error);
        alert('Lỗi cập nhật hệ thống: ' + error.message);
        return false;
      }
      
      if (data && data.length > 0) {
        // Cập nhật thành công, update local state
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates } : t));
        return true;
      } else {
        alert('Rất tiếc! Yêu cầu thất bại do Kỹ thuật viên khác đã nhận hoặc trạng thái đã bị thay đổi.');
        return false;
      }
    } catch (e: any) {
      console.error('Exception in handleUpdateTicket:', e);
      alert('Đã xảy ra lỗi hệ thống: ' + e.message);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Login Modal Popup */}
      {(showLoginModal || (!currentUser && !isCustomerMode)) && (
        <LoginModal 
          onLoginSuccess={handleLoginSuccess} 
          onGuestLookup={() => {
            setIsCustomerMode(true);
            setShowLoginModal(false);
          }}
        />
      )}

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
                  CLOUD CONNECTED
                </span>
              </div>
              <p className="text-xs text-slate-400">Hệ Thống Vận Hành Tự Động Hóa Chuỗi Phụ Kiện 88</p>
            </div>
          </div>

          {/* User Account / Login & Branch Bar */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Refresh DB Button */}
            {currentUser && !isCustomerMode && (
              <button
                onClick={() => {
                  fetchRealAttendance();
                  fetchTickets();
                }}
                className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                title="Tải lại dữ liệu từ Supabase Cloud"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loadingDb ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Branch Selector */}
            {!isCustomerMode && currentUser && (
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

            {/* Authenticated User Status */}
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
                  onClick={handleLogout}
                  className="p-2 bg-slate-800 hover:bg-rose-900/40 hover:text-rose-300 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                  title="Đăng xuất khỏi tài khoản"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsCustomerMode(false);
                  setShowLoginModal(true);
                }}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
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
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                isCustomerMode
                  ? 'bg-sky-500 text-slate-950 border-sky-400 font-extrabold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>{isCustomerMode ? 'Thoát Khách QR' : 'Khách Tra Cứu QR'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs for Logged-In Users */}
        {!isCustomerMode && currentUser && (
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
            {(currentUser.role === 'admin' || currentUser.role === 'founder') && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tickets'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <TicketCheck className="w-4 h-4" />
              <span>Phiếu Dịch Vụ & Sửa Chữa (QR)</span>
            </button>

            <button
              onClick={() => setActiveTab('training')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'training'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-extrabold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Đào Tạo & Khảo Thí (LMS)</span>
            </button>
          </div>
        )}

        {/* Tab Render Views */}
        {isCustomerMode ? (
          <RepairTicketView tickets={tickets} role="customer" onCreateTicket={handleCreateTicket} />
        ) : (
          <>
            {activeTab === 'admin' && (currentUser?.role === 'admin' || currentUser?.role === 'founder') && (
              <AdminPanel branches={INITIAL_BRANCHES} staffList={MOCK_STAFF} attendanceLogs={attendanceHistory} />
            )}

            {activeTab === 'dashboard' && (currentUser?.role === 'founder' || currentUser?.role === 'admin') && (
              <ExecutiveDashboard branches={INITIAL_BRANCHES} attendanceLogs={attendanceHistory} />
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
              <RepairTicketView 
                tickets={tickets} 
                role={currentUser.role} 
                onCreateTicket={handleCreateTicket} 
                onUpdateTicket={handleUpdateTicket}
                currentUserName={currentUser.fullName}
              />
            )}

            {activeTab === 'training' && currentUser && (
              <TrainingLMS currentUser={currentUser} />
            )}

            {!currentUser && (
              <div className="text-center py-20 text-slate-400">
                <Lock className="w-12 h-12 mx-auto mb-3 text-rose-500 animate-pulse" />
                <h3 className="text-base font-bold text-slate-200">Vui lòng Đăng nhập tài khoản Nhân sự Phụ Kiện 88</h3>
                <p className="text-xs text-slate-500 mt-1">Hoặc bấm nút "Khách Tra Cứu QR" ở góc trên bên phải để tra cứu dịch vụ.</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating AI Chat Assistant */}
      <AIChatDrawer currentUser={currentUser} isCustomerMode={isCustomerMode} />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 px-4 text-center text-[11px] text-slate-500">
        PK88 Automation Portal © 2026 - Chuỗi Phụ Kiện 88 (Bến Tre • Mỹ Tho • Cần Thơ • Vĩnh Long • Trà Vinh)
      </footer>
    </div>
  );
}
