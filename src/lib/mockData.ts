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
    branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6',
    fullName: 'Ngô Hồng Thao (Founder)',
    phone: '0777888688',
    role: 'founder',
    isActive: true
  },
  {
    id: 's0',
    branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6',
    fullName: 'Trần Hoàng Sang (Admin & Automation)',
    phone: '0888003205',
    role: 'admin',
    isActive: true
  },

  // --- CHI NHÁNH 1: BẾN TRE 1 (HQ) --- (11 Nhân sự)
  { id: 's112', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Vũ Minh Tuấn (Trưởng Phòng Kinh Doanh)', phone: '0911001012', role: 'sales_head', isActive: true },
  { id: 's111', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Trần Thị Mai Phương (Kế Toán Trưởng)', phone: '0911001011', role: 'accountant', isActive: true },
  { id: 's110', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Đặng Hoàng Long (Chuyên viên Marketing)', phone: '0911001010', role: 'marketing', isActive: true },
  { id: 's109', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Nguyễn Thị Ngọc Bích (Chuyên viên HC-NS)', phone: '0911001009', role: 'hr', isActive: true },
  { id: 's101', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Nguyễn Hoàng Hải (Quản lý)', phone: '0911001001', role: 'manager', isActive: true },
  { id: 's102', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Lê Hoàng Nam (Kỹ thuật)', phone: '0909123456', role: 'technician', isActive: true },
  { id: 's103', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Trần Quốc Bảo (Kỹ thuật)', phone: '0911001003', role: 'technician', isActive: true },
  { id: 's104', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Đặng Thị Hồng (Bán hàng)', phone: '0911001004', role: 'sales', isActive: true },
  { id: 's105', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Nguyễn Thanh Trúc (Bán hàng)', phone: '0911001005', role: 'sales', isActive: true },
  { id: 's106', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Phạm Đức Anh (Bán hàng)', phone: '0911001006', role: 'sales', isActive: true },
  { id: 's107', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Võ Thị Mai (Bán hàng)', phone: '0911001007', role: 'sales', isActive: true },
  { id: 's108', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Huỳnh Tấn Phát (Bán hàng)', phone: '0911001008', role: 'sales', isActive: true },

  // --- CHI NHÁNH 2: BẾN TRE 2 (TÂN THÀNH) --- (8 Nhân sự)
  { id: 's201', branchId: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28', fullName: 'Trịnh Văn Long (Quản lý)', phone: '0922002001', role: 'manager', isActive: true },
  { id: 's202', branchId: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28', fullName: 'Bùi Hữu Nghĩa (Kỹ thuật)', phone: '0922002002', role: 'technician', isActive: true },
  { id: 's203', branchId: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28', fullName: 'Phan Văn Khải (Kỹ thuật)', phone: '0922002003', role: 'technician', isActive: true },
  { id: 's204', branchId: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28', fullName: 'Trần Thị Ngọc (Bán hàng)', phone: '0922002004', role: 'sales', isActive: true },
  { id: 's205', branchId: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28', fullName: 'Nguyễn Hoàng Yến (Bán hàng)', phone: '0922002005', role: 'sales', isActive: true },
  { id: 's206', branchId: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28', fullName: 'Lê Minh Triết (Bán hàng)', phone: '0922002006', role: 'sales', isActive: true },
  { id: 's207', branchId: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28', fullName: 'Đỗ Khánh Linh (Bán hàng)', phone: '0922002007', role: 'sales', isActive: true },
  { id: 's208', branchId: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28', fullName: 'Hồ Thanh Bình (Bán hàng)', phone: '0922002008', role: 'sales', isActive: true },

  // --- CHI NHÁNH 3: MỸ THO --- (8 Nhân sự)
  { id: 's301', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', fullName: 'Nguyễn Văn Minh (Quản lý)', phone: '0912345678', role: 'manager', isActive: true },
  { id: 's302', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', fullName: 'Đinh Trọng Hiếu (Kỹ thuật)', phone: '0933003002', role: 'technician', isActive: true },
  { id: 's303', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', fullName: 'Vũ Huy Hoàng (Kỹ thuật)', phone: '0933003003', role: 'technician', isActive: true },
  { id: 's304', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', fullName: 'Phạm Thị Mỹ (Bán hàng)', phone: '0977112233', role: 'sales', isActive: true },
  { id: 's305', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', fullName: 'Nguyễn Ánh Tuyết (Bán hàng)', phone: '0933003005', role: 'sales', isActive: true },
  { id: 's306', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', fullName: 'Lý Văn Thuận (Bán hàng)', phone: '0933003006', role: 'sales', isActive: true },
  { id: 's307', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', fullName: 'Ngô Thị Thảo (Bán hàng)', phone: '0933003007', role: 'sales', isActive: true },
  { id: 's308', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', fullName: 'Trương Gia Bình (Bán hàng)', phone: '0933003008', role: 'sales', isActive: true },

  // --- CHI NHÁNH 4: VĨNH LONG --- (8 Nhân sự)
  { id: 's401', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', fullName: 'Hoàng Văn Thái (Quản lý)', phone: '0944004001', role: 'manager', isActive: true },
  { id: 's402', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', fullName: 'Nguyễn Tấn Dũng (Kỹ thuật)', phone: '0944004002', role: 'technician', isActive: true },
  { id: 's403', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', fullName: 'Bùi Quang Huy (Kỹ thuật)', phone: '0944004003', role: 'technician', isActive: true },
  { id: 's404', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', fullName: 'Lê Thị Thu Hà (Bán hàng)', phone: '0944004004', role: 'sales', isActive: true },
  { id: 's405', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', fullName: 'Đặng Văn Lâm (Bán hàng)', phone: '0944004005', role: 'sales', isActive: true },
  { id: 's406', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', fullName: 'Phạm Quỳnh Anh (Bán hàng)', phone: '0944004006', role: 'sales', isActive: true },
  { id: 's407', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', fullName: 'Võ Tấn Tài (Bán hàng)', phone: '0944004007', role: 'sales', isActive: true },
  { id: 's408', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', fullName: 'Nguyễn Thị Hương (Bán hàng)', phone: '0944004008', role: 'sales', isActive: true },

  // --- CHI NHÁNH 5: CẦN THƠ --- (8 Nhân sự)
  { id: 's501', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', fullName: 'Mai Xuân Trường (Quản lý)', phone: '0955005001', role: 'manager', isActive: true },
  { id: 's502', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', fullName: 'Dương Văn Khoa (Kỹ thuật)', phone: '0955005002', role: 'technician', isActive: true },
  { id: 's503', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', fullName: 'Lâm Văn Thịnh (Kỹ thuật)', phone: '0955005003', role: 'technician', isActive: true },
  { id: 's504', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', fullName: 'Nguyễn Thị Kim Anh (Bán hàng)', phone: '0955005004', role: 'sales', isActive: true },
  { id: 's505', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', fullName: 'Trần Thanh Sơn (Bán hàng)', phone: '0955005005', role: 'sales', isActive: true },
  { id: 's506', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', fullName: 'Huỳnh Ngọc Trinh (Bán hàng)', phone: '0955005006', role: 'sales', isActive: true },
  { id: 's507', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', fullName: 'Cao Văn Nam (Bán hàng)', phone: '0955005007', role: 'sales', isActive: true },
  { id: 's508', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', fullName: 'Lê Thị Bích Trâm (Bán hàng)', phone: '0955005008', role: 'sales', isActive: true },

  // --- CHI NHÁNH 6: TRÀ VINH --- (8 Nhân sự)
  { id: 's601', branchId: 'f4468232-5e9b-4c3a-bf30-76663aa3a73e', fullName: 'Thạch Văn Sang (Quản lý)', phone: '0966006001', role: 'manager', isActive: true },
  { id: 's602', branchId: 'f4468232-5e9b-4c3a-bf30-76663aa3a73e', fullName: 'Kim Son Thạch (Kỹ thuật)', phone: '0966006002', role: 'technician', isActive: true },
  { id: 's603', branchId: 'f4468232-5e9b-4c3a-bf30-76663aa3a73e', fullName: 'Nguyễn Thanh Phong (Kỹ thuật)', phone: '0966006003', role: 'technician', isActive: true },
  { id: 's604', branchId: 'f4468232-5e9b-4c3a-bf30-76663aa3a73e', fullName: 'Sơn Thị Sa Rây (Bán hàng)', phone: '0966006004', role: 'sales', isActive: true },
  { id: 's605', branchId: 'f4468232-5e9b-4c3a-bf30-76663aa3a73e', fullName: 'Thạch Thị Đa Vi (Bán hàng)', phone: '0966006005', role: 'sales', isActive: true },
  { id: 's606', branchId: 'f4468232-5e9b-4c3a-bf30-76663aa3a73e', fullName: 'Trần Văn Hùng (Bán hàng)', phone: '0966006006', role: 'sales', isActive: true },
  { id: 's607', branchId: 'f4468232-5e9b-4c3a-bf30-76663aa3a73e', fullName: 'Lê Thị Cẩm Vân (Bán hàng)', phone: '0966006007', role: 'sales', isActive: true },
  { id: 's608', branchId: 'f4468232-5e9b-4c3a-bf30-76663aa3a73e', fullName: 'Nguyễn Minh Tâm (Bán hàng)', phone: '0966006008', role: 'sales', isActive: true }
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att-0', staffId: 's0', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', checkIn: new Date(Date.now() - 3600000 * 2).toISOString(), lat: 10.24652, lng: 106.38125, distanceMeters: 6, isVerified: true, notes: 'Trần Hoàng Sang - Check-in GPS Hợp lệ', workHours: 176 },

  // BẾN TRE 1
  { id: 'att-101', staffId: 's101', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', checkIn: '2026-09-01T07:55:00Z', isVerified: true, workHours: 184, notes: '0911001001' },
  { id: 'att-102', staffId: 's102', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', checkIn: '2026-09-01T07:58:00Z', isVerified: true, workHours: 176, notes: '0909123456' },
  { id: 'att-103', staffId: 's103', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', checkIn: '2026-09-01T08:00:00Z', isVerified: true, workHours: 168, notes: '0911001003' },
  { id: 'att-104', staffId: 's104', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', checkIn: '2026-09-01T07:50:00Z', isVerified: true, workHours: 172, notes: '0911001004' },
  { id: 'att-105', staffId: 's105', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', checkIn: '2026-09-01T07:52:00Z', isVerified: true, workHours: 160, notes: '0911001005' },
  { id: 'att-106', staffId: 's106', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', checkIn: '2026-09-01T07:54:00Z', isVerified: true, workHours: 180, notes: '0911001006' },
  { id: 'att-107', staffId: 's107', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', checkIn: '2026-09-01T07:59:00Z', isVerified: true, workHours: 165, notes: '0911001007' },
  { id: 'att-108', staffId: 's108', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', checkIn: '2026-09-01T08:01:00Z', isVerified: true, workHours: 170, notes: '0911001008' },
  { id: 'att-109', staffId: 's109', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', checkIn: '2026-09-01T08:00:00Z', isVerified: true, workHours: 176, notes: '0911001009' },
  { id: 'att-110', staffId: 's110', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', checkIn: '2026-09-01T08:00:00Z', isVerified: true, workHours: 176, notes: '0911001010' },
  { id: 'att-111', staffId: 's111', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', checkIn: '2026-09-01T08:00:00Z', isVerified: true, workHours: 176, notes: '0911001011' },
  { id: 'att-112', staffId: 's112', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', checkIn: '2026-09-01T08:00:00Z', isVerified: true, workHours: 176, notes: '0911001012' },

  // BẾN TRE 2
  { id: 'att-201', staffId: 's201', branchId: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28', checkIn: '2026-09-01T07:55:00Z', isVerified: true, workHours: 180, notes: '0922002001' },
  { id: 'att-202', staffId: 's202', branchId: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28', checkIn: '2026-09-01T07:58:00Z', isVerified: true, workHours: 175, notes: '0922002002' },
  { id: 'att-203', staffId: 's203', branchId: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28', checkIn: '2026-09-01T08:00:00Z', isVerified: true, workHours: 168, notes: '0922002003' },
  { id: 'att-204', staffId: 's204', branchId: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28', checkIn: '2026-09-01T07:50:00Z', isVerified: true, workHours: 172, notes: '0922002004' },
  { id: 'att-205', staffId: 's205', branchId: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28', checkIn: '2026-09-01T07:52:00Z', isVerified: true, workHours: 162, notes: '0922002005' },
  { id: 'att-206', staffId: 's206', branchId: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28', checkIn: '2026-09-01T07:54:00Z', isVerified: true, workHours: 178, notes: '0922002006' },
  { id: 'att-207', staffId: 's207', branchId: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28', checkIn: '2026-09-01T07:59:00Z', isVerified: true, workHours: 166, notes: '0922002007' },
  { id: 'att-208', staffId: 's208', branchId: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28', checkIn: '2026-09-01T08:01:00Z', isVerified: true, workHours: 174, notes: '0922002008' },

  // MỸ THO
  { id: 'att-301', staffId: 's301', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', checkIn: '2026-09-01T07:55:00Z', isVerified: true, workHours: 182, notes: '0912345678' },
  { id: 'att-302', staffId: 's302', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', checkIn: '2026-09-01T07:58:00Z', isVerified: true, workHours: 176, notes: '0933003002' },
  { id: 'att-303', staffId: 's303', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', checkIn: '2026-09-01T08:00:00Z', isVerified: true, workHours: 170, notes: '0933003003' },
  { id: 'att-304', staffId: 's304', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', checkIn: '2026-09-01T07:50:00Z', isVerified: true, workHours: 176, notes: '0977112233' },
  { id: 'att-305', staffId: 's305', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', checkIn: '2026-09-01T07:52:00Z', isVerified: true, workHours: 164, notes: '0933003005' },
  { id: 'att-306', staffId: 's306', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', checkIn: '2026-09-01T07:54:00Z', isVerified: true, workHours: 180, notes: '0933003006' },
  { id: 'att-307', staffId: 's307', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', checkIn: '2026-09-01T07:59:00Z', isVerified: true, workHours: 168, notes: '0933003007' },
  { id: 'att-308', staffId: 's308', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', checkIn: '2026-09-01T08:01:00Z', isVerified: true, workHours: 172, notes: '0933003008' },

  // VĨNH LONG
  { id: 'att-401', staffId: 's401', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', checkIn: '2026-09-01T07:55:00Z', isVerified: true, workHours: 180, notes: '0944004001' },
  { id: 'att-402', staffId: 's402', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', checkIn: '2026-09-01T07:58:00Z', isVerified: true, workHours: 174, notes: '0944004002' },
  { id: 'att-403', staffId: 's403', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', checkIn: '2026-09-01T08:00:00Z', isVerified: true, workHours: 168, notes: '0944004003' },
  { id: 'att-404', staffId: 's404', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', checkIn: '2026-09-01T07:50:00Z', isVerified: true, workHours: 175, notes: '0944004004' },
  { id: 'att-405', staffId: 's405', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', checkIn: '2026-09-01T07:52:00Z', isVerified: true, workHours: 160, notes: '0944004005' },
  { id: 'att-406', staffId: 's406', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', checkIn: '2026-09-01T07:54:00Z', isVerified: true, workHours: 178, notes: '0944004006' },
  { id: 'att-407', staffId: 's407', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', checkIn: '2026-09-01T07:59:00Z', isVerified: true, workHours: 165, notes: '0944004007' },
  { id: 'att-408', staffId: 's408', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', checkIn: '2026-09-01T08:01:00Z', isVerified: true, workHours: 171, notes: '0944004008' },

  // CẦN THƠ
  { id: 'att-501', staffId: 's501', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', checkIn: '2026-09-01T07:55:00Z', isVerified: true, workHours: 185, notes: '0955005001' },
  { id: 'att-502', staffId: 's502', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', checkIn: '2026-09-01T07:58:00Z', isVerified: true, workHours: 176, notes: '0955005002' },
  { id: 'att-503', staffId: 's503', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', checkIn: '2026-09-01T08:00:00Z', isVerified: true, workHours: 170, notes: '0955005003' },
  { id: 'att-504', staffId: 's504', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', checkIn: '2026-09-01T07:50:00Z', isVerified: true, workHours: 172, notes: '0955005004' },
  { id: 'att-505', staffId: 's505', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', checkIn: '2026-09-01T07:52:00Z', isVerified: true, workHours: 163, notes: '0955005005' },
  { id: 'att-506', staffId: 's506', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', checkIn: '2026-09-01T07:54:00Z', isVerified: true, workHours: 179, notes: '0955005006' },
  { id: 'att-507', staffId: 's507', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', checkIn: '2026-09-01T07:59:00Z', isVerified: true, workHours: 167, notes: '0955005007' },
  { id: 'att-508', staffId: 's508', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', checkIn: '2026-09-01T08:01:00Z', isVerified: true, workHours: 173, notes: '0955005008' },

  // TRÀ VINH
  { id: 'att-601', staffId: 's601', branchId: 'f4468232-5e9b-4c3a-bf30-76663aa3a73e', checkIn: '2026-09-01T07:55:00Z', isVerified: true, workHours: 181, notes: '0966006001' },
  { id: 'att-602', staffId: 's602', branchId: 'f4468232-5e9b-4c3a-bf30-76663aa3a73e', checkIn: '2026-09-01T07:58:00Z', isVerified: true, workHours: 175, notes: '0966006002' },
  { id: 'att-603', staffId: 's603', branchId: 'f4468232-5e9b-4c3a-bf30-76663aa3a73e', checkIn: '2026-09-01T08:00:00Z', isVerified: true, workHours: 169, notes: '0966006003' },
  { id: 'att-604', staffId: 's604', branchId: 'f4468232-5e9b-4c3a-bf30-76663aa3a73e', checkIn: '2026-09-01T07:50:00Z', isVerified: true, workHours: 174, notes: '0966006004' },
  { id: 'att-605', staffId: 's605', branchId: 'f4468232-5e9b-4c3a-bf30-76663aa3a73e', checkIn: '2026-09-01T07:52:00Z', isVerified: true, workHours: 161, notes: '0966006005' },
  { id: 'att-606', staffId: 's606', branchId: 'f4468232-5e9b-4c3a-bf30-76663aa3a73e', checkIn: '2026-09-01T07:54:00Z', isVerified: true, workHours: 177, notes: '0966006006' },
  { id: 'att-607', staffId: 's607', branchId: 'f4468232-5e9b-4c3a-bf30-76663aa3a73e', checkIn: '2026-09-01T07:59:00Z', isVerified: true, workHours: 166, notes: '0966006007' },
  { id: 'att-608', staffId: 's608', branchId: 'f4468232-5e9b-4c3a-bf30-76663aa3a73e', checkIn: '2026-09-01T08:01:00Z', isVerified: true, workHours: 172, notes: '0966006008' }
];

export const MOCK_REPAIR_TICKETS: RepairTicket[] = [
  {
    id: 't-101',
    code: 'PK88-SC-9981',
    branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6',
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
    branchId: 'ce898286-8130-44cb-9f92-25176cec6703',
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

export const MOCK_MARKETING_POSTS = [
  {
    id: 'post-1',
    branch_id: 'ce898286-8130-44cb-9f92-25176cec6703',
    platform: 'facebook',
    post_url: 'https://facebook.com/post/1',
    author_name: 'Ngô Hồng Thao',
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'post-2',
    branch_id: '2b150536-0b47-4e32-912b-b5ede701bfa6',
    platform: 'tiktok',
    post_url: 'https://tiktok.com/@pk88/video/2',
    author_name: 'Trịnh Văn Long',
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
];

export const MOCK_LEAVE_REQUESTS: any[] = [
  {
    id: 'leave-1',
    staffId: 's-tech-1',
    staffName: 'Trần Văn Nam',
    phone: '0901234567',
    branchId: 'b1',
    role: 'technician',
    startDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    reason: 'Xin nghỉ đưa người nhà đi khám bệnh tại TP.HCM',
    type: 'PAID_LEAVE',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    aiRiskAssessment: '🟢 An toàn: Bến Tre 1 còn 2 thợ sửa máy ca này, đảm bảo vận hành.'
  },
  {
    id: 'leave-2',
    staffId: 's-sales-2',
    staffName: 'Lê Thị Mỹ',
    phone: '0912345678',
    branchId: 'b3',
    role: 'sales',
    startDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    endDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    reason: 'Sốt cao xin nghỉ bệnh 1 ngày',
    type: 'SICK_LEAVE',
    status: 'APPROVED',
    approvedBy: 'Trần Hoàng Sang (ADMIN)',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    aiRiskAssessment: '🟡 Cảnh báo nhẹ: Đã được Manager duyệt ca thế.'
  },
  {
    id: 'leave-3',
    staffId: 's-sales-5',
    staffName: 'Nguyễn Văn Hải',
    phone: '0933445566',
    branchId: 'b5',
    role: 'sales',
    startDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    reason: 'Xin nghỉ việc riêng đi chơi tự túc',
    type: 'UNPAID_LEAVE',
    status: 'REJECTED',
    rejectedBy: 'Phạm Thị Mỹ (MANAGER - Mỹ Tho)',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    aiRiskAssessment: '🔴 Rủi ro cao: Ngày này chi nhánh Cần Thơ có sự kiện chạy khuyến mãi Flash Sale.'
  }
];

