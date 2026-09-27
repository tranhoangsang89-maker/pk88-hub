import { Branch, Staff, AttendanceRecord, RepairTicket } from '../types';

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'b1',
    code: 'PK88_BENTRE_1',
    name: 'Phụ Kiện 88 - Bến Tre 1 (HQ)',
    address: '35B2 Đoàn Hoàng Minh, Phường Phú Khương, TP. Bến Tre',
    lat: 10.2465,
    lng: 106.3812,
    wifiBssid: '00:11:22:33:44:55',
    isActive: true
  },
  {
    id: 'b2',
    code: 'PK88_BENTRE_2',
    name: 'Phụ Kiện 88 - Bến Tre 2 (Tân Thành)',
    address: '173 Đại Lộ Đồng Khởi, Vòng Xoay Tân Thành, TP. Bến Tre',
    lat: 10.2589,
    lng: 106.3764,
    isActive: true
  },
  {
    id: 'b3',
    code: 'PK88_MYTHO',
    name: 'Phụ Kiện 88 - Mỹ Tho',
    address: '25 Đinh Bộ Lĩnh, TP. Mỹ Tho, Tỉnh Tiền Giang',
    lat: 10.3548,
    lng: 106.3621,
    isActive: true
  },
  {
    id: 'b4',
    code: 'PK88_VINHLONG',
    name: 'Phụ Kiện 88 - Vĩnh Long',
    address: '120 Trưng Nữ Vương, Phường Long Châu, TP. Vĩnh Long',
    lat: 10.2520,
    lng: 105.9740,
    isActive: true
  },
  {
    id: 'b5',
    code: 'PK88_CANTHO',
    name: 'Phụ Kiện 88 - Cần Thơ',
    address: '94 Đường Trần Hưng Đạo, Phường Thới Bình, Q. Ninh Kiều, TP. Cần Thơ',
    lat: 10.0384,
    lng: 105.7820,
    isActive: true
  },
  {
    id: 'b6',
    code: 'PK88_TRAVINH',
    name: 'Phụ Kiện 88 - Trà Vinh',
    address: '29 Nguyễn Đáng, Phường 6, TP. Trà Vinh',
    lat: 9.9350,
    lng: 106.3450,
    isActive: true
  }
];

export const MOCK_STAFF: Staff[] = [
  {
    id: 's1',
    branchId: 'b1',
    fullName: 'Ngô Hồng Thao (Founder)',
    phone: '0777888688',
    role: 'founder',
    isActive: true
  },
  {
    id: 's0',
    branchId: 'b1',
    fullName: 'Trần Hoàng Sang (Admin & Automation)',
    phone: '0888003205',
    role: 'admin',
    isActive: true
  },
  {
    id: 's2',
    branchId: 'b3',
    fullName: 'Nguyễn Văn Minh (Quản lý Mỹ Tho)',
    phone: '0912345678',
    role: 'manager',
    isActive: true
  },
  {
    id: 's3',
    branchId: 'b1',
    fullName: 'Lê Hoàng Nam (Kỹ thuật Bến Tre 1)',
    phone: '0909123456',
    role: 'technician',
    isActive: true
  },
  {
    id: 's4',
    branchId: 'b3',
    fullName: 'Phạm Thị Mỹ (Bán hàng Mỹ Tho)',
    phone: '0977112233',
    role: 'sales',
    isActive: true
  }
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    staffId: 's0',
    branchId: 'b1',
    checkIn: new Date(Date.now() - 3600000 * 2).toISOString(),
    lat: 10.24652,
    lng: 106.38125,
    distanceMeters: 6,
    isVerified: true,
    notes: 'Trần Hoàng Sang - Check-in GPS Hợp lệ'
  }
];

export const MOCK_REPAIR_TICKETS: RepairTicket[] = [
  {
    id: 't-101',
    code: 'PK88-SC-9981',
    branchId: 'b1',
    customerName: 'Anh Tuấn',
    customerPhone: '0939112233',
    deviceModel: 'iPhone 13 Pro Max',
    serviceType: 'EP_KINH',
    status: 'IN_PROGRESS',
    price: 850000,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    technicianName: 'Lê Hoàng Nam'
  },
  {
    id: 't-102',
    code: 'PK88-SC-9982',
    branchId: 'b3',
    customerName: 'Chị Mai',
    customerPhone: '0988776655',
    deviceModel: 'iPhone 11',
    serviceType: 'THAY_PIN',
    status: 'READY',
    price: 450000,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    technicianName: 'Nguyễn Văn Minh'
  }
];
