export type UserRole = 'founder' | 'admin' | 'manager' | 'technician' | 'sales' | 'customer' | 'hr' | 'marketing' | 'accountant' | 'sales_head' | 'media' | 'warehouse_accountant';

export interface Product {
  id: string;
  stt?: string;
  category: string;
  name: string;
  price: number;
  brand?: string;
  createdAt?: string;
}
export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  wifiBssid?: string;
  telegramGroupId?: string;
  isActive: boolean;
  hotline?: string;
  zalo?: string;
}

export interface CompetencyScores {
  expertise: number;
  discipline: number;
  attitude: number;
  kpi: number;
  lms: number;
}

export interface Staff {
  id: string;
  branchId: string;
  fullName: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  code?: string;
  joinDate?: string;
  birthDate?: string;
  email?: string;
  competencyScores?: CompetencyScores;
  homeBranchId?: string;
  workingBranchId?: string;
  hourlyRate?: number;
  salaryType?: 'hourly' | 'monthly' | 'probation';
}

export type ShiftType = 'CA_SANG' | 'CA_CHIEU' | 'HANH_CHINH' | 'CA_TRUA' | 'CA_THU_VIEC' | 'CA_GAY' | 'TANG_CUONG' | 'TUY_CHINH';

export interface ShiftDefinition {
  id: string;
  branchId?: string | null; // null/undefined = Company default; string = Branch custom
  code: string;
  name: string;
  startTime: string; // '07:00'
  endTime: string; // '15:30'
  hours: number; // 8.5
  color?: string; // Tailwind color token
  isCompanyDefault?: boolean;
  notes?: string;
}

export type ShiftAssignmentStatus = 'SCHEDULED' | 'OPEN_SHIFT' | 'SICK_LEAVE' | 'SWAPPED' | 'COMPLETED' | 'OFF';

export interface ShiftAssignment {
  id: string;
  staffId: string;
  staffName: string;
  staffPhone?: string;
  staffRole?: UserRole;
  homeBranchId: string;
  workingBranchId: string;
  workingBranchName?: string;
  date: string; // 'YYYY-MM-DD'
  shiftDefinitionId: string;
  shiftCode: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  hours: number;
  status: ShiftAssignmentStatus;
  isCrossBranch?: boolean;
  originalStaffId?: string;
  notes?: string;
  bountyBonus?: number; // Tiền thưởng nóng gánh ca đột xuất (VND)
  createdAt?: string;
}

export interface ShiftSwapRequest {
  id: string;
  fromAssignmentId: string;
  fromStaffId: string;
  fromStaffName: string;
  toStaffId?: string;
  toStaffName?: string;
  reason: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  bonusOffered?: number;
  createdAt: string;
}

export type AttendanceDisputeStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type DisputeType = 'OUTSIDE_GEOFENCE' | 'FORGOT_CHECKIN' | 'FORGOT_CHECKOUT' | 'OFFSITE_DUTY';

export interface AttendanceRecord {
  id: string;
  staffId: string;
  branchId: string;
  checkIn: string;
  checkOut?: string;
  shiftType?: ShiftType;
  workHours?: number;
  lat?: number;
  lng?: number;
  distanceMeters?: number;
  isVerified: boolean;
  notes?: string;
  isLate?: boolean;
  isOutsideGeofence?: boolean;
  isOnBreak?: boolean;
  breakStart?: string;
  breakEnd?: string;
  breakMinutes?: number;
  disputeStatus?: AttendanceDisputeStatus;
  disputeType?: DisputeType;
  disputeReason?: string;
  proofImageUrl?: string;
  disputedAt?: string;
  disputeHandledBy?: string;
  disputeHandledAt?: string;
  rejectionReason?: string;
}

export interface RepairTicket {
  id: string;
  code: string;
  branchId: string;
  customerPhone: string;
  customerName: string;
  deviceModel: string;
  serviceType: string;
  status: 'RECEIVED' | 'IN_PROGRESS' | 'READY' | 'DELIVERED' | 'REFUNDED' | 'CANCELLED';
  price: number;
  createdAt: string;
  technicianName?: string;
  createdByStaffId?: string;
  createdByStaffName?: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  totalDays: number;
  createdAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  dayNumber: number;
  title: string;
  content: string;
  createdAt: string;
}

export interface Quiz {
  id: string;
  lessonId: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export interface StaffProgress {
  id: string;
  staffId: string;
  lessonId: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  score?: number;
  completedAt?: string;
}

export type MarketingPlatform = 'facebook' | 'tiktok' | 'zalo' | 'youtube';

export type MarketingPostStatus = 'draft' | 'pending_review' | 'approved' | 'rejected';

export interface MarketingPost {
  id: string;
  branch_id: string; // cn_bt1, cn_mt, etc.
  platform: MarketingPlatform;
  post_url: string;
  author_name: string;
  created_at: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  // --- Các trường mới từ update-mkt.md ---
  status?: MarketingPostStatus; // Mặc định 'approved' - bài lịch sử không bị ảnh hưởng
  reviewer_feedback?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  facebook_caption?: string;
  tiktok_script?: string;
  zalo_text?: string;
  gmaps_text?: string;
  framed_image_url?: string;
}

export type LeaveType = 'PAID_LEAVE' | 'UNPAID_LEAVE' | 'SICK_LEAVE';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  phone?: string;
  branchId: string;
  role: UserRole;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  type: LeaveType;
  status: LeaveStatus;
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  replacementStaffName?: string;
  aiRiskAssessment?: string;
}

export interface POSCartItem {
  product: Product;
  quantity: number;
  price: number;
}

export type POSPaymentMethod = 'CASH' | 'TRANSFER' | 'CARD';

export interface POSOrder {
  id: string;
  code: string;
  branchId: string;
  branchName: string;
  cashierId: string;
  cashierName: string;
  customerName?: string;
  customerPhone?: string;
  items: POSCartItem[];
  totalAmount: number;
  paymentMethod: POSPaymentMethod;
  status?: 'DELIVERED' | 'REFUNDED' | 'CANCELLED';
  refundReason?: string;
  refundedAt?: string;
  refundedBy?: string;
  createdAt: string;
  note?: string;
}

export type JobApplicationStatus = 'pending' | 'interview' | 'hired' | 'rejected';

export interface JobApplication {
  id: string;
  branch_id: string;
  full_name: string;
  phone: string;
  role_applied: string;
  experience_note?: string;
  status: JobApplicationStatus;
  created_at: string;
  interview_date?: string;
  notes?: string;
}
export type CleanlinessShiftType = 'MORNING' | 'AFTERNOON' | 'CLOSING';
export type CleanlinessStatus = 'SUBMITTED' | 'PENDING' | 'APPROVED' | 'REDO_REQUESTED' | 'NEEDS_REDO';

export interface CleanlinessReport {
  id: string;
  branchId: string;
  branchName: string;
  staffId: string;
  staffName: string;
  staffPhone?: string;
  staffRole?: string;
  shiftType: CleanlinessShiftType;
  reportDate: string; // YYYY-MM-DD
  images: string[]; // WebP Base64 or Supabase Storage URLs
  notes?: string;
  status: CleanlinessStatus;
  reviewedBy?: string;
  reviewNote?: string;
  createdAt: string;
}

export type CustomerLeadStatus = 'NEW' | 'CONTACTED' | 'APPOINTED' | 'COMPLETED' | 'CANCELLED' | 'CHATTING';

export interface CustomerLead {
  id: string | number;
  lead_id?: string;
  customer_name: string;
  phone: string;
  need?: string;
  budget?: string;
  timeline?: string;
  branch?: string;
  branch_id?: string;
  score?: number;
  label?: string;
  status: CustomerLeadStatus | string;
  priority?: string;
  source?: string;
  notes?: string;
  conversation_summary?: string;
  voucher_code?: string;
  product_interest?: string;
  assigned_to?: string | null;
  last_action_at?: string | null;
  activity_log?: Array<{ sender: 'be8' | 'user' | string; text: string; time: string }>;
  created_at: string;
}

export type CustomerTier = 'NEW' | 'SILVER' | 'GOLD' | 'DIAMOND';

export interface CustomerCareReminder {
  id: string;
  type: 'SCREEN_PROTECTOR_REPLACE' | 'BATTERY_HEALTH_CHECK' | 'BIRTHDAY_GIFT' | 'VIP_WINBACK' | 'CUSTOM';
  title: string;
  message: string;
  suggestedAction: string;
  dueDays: number;
  isUrgent?: boolean;
}

export interface CustomerCareLog {
  id: string;
  phone: string;
  staff_name?: string;
  action_type: 'CALL' | 'ZALO' | 'GIFT' | 'NOTE' | 'WARRANTY_REMINDER' | string;
  content: string;
  created_at: string;
}

export interface CustomerProfile {
  id?: string;
  phone: string;
  fullName: string;
  homeBranchId?: string;
  homeBranchName?: string;
  deviceModel?: string;
  tier: CustomerTier;
  totalSpent: number;
  orderCount: number;
  ticketCount: number;
  leadCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  notes?: string;
  birthday?: string;
  orders: any[];
  tickets: any[];
  leads: any[];
  careLogs: CustomerCareLog[];
  reminders: CustomerCareReminder[];
}



