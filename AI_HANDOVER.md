# AI HANDOVER REPORT - PK88 AUTOMATION PORTAL
*Ngày cập nhật mới nhất: 07/10/2026 (Phiên Chuẩn Hóa Bộ Não AI gemini-flash-lite-latest, Sửa Scroll Mobile & Nâng Cấp Năng Lực 5D Đa Vai Trò)*

Tài liệu này dùng để bàn giao bối cảnh, kiến trúc và tiến độ dự án cho các AI Agent tiếp theo nhằm duy trì tính liên tục của dự án.

---

## 1. TỔNG QUAN DỰ ÁN
- **Tên dự án:** PK88 Automation Portal (Hệ Thống Vận Hành Tự Động Hóa AI Chuỗi Phụ Kiện 88)
- **Mục tiêu:** Xây dựng hệ thống quản trị, chấm công bằng GPS Geofencing, quản lý nhân sự 50+ người (7 chi nhánh), tính lương tự động đa vai trò, hồ sơ năng lực 5 chiều, thưởng nóng VietQR và hệ thống LMS đào tạo nội bộ 60 ngày.
- **Tech Stack:** React 19 (TypeScript), Vite 6, Tailwind CSS, Supabase (PostgreSQL), Recharts, Lucide React.
- **Triển khai (Deployment):** Đang chạy live trên Vercel qua GitHub (`pk88-hub`).
- **Domain/URL:** `https://pk88-hub.vercel.app/` | `http://localhost:3000/`

---

## 2. THÀNH TỰU ĐÃ HOÀN THÀNH (CẬP NHẬT 07/10/2026)

### A. Chuẩn Hóa 100% Hệ Sinh Thái AI - Duy Nhất 1 Bộ Não `gemini-flash-lite-latest` (NEW - 07/10)
- **Đồng bộ Model AI Engine:** Tất cả 4 công cụ/Trợ lý AI chính trong hệ thống đều được khóa sử dụng **DUY NHẤT 1 bộ não AI**: `gemini-flash-lite-latest` (Loại bỏ toàn bộ các model fallback như `gemini-2.0-flash-lite` hay `gemini-1.5-flash` để tránh lỗi nghẽn hoặc không tương thích):
  1. 🛠️ **AI Kỹ Thuật PK88 (Master Tech Bậc 8/8):** [`AITechnicianModal.tsx`](file:///c:/Users/ADMIN/Desktop/pk88-automation/src/components/AITechnicianModal.tsx)
  2. 🎨 **Xưởng Sáng Tạo Nội Dung AI (Chị 8 Marketing):** [`AIContentStudioModal.tsx`](file:///c:/Users/ADMIN/Desktop/pk88-automation/src/components/AIContentStudioModal.tsx)
  3. 🎓 **Trợ Lý Đào Tạo AI (LMS 60 Ngày):** [`TrainingLMS.tsx`](file:///c:/Users/ADMIN/Desktop/pk88-automation/src/components/TrainingLMS.tsx)
  4. 📋 **Trợ Lý AI HR (Chị 8 Hành Chính & Duyệt Phép):** [`AIHRModal.tsx`](file:///c:/Users/ADMIN/Desktop/pk88-automation/src/components/AIHRModal.tsx)
- **Cơ chế Xoay Vòng API Key (Key Rotation & Load Balancing):**
  - Tự động cắt chuỗi `VITE_GEMINI_API_KEY` chứa nhiều key phân tách bằng dấu phẩy.
  - Xoay vòng ngẫu nhiên và tự động thử lượt Key tiếp theo nếu gặp sự cố kết nối hoặc chạm quota.

### B. Sửa Triệt Để Lỗi Cuộn Trang & Khóa Màn Hình Trên Mobile Cho AI Kỹ Thuật (NEW - 07/10)
- **Khắc phục sự cố Mobile:** Đã sửa lỗi màn hình bị dính cứng/khóa cuộn trên điện thoại trong [`AITechnicianModal.tsx`](file:///c:/Users/ADMIN/Desktop/pk88-automation/src/components/AITechnicianModal.tsx):
  - Chuyển đổi khung chứa từ `h-[90vh] overflow-hidden` cố định sang dạng co giãn linh hoạt (`flex-col md:flex-row overflow-y-auto md:overflow-hidden`).
  - **Tự động cuộn thông minh (Auto-scroll):** Khi bấm *"Chẩn Đoán Bệnh"*, giao diện trên điện thoại tự động trượt mượt xuống phần Kết quả & Hướng dẫn sửa chữa (`outputPanelRef.current?.scrollIntoView({ behavior: 'smooth' })`).

### C. Đánh Giá Năng Lực 5 Chiều Đa Vai Trò (Role-Specific 5D Competency Mapping) & Trình Chỉnh Sửa Trực Tiếp (NEW - 07/10)
- **Bộ Tiêu Chí 5D Riêng Cho 9 Vị Trí:** Thay vì dùng chung tiêu chí bán hàng/sửa máy cho mọi người, hệ thống đã bản đồ hóa 5 chỉ số phù hợp với đúng vai trò:
  - *Founder / Admin:* Quản Trị Chiến Lược, Vận Hành Tự Động Hóa, Quản Lý Tài Chính, Văn Hóa & Nhân Sự, Đổi Mới Công Nghệ.
  - *TP. Kinh Doanh:* KPI Doanh Số Chuỗi, Quản Lý Chi Nhánh, Chiến Lược Marketing, Đào Tạo Đội Ngũ, Kỷ Luật Vận Hành.
  - *Kế Toán:* Chính Xác Sổ Sách, Quản Lý Thu Chi, Báo Cáo Tài Chính, Kỷ Luật GPS, Bảo Mật Dữ Liệu.
  - *Marketing:* Hiệu Quả Campaign, Sáng Tạo Content/Video, Chi Phí ADS/ROI, Tương Tác Khách Hàng, Tiến Độ LMS.
  - *HR (HC-NS):* Tuyển Dụng & Hội Nhập, Quy Trình Nhân Sự, Đào Tạo LMS, Giải Quyết Khiếu Nại, Kỷ Luật Vận Hành.
  - *Quản Lý Chi Nhánh (Manager):* Doanh Số Cửa Hàng, Quản Lý Nhân Sự, Thái Độ Phục Vụ, Quản Lý Kho Hàng, Kỷ Luật GPS.
  - *Kỹ Thuật Viên (Technician):* Kỹ Thuật Sửa Chữa, Tỷ Lệ Bảo Hành, Kỷ Luật GPS, Thái Độ Khách Hàng, Tiến Độ LMS.
  - *Nhân Viên Bán Hàng (Sales):* Doanh Số Bán Lẻ, Thái Độ Phục Vụ, Kỷ Luật GPS, Kiến Thức Sản Phẩm, Tiến Độ LMS.
- **Trình Chỉnh Sửa Chỉ Số Trực Tiếp (Live Score Editor):** Cho phép Founder/Admin chỉnh sửa điểm năng lực 5D trực tiếp ngay trên giao diện Web App tại Modal Hồ sơ nhân sự ([`StaffDetailModal.tsx`](file:///c:/Users/ADMIN/Desktop/pk88-automation/src/components/StaffDetailModal.tsx)).

### D. Danh Sách Đồng Nghiệp Chi Nhánh (Branch Staff Directory Tab) - NEW (07/10)
- **Tạo mới Component [`BranchStaffDirectory.tsx`](file:///c:/Users/ADMIN/Desktop/pk88-automation/src/components/BranchStaffDirectory.tsx):**
  - Bổ sung Tab chính `👥 Đồng Nghiệp Chi Nhánh` trên thanh Menu trên cho nhân viên Sales và Kỹ thuật viên.
  - Cho phép nhân sự xem danh sách đồng nghiệp cùng chi nhánh, số điện thoại, chức vụ, trạng thái ca trực.
  - Xóa bỏ bảng danh sách đồng nghiệp trùng lặp bên dưới phần chấm công `AttendanceCard.tsx` để giao diện gọn gàng.

### E. Giao Diện Bố Cục Điều Hướng 2 Hàng Cân Đối (2-Row Grid Layout Navigation)
- Chuyển đổi toàn bộ 7 tab chính ở **App Header (`App.tsx`)** và 7 tab con trong **Admin Panel (`AdminPanel.tsx`)** sang **Bố cục Grid 2 Hàng Cân Đối** giúp hiển thị sắc nét trên cả PC, Tablet và Mobile, loại bỏ thanh cuộn ngang.

### F. Thẻ Nhân Sự Chân Dung & Profile Detail Modal
- Tích hợp ảnh chân dung chuẩn chính chủ cho **Admin Trần Hoàng Sang** (`/tranhoangsang-admin.png`) và **Founder Ngô Hồng Thao** (`/ngohongthao-founder.jpg`).
- Mã VietQR Code Thưởng Nóng trực tiếp qua Internet Banking.

### G. Hệ Thống Chấm Công GPS Geofencing (Core Feature)
- Kiểm tra bán kính 35m từ tọa độ 7 cửa hàng, tự động dò tìm nhân viên theo Số Điện Thoại (`phone`).

### H. Quản Lý Nhân Sự & Bảng Lương Đa Vai Trò (Multi-Role Payroll Engine)
- Hệ số lương đa dạng theo vị trí (Sales: 22.7k/h, Technician: 30k/h, Manager: 8.5M, HR: 12M, Accountant: 13.5M, Marketing: 14M, Sales Head: 15M, Admin: 19M, Founder: 0đ).

---

## 3. QUY TRÌNH DEPLOY GITHUB & VERCEL (IMPORTANT)
1. **Cách Upload Lên GitHub Web:**
   - Kéo thả 2 thư mục chính: **`src`** (chứa toàn bộ mã nguồn React) và **`public`** (chứa ảnh đại diện thật).
   - Nếu Vercel deploy từ bản build sẵn, kéo thả thêm thư mục **`dist`**.
2. **Cơ chế Vercel:** Vercel kết nối tự động với GitHub repo `pk88-hub`. Khi có commit mới, Vercel sẽ tự động thực thi `npm run build` và deploy bản live mới nhất trên `https://pk88-hub.vercel.app/`.

---

## 4. CƠ SỞ DỮ LIỆU (SUPABASE)
- **`branches`**: Danh sách chi nhánh (id, code, name, lat, lng...)
- **`staff`**: Danh sách nhân sự (id, branch_id, full_name, phone, role, is_active, avatar_url)
- **`attendance`**: Nhật ký chấm công (id, staff_id, branch_id, check_in, check_out, work_hours...)
- **`courses`, `lessons`, `quizzes`, `staff_progress`:** CSDL hệ thống đào tạo LMS 60 ngày.

---

## 5. LƯU Ý ĐẶC BIỆT DÀNH CHO AI AGENT KẾ TIẾP
1. **Model AI duy nhất:** Mọi nâng cấp liên quan đến AI Agent bắt buộc giữ nguyên tên model `gemini-flash-lite-latest`.
2. **Quản Lý Ảnh Avatar:** Avatar mặc định ưu tiên đọc `staff.avatarUrl`, sau đó fallback sang `AVATAR_FALLBACKS[staff.id]` trong `StaffDetailModal.tsx` / `AdminPanel.tsx`.
3. **Định Danh Nhân Viên:** Luôn dùng số điện thoại (`phone`) làm định danh chính khi truy vấn hoặc đồng bộ nhân sự với Supabase.
4. **Hierarchy Priority Sorting:** Duy trì mảng `ROLE_PRIORITY` (`founder: 1`, `admin: 2`, `sales_head: 3`, `accountant: 4`, `marketing: 5`, `hr: 6`, `manager: 7`, `technician: 8`, `sales: 9`) ở mọi màn hình hiển thị danh sách nhân sự.

---

## 6. CÁC TÍNH NĂNG ĐỀ XUẤT NÂNG CẤP TRONG TƯƠNG LAI (BACKLOG)
1. **Quản lý Kho & Tồn kho:** Theo dõi linh kiện/phụ kiện theo chi nhánh (Real-time), cảnh báo sắp hết hàng.
2. **Quản lý Khách hàng & Bảo hành (CRM):** Lưu lịch sử mua bán/sửa chữa qua SĐT, theo dõi thời hạn bảo hành tự động.
3. **Bot Thông báo Telegram/Zalo:** Tự động bắn tin nhắn thông báo ca trực, phiếu sửa chữa mới, đơn xin nghỉ phép đã duyệt.
4. **PWA (Progressive Web App):** Hỗ trợ cài đặt thành app độc lập trên màn hình điện thoại (iOS/Android).

---

*Hồ sơ bàn giao đã hoàn tất đầy đủ. Chúc AI Agent tiếp theo hợp tác vui vẻ cùng anh Trần Hoàng Sang & Founder Ngô Hồng Thao để đưa Phụ Kiện 88 phát triển rực rỡ!* 🚀

