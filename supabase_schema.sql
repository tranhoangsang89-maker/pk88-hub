-- ============================================================
-- SCHEMA DỮ LIỆU ĐA CHI NHÁNH (MULTI-TENANT) - PHỤ KIỆN 88
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BẢNG CHI NHÁNH (BRANCHES)
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    wifi_bssid VARCHAR(50),
    telegram_group_id VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BẢNG NHÂN SỰ (STAFF)
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'sales', -- founder, admin, manager, technician, sales
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. BẢNG PHIẾU DỊCH VỤ / SỬA CHỮA (REPAIR_TICKETS)
CREATE TABLE IF NOT EXISTS repair_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,
    branch_id UUID REFERENCES branches(id) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    device_model VARCHAR(100) NOT NULL,
    service_type VARCHAR(50) NOT NULL, -- THAY_PIN, EP_KINH, DAN_PPF, THAY_MAN
    status VARCHAR(30) DEFAULT 'RECEIVED', -- RECEIVED, IN_PROGRESS, READY, DELIVERED
    price NUMERIC(12, 2) DEFAULT 0,
    technician_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. BẢNG CHẤM CÔNG GPS GEOFENCING (ATTENDANCE)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id) NOT NULL,
    branch_id UUID REFERENCES branches(id) NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    check_out TIMESTAMP WITH TIME ZONE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    distance_meters INT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    notes TEXT
);

-- SEED OFFICIAL 6 BRANCHES OF PHỤ KIỆN 88
INSERT INTO branches (code, name, address, lat, lng) VALUES
('PK88_BENTRE_1', 'Phụ Kiện 88 - Bến Tre 1 (Trụ Sở Chính)', '35B2 Đoàn Hoàng Minh, Phường Phú Khương, TP. Bến Tre', 10.2465, 106.3812),
('PK88_BENTRE_2', 'Phụ Kiện 88 - Bến Tre 2 (Tân Thành)', '173 Đại Lộ Đồng Khởi, Vòng Xoay Tân Thành, TP. Bến Tre', 10.2589, 106.3764),
('PK88_MYTHO', 'Phụ Kiện 88 - Mỹ Tho', '25 Đinh Bộ Lĩnh, TP. Mỹ Tho, Tỉnh Tiền Giang', 10.3548, 106.3621),
('PK88_VINHLONG', 'Phụ Kiện 88 - Vĩnh Long', '120 Trưng Nữ Vương, Phường Long Châu, TP. Vĩnh Long', 10.2520, 105.9740),
('PK88_CANTHO', 'Phụ Kiện 88 - Cần Thơ', '94 Đường Trần Hưng Đạo, Phường Thới Bình, Q. Ninh Kiều, TP. Cần Thơ', 10.0384, 105.7820),
('PK88_TRAVINH', 'Phụ Kiện 88 - Trà Vinh', '29 Nguyễn Đáng, Phường 6, TP. Trà Vinh', 9.9350, 106.3450)
ON CONFLICT (code) DO NOTHING;

-- SEED KEY PERSONNEL
INSERT INTO staff (full_name, phone, role) VALUES
('Ngô Hồng Thao', '0777888688', 'founder'),
('Trần Hoàng Sang', '0888003205', 'admin')
ON CONFLICT (phone) DO NOTHING;
