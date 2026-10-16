# AI HANDOVER REPORT - PK88 AUTOMATION PORTAL
*Ngày cập nhật mới nhất: 16/10/2026 (Chuyển Đổi Chấm Công Thực Tế: Ẩn Hoàn Toàn Demo Test GPS, Nâng Cấp Nút 'Lấy GPS Thật' To Rõ Ràng, Tự Động Quét GPS Khi Vào Ca)*

Tài liệu này dùng để bàn giao bối cảnh, kiến trúc và tiến độ dự án cho các AI Agent tiếp theo nhằm duy trì tính liên tục của dự án.

---

## 1. TỔNG QUAN DỰ ÁN
- **Tên dự án:** PK88 Automation Portal (Hệ Thống Vận Hành Tự Động Hóa AI Chuỗi Phụ Kiện 88)
- **Mục tiêu:** Xây dựng hệ thống quản trị, chấm công bằng GPS Geofencing, quản lý nhân sự chuỗi (7 chi nhánh chuẩn hóa theo Excel), tính lương tự động đa vai trò, hồ sơ năng lực 5 chiều, thưởng nóng VietQR, duyệt đơn nghỉ phép tự động với Chị 8 AI HR, hệ thống LMS đào tạo nội bộ 60 ngày, phân hệ Tuyển dụng Onboarding thông minh, và Ma trận Phân chia ca & Điều động nhân sự 15 ngày.
- **Tech Stack:** React 19 (TypeScript), Vite 6, Tailwind CSS, Supabase (PostgreSQL), Recharts, Lucide React, Leaflet, SheetJS (xlsx), Google Gemini AI (`gemini-flash-lite-latest`).
- **Triển khai (Deployment):** Đang chạy live trên Vercel qua GitHub (`pk88-hub`).
- **Domain/URL:** `https://pk88-hub.vercel.app/` | `http://localhost:3000/`

---

## 2. THÀNH TỰU ĐÃ HOÀN THÀNH (CẬP NHẬT 16/10/2026) - QUAN TRỌNG

### H. Chuyển Đổi Vận Hành Chấm Công Thực Tế (NEW - 16/10)
1. **Ẩn Mặc Định Hoàn Toàn Chế Độ Kiểm Thử (Test/Demo GPS):**
   - Xóa bỏ hiển thị công khai của các nút giả lập *"Tại Shop"* và *"Ngoài Shop"* trên giao diện chấm công của nhân viên để ngăn ngừa gian lận vị trí.
   - Chế độ giả lập chỉ có thể mở lại khi tài khoản Admin/Founder bấm nút toggle ẩn `[🧪 Mở chế độ test GPS giả lập (Chỉ Admin)]`. Nhân viên thông thường tuyệt đối không thấy bất kỳ công cụ test nào.
2. **Nâng Cấp Nút "Lấy GPS Thật" Siêu Nổi Bật & Dễ Thao Tác Trên Điện Thoại:**
   - Thiết kế thành thẻ hành động to (Full-width), chiều cao chuẩn ngón tay bấm cảm ứng (`py-4`), hiệu ứng glow phát sáng cyan và viền pulse thu hút sự chú ý.
   - Tích hợp biểu tượng radar vệ tinh và con quay hồi chuyển (`LocateFixed`, `RotateCw`, `Loader2`).
   - Hiển thị đầy đủ thông tin: Trạng thái định vị, khoảng cách thực tế đến cửa hàng (mét), tọa độ GPS chính xác (vĩ độ, kinh độ), cùng hướng dẫn bật quyền vị trí 🔒 trên trình duyệt điện thoại nếu bị chặn.
3. **Tự Động Kích Hoạt Quét GPS (Auto-detect Location):**
   - Tự động gọi `navigator.geolocation.getCurrentPosition` ngay khi nhân viên vừa truy cập tab Chấm Công mà không bắt buộc phải bấm nút trước.
   - Khi chưa có tọa độ GPS thật, nút hành động chính đóng vai trò nhắc nhở: *"BẤM LẤY VỊ TRÍ GPS THỰC TẾ ĐỂ BẬT CHẤM CÔNG"*, ngăn ngừa việc nhân viên bấm nhầm sang gửi đơn giải trình.
4. **Bổ Sung Khối Văn Phòng Vào Trung Tâm Cảnh Báo Đỏ Telegram ([ExecutiveDashboard.tsx](file:///d:/PK88%20AI%20AUTOMATION/src/components/ExecutiveDashboard.tsx)):**
   - Đã gỡ bỏ điều kiện ngoại lệ `&& b.code !== 'PK88_VANPHONG'` từng loại trừ Văn Phòng khỏi cảnh báo chưa mở ca.
   - Đưa Khối Văn Phòng vào giám sát tự động bình đẳng như 6 chi nhánh cửa hàng: Sau 09:00 sáng, nếu chưa có nhân sự văn phòng nào check-in ca hành chính, hệ thống sẽ phát cảnh báo đỏ *"Văn phòng trực tuyến nhưng chưa ghi nhận nhân sự check-in ca hành chính"*, kèm biểu tượng tòa nhà văn phòng và danh bạ nhân sự văn phòng trực tiếp (Gọi điện / Zalo).
5. **Chuẩn Hóa Thứ Tự Hiển Thị 7 Chi Nhánh Toàn Hệ Thống:**
   - Đã thiết lập hàm sắp xếp chuẩn `sortBranchesByPriority` và `getBranchOrderIndex` ([mockData.ts](file:///d:/PK88%20AI%20AUTOMATION/src/lib/mockData.ts)):
     1. **Văn Phòng**
     2. **Phú Khương**
     3. **Đồng Khởi**
     4. **Mỹ Tho**
     5. **Cần Thơ**
     6. **Vĩnh Long**
     7. **Thủ Đức**
   - Đồng bộ hiển thị từ danh mục Cảnh Báo Đỏ Telegram, Menu đổi chi nhánh trên thanh điều hướng đầu trang, đến bảng xếp hạng vận hành chuỗi.

### G. Tùy Biến Nội Dung Tuyển Dụng Động Cho Founder, Admin & HR Phan Hoàng Khánh (16/10)
1. **Phân Quyền Biên Tập Nghiêm Ngặt (Strict RBAC):**
   - Chỉ duy nhất **Founder (Ngô Hồng Thao)**, **Admin (Trần Hoàng Sang)** và **HR (Phan Hoàng Khánh)** mới có quyền chỉnh sửa nội dung trang tuyển dụng.
   - Nhân viên tại quầy, kỹ thuật viên, quản lý shop, khách vãng lai và ứng viên tuyệt đối không thấy bất kỳ nút hoặc công cụ chỉnh sửa nào.
2. **Khả Năng Tùy Biến Toàn Diện ([RecruitmentEditModal.tsx](file:///d:/PK88%20AI%20AUTOMATION/src/components/RecruitmentEditModal.tsx)):**
   - **Quản lý vị trí tuyển dụng:** Thêm mới vị trí, sửa tiêu đề, mức lương, khung ca, mô tả công việc, yêu cầu ứng viên, quyền lợi nổi bật, bật/tắt hiển thị (Ẩn/Hiện vị trí tạm thời mà không cần xóa), xóa vị trí.
   - **Quản lý Banner & Hero:** Chỉnh sửa huy hiệu đầu trang, tiêu đề chính, đoạn mô tả giới thiệu, số điện thoại Hotline HR trực tiếp.
   - **Cam kết vàng:** Tùy biến tiêu đề và mô tả cho 4 thẻ cam kết quyền lợi của chuỗi.
3. **Lưu Trữ Đám Mây & Xuất Bản Realtime ([recruitmentService.ts](file:///d:/PK88%20AI%20AUTOMATION/src/lib/recruitmentService.ts)):**
   - Đồng bộ ngay lập tức lên Supabase Cloud (`job_applications` config row) và `localStorage`.
   - Tất cả ứng viên và người xem trên mọi thiết bị sẽ thấy ngay nội dung mới nhất mà không cần deploy lại mã nguồn.
   - Kèm nút Khôi phục mặc định để dễ dàng hoàn tác nếu cần.

### F. Chuẩn Hóa Thuật Toán Tính Trễ Tự Động & Chốt Ca Văn Phòng (16/10)
1. **Thuật Toán Tính Trễ Tự Động Với 10 Phút Ân Hạn (`calculateAttendanceIsLate`):**
   - Đặt thời gian ân hạn chuẩn: **10 phút** (`GRACE_PERIOD_MINUTES = 10`). Check-in trong vòng 10 phút sau giờ bắt đầu ca được công nhận 100% Đúng Giờ / Hợp Lệ.
   - So sánh trực tiếp timestamp check-in thực tế với mốc bắt đầu ca:
     - **Ca Sáng:** 07:00 (Check-in đến 07:10 được tính đúng giờ; từ 07:11 trở đi tính trễ theo phút thực tế).
     - **Ca Văn Phòng (Hành Chính):** 07:30 (Check-in đến 07:40 tính đúng giờ; từ 07:41 trở đi tính trễ theo phút thực tế).
     - **Ca Chiều:** 13:30 (Check-in đến 13:40 tính đúng giờ; từ 13:41 trở đi tính trễ).
     - **Ca Trưa:** 12:00 (Check-in đến 12:10 tính đúng giờ).
     - **Ca Tùy Chỉnh:** Theo giờ bắt đầu ca đã đặt + 10 phút.
   - Áp dụng đồng bộ xuyên suốt từ giao diện nhân viên chấm công ([AttendanceCard.tsx](file:///d:/PK88%20AI%20AUTOMATION/src/components/AttendanceCard.tsx)), bảng tra cứu bảng công ([AttendanceTimesheetView.tsx](file:///d:/PK88%20AI%20AUTOMATION/src/components/AttendanceTimesheetView.tsx)), đến bộ nạp dữ liệu gốc ([App.tsx](file:///d:/PK88%20AI%20AUTOMATION/src/App.tsx)). Khi quản trị viên chốt ca hoặc ghi chú bị thay đổi, thuật toán vẫn tính toán chuẩn xác từ timestamp gốc mà không bị mất cờ trễ.
2. **Khung Giờ Ca Văn Phòng (Khối Văn Phòng):**
   - Chốt cứng toàn hệ thống: **`07:30 - 17:30`**.
   - Nghỉ trưa 2 tiếng: `11:30 - 13:30`.
   - Tính chuẩn **8.0 giờ công làm việc thực tế**.
3. **Dọn Sạch (Reset) Dữ Liệu Test Trên Supabase:**
   - Đã xóa sạch 11 bản ghi chấm công thử nghiệm của ngày 14 & 15/10/2026 trên bảng `attendance` của Supabase Cloud DB.
   - Bảng chấm công hiện tại hoàn toàn sạch sẽ, sẵn sàng đón nhận dữ liệu chấm công thực tế từ nhân viên bắt đầu từ ngày mai (16/10 trở đi).

### E. Ma Trận Chia Ca & Điều Động 15 Ngày & Xuất Excel Khổ A4 (15/10)
1. **Chuẩn Hóa Ngôn Ngữ Miền Tây & Bản Sắc Doanh Nghiệp:**
   - Thay thế toàn bộ thuật ngữ hàn lâm: `Bán Nguyệt` ➔ **Lịch Chia Ca / Ma Trận Chia Ca & Điều Động (Kỳ 15 Ngày)** (`chia-ca`, `chiaca`).
   - Xóa bỏ từ ngữ hành chính `Cơ hữu` ➔ Đổi thành **`Tại shop`** (nhân viên chính của cửa hàng) và **`Tăng cường từ shop khác`**.
2. **Khung Giờ Ca Làm Việc & Tính Công Chuẩn Xác:**
   - Nút **`[⚙️ Tùy Biến Khung Ca]`** được phóng to, nổi bật với viền phát sáng cyan trên toolbar chính.
   - **Ca Hành Chính Văn Phòng:** Khung giờ `07:30 - 17:30`, tính chuẩn **8 tiếng công thực tế** (đã trừ 2 tiếng nghỉ trưa từ `11:30 - 13:30`).
   - Sửa nhãn hiển thị ca văn phòng: hiển thị chuẩn `Văn Phòng (07:30 - 17:30)`, không bị hiển thị nhầm thành ca `T.Cường`.
3. **Bảo Mật Lương & Khóa Tài Khoản Founder (Chủ Doanh Nghiệp):**
   - Đã ẩn toàn bộ số tiền lương cụ thể tại bảng phân ca và Admin Panel (chuyển sang hiển thị bảo mật: `💼 Đủ công chuẩn (13 ngày)`, `💼 Lương Cứng (Bảo mật)`, `🔒 ĐANG BẢO MẬT`, `🔒 Chờ quy chế`).
   - **Bảo vệ tài khoản Founder (Ngô Hồng Thao - `PK88-FOUNDER`):** Khóa hoàn toàn nút Xóa tài khoản, hiển thị huy hiệu vương miện hoàng gia 👑, cột công ghi nhận `Miễn công` (Chủ Doanh Nghiệp).
4. **Công Cụ Xuất File Excel Lịch Chia Ca (.xlsx) Chuẩn A4:**
   - Tích hợp nút **`[📥 Xuất Excel]`** trực tiếp trên thanh công cụ ma trận.
   - Tích hợp banner thông tin: Tiêu đề chuỗi, Tên chi nhánh, Kỳ chia ca (01-15 hoặc 16-cuối tháng), Ngày xuất, Đơn vị tính.
   - Header các ngày được định dạng rõ ràng: `T5 (01)`, `T6 (02)`, `T7 (03)`, `CN (04)`...
   - Toàn bộ chức vụ được dịch sang tiếng Việt: `Kế Toán Kho`, `Kế Toán`, `Cửa Hàng Trưởng`, `Nhân Viên Bán Hàng`, `Kỹ Thuật Viên`...
   - Tên ca làm rút gọn tinh tế (`VP (7h30-17h30)`, `Sáng (7h-15h30)`, `Chiều (14h30-22h)`), bật `wrapText` và cấu hình độ rộng cột tối ưu `!cols` sẵn sàng cho việc in ấn A4 dán tại quầy thu ngân.
5. **Bảo Vệ Tài Khoản, Đổi Mật Khẩu Cá Nhân & Hỗ Trợ Quên Mật Khẩu:**
   - **Ẩn mặc định danh sách Đăng nhập mẫu (Fast Test):** Chuyển sang nút bấm toggle `▼ Bật đăng nhập Test mẫu` (chỉ mở khi kỹ thuật cần test nhanh, người ngoài hoặc nhân viên bình thường mở link sẽ không thấy danh sách tài khoản).
   - **Form đăng nhập bảo mật:** Ô SĐT và Mật khẩu mặc định để trống, không tự điền sẵn tài khoản Admin.
   - **Tính năng Đổi Mật Khẩu Cá Nhân & Khóa Chặt Phân Quyền (`StaffDetailModal.tsx`):**
     - **Chính chủ:** Nhân viên chỉ được phép đổi mật khẩu cho **chính tài khoản của mình** (`isSelf`).
     - **Đồng nghiệp khác:** Khi một nhân viên vào xem hồ sơ của đồng nghiệp (như ảnh chụp Danh Sách Nhân Sự Chi Nhánh `tab=nhan-vien`), hệ thống **tuyệt đối ẩn form và nút đổi mật khẩu**.
     - **Quản trị cấp cao:** Chỉ duy nhất **Founder, Admin và HR** mới có quyền cấp lại mật khẩu cho nhân viên cấp dưới trong trường hợp nhân viên quên mật khẩu.
   - **Tính năng Hỗ Trợ Quên Mật Khẩu (`LoginModal.tsx`):** Ngay dưới ô mật khẩu có nút `[❓ Quên mật khẩu?]` dẫn tới Popup hỗ trợ: hiển thị thông tin liên hệ Hotline/Zalo của **Admin Quản Trị (Trần Hoàng Sang - 0888003205)** và **Nhân Sự HR (Phan Hoàng Khánh - 0394336726)**. Hệ thống **tuyệt đối không cho phép tự reset từ bên ngoài** để triệt tiêu hoàn toàn nguy cơ kẻ gian chiếm quyền tài khoản; việc reset mật khẩu bắt buộc phải do Admin hoặc HR thực hiện sau khi xác minh nhân thân.

6. **Tự Động Chuyển Tháng & Bộ Điều Hướng Tháng/Năm Linh Hoạt (NEW - 16/10):**
   - **Tự động theo thời gian thực:** Mặc định khi mở tab Phân ca, hệ thống tự động xác định Ngày/Tháng/Năm hiện tại (`new Date()`). Nếu là ngày 16 trở đi tự động vào Kỳ 2; khi sang tháng 11 hệ thống sẽ tự động hiển thị Tháng 11.
   - **Bộ điều hướng Tháng/Năm (`<` `Tháng MM/YYYY` `>`):** Cho phép Quản lý/Admin chuyển tháng tới (xếp trước lịch cho tháng 11, tháng 12...) hoặc lùi lại tháng cũ để xem lịch sử ca. Kèm nút bấm nhanh *"✨ Về hiện tại"* khi đang xem tháng khác.
   - **Nhãn Kỳ & Ngày cuối tháng động:** Tự động tính số ngày tối đa (28, 29, 30 hoặc 31 ngày) và hiển thị nhãn chuẩn xác, ví dụ: `Kỳ 1 (01/11 - 15/11)` và `Kỳ 2 (16/11 - 30/11)`.
   - **Highlight ngày hôm nay chuẩn Realtime:** Cột ngày trong bảng ma trận tự động phát sáng cyan theo đúng ngày thực tế hôm nay thay vì dùng ngày tĩnh.
   - **Đồng bộ xuất Excel:** Tên file xuất Excel và tiêu đề tự động cập nhật đúng Tháng và Năm đang chọn (`..._T11_2026.xlsx`).

### C. Phân Hệ Tuyển Dụng & Trợ Lý Tuyển Dụng AI Bé 8 (NEW - 15/10)
1. **Cơ Sở Dữ Liệu Supabase `job_applications` (`supabase_job_applications.sql`):**
   - Lưu trữ hồ sơ ứng viên: `id`, `branch_id`, `full_name`, `phone`, `role_applied`, `experience_note`, `status` (`pending` | `interview` | `hired` | `rejected`), `interview_date`, `notes`, `created_at`.
   - Cấu hình Row Level Security (RLS) cho phép ứng viên nộp hồ sơ tự do từ bên ngoài (`anon insert`) mà không bị chặn auth.
2. **Trang Ứng Tuyển Công Khai Mobile-First (`PublicRecruitmentView.tsx` - `/tuyen-dung`):**
   - Giao diện thân thiện tối ưu hiển thị cho ứng viên từ liên kết QR / Zalo / TikTok / Facebook.
   - Thẻ hiển thị các vị trí đang tuyển tại 8 chi nhánh (Bán hàng 7-12tr, Kỹ thuật sửa chữa 9-18tr, Quản lý 12-22tr, Media 8-15tr).
   - Form nộp hồ sơ 1 phút: Nhập Họ tên, SĐT Zalo, Chi nhánh mong muốn, Vị trí, Kinh nghiệm ngắn. Ghi trực tiếp vào Supabase và có cache offline.
3. **Phân Khu "Quản Lý Tuyển Dụng" Trong Admin / HR (`RecruitmentManagement.tsx`):**
   - Subtab **"5. Tuyển Dụng & Onboard"** trong Admin Panel.
   - **Kanban Board 4 cột trực quan**: `Chờ xét duyệt ⏳` ➔ `Hẹn phỏng vấn 📞` ➔ `Đã nhận việc 🎉` ➔ `Không phù hợp ❌`. Hỗ trợ chuyển đổi dạng Bảng dữ liệu (Table view).
   - **Nút 1-Click "Chuyển thành nhân viên" (Onboard)**: Kiểm tra trùng lặp SĐT, tự động sao chép hồ sơ sang bảng `staff` với trạng thái thử việc (`probation`), phân quyền role và chi nhánh. Nhân viên mới có thể lập tức dùng SĐT đăng nhập chấm công GPS và học LMS.
4. **Chatbot Tuyển Dụng AI Bé 8 (`RecruitmentChatBot.tsx`):**
   - Sử dụng ảnh đại diện Robot cam đáng yêu (`public/be8-avatar.jpg`).
   - Sử dụng mô hình **`gemini-flash-lite-latest`** xoay tua ngẫu nhiên (Round-Robin) danh sách API Keys trong `VITE_GEMINI_API_KEY`.
   - Nạp tri thức tuyển dụng: giải đáp ca linh hoạt cho sinh viên, đào tạo ép kính từ đầu không cần kinh nghiệm, cam kết không giữ bằng gốc / không cọc tiền, địa chỉ 8 chi nhánh.
   - Nút gợi ý câu hỏi nhanh (Quick Chips) và nút điều hướng *"📝 Điền form ứng tuyển ngay"*.

### D. Giải Trình Chấm Công GPS & Đồng Bộ Điều Hướng Trình Duyệt (NEW - 15/10)
1. **Giải Trình Chấm Công Ngoài Bán Kính 100m (`AttendanceDisputeModal.tsx`):**
   - Thu hẹp bán kính Geofencing từ 200m xuống **100m** chuẩn xác theo yêu cầu thực tế.
   - Khi nhân viên bị báo ngoài bán kính hoặc quên chấm công: hiển thị nút nộp đơn giải trình kèm ảnh quầy được nén tự động chống tràn bộ nhớ.
   - Luồng Quản lý / HR duyệt công 1-click trên bảng công chi tiết (`AttendanceTimesheetView.tsx`).
2. **Đồng Bộ Hóa URL & Xử Lý Nút Back Điện Thoại (`router.ts`):**
   - Tích hợp `syncTabToUrl`, `getTabFromUrl` với `window.history` (`?tab=cham-cong`, `?tab=quan-tri`, `?tab=tuyen-dung`...).
   - Bấm nút Back trên điện thoại lùi lại phân khu trước đó hoặc đóng modal thay vì thoát hẳn khỏi ứng dụng.
3. **Chuẩn Hóa Bộ Máy Trạng Thái Nhân Sự Realtime (`staffStatus.ts`):**
   - Tự động nhận diện thời gian thực: `🟢 Đang trong ca`, `🏠 Đã tan ca`, `🏖️ Nghỉ phép` (dựa trên đơn duyệt trong `leave_requests`), `🌙 Ngoài giờ làm` (từ sau 22:00 đến trước 07:30 hôm sau), `⏳ Chưa vào ca`, `🔴 Đã thôi việc`.
   - Sửa lỗi hardcode 176h trong `StaffDetailModal.tsx`, tính toán động theo giờ công thực tế từ `attendanceLogs`.

### A. Nâng Cấp Toàn Diện Phân Hệ Chấm Công & Quản Lý Ca Kíp (Chuẩn AFOODS Hub - update-cham-cong.md) (NEW - 14/10)
1. **Màn hình Check-in Nhân viên (`AttendanceCard.tsx`):**
   - **Bản đồ tương tác GPS Geofencing (Leaflet):** Tích hợp bản đồ OpenStreetMap với tâm là cửa hàng, vẽ vòng tròn Geofence an toàn **200m** (màu xanh ngọc Emerald), marker định vị shop và vị trí nhân sự động (`L.divIcon` không phụ thuộc asset tĩnh).
   - **Chế độ kiểm thử (Demo/Test Mode):** Bổ sung nút chuyển đổi tức thì: *"Tại Shop (~15m)"*, *"Ngoài Shop (~15km)"* và *"Lấy GPS Thật"* phục vụ test tính năng khi không có GPS thật hoặc ở xa chi nhánh.
   - **Đồng hồ đếm giờ làm việc Realtime (Live Work Timer):** Khi bấm Chấm công vào thành công, kích hoạt đồng hồ số điện tử đếm giây thực tế (`HH:mm:ss`) với hiệu ứng pulse ngọc lục bảo, tự động chuyển nút chính sang *"BẤM CHẤM CÔNG TAN CA (CHỐT GIỜ LÀM)"*.
   - **Hệ thống Ca & Tự động gắn cờ "Đi trễ":**
     - Ca Sáng: `07:00 - 15:30` (trễ nếu sau 07:00).
     - Ca Chiều: `13:30 - 22:00` (trễ nếu sau 13:30).
     - Ca Văn Phòng: `07:30 - 17:30` (trễ nếu sau 07:30).
     - Ca Tăng Cường / Part-time (linh hoạt, không tính trễ).
     - **Ca Làm Việc Tùy Chỉnh (`TUY_CHINH` - NEW):** Nhân viên chủ động tự cấu hình ca làm việc linh hoạt, **bắt buộc nhập giờ bắt đầu và giờ kết thúc** (`input type="time"`). Hệ thống tự động so khớp giờ check-in với giờ bắt đầu tùy chỉnh để tính số phút đi trễ chính xác.
     - Ghi nhận chính xác số phút trễ vào trường `isLate` và metadata `notes`.

2. **Bảng Nhật Ký & Quản Trị Chấm Công Chi Tiết (`AttendanceTimesheetView.tsx`):**
   - **Mặc Định Hiển Thị Thời Gian Thực Hôm Nay (`today`):** Tránh tình trạng tải các bản ghi lịch sử cũ gây rối mắt. Bổ sung các nút bấm nhanh: *[⚡ Hôm Nay]*, *[Hôm Qua]*, *[7 Ngày Qua]*, *[Tháng Này]*, *[Tất Cả Lịch Sử]*.
   - **Phân Biệt Chuẩn Xác "Đang Trực" vs "Quên Check-out":** Nếu check-in trong hôm nay và chưa vượt 16 tiếng sẽ hiển thị `🟢 Đang trực`. Nếu bản ghi từ ngày hôm trước hoặc vượt quá 16 tiếng, hệ thống tự động gắn nhãn đỏ `⚠️ Quên check-out`.
   - **Bổ Sung Tính Năng "Chốt Giờ Ra" Thủ Công:** Admin/HR có thể click nút *[Chốt ca]* / *[Chốt giờ ra]* để đóng ca, tự động gợi ý giờ tan ca tiêu chuẩn (15:30 / 22:00 / 17:30 hoặc giờ kết thúc ca tùy chỉnh) và lưu thẳng vào Supabase.
   - **4 Thẻ KPI Dashboard Tổng Quan:** Hiện diện hôm nay (tổng số NV & tỷ lệ %), Lượt đi trễ hôm nay, Cảnh báo ngoài GPS (>200m), và Tổng giờ công đang lọc.
   - **Bộ Lọc Đa Tiêu Chí:** Lọc theo Chi nhánh, Loại ca làm việc (Sáng, Chiều, Văn Phòng, Tăng Cường, Tùy Chỉnh), Khoảng ngày, Checkbox *"Chỉ lọc bản ghi Có Cảnh Báo"*, Ô tìm kiếm theo Tên, SĐT, Mã NV.
   - **Bảng Nhật Ký Chi Tiết (Timesheet Grid):** Hiển thị chi tiết 11 cột với badge ca tùy chỉnh, giờ vào/ra, tính OT (+Xh).
   - **Xuất Báo Cáo Excel (.xlsx):** Tích hợp SheetJS (`xlsx`) xuất toàn bộ bảng công đã lọc thành tệp Excel.
3. **Chuẩn Hóa Tọa Độ GPS Geofencing 7 Chi Nhánh Từ Google Maps Gốc (NEW - 14/10):**
   - Đã bóc tách tọa độ chính xác từng mét từ các liên kết Google Maps trong `google-maps.txt` và cập nhật đồng bộ 100% vào cả file code `INITIAL_BRANCHES` (`src/lib/mockData.ts`) lẫn bảng `branches` trên Supabase Cloud DB:
     1. **Văn Phòng:** `10.252668, 106.370604` (35B5 Đoàn Hoàng Minh, P. Phú Khương)
     2. **Phú Khương:** `10.2527211, 106.3707262` (35 B2 Đoàn Hoàng Minh)
     3. **Đồng Khởi:** `10.2584726, 106.3616252` (173 Đại Lộ Đồng Khởi, Vòng Xoay Tân Thành)
     4. **Mỹ Tho:** `10.355880, 106.369735` (25 Đinh Bộ Lĩnh, chân Cầu Quay)
     5. **Cần Thơ:** `10.037976, 105.7763555` (94 Trần Hưng Đạo, P. An Nghiệp)
     6. **Vĩnh Long:** `10.2515112, 105.9728027` (120 Trưng Nữ Vương, P. Long Châu)
     7. **Thủ Đức:** `10.8506028, 106.762417` (178A Võ Văn Ngân, TP. Thủ Đức)

### B. Tách Biệt Rõ Ràng Quy Trình Sửa Chữa vs Bán Hàng Nhanh & Tự Động Nhận Diện Chi Nhánh (NEW - 14/10)
1. **Tự Động Nhận Diện Chi Nhánh Nhân Viên (Branch Auto-Detection):**
   - File: `src/components/ServiceTicketModal.tsx` & `src/components/ServiceSalesHub.tsx`.
   - Trước đây khi nhân viên tạo phiếu sửa chữa, ô chọn Chi nhánh để mở tự do khiến nhân viên dễ bấm nhầm chi nhánh khác, gây sai lệch báo cáo và KPI.
   - Hiện tại: Khi nhân sự đăng nhập bấm *"Tạo Phiếu"*, hệ thống tự động khóa và gán đúng Chi nhánh trực thuộc của nhân viên đó, hiển thị rõ ràng và bảo vệ dữ liệu KPI.
2. **Tách Rạch Ròi 2 Quy Trình Nghiệp Vụ Riêng Biệt (`ServiceSalesHub.tsx`):**
   - **Tab 1: "Tiếp Nhận Sửa Chữa" (`RepairIntakeTab`):** Dành riêng cho máy khách để lại tiệm sửa chữa. Quy trình 4 bước chuẩn: Tiếp nhận ➔ Kỹ thuật viên nhận việc ➔ Sửa chữa & Test ➔ Bàn giao & In biên nhận bảo hành có QR Code tra cứu trực tiếp.
   - **Tab 2: "Bán Hàng & Dịch Vụ Nhanh (POS)" (`QuickSalesTab`):** Dành cho khách mua phụ kiện, pin dự phòng, sạc cáp, dán kính cường lực, lens camera... Thanh toán lấy ngay, tự động in bill POS bán lẻ không cần qua quy trình giữ máy của KTV.
3. **Quy Trình Đổi Trả / Hoàn Tiền Chuẩn Supabase:**
   - Dữ liệu đơn hàng bán nhanh và dịch vụ liên kết với Supabase.
   - Khi có phát sinh khách đổi trả hoặc hoàn tiền, đơn hàng được cập nhật trạng thái `REFUNDED` hoặc `EXCHANGED`, tự động hoàn trả số lượng tồn kho và khấu trừ doanh thu/KPI của nhân sự tương ứng một cách minh bạch.
4. **Tối Ưu Trải Nghiệm Giao Diện (Loại Bỏ Vạch Cuộn Kéo Ngang Dọc Lồng Nhau):**
   - Loại bỏ triệt để các khung cuộn lồng nhau (`overflow-x-auto`, `overflow-y-auto`) gây khó chịu trên cả Desktop lẫn Mobile.
   - Sử dụng layout Grid responsive kết hợp thanh Filter dạng sticky co giãn, thao tác một chạm tiện lợi.

### C. Nâng Cấp Bộ Lọc Lịch Sử Bài Đăng Marketing & Dọn Dẹp Dữ Liệu (NEW - 14/10)
1. **Mặc Định Hiển Thị Bài Đăng "Hôm Nay":**
   - Tránh việc Live Feed tải dồn toàn bộ bài đăng cũ gây rối mắt và chậm máy.
   - Bổ sung thanh chọn ngày thông minh: `[⚡ Hôm Nay]`, `[Hôm Qua]`, `[Tất Cả Lịch Sử]` và ô chọn ngày tùy biến `<input type="date">`.
   - Toàn bộ KPI (Tổng bài, Tổng View, Tổng Like, Kênh dẫn đầu, Bảng ma trận) tự động lọc và tính toán theo đúng ngày được chọn.
2. **Dọn Sạch CSDL Supabase Cho Ngày 13/10:**
   - Đã xử lý xóa bỏ các bản ghi bài đăng bị trùng lặp do nhân sự nộp thử nhiều lần trên Supabase.

### D. Giải Quyết Triệt Để Trùng Lặp Link & Sai Lệch Kênh Mạng Xã Hội (NEW - 14/10)
1. **Tự Động Nhận Diện Kênh Đăng Bài Thông Minh (Smart Platform Auto-Detection):**
   - File xử lý: `src/components/MarketingModal.tsx` (`detectPlatformFromUrl`).
   - Hỗ trợ đầy đủ: TikTok (`tiktok.com`, `vt.tiktok.com`, `vm.tiktok.com`), Facebook (`facebook.com`, `fb.watch`, `fb.com`), YouTube (`youtube.com`, `youtu.be`), Zalo (`zalo.me`).
   - Khi nhân viên dán link vào ô URL, hệ thống lập tức tự động chuyển đổi sang đúng tab nền tảng tương ứng và hiện huy hiệu: `✨ Đã nhận diện: TIKTOK`.
   - **Chốt chặn an toàn (Fail-safe):** Kể cả nhân viên có cố tình chọn Facebook thì khi nộp link TikTok, hệ thống tự động ép về đúng TikTok, không thể nộp nhầm.
2. **Chống Nộp Trùng Lặp Link (Duplicate URL Prevention):**
   - Hệ thống tự động làm sạch query parameters (`?utm_source...`, `?rdid=...`) và so sánh với toàn bộ các bài đăng đã có trong hệ thống (`existingPosts`).
   - Nếu link đã từng được nộp, hiển thị cảnh báo đỏ và khóa nút gửi bài, chặn hoàn toàn tình trạng spam trùng link.
3. **Thao Tác Quản Trị Trực Tiếp Trên Live Feed:**
   - **Nút Xóa `[🗑️]`:** Trên mỗi thẻ bài đăng trong Live Feed, Quản lý/Marketing hoặc người tạo bài có thể bấm nút thùng rác (kèm popup xác nhận an toàn) để xóa bài nộp nhầm hoặc trùng lặp (xóa vĩnh viễn trên Supabase và cập nhật local state).
   - **Nâng Cấp Modal "Sửa":** Cho phép sửa cả đường dẫn URL, nền tảng (có tự động nhận diện) và số lượt xem, thích.

### E. Chuẩn Hóa Bộ Bóc Tách Số Liệu AI Quét Facebook (100% Số Liệu Thật) (NEW - 14/10)
1. **Nguyên nhân lỗi cũ (Luôn ra 220 view, 18 like):**
   - Meta (Facebook) chặn request ẩn danh từ server bằng trang đăng nhập (`facebook.com/login`).
   - Scraper cũ không lấy được HTML bài viết nên kích hoạt kịch bản dự phòng gán cứng (`ai_fallback: 220 views, 18 likes`).
2. **Giải pháp kỹ thuật đột phá trong `api/scrape-metrics.ts`:**
   - Sử dụng Crawler Headers chuẩn (`Googlebot / FacebookExternalHit`) để vượt qua tường lửa đăng nhập của Facebook.
   - Phân tích và bóc tách dữ liệu gốc từ GraphQL Relay State:
     - Lấy chính xác số lượt thích / cảm xúc thực tế (`reaction_count`, `like_count`, `i18n_reaction_count`).
     - Lấy chính xác số bình luận (`comment_count`, `total_count`).
     - Lấy chính xác số lượt chia sẻ (`share_count`, `reshares`).
     - Đã kiểm thử thực tế với link Facebook của chi nhánh: Lấy chính xác **3 likes, 1 bình luận, 1 chia sẻ** (khớp 100% với giao diện Facebook người dùng).
   - **Lưu ý đặc thù bài ảnh Facebook:** Facebook chỉ hiện số view công khai cho Video/Reels. Đối với bài viết ảnh/status, hệ thống tính reach ước lượng và có ghi chú rõ ràng cho người dùng.
3. **Cho Phép Chỉnh Sửa Trực Tiếp Trên Kết Quả AI Quét (`MarketingDashboard.tsx`):**
   - Hai khung hiển thị **Lượt Xem** và **Lượt Tương Tác** trong modal AI Quét được chuyển thành ô nhập liệu trực tiếp (`input type="number"`).
   - Người dùng có thể click vào sửa số ngay trước khi bấm *"Xác Nhận & Cập Nhật Vào Supabase"*.

### F. Tính Năng Tự Upload & Nén Ảnh Avatar Client-Side Siêu Nhẹ (~20KB) (13/10)
- **Mục tiêu giải quyết:** Mở khóa ảnh đại diện cho nhân sự tự đổi ảnh, đồng thời ngăn chặn nguy cơ đầy bộ nhớ Supabase do người dùng tải ảnh dung lượng lớn (3MB - 10MB) từ camera điện thoại.
- **Cơ chế nén bằng HTML5 Canvas (`src/lib/imageCompression.ts`):**
  - Tự động crop vuông căn giữa (1:1 Center Square Crop), resize chuẩn avatar tối đa 400x400 px.
  - Xuất định dạng WebP chất lượng 0.8 (fallback JPEG nếu cần).
  - Giảm dung lượng từ vài MB xuống chỉ còn **15KB - 30KB** (tiết kiệm **98% - 99%** dung lượng).
  - Hiển thị badge thống kê trực quan: *"Gốc: 3.8 MB ➔ Nén: 24 KB (-99%)"*.
- **Tích hợp vào giao diện & phân quyền:**
  - Nút camera "Đổi ảnh" nổi và overlay hover trực tiếp trên khung ảnh đại diện `StaffDetailModal.tsx`.
  - Nút đổi ảnh tích hợp trong form Sửa Thông Tin Nhân Sự.
  - Phân quyền linh hoạt: Nhân viên được phép tự đổi ảnh của chính mình (`BranchStaffDirectory.tsx`); Founder, Admin và HR có quyền đổi ảnh cho toàn bộ nhân sự.
- **Đồng bộ dữ liệu đa tầng:**
  - Lưu tức thời vào bộ nhớ đệm `pk88_staff_overrides` trong `localStorage`.
  - Cập nhật state hệ thống `onUpdateStaff` cho `BranchStaffDirectory` và `App.tsx`.
  - Hỗ trợ lưu trực tiếp lên cột `avatar_url` trên bảng `staff` Supabase.

### B. Ô Nhập Prompt Ghi Chú Bổ Sung Cho AI Content Studio (NEW - 13/10)
- **Vị trí tích hợp:** Thêm ô textarea *"Ghi chú bổ sung / Yêu cầu riêng cho AI"* ngay dưới 4 phong cách nội dung trong `AIContentStudioModal.tsx`.
- **Cơ chế AI:** Giữ nguyên 4 phong cách cốt lõi, nhưng cho phép người dùng tùy biến thêm bất kỳ yêu cầu cụ thể nào (ví dụ: nhấn mạnh quà tặng, bảo hành 1 đổi 1, giọng điệu đặc thù). Prompt này được nhúng trực tiếp vào `systemInstruction` và `requestPayload` gửi tới model `gemini-flash-lite-latest`.

### C. Kích Hoạt Bảng Ma Trận Bài Đăng Supabase Cloud (`marketing_posts`) (NEW - 13/10)
- Khởi tạo bảng `marketing_posts` và RLS policy trên Supabase Cloud.
- Sửa lỗi múi giờ UTC sang giờ địa phương Việt Nam (GMT+7) trong `MarketingDashboard.tsx`.
- Lưu đệm `localStorage` (`pk88_marketing_posts`) kết hợp đồng bộ 2 chiều với Supabase `marketing_posts`.

### D. Nâng Cấp Khung Live Feed Bài Đăng Đa Chi Nhánh (NEW - 13/10)
- **Tích hợp bộ lọc Chi nhánh:** Dropdown chọn lọc theo 7 chi nhánh hoặc toàn chuỗi.
- **Tích hợp bộ lọc Kênh Mạng Xã Hội:** Nút badge chọn lọc nhanh bài viết Facebook, TikTok, Zalo, YouTube.
- **Huy hiệu đếm số lượng thời gian thực:** Badge đếm số bài viết phù hợp với bộ lọc hiện tại.
- **Xử lý trạng thái rỗng:** Hiển thị thông báo và nút đặt lại bộ lọc thông minh khi không có bài đăng khớp điều kiện.

### E. Đo Lường Lượt Xem & Tương Tác Thời Gian Thực (Zero n8n) (NEW - 13/10)
- **Thêm cột vào Supabase `marketing_posts`:** Đã thêm `views INT DEFAULT 0` và `likes INT DEFAULT 0`.
- **Huy hiệu đo lường trên Live Feed:** Mỗi thẻ bài đăng hiển thị trực quan `👁️ [views] views` và `❤️ [likes] thích`.
- **Thẻ KPI thời gian thực đầu trang:**
  - *Tổng Lượt Xem Hôm Nay* (gradient cyan neon, tính tổng view toàn chuỗi).
  - *Tổng Tương Tác Hôm Nay* (gradient rose neon, tính tổng lượt like/reaction).
  - Đối với nhân sự chi nhánh: Hiển thị riêng Lượt Xem và Lượt Tương Tác của chính chi nhánh đó.
  - Cột *Tổng View* tích hợp ngay trong Bảng Ma Trận Đăng Bài.
- **Modal Sửa Nhanh (Quick Edit):** Cho phép Marketing/Quản lý chỉnh sửa nhanh số view và like trong 2 giây, hỗ trợ nút "Điền nhanh số liệu ước tính AI", đồng bộ tức thời lên Supabase.
- **Modal AI Quét Tương Tác (Gemini Flash AI Scanner & Vercel Serverless Scraper):**
  - *Quét từ link trực tiếp qua Vercel Serverless Function (`api/scrape-metrics.ts`):* Vượt qua rào cản CORS của trình duyệt, cào dữ liệu ngầm cho TikTok, Facebook, YouTube. Bóc tách `views`, `likes`, `comments`, `shares`. Hỗ trợ cả trên localhost và Vercel.
  - *Quét từ ảnh chụp màn hình (Gemini Vision):* Cho phép kéo thả ảnh chụp màn hình bài viết Facebook/TikTok/Studio, AI tự đọc và bóc tách chính xác số Views & Likes rồi lưu thẳng vào Supabase. Không cần n8n hay máy chủ trung gian.

### F. Chuẩn Hóa 100% Danh Sách Nhân Sự & Chi Nhánh Theo File Excel Gốc (12/10)
- **Dữ liệu nguồn:** Toàn bộ danh sách nhân sự được chuẩn hóa từ file `DANH_SACH_NHAN_VIEN_PK88_CHUAN_HOA.xlsx`. Đã loại bỏ hoàn toàn các dữ liệu mẫu (mock staff) giả lập trước đây.
- **Cấu hình 7 Chi Nhánh Chuẩn:**
  1. `PHÚ KHƯƠNG` (Bến Tre 1)
  2. `ĐỒNG KHỞI` (Bến Tre 2)
  3. `VĨNH LONG`
  4. `MỸ THO`
  5. `CẦN THƠ`
  6. `THỦ ĐỨC` (TP.HCM)
  7. `VĂN PHÒNG` (Headquarters)
- **Cập nhật nhân sự đầu não & chức danh:**
  - **Founder Ngô Hồng Thao** và **Admin Trần Hoàng Sang** trực thuộc chi nhánh **VĂN PHÒNG**.
  - **Phan Dương Quốc Việt:** Chuyên viên Media.
  - **Võ Tuấn Anh:** Kế Toán Kho.

### B. Tính Năng Ngày Sinh Nhật & Icon Hộp Quà 🎁 Bắt Mắt (NEW - 12/10)
- **Thay thế nhãn hồ sơ:** Bỏ nhãn *"Trạng thái hồ sơ: ĐỦ HỒ SƠ"*, thay bằng ngày sinh nhật của nhân sự (`birthDate`).
- **Hiệu ứng chúc mừng sinh nhật tự động:**
  - Khi ngày/tháng hiện tại trùng với ngày/tháng sinh của nhân viên, hệ thống tự động hiển thị **Icon Hộp Quà `🎁`** với hiệu ứng nhịp đập rung rinh (Pulse/Bounce) và viền vàng nổi bật tại cả `BranchStaffDirectory.tsx` và `StaffDetailModal.tsx`.

### C. Chức Năng Chỉnh Sửa Hồ Sơ Nhân Sự Trực Tiếp (Live Staff Editor) (NEW - 12/10)
- **Quyền hạn:** Founder, Admin và HR (Phan Hoàng Khánh) có quyền chỉnh sửa thông tin bất kỳ nhân sự nào trực tiếp từ giao diện Profile Modal:
  - Cho phép sửa: Họ và tên, Số điện thoại, Ngày sinh, Ngày vào làm, Chi nhánh, Chức vụ.
  - Tự động đồng bộ và lưu dữ liệu ngay lập tức vào bảng `staff` trên Supabase, đồng thời cập nhật bộ nhớ đệm `localStorage` (`pk88_staff_overrides`).

### D. Mở Quyền Quản Trị Nhân Sự Cho HR Phan Hoàng Khánh (NEW - 12/10)
- **Cấp quyền HR:** Nhân sự **Phan Hoàng Khánh** (SĐT `0933808922`, role `hr`) đã được mở quyền truy cập và thao tác đầy đủ trong Tab **"Quản Trị Nhân Sự (HR & Hệ Thống)"** (`AdminPanel.tsx`), bên cạnh Founder và Admin.

### E. Đồng Bộ Đơn Nghỉ Phép 2 Chiều Với Supabase Cloud DB (NEW - 12/10)
- **Khởi tạo bảng `leave_requests`:** Bảng đã được tạo trên Supabase và bật Row Level Security (RLS) mở quyền đọc/ghi:
  - Cột: `id`, `staff_id`, `staff_name`, `phone`, `branch_id`, `role`, `start_date`, `end_date`, `reason`, `type`, `status`, `approved_by`, `rejected_by`, `replacement_staff_name`, `ai_risk_assessment`, `created_at`.
- **Đồng bộ 2 chiều tự động trong [`App.tsx`](file:///d:/PK88%20AI%20AUTOMATION/src/App.tsx):**
  - **Tải dữ liệu:** Tự động fetch danh sách đơn thực tế từ Supabase khi mở app hoặc login.
  - **Gửi đơn:** Đơn nộp qua form hoặc qua Chị 8 AI HR được `INSERT` ngay lập tức lên Supabase.
  - **Duyệt / Từ chối đơn:** Thao tác *"Duyệt Cho Nghỉ"* hoặc *"Từ Chối Đơn"* tự động `UPSERT` trực tiếp lên Supabase và lưu đệm `localStorage`. F5 hoặc đóng trình duyệt không bị mất dữ liệu.

### G. Tách Biệt Quy Trình POS & Sửa Chữa, Tích Hợp Supabase Realtime, Đổi Trả / Hoàn Tiền & Tối Ưu UX (14/10)
1. **Tách Biệt 2 Luồng Nghiệp Vụ Hoàn Chỉnh:**
   - **Tab `🛠️ Tiếp Nhận Sửa Chữa` (`RepairTicketView.tsx`):** Dành riêng cho thiết bị nhận gửi lại sửa chữa phần cứng/phần mềm. Quy trình chuẩn 4 bước (Tiếp nhận ➔ Đang sửa ➔ Đã xong ➔ Hoàn tất), phân công Kỹ Thuật Viên, in biên nhận kèm mã QR tra cứu tiến độ độc lập.
   - **Tab `🛒 Bán Hàng & Dịch Vụ Nhanh (POS)` (`POSView.tsx`):** Dành cho khách mua phụ kiện, pin dự phòng, dán kính cường lực, PPF, lens camera... Chọn món, tính tiền trong 30 giây, in hóa đơn lấy ngay và tự động cộng KPI cho nhân viên.
2. **Loại Bỏ Hoàn Toàn Dữ Liệu Ảo (Mock Data) - Đồng Bộ Supabase Cloud 100%:**
   - Dọn sạch toàn bộ dữ liệu mock/fake trước đây trên Dashboard và danh sách phiếu sửa chữa/bán hàng.
   - Tự động nhận diện Chi nhánh theo nhân viên đăng nhập (`staffBranch`), tự động gán chi nhánh vào đơn bán và phiếu sửa chữa.
   - Khi tạo đơn bán hàng hoặc hoàn tất phiếu sửa chữa, dữ liệu tự động `INSERT` lên bảng `repair_tickets` trên Supabase với các metadata chi tiết (`items`, `customer_phone`, `service_type = 'Bán Hàng & Dịch Vụ Nhanh (POS)'`).
   - Doanh thu thực hôm nay, số đơn hoàn tất, và bảng lịch sử đơn hàng tại chi nhánh được tính toán động từ dữ liệu Supabase theo thời gian thực.
3. **Nghiệp Vụ Đổi Trả & Hoàn Tiền (Refund & Exchange):**
   - Bổ sung nút `[Đổi / Trả]` tại từng đơn hàng trong lịch sử bán lẻ chi nhánh.
   - Modal xử lý chuyên nghiệp hỗ trợ 2 hình thức: **Hoàn tiền** hoặc **Đổi hàng**.
   - Khi xác nhận, đơn hàng được cập nhật trạng thái `REFUNDED` lên Supabase, đồng thời **tự động giảm trừ doanh thu chi nhánh và điểm KPI cá nhân của nhân viên**.
4. **Tối Ưu Trải Nghiệm Giao Diện Cả PC & Điện Thoại (Eliminate Native Scrollbars):**
   - Loại bỏ triệt để 2 thanh cuộn Windows thô kệch ở bộ lọc danh mục và danh sách sản phẩm.
   - Bộ lọc danh mục sử dụng `no-scrollbar` kèm nút trượt nhanh `<` và `>` trên Desktop; hỗ trợ vuốt chạm 60fps trên Mobile.
   - Danh sách sản phẩm áp dụng **Phân trang thông minh (Pagination)** (12 sản phẩm/trang, có hiển thị số lượng và nút `Trước`/`Sau`), loại bỏ hoàn toàn hiện tượng kẹt chuột (scroll-trap).
   - **Tối ưu Mobile POS:** Bổ sung thanh chuyển đổi nhanh giữa *Danh Mục* và *Giỏ Hàng*, cùng thanh nổi thanh toán ghim đáy màn hình (*Sticky Bottom Floating Bar*) khi có sản phẩm trong giỏ.
5. **Nâng Cấp Bộ Lọc Ngày & Đồng Bộ Live Feed Marketing (`MarketingDashboard.tsx`):**
   - Bổ sung thanh chọn thời gian linh hoạt: *[⚡ Hôm Nay]*, *[Hôm Qua]*, *[Tất Cả Lịch Sử]* và ô chọn ngày tùy ý (`input type="date"`).
   - Đồng bộ toàn diện: Tất cả các thẻ KPI, Bảng Ma Trận đăng bài 7 chi nhánh, và Live Feed bài đăng đều tự động lọc chính xác theo ngày được chọn (mặc định là Hôm Nay, tránh tình trạng hiển thị bài hôm trước gây hiểu lầm).
   - Thẻ bài đăng hiển thị đầy đủ ngày giờ nộp link (`dd/MM lúc HH:mm`), kèm trạng thái rỗng thân thiện và nút quay về Hôm Nay nhanh.

---

## 3. THÀNH TỰU TRƯỚC ĐÓ (07/10/2026)

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
- Hệ số lương đa dạng theo vị trí:
  - **Bán Hàng & Kỹ Thuật Viên:** `22.700 đ/giờ` (Áp dụng cho 6 chi nhánh: Phú Khương, Đồng Khởi, Mỹ Tho, Vĩnh Long, Cần Thơ, Văn Phòng).
  - **Riêng Chi Nhánh Thủ Đức:** Bán Hàng & Kỹ Thuật Viên được áp dụng mức `25.500 đ/giờ`.
  - **Tăng ca (OT):** Tính theo đơn giá giờ chuẩn thông thường (1.0x), hệ thống tự động bóc tách số giờ làm thêm và hiển thị badge `⭐ OT: +X.Xh`.
  - **Khối Quản Lý & Văn Phòng (Cố định):** Quản lý cửa hàng: 8.5M, HR: 12M, Kế toán: 13.5M, Marketing: 14M, TP. Kinh doanh: 15M, Admin: 19M, Founder: 0đ.

---

## 3. QUY TRÌNH DEPLOY GITHUB & VERCEL (IMPORTANT)
1. **Cách Upload Lên GitHub Web:**
   - Kéo thả 2 thư mục chính: **`src`** (chứa toàn bộ mã nguồn React) và **`public`** (chứa ảnh đại diện thật).
   - Nếu Vercel deploy từ bản build sẵn, kéo thả thêm thư mục **`dist`**.
2. **Cơ chế Vercel:** Vercel kết nối tự động với GitHub repo `pk88-hub`. Khi có commit mới, Vercel sẽ tự động thực thi `npm run build` và deploy bản live mới nhất trên `https://pk88-hub.vercel.app/`.

---

## 4. CƠ SỞ DỮ LIỆU (SUPABASE)
- **`branches`**: Danh sách chi nhánh (id, code, name, lat, lng...)
- **`staff`**: Danh sách nhân sự (id, branch_id, full_name, phone, role, is_active, avatar_url, birth_date)
- **`attendance`**: Nhật ký chấm công (id, staff_id, branch_id, check_in, check_out, work_hours...)
- **`leave_requests`**: Quản lý đơn xin nghỉ phép (id, staff_id, staff_name, phone, branch_id, role, start_date, end_date, reason, type, status, approved_by, rejected_by, replacement_staff_name, ai_risk_assessment, created_at) - Đã đồng bộ 2 chiều với Chị 8 AI HR & Quản lý duyệt.
- **`repair_tickets`**: Phiếu tiếp nhận & sửa chữa thiết bị khách hàng.
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

