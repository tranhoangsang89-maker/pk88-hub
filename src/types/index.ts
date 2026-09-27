export type UserRole = 'founder' | 'admin' | 'manager' | 'technician' | 'sales' | 'customer';

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

export interface AttendanceRecord {
  id: string;
  staffId: string;
  branchId: string;
  checkIn: string;
  checkOut?: string;
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
