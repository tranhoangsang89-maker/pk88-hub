# AI HANDOVER REPORT - PK88 AUTOMATION PORTAL
*Ngày cập nhật mới nhất: 30/09/2026 (Phiên 3 & 4)*

Tài liệu này dùng để bàn giao bối cảnh, kiến trúc và tiến độ dự án cho các AI Agent tiếp theo nhằm duy trì tính liên tục của dự án.

---

## 1. TỔNG QUAN DỰ ÁN
- **Tên dự án:** PK88 Automation Portal (Hệ Thống Vận Hành Tự Động Hóa AI Chuỗi Phụ Kiện 88)
- **Mục tiêu:** Xây dựng hệ thống quản trị, chấm công bằng GPS Geofencing, quản lý nhân sự 50+ người (6 chi nhánh), tính lương tự động đa vai trò và hệ thống LMS đào tạo nội bộ 60 ngày.
- **Tech Stack:** React 19 (TypeScript), Vite 6, Tailwind CSS, Supabase (PostgreSQL), Recharts, Lucide React.
- **Triển khai (Deployment):** Đang chạy live trên Vercel qua GitHub (`pk88-hub`).
- **Domain/URL:** `https://pk88-hub.vercel.app/` | `http://localhost:3000/`

---

## 2. THÀNH TỰU ĐÃ HOÀN THÀNH (ĐẾN PHIÊN 30/09/2026)

### A. Giao Diện & Trải Nghiệm Người Dùng (UI/UX)
- Thiết kế phong cách Glassmorphism, Dark Mode đẹp mắt, hiện đại.
- Màn hình khóa đăng nhập (`LoginModal.tsx`) bảo vệ hệ thống.

### B. Chấm Công GPS Geofencing (Core Feature)
- Kiểm tra bán kính 35m từ tọa độ từng cửa hàng.
- Tự động dò tìm nhân viên theo Số Điện Thoại (`phone`), tự tạo record `staff` nếu chưa có để tránh lỗi Foreign Key `staff_id`.

### C. Quản Lý Nhân Sự & Bảng Lương Đa Vai Trò (Multi-Role Payroll Engine) - NEW (30/09)
- **Hệ số lương đa dạng theo vị trí:**
  - `sales`: `22.700 đ/giờ` (Theo giờ làm check-in GPS)
  - `technician`: `30.000 đ/giờ` (Theo giờ làm check-in GPS)
  - `manager`: `8.500.000 đ/tháng` (Lương cố định tháng)
  - `hr` (HC-NS): `12.000.000 đ/tháng` (Lương cố định)
  - `accountant` (Kế toán trưởng): `13.500.000 đ/tháng` (Lương cố định)
  - `marketing` (Marketing): `14.000.000 đ/tháng` (Lương cố định)
  - `sales_head` (TP. Kinh doanh): `15.000.000 đ/tháng (+ KPI Chuỗi)` (Lương cứng + KPI)
  - `admin` (Chuyên viên Công nghệ - anh Trần Hoàng Sang): `19.000.000 đ/tháng (Chính thức)` (Lương thử việc 16tr)
  - `founder` (Ngô Hồng Thao): `0 đ` (`Chủ sở hữu - Không nhận lương`)
- **Tập dữ liệu 50+ Nhân Sự:** Khởi tạo bộ 48 nhân sự giả lập + 4 nhân sự HQ chia đều cho 6 chi nhánh (mỗi chi nhánh 8 người: 1 Manager, 2 Technicians, 5 Sales + Khối HQ Bến Tre 1).
- **Bộ Lọc & Tìm Kiếm:**
  - Bộ lọc Dropdown theo 6 Chi nhánh.
  - Thanh tìm kiếm realtime theo Tên hoặc Số điện thoại.
  - Form Thêm Nhân sự Mới đầy đủ 8 vai trò + Dropdown chọn Chi nhánh công tác.
  - Quản lý trạng thái 🟢 `Đang làm việc` / 🔴 `Đã nghỉ việc` (Soft Delete / Deactivate) + Nút Xóa nhân viên.
- **Sắp Xếp Cấp Bậc Quản Trị (Hierarchy Priority Sorting):**
  - Danh sách nhân sự và bảng lương tự động sắp xếp theo thứ bậc: `Founder` -> `Admin` -> `TP. Kinh Doanh` -> `Kế Toán` -> `Marketing` -> `HR` -> `Quản Lý` -> `Kỹ Thuật` -> `Bán Hàng`.

### D. Hệ Thống Đào Tạo Nội Bộ (LMS 60 Ngày)
- 60 bài học tương ứng 60 ngày thử việc (Luật 1 bài/ngày).
- 180 câu hỏi trắc nghiệm kiểm tra chéo.
- Bảng điều khiển LMS Analytics Dashboard (`recharts`) theo dõi tiến độ, vinh danh Top Học Bá & Cảnh báo đứng im.

### E. Quản Lý Phiếu Sửa Chữa (Repair Tickets)
- Kết nối trực tiếp với bảng `repair_tickets` trên Supabase (Thêm mới / Cập nhật trạng thái realtime).

### F. Chuẩn Hóa Open Graph Meta Tags (SEO Sharing Banner) - NEW (30/09)
- Đưa tệp `pk88-og-meta-tags.jpg` vào `public/pk88-og-meta-tags.jpg`.
- Cấu hình đầy đủ các thẻ Meta Tags (`og:image`, `og:title`, `og:description`, `twitter:image`...) trong `index.html`. Mỗi khi share link web trên Zalo, Facebook, Telegram đều hiển thị banner cực kỳ chuyên nghiệp.

### G. Hệ Sinh Thái Trợ Lý Ảo (5 AI Agents - gemini-flash-lite-latest) - UPDATED (06/10/2026)
- **Mô Hình Sử Dụng:** Toàn bộ AI Agent đều gọi mô hình `gemini-flash-lite-latest` từ Gemini API.
- **Cấu Trúc Đa API (Multi-API Support):** Xử lý chuỗi `VITE_GEMINI_API_KEY` xoay vòng linh hoạt chống nghẽn API (Round-Robin Random).
- **Danh sách 5 AI Agents trên Portal:**
  1. **Chatbot Chị 8 & Bé 8 (CSKH & Bán Hàng):** Floating Widget góc màn hình nhúng từ `https://chatbot-pk88.vercel.app/`.
  2. **Chatbot Đào Tạo AI (Trợ Lý LMS 60 Ngày):** Tích hợp trong `TrainingLMS.tsx`, giải đáp nội quy, quy trình & bài học LMS.
  3. **Sư Phụ Kỹ Thuật AI (Master Technician Bậc 8/8):** Tích hợp trong `AITechnicianModal.tsx`, tư vấn pan bệnh phần cứng & camera OCR đọc ảnh màn vỡ / bo mạch hỏng.
  4. **AI Content Studio (Chị 8 Marketing):** Tích hợp trong `AIContentStudioModal.tsx`, sáng tạo nội dung PR, Facebook, Zalo, TikTok.
  5. **Trợ Lý AI HR (Chị 8 Hành Chính & Duyệt Phép Tự Động):** Tích hợp trong `AIHRModal.tsx`, hỗ trợ bóc tách tin nhắn xin nghỉ tự nhiên, đánh giá rủi ro thiếu nhân sự ca trực & cho phép Manager/HR duyệt đơn trực tiếp. Cấu hình đặc thù:
     - **Founder (Anh Ngô Hồng Thao):** Miễn chấm công GPS, miễn nộp đơn xin nghỉ, nhận diện chủ sở hữu.
     - **Admin (Anh Trần Hoàng Sang - System Creator):** Nhận diện tác giả sáng tạo ra AI HR, xưng hô tôn kính "Sếp Sang/Boss", hỗ trợ điều hành hệ thống.
     - **Tự động khởi tạo đơn phép & Ghi nhớ ngữ cảnh đa lượt (Multi-turn Chat Memory):** Đóng gói toàn bộ `formattedHistory` trong mỗi lần gọi API Gemini. AI HR tự động ghi nhớ các thông tin nhân viên đã nói ở tin nhắn trước (lý do "đi đám cưới ở Huế", ngày "17-18/10") để tổng hợp vào đơn phép chính xác mà không hỏi đi hỏi lại.
     - **Ma trận duyệt phép & Phân quyền chi nhánh:** Manager chỉ duyệt nhân sự Sales/Kỹ thuật CÙNG CHI NHÁNH; Manager trở lên nộp đơn phải qua HR & Founder duyệt. Log rõ thông tin người bấm Duyệt / Từ chối đơn.

---

## 3. CƠ SỞ DỮ LIỆU (SUPABASE)
Các bảng chính:
- **`branches`**: Danh sách 6 chi nhánh (id, code, name, lat, lng...)
- **`staff`**: Danh sách nhân sự (id, branch_id, full_name, phone, role, is_active)
- **`attendance`**: Nhật ký chấm công (id, staff_id, branch_id, check_in, check_out, work_hours...)
- **`courses`, `lessons`, `quizzes`, `staff_progress`:** Cơ sở dữ liệu hệ thống đào tạo LMS 60 ngày.

---

## 4. LƯU Ý ĐẶC BIỆT DÀNH CHO AI AGENT KẾ TIẾP
1. **Định Danh Nhân Viên:** Luôn dùng số điện thoại (`phone`) làm định danh chính khi truy vấn hoặc đồng bộ nhân sự với Supabase để tránh lỗi sai lệch UUID giữa Mock Data và DB thật.
2. **Sắp Xếp Cấp Bậc:** Khi hiển thị bất kỳ danh sách nhân sự nào, hãy duy trì mảng `ROLE_PRIORITY` (`founder: 1`, `admin: 2`, `sales_head: 3`, `accountant: 4`, `marketing: 5`, `hr: 6`, `manager: 7`, `technician: 8`, `sales: 9`) để thứ bậc nhân sự cấp cao luôn nằm ở trên cùng.
3. **MOCK_ATTENDANCE Integration:** Trong `AdminPanel.tsx`, mảng `combinedLogs = [...attendanceLogs, ...MOCK_ATTENDANCE]` giúp giữ giờ làm giả lập cho 50+ nhân sự mock khi DB Cloud chưa có đủ dữ liệu live.
4. **Hệ sinh thái AI Agent:** Tuyệt đối không dùng 1 API Key cố định. Phải code lấy chuỗi `VITE_GEMINI_API_KEY`, cắt bằng `.split(',')` và `Math.random()` để lấy Key ngẫu nhiên.
5. **Deploy Vercel:** Nhắc User commit & push tất cả thay đổi trong `src/`, `public/` và `index.html` lên GitHub repository `pk88-hub` để Vercel tự động deploy bản live mới.

---

## 5. CÁC TÍNH NĂNG ĐỀ XUẤT NÂNG CẤP TRONG TƯƠNG LAI (BACKLOG)
Để phát triển PK88 Automation Portal thành hệ thống ERP/Quản trị toàn diện, dưới đây là các tính năng được đề xuất để các AI Agent sau tham khảo triển khai:

1. **Nhóm Quản lý Vận hành & Cửa hàng (Core Operations):**
   - **Quản lý Kho & Tồn kho:** Theo dõi linh kiện/phụ kiện theo chi nhánh (Real-time), cảnh báo sắp hết hàng, luân chuyển hàng hóa.
   - **Quản lý Khách hàng & Bảo hành (CRM):** Lưu lịch sử mua bán/sửa chữa qua SĐT, theo dõi thời hạn bảo hành tự động, tích lũy điểm thưởng.
   - **Quản lý Doanh thu & Chi phí:** Báo cáo doanh thu bán lẻ/sửa chữa, quản lý dòng tiền (Cashflow) tại từng cửa hàng.

2. **Nhóm Nâng cấp Quản trị Nhân sự (HR & Admin):**
   - **Xin phép & Duyệt nghỉ (Leave Management):** Gửi yêu cầu xin nghỉ trên portal, tự động đồng bộ qua bảng lương sau khi duyệt.
   - **Quản lý KPI & Hiệu suất:** Mở rộng KPI cho kỹ thuật viên (số máy sửa) và sales (doanh số bán).
   - **Báo cáo Bất thường:** Cảnh báo tự động nếu đi trễ, về sớm hoặc check-in sai vị trí GPS nhiều lần.

3. **Nhóm Nâng cấp Hệ sinh thái AI & Đào tạo (LMS):**
   - **Bot Thông báo (Telegram/Zalo):** Tự động bắn tin về group cửa hàng (phiếu mới, quên check-in, doanh thu cuối ngày).
   - **AI Data Analyst:** Chat với dữ liệu ("Hôm nay chi nhánh Bến Tre doanh thu bao nhiêu?").
   - **Lộ trình thăng tiến (Career Path):** Mở khóa khóa học nâng cao thăng bậc sau 60 ngày thử việc.

4. **Nhóm Trải nghiệm Người dùng (UX/UI):**
   - **PWA (Progressive Web App):** Cài đặt thành app trên màn hình điện thoại (iOS/Android).
   - **Xuất dữ liệu:** Export báo cáo, bảng lương, danh sách nhân sự ra PDF/Excel.

---

Chúc AI Agent tiếp theo hoàn thành xuất sắc nhiệm vụ! 🚀
