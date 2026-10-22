import { UserRole } from '../types';

export type AppTab = 
  // 1. Nhóm quầy & Cốt lõi
  | 'attendance'       // 📱 Ca & Chấm Công (cham-cong)
  | 'counter'          // 🛒 Quầy Phục Vụ (quay-phuc-vu, gom POS & Sửa chữa)
  | 'training'         // 🎓 Học Viện 88 (dao-tao)
  | 'culture'          // ❤️ Văn Hóa 88 (van-hoa, van-hoa-88, culture)
  // 2. Nhóm Quản lý Shop
  | 'shop_management'  // 🏪 Quản Lý Cửa Hàng (quan-ly-shop)
  // 3. Nhóm Ban Điều Hành & Quản Trị Cấp Cao
  | 'dashboard'        // 📊 Tổng Quan Executive Hub (tong-quan)
  | 'hr_hub'           // 👥 Vận Hành Nhân Lực HR Hub (nhan-su)
  | 'marketing'        // 📢 Marketing & CSKH (marketing)
  | 'customer_crm'     // 👥 Hồ Sơ Khách Hàng & CSKH 360 (khach-hang, crm)
  | 'system'           // ⚙️ Cài Đặt Hệ Thống (he-thong)
  // 4. Công khai
  | 'recruitment'      // Tuyển dụng công khai (tuyen-dung)
  | 'customer_chat'    // 💬 Chatbot tư vấn khách hàng công khai (tu-van, chat)
  | 'leads'            // 📞 Quản lý khách hàng tiềm năng & Chốt đơn (chot-don, leads)
  // Backward compatibility alias tabs
  | 'admin'
  | 'shifts'
  | 'staff_directory'
  | 'tickets'
  | 'pos';

// Bảng ánh xạ slug URL tiếng Việt và tiếng Anh sang AppTab nội bộ
const SLUG_TO_TAB: Record<string, AppTab> = {
  // 1. Ca & Chấm công
  'cham-cong': 'attendance',
  'chamcong': 'attendance',
  'attendance': 'attendance',

  // 2. Quầy phục vụ (Gom POS & Sửa chữa)
  'quay-phuc-vu': 'counter',
  'quayphucvu': 'counter',
  'counter': 'counter',
  'pos': 'counter',
  'ban-hang': 'counter',
  'banhang': 'counter',
  'sua-chua': 'counter',
  'suachua': 'counter',
  'tiep-nhan': 'counter',
  'tickets': 'counter',

  // 3. Học viện 88 & Văn hóa 88
  'dao-tao': 'training',
  'daotao': 'training',
  'lms': 'training',
  'training': 'training',
  'van-hoa': 'culture',
  'van-hoa-88': 'culture',
  'vanhoa': 'culture',
  'culture': 'culture',

  // 4. Quản lý cửa hàng (Manager)
  'quan-ly-shop': 'shop_management',
  'quanlyshop': 'shop_management',
  'shop': 'shop_management',
  'cua-hang': 'shop_management',
  'cuahang': 'shop_management',
  'nhan-vien': 'shop_management',
  'nhanvien': 'shop_management',
  'dong-nghiep': 'shop_management',
  'staff_directory': 'shop_management',
  'directory': 'shop_management',

  // 5. Tổng quan Executive Hub
  'tong-quan': 'dashboard',
  'tongquan': 'dashboard',
  'dashboard': 'dashboard',
  'executive': 'dashboard',

  // 6. Vận hành nhân lực (HR Hub)
  'nhan-su': 'hr_hub',
  'nhansu': 'hr_hub',
  'hr': 'hr_hub',
  'hr_hub': 'hr_hub',
  'chia-ca': 'hr_hub',
  'chiaca': 'hr_hub',
  'phan-ca': 'hr_hub',
  'phanca': 'hr_hub',
  'lich-lam-viec': 'hr_hub',
  'lichlamviec': 'hr_hub',
  'ca-kip': 'hr_hub',
  'shifts': 'hr_hub',

  // 7. Marketing & CSKH
  'marketing': 'marketing',
  'bai-dang': 'marketing',

  // 8. Cài đặt hệ thống (System Settings)
  'he-thong': 'system',
  'hethong': 'system',
  'system': 'system',
  'quan-tri': 'system',
  'quantri': 'system',
  'admin': 'system',

  // Tuyển dụng công khai
  'tuyen-dung': 'recruitment',
  'tuyendung': 'recruitment',
  'recruitment': 'recruitment',
  'jobs': 'recruitment',
  'ung-tuyen': 'recruitment',

  // Chatbot tư vấn khách hàng công khai
  'tu-van': 'customer_chat',
  'tuvan': 'customer_chat',
  'chat': 'customer_chat',
  'be-8': 'customer_chat',
  'be8': 'customer_chat',
  'tro-ly-ao': 'customer_chat',

  // Quản lý khách hàng tiềm năng & Chốt đơn (Leads CRM)
  'chot-don': 'leads',
  'chotdon': 'leads',
  'leads': 'leads',
  'khach-tiem-nang': 'leads',

  // Hồ Sơ Khách Hàng 360 & CSKH Nội Bộ
  'khach-hang': 'customer_crm',
  'khachhang': 'customer_crm',
  'crm': 'customer_crm',
  'cskh': 'customer_crm',
  'cskh-360': 'customer_crm',
  'customer_crm': 'customer_crm',
};

// Bảng ánh xạ AppTab sang slug hiển thị trên thanh địa chỉ URL
const TAB_TO_SLUG: Record<AppTab, string> = {
  attendance: 'cham-cong',
  counter: 'quay-phuc-vu',
  training: 'dao-tao',
  culture: 'van-hoa',
  shop_management: 'quan-ly-shop',
  dashboard: 'tong-quan',
  hr_hub: 'nhan-su',
  marketing: 'marketing',
  customer_crm: 'khach-hang',
  system: 'he-thong',
  recruitment: 'tuyen-dung',
  customer_chat: 'tu-van',
  leads: 'chot-don',
  // Backward compatibility alias
  admin: 'he-thong',
  shifts: 'nhan-su',
  staff_directory: 'quan-ly-shop',
  tickets: 'quay-phuc-vu',
  pos: 'quay-phuc-vu',
};

/**
 * Đọc tab hiện tại từ URL Search Params (ví dụ: ?tab=cham-cong) hoặc Pathname (/tuyen-dung)
 */
export function getTabFromUrl(): AppTab | null {
  if (typeof window === 'undefined') return null;
  
  // 1. Kiểm tra pathname trực tiếp (ví dụ /tuyen-dung, /tuyendung, /tu-van)
  const path = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
  if (path && SLUG_TO_TAB[path]) {
    return SLUG_TO_TAB[path];
  }

  const params = new URLSearchParams(window.location.search);

  // 2. Kiểm tra query param độc lập dạng cờ (?tu-van, ?chat, ?be8, ?tuyen-dung, ?khach-hang)
  if (params.has('tu-van') || params.has('tuvan') || params.has('chat') || params.has('be8') || params.has('be-8')) {
    return 'customer_chat';
  }
  if (params.has('tuyen-dung') || params.has('tuyendung') || params.has('jobs')) {
    return 'recruitment';
  }
  if (params.has('chot-don') || params.has('leads')) {
    return 'leads';
  }
  if (params.has('khach-hang') || params.has('crm')) {
    return 'customer_crm';
  }
  if (params.has('van-hoa') || params.has('vanhoa') || params.has('culture') || params.has('van-hoa-88')) {
    return 'culture';
  }

  // 3. Kiểm tra query parameters (?tab=... hoặc ?module=...)
  const rawTab = params.get('tab')?.toLowerCase() || params.get('module')?.toLowerCase();
  if (!rawTab) return null;
  return SLUG_TO_TAB[rawTab] || null;
}

/**
 * Kiểm tra xem URL có đang ở chế độ khách tra cứu hay không (?mode=tra-cuu)
 */
export function isCustomerModeFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode')?.toLowerCase();
  return mode === 'tra-cuu' || mode === 'customer' || mode === 'qr';
}

/**
 * Kiểm tra xem URL có đang ở trang tuyển dụng công khai hay không
 */
export function isRecruitmentModeFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  if (
    path.includes('/tuyen-dung') || 
    path.includes('/tuyendung') || 
    path.includes('/jobs') ||
    params.has('tuyen-dung') ||
    params.has('tuyendung')
  ) {
    return true;
  }
  const tab = getTabFromUrl();
  return tab === 'recruitment';
}

/**
 * Kiểm tra xem URL có đang ở trang Chatbot tư vấn khách hàng công khai hay không
 */
export function isCustomerChatModeFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  if (
    path.includes('/tu-van') || 
    path.includes('/tuvan') || 
    path.includes('/chat') || 
    path.includes('/be-8') || 
    path.includes('/be8') ||
    params.has('tu-van') ||
    params.has('tuvan') ||
    params.has('chat') ||
    params.has('be8') ||
    params.has('be-8')
  ) {
    return true;
  }
  const tab = getTabFromUrl();
  return tab === 'customer_chat';
}

/**
 * Lấy tab mặc định theo vai trò nhân viên
 */
export function getDefaultTabForRole(role?: UserRole): AppTab {
  if (!role) return 'attendance';
  if (role === 'founder' || role === 'admin') return 'dashboard';
  if (role === 'hr') return 'hr_hub';
  if (role === 'manager') return 'shop_management';
  return 'attendance';
}

/**
 * Kiểm tra quyền truy cập tab theo role của nhân viên
 */
export function canAccessTab(tab: AppTab, role?: UserRole): boolean {
  if (tab === 'recruitment' || tab === 'customer_chat' || tab === 'culture') return true; // Công khai cho tất cả mọi người
  if (!role) return false;
  
  const isLeadership = role === 'admin' || role === 'founder' || role === 'hr' || role === 'sales_head';

  if (tab === 'customer_crm' || tab === 'leads') {
    return isLeadership || role === 'manager' || role === 'sales' || role === 'marketing' || role === 'technician';
  }

  if (tab === 'marketing') {
    return isLeadership || role === 'marketing' || role === 'media';
  }

  if (tab === 'dashboard' || tab === 'hr_hub') {
    return isLeadership || role === 'accountant' || role === 'warehouse_accountant';
  }

  if (tab === 'system' || tab === 'admin') {
    return isLeadership;
  }
  
  if (tab === 'shop_management' || tab === 'staff_directory') {
    return role === 'manager' || isLeadership;
  }

  // Các tab còn lại: attendance, counter, training, pos, tickets, shifts mở cho mọi nhân sự
  return true;
}

/**
 * Cập nhật URL trình duyệt và ghi vào window.history (phục vụ nút Back trên điện thoại)
 */
export function syncTabToUrl(tab: AppTab, isCustomer: boolean = false, replace: boolean = false): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  
  if (isCustomer) {
    url.searchParams.set('mode', 'tra-cuu');
    url.searchParams.delete('tab');
    url.searchParams.delete('tu-van');
  } else {
    url.searchParams.delete('mode');
    url.searchParams.delete('tu-van');
    url.searchParams.delete('tuvan');
    url.searchParams.delete('chat');
    url.searchParams.delete('be8');
    const slug = TAB_TO_SLUG[tab] || tab;
    url.searchParams.set('tab', slug);
  }

  const stateData = { tab, isCustomer, timestamp: Date.now() };

  if (replace) {
    window.history.replaceState(stateData, '', url.toString());
  } else {
    // Chỉ push nếu tab hiện tại thực sự khác với search param cũ
    const currentParam = new URLSearchParams(window.location.search).get('tab');
    const newSlug = TAB_TO_SLUG[tab] || tab;
    if (currentParam !== newSlug || (isCustomer !== isCustomerModeFromUrl())) {
      window.history.pushState(stateData, '', url.toString());
    }
  }
}
