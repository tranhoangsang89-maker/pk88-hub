export type UserRole = 'founder' | 'admin' | 'manager' | 'technician' | 'sales' | 'customer';

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

export interface Staff {
  id: string;
  branchId: string;
  fullName: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
}

export type ShiftType = 'CA_SANG' | 'CA_CHIEU' | 'HANH_CHINH';

export interface AttendanceRecord {
  id: string;
  staffId: string;
  branchId: string;
  checkIn: string;
  checkOut?: string;
  shiftType?: ShiftType;
  workHours?: number;
  lat: number;
  lng: number;
  distanceMeters: number;
  isVerified: boolean;
  notes?: string;
}

export interface RepairTicket {
  id: string;
  code: string;
  branchId: string;
  customerPhone: string;
  customerName: string;
  deviceModel: string;
  serviceType: 'THAY_PIN' | 'EP_KINH' | 'DAN_PPF' | 'THAY_MAN' | 'KHAC';
  status: 'RECEIVED' | 'IN_PROGRESS' | 'READY' | 'DELIVERED';
  price: number;
  createdAt: string;
  technicianName?: string;
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
