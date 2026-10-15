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
}

export type ShiftType = 'CA_SANG' | 'CA_CHIEU' | 'HANH_CHINH' | 'TANG_CUONG' | 'TUY_CHINH';

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

export interface MarketingPost {
  id: string;
  branch_id: string; // cn_bt1, cn_mt, etc.
  platform: MarketingPlatform;
  post_url: string;
  author_name: string;
  created_at: string;
  views?: number;
  likes?: number;
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

