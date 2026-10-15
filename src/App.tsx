import React, { useState, useEffect, useRef } from 'react';
import { UserRole, Branch, AttendanceRecord, RepairTicket, Staff, LeaveRequest, LeaveStatus } from './types';
import { INITIAL_BRANCHES, MOCK_STAFF, MOCK_REPAIR_TICKETS, MOCK_LEAVE_REQUESTS } from './lib/mockData';
import { AttendanceCard } from './components/AttendanceCard';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { RepairTicketView } from './components/RepairTicketView';
import { AIChatDrawer } from './components/AIChatDrawer';
import { AdminPanel } from './components/AdminPanel';
import { LoginModal } from './components/LoginModal';
import { TrainingLMS } from './components/TrainingLMS';
import { MarketingDashboard } from './components/MarketingDashboard';
import { MarketingModal } from './components/MarketingModal';
import { AIHRModal } from './components/AIHRModal';
import { BranchStaffDirectory } from './components/BranchStaffDirectory';
import { POSView } from './components/POSView';
import { PublicRecruitmentView } from './components/PublicRecruitmentView';
import { supabase } from './lib/supabase';
import { Building2, Clock, LayoutDashboard, TicketCheck, Cpu, LogOut, ShieldCheck, QrCode, Lock, RefreshCw, GraduationCap, Send, Megaphone, UserCheck, ChevronDown, Users, ShoppingBag, Wrench, Briefcase } from 'lucide-react';
import { MarketingPost, MarketingPlatform } from './types';
import { AppTab, getTabFromUrl, isCustomerModeFromUrl, isRecruitmentModeFromUrl, canAccessTab, syncTabToUrl } from './lib/router';

export function App() {
  // 1. Phục hồi user từ localStorage nếu đã đăng nhập trước đó
  const [currentUser, setCurrentUser] = useState<Staff | null>(() => {
    try {
      const saved = localStorage.getItem('pk88_current_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Lỗi đọc user từ localStorage:', e);
    }
    return null;
  });

  // 2. Kiểm tra xem URL có param ?mode=tra-cuu không
  const [isCustomerMode, setIsCustomerMode] = useState<boolean>(() => {
    return isCustomerModeFromUrl();
  });

  const [selectedBranch, setSelectedBranch] = useState<Branch>(INITIAL_BRANCHES[0]);

  // 3. Khởi tạo activeTab từ URL Search Params (?tab=cham-cong, ?tab=pos...)
  const initialUrlTab = getTabFromUrl();
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (initialUrlTab) return initialUrlTab;
    return 'attendance';
  });

  // Ghi nhớ tab dự định truy cập nếu người dùng truy cập trực tiếp URL khi chưa đăng nhập
  const [pendingDirectTab, setPendingDirectTab] = useState<AppTab | null>(() => initialUrlTab);

  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [tickets, setTickets] = useState<RepairTicket[]>(MOCK_REPAIR_TICKETS);
  
  // Chỉ hiện modal đăng nhập nếu chưa có phiên đăng nhập, không ở chế độ khách tra cứu và không ở trang tuyển dụng
  const [showLoginModal, setShowLoginModal] = useState<boolean>(() => {
    const isGuest = isCustomerModeFromUrl();
    const isRecruit = isRecruitmentModeFromUrl();
    const hasSavedUser = typeof window !== 'undefined' && !!localStorage.getItem('pk88_current_user');
    return !isGuest && !isRecruit && !hasSavedUser;
  });

  const [loadingDb, setLoadingDb] = useState<boolean>(false);
  const [showMarketingModal, setShowMarketingModal] = useState<boolean>(false);
  const [showAIHRModal, setShowAIHRModal] = useState<boolean>(false);

  // Refs để xử lý đóng modal khi người dùng bấm nút Back trên điện thoại
  const showAIHRModalRef = useRef(showAIHRModal);
  showAIHRModalRef.current = showAIHRModal;
  const showMarketingModalRef = useRef(showMarketingModal);
  showMarketingModalRef.current = showMarketingModal;
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const cached = localStorage.getItem('pk88_leave_requests');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed.filter((item: any) => !item.id?.startsWith('mock-'));
        }
      } catch (e) {
        console.error('Error parsing cached leave requests:', e);
      }
    }
    return [];
  });
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [staffList, setStaffList] = useState<Staff[]>(MOCK_STAFF);

  const activeBranches = branches.filter(b => b.isActive);
  
  // Marketing Posts State (Real database sync)
  const [marketingPosts, setMarketingPosts] = useState<MarketingPost[]>(() => {
    const cached = localStorage.getItem('pk88_marketing_posts');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed.filter((p: any) => !p.id?.startsWith('post-'));
        }
      } catch (e) {}
    }
    return [];
  });

  // Fetch real attendance records directly from Supabase Cloud DB!
  const fetchRealAttendance = async () => {
    setLoadingDb(true);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .order('check_in', { ascending: false })
        .limit(250);

      if (error) {
        console.error('Error fetching Supabase attendance:', error);
      } else if (data) {
        const formatted: AttendanceRecord[] = data.map((item: any) => {
          const isLate = item.is_late || item.notes?.toLowerCase().includes('đi trễ') || false;
          // Bán kính chuẩn hệ thống: 100m
          const isOutsideGeofence = item.is_outside_geofence || (item.distance_meters !== undefined && item.distance_meters > 100) || false;

          let disputeStatus = item.dispute_status || 'NONE';
          let disputeReason = item.dispute_reason || undefined;
          let proofImageUrl = item.proof_image_url || undefined;
          let disputeType = item.dispute_type || undefined;
          let disputeHandledBy = item.dispute_handled_by || undefined;
          let rejectionReason = item.rejection_reason || undefined;

          // Fallback parser từ chuỗi notes nếu database chưa migrate cột mới
          if (disputeStatus === 'NONE' && item.notes) {
            if (item.notes.includes('[GIẢI TRÌNH CHỜ DUYỆT]')) {
              disputeStatus = 'PENDING';
              disputeReason = item.notes.replace(/^.*\[GIẢI TRÌNH CHỜ DUYỆT\]:?/, '').trim();
            } else if (item.notes.includes('[ĐÃ DUYỆT GIẢI TRÌNH')) {
              disputeStatus = 'APPROVED';
            } else if (item.notes.includes('[TỪ CHỐI GIẢI TRÌNH')) {
              disputeStatus = 'REJECTED';
            }
          }

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
            notes: item.notes || 'Check-in GPS Hợp lệ',
            isLate,
            isOutsideGeofence,
            disputeStatus,
            disputeType,
            disputeReason,
            proofImageUrl,
            disputedAt: item.disputed_at,
            disputeHandledBy,
            rejectionReason
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
        console.warn('Fetch marketing posts notice (Supabase table may not exist yet):', error.message);
      } else if (data) {
        setMarketingPosts(data as MarketingPost[]);
        localStorage.setItem('pk88_marketing_posts', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Fetch marketing posts exception:', err);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase leave_requests notice:', error.message);
      } else if (data) {
        const formatted: LeaveRequest[] = data.map((item: any) => ({
          id: item.id,
          staffId: item.staff_id,
          staffName: item.staff_name,
          phone: item.phone,
          branchId: item.branch_id,
          role: item.role,
          startDate: item.start_date,
          endDate: item.end_date,
          reason: item.reason,
          type: item.type,
          status: item.status,
          approvedBy: item.approved_by,
          rejectedBy: item.rejected_by,
          createdAt: item.created_at,
          replacementStaffName: item.replacement_staff_name,
          aiRiskAssessment: item.ai_risk_assessment
        }));
        setLeaveRequests(formatted);
        localStorage.setItem('pk88_leave_requests', JSON.stringify(formatted));
      }
    } catch (err) {
      console.error('Fetch leave requests exception:', err);
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

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error fetching staff from Supabase:', error);
      } else if (data && data.length > 0) {
        const localOverridesStr = localStorage.getItem('pk88_staff_overrides');
        const localOverrides = localOverridesStr ? JSON.parse(localOverridesStr) : {};

        const formatted: Staff[] = data.map((item: any) => {
          const match = MOCK_STAFF.find(m => m.phone.trim() === item.phone.trim()) || MOCK_STAFF.find(m => m.id === item.id);
          const override = localOverrides[item.id] || localOverrides[item.phone];

          return {
            id: item.id,
            branchId: item.branch_id || override?.branchId || match?.branchId || '2b150536-0b47-4e32-912b-b5ede701bfa6',
            fullName: item.full_name || override?.fullName || match?.fullName,
            phone: item.phone || override?.phone || match?.phone,
            role: item.role || override?.role || match?.role,
            isActive: item.is_active !== undefined ? item.is_active : (override?.isActive !== undefined ? override.isActive : true),
            avatarUrl: item.avatar_url || override?.avatarUrl || match?.avatarUrl,
            code: override?.code || match?.code,
            email: override?.email || match?.email,
            joinDate: override?.joinDate || match?.joinDate,
            birthDate: item.birth_date || override?.birthDate || match?.birthDate
          };
        });
        setStaffList(formatted);
      }
    } catch (err) {
      console.error('Fetch staff exception:', err);
    }
  };

  const handleUpdateStaff = (updatedStaff: Staff) => {
    setStaffList(prev => prev.map(s => s.id === updatedStaff.id || s.phone === updatedStaff.phone ? updatedStaff : s));
  };

  useEffect(() => {
    fetchBranches();
    fetchStaff();
    fetchRealAttendance();
    fetchTickets();
    fetchMarketingPosts();
    fetchLeaveRequests();
  }, []);

  // Lắng nghe sự kiện nút "Back" / "Forward" trên điện thoại và trình duyệt
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // 1. Nếu có Modal đang mở, bấm Back trên điện thoại sẽ đóng modal trước
      if (showAIHRModalRef.current) {
        setShowAIHRModal(false);
        return;
      }
      if (showMarketingModalRef.current) {
        setShowMarketingModal(false);
        return;
      }

      // 2. Kiểm tra URL xem là Chế độ khách hay Tab nào
      const urlIsCustomer = isCustomerModeFromUrl();
      const urlTab = getTabFromUrl();

      if (urlIsCustomer) {
        setIsCustomerMode(true);
        return;
      } else {
        setIsCustomerMode(false);
      }

      if (urlTab) {
        if (urlTab === 'recruitment') {
          setActiveTab('recruitment');
          setShowLoginModal(false);
          return;
        }
        if (currentUser) {
          if (canAccessTab(urlTab, currentUser.role)) {
            setActiveTab(urlTab);
          } else {
            setActiveTab('attendance');
          }
        } else {
          setPendingDirectTab(urlTab);
          setShowLoginModal(true);
        }
      } else {
        // Nếu không có param URL (về trang chủ)
        if (currentUser) {
          if (currentUser.role === 'admin') setActiveTab('admin');
          else if (currentUser.role === 'founder') setActiveTab('dashboard');
          else setActiveTab('attendance');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  // Đồng bộ URL lúc khởi động trang lần đầu (Hỗ trợ truy cập trực tiếp bằng URL)
  useEffect(() => {
    if (isCustomerMode) {
      syncTabToUrl('tickets', true, true);
    } else if (activeTab === 'recruitment' || getTabFromUrl() === 'recruitment' || isRecruitmentModeFromUrl()) {
      setActiveTab('recruitment');
      syncTabToUrl('recruitment', false, true);
      setShowLoginModal(false);
    } else if (currentUser) {
      // Đã đăng nhập: ưu tiên tab yêu cầu từ URL nếu có quyền
      const targetTab = (pendingDirectTab && canAccessTab(pendingDirectTab, currentUser.role))
        ? pendingDirectTab
        : (canAccessTab(activeTab, currentUser.role) ? activeTab : (currentUser.role === 'admin' ? 'admin' : currentUser.role === 'founder' ? 'dashboard' : 'attendance'));
      
      setActiveTab(targetTab);
      syncTabToUrl(targetTab, false, true);
      setPendingDirectTab(null);
    } else {
      // Chưa đăng nhập: nếu có URL tab thì yêu cầu đăng nhập
      const urlTab = getTabFromUrl();
      if (urlTab === 'recruitment') {
        setActiveTab('recruitment');
        syncTabToUrl('recruitment', false, true);
        setShowLoginModal(false);
      } else if (urlTab) {
        setPendingDirectTab(urlTab);
        setShowLoginModal(true);
      }
    }
  }, []);

  const handleNavigateTab = (tab: AppTab, replace: boolean = false) => {
    if (isCustomerMode) {
      setIsCustomerMode(false);
    }

    if (tab === 'recruitment') {
      setActiveTab('recruitment');
      syncTabToUrl('recruitment', false, replace);
      setShowLoginModal(false);
      return;
    }

    if (!currentUser) {
      setPendingDirectTab(tab);
      setShowLoginModal(true);
      return;
    }

    // Kiểm tra quyền truy cập tab theo role
    if (!canAccessTab(tab, currentUser.role)) {
      alert(`Tài khoản (${currentUser.role}) không có quyền truy cập vào phân khu này.`);
      return;
    }

    setActiveTab(tab);
    syncTabToUrl(tab, false, replace);
  };

  const handleOpenAIHRModal = () => {
    setShowAIHRModal(true);
    window.history.pushState({ modal: 'ai-hr', tab: activeTab }, '', window.location.href);
  };

  const handleCloseAIHRModal = () => {
    setShowAIHRModal(false);
    if (window.history.state?.modal === 'ai-hr') {
      window.history.back();
    }
  };

  const handleOpenMarketingModal = () => {
    setShowMarketingModal(true);
    window.history.pushState({ modal: 'marketing', tab: activeTab }, '', window.location.href);
  };

  const handleCloseMarketingModal = () => {
    setShowMarketingModal(false);
    if (window.history.state?.modal === 'marketing') {
      window.history.back();
    }
  };

  const handleToggleCustomerMode = () => {
    const nextMode = !isCustomerMode;
    setIsCustomerMode(nextMode);
    if (nextMode) {
      syncTabToUrl('tickets', true, false);
    } else {
      const target = currentUser ? activeTab : 'attendance';
      syncTabToUrl(target, false, false);
    }
  };

  const role: UserRole = isCustomerMode ? 'customer' : currentUser ? currentUser.role : 'customer';

  const handleLoginSuccess = (staff: Staff) => {
    setCurrentUser(staff);
    localStorage.setItem('pk88_current_user', JSON.stringify(staff));
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
    fetchLeaveRequests();

    // Quyết định tab sau đăng nhập: Ưu tiên tab người dùng vừa click hoặc gõ trên URL (?tab=...)
    const intendedTab = pendingDirectTab || getTabFromUrl();
    let finalTab: AppTab;

    if (intendedTab && canAccessTab(intendedTab, staff.role)) {
      finalTab = intendedTab;
    } else {
      if (staff.role === 'admin') finalTab = 'admin';
      else if (staff.role === 'founder') finalTab = 'dashboard';
      else finalTab = 'attendance';
    }

    setActiveTab(finalTab);
    syncTabToUrl(finalTab, false, false);
    setPendingDirectTab(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('pk88_current_user');
    setCurrentUser(null);
    setPendingDirectTab(null);
    setShowLoginModal(true);

    const url = new URL(window.location.href);
    url.searchParams.delete('tab');
    url.searchParams.delete('mode');
    window.history.replaceState({}, '', url.pathname);
  };

  const handleCheckInSuccess = (record: AttendanceRecord) => {
    fetchRealAttendance();
  };

  const handleAttendanceDisputeSubmit = async (record: AttendanceRecord) => {
    try {
      // 1. Optimistic update local state
      setAttendanceHistory(prev => {
        const existingIdx = prev.findIndex(r => r.id === record.id);
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = record;
          return next;
        } else {
          return [record, ...prev];
        }
      });

      // 2. Cố gắng ghi lên Supabase
      const isExistingDbRecord = record.id && !record.id.startsWith('local-') && !record.id.startsWith('dispute-') && !record.id.startsWith('mock-');
      
      const payload: any = {
        dispute_status: 'PENDING',
        dispute_type: record.disputeType || 'OUTSIDE_100M',
        dispute_reason: record.disputeReason || '',
        proof_image_url: record.proofImageUrl || null,
        disputed_at: record.disputedAt || new Date().toISOString(),
        notes: `[GIẢI TRÌNH CHỜ DUYỆT]: ${record.disputeReason || 'Chấm công ngoài bán kính 100m'}`
      };

      if (isExistingDbRecord) {
        // Cập nhật record hiện có
        await supabase
          .from('attendance')
          .update(payload)
          .eq('id', record.id);
      } else {
        // Tạo record chấm công giải trình mới (chấm bù hoặc ngoài bán kính)
        const insertPayload: any = {
          staff_id: record.staffId,
          branch_id: record.branchId,
          check_in: record.checkIn,
          check_out: record.checkOut || null,
          shift_type: record.shiftType,
          work_hours: record.workHours || 0,
          lat: record.lat || selectedBranch.lat,
          lng: record.lng || selectedBranch.lng,
          distance_meters: record.distanceMeters || 0,
          is_verified: false,
          ...payload
        };
        const { data, error } = await supabase.from('attendance').insert([insertPayload]).select();
        if (data && data.length > 0) {
          // Thay id tạm thời bằng ID thật từ CSDL
          setAttendanceHistory(prev => prev.map(r => r.id === record.id ? { ...r, id: data[0].id } : r));
        }
      }
    } catch (err) {
      console.warn('Lỗi đồng bộ giải trình lên Supabase (vẫn lưu cục bộ):', err);
    }
  };

  const handleApproveDispute = async (recordId: string, approverName: string) => {
    try {
      // 1. Optimistic update
      setAttendanceHistory(prev => prev.map(rec => {
        if (rec.id === recordId) {
          return {
            ...rec,
            isVerified: true,
            isOutsideGeofence: false,
            disputeStatus: 'APPROVED',
            disputeHandledBy: approverName,
            notes: `${rec.notes?.replace(/\[GIẢI TRÌNH CHỜ DUYỆT\].*$/, '').trim() || ''} [ĐÃ DUYỆT GIẢI TRÌNH bởi ${approverName}]`.trim()
          };
        }
        return rec;
      }));

      // 2. Supabase update
      if (!recordId.startsWith('local-') && !recordId.startsWith('mock-') && !recordId.startsWith('dispute-')) {
        await supabase.from('attendance').update({
          is_verified: true,
          dispute_status: 'APPROVED',
          dispute_handled_by: approverName,
          notes: `[ĐÃ DUYỆT GIẢI TRÌNH bởi ${approverName}]`
        }).eq('id', recordId);
      }
    } catch (err) {
      console.error('Lỗi khi duyệt giải trình:', err);
    }
  };

  const handleRejectDispute = async (recordId: string, rejecterName: string, reason: string) => {
    try {
      // 1. Optimistic update
      setAttendanceHistory(prev => prev.map(rec => {
        if (rec.id === recordId) {
          return {
            ...rec,
            isVerified: false,
            disputeStatus: 'REJECTED',
            disputeHandledBy: rejecterName,
            rejectionReason: reason,
            notes: `${rec.notes?.replace(/\[GIẢI TRÌNH CHỜ DUYỆT\].*$/, '').trim() || ''} [TỪ CHỐI GIẢI TRÌNH bởi ${rejecterName}: ${reason}]`.trim()
          };
        }
        return rec;
      }));

      // 2. Supabase update
      if (!recordId.startsWith('local-') && !recordId.startsWith('mock-') && !recordId.startsWith('dispute-')) {
        await supabase.from('attendance').update({
          is_verified: false,
          dispute_status: 'REJECTED',
          dispute_handled_by: rejecterName,
          rejection_reason: reason,
          notes: `[TỪ CHỐI GIẢI TRÌNH bởi ${rejecterName}: ${reason}]`
        }).eq('id', recordId);
      }
    } catch (err) {
      console.error('Lỗi khi từ chối giải trình:', err);
    }
  };

  const handleCreateTicket = async (newTicket: RepairTicket) => {
    try {
      const { data, error } = await supabase.from('repair_tickets').insert([{
        code: newTicket.code,
        branch_id: newTicket.branchId,
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
          branchId: savedItem.branch_id || newTicket.branchId,
          customerName: savedItem.customer_name,
          customerPhone: savedItem.customer_phone,
          deviceModel: savedItem.device_model,
          serviceType: savedItem.service_type,
          status: savedItem.status,
          price: Number(savedItem.price),
          createdAt: savedItem.created_at,
          technicianName: savedItem.technician_name,
          createdByStaffId: newTicket.createdByStaffId,
          createdByStaffName: newTicket.createdByStaffName
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
        setMarketingPosts(prev => {
          const updated = [data[0] as MarketingPost, ...prev];
          localStorage.setItem('pk88_marketing_posts', JSON.stringify(updated));
          return updated;
        });
      } else {
        // Fallback to local state
        const fallbackPost: MarketingPost = {
          id: `local-${Date.now()}`,
          ...newPost,
          created_at: new Date().toISOString()
        };
        setMarketingPosts(prev => {
          const updated = [fallbackPost, ...prev];
          localStorage.setItem('pk88_marketing_posts', JSON.stringify(updated));
          return updated;
        });
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

  const handleUpdateMarketingPost = async (
    postId: string, 
    views: number, 
    likes: number, 
    extra?: { post_url?: string; platform?: 'facebook' | 'tiktok' | 'youtube' | 'zalo' }
  ) => {
    try {
      const updateData: any = { views, likes };
      if (extra?.post_url) updateData.post_url = extra.post_url;
      if (extra?.platform) updateData.platform = extra.platform;

      // 1. Cập nhật tức thì vào State và LocalStorage
      setMarketingPosts(prev => {
        const updated = prev.map(p => p.id === postId ? { ...p, ...updateData } : p);
        localStorage.setItem('pk88_marketing_posts', JSON.stringify(updated));
        return updated;
      });

      // 2. Đồng bộ lên Supabase database
      const { error } = await supabase
        .from('marketing_posts')
        .update(updateData)
        .eq('id', postId);

      if (error) {
        console.warn('Supabase update marketing post error:', error.message);
      }
    } catch (err) {
      console.error('Update marketing post exception:', err);
    }
  };

  const handleDeleteMarketingPost = async (postId: string) => {
    try {
      // 1. Xóa tức thì khỏi State và LocalStorage
      setMarketingPosts(prev => {
        const updated = prev.filter(p => p.id !== postId);
        localStorage.setItem('pk88_marketing_posts', JSON.stringify(updated));
        return updated;
      });

      // 2. Xóa vĩnh viễn trên Supabase
      const { error } = await supabase
        .from('marketing_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('Supabase delete marketing post error:', error.message);
      }
    } catch (err) {
      console.error('Delete marketing post exception:', err);
    }
  };

  const handleLeaveRequestSubmit = async (newReq: LeaveRequest) => {
    // 1. Optimistic update and persist local cache
    setLeaveRequests(prev => {
      const updated = [newReq, ...prev];
      localStorage.setItem('pk88_leave_requests', JSON.stringify(updated));
      return updated;
    });

    // 2. Persist to Supabase Cloud DB
    try {
      const { error } = await supabase.from('leave_requests').insert({
        id: newReq.id,
        staff_id: newReq.staffId,
        staff_name: newReq.staffName,
        phone: newReq.phone || '',
        branch_id: newReq.branchId,
        role: newReq.role,
        start_date: newReq.startDate,
        end_date: newReq.endDate,
        reason: newReq.reason,
        type: newReq.type,
        status: newReq.status,
        approved_by: newReq.approvedBy || null,
        rejected_by: newReq.rejectedBy || null,
        replacement_staff_name: newReq.replacementStaffName || '',
        ai_risk_assessment: newReq.aiRiskAssessment || '',
        created_at: newReq.createdAt || new Date().toISOString()
      });

      if (error) {
        console.warn('Lỗi ghi đơn nghỉ phép lên Supabase:', error.message);
      } else {
        console.log('✅ Đã đồng bộ đơn nghỉ phép lên Supabase thành công:', newReq.id);
      }
    } catch (err) {
      console.error('Lỗi ngoại lệ khi gửi đơn lên Supabase:', err);
    }
  };

  const handleUpdateLeaveStatus = async (reqId: string, status: LeaveStatus, handlerName: string) => {
    // 1. Optimistic update and persist local cache
    setLeaveRequests(prev => {
      const updated = prev.map(r => {
        if (r.id === reqId) {
          return {
            ...r,
            status,
            approvedBy: status === 'APPROVED' ? handlerName : r.approvedBy,
            rejectedBy: status === 'REJECTED' ? handlerName : r.rejectedBy
          };
        }
        return r;
      });
      localStorage.setItem('pk88_leave_requests', JSON.stringify(updated));
      return updated;
    });

    // 2. Persist status change to Supabase Cloud DB
    try {
      const target = leaveRequests.find(r => r.id === reqId);
      if (target) {
        const { error } = await supabase.from('leave_requests').upsert({
          id: target.id,
          staff_id: target.staffId,
          staff_name: target.staffName,
          phone: target.phone || '',
          branch_id: target.branchId,
          role: target.role,
          start_date: target.startDate,
          end_date: target.endDate,
          reason: target.reason,
          type: target.type,
          status,
          approved_by: status === 'APPROVED' ? handlerName : (status === 'REJECTED' ? null : target.approvedBy || null),
          rejected_by: status === 'REJECTED' ? handlerName : (status === 'APPROVED' ? null : target.rejectedBy || null),
          replacement_staff_name: target.replacementStaffName || '',
          ai_risk_assessment: target.aiRiskAssessment || '',
          created_at: target.createdAt || new Date().toISOString()
        });

        if (error) {
          console.warn('Lỗi cập nhật trạng thái đơn phép lên Supabase:', error.message);
        } else {
          console.log('✅ Đã cập nhật trạng thái duyệt đơn lên Supabase:', reqId, status);
        }
      }
    } catch (err) {
      console.error('Lỗi ngoại lệ khi cập nhật trạng thái duyệt lên Supabase:', err);
    }
  };

  // Nếu đang ở trang tuyển dụng công khai (/tuyen-dung hoặc ?tab=tuyen-dung)
  if (activeTab === 'recruitment') {
    return (
      <PublicRecruitmentView
        branches={branches}
        onBackToApp={() => {
          handleNavigateTab(currentUser ? (currentUser.role === 'hr' || currentUser.role === 'admin' ? 'admin' : 'attendance') : 'attendance');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Login Modal Popup */}
      {(showLoginModal || (!currentUser && !isCustomerMode)) && (
        <LoginModal 
          onLoginSuccess={handleLoginSuccess} 
          staffList={staffList}
          onGuestLookup={() => {
            setIsCustomerMode(true);
            setShowLoginModal(false);
            syncTabToUrl('tickets', true, false);
          }}
          onRecruitmentApply={() => {
            handleNavigateTab('recruitment');
          }}
        />
      )}

      {/* Marketing Modal */}
      {currentUser && (
        <MarketingModal
          isOpen={showMarketingModal}
          onClose={handleCloseMarketingModal}
          currentUser={currentUser}
          currentBranch={selectedBranch}
          onSubmit={handleMarketingSubmit}
          existingPosts={marketingPosts}
        />
      )}

      {/* AI HR Modal */}
      {currentUser && (
        <AIHRModal
          isOpen={showAIHRModal}
          onClose={handleCloseAIHRModal}
          currentUser={currentUser}
          branches={branches}
          staffList={staffList}
          leaveRequests={leaveRequests}
          onSubmitLeaveRequest={handleLeaveRequestSubmit}
          onUpdateLeaveStatus={handleUpdateLeaveStatus}
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
                onClick={handleOpenMarketingModal}
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
              onClick={handleToggleCustomerMode}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                isCustomerMode
                  ? 'bg-sky-500 text-slate-950 border-sky-400 font-extrabold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>{isCustomerMode ? 'Thoát Khách QR' : 'Khách Tra Cứu QR'}</span>
            </button>

            {/* Nút xem trang Tuyển Dụng Công Khai */}
            <button
              onClick={() => handleNavigateTab('recruitment')}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              title="Cổng ứng tuyển việc làm tại chuỗi Phụ Kiện 88"
            >
              <Briefcase className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Tuyển Dụng PK88</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs for Logged-In Users (2 Rows: 4 tabs on Row 1, balanced per Role) */}
        {!isCustomerMode && currentUser && (
          <div className="bg-slate-900/90 border border-slate-800/90 p-2.5 rounded-2xl space-y-2 shadow-lg">
            {/* Row 1: 4 Tabs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(currentUser.role === 'admin' || currentUser.role === 'founder' || currentUser.role === 'hr') && (
                <button
                  onClick={() => handleNavigateTab('admin')}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'admin'
                      ? (currentUser.role === 'hr' ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20 font-extrabold' : 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-extrabold')
                      : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
                  }`}
                >
                  {currentUser.role === 'hr' ? <Users className="w-4 h-4 flex-shrink-0" /> : <Cpu className="w-4 h-4 flex-shrink-0" />}
                  <span className="truncate">{currentUser.role === 'hr' ? 'Quản Trị Nhân Sự (HR)' : 'Quản Trị System Admin'}</span>
                </button>
              )}

              {(currentUser.role === 'founder' || currentUser.role === 'admin') && (
                <button
                  onClick={() => handleNavigateTab('dashboard')}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold'
                      : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Executive Dashboard</span>
                </button>
              )}

              <button
                onClick={() => handleNavigateTab('attendance')}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'attendance'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
                }`}
              >
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Chấm Công GPS Geofence</span>
              </button>

              <button
                onClick={() => handleNavigateTab('staff_directory')}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'staff_directory'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-extrabold'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
                }`}
              >
                <Users className="w-4 h-4 flex-shrink-0 text-cyan-400" />
                <span className="truncate">Đồng Nghiệp Chi Nhánh</span>
              </button>

              {!(currentUser.role === 'admin' || currentUser.role === 'founder' || currentUser.role === 'hr') && (
                <>
                  <button
                    onClick={() => handleNavigateTab('tickets')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'tickets'
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 font-extrabold'
                        : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
                    }`}
                  >
                    <Wrench className="w-4 h-4 flex-shrink-0 text-rose-400" />
                    <span className="truncate">Tiếp Nhận Sửa Chữa</span>
                  </button>

                  <button
                    onClick={() => handleNavigateTab('pos')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'pos'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold'
                        : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 flex-shrink-0 text-amber-400" />
                    <span className="truncate">Bán Hàng & Dịch Vụ Nhanh (POS)</span>
                  </button>
                </>
              )}
            </div>

            {/* Row 2 */}
            <div className={`grid gap-2 ${(currentUser.role === 'admin' || currentUser.role === 'founder' || currentUser.role === 'hr') ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5' : 'grid-cols-1 sm:grid-cols-3'}`}>
              {(currentUser.role === 'admin' || currentUser.role === 'founder' || currentUser.role === 'hr') && (
                <>
                  <button
                    onClick={() => handleNavigateTab('tickets')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'tickets'
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 font-extrabold'
                        : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
                    }`}
                  >
                    <Wrench className="w-4 h-4 flex-shrink-0 text-rose-400" />
                    <span className="truncate">Tiếp Nhận Sửa Chữa</span>
                  </button>

                  <button
                    onClick={() => handleNavigateTab('pos')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'pos'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold'
                        : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 flex-shrink-0 text-amber-400" />
                    <span className="truncate">Bán Hàng & POS</span>
                  </button>
                </>
              )}

              <button
                onClick={() => handleNavigateTab('marketing')}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'marketing'
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20 font-extrabold'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
                }`}
              >
                <Megaphone className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Hiệu Suất Marketing</span>
              </button>

              <button
                onClick={() => handleNavigateTab('training')}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'training'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-extrabold'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
                }`}
              >
                <GraduationCap className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Đào Tạo LMS 60 Ngày</span>
              </button>

              <button
                onClick={handleOpenAIHRModal}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 shadow-sm"
              >
                <UserCheck className="w-4 h-4 text-rose-400 animate-pulse flex-shrink-0" />
                <span className="truncate">Xin & Duyệt Phép (AI HR)</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Render Views */}
        {isCustomerMode ? (
          <RepairTicketView 
            tickets={tickets} 
            role="customer" 
            branches={branches}
            onCreateTicket={handleCreateTicket} 
          />
        ) : (
          <>
            {activeTab === 'admin' && (currentUser?.role === 'admin' || currentUser?.role === 'founder' || currentUser?.role === 'hr') && (
              <AdminPanel 
                branches={branches} 
                staffList={staffList} 
                attendanceLogs={attendanceHistory}
                leaveRequests={leaveRequests}
                onAddBranch={handleAddBranch}
                onToggleBranchStatus={handleToggleBranchStatus}
                onRefreshStaff={fetchStaff}
                onRefreshAttendance={fetchRealAttendance}
                onUpdateStaff={handleUpdateStaff}
                onApproveDispute={handleApproveDispute}
                onRejectDispute={handleRejectDispute}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'dashboard' && (currentUser?.role === 'founder' || currentUser?.role === 'admin') && (
              <ExecutiveDashboard 
                branches={branches} 
                attendanceLogs={attendanceHistory} 
                marketingPosts={marketingPosts}
                leaveRequests={leaveRequests}
                tickets={tickets}
                onOpenAIHRModal={handleOpenAIHRModal}
              />
            )}

            {activeTab === 'attendance' && currentUser && (
              <div className="max-w-xl mx-auto">
                <AttendanceCard
                  currentBranch={selectedBranch}
                  currentStaff={currentUser}
                  onCheckInSuccess={handleCheckInSuccess}
                  onDisputeSubmit={handleAttendanceDisputeSubmit}
                  attendanceHistory={attendanceHistory}
                />
              </div>
            )}

            {activeTab === 'staff_directory' && currentUser && (
              <BranchStaffDirectory
                currentBranch={selectedBranch}
                currentUser={currentUser}
                staffList={staffList}
                attendanceLogs={attendanceHistory}
                leaveRequests={leaveRequests}
                onUpdateStaff={handleUpdateStaff}
              />
            )}

            {activeTab === 'tickets' && currentUser && (
              <RepairTicketView 
                tickets={tickets} 
                role={currentUser.role} 
                currentUser={currentUser}
                currentBranch={selectedBranch}
                branches={branches}
                onCreateTicket={handleCreateTicket} 
                onUpdateTicket={handleUpdateTicket}
                currentUserName={currentUser.fullName}
              />
            )}

            {activeTab === 'pos' && currentUser && (
              <POSView 
                currentUser={currentUser}
                currentBranch={selectedBranch}
                branches={branches}
                onCreateOrder={handleCreateTicket}
                onUpdateOrder={handleUpdateTicket}
                tickets={tickets}
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
                onOpenSubmitModal={handleOpenMarketingModal}
                onUpdatePost={handleUpdateMarketingPost}
                onDeletePost={handleDeleteMarketingPost}
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
