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
import { MarketingDashboard } from './components/MarketingDashboard';
import { MarketingModal } from './components/MarketingModal';
import { supabase } from './lib/supabase';
import { Building2, Clock, LayoutDashboard, TicketCheck, Cpu, LogOut, ShieldCheck, QrCode, Lock, RefreshCw, GraduationCap, Send, Megaphone } from 'lucide-react';
import { MarketingPost, MarketingPlatform } from './types';

export function App() {
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const [isCustomerMode, setIsCustomerMode] = useState<boolean>(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch>(INITIAL_BRANCHES[0]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admin' | 'attendance' | 'tickets' | 'training' | 'marketing'>('attendance');
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);
  const [tickets, setTickets] = useState<RepairTicket[]>(MOCK_REPAIR_TICKETS);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(true);
  const [loadingDb, setLoadingDb] = useState<boolean>(false);
  const [showMarketingModal, setShowMarketingModal] = useState<boolean>(false);
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const activeBranches = branches.filter(b => b.isActive);
  
  // Marketing Posts State (Fallback to Mock Data)
  const [marketingPosts, setMarketingPosts] = useState<MarketingPost[]>([]);

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

  const fetchMarketingPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch marketing posts error:', error);
      } else if (data) {
        setMarketingPosts(data as MarketingPost[]);
      }
    } catch (err) {
      console.error('Fetch marketing posts exception:', err);
    }
  };

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase.from('branches').select('*').order('code', { ascending: true });
      if (error) {
        console.error('Error fetching branches:', error);
      } else if (data && data.length > 0) {
        const formatted: Branch[] = data.map((d: any) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          address: d.address,
          lat: d.lat,
          lng: d.lng,
          isActive: d.is_active !== undefined ? d.is_active : true
        }));
        setBranches(formatted);
        setSelectedBranch(formatted[0]); // Update default branch
      }
    } catch (err) {
      console.error('Fetch branches exception:', err);
    }
  };

  const handleAddBranch = async (newBranch: Branch) => {
    // Optimistic update
    setBranches([...branches, newBranch]);
    
    // Supabase
    const { error } = await supabase.from('branches').insert([{
      code: newBranch.code,
      name: newBranch.name,
      address: newBranch.address,
      lat: newBranch.lat,
      lng: newBranch.lng,
      is_active: newBranch.isActive
    }]);
    
    if (error) {
      console.error("Error inserting branch:", error);
      // Revert if needed, but keeping it simple for now
    }
  };

  const handleToggleBranchStatus = async (branchId: string) => {
    const branchToToggle = branches.find(b => b.id === branchId);
    if (!branchToToggle) return;
    
    // Optimistic update
    setBranches(prev => prev.map(b => b.id === branchId ? { ...b, isActive: !b.isActive } : b));
    
    // Supabase
    const { error } = await supabase.from('branches')
      .update({ is_active: !branchToToggle.isActive })
      .eq('id', branchId);
      
    if (error) {
      console.error("Error updating branch:", error);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchRealAttendance();
    fetchTickets();
    fetchMarketingPosts();
    
    // In demo mode, load mock if empty
    import('./lib/mockData').then(({ MOCK_MARKETING_POSTS }) => {
      setMarketingPosts(prev => prev.length > 0 ? prev : MOCK_MARKETING_POSTS as MarketingPost[]);
    });
  }, []);

  const role: UserRole = isCustomerMode ? 'customer' : currentUser ? currentUser.role : 'customer';

  const handleLoginSuccess = (staff: Staff) => {
    setCurrentUser(staff);
    setIsCustomerMode(false);
    setShowLoginModal(false);
    
    // Auto-select staff's branch
    const staffBranch = branches.find(b => b.id === staff.branchId);
    if (staffBranch) {
      setSelectedBranch(staffBranch);
    }

    // Refresh real attendance logs on login
    fetchRealAttendance();
    fetchTickets();
    fetchMarketingPosts();

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

  const handleMarketingSubmit = async (platform: MarketingPlatform, url: string) => {
    if (!currentUser) return;
    
    const newPost = {
      branch_id: selectedBranch.id,
      platform,
      post_url: url,
      author_name: currentUser.fullName
    };

    try {
      const { data, error } = await supabase.from('marketing_posts').insert([newPost]).select();
      
      if (!error && data && data.length > 0) {
        setMarketingPosts(prev => [data[0] as MarketingPost, ...prev]);
      } else {
        // Fallback to local state
        const fallbackPost: MarketingPost = {
          id: `local-${Date.now()}`,
          ...newPost,
          created_at: new Date().toISOString()
        };
        setMarketingPosts(prev => [fallbackPost, ...prev]);
      }
      
      setShowMarketingModal(false);
      
      // Simple Toast notification
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg z-50 font-bold animate-in slide-in-from-bottom-5';
      toast.innerText = '✅ Nộp bài đăng thành công!';
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
      
    } catch (err) {
      console.error('Marketing submission error', err);
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

      {/* Marketing Modal */}
      {currentUser && (
        <MarketingModal
          isOpen={showMarketingModal}
          onClose={() => setShowMarketingModal(false)}
          currentUser={currentUser}
          currentBranch={selectedBranch}
          onSubmit={handleMarketingSubmit}
        />
      )}

      {/* Main Header Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 py-3 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <img 
              src="/logo-pk88.jpg" 
              alt="Phụ Kiện 88 Logo" 
              className="w-10 h-10 rounded-xl shadow-lg shadow-amber-500/20 object-cover border border-slate-800"
            />
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
            {/* Quick Post Button for Staff */}
            {currentUser && !isCustomerMode && (
              <button
                onClick={() => setShowMarketingModal(true)}
                className="hidden sm:flex px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs items-center gap-1.5 shadow-md shadow-blue-500/20 transition-colors animate-pulse hover:animate-none"
              >
                <Send className="w-3.5 h-3.5" />
                + Nộp Link Bài Đăng (5s)
              </button>
            )}

            {/* Refresh DB Button */}
            {currentUser && !isCustomerMode && (
              <button
                onClick={() => {
                  fetchRealAttendance();
                  fetchTickets();
                  fetchMarketingPosts();
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
                <Building2 className="w-4 h-4 text-amber-500" />
                <select
                  value={selectedBranch.id}
                  onChange={(e) => {
                    const b = activeBranches.find((x) => x.id === e.target.value);
                    if (b) setSelectedBranch(b);
                  }}
                  className="bg-transparent text-xs font-bold text-slate-200 pr-2 py-0.5 focus:outline-none cursor-pointer"
                >
                  {activeBranches.map((b) => (
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
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/30">
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-xs font-bold text-slate-200">{currentUser.fullName}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono">{currentUser.role}</div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 bg-slate-800 hover:bg-amber-900/40 hover:text-amber-300 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
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
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
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
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-extrabold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Executive Dashboard (Toàn Chuỗi)</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'attendance'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-extrabold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Chấm Công GPS Geofence</span>
            </button>

            <button
              onClick={() => setActiveTab('marketing')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'marketing'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 font-extrabold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>📢 Hiệu Suất Marketing</span>
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tickets'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-extrabold'
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
              <AdminPanel 
                branches={branches} 
                staffList={MOCK_STAFF} 
                attendanceLogs={attendanceHistory}
                onAddBranch={handleAddBranch}
                onToggleBranchStatus={handleToggleBranchStatus}
              />
            )}

            {activeTab === 'dashboard' && (currentUser?.role === 'founder' || currentUser?.role === 'admin') && (
              <ExecutiveDashboard branches={branches} attendanceLogs={attendanceHistory} marketingPosts={marketingPosts} />
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

            {activeTab === 'marketing' && currentUser && (
              <MarketingDashboard 
                branches={activeBranches} 
                posts={marketingPosts} 
                currentBranch={selectedBranch}
                currentUser={currentUser}
                onOpenSubmitModal={() => setShowMarketingModal(true)}
              />
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
