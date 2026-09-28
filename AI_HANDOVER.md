# AI HANDOVER REPORT - PK88 AUTOMATION PORTAL
*Ngày cập nhật: 27/09/2026*

Tài liệu này dùng để bàn giao bối cảnh, kiến trúc và tiến độ dự án cho các AI Agent tiếp theo nhằm duy trì tính liên tục của dự án.

## 1. TỔNG QUAN DỰ ÁN
- **Tên dự án:** PK88 Automation Portal
- **Mục tiêu:** Xây dựng hệ thống quản trị, chấm công bằng GPS Geofencing, quản lý nhân sự và theo dõi doanh thu thời gian thực cho chuỗi Phụ Kiện 88 (6 chi nhánh).
- **Tech Stack:** React (TypeScript), Vite, Tailwind CSS, Supabase (PostgreSQL), Lucide React.
- **Triển khai (Deployment):** Đang chạy live trên Vercel qua Github (`pk88-hub`).

## 2. THÀNH TỰU ĐÃ HOÀN THÀNH (ĐẾN HIỆN TẠI)
- **UI/UX:** Thiết kế theo phong cách Glassmorphism, Dark Mode đẹp mắt, hiện đại với đầy đủ các màn hình (Login, Dashboard, Chấm công, Phiếu sửa chữa, Quản trị Admin).
- **Auth Flow:** Đã cài đặt màn hình khóa `LoginModal.tsx`. Chỉ cho phép sử dụng web khi đã đăng nhập.
- **Chấm công GPS (Core Feature):** 
  - Tính toán khoảng cách tọa độ (Geofencing 35m).
  - Tích hợp ghi nhận trực tiếp vào **Supabase**.
  - **[QUAN TRỌNG] Đã fix lỗi Foreign Key (`staff_id`)**: Ban đầu, các nhân viên mock ở Frontend không tồn tại trong bảng `staff` của Supabase, dẫn đến lỗi insert ngầm. Logic hiện tại trong `AttendanceCard.tsx` đã được viết lại: *Tự động dò tìm nhân viên theo số điện thoại, nếu chưa có trong DB thì tự động tạo record `staff` mới rồi mới tiến hành insert `attendance`*. Mọi tài khoản giờ đây đều có thể chấm công và hiển thị đồng bộ.
- **Executive Dashboard:** Lấy dữ liệu attendance live từ Supabase để hiển thị danh sách check-in realtime cho Founder.
- **AI Chatbot (Chị 8 & Bé 8):** Đã hoàn thiện và nhúng trực tiếp vào website dưới dạng Floating Widget (`AIChatDrawer.tsx`).

## 3. CƠ SỞ DỮ LIỆU (SUPABASE)
Các bảng hiện có và đang được sử dụng chính:
- **`branches`**: Danh sách chi nhánh (id, name, lat, lng...)
- **`staff`**: Danh sách nhân sự (id, full_name, phone, role, is_active)
- **`attendance`**: Nhật ký chấm công. Chú ý các cột `staff_id` và `branch_id` là Foreign Key bắt buộc (NOT NULL).

## 4. CÁC TÍNH NĂNG CẦN PHÁT TRIỂN TIẾP THEO (NEXT STEPS)
AI Agent tiếp theo vui lòng tham khảo các ý tưởng sau hoặc làm theo yêu cầu trực tiếp của User:
1. **Quản lý Phiếu Sửa Chữa (Repair Tickets):** Hiện tại đang dùng dữ liệu mock, cần kết nối tính năng tạo/cập nhật vé sửa chữa vào Supabase.
2. **Tích hợp Webhook KiotViet & n8n:** Phần giao diện Admin Panel đã có sẵn các cấu hình, cần viết logic nhận/gửi dữ liệu thực tế nếu User cung cấp API.
3. **Quản lý Nhân Sự:** Chức năng thêm nhân sự ở `AdminPanel.tsx` đã đẩy được lên Supabase, nhưng có thể cần hoàn thiện thêm UI/UX để load lại danh sách nhân sự thực tế thay vì dùng `MOCK_STAFF`.

## 5. LƯU Ý ĐẶC BIỆT DÀNH CHO AI AGENT KẾ TIẾP
- Hệ thống hiện tại đang sử dụng song song `MOCK_STAFF` (dùng để login nhanh qua Frontend) và `staff` thật trên Supabase. Khi xử lý logic liên quan đến ID nhân viên, **hãy luôn dùng số điện thoại (`phone`) làm định danh chính** để đồng bộ hoặc truy vấn dữ liệu từ Supabase, tránh lỗi lệch UUID.
- Luôn nhắc User commit và push code lên Github (`pk88-hub`) để Vercel tự động deploy sau mỗi lần thay đổi mã nguồn quan trọng.
- KHÔNG chỉnh sửa các logic đã hoạt động trơn tru trong `AttendanceCard.tsx` trừ khi có yêu cầu thay đổi luồng nghiệp vụ rõ ràng.

Chúc AI Agent tiếp theo hoàn thành xuất sắc nhiệm vụ! 🚀
