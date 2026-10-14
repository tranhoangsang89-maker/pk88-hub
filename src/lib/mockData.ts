import { Branch, Staff, AttendanceRecord, RepairTicket, LeaveRequest } from '../types';

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: '2b150536-0b47-4e32-912b-b5ede701bfa6',
    code: 'PK88_PHUKHUONG',
    name: 'Phụ Kiện 88 - Phú Khương',
    address: '35 B2 Đoàn Hoàng Minh, Phường Phú Khương, TP Vĩnh Long (Bến Tre cũ)',
    lat: 10.2527211,
    lng: 106.3707262,
    wifiBssid: '00:11:22:33:44:55',
    isActive: true
  },
  {
    id: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28',
    code: 'PK88_DONGKHOI',
    name: 'Phụ Kiện 88 - Đồng Khởi',
    address: '173 Đại Lộ Đồng Khởi, Phường Phú Tân, Tỉnh Vĩnh Long (Vòng xoay Tân Thành)',
    lat: 10.2584726,
    lng: 106.3616252,
    isActive: true
  },
  {
    id: 'ce898286-8130-44cb-9f92-25176cec6703',
    code: 'PK88_MYTHO',
    name: 'Phụ Kiện 88 - Mỹ Tho',
    address: '25 Đinh Bộ Lĩnh, Phường Mỹ Tho, Tỉnh Đồng Tháp',
    lat: 10.355880,
    lng: 106.369735,
    isActive: true
  },
  {
    id: '98e58c92-edb5-4c5b-8a33-c78e38b3f954',
    code: 'PK88_VINHLONG',
    name: 'Phụ Kiện 88 - Vĩnh Long',
    address: '120 Trưng Nữ Vương, Phường Long Châu, TP. Vĩnh Long',
    lat: 10.2515112,
    lng: 105.9728027,
    isActive: true
  },
  {
    id: '7593aa44-bd49-476a-8d13-b9912874c0e0',
    code: 'PK88_CANTHO',
    name: 'Phụ Kiện 88 - Cần Thơ',
    address: '94 Đường Trần Hưng Đạo, Phường An Nghiệp, Quận Ninh Kiều, TP. Cần Thơ',
    lat: 10.037976,
    lng: 105.7763555,
    isActive: true
  },
  {
    id: 'c65f5a81-a5c3-45a2-b01c-4c842e41f61e',
    code: 'PK88_THUDUC',
    name: 'Phụ Kiện 88 - Thủ Đức',
    address: '178A Võ Văn Ngân, Phường Bình Thọ, TP. Thủ Đức, TP. Hồ Chí Minh',
    lat: 10.8506028,
    lng: 106.762417,
    isActive: true
  },
  {
    id: '11111111-2222-3333-4444-555555555555',
    code: 'PK88_VANPHONG',
    name: 'Phụ Kiện 88 - Văn Phòng',
    address: '35B5 Đoàn Hoàng Minh, Phường Phú Khương, Tỉnh Vĩnh Long',
    lat: 10.252668,
    lng: 106.370604,
    isActive: true
  },
  {
    id: 'f4468232-5e9b-4c3a-bf30-76663aa3a73e',
    code: 'PK88_TRAVINH',
    name: 'Phụ Kiện 88 - Trà Vinh',
    address: '29 Nguyễn Đáng, Phường 6, TP. Trà Vinh',
    lat: 9.9350,
    lng: 106.3450,
    isActive: false
  }
];

export const REAL_STAFF: Staff[] = [
  { id: '7526b7c5-12ac-442b-90a6-b68b9d624364', branchId: '11111111-2222-3333-4444-555555555555', fullName: 'Ngô Hồng Thao (Founder)', phone: '0777888688', role: 'founder', isActive: true, code: 'PK88-FOUNDER', email: 'ngohongthao@phukien88.vn', joinDate: '2020-01-01', avatarUrl: '/ngohongthao-founder.jpg', birthDate: '1988-10-12' },
  { id: 'e30be7a4-e5f6-47c0-8f27-d3f25d3adff8', branchId: '11111111-2222-3333-4444-555555555555', fullName: 'Trần Hoàng Sang (Admin & Automation)', phone: '0888003205', role: 'admin', isActive: true, code: 'PK88-ADMIN', email: 'tranhoangsang@phukien88.vn', joinDate: '2021-06-01', avatarUrl: '/tranhoangsang-admin.png', birthDate: '1995-08-20' },
  { id: 's-pk88-001', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Trương Thị Thùy Dương', phone: '0939998322', role: 'manager', isActive: true, code: 'PK88-001', email: 'thuyduong280719@gmail.com', joinDate: '2023-03-12', birthDate: '1998-03-15' },
  { id: 's-pk88-002', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Nguyễn Minh Hoài Ngọc', phone: '0386914770', role: 'technician', isActive: true, code: 'PK88-002', email: 'hn111224hn@gmail.com', joinDate: '2023-10-22', birthDate: '2004-12-11' },
  { id: 's-pk88-003', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Huỳnh Tiểu My', phone: '0392399534', role: 'sales', isActive: true, code: 'PK88-003', email: 'mytieu306@gmail.com', joinDate: '2024-11-18', birthDate: '2001-07-01' },
  { id: 's-pk88-004', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Nguyễn Trung Hiếu', phone: '0939118793', role: 'technician', isActive: true, code: 'PK88-004', email: 'trhieu0811@gmail.com', joinDate: '2024-06-06', birthDate: '2004-11-08' },
  { id: 's-pk88-005', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Nguyễn Kim Hân', phone: '0328194190', role: 'sales', isActive: true, code: 'PK88-005', email: 'nkimhan26082005@gmail.com', joinDate: '2025-10-21', birthDate: '2005-08-26' },
  { id: 's-pk88-006', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Nguyễn Hữu Đạt', phone: '0919982861', role: 'sales', isActive: true, code: 'PK88-006', email: 'baotapkoo23102001@gmail.com', joinDate: '2025-12-02', birthDate: '2001-01-23' },
  { id: 's-pk88-007', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Nguyễn Duy Khang', phone: '0847478721', role: 'sales', isActive: true, code: 'PK88-007', email: 'nguyenkhang424976@gmail.com', joinDate: '2026-06-08', birthDate: '2007-03-01' },
  { id: 's-pk88-008', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Phan Thành Long', phone: '0367793585', role: 'technician', isActive: false, code: 'PK88-008', email: 'thanhlong19102007@gmail.com', joinDate: '2024-06-18', birthDate: '2007-10-19' },
  { id: 's-pk88-009', branchId: '2b150536-0b47-4e32-912b-b5ede701bfa6', fullName: 'Nguyễn Thị Xuân Nhi', phone: '0365345008', role: 'sales', isActive: true, code: 'PK88-009', joinDate: '2026-08-23', birthDate: '2006-06-30' },
  { id: 's-pk88-010', branchId: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28', fullName: 'Lưu Thị Hồng Phụng', phone: '0787363979', role: 'manager', isActive: true, code: 'PK88-010', email: 'haian140322@gmail.com', joinDate: '2025-11-15', birthDate: '1997-07-05' },
  { id: 's-pk88-011', branchId: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28', fullName: 'Nguyễn Phan Ngọc Dương', phone: '0869297659', role: 'sales', isActive: true, code: 'PK88-011', email: 'nguyenphanngocduong@gmail.com', joinDate: '2024-06-27', birthDate: '2007-03-16' },
  { id: 's-pk88-012', branchId: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28', fullName: 'Trần Thanh Hòa', phone: '090000088012', role: 'sales', isActive: false, code: 'PK88-012', joinDate: '2026-10-01' },
  { id: 's-pk88-013', branchId: 'df1c32b5-051e-4c7f-80de-3aa7721cdb28', fullName: 'Bùi Thị Phương Châu', phone: '0917894158', role: 'sales', isActive: true, code: 'PK88-013', email: 'Buithiphuongchau1998@gmail.com', joinDate: '2026-05-14', birthDate: '1998-12-06' },
  { id: 's-pk88-014', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', fullName: 'Trần Thị Lan Thảo', phone: '0915433694', role: 'manager', isActive: true, code: 'PK88-014', email: 'tranthilanthao240101@gmail.com', joinDate: '2024-01-07', birthDate: '2001-01-24' },
  { id: 's-pk88-015', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', fullName: 'Nguyễn Bình Trọng', phone: '0343797559', role: 'sales', isActive: true, code: 'PK88-015', email: 'nguyenbinhtrong0806@gmail.com', joinDate: '2025-02-27', birthDate: '2005-06-08' },
  { id: 's-pk88-016', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', fullName: 'Nguyễn Thái Quốc', phone: '0823918425', role: 'sales', isActive: true, code: 'PK88-016', email: 'thaiquocnguyen750@gmail.com', joinDate: '2025-09-23', birthDate: '2003-10-16' },
  { id: 's-pk88-017', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', fullName: 'Lê Hữu Danh', phone: '0898997544', role: 'technician', isActive: true, code: 'PK88-017', joinDate: '2026-07-27', birthDate: '2002-09-13' },
  { id: 's-pk88-018', branchId: '98e58c92-edb5-4c5b-8a33-c78e38b3f954', fullName: 'Trương Lê Huỳnh', phone: '0375302833', role: 'technician', isActive: true, code: 'PK88-018', email: 'truonglehuynh9@gmail.com', joinDate: '2026-06-01', birthDate: '2002-02-19' },
  { id: 's-pk88-019', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', fullName: 'Phan Văn Thống', phone: '0369626490', role: 'manager', isActive: true, code: 'PK88-019', email: 'phanvanthong1234567891@gmail.com', joinDate: '2023-05-13', birthDate: '2002-09-04' },
  { id: 's-pk88-020', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', fullName: 'Bùi Thị Diểm', phone: '0345994310', role: 'manager', isActive: true, code: 'PK88-020', email: 'bdiem153@gmail.com', joinDate: '2025-10-11', birthDate: '1997-08-20' },
  { id: 's-pk88-021', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', fullName: 'Nguyễn Chí Bảo', phone: '0939614220', role: 'manager', isActive: true, code: 'PK88-021', email: 'Phamnguyenchibao562@gmail.com', joinDate: '2025-11-25', birthDate: '2001-06-11' },
  { id: 's-pk88-022', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', fullName: 'Lê Minh Sang', phone: '0788707367', role: 'technician', isActive: true, code: 'PK88-022', email: 'minhsang5688@gmail.com', joinDate: '2025-11-25', birthDate: '2003-08-23' },
  { id: 's-pk88-023', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', fullName: 'Trần Minh Nhựt', phone: '0789801046', role: 'sales', isActive: true, code: 'PK88-023', email: 'Babyboytg@gmail.com', joinDate: '2026-04-07', birthDate: '1998-01-14' },
  { id: 's-pk88-024', branchId: 'ce898286-8130-44cb-9f92-25176cec6703', fullName: 'Huỳnh Thị Mỹ Duyên', phone: '0774563600', role: 'sales', isActive: true, code: 'PK88-024', joinDate: '2026-09-01', birthDate: '1997-08-20' },
  { id: 's-pk88-025', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', fullName: 'Huỳnh Phương Châm', phone: '0703641900', role: 'manager', isActive: true, code: 'PK88-025', email: 'huynhphuongcham65@gmail.com', joinDate: '2023-04-03', birthDate: '2000-11-06' },
  { id: 's-pk88-026', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', fullName: 'Nguyễn Thị Ngọc Hân', phone: '0907383690', role: 'sales', isActive: true, code: 'PK88-026', email: 'ngochan270994@gmail.com', joinDate: '2025-06-05', birthDate: '1994-09-27' },
  { id: 's-pk88-027', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', fullName: 'Nguyễn Ngọc Duyên', phone: '0392894136', role: 'manager', isActive: true, code: 'PK88-027', email: 'nndyn23@gmail.com', joinDate: '2024-11-09', birthDate: '2001-12-23' },
  { id: 's-pk88-028', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', fullName: 'Đổ Phước Nguyên', phone: '0388316548', role: 'technician', isActive: true, code: 'PK88-028', email: 'work.phuocnguyenit@gmail.com', joinDate: '2024-11-11', birthDate: '2002-03-25' },
  { id: 's-pk88-029', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', fullName: 'Phạm Thị Mỹ An', phone: '0337376765', role: 'sales', isActive: true, code: 'PK88-029', email: 'phamthimyan5574@gmail.com', joinDate: '2025-11-19', birthDate: '2003-10-06' },
  { id: 's-pk88-030', branchId: '7593aa44-bd49-476a-8d13-b9912874c0e0', fullName: 'Lập', phone: '090000088030', role: 'sales', isActive: true, code: 'PK88-030' },
  { id: 's-pk88-031', branchId: 'c65f5a81-a5c3-45a2-b01c-4c842e41f61e', fullName: 'Liêu Thanh Tuấn', phone: '0934078758', role: 'manager', isActive: true, code: 'PK88-031', email: 'lieuthanhtuan6122003@gmail.com', joinDate: '2022-06-08', birthDate: '2003-12-06' },
  { id: 's-pk88-032', branchId: 'c65f5a81-a5c3-45a2-b01c-4c842e41f61e', fullName: 'Diệu', phone: '090000088032', role: 'sales', isActive: true, code: 'PK88-032' },
  { id: 's-pk88-033', branchId: 'c65f5a81-a5c3-45a2-b01c-4c842e41f61e', fullName: 'Trần Thị Hồng Thắm', phone: '0366958154', role: 'sales', isActive: true, code: 'PK88-033', joinDate: '2026-09-21', birthDate: '2008-01-19' },
  { id: 's-pk88-034', branchId: '11111111-2222-3333-4444-555555555555', fullName: 'Nguyễn Thị Bích Trâm', phone: '0985059514', role: 'accountant', isActive: true, code: 'PK88-034', email: 'bichtramnguyen18051994@gmail.com', joinDate: '2025-09-23', birthDate: '1994-05-18' },
  { id: 's-pk88-035', branchId: '11111111-2222-3333-4444-555555555555', fullName: 'Phan Hoàng Khánh', phone: '0394336726', role: 'hr', isActive: true, code: 'PK88-035', email: 'phanhoangkhanh03@gmail.com', joinDate: '2025-11-24', birthDate: '1999-08-03' },
  { id: 's-pk88-036', branchId: '11111111-2222-3333-4444-555555555555', fullName: 'Võ Tuấn Anh', phone: '0915755063', role: 'warehouse_accountant', isActive: true, code: 'PK88-036', email: 'tuananh0945358747@gmail.com', joinDate: '2026-03-25', birthDate: '1993-09-01' },
  { id: 's-pk88-037', branchId: '11111111-2222-3333-4444-555555555555', fullName: 'Nguyễn Huỳnh Khả Tú', phone: '0375350720', role: 'marketing', isActive: true, code: 'PK88-037', email: 'nguyenhuynhkhatu19@gmail.com', joinDate: '2026-06-15', birthDate: '1992-10-23' },
  { id: 's-pk88-038', branchId: '11111111-2222-3333-4444-555555555555', fullName: 'Phan Dương Quốc Việt', phone: '0343639533', role: 'media', isActive: true, code: 'PK88-038', joinDate: '2026-07-20', birthDate: '2005-06-15' },

];

// Export as MOCK_STAFF for backward compatibility across components
export const MOCK_STAFF: Staff[] = REAL_STAFF;

export const MOCK_ATTENDANCE: AttendanceRecord[] = [];

export const MOCK_REPAIR_TICKETS: RepairTicket[] = [];

export const MOCK_MARKETING_POSTS: any[] = [];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [];
