# AI HANDOVER REPORT - PK88 AUTOMATION PORTAL
*Ngày cập nhật mới nhất: 29/09/2026 (Phiên 2)*

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
- **Phân Hệ Đào Tạo (LMS) - NEW (29/09):**
  - Xây dựng 60 bài học tương ứng 60 ngày thử việc (`PK88_Insert_All_Lessons_V2.sql`).
  - Áp dụng luật **1 bài/ngày**: Khóa bài học tiếp theo cho đến khi qua ngày hôm sau (`TrainingLMS.tsx`).
  - Thiết kế bộ 180 câu hỏi trắc nghiệm kiểm tra chéo (`PK88_Insert_Quizzes_V3.sql`).
  - Quản lý theo dõi tiến độ nhân viên phân chia theo Chi Nhánh trên `AdminPanel.tsx`.
  - Đã fix lỗi xung đột UUID `staff_id` (ép kiểu sang TEXT) để lưu `staff_progress` mượt mà.
- **Quản lý Phiếu Sửa Chữa (Repair Tickets):** Đã hoàn thiện, kết nối trực tiếp với bảng `repair_tickets` trên Supabase (Thêm mới/Cập nhật trạng thái đều dùng dữ liệu thật).
  - **[Cập nhật mới - 29/09/2026]:** Phát triển và nhúng thành công **Bảng Điều Khiển Quản Trị Đào Tạo (LMS Analytics Dashboard)** vào `TrainingLMS.tsx`.
    - Sử dụng `recharts` để vẽ biểu đồ trực quan về tiến độ học của nhân viên.
    - Bảng vàng vinh danh (Top Học Bá) và Bảng Cảnh Báo (Đứng im trên 3 ngày).
    - Đã xử lý triệt để lỗi "Mismatch Data" bằng cách đồng bộ định danh giả lập `MOCK_STAFF` để Dashboard hoạt động đúng với logic Test hiện tại.

## 3. CƠ SỞ DỮ LIỆU (SUPABASE)
Các bảng hiện có và đang được sử dụng chính:
- **`branches`**: Danh sách chi nhánh (id, name, lat, lng...)
- **`staff`**: Danh sách nhân sự (id, full_name, phone, role, is_active)
- **`attendance`**: Nhật ký chấm công.
- **`courses`, `lessons`, `quizzes`, `staff_progress`:** Lưu trữ toàn bộ dữ liệu hệ thống đào tạo nội bộ. Lưu ý: `staff_progress` đã được loại bỏ Foreign Key Constraint cho `staff_id` và ép sang kiểu `TEXT` để phục vụ Frontend Login Fake.

## 4. CÁC TÍNH NĂNG CẦN PHÁT TRIỂN TIẾP THEO (NEXT STEPS)
AI Agent tiếp theo vui lòng tham khảo các ý tưởng sau hoặc làm theo yêu cầu trực tiếp của User:
1. **Migration lên Production (Chuyển đổi dữ liệu thật):** 
   - Tích hợp **Supabase Auth** để loại bỏ hoàn toàn cơ chế Đăng nhập giả lập bằng Modal (MOCK_STAFF).
   - Viết trang Quản lý Nhân sự (Staff Management) để thao tác thêm/xóa/sửa nhân sự trực tiếp lên bảng `staff` ở Cloud Database.
   - Khi đã có dữ liệu thật (50+ nhân viên), cần bổ sung chức năng **Filter theo Chi nhánh** và **Tìm kiếm tên** vào Dashboard để tránh quá tải UI.
2. **Tích hợp Webhook KiotViet & n8n:** Phần giao diện Admin Panel đã có sẵn các cấu hình, cần viết logic nhận/gửi dữ liệu thực tế nếu User cung cấp API.
3. **Gamification trong Đào tạo:** Bổ sung hệ thống cấp Huy hiệu (Badges) và Điểm kinh nghiệm (XP) cho LMS.

## 5. LƯU Ý ĐẶC BIỆT DÀNH CHO AI AGENT KẾ TIẾP
- Hệ thống hiện tại đang sử dụng song song `MOCK_STAFF` (dùng để login nhanh qua Frontend) và `staff` thật trên Supabase. Khi xử lý logic liên quan đến ID nhân viên, **hãy luôn dùng số điện thoại (`phone`) làm định danh chính** để đồng bộ hoặc truy vấn dữ liệu từ Supabase, tránh lỗi lệch UUID.
- Tại màn hình LMS Dashboard (`LMSDashboard.tsx`), vì chưa có Auth thật nên dữ liệu đang mapping bằng danh sách `MOCK_STAFF`. **TUYỆT ĐỐI** không đổi luồng chọc thẳng vào bảng `staff` trên Cloud lúc này để tránh làm gãy biểu đồ.
- Luôn nhắc User commit và push code lên Github (`pk88-hub`) để Vercel tự động deploy sau mỗi lần thay đổi mã nguồn quan trọng.
- KHÔNG chỉnh sửa các logic đã hoạt động trơn tru trong `AttendanceCard.tsx` trừ khi có yêu cầu thay đổi luồng nghiệp vụ rõ ràng.

Chúc AI Agent tiếp theo hoàn thành xuất sắc nhiệm vụ! 🚀
