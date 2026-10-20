import React, { useState, useEffect, useRef } from 'react';
import { UserRole, Branch, AttendanceRecord, RepairTicket, Staff, LeaveRequest, LeaveStatus } from './types';
import { INITIAL_BRANCHES, MOCK_STAFF, MOCK_REPAIR_TICKETS, MOCK_LEAVE_REQUESTS, sortBranchesByPriority } from './lib/mockData';
import { AttendanceCard } from './components/AttendanceCard';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { RepairTicketView } from './components/RepairTicketView';
import { AIChatDrawer } from './components/AIChatDrawer';
import { AdminPanel } from './components/AdminPanel';
import { LoginModal } from './components/LoginModal';
import { TrainingLMS } from './components/TrainingLMS';
import { MarketingDashboard } from './components/MarketingDashboard';
import { MarketingModal } from './components/MarketingModal';
import { PK88MarketingStudio } from './components/PK88MarketingStudio';
import { AIHRModal } from './components/AIHRModal';
import { BranchStaffDirectory } from './components/BranchStaffDirectory';
import { POSView } from './components/POSView';
import { PublicRecruitmentView } from './components/PublicRecruitmentView';
import { PublicCustomerChatView } from './components/PublicCustomerChatView';
import { CustomerLeadsCRMModal } from './components/CustomerLeadsCRMModal';
import { ShiftSchedulingMatrix } from './components/ShiftSchedulingMatrix';
import { StaffDetailModal } from './components/StaffDetailModal';
import { CounterServiceView } from './components/CounterServiceView';
import { ShopManagementView } from './components/ShopManagementView';
import { PersonalShiftsModal } from './components/PersonalShiftsModal';
import { StoreCleanlinessStaffView } from './components/StoreCleanlinessStaffView';
import { CustomerCRMView } from './components/CustomerCRMView';
import { supabase } from './lib/supabase';
import { calculateAttendanceIsLate, fetchShiftAssignmentsFromCloud } from './lib/shiftService';
import { fetchStaffAuthMetadataFromCloud } from './lib/staffAuthService';
import { Building2, Clock, LayoutDashboard, TicketCheck, Cpu, LogOut, ShieldCheck, QrCode, Lock, RefreshCw, GraduationCap, Send, Megaphone, UserCheck, ChevronDown, Users, ShoppingBag, Wrench, Briefcase, Calendar, KeyRound, Settings, MapPin, Sparkles, MessageSquare, HeartHandshake, Bot } from 'lucide-react';
import { MarketingPost, MarketingPlatform, MarketingPostStatus } from './types';
import { AppTab, getTabFromUrl, isCustomerModeFromUrl, isRecruitmentModeFromUrl, isCustomerChatModeFromUrl, canAccessTab, syncTabToUrl, getDefaultTabForRole } from './lib/router';

export function App() {
  // 1. Phục hồi user từ localStorage nếu đã đăng nhập trước đó
  const [currentUser, setCurrentUser] = useState<Staff | null>(() => {
    try {
      const saved = localStorage.getItem('pk88_current_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Lỗi đọc user từ localStorage:', e);
    }
    return null;
  });

  // 2. Kiểm tra xem URL có param ?mode=tra-cuu không
  const [isCustomerMode, setIsCustomerMode] = useState<boolean>(() => {
    return isCustomerModeFromUrl();
  });

  // Khởi tạo selectedBranch: Tự động nhận diện chi nhánh của nhân sự nếu đã đăng nhập
  const [selectedBranch, setSelectedBranch] = useState<Branch>(() => {
    try {
      const saved = localStorage.getItem('pk88_current_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u?.branchId) {
          const match = INITIAL_BRANCHES.find(b => b.id === u.branchId);
          if (match) return match;
        }
      }
    } catch (e) {}
    // Mặc định ưu tiên Văn Phòng cho khối quản lý hoặc Phú Khương
    return INITIAL_BRANCHES.find(b => b.code === 'PK88_VANPHONG') || INITIAL_BRANCHES[0];
  });

  // 3. Khởi tạo activeTab từ URL Search Params (?tab=cham-cong, ?tab=pos...)
  const initialUrlTab = getTabFromUrl();
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (initialUrlTab) return initialUrlTab;
    return getDefaultTabForRole(currentUser?.role);
  });

  // Ghi nhớ tab dự định truy cập nếu người dùng truy cập trực tiếp URL khi chưa đăng nhập
  const [pendingDirectTab, setPendingDirectTab] = useState<AppTab | null>(() => initialUrlTab);

  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [tickets, setTickets] = useState<RepairTicket[]>(MOCK_REPAIR_TICKETS);
  
  // Chỉ hiện modal đăng nhập nếu chưa có phiên đăng nhập, không ở chế độ khách tra cứu, không ở trang tuyển dụng và không ở trang chatbot
  const [showLoginModal, setShowLoginModal] = useState<boolean>(() => {
    const isGuest = isCustomerModeFromUrl();
    const isRecruit = isRecruitmentModeFromUrl();
    const isChat = isCustomerChatModeFromUrl();
    const hasSavedUser = typeof window !== 'undefined' && !!localStorage.getItem('pk88_current_user');
    return !isGuest && !isRecruit && !isChat && !hasSavedUser;
  });

  const [loadingDb, setLoadingDb] = useState<boolean>(false);
  const [showMarketingModal, setShowMarketingModal] = useState<boolean>(false);
  const [showAIHRModal, setShowAIHRModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showMarketingStudio, setShowMarketingStudio] = useState<boolean>(false);
  const [showPersonalShiftsModal, setShowPersonalShiftsModal] = useState<boolean>(false);
  const [showLeadsModal, setShowLeadsModal] = useState<boolean>(() => initialUrlTab === 'leads');
  const [attendanceSubTab, setAttendanceSubTab] = useState<'gps' | 'cleanliness'>('gps');

  // Tự động điều hướng nếu tab hiện tại không thuộc quyền hạn của vai trò hiện tại
  useEffect(() => {
    if (currentUser) {
      if (!canAccessTab(activeTab, currentUser.role)) {
        const def = getDefaultTabForRole(currentUser.role);
        setActiveTab(def);
        syncTabToUrl(def, false, true);
      }
    }
  }, [currentUser?.role]);

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

  // Khóa cứng chi nhánh nếu không phải Founder, HR, Admin
  useEffect(() => {
    if (currentUser?.branchId) {
      const canSwitch = currentUser.role === 'founder' || currentUser.role === 'admin' || currentUser.role === 'hr';
      if (!canSwitch) {
        const homeBranch = branches.find(b => b.id === currentUser.branchId);
        if (homeBranch && selectedBranch.id !== homeBranch.id) {
          setSelectedBranch(homeBranch);
        }
      }
    }
  }, [currentUser?.id, currentUser?.branchId, currentUser?.role, branches, selectedBranch.id]);
  
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
          const isLate = calculateAttendanceIsLate(item.shift_type, item.check_in, item.notes, 10).isLate;
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
            } else if (item.notes.includes('[ĐÃ DUYỆT GIẢI TRÌNH') || item.notes.includes('[CHẤM BÙ')) {
              disputeStatus = 'APPROVED';
              if (item.notes.includes('[CHẤM BÙ BỞI ')) {
                const matchApprover = item.notes.match(/\[CHẤM BÙ BỞI ([^\]]+)\]/);
                if (matchApprover) {
                  disputeHandledBy = matchApprover[1];
                }
                const matchReason = item.notes.match(/\]: (.*)$/);
                if (matchReason) {
                  disputeReason = matchReason[1].trim();
                }
              }
            } else if (item.notes.includes('[TỪ CHỐI GIẢI TRÌNH')) {
              disputeStatus = 'REJECTED';
            }
          }

          const isOnBreak = (item as any).is_on_break === true || 
            (item.notes && 
              (item.notes.includes('[ĐANG NGHỈ TRƯA]') || item.notes.includes('[ĐANG NGHỈ ĂN TỐI]') || item.notes.includes('[ĐANG NGHỈ GIỮA CA]')) && 
              !item.notes.includes('[KẾT THÚC NGHỈ TRƯA]') && !item.notes.includes('[KẾT THÚC NGHỈ ĂN TỐI]') && !item.notes.includes('[KẾT THÚC NGHỈ GIỮA CA]'));

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
            isOnBreak,
            breakStart: (item as any).break_start,
            breakEnd: (item as any).break_end,
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
        const formatted: LeaveRequest[] = data.map((item: any) => {
          let rejectedBy = item.rejected_by;
          let rejectionReason = item.rejection_reason;
          // Fallback nếu reason nằm trong rejected_by theo cú pháp "Tên (ROLE) - Lý do: ..."
          if (!rejectionReason && rejectedBy && rejectedBy.includes(' - Lý do: ')) {
            const parts = rejectedBy.split(' - Lý do: ');
            rejectedBy = parts[0];
            rejectionReason = parts[1];
          }

          return {
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
            rejectedBy,
            rejectionReason,
            createdAt: item.created_at,
            replacementStaffName: item.replacement_staff_name,
            aiRiskAssessment: item.ai_risk_assessment
          };
        });
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
        const sortedBranches = sortBranchesByPriority(formatted);
        setBranches(sortedBranches);
        
        // Tự động nhận diện chi nhánh chuẩn xác theo nhân sự đang đăng nhập
        setSelectedBranch(prev => {
          // 1. Ưu tiên chi nhánh của nhân viên hiện tại đang đăng nhập
          if (currentUser?.branchId) {
            const userBranch = sortedBranches.find(b => b.id === currentUser.branchId);
            if (userBranch) return userBranch;
          }
          // 2. Giữ nguyên chi nhánh đang chọn nếu nó vẫn tồn tại
          const stillValid = sortedBranches.find(b => b.id === prev.id);
          if (stillValid) return stillValid;
          // 3. Mặc định ưu tiên Văn Phòng (đầu danh sách)
          const vp = sortedBranches.find(b => b.code === 'PK88_VANPHONG');
          if (vp) return vp;
          return sortedBranches[0];
        });
      }
    } catch (err) {
      console.error('Fetch branches exception:', err);
    }
  };

  // Tự động đồng bộ chi nhánh hiển thị theo chi nhánh của nhân sự khi đổi tài khoản
  useEffect(() => {
    if (currentUser?.branchId && branches.length > 0) {
      const staffBranch = branches.find(b => b.id === currentUser.branchId);
      if (staffBranch && staffBranch.id !== selectedBranch.id) {
        setSelectedBranch(staffBranch);
      }
    }
  }, [currentUser?.id, currentUser?.branchId, branches]);

  const handleAddBranch = async (newBranch: Branch) => {
    // Optimistic update
    setBranches(sortBranchesByPriority([...branches, newBranch]));
    
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
      // 1. Tải metadata mở rộng (ngày sinh, email, mật khẩu) từ Cloud về trước
      const meta = await fetchStaffAuthMetadataFromCloud();
      const cloudProfiles = meta.profiles || {};

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
          const override = cloudProfiles[item.phone] || cloudProfiles[item.id] || localOverrides[item.id] || localOverrides[item.phone];

          let fName = item.full_name || override?.fullName || match?.fullName;
          let role: UserRole = (item.role || override?.role || match?.role || 'sales') as UserRole;

          return {
            id: item.id,
            branchId: item.branch_id || override?.branchId || match?.branchId || '2b150536-0b47-4e32-912b-b5ede701bfa6',
            fullName: fName,
            phone: item.phone || override?.phone || match?.phone,
            role,
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
    // Nếu đang chỉnh sửa chính user hiện tại thì cập nhật luôn currentUser
    setCurrentUser(prev => {
      if (prev && (prev.id === updatedStaff.id || prev.phone === updatedStaff.phone)) {
        const merged = { ...prev, ...updatedStaff };
        localStorage.setItem('pk88_current_user', JSON.stringify(merged));
        return merged;
      }
      return prev;
    });
  };

  useEffect(() => {
    fetchBranches();
    fetchStaff();
    fetchRealAttendance();
    fetchTickets();
    fetchMarketingPosts();
    fetchLeaveRequests();
    fetchShiftAssignmentsFromCloud();

    // 1. KẾT NỐI REALTIME SUPABASE CHO TOÀN BỘ CHUỖI CỬA HÀNG PHỤ KIỆN 88
    const channel = supabase
      .channel('realtime_pk88_operations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        (payload) => {
          console.log('⚡ Realtime attendance update received from Supabase:', payload.eventType);
          fetchRealAttendance();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leave_requests' },
        (payload) => {
          console.log('⚡ Realtime leave_requests update received from Supabase:', payload.eventType);
          fetchLeaveRequests();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'job_applications' },
        (payload) => {
          // Bảng job_applications lưu trữ lịch chia ca pk88_shift_assignments
          if ((payload.new as any)?.id === '00000000-0000-0000-0000-000000000002') {
            console.log('⚡ Realtime shifts update received from Supabase');
            fetchShiftAssignmentsFromCloud();
            window.dispatchEvent(new CustomEvent('pk88_shifts_updated'));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff' },
        () => {
          fetchStaff();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'marketing_posts' },
        () => {
          console.log('⚡ Realtime marketing_posts update received from Supabase');
          fetchMarketingPosts();
        }
      )
      .subscribe();

    // 2. NHỊP TIM DỰ PHÒNG (HEARTBEAT): Tự động đồng bộ mỗi 20 giây đảm bảo không bao giờ trễ số liệu dù mạng 4G/Wifi gián đoạn
    const heartbeat = setInterval(() => {
      fetchRealAttendance();
    }, 20000);

    // 3. TỰ ĐỘNG ĐỒNG BỘ TỨC THÌ KHI USER CHUYỂN LẠI TAB TRÌNH DUYỆT
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchRealAttendance();
        fetchLeaveRequests();
        fetchShiftAssignmentsFromCloud();
        fetchMarketingPosts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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

  const handleRoleChange = (newRole: UserRole) => {
    if (newRole === 'customer') {
      setIsCustomerMode(true);
      syncTabToUrl('tickets', true, false);
      return;
    }

    setIsCustomerMode(false);
    
    const vpBranchId = '11111111-2222-3333-4444-555555555555';
    const defaultStoreBranchId = '2b150536-0b47-4e32-912b-b5ede701bfa6';

    // Tìm nhân sự đại diện trong danh sách
    let targetStaff: Staff | undefined;
    if (newRole === 'admin') {
      targetStaff = staffList.find(s => s.phone === '0888003205' || s.code === 'PK88-ADMIN' || s.fullName?.includes('Trần Hoàng Sang'));
      if (!targetStaff) {
        targetStaff = {
          id: 'e30be7a4-e5f6-47c0-8f27-d3f25d3adff8',
          fullName: 'Trần Hoàng Sang',
          phone: '0888003205',
          role: 'admin',
          branchId: vpBranchId,
          isActive: true
        };
      } else {
        targetStaff = { ...targetStaff, role: 'admin', fullName: 'Trần Hoàng Sang', branchId: vpBranchId };
      }
    } else if (newRole === 'founder') {
      targetStaff = staffList.find(s => s.phone === '0777888688' || s.role === 'founder' || s.fullName?.includes('Ngô Hồng Thao'));
      if (!targetStaff) {
        targetStaff = {
          id: '7526b7c5-12ac-442b-90a6-b68b9d624364',
          fullName: 'Ngô Hồng Thao (Founder)',
          phone: '0777888688',
          role: 'founder',
          branchId: vpBranchId,
          isActive: true
        };
      } else {
        targetStaff = { ...targetStaff, branchId: vpBranchId };
      }
    } else if (newRole === 'hr') {
      targetStaff = staffList.find(s => s.phone === '0394336726' || s.role === 'hr' || s.fullName?.includes('Phan Hoàng Khánh'));
      if (!targetStaff) {
        targetStaff = {
          id: '2ca747c8-2e62-4252-8525-1c8dcda93678',
          fullName: 'Phan Hoàng Khánh',
          phone: '0394336726',
          role: 'hr',
          branchId: vpBranchId,
          isActive: true
        };
      } else {
        targetStaff = { ...targetStaff, branchId: vpBranchId };
      }
    } else {
      targetStaff = staffList.find(s => s.role === newRole && s.isActive) || staffList.find(s => s.role === newRole);
      if (!targetStaff) {
        targetStaff = {
          id: `sample-${newRole}`,
          fullName: `Nhân Viên (${newRole.toUpperCase()})`,
          phone: '0901234567',
          role: newRole,
          branchId: defaultStoreBranchId,
          isActive: true
        };
      }
    }

    setCurrentUser(targetStaff);
    localStorage.setItem('pk88_current_user', JSON.stringify(targetStaff));

    // Tự động nhận diện và chuyển chi nhánh dropdown theo đúng chi nhánh của nhân sự
    const matchedBranch = branches.find(b => b.id === targetStaff!.branchId);
    if (matchedBranch) {
      setSelectedBranch(matchedBranch);
    }

    // Tự động điều hướng active tab về tab mặc định hợp lệ của role đó
    const defTab = getDefaultTabForRole(newRole);
    setActiveTab(defTab);
    syncTabToUrl(defTab, false, false);
  };

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
      finalTab = getDefaultTabForRole(staff.role);
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

  const handleMarketingSubmit = async (
    platform: MarketingPlatform, 
    url: string, 
    status: MarketingPostStatus = 'approved'
  ) => {
    if (!currentUser) return;
    
    const newPost: any = {
      branch_id: selectedBranch.id,
      platform,
      post_url: url,
      author_name: currentUser.fullName,
      status
    };

    try {
      let insertResult = await supabase.from('marketing_posts').insert([newPost]).select();
      
      // Khả năng tương thích ngược: Nếu bảng Supabase chưa chạy ALTER TABLE thêm cột status
      if (insertResult.error && insertResult.error.message.includes('column') && insertResult.error.message.includes('status')) {
        const { status: _, ...compatPost } = newPost;
        insertResult = await supabase.from('marketing_posts').insert([compatPost]).select();
      }

      const { data, error } = insertResult;
      
      if (!error && data && data.length > 0) {
        setMarketingPosts(prev => {
          const inserted = { ...newPost, ...(data[0] as MarketingPost) };
          const updated = [inserted, ...prev];
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

  // Cập nhật trạng thái duyệt bài (pending_review → approved / rejected) cho Bàn Biên Tập
  const handleUpdatePostStatus = async (
    postId: string,
    status: MarketingPostStatus,
    reviewedBy: string,
    feedback?: string
  ) => {
    try {
      const updateData: any = {
        status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString()
      };
      if (feedback) updateData.reviewer_feedback = feedback;

      // 1. Optimistic update State + localStorage
      setMarketingPosts(prev => {
        const updated = prev.map(p => p.id === postId ? { ...p, ...updateData } : p);
        localStorage.setItem('pk88_marketing_posts', JSON.stringify(updated));
        return updated;
      });

      // 2. Đồng bộ lên Supabase (an toàn: chỉ cập nhật nếu cột status tồn tại)
      const { error } = await supabase
        .from('marketing_posts')
        .update(updateData)
        .eq('id', postId);

      if (error) {
        console.warn('Supabase update post status notice:', error.message);
      }
    } catch (err) {
      console.error('Update post status exception:', err);
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

  const handleUpdateLeaveStatus = async (reqId: string, status: LeaveStatus, handlerName: string, rejectionReason?: string) => {
    // 1. Optimistic update and persist local cache
    setLeaveRequests(prev => {
      const updated = prev.map(r => {
        if (r.id === reqId) {
          return {
            ...r,
            status,
            approvedBy: status === 'APPROVED' ? handlerName : r.approvedBy,
            rejectedBy: status === 'REJECTED' ? handlerName : r.rejectedBy,
            rejectionReason: status === 'REJECTED' ? (rejectionReason || r.rejectionReason) : r.rejectionReason
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
        const finalRejectedBy = status === 'REJECTED' 
          ? (rejectionReason ? `${handlerName} - Lý do: ${rejectionReason}` : handlerName)
          : (status === 'APPROVED' ? null : target.rejectedBy || null);

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
          rejected_by: finalRejectedBy,
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

  interface NavTabItem {
    id: AppTab;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    activeColor: string;
  }

  const getNavTabsForRole = (role?: UserRole): NavTabItem[] => {
    if (!role) {
      return [
        {
          id: 'attendance',
          label: '📱 Ca & Chấm Công',
          shortLabel: 'Chấm Công',
          icon: <Clock className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-amber-500 text-slate-950 shadow-amber-500/20'
        }
      ];
    }

    // 1. Founder: Miễn chấm công, toàn quyền giám sát các Hub điều hành
    if (role === 'founder') {
      return [
        {
          id: 'dashboard',
          label: '📊 Tổng Quan (Executive)',
          shortLabel: 'Tổng Quan',
          icon: <LayoutDashboard className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-amber-500 text-slate-950 shadow-amber-500/20'
        },
        {
          id: 'customer_crm',
          label: '👥 Khách Hàng 360',
          shortLabel: 'Khách Hàng',
          icon: <HeartHandshake className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
        },
        {
          id: 'hr_hub',
          label: '👥 Vận Hành Nhân Lực (HR Hub)',
          shortLabel: 'Nhân Lực',
          icon: <Users className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-rose-500 text-white shadow-rose-500/20'
        },
        {
          id: 'marketing',
          label: '📢 Marketing & CSKH',
          shortLabel: 'Marketing',
          icon: <Megaphone className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-blue-500 text-white shadow-blue-500/20'
        },
        {
          id: 'training',
          label: '🎓 Học Viện 88',
          shortLabel: 'Học Viện',
          icon: <GraduationCap className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-cyan-500 text-slate-950 shadow-cyan-500/20'
        },
        {
          id: 'system',
          label: '⚙️ Cài Đặt Hệ Thống',
          shortLabel: 'Hệ Thống',
          icon: <Settings className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-cyan-500 text-slate-950 shadow-cyan-500/20'
        }
      ];
    }

    // 2. Ban Quản Trị / Điều Hành Cấp Cao (Admin, HR, Sales Head): Có đầy đủ Hub và Tab Chấm Công GPS
    if (role === 'admin' || role === 'hr' || role === 'sales_head') {
      return [
        {
          id: 'attendance',
          label: '📱 Ca & Chấm Công',
          shortLabel: 'Chấm Công',
          icon: <Clock className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
        },
        {
          id: 'dashboard',
          label: '📊 Tổng Quan (Executive)',
          shortLabel: 'Tổng Quan',
          icon: <LayoutDashboard className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-amber-500 text-slate-950 shadow-amber-500/20'
        },
        {
          id: 'customer_crm',
          label: '👥 Khách Hàng 360',
          shortLabel: 'Khách Hàng',
          icon: <HeartHandshake className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-teal-500 text-slate-950 shadow-teal-500/20'
        },
        {
          id: 'hr_hub',
          label: '👥 Vận Hành Nhân Lực (HR Hub)',
          shortLabel: 'Nhân Lực',
          icon: <Users className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-rose-500 text-white shadow-rose-500/20'
        },
        {
          id: 'marketing',
          label: '📢 Marketing & CSKH',
          shortLabel: 'Marketing',
          icon: <Megaphone className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-blue-500 text-white shadow-blue-500/20'
        },
        {
          id: 'training',
          label: '🎓 Học Viện 88',
          shortLabel: 'Học Viện',
          icon: <GraduationCap className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
        },
        {
          id: 'system',
          label: '⚙️ Cài Đặt Hệ Thống',
          shortLabel: 'Hệ Thống',
          icon: <Settings className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-cyan-500 text-slate-950 shadow-cyan-500/20'
        }
      ];
    }

    // 3. Khối Kế Toán & Kế Toán Kho: Chấm công + Báo cáo Tổng Quan + Bảng Lương HR
    if (role === 'accountant' || role === 'warehouse_accountant') {
      return [
        {
          id: 'attendance',
          label: '📱 Ca & Chấm Công',
          shortLabel: 'Chấm Công',
          icon: <Clock className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
        },
        {
          id: 'dashboard',
          label: '📊 Tổng Quan Báo Cáo',
          shortLabel: 'Tổng Quan',
          icon: <LayoutDashboard className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-amber-500 text-slate-950 shadow-amber-500/20'
        },
        {
          id: 'hr_hub',
          label: '👥 Bảng Lương & Nhân Lực',
          shortLabel: 'Lương & HR',
          icon: <Users className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-rose-500 text-white shadow-rose-500/20'
        }
      ];
    }

    // 4. Khối Marketing & Media: Chấm công + Chiến dịch Marketing + Học viện đào tạo
    if (role === 'marketing' || role === 'media') {
      return [
        {
          id: 'attendance',
          label: '📱 Ca & Chấm Công',
          shortLabel: 'Chấm Công',
          icon: <Clock className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
        },
        {
          id: 'marketing',
          label: '📢 Marketing & CSKH',
          shortLabel: 'Marketing',
          icon: <Megaphone className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-blue-500 text-white shadow-blue-500/20'
        },
        {
          id: 'customer_crm',
          label: '👥 Khách Hàng 360',
          shortLabel: 'Khách Hàng',
          icon: <HeartHandshake className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-teal-500 text-slate-950 shadow-teal-500/20'
        },
        {
          id: 'training',
          label: '🎓 Học Viện 88',
          shortLabel: 'Học Viện',
          icon: <GraduationCap className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-cyan-500 text-slate-950 shadow-cyan-500/20'
        }
      ];
    }

    // 5. Cửa Hàng Trưởng (Manager): Chấm công + Quầy POS/Tiếp nhận + Học viện + Quản lý cửa hàng
    if (role === 'manager') {
      return [
        {
          id: 'attendance',
          label: '📱 Ca & Chấm Công',
          shortLabel: 'Chấm Công',
          icon: <Clock className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-amber-500 text-slate-950 shadow-amber-500/20'
        },
        {
          id: 'counter',
          label: '🛒 Quầy Phục Vụ',
          shortLabel: 'Quầy POS',
          icon: <ShoppingBag className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
        },
        {
          id: 'customer_crm',
          label: '👥 Khách Hàng 360',
          shortLabel: 'Khách Hàng',
          icon: <HeartHandshake className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-teal-500 text-slate-950 shadow-teal-500/20'
        },
        {
          id: 'training',
          label: '🎓 Học Viện 88',
          shortLabel: 'Học Viện',
          icon: <GraduationCap className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-cyan-500 text-slate-950 shadow-cyan-500/20'
        },
        {
          id: 'shop_management',
          label: '🏪 Quản Lý Cửa Hàng',
          shortLabel: 'QL Shop',
          icon: <Building2 className="w-4 h-4 flex-shrink-0" />,
          activeColor: 'bg-purple-500 text-white shadow-purple-500/20'
        }
      ];
    }

    // 6. Nhân viên tại quầy (Sales, Kỹ thuật viên)
    return [
      {
        id: 'attendance',
        label: '📱 Ca & Chấm Công',
        shortLabel: 'Chấm Công',
        icon: <Clock className="w-4 h-4 flex-shrink-0" />,
        activeColor: 'bg-amber-500 text-slate-950 shadow-amber-500/20'
      },
      {
        id: 'counter',
        label: '🛒 Quầy Phục Vụ',
        shortLabel: 'Quầy POS',
        icon: <ShoppingBag className="w-4 h-4 flex-shrink-0" />,
        activeColor: 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
      },
      {
        id: 'customer_crm',
        label: '👥 Khách Hàng 360',
        shortLabel: 'Khách Hàng',
        icon: <HeartHandshake className="w-4 h-4 flex-shrink-0" />,
        activeColor: 'bg-teal-500 text-slate-950 shadow-teal-500/20'
      },
      {
        id: 'training',
        label: '🎓 Học Viện 88',
        shortLabel: 'Học Viện',
        icon: <GraduationCap className="w-4 h-4 flex-shrink-0" />,
        activeColor: 'bg-cyan-500 text-slate-950 shadow-cyan-500/20'
      }
    ];
  };

  // Nếu đang ở trang Chatbot tư vấn khách hàng công khai (/tu-van hoặc ?tab=tu-van)
  if (activeTab === 'customer_chat' || isCustomerChatModeFromUrl()) {
    return (
      <PublicCustomerChatView
        branches={branches}
        onBackToApp={() => {
          handleNavigateTab(currentUser ? (currentUser.role === 'hr' || currentUser.role === 'admin' ? 'admin' : 'attendance') : 'attendance');
        }}
      />
    );
  }

  // Nếu đang ở trang tuyển dụng công khai (/tuyen-dung hoặc ?tab=tuyen-dung)
  if (activeTab === 'recruitment') {
    return (
      <PublicRecruitmentView
        branches={branches}
        currentUser={currentUser}
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
          onCustomerChat={() => {
            handleNavigateTab('customer_chat');
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

      {/* Customer Leads CRM Modal */}
      <CustomerLeadsCRMModal
        isOpen={showLeadsModal || activeTab === 'leads'}
        onClose={() => {
          setShowLeadsModal(false);
          if (activeTab === 'leads') {
            handleNavigateTab(getDefaultTabForRole(currentUser?.role));
          }
        }}
        branches={branches}
        currentUser={currentUser}
        defaultBranchId={selectedBranch?.id}
      />

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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Hàng 1 trên Mobile: Các công cụ nhanh (GPS, Refresh, Chi nhánh) */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap sm:flex-nowrap">
              {/* Quick GPS Check-In Button for Staff (Except Founder) */}
              {currentUser && currentUser.role !== 'founder' && !isCustomerMode && (
                <button
                  onClick={() => handleNavigateTab('attendance')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                    activeTab === 'attendance'
                      ? 'bg-emerald-500 text-slate-950 font-extrabold ring-1 ring-emerald-400'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                  title="Bấm để Chấm Công Định Vị GPS"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="inline">Chấm Công</span>
                </button>
              )}

              {/* Nút Khách Hàng Chờ Chốt Đơn (Telesales CRM) */}
              {currentUser && !isCustomerMode && (
                <button
                  onClick={() => setShowLeadsModal(true)}
                  className="px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-rose-500/20 to-amber-500/20 hover:from-rose-500/30 hover:to-amber-500/30 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-amber-500/30 shadow-sm transition-all cursor-pointer"
                  title="Xem danh sách khách hàng để lại SĐT từ Chatbot Bé 8"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="hidden sm:inline">Khách Chốt Đơn</span>
                  <span className="sm:hidden">Khách</span>
                </button>
              )}

              {/* Quick Post Button for Staff */}
              {currentUser && !isCustomerMode && (
                <button
                  onClick={handleOpenMarketingModal}
                  className="hidden md:flex px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs items-center gap-1.5 shadow-md shadow-blue-500/20 transition-colors animate-pulse hover:animate-none"
                >
                  <Send className="w-3.5 h-3.5" />
                  + Nộp Link (5s)
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
                  className="p-1.5 sm:p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                  title="Tải lại dữ liệu từ Supabase Cloud"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loadingDb ? 'animate-spin' : ''}`} />
                </button>
              )}

              {/* Branch Selector: Chỉ Founder, HR, Admin mới được chuyển chi nhánh */}
              {!isCustomerMode && currentUser && (() => {
                const canSwitchBranch = currentUser.role === 'founder' || currentUser.role === 'admin' || currentUser.role === 'hr';

                if (canSwitchBranch) {
                  return (
                    <div className="flex-1 sm:flex-initial flex items-center gap-1.5 bg-slate-950 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-800 min-w-0">
                      <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <select
                        value={selectedBranch.id}
                        onChange={(e) => {
                          const b = activeBranches.find((x) => x.id === e.target.value);
                          if (b) setSelectedBranch(b);
                        }}
                        className="bg-transparent text-xs font-bold text-slate-200 pr-1 py-0.5 focus:outline-none cursor-pointer truncate w-full"
                      >
                        {activeBranches.map((b) => (
                          <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                return (
                  <div 
                    className="flex-1 sm:flex-initial flex items-center gap-1.5 bg-slate-950 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-800 shadow-sm min-w-0"
                    title={`Chi nhánh cố định: ${selectedBranch.name}`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {selectedBranch.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono select-none shrink-0" title="Chi nhánh cố định theo tài khoản">🔒</span>
                  </div>
                );
              })()}
            </div>

            {/* Hàng 2 trên Mobile (cùng dòng trên PC): Avatar cá nhân, Đăng xuất, Khách QR, Tuyển dụng */}
            <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto pt-1 sm:pt-0 border-t border-slate-800/60 sm:border-t-0">
              {/* Authenticated User Status */}
              {currentUser && !isCustomerMode ? (
                <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(true)}
                    className="flex-1 sm:flex-initial bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 px-2 sm:px-3 py-1.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all text-left group min-w-0 shadow-sm"
                    title="Bấm để xem hồ sơ cá nhân và đổi mật khẩu"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center border border-amber-400/50 group-hover:scale-105 transition-transform shrink-0 shadow-sm">
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-xs font-extrabold text-slate-200 group-hover:text-amber-400 transition-colors flex items-center gap-1">
                        <span className="truncate">{currentUser.fullName}</span>
                        <KeyRound className="w-3 h-3 text-amber-400 shrink-0" />
                      </div>
                      <div className="text-[9.5px] text-amber-400/90 font-medium truncate">
                        Đổi MK / Hồ sơ
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0"
                    title="Đăng xuất khỏi tài khoản"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-[10px] font-bold hidden xs:inline">Thoát</span>
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

              {/* 3 Cổng Tiện Ích & Kết Nối Công Khai (Hiển thị cùng dòng trên Desktop) */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                {/* Toggle Customer Mode View */}
                <button
                  onClick={handleToggleCustomerMode}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isCustomerMode
                      ? 'bg-sky-500 text-slate-950 border-sky-400 font-extrabold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                  title="Chế độ khách quét QR tra cứu bảo hành"
                >
                  <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                  <span className="text-[11px] font-semibold">{isCustomerMode ? 'Thoát' : 'Khách QR'}</span>
                </button>

                {/* Nút xem trang Tuyển Dụng Công Khai */}
                <button
                  onClick={() => handleNavigateTab('recruitment')}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  title="Cổng ứng tuyển việc làm tại chuỗi Phụ Kiện 88"
                >
                  <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                  <span className="text-[11px] font-semibold">Tuyển Dụng</span>
                </button>

                {/* Nút xem trang Chatbot Bé 8 Tư Vấn Công Khai */}
                <button
                  onClick={() => handleNavigateTab('customer_chat')}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-black border border-cyan-500/40 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 hover:from-cyan-500/30 hover:to-emerald-500/30 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                  title="Cổng Chatbot Bé 8 tư vấn bán hàng & tặng voucher công khai"
                >
                  <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                  <span className="text-[11px] font-bold">Chatbot Bé 8</span>
                </button>
              </div>
            </div>

            {/* Hàng 3 DÀNH RIÊNG CHO MOBILE: 3 nút cổng tiện ích dàn đều 3 cột rõ ràng, không bao giờ bị tràn/cắt */}
            <div className="grid grid-cols-3 gap-1.5 w-full sm:hidden pt-1.5 border-t border-slate-800/60">
              {/* Khách QR */}
              <button
                onClick={handleToggleCustomerMode}
                className={`py-1.5 px-1.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm ${
                  isCustomerMode
                    ? 'bg-sky-500 text-slate-950 border-sky-400 font-extrabold'
                    : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:text-white'
                }`}
                title="Chế độ khách quét QR tra cứu bảo hành"
              >
                <QrCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-[11px] font-semibold truncate">{isCustomerMode ? 'Thoát' : 'Khách QR'}</span>
              </button>

              {/* Tuyển Dụng */}
              <button
                onClick={() => handleNavigateTab('recruitment')}
                className="py-1.5 px-1.5 rounded-xl text-xs font-bold border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                title="Cổng ứng tuyển việc làm tại chuỗi Phụ Kiện 88"
              >
                <Briefcase className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] font-semibold truncate">Tuyển Dụng</span>
              </button>

              {/* Chatbot Bé 8 */}
              <button
                onClick={() => handleNavigateTab('customer_chat')}
                className="py-1.5 px-1.5 rounded-xl text-xs font-black border border-cyan-500/40 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 hover:from-cyan-500/30 hover:to-emerald-500/30 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm shadow-cyan-500/10"
                title="Cổng Chatbot Bé 8 tư vấn bán hàng & tặng voucher công khai"
              >
                <Bot className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-[11px] font-bold truncate">Chatbot Bé 8</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24 md:pb-6 space-y-6">
        {/* Navigation Tabs for Logged-In Users (Desktop: Single Row Tinh Gọn) */}
        {!isCustomerMode && currentUser && (() => {
          const visibleNavTabs = getNavTabsForRole(currentUser.role);

          return (
            <div className="hidden md:flex items-center justify-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-lg backdrop-blur-md max-w-5xl mx-auto">
              {visibleNavTabs.map(tab => {
                const isTabActive = activeTab === tab.id || 
                  (tab.id === 'counter' && (activeTab === 'pos' || activeTab === 'tickets')) ||
                  (tab.id === 'hr_hub' && (activeTab === 'shifts' || (activeTab === 'admin' && currentUser?.role === 'hr'))) ||
                  (tab.id === 'system' && activeTab === 'admin' && currentUser?.role !== 'hr') ||
                  (tab.id === 'shop_management' && activeTab === 'staff_directory');

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleNavigateTab(tab.id)}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isTabActive
                        ? `${tab.activeColor} shadow-md font-extrabold ring-1 ring-white/10`
                        : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/60'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })()}

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
            {/* 1. Tổng Quan Executive Dashboard */}
            {activeTab === 'dashboard' && (currentUser?.role === 'founder' || currentUser?.role === 'admin' || currentUser?.role === 'hr' || currentUser?.role === 'accountant' || currentUser?.role === 'warehouse_accountant' || currentUser?.role === 'sales_head') && (
              <ExecutiveDashboard 
                branches={branches} 
                staffList={staffList}
                attendanceLogs={attendanceHistory} 
                marketingPosts={marketingPosts}
                leaveRequests={leaveRequests}
                tickets={tickets}
                currentUser={currentUser}
                onOpenAIHRModal={handleOpenAIHRModal}
                onNavigateTab={(tab) => handleNavigateTab(tab)}
                onRefreshAttendance={fetchRealAttendance}
                onRefreshMarketing={fetchMarketingPosts}
              />
            )}

            {/* 2. Vận Hành Nhân Lực (HR Hub) */}
            {(activeTab === 'hr_hub' || activeTab === 'shifts' || (activeTab === 'admin' && currentUser?.role === 'hr')) && currentUser && (
              <AdminPanel 
                mode="hr"
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

            {/* 3. Cài Đặt Hệ Thống (System Settings) */}
            {(activeTab === 'system' || (activeTab === 'admin' && currentUser?.role !== 'hr')) && currentUser && (
              <AdminPanel 
                mode="system"
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

            {/* 4. Marketing Hub */}
            {activeTab === 'marketing' && currentUser && (
              <>
                <MarketingDashboard 
                  branches={activeBranches} 
                  posts={marketingPosts} 
                  currentBranch={selectedBranch}
                  currentUser={currentUser}
                  onOpenSubmitModal={handleOpenMarketingModal}
                  onUpdatePost={handleUpdateMarketingPost}
                  onDeletePost={handleDeleteMarketingPost}
                  onOpenStudio={() => setShowMarketingStudio(true)}
                />

                {/* PK88 Marketing Studio Modal - Hoàn toàn độc lập, không ảnh hưởng gì đến code cũ */}
                <PK88MarketingStudio
                  isOpen={showMarketingStudio}
                  onClose={() => setShowMarketingStudio(false)}
                  currentBranch={selectedBranch}
                  currentUser={currentUser}
                  branches={activeBranches}
                  posts={marketingPosts}
                  onUpdatePostStatus={handleUpdatePostStatus}
                  onSubmitPost={handleMarketingSubmit}
                />
              </>
            )}

            {/* 4.5. Khách Hàng 360 & CSKH (Customer CRM) */}
            {activeTab === 'customer_crm' && currentUser && (
              <CustomerCRMView
                branches={branches}
                currentUser={currentUser}
                onOpenLeadsModal={() => setShowLeadsModal(true)}
              />
            )}

            {/* 5. Quản Lý Cửa Hàng (Manager) */}
            {(activeTab === 'shop_management' || activeTab === 'staff_directory') && currentUser && (
              <ShopManagementView
                currentBranch={selectedBranch}
                branches={branches}
                staffList={staffList}
                attendanceLogs={attendanceHistory}
                leaveRequests={leaveRequests}
                currentUser={currentUser}
                onRefreshStaff={fetchStaff}
                onRefreshAttendance={fetchRealAttendance}
                onUpdateStaff={handleUpdateStaff}
                onApproveDispute={handleApproveDispute}
                onRejectDispute={handleRejectDispute}
              />
            )}

            {/* 6. Ca & Chấm Công GPS / Vệ Sinh Cửa Hàng */}
            {activeTab === 'attendance' && currentUser && (
              <div className="space-y-4">
                {/* Segmented Sub-Tab Switcher */}
                <div className="flex justify-center">
                  <div className="inline-flex p-1 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => setAttendanceSubTab('gps')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        attendanceSubTab === 'gps'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      <span>📍 Chấm Công Định Vị GPS</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setAttendanceSubTab('cleanliness')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        attendanceSubTab === 'cleanliness'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>✨ Báo Cáo Vệ Sinh Shop</span>
                    </button>
                  </div>
                </div>

                {attendanceSubTab === 'gps' ? (
                  <div className="max-w-xl mx-auto">
                    <AttendanceCard
                      currentBranch={selectedBranch}
                      currentStaff={currentUser}
                      onCheckInSuccess={handleCheckInSuccess}
                      onDisputeSubmit={handleAttendanceDisputeSubmit}
                      attendanceHistory={attendanceHistory}
                      leaveRequests={leaveRequests}
                      onOpenMyShiftsModal={() => setShowPersonalShiftsModal(true)}
                      onOpenLeaveModal={handleOpenAIHRModal}
                      onOpenProfileModal={() => setShowProfileModal(true)}
                      onOpenCleanlinessTab={() => setAttendanceSubTab('cleanliness')}
                    />
                  </div>
                ) : (
                  <StoreCleanlinessStaffView
                    currentBranch={selectedBranch}
                    currentStaff={currentUser}
                    onNavigateToAttendance={() => setAttendanceSubTab('gps')}
                  />
                )}
              </div>
            )}

            {/* 7. Quầy Phục Vụ (Gom POS & Sửa Chữa) */}
            {(activeTab === 'counter' || activeTab === 'pos' || activeTab === 'tickets') && currentUser && (
              <CounterServiceView
                currentUser={currentUser}
                currentBranch={selectedBranch}
                branches={branches}
                tickets={tickets}
                onCreateTicket={handleCreateTicket}
                onUpdateTicket={handleUpdateTicket}
                initialSubTab={activeTab === 'tickets' ? 'tickets' : 'pos'}
              />
            )}

            {/* 8. Học Viện 88 (LMS) */}
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

      {/* Mobile Fixed Bottom Navigation Bar */}
      {!isCustomerMode && currentUser && (() => {
        const visibleNavTabs = getNavTabsForRole(currentUser.role);

        return (
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md pb-safe shadow-2xl">
            <div className={`grid ${visibleNavTabs.length === 3 ? 'grid-cols-3' : visibleNavTabs.length === 5 ? 'grid-cols-5' : visibleNavTabs.length === 6 ? 'grid-cols-6' : visibleNavTabs.length >= 7 ? 'grid-cols-7' : 'grid-cols-4'} py-1.5 px-1 gap-0.5`}>
              {visibleNavTabs.map(tab => {
                const isTabActive = activeTab === tab.id || 
                  (tab.id === 'counter' && (activeTab === 'pos' || activeTab === 'tickets')) ||
                  (tab.id === 'hr_hub' && (activeTab === 'shifts' || (activeTab === 'admin' && currentUser?.role === 'hr'))) ||
                  (tab.id === 'system' && activeTab === 'admin' && currentUser?.role !== 'hr') ||
                  (tab.id === 'shop_management' && activeTab === 'staff_directory');

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleNavigateTab(tab.id)}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                      isTabActive
                        ? 'text-amber-400 font-extrabold bg-amber-500/10'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className={`p-1 rounded-lg ${isTabActive ? 'bg-amber-500 text-slate-950 shadow-sm' : ''}`}>
                      {tab.icon}
                    </div>
                    <span className="truncate mt-0.5">{tab.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Personal Staff Profile & Password Change Modal */}
      {showProfileModal && currentUser && (
        <StaffDetailModal
          staff={currentUser}
          currentUser={currentUser}
          branch={branches.find(b => b.id === currentUser.branchId) || selectedBranch}
          branches={branches}
          attendanceLogs={attendanceHistory}
          canEdit={currentUser.role === 'admin' || currentUser.role === 'founder'}
          onClose={() => setShowProfileModal(false)}
          onUpdateStaff={(updatedStaff) => {
            setCurrentUser(updatedStaff);
            localStorage.setItem('pk88_current_user', JSON.stringify(updatedStaff));
            setStaffList(prev => prev.map(s => s.id === updatedStaff.id || s.phone === updatedStaff.phone ? updatedStaff : s));
          }}
        />
      )}

      {/* Personal 15-Day Shifts Schedule Modal */}
      {showPersonalShiftsModal && currentUser && (
        <PersonalShiftsModal
          isOpen={showPersonalShiftsModal}
          onClose={() => setShowPersonalShiftsModal(false)}
          currentUser={currentUser}
          branches={branches}
        />
      )}

      {/* Floating AI Chat Assistant */}
      <AIChatDrawer currentUser={currentUser} isCustomerMode={isCustomerMode} />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 px-4 text-center text-[11px] text-slate-500">
        PK88 Automation Portal © 2026 - Chuỗi Phụ Kiện 88 (Bến Tre • Mỹ Tho • Cần Thơ • Vĩnh Long • Trà Vinh)
      </footer>
    </div>
  );
}
