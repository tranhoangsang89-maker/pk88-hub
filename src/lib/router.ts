import { UserRole } from '../types';

export type AppTab = 
  | 'dashboard' 
  | 'admin' 
  | 'attendance' 
  | 'staff_directory' 
  | 'tickets' 
  | 'pos' 
  | 'training' 
  | 'marketing'
  | 'recruitment';

// Bảng ánh xạ slug URL tiếng Việt và tiếng Anh sang AppTab nội bộ
const SLUG_TO_TAB: Record<string, AppTab> = {
  // Tuyển dụng công khai
  'tuyen-dung': 'recruitment',
  'tuyendung': 'recruitment',
  'recruitment': 'recruitment',
  'jobs': 'recruitment',
  'ung-tuyen': 'recruitment',

  // Chấm công
  'cham-cong': 'attendance',
  'chamcong': 'attendance',
  'attendance': 'attendance',

  // Sửa chữa / Tiếp nhận
  'sua-chua': 'tickets',
  'suachua': 'tickets',
  'tiep-nhan': 'tickets',
  'tickets': 'tickets',

  // Bán hàng & Dịch vụ nhanh POS
  'pos': 'pos',
  'ban-hang': 'pos',
  'banhang': 'pos',

  // Đồng nghiệp chi nhánh
  'nhan-vien': 'staff_directory',
  'nhanvien': 'staff_directory',
  'dong-nghiep': 'staff_directory',
  'staff_directory': 'staff_directory',
  'directory': 'staff_directory',

  // Đào tạo LMS 60 ngày
  'dao-tao': 'training',
  'daotao': 'training',
  'lms': 'training',
  'training': 'training',

  // Hiệu suất Marketing
  'marketing': 'marketing',
  'bai-dang': 'marketing',

  // Tổng quan Dashboard
  'dashboard': 'dashboard',
  'tong-quan': 'dashboard',
  'executive': 'dashboard',

  // Quản trị Admin / HR
  'admin': 'admin',
  'quan-tri': 'admin',
  'quantri': 'admin',
  'hr': 'admin',
};

// Bảng ánh xạ AppTab sang slug hiển thị trên thanh địa chỉ URL
const TAB_TO_SLUG: Record<AppTab, string> = {
  attendance: 'cham-cong',
  tickets: 'sua-chua',
  pos: 'pos',
  staff_directory: 'nhan-vien',
  training: 'dao-tao',
  marketing: 'marketing',
  dashboard: 'dashboard',
  admin: 'quan-tri',
  recruitment: 'tuyen-dung',
};

/**
 * Đọc tab hiện tại từ URL Search Params (ví dụ: ?tab=cham-cong) hoặc Pathname (/tuyen-dung)
 */
export function getTabFromUrl(): AppTab | null {
  if (typeof window === 'undefined') return null;
  
  // 1. Kiểm tra pathname trực tiếp (ví dụ /tuyen-dung, /tuyendung)
  const path = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
  if (path && SLUG_TO_TAB[path]) {
    return SLUG_TO_TAB[path];
  }

  // 2. Kiểm tra query parameters (?tab=... hoặc ?module=...)
  const params = new URLSearchParams(window.location.search);
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
  if (path.includes('/tuyen-dung') || path.includes('/tuyendung') || path.includes('/jobs')) {
    return true;
  }
  const tab = getTabFromUrl();
  return tab === 'recruitment';
}

/**
 * Kiểm tra quyền truy cập tab theo role của nhân viên
 */
export function canAccessTab(tab: AppTab, role?: UserRole): boolean {
  if (tab === 'recruitment') return true; // Công khai cho tất cả mọi người
  
  if (!role) return false;
  
  if (tab === 'admin') {
    return role === 'admin' || role === 'founder' || role === 'hr';
  }
  
  if (tab === 'dashboard') {
    return role === 'founder' || role === 'admin';
  }

  // Các tab còn lại: attendance, tickets, pos, staff_directory, training, marketing mở cho mọi nhân sự
  return true;
}

/**
 * Cập nhật URL trình duyệt và ghi vào window.history (phục vụ nút Back trên điện thoại)
 * @param tab Tab cần chuyển tới
 * @param isCustomer Chế độ khách hay nhân viên
 * @param replace Nếu true sẽ replaceState thay vì pushState (ví dụ lúc khởi động)
 */
export function syncTabToUrl(tab: AppTab, isCustomer: boolean = false, replace: boolean = false): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  
  if (isCustomer) {
    url.searchParams.set('mode', 'tra-cuu');
    url.searchParams.delete('tab');
  } else {
    url.searchParams.delete('mode');
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
