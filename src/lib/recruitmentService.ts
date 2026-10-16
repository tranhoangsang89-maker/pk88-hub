import { supabase } from './supabase';
import { Staff } from '../types';

export interface JobPosition {
  id: string;
  title: string;
  code: string;
  salary: string;
  type: string;
  description: string;
  requirements: string[];
  benefits: string[];
  recommendedRoles: string;
  isActive?: boolean;
}

export interface ValueProp {
  id: string;
  icon: 'DollarSign' | 'GraduationCap' | 'TrendingUp' | 'HeartHandshake' | string;
  title: string;
  desc: string;
}

export interface RecruitmentContentConfig {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  hotline: string;
  valueProps: ValueProp[];
  positions: JobPosition[];
  updatedAt?: string;
  updatedBy?: string;
}

export const CONFIG_RECORD_ID = '00000000-0000-0000-0000-000000000001';
export const RECRUITMENT_STORAGE_KEY = 'pk88_recruitment_config';

export const DEFAULT_RECRUITMENT_CONFIG: RecruitmentContentConfig = {
  heroBadge: 'CAREERS • ĐỢT TUYỂN DỤNG THÁNG 10/2026',
  heroTitle: 'Gia Nhập Đội Ngũ Phụ Kiện 88',
  heroSubtitle: 'Môi trường bán lẻ công nghệ trẻ trung, thu nhập hấp dẫn, áp dụng hệ thống tự động hóa AI và lộ trình đào tạo bài bản 60 ngày giúp bạn bứt phá sự nghiệp!',
  hotline: '0394.336.726',
  valueProps: [
    {
      id: 'vp-salary',
      icon: 'DollarSign',
      title: 'Thu Nhập Hấp Dẫn',
      desc: 'Lương cứng + Hoa hồng + Thưởng KPI tháng'
    },
    {
      id: 'vp-lms',
      icon: 'GraduationCap',
      title: 'LMS Đào Tạo 60 Ngày',
      desc: 'Cầm tay chỉ việc từ chưa biết gì đến chuyên nghiệp'
    },
    {
      id: 'vp-career',
      icon: 'TrendingUp',
      title: 'Lộ Trình Thăng Tiến',
      desc: 'Cơ hội lên Quản lý chi nhánh sau 3 - 6 tháng'
    },
    {
      id: 'vp-culture',
      icon: 'HeartHandshake',
      title: 'Văn Hóa Tương Trợ',
      desc: 'Đồng đội thân thiện, thưởng lễ Tết, du lịch hàng năm'
    }
  ],
  positions: [
    {
      id: 'pos-sales',
      title: 'Nhân Viên Tư Vấn Bán Hàng & Phụ Kiện',
      code: 'sales',
      salary: '7.000.000 - 12.000.000 đ',
      type: 'Toàn thời gian theo ca (Xoay ca linh hoạt)',
      description: 'Đón tiếp, tư vấn khách hàng về các sản phẩm phụ kiện điện thoại, đồ chơi công nghệ, dán kính cường lực và thanh toán tại quầy.',
      requirements: [
        'Độ tuổi từ 18 - 28, ngoại hình chỉn chu, tươi tắn.',
        'Giao tiếp vui vẻ, hoạt bát, có tinh thần phục vụ khách hàng.',
        'Không yêu cầu kinh nghiệm, sẽ được đào tạo bài bản 60 ngày trên hệ thống LMS nội bộ.'
      ],
      benefits: [
        'Thu nhập: Lương cứng + Hoa hồng sản phẩm + Thưởng doanh số chi nhánh.',
        'Giảm giá 30% khi mua sắm các sản phẩm công nghệ tại chuỗi PK88.',
        'Cơ hội thăng tiến lên Trưởng ca / Cửa hàng phó sau 3 - 6 tháng.'
      ],
      recommendedRoles: 'sales',
      isActive: true
    },
    {
      id: 'pos-tech',
      title: 'Kỹ Thuật Viên Sửa Chữa & Ép Kính Điện Thoại',
      code: 'technician',
      salary: '9.000.000 - 18.000.000 đ',
      type: 'Toàn thời gian (08:00 - 17:30 hoặc 13:30 - 21:30)',
      description: 'Thực hiện thay pin, thay màn hình, ép kính chân không, sửa chữa phần cứng điện thoại thông minh (iPhone, Samsung, Xiaomi...).',
      requirements: [
        'Biết tháo ráp các dòng máy thông dụng, ưu tiên có tay nghề ép kính màn hình cong hoặc phẳng.',
        'Cẩn thận, tỉ mỉ, trung thực với thiết bị của khách hàng.',
        'Ứng viên tay nghề yếu nhưng có đam mê sẽ được Kỹ thuật trưởng kèm cặp 1-1.'
      ],
      benefits: [
        'Thu nhập: Lương chuyên môn + Thưởng trực tiếp theo số vé sửa chữa hoàn thành.',
        'Trang bị máy ép kính, máy hút chân không, kính hiển vi hiện đại tại mỗi shop.',
        'Thưởng chuyên cần và hỗ trợ công cụ đồ nghề định kỳ.'
      ],
      recommendedRoles: 'technician',
      isActive: true
    },
    {
      id: 'pos-manager',
      title: 'Quản Lý Cửa Hàng / Cửa Hàng Trưởng',
      code: 'manager',
      salary: '12.000.000 - 22.000.000 đ',
      type: 'Toàn thời gian',
      description: 'Quản lý toàn diện hoạt động kinh doanh tại chi nhánh, điều phối nhân sự, kiểm soát tồn kho và thúc đẩy doanh thu cửa hàng.',
      requirements: [
        'Tối thiểu 1 năm kinh nghiệm quản lý cửa hàng bán lẻ (F&B, thời trang, viễn thông, công nghệ).',
        'Kỹ năng lãnh đạo, giải quyết khiếu nại khách hàng khéo léo.',
        'Sử dụng thành thạo máy tính, quản trị bằng phần mềm.'
      ],
      benefits: [
        'Lương cơ bản + Thưởng % KPI lợi nhuận cửa hàng hàng tháng.',
        'Được đào tạo kỹ năng quản trị chuỗi từ Ban Lãnh Đạo.',
        'Chế độ bảo hiểm, du lịch nghỉ dưỡng hàng năm của công ty.'
      ],
      recommendedRoles: 'manager',
      isActive: true
    },
    {
      id: 'pos-marketing',
      title: 'Nhân Viên Sáng Tạo Nội Dung & TikToker Chi Nhánh',
      code: 'marketing',
      salary: '8.000.000 - 15.000.000 đ',
      type: 'Toàn thời gian / Bán thời gian linh hoạt',
      description: 'Quay dựng video ngắn review phụ kiện, unbox sản phẩm mới, livestream bán hàng tại quầy và xây dựng kênh TikTok Phụ Kiện 88.',
      requirements: [
        'Tự tin trước ống kính, có khiếu hài hước hoặc khả năng diễn đạt tốt.',
        'Biết sử dụng CapCut trên điện thoại, nắm bắt xu hướng (trend) TikTok nhanh nhạy.',
        'Ưu tiên ứng viên có kênh cá nhân hoặc từng có clip lên xu hướng.'
      ],
      benefits: [
        'Thưởng thêm trực tiếp theo lượng view / tương tác của video.',
        'Hỗ trợ máy ảnh, micro thu âm, studio mini ngay tại shop.',
        'Môi trường thỏa sức sáng tạo không gò bó.'
      ],
      recommendedRoles: 'marketing',
      isActive: true
    }
  ]
};

// Kiểm tra quyền chỉnh sửa nội dung tuyển dụng: Chỉ Founder, Admin và HR Phan Hoàng Khánh
export function canUserEditRecruitment(user?: Staff | null): boolean {
  if (!user) return false;
  if (user.role === 'founder' || user.role === 'admin' || user.role === 'hr') return true;
  if (user.phone === '0394336726' || user.phone === '0888003205' || user.phone === '0777888688') return true;
  if (
    user.fullName?.includes('Phan Hoàng Khánh') ||
    user.fullName?.includes('Trần Hoàng Sang') ||
    user.fullName?.includes('Ngô Hồng Thao')
  ) {
    return true;
  }
  return false;
}

// Lấy config đã cache trong LocalStorage
export function getRecruitmentConfigCached(): RecruitmentContentConfig {
  try {
    const raw = localStorage.getItem(RECRUITMENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.positions) && parsed.positions.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc cache recruitment config:', e);
  }
  return DEFAULT_RECRUITMENT_CONFIG;
}

// Tải config từ Supabase Cloud
export async function fetchRecruitmentConfigFromSupabase(): Promise<RecruitmentContentConfig> {
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .select('notes')
      .eq('id', CONFIG_RECORD_ID)
      .maybeSingle();

    if (error) {
      console.warn('Chưa có cấu hình tuyển dụng trên Supabase, dùng mặc định:', error.message);
      return getRecruitmentConfigCached();
    }

    if (data && data.notes) {
      try {
        const parsed = JSON.parse(data.notes);
        if (parsed && Array.isArray(parsed.positions)) {
          localStorage.setItem(RECRUITMENT_STORAGE_KEY, JSON.stringify(parsed));
          return parsed;
        }
      } catch (parseErr) {
        console.warn('Lỗi parse JSON cấu hình tuyển dụng:', parseErr);
      }
    }
  } catch (e) {
    console.warn('Lỗi kết nối Supabase recruitment config:', e);
  }
  return getRecruitmentConfigCached();
}

// Lưu config lên Supabase Cloud và đồng bộ LocalStorage
export async function saveRecruitmentConfig(
  config: RecruitmentContentConfig,
  currentUser?: Staff | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      ...config,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.fullName || (currentUser?.role === 'hr' ? 'HR Phan Hoàng Khánh' : 'Admin')
    };

    // 1. Lưu LocalStorage ngay lập tức
    localStorage.setItem(RECRUITMENT_STORAGE_KEY, JSON.stringify(payload));

    // 2. Upsert lên Supabase Cloud DB
    const { error } = await supabase.from('job_applications').upsert({
      id: CONFIG_RECORD_ID,
      branch_id: 'SYSTEM_CONFIG',
      full_name: 'RECRUITMENT_CONTENT_CONFIG',
      phone: config.hotline ? config.hotline.replace(/\D/g, '') : '0394336726',
      role_applied: 'CONFIG',
      status: 'pending',
      notes: JSON.stringify(payload)
    });

    if (error) {
      console.error('Lỗi khi lưu cấu hình tuyển dụng lên Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: any) {
    console.error('Exception khi lưu cấu hình tuyển dụng:', e);
    return { success: false, error: e?.message || 'Lỗi không xác định' };
  }
}
