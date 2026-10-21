# AI HANDOVER REPORT - PK88 AUTOMATION PORTAL
*Ngày cập nhật mới nhất: 21/10/2026 (Vá Lỗ Hổng Bảo Mật Phân Quyền RBAC & Cách Ly Dữ Liệu Chi Nhánh Chấm Công, Khóa Cứng Lịch Trực Phân Ca, Nâng Cấp Check-in Bù Realtime & Đồng Bộ Tương Tác Marketing 3 Chỉ Số)*

Tài liệu này dùng để bàn giao bối cảnh, kiến trúc và tiến độ dự án cho các AI Agent tiếp theo nhằm duy trì tính liên tục của dự án.

---

## 1. TỔNG QUAN DỰ ÁN
- **Tên dự án:** PK88 Automation Portal (Hệ Thống Vận Hành Tự Động Hóa AI Chuỗi Phụ Kiện 88)
- **Mục tiêu:** Xây dựng hệ thống quản trị, chấm công bằng GPS Geofencing, quản lý nhân sự chuỗi (7 chi nhánh chuẩn hóa theo Excel), tính lương tự động đa vai trò, hồ sơ năng lực 5 chiều, thưởng nóng VietQR, duyệt đơn nghỉ phép tự động với Chị 8 AI HR, hệ thống LMS đào tạo nội bộ 60 ngày, phân hệ Tuyển dụng Onboarding thông minh, Ma trận Phân chia ca & Điều động nhân sự 15 ngày, Báo cáo vệ sinh cửa hàng bằng hình ảnh nén, và **Phân hệ Chatbot Tư Vấn Khách Hàng Độc Lập (Bé 8 AI CSKH) kèm Bảng Điều Phối Khách Hàng Chốt Đơn Telesales CRM**.
- **Tech Stack:** React 19 (TypeScript), Vite 6, Tailwind CSS, Supabase (PostgreSQL), Recharts, Lucide React, Leaflet, SheetJS (xlsx), Google Gemini AI (`gemini-flash-lite-latest`), Progressive Web App (PWA).
- **Triển khai (Deployment):** Đang chạy live trên Vercel qua GitHub (`pk88-hub`).
- **Domain/URL:** `https://pk88-hub.vercel.app/` | `http://localhost:3000/` | `http://localhost:3000/?tab=tu-van`

---

## 2. THÀNH TỰU ĐÃ HOÀN THÀNH (CẬP NHẬT 21/10/2026) - QUAN TRỌNG

### Q. Vá Lỗ Hổng Bảo Mật Phân Quyền RBAC, Khóa Cứng Lịch Trực Phân Ca & Nâng Cấp Vận Hành (HOÀN THÀNH 21/10/2026)

1. **Khắc Phục Lỗ Hổng Bảo Mật Phân Quyền RBAC & Cách Ly Dữ Liệu Chi Nhánh ([AttendanceTimesheetView.tsx](file:///c:/PK88%20AA/src/components/AttendanceTimesheetView.tsx)):**
   - **Vấn đề phát hiện:** Tài khoản Quản lý chi nhánh (Manager, ví dụ: Thùy Dương - Phú Khương) trước đó có thể chọn tùy chọn xem "🏢 Toàn Chuỗi (8 Chi Nhánh)" hoặc chuyển sang các chi nhánh khác, dẫn đến việc xem toàn bộ lịch chấm công của Khối Văn Phòng và chi nhánh khác. Nguy hiểm hơn, cột "Thao tác quản lý" cho phép Quản lý chi nhánh bấm nút "Chốt ca", "Chốt giờ ra" và nút xóa "🗑️" cho nhân viên Khối Văn Phòng và chi nhánh khác.
   - **Giải pháp bảo mật toàn diện:**
     + **Phân định thẩm quyền nghiêm ngặt:** Chỉ có Quản trị cấp cao (`founder`, `admin`, `hr`) mới được xem "Toàn Chuỗi" và thao tác chéo chi nhánh.
     + **Khóa cứng bộ lọc Chi Nhánh đối với CHT:** Ẩn hoàn toàn tùy chọn "Toàn Chuỗi" và các chi nhánh khác với Manager. Thay vào đó hiển thị thẻ cố định có huy hiệu `🔒 Cố định CHT`, luôn tự động ghim về chi nhánh của Quản lý.
     + **Cách ly dữ liệu cơ sở (`accessibleLogs`, `accessibleStaff`):** Dữ liệu nạp vào bảng và các chỉ số KPI (quân số, đi trễ hôm nay, cảnh báo ngoài GPS, tổng giờ công, giải trình chờ duyệt) của Quản lý chi nhánh chỉ giới hạn trong phạm vi chi nhánh phụ trách (không còn bị lộ thông tin của 36 nhân sự toàn chuỗi hay khối Văn Phòng).
     + **Tường lửa thao tác `canManageRecord(record)`:**
       * Nút "Chốt ca", "Chốt giờ ra", nút thùng rác "🗑️ Xóa bản ghi" và nút "Duyệt / Từ chối giải trình" chỉ hiển thị khi bản ghi thuộc đúng chi nhánh của Quản lý. Nếu là bản ghi ngoài thẩm quyền, giao diện chỉ hiển thị nhãn `Chỉ xem`.
       * Bổ sung chốt chặn guard trực tiếp trong tất cả các hàm xử lý dữ liệu (`handleOpenCheckoutModal`, `handleConfirmCheckout`, `handleApproveDisputeAction`, `handleConfirmRejectDispute`, `handleDeleteRecordAction`) để chặn đứng mọi can thiệp trái phép.

2. **Bắt Buộc Chấm Công Theo Lịch Trực Phân Ca Cố Định ([AttendanceCard.tsx](file:///c:/PK88%20AA/src/components/AttendanceCard.tsx)):**
   - **Vấn đề:** Nhân sự khi vào ca thường bấm chọn ca tùy tiện, không tuân thủ lịch trực đã được Cửa Hàng Trưởng và Ban Điều Hành xếp trước trên Ma Trận Chia Ca.
   - **Giải pháp:**
     + Thẻ Chấm Công GPS tự động kéo lịch phân ca của nhân sự trong ngày (`todayAssignment`) từ Cloud về.
     + Khi nhân sự đã có ca trực được duyệt trong ngày: Hệ thống **tự động khóa cứng ca làm việc theo đúng lịch trực**, đồng thời **ẩn hoàn toàn các nút tùy chọn đổi ca** (Ca sáng, Ca chiều, Ca hành chính, Ca tùy chỉnh...), buộc nhân sự phải check-in đúng ca quy định.

3. **Bổ Sung Chế Độ "🟢 Check-in Bù (Đang Làm Việc)" Linh Hoạt ([ShiftSchedulingMatrix.tsx](file:///c:/PK88%20AA/src/components/ShiftSchedulingMatrix.tsx)):**
   - **Vấn đề:** Khi nhân sự có đi làm đúng giờ nhưng quên mở app chấm công đầu ca, nếu Quản lý bấm "Chấm bù", hệ thống cũ lập tức gán cả giờ vào và giờ ra, khiến ca làm việc bị kết thúc sớm và tính đủ công dù chưa đến giờ tan ca thực tế.
   - **Giải pháp:**
     + Bổ sung thêm tùy chọn hành động **`🟢 Check-in bù (Đang làm việc)`** bên cạnh việc chốt bù đủ công.
     + Khi bấm tùy chọn này: Hệ thống chỉ tạo mốc `check_in` (giờ bắt đầu ca) và **bỏ trống `check_out`**, ghi chú rõ `[CHẤM BÙ ĐẦU CA - ĐANG LÀM VIỆC]`.
     + Thẻ Chấm Công của nhân viên lập tức nhận diện trạng thái "Đang làm việc", đồng hồ realtime tính giờ công trực tiếp tiếp tục chạy bình thường cho đến khi nhân viên tự bấm Chốt ca tan ca.

4. **Chuẩn Hóa Bộ 3 Chỉ Số Tương Tác Marketing Đa Kênh ([MarketingDashboard.tsx](file:///c:/PK88%20AA/src/components/MarketingDashboard.tsx)):**
   - Bổ sung hiển thị đầy đủ 3 chỉ số tương tác chuẩn: **Lượt thích (Likes)**, **Bình luận (Comments)** và **Lượt chia sẻ (Shares)** song song với Lượt xem (Views).
   - Đồng bộ xuyên suốt từ: Bảng Live Feed bài đăng, Bảng Ma Trận bài viết, Modal Chỉnh sửa nhanh (Quick Edit) và Trình quét thông minh AI Scanner.
   - Chạy migration cơ sở dữ liệu Supabase bổ sung 2 cột `comments` và `shares` vào bảng `marketing_posts`.

5. **Đồng Bộ Nghỉ Phép Tự Động Từ Chị 8 AI HR Sang Lịch Làm Việc & Thẻ Chấm Công:**
   - Cơ chế tự động liên kết khi đơn xin nghỉ phép được duyệt (`APPROVED`):
     + **Trên Ma Trận Chia Ca ([ShiftSchedulingMatrix.tsx](file:///c:/PK88%20AA/src/components/ShiftSchedulingMatrix.tsx)):** Tự động đè lên ô ngày tương ứng bằng thẻ `🏖️ Nghỉ Phép` hoặc `💊 Nghỉ Ốm`, hiển thị người trực thay `Thế: [Tên nhân sự]` hoặc người duyệt, miễn trừ chấm công không bị tính là vắng mặt/chưa chấm công.
     + **Trên Thẻ Chấm Công GPS ([AttendanceCard.tsx](file:///c:/PK88%20AA/src/components/AttendanceCard.tsx)):** Tự động hiển thị banner hồng trang trọng thông báo nhân sự đang trong kỳ nghỉ phép đã duyệt.

---

### P. Phân Hệ Chatbot Tư Vấn Khách Hàng Độc Lập (Bé 8 AI CSKH) & Bảng Điều Phối Chốt Đơn Telesales (HOÀN THÀNH 20/10/2026)
1. **Trang Chatbot Công Khai Độc Lập (`PublicCustomerChatView.tsx` - `/tu-van` hoặc `?tab=tu-van`):**
   - Hoạt động độc lập không yêu cầu đăng nhập, thiết kế chuẩn Mobile-First cực kỳ nhẹ và tải nhanh.
   - Sử dụng ảnh đại diện nhận diện chính thức `/be8-avatar.jpg` từ thư mục `public/`.
   - Kết nối "Bộ não" Gemini AI (`gemini-flash-lite-latest`) với kho tri thức 521 sản phẩm cleaned (`products.json`), dịch vụ sửa chữa ép kính lấy liền, thay pin bảo hành 12 tháng, cùng địa chỉ chính xác của 7 chi nhánh PK88.
   - Khách có thể chọn chi nhánh phục vụ gần nhất hoặc gọi điện trực tiếp qua Hotline `0919.982.861`.
   - Nút chia sẻ link 1 chạm để nhân viên / marketing dễ dàng sao chép đăng lên Facebook, TikTok Bio, Zalo OA hoặc tạo mã QR tại cửa hàng.

2. **Chiến Lược Lấy Số Điện Thoại & E-Voucher Điện Tử (Lead Capture):**
   - AI Bé 8 tự động tư vấn nhiệt tình rồi khuyên khách để lại Tên + SĐT để giữ hàng và kích hoạt mã giảm giá.
   - Nhận diện tự động số điện thoại gửi trong khung chat hoặc qua Popup E-Voucher.
   - Tự động sinh mã voucher độc quyền chuẩn chuỗi `PK88-VIPxxxx` (giảm 10% hóa đơn) hiển thị trực tiếp cho khách.

3. **Cơ Sở Dữ Liệu Supabase Cloud Bảng `leads` (SSOT):**
   - Lưu trữ tức thì vào bảng `leads` trên Supabase Cloud kèm lưu trữ dự phòng `localStorage`.
   - Cấu hình phân quyền Row Level Security (RLS) cho phép khách nộp ẩn danh (`anon INSERT`) và nhân viên cập nhật trạng thái (`anon/auth UPDATE, SELECT`).

4. **Bảng Điều Phối Chốt Đơn Telesales CRM (`CustomerLeadsCRMModal.tsx`):**
   - Tích hợp nút **`[✨ Khách Chốt Đơn]`** ngay trên thanh Header cho toàn bộ nhân sự, quản lý và lãnh đạo.
   - Thẻ thông tin khách: Họ tên, Số điện thoại, Chi nhánh ghé, Nhu cầu, Mã voucher, thời gian tạo realtime.
   - Nút **[📞 GỌI ĐIỆN]** và **[💬 CHAT ZALO]** 1-chạm kết nối thẳng đến khách hàng.
   - Cập nhật tiến độ xử lý: `MỚI CHƯA GỌI` ➔ `ĐÃ GỌI / TƯ VẤN` ➔ `HẸN GHÉ SHOP` ➔ `ĐÃ MUA THÀNH CÔNG` ➔ `HỦY`.

5. **Đồng Bộ Nhận Thức Thời Gian Thực & RAG Tồn Kho Thực Tế (HOÀN THÀNH 21/10/2026):**
   - **Xóa bỏ triệt để tình trạng kẹt kiến thức quá khứ:** Gỡ bỏ các dòng chữ hardcode hạn chế dòng máy cũ (như *"từ iPhone 7 đến 16 Pro Max"*).
   - **Định vị mốc thời gian thực tế hệ thống:** Tự động lấy ngày giờ Việt Nam hiện tại (`new Date()`, Thứ, Ngày/Tháng/Năm 2026) nhúng vào System Prompt.
   - **Định hướng công nghệ chính xác năm 2026:** Nhận diện đúng các dòng máy hiện hành (iPhone 16 Series, iPhone 17 Series gồm iPhone 17, 17 Air, 17 Pro, 17 Pro Max; iPhone 18 Series & iPhone Duo; Samsung Galaxy S24, S25 Series, Z Fold6/Flip6...).
   - **Động cơ tìm kiếm sản phẩm thông minh (Real-time Inventory RAG):** Khi khách hỏi bất kỳ món đồ nào, thuật toán tự động bóc tách từ khóa, quét kho 521 sản phẩm thật (`products.json`), trích xuất đúng tên sản phẩm, hãng và giá niêm yết chính xác từng đồng để AI phản hồi chuyên nghiệp, chuẩn xác 100%.

6. **Bộ Tạo Link Đa Kênh & Trình Xuất Mã QR HD Tải Xuống (HOÀN THÀNH 21/10/2026):**
   - **Component chuyên dụng [`LeadLinkGeneratorModal.tsx`](file:///c:/PK88%20AA/src/components/LeadLinkGeneratorModal.tsx):** Cho phép tạo link chatbot gắn thẻ nguồn 1 chạm cho 7 nền tảng: `Facebook`, `TikTok`, `Zalo`, `Website`, `QR Bàn Shop`, `YouTube` và `Tùy chỉnh campaign`.
   - **Trình xuất Mã QR HD Offline 100%:** Sử dụng thư viện `qrcode` vẽ trực tiếp lên HTML5 `<canvas>` kích thước 800×800 px siêu sắc nét, có huy hiệu logo PK88 ở tâm. Tích hợp nút **`[TẢI XUỐNG ẢNH MÃ QR (PNG)]`** phục vụ in ấn standee, dán quầy thu ngân hoặc đăng lên mạng xã hội.
   - **Hiển thị & Bộ lọc kênh nguồn trên Bảng CRM (`CustomerLeadsCRMModal.tsx`):** Thẻ khách hiển thị huy hiệu nguồn đa màu với SVG Vector chuẩn nhận diện thương hiệu thực tế (Facebook, TikTok 3D, Zalo OA, QR Standee...), kèm bộ lọc đa kênh giúp Ban Giám Đốc và Marketing đo lường ROI từng nền tảng tức thì.
   - **Bộ Icon SVG Nhận Diện Thương Hiệu Thực Tế (`PlatformBrandIcon`):** Thay thế toàn bộ emoji thô sơ bằng vector chuẩn thương hiệu độ nét cao cho Facebook (#1877F2), TikTok (nốt nhạc 3D Chromatic), Zalo (#0068FF), YouTube (#FF0000), Website PK88, QR Standee và Tùy chỉnh.

### O. Khung Giám Sát Vệ Sinh & Xem Lại Ảnh Báo Cáo Phê Duyệt Cho Nhân Viên Tại Cửa Hàng (HOÀN THÀNH 20/10/2026)
1. **Phản hồi 2 chiều minh bạch cho nhân viên về kết quả phê duyệt ảnh vệ sinh:**
   - **Khi Cấp Trên phê duyệt "Đạt Chuẩn":**
     + Huy hiệu ca trực lập tức đổi sang `✅ ĐẠT CHUẨN (Duyệt bởi [Tên Cấp Trên])` kèm lời khen/ghi chú.
     + Bộ đếm `Thành tích cá nhân tháng này` tự động cộng dồn (`X ca Đạt Chuẩn`), đồng bộ vào hồ sơ KPI 5 chiều.
   - **Khi Cấp Trên phê bình "Yêu Cầu Làm Lại":**
     + Hiển thị **Banner Cảnh Báo Đỏ Phát Sáng** ngay đỉnh giao diện chấm công với lời nhắc nhở cụ thể: *"Yêu cầu từ Cấp Trên: [Lời nhận xét cụ thể]"*.
     + Thẻ ca trực đổi sang `⚠️ YÊU CẦU LÀM LẠI`, có ngay nút `[📸 Chụp Lại & Nộp Bổ Sung Ngay]` để nhân viên chụp lại ảnh cho đúng ca đó.
   - **Đồng bộ thời gian thực (Supabase Real-Time Channel & Event Dispatcher):** Ngay khi Ban Điều Hành bấm Duyệt hoặc Yêu cầu làm lại trên Executive Board, màn hình của nhân viên tại cửa hàng cập nhật tức thì 100% không cần tải lại trang.

2. **Khung Xem Lại Ảnh Đã Gửi (Photo Gallery & Lightbox Viewer):**
   - **Giao diện thẻ 3 ca trực trong ngày:** Liệt kê minh bạch Ca Sáng (07:30 - 12:00), Ca Chiều (12:00 - 17:30), Ca Tối (17:30 - 22:00).
   - **Gallery Thumbnail:** Hiển thị toàn bộ các ảnh chụp thực tế mà nhân viên đã gửi lên hệ thống kèm số lượng ảnh.
   - **Lightbox Phóng To Toàn Màn Hình (Full HD Lightbox):** Chạm vào bất kỳ ảnh nào để mở cửa sổ phóng to độ phân giải cao bằng `createPortal(..., document.body)` với `z-[10000]`, xem trọn vẹn từng chi tiết góc chụp, giờ nộp, người chụp và nhận xét của Cấp Trên.
   - **Nút Nộp Ảnh Nhanh Theo Ca:** Với các ca chưa gửi, nhân viên chỉ cần bấm `[+ Gửi Ảnh Ca]` là hệ thống tự động chọn đúng ca để nộp nhanh.

3. **Tách biệt hoàn toàn khỏi Chấm Công GPS thành 2 Sub-Tab Độc Lập ([App.tsx](file:///d:/PK88%20AI%20AUTOMATION/src/App.tsx) & [StoreCleanlinessStaffView.tsx](file:///d:/PK88%20AI%20AUTOMATION/src/components/StoreCleanlinessStaffView.tsx)):**
   - **Vấn đề giải quyết:** Trước đó khung Báo cáo vệ sinh nằm chung trong thẻ Chấm công, chiếm quá nhiều chiều dọc màn hình và đẩy nút bấm Check-in/Check-out GPS xuống dưới, gây bất tiện khi nhân viên vào ca/tan ca vội.
   - **Thanh Segmented Control 2 Sub-Tab:**
     + **Tab 1: `[📍 Chấm Công Định Vị GPS]`:** Chuyên trách 100% cho Chấm công, Bản đồ GPS, Geofence, Đồng hồ trực ca và Nút Vào ca/Tan ca tức thì.
     + **Tab 2: `[✨ Báo Cáo Vệ Sinh Shop]`:** Tách thành view riêng ([StoreCleanlinessStaffView.tsx](file:///d:/PK88%20AI%20AUTOMATION/src/components/StoreCleanlinessStaffView.tsx)), hiển thị thanh tiến độ nộp ảnh 3 ca của shop, thư viện ảnh thumbnail, trạng thái duyệt Đạt chuẩn/Làm lại, Lightbox và nộp bổ sung.
   - **Chuyển tab 1 chạm mượt mà:** Nút `[Báo Cáo Vệ Sinh Ca]` trên thẻ Chấm công có badge đếm số ca hôm nay `(X/3)` và khi bấm vào sẽ tự động chuyển thẳng sang Sub-tab Vệ Sinh Shop. Nếu có ca bị yêu cầu làm lại, banner cảnh báo đỏ cũng có nút chuyển nhanh sang nộp lại.



### N. Nâng Cấp Toàn Diện UX Hồ Sơ Nhân Sự Bảng Giám Sát Quân Số Toàn Chuỗi (HOÀN THÀNH 20/10/2026)
1. **Khắc phục triệt để lỗi kẹt khung & cuộn trang do bẫy `backdrop-filter`:**
   - **Vấn đề:** Khung Bảng Giám Sát sử dụng `.glass-card` có `backdrop-filter: blur(12px)` tạo ra Containing Block mới, giam lỏng popup `ExecutiveStaffQuickModal` bên trong thẻ cha ở nửa dưới trang. Trên mobile, người dùng phải cuộn trang xuống tận đáy mới thấy popup và bị thanh menu đáy đè che mất nút gọi điện/Zalo. Trên máy tính, popup bị kéo xuống đáy để lại khoảng đen trống trải mênh mông xung quanh.
   - **Giải pháp:** Sử dụng `createPortal(modalContent, document.body)` với `z-[9999]`. Popup bung ra toàn màn hình chuẩn xác, xuất hiện ngay chính giữa khung hình trước mắt người dùng tại bất kỳ vị trí cuộn trang nào.
   - **Khóa cuộn trang nền:** Tự động set `document.body.style.overflow = 'hidden'` khi mở popup, bảo đảm trải nghiệm vuốt cảm ứng mượt mà.

2. **Thiết kế Bottom Sheet sang trọng trên Mobile (Thumb-Friendly):**
   - Có thanh nắm vuốt (Drag Handle) ở đỉnh, bo tròn `rounded-t-3xl`, viền phát sáng cyan tinh tế.
   - Tràn đều mép ngang (`w-full`), tận dụng 95% màn hình, không còn viền đen trống hoác.
   - Thanh 2 nút hành động lớn **[📞 Gọi Điện]** & **[💬 Nhắn Zalo]** gắn cố định ở chân popup, thuận tiện cho Ban Lãnh Đạo bấm liên hệ chỉ bằng 1 chạm ngón cái.

3. **Bố cục 2 Cột Đẳng Cấp trên Desktop (max-w-2xl):**
   - **Cột Trái (w-60):** Ảnh thẻ chân dung 3:4 sắc nét viền neon, mã NV, huy hiệu sinh nhật (nếu đúng ngày), badge trạng thái Realtime và 2 nút Gọi & Zalo.
   - **Cột Phải (flex-1):** Thông tin nhân sự, Khối vận hành hôm nay (Shop trực, Lịch ca, Vị trí GPS chuẩn shop <35m hay lệch shop, Đơn nghỉ phép) và Thông tin hồ sơ (Email, Ngày vào làm, Ngày sinh, Sao chép SĐT 1 chạm).
   - Triệt tiêu hoàn toàn cảm giác trống trải xung quanh trên màn hình lớn.

4. **Chuẩn hóa thông số "Thời gian làm việc hôm nay" (Thay thế "Giờ tích lũy: 0h"):**
   - Đổi tên nhãn từ *"Giờ tích lũy"* thành **"Thời gian làm:"**.
   - Tự động đo thời gian trực chiến Realtime kể từ khi bấm Check-in: hiển thị `🟢 ~42 phút (Đang trực)` hoặc `~1h 30p (Đang trực)` thay vì con số `0h` đơ cứng khi chưa chốt tan ca. Khi nhân viên đã tan ca, hiển thị giờ công chốt `🏁 8.0h (Đã chốt ca)`.

### L. Báo Cáo & Giám Sát Vệ Sinh Cửa Hàng Hàng Ngày, Xử Lý Ảnh Lỗi & Ghi Nhận Số Ca Đạt Chuẩn (HOÀN THÀNH TOÀN DIỆN 19/10/2026)
1. **Yêu cầu từ Founder:**
   - Nhân viên tại các chi nhánh cửa hàng bán lẻ phải chụp ảnh báo cáo vệ sinh quầy kệ, kính trưng bày, sàn nhà, bàn kỹ thuật theo từng ca (Ca Sáng - Mở cửa, Ca Chiều, Ca Tối - Chốt ca).
   - Founder và Ban Lãnh Đạo xem toàn bộ ảnh báo cáo theo từng chi nhánh trên `ExecutiveDashboard` (Executive Cleanliness Board).
   - **Tối ưu chi phí & dung lượng Supabase:** Toàn bộ ảnh được nén trực tiếp trên trình duyệt (Client-side HTML5 Canvas -> WebP 1280px, dung lượng giảm 95-98% còn ~35KB - 60KB/ảnh).
   - **Cơ chế lưu trữ vòng đời 14 ngày an toàn (14-Day Auto-Retention):** Giải phóng dung lượng ảnh cũ mà không làm mất lịch sử ca trực.
   - **Xử lý ảnh lỗi & chưa đạt chuẩn:** Cho phép Founder yêu cầu làm lại kèm ghi chú chi tiết và cảnh báo trực tiếp trên máy nhân viên.
   - **Ghi nhận số ca đạt chuẩn trong tháng:** Tự động thống kê số ca đạt chuẩn của từng nhân viên từ Supabase Cloud.

2. **Cấu trúc & Module triển khai:**
   - `src/types/index.ts`: Bổ sung `CleanlinessShiftType` (`MORNING`, `AFTERNOON`, `CLOSING`), `CleanlinessStatus` (`PENDING`, `APPROVED`, `REDO_REQUESTED`, `NEEDS_REDO`), và interface `CleanlinessReport`.
   - `src/lib/cleanlinessService.ts`: Chứa toàn bộ logic nghiệp vụ:
     + Thuật toán nén ảnh client-side `compressCleanlinessImage` (WebP 1280px).
     + Các hàm API Supabase: `fetchCleanlinessReports`, `submitCleanlinessReport`, `reviewCleanlinessReport`, `deleteCleanlinessReport`, `purgeOldCleanlinessReports`, và `fetchMonthlyCleanlinessStats`.
     + Định nghĩa schema SQL `CLEANLINESS_REPORTS_SQL` đã tạo bảng `cleanliness_reports` trên Supabase.
   - `src/components/CleanlinessReportModal.tsx`: Modal thân thiện trên di động dành cho nhân sự nộp báo cáo ca: chọn ca trực, chụp ảnh camera trực tiếp hoặc chọn từ thư viện, chip ghi chú nhanh ("✨ Đã lau kính tủ phụ kiện", "🧹 Đã quét dọn & lau sàn"...), xem trước ảnh và xóa ảnh sai.
   - `src/components/ExecutiveCleanlinessBoard.tsx`: Bảng giám sát chuyên dụng trên Executive Dashboard: Bộ lọc ngày (Hôm nay, Hôm qua, Ngày tùy chọn), bộ lọc chi nhánh theo đúng thứ tự ưu tiên chuỗi (`Văn Phòng` ➔ `Phú Khương` ➔ `Đồng Khởi` ➔ `Mỹ Tho` ➔ `Cần Thơ` ➔ `Vĩnh Long` ➔ `Thủ Đức`), thanh tiến độ KPI nộp báo cáo (`x/7 Chi Nhánh`), cảnh báo chi nhánh chưa nộp ảnh, chế độ Lightbox phóng to ảnh độ nét cao.

3. **Cơ chế xử lý ảnh lỗi & ảnh chưa đạt chuẩn:**
   - **Hộp thoại Lý Do Làm Lại (`RedoReasonModal`):** Khi Founder bấm nút `[Làm Lại]`, hệ thống mở popup với các chip chọn nhanh lý do (*Ảnh mờ/thiếu sáng, Kính tủ phụ kiện chưa lau, Sàn còn rác, Ốp lưng chưa xếp ngay ngắn, Yêu cầu chụp góc rộng...*) kèm ô nhập ghi chú chi tiết. Cập nhật trạng thái `REDO_REQUESTED` và lưu ghi chú lên Supabase.
   - **Banner Cảnh Báo Đỏ Trên Điện Thoại Nhân Viên (`AttendanceCard.tsx`):** Khi có ca trực bị yêu cầu làm lại, màn hình chấm công/làm việc của nhân sự chi nhánh đó lập tức nổi banner cảnh báo viền đỏ - chữ vàng, trích dẫn chính xác nhận xét của Founder kèm nút `[📸 Chụp Lại & Nộp Bổ Sung Ngay]`.
   - **Nút Thùng Rác Xóa Báo Cáo Rác / Gửi Nhầm (`Trash2`):** Ở góc mỗi thẻ báo cáo, có icon thùng rác kèm xác nhận an toàn, cho phép xóa vĩnh viễn báo cáo khỏi cả Supabase Cloud và LocalStorage.
   - **Fallback Chống Vỡ Ảnh (`onError`):** Nếu ảnh lỗi đường truyền mạng, tự động thay thế bằng placeholder SVG thanh lịch, không làm vỡ layout lưới ảnh.

4. **Ghi nhận số ca đạt chuẩn trong tháng của từng nhân viên:**
   - Hàm `fetchMonthlyCleanlinessStats(monthStr)`: Truy vấn trực tiếp từ bảng `cleanliness_reports` trên Supabase, tổng hợp số ca đã nộp và số ca được Founder bấm `Đạt Chuẩn` (`APPROVED`) trong tháng theo ID và Tên nhân viên.
   - **Huy hiệu trên Bảng Giám Sát:** Ngay cạnh tên nhân viên trên từng thẻ báo cáo xuất hiện huy hiệu ngọc bích: `Trần Hoàng Sang • ✨ X ca chuẩn (T10)`. Bấm Đạt Chuẩn là số ca nhảy tăng ngay lập tức.
   - **Thống kê trong Hồ Sơ Nhân Sự (`StaffDetailModal.tsx`):** Tại khối thông số cuối hồ sơ, bổ sung thẻ thứ 3: `VỆ SINH 5S (THÁNG): X / Y ca • X ca Đạt Chuẩn`.
   - **Khích lệ trên điện thoại nhân viên (`AttendanceCard.tsx`):** Hiển thị thanh thông tin: `✨ Vệ sinh tháng này: X ca Đạt Chuẩn`.
   - **Bảo toàn số liệu khi dọn dẹp ảnh cũ:** Khi tự động dọn dẹp báo cáo >14 ngày, hệ thống chỉ **làm rỗng mảng ảnh `images: []`** để giải phóng 100% dung lượng ảnh nặng, nhưng **bảo lưu vĩnh viễn dòng lịch sử ca trực và trạng thái APPROVED** trên Supabase, đảm bảo tổng số ca đạt chuẩn của nhân sự trong cả tháng không bao giờ bị hụt.

5. **Khắc phục triệt để lỗi đồng bộ dữ liệu (Diệt Zombie Report giữa Máy Tính & Điện Thoại):**
   - **Nguyên nhân:** Logic `mergedMap` cũ trong `fetchCleanlinessReports` tự ý nhét ngược các báo cáo đã bị xóa từ `LocalStorage` của điện thoại trở lại danh sách, khiến điện thoại F5 liên tục vẫn hiện ảnh cũ đã xóa.
   - **Giải pháp:** Thiết lập **Supabase Cloud là "Chân lý duy nhất" (Single Source of Truth)**. Khi điện thoại tải dữ liệu từ Cloud, hệ thống tự động ghi đè và dọn sạch mọi ảnh đã bị xóa trên máy tính khỏi `LocalStorage` của điện thoại, loại bỏ vĩnh viễn hiện tượng Zombie Report.

### M. Nâng Cấp Bảng Giám Sát Quân Số Trực Tiếp Chuỗi (ExecutiveLivePresence Polish - 19/10/2026)
1. **Chuẩn hóa thứ tự 7 chi nhánh:** Sắp xếp danh sách điểm danh theo thứ tự chuẩn hóa: `Văn Phòng` ➔ `Phú Khương` ➔ `Đồng Khởi` ➔ `Mỹ Tho` ➔ `Cần Thơ` ➔ `Vĩnh Long` ➔ `Thủ Đức`.
2. **Popup Hồ Sơ Nhân Sự Tương Tác:** Click vào tên nhân viên bất kỳ trên bảng giám sát trực tiếp sẽ mở ngay Popup Hồ Sơ Nhân Sự (`StaffDetailModal`) hiển thị ảnh avatar, thông tin cơ bản, chỉ số năng lực 5 chiều, và nút gọi điện thoại / Zalo trực tiếp cho nhân viên đó.

### K. Nâng Cấp Ma Trận Chia Ca & Đồng Bộ 100% Supabase Cloud (17/10/2026)
1. **Hỗ Trợ Toàn Diện Ca Gãy & 2 Thẻ Ca Nhỏ Lồng Nhau Trong Cùng 1 Ô Ngày:**
   - **Ca Gãy chuẩn chuỗi (`CA_GAY`):** Khung giờ Sáng 07:00 – 12:00 (5h) và Tối 17:00 – 22:00 (5h), tổng 10.0h công. Trên bảng ma trận 15 ngày, tự động hiển thị thành **2 thẻ ca nhỏ lồng nhau** gọn gàng:
     + Thẻ nhỏ trên: `☀️ Sáng 07:00-12:00` (Amber)
     + Thẻ nhỏ dưới: `🌙 Tối 17:00-22:00` (Indigo)
   - **Xếp 2 ca làm việc độc lập trong cùng 1 ngày:** Trong cửa sổ Xử Lý Ca Làm Việc, bổ sung nút `[ ➕ Thêm Ca Thứ 2 Trong Ngày (Ca Tối / Tăng Cường) ]`. Khi thêm, ô ngày lập tức hiển thị 2 thẻ nhỏ xếp chồng lên nhau (ví dụ `☀️ Sáng 07:00-15:30` và `⚡ T.Cường 18:00-22:00`).
   - **Xuất Excel tự động:** Tự động ghép nối các ca trong ngày (VD: `Ca Gãy (7h-12h & 17h-22h)` hoặc `Sáng + T.Cường`) và cộng dồn giờ công chính xác 100%.

2. **Tính Năng Xóa Khung Giờ Rối Mắt Dành Cho HR & Admin:**
   - Bổ sung nút thùng rác **`🗑️`** bên cạnh từng khung ca trong menu chọn ca (cho phép xóa bỏ các khung giờ thừa/chưa hợp lý như Ca Trưa KiotViet, Ca Thử Việc 1, Ca Tăng Cường...).
   - Cơ chế Blacklist thông minh: Khung giờ đã xóa không bao giờ tự động xuất hiện lại, đồng thời không làm ảnh hưởng đến các ca đã được xếp trước đó.
   - Bổ sung nút **`[ 🔄 Khôi phục mặc định ]`** để HR/Admin có thể lấy lại danh sách ca chuẩn của công ty chỉ bằng 1 click.

3. **Bảo Đảm Lưu Trữ 100% Lên Máy Chủ Supabase Cloud (Vận Hành Thực Tế An Toàn):**
   - **Record Cloud `...0002`:** Lưu trữ toàn bộ Lịch phân ca (`ShiftAssignment`). Mỗi thao tác xếp ca, đổi ca, thêm ca 2, xóa ca, chấm OFF đều tự động gọi `syncShiftAssignmentsToCloud`.
   - **Record Cloud `...0003`:** Lưu trữ toàn bộ Danh sách khung ca chuẩn (`ShiftDefinition`) và danh sách ca đã xóa.
   - **Nút `[ ☁️ Đồng Bộ Cloud ]`:** Cập nhật 2 chiều đồng thời cả Lịch Ca & Khung Giờ với Supabase Cloud.
   - **Biên dịch Production:** `npm run build` thành công 100% (2.518 modules, 0 errors).

4. **Chuẩn Hóa Thuật Ngữ "Giờ Công Kế Hoạch" (Tránh Hiểu Lầm Vận Hành):**
   - **Đổi nhãn KPI chính:** Đổi từ `Tổng Giờ Công Kỳ` thành `Giờ Công Kế Hoạch (Dự kiến)` kèm nhãn phụ `Định mức phân ca kỳ này`.
   - **Đổi tiêu đề cột bảng:** Cột tổng chuyển thành `GIỜ KẾ HOẠCH (Dự kiến)`.
   - **Đổi dòng chân bảng:** Dòng tổng chuyển thành `TỔNG GIỜ KẾ HOẠCH SHOP / NGÀY`.
   - **Chỉ dẫn phân biệt rõ ràng:** Bổ sung ghi chú hướng dẫn: Ma trận 1.1 dùng để lập kế hoạch & phân ca tương lai; Giờ công làm việc thực tế được ghi nhận độc lập qua Chấm công GPS (tab 1.2 & 1.3) để đối soát lương cuối kỳ.

5. **Tích Hợp Dữ Liệu Chấm Công Thực Tế Lên Bảng Ma Trận (Real-Time Attendance Matrix Presence):**
   - **Thanh Banner Trực Tiếp Hôm Nay (Live Presence Banner):** Đặt ngay phía trên bảng ma trận, đếm số lượng nhân sự trực tiếp: `🟢 Đang làm việc: X`, `☕ Nghỉ giữa ca: Y`, `⚠️ Chưa check-in: Z`, `🏁 Đã tan ca: W`, `⏳ Chờ vào ca: V`.
   - **Cột Hôm Nay Nổi Bật (Header Highlight):** Cột ngày hiện tại có nhãn neon `HÔM NAY` kèm đèn nhấp nháy `🟢 LIVE`, nổi bật giữa kỳ 15 ngày.
   - **Hiển thị trực quan trạng thái chấm công của từng nhân viên:**
     + **Đang làm việc tại shop:** Huy hiệu xanh lá phát sáng `🟢 07:18 Đang làm` (hiển thị chính xác giờ bấm check-in GPS).
     + **Tạm nghỉ luân phiên:** Huy hiệu màu hổ phách `☕ Nghỉ trưa` hoặc `🍱 Đang ăn tối`.
     + **Đã hoàn thành ca:** Huy hiệu xanh dương `🏁 Ra ca 15:35` (hiển thị giờ check-out).
     + **Chưa chấm công (Cảnh báo trễ/quên):** Nếu đã quá giờ bắt đầu ca nhưng chưa có log GPS -> Hiển thị cảnh báo đỏ nhấp nháy `⚠️ Chưa check-in`.
     + **Chưa tới giờ vào ca:** Hiển thị `⏳ Chờ vào ca`.
     + **Đi làm tăng ca ngày nghỉ (OFF):** Nếu nhân viên check-in vào ngày không có ca hoặc ngày OFF, ma trận tự động hiển thị `🟢 07:18 Đang làm (Ngoài lịch phân ca)`.
   - **Đối soát ngày quá khứ:** Các ngày trước đó trong kỳ tự động hiển thị `✓ 07:18` (đã chấm công) hoặc `⚠️ Chưa CC` (vắng/chưa có log GPS).
   - **Cửa sổ chi tiết (Cell Modal):** Khi bấm vào ô bất kỳ, bảng ma trận hiển thị hộp thông tin GPS thực tế: Giờ vào ca, Giờ ra ca, Trạng thái trễ/đúng giờ, Ghi chú vị trí.

6. **Tối Ưu Trải Nghiệm Di Động & Chế Độ Xem Theo Ngày (Mobile View & Compact Matrix):**
   - **Nút Chuyển Chế Độ Xem (View Mode Switcher):** Cung cấp 2 chế độ xem linh hoạt:
     + `📱 Xem Theo Ngày (Thoáng Di Động)`: Tự động kích hoạt khi mở trên màn hình điện thoại (< 768px). Hiển thị thanh cuộn chọn ngày ngang (`T5 15 | T6 16 | 🟢 T7 17 HÔM NAY | CN 18...`) và danh sách thẻ nhân sự dạng dọc thoáng đãng, to rõ, dễ đọc, không cần vuốt ngang khổ sở.
     + `📊 Bảng Ma Trận (15 Ngày)`: Cho phép chuyển sang xem toàn bộ lưới 15 ngày bất kỳ lúc nào chỉ bằng 1 chạm.
   - **Thu Gọn Cột Cố Định Trên Điện Thoại (Compact Matrix Layout):**
     + Cột tên nhân sự cố định (sticky) giảm từ `w-56` (224px) xuống `w-32 sm:w-56` (128px) trên điện thoại, giải phóng gần 100px chiều rộng.
     + Nhờ vậy, ngay trên điện thoại, bảng ma trận hiển thị đồng thời được **4 đến 5 ngày** thay vì chỉ 1 ngày duy nhất bị cụt như trước đó.
     + Avatar, tên, chức vụ và ô ngày đều co giãn mượt mà theo chuẩn mobile-first.

7. **Chấm Bù Nhanh 1 Chạm Ngày Quá Khứ & Nhật Ký Kiểm Toán (Audit Trail) ([ShiftSchedulingMatrix.tsx](file:///d:/PK88%20AI%20AUTOMATION/src/components/ShiftSchedulingMatrix.tsx)):**
   - **Phân quyền cấp cao:** Founder, Admin, HR và Cửa Hàng Trưởng được quyền click vào bất kỳ ô ngày quá khứ nào để "Chấm Bù Nhanh 1 Chạm" khi nhân viên đi làm đầy đủ nhưng quên check-in GPS.
   - **Tự động áp dụng khung giờ:** Điền chính xác giờ bắt đầu & giờ kết thúc ca theo định mức, tính đủ 1.0 công hoặc theo giờ quy định.
   - **Audit Trail Minh Bạch:** Ghi rõ huy hiệu `✏️ Đã bù công` cùng tooltip hiển thị người duyệt (VD: "Bù bởi CHT Nguyễn Văn A lúc 10:15 17/10"), đồng bộ trực tiếp lên Supabase Cloud.

8. **Khóa Cứng Quyền Xem Chi Nhánh Cho Cửa Hàng Trưởng (Branch Data Isolation):**
   - Cửa Hàng Trưởng (Manager) và nhân viên chỉ được xem và thao tác trên đúng chi nhánh mình phụ trách.
   - Menu dropdown chọn chi nhánh bị ẩn/khóa đối với Manager; chỉ Founder, Admin và HR mới có quyền chuyển đổi để xem toàn bộ các chi nhánh của chuỗi.

9. **Phân Quyền Nút "Điều Động Nhân Sự" Chuẩn Vận Hành Chuỗi (Phương Án 1):**
   - **Thẩm quyền tập trung:** Chỉ duy nhất **Founder, Admin và HR** mới có nút và quyền sử dụng `[✈️ Điều Động Nhân Sự]` chéo chi nhánh (vì chỉ Ban Điều Hành mới có góc nhìn tổng thể toàn chuỗi để quyết định nơi thừa/nơi thiếu).
   - **Cửa Hàng Trưởng khi thiếu người:** Sử dụng nút `[🚨 Chợ Ca Khẩn Cấp (+50k)]` để phát sóng ca trống cho nhân viên các shop khác tự nguyện nhận ca hỗ trợ, hoặc gửi yêu cầu lên HR/Admin để được điều động.
   - **Bảo vệ nhân sự văn phòng & ban lãnh đạo:** Danh sách nhân viên trong Modal điều động tự động loại trừ các vai trò Văn phòng & Quản trị cấp cao (`founder`, `admin`, `hr`, `accountant`, `warehouse_accountant`, `marketing`, `media`, `PK88-FOUNDER`), ngăn ngừa việc điều động nhầm nhân sự cốt lõi đi trực shop.

10. **Tối Ưu Modal Xử Lý Ca & Chấm Bù Gọn Gàng (Tabbed Action Modal) ([ShiftSchedulingMatrix.tsx](file:///d:/PK88%20AI%20AUTOMATION/src/components/ShiftSchedulingMatrix.tsx)):**
    - **Vấn đề giải quyết:** Khắc phục triệt để tình trạng giao diện bị dài dằng dặc trên cả máy tính và điện thoại do xếp chồng tất cả tính năng (GPS, Chấm bù, Chọn loại ca, Thêm ca 2, OFF, Báo ốm, Xóa ca) trong cùng 1 cột.
    - **Tách 3 Tab chuyên biệt cực kỳ tinh gọn:**
      + `[⚡ Chấm Bù]`: Chỉ hiển thị Dữ liệu GPS thực tế + Form chấm bù 1 chạm (giờ vào, giờ ra, chip lý do nhanh, người duyệt, nút xác nhận). Vừa khít 1 màn hình điện thoại (~360px), **không cần cuộn**.
      + `[🗓️ Đổi Ca]`: Chọn khung giờ làm việc, thêm ca 2, chuyển sang OFF. Khung danh sách ca được cuộn gọn trong `max-h-56`.
      + `[🚨 Nghỉ / Xóa]`: Báo nghỉ ốm đột xuất (chợ ca +50k), xóa ca hoặc xóa cả kỳ.
    - **Điều hướng thông minh:** Click ô quá khứ / hôm nay -> Tự động mở ngay Tab `[⚡ Chấm Bù]`; click ô tương lai -> Tự động mở Tab `[🗓️ Đổi Ca]`.
    - **Giới hạn chiều cao an toàn:** Modal được khóa trần `max-h-[85vh]`, thanh cuộn nội bộ mượt mà, bảo đảm nút đóng `[X]` và nút xác nhận luôn nằm trong tầm mắt người dùng.

### I. Cấu Hình PWA Chuẩn Hóa Mobile-First (17/10)
1. **Hỗ Trợ Toàn Diện "Thêm Vào Màn Hình Chính" (Add to Home Screen):**
   - Đã tạo tệp cấu hình chuẩn PWA [`public/manifest.json`](file:///d:/PK88%20AI%20AUTOMATION/public/manifest.json) với định danh `PK88 Portal`, hiển thị `standalone` (toàn màn hình, triệt tiêu hoàn toàn thanh URL trình duyệt).
   - Tận dụng nhận diện logo thương hiệu có sẵn `logo-pk88.jpg` làm app icon chuẩn đa kích thước.
2. **Tối Ưu Trải Nghiệm iOS / Apple Safari:**
   - Bổ sung trọn bộ thẻ Apple Meta Tags trong [`index.html`](file:///d:/PK88%20AI%20AUTOMATION/index.html): `apple-touch-icon`, `apple-mobile-web-app-capable: yes`, thanh trạng thái `black-translucent`, tên app `PK88 Portal`, `viewport-fit=cover`.
3. **Tích Hợp Service Worker Offline-First:**
   - Tạo [`public/sw.js`](file:///d:/PK88%20AI%20AUTOMATION/public/sw.js) và tự động đăng ký trong [`src/main.tsx`](file:///d:/PK88%20AI%20AUTOMATION/src/main.tsx) khi chạy production, kích hoạt tính năng cài đặt ứng dụng trên Chrome/Android.
4. **Tối Ưu Giao Diện Di Động & Chống Rối Mắt (Mobile Layout Polish):**
   - **Xóa bỏ hoàn toàn thanh `RoleSwitcher`:** Triệt tiêu hoàn toàn dải nút test vai trò chiếm 30% diện tích màn hình trên mobile.
   - **Nút Trợ Lý AI Chị 8 & Bé 8 tinh tế:** Chuyển từ nút viên thuốc dài sang **icon tròn nhỏ gọn tinh tế** (`Bot` + `Sparkles` + Online dot), nâng vị trí lên `bottom-28 right-3.5` trên mobile để nằm hoàn toàn bên trên thanh menu đáy, tuyệt đối không bao giờ đè lên bất kỳ tab nào của bất kỳ vai trò nào.
   - **Bảo toàn chuẩn Menu đáy theo vai trò:** Nhân viên, Cửa hàng trưởng, Marketing, Kế toán (3 - 4 tabs) hiển thị 1 hàng ngang chuẩn, to rõ, dễ bấm; Admin & Founder giữ nguyên cấu trúc đa tab.
5. **Đồng Bộ Hai Chiều Mật Khẩu & Thông Tin Nhân Sự Lên Supabase Cloud (`staffAuthService.ts`):**
   - **Khắc phục triệt để lỗi mất dữ liệu khi đăng nhập lại:**
     + Gỡ bỏ hoàn toàn các đoạn code ép cứng (hardcode) đè lại họ tên/role/chi nhánh của Admin & Founder trong `App.tsx`.
     + Tạo module [`staffAuthService.ts`](file:///d:/PK88%20AI%20AUTOMATION/src/lib/staffAuthService.ts) lưu trữ đồng bộ 2 chiều bản đồ mật khẩu cá nhân và thông tin hồ sơ mở rộng (ngày sinh, ngày vào làm, email) lên Supabase Cloud (`job_applications` system metadata record riêng biệt `00000000-0000-0000-0000-000000000005`).
     + Bất kỳ ai đổi mật khẩu hay cập nhật hồ sơ cá nhân đều được lưu vĩnh viễn trên Supabase Cloud, đăng nhập lại từ bất kỳ máy nào, điện thoại hay tab ẩn danh đều nhận diện chính xác 100%.
     + **Cơ chế bảo vệ quản trị (Admin Login Safeguard):** Tự động chuẩn hóa SĐT (loại bỏ khoảng trắng, dấu chấm `0888 003 205` -> `0888003205`, tự sửa lỗi gõ nhầm 4 số 8 `0888803285`), bổ sung nút Bật/Tắt xem mật khẩu (`Eye`/`EyeOff`), và hỗ trợ cơ chế đăng nhập kép (chấp nhận cả mật khẩu mới đã đổi lẫn mật khẩu quản trị gốc `admin88` để Admin không bao giờ bị khóa tài khoản ngoài ý muốn).
6. **Popup Cảnh Báo Chống Chạm Nhầm Nút Tan Ca ([`AttendanceCard.tsx`](file:///d:/PK88%20AI%20AUTOMATION/src/components/AttendanceCard.tsx)):**
   - **Vấn đề giải quyết:** Nút tan ca trên màn hình cảm ứng di động rất to, nhân viên để trong túi quần hoặc vô tình chạm tay có thể làm chốt ca sớm ngoài ý muốn, làm mất ca làm đang chạy.
   - **Cơ chế xác nhận 2 lớp:** Bấm nút *"BẤM CHẤM CÔNG TAN CA"* sẽ mở Modal cảnh báo trực quan trước khi ghi nhận vào cơ sở dữ liệu.
   - **Cảnh báo về sớm thông minh:** Tự động tính toán giờ vào, giờ dự kiến kết thúc ca làm, số giờ đã làm thực tế và số giờ/phút còn thiếu. Nếu về sớm trước giờ tan ca, modal chuyển sang màu cam hổ phách (`Amber-500`) cảnh báo nhân viên về việc vi phạm rời ca sớm.
   - **Nút hành động an toàn làm mặc định:** Nút ưu tiên số 1 màu xanh lá `[🟢 TÔI BẤM NHẦM — TIẾP TỤC LÀM VIỆC]` nằm trên cùng để nếu nhân viên chạm vội sẽ đóng popup ngay; nút xác nhận chốt tan ca nằm ở dưới để nhân sự chỉ bấm khi thực sự muốn kết thúc ca.
7. **Tùy Biến Linh Hoạt Nghỉ Ăn Trưa & Ăn Tối Luân Phiên Theo Ca Làm ([`AttendanceCard.tsx`](file:///d:/PK88%20AI%20AUTOMATION/src/components/AttendanceCard.tsx), [`staffStatus.ts`](file:///d:/PK88%20AI%20AUTOMATION/src/lib/staffStatus.ts), [`App.tsx`](file:///d:/PK88%20AI%20AUTOMATION/src/App.tsx)):**
   - **Tự động nhận diện ca làm & thời gian thực tế tại các chi nhánh cửa hàng bán lẻ:**
     + **Ca Sáng (07:00 - 15:30) & trước 16:00:** Nút hiển thị `☕ TẠM NGHỈ ĂN TRƯA (LUÂN PHIÊN 30 - 45 PHÚT)`, trạng thái toàn chuỗi là `☕ Đang nghỉ trưa`.
     + **Ca Chiều (13:30 - 22:00) & Khung giờ tối (sau 16:00):** Tự động chuyển thành `🍱 TẠM NGHỈ ĂN TỐI (LUÂN PHIÊN 30 - 45 PHÚT)`, icon hộp cơm `UtensilsCrossed`, trạng thái toàn chuỗi là `🍱 Đang ăn tối`.
   - **Loại trừ riêng Khối Văn Phòng (`isOffice`):** Khối Văn phòng làm giờ hành chính cố định, có quy định nghỉ trưa riêng, nên **ẩn hoàn toàn nút và banner Tạm nghỉ ăn trưa / ăn tối**, giữ giao diện làm việc tinh gọn, chuyên nghiệp.
   - **Cơ chế ghi nhận chính xác:** Nhân viên bán lẻ bấm ăn cơm không làm mất ca, đồng hồ đếm giờ chạy rõ ràng và có nút `[🟢 ĐÃ ĂN XONG — BẤM QUAY LẠI TRỰC QUẦY]`, không yêu cầu quét lại GPS.

### H. Chuyển Đổi Vận Hành Chấm Công Thực Tế (16/10)
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
6. **Loại Trừ Tuyệt Đối Founder Khỏi Ma Trận Phân Ca & Cảnh Báo Chấm Công ([ShiftSchedulingMatrix.tsx](file:///d:/PK88%20AI%20AUTOMATION/src/components/ShiftSchedulingMatrix.tsx) & [ExecutiveDashboard.tsx](file:///d:/PK88%20AI%20AUTOMATION/src/components/ExecutiveDashboard.tsx)):**
   - Founder (**Ngô Hồng Thao**) là Chủ Doanh Nghiệp, được áp dụng quy chế `Miễn công` (không tính ca, không xếp lịch làm việc).
   - Đã loại bỏ hoàn toàn tài khoản Founder khỏi:
     + Bảng lưới Ma trận chia ca 15 ngày tại chi nhánh Văn Phòng (chỉ hiển thị đúng các nhân sự văn phòng cần chia ca: Marketing, Kế toán, HR, Media, Admin).
     + Danh sách nhân sự trong tệp Excel xuất in ấn A4.
     + Danh sách nhân sự cần gọi điện / nhắn tin Zalo nhắc nhở mở ca trong popup Cảnh Báo Đỏ.
     + Menu chọn nhân viên điều động công tác chéo giữa các chi nhánh.
7. **Tích Hợp Tính Năng Tạm Nghỉ Ăn Trưa Luân Phiên (Break Timer) Dành Cho Ca Thẳng Bán Lẻ ([AttendanceCard.tsx](file:///d:/PK88%20AI%20AUTOMATION/src/components/AttendanceCard.tsx)):**
   - Giải quyết hoàn hảo bài toán luân phiên trực quầy: Nhân viên A bấm `[☕ Tạm Nghỉ Ăn Trưa]` khi đi ăn (tiêu chuẩn 30 - 45 phút) để đồng đội B trực quầy thay.
   - Màn hình điện thoại hiển thị đồng hồ đếm thời gian nghỉ trực quan (`mm:ss`), nhắc nhở quy định và hiển thị nút hành động lớn: `[🟢 ĐÃ ĂN XONG — BẤM QUAY LẠI TRỰC QUẦY]`.
   - Trạng thái làm việc trên toàn hệ thống (Danh bạ nhân viên, Bảng điều hành) tự động chuyển sang `☕ Đang nghỉ trưa` màu vàng, minh bạch quân số thực tế tại shop.
   - Khi kết thúc bữa trưa, hệ thống tự động tính chính xác số phút nghỉ và lưu vào nhật ký chấm công.
8. **Chuẩn Hóa Nghiệp Vụ "Ca Gãy" Bán Lẻ (Split Shift) ([shiftService.ts](file:///d:/PK88%20AI%20AUTOMATION/src/lib/shiftService.ts) & [AttendanceCard.tsx](file:///d:/PK88%20AI%20AUTOMATION/src/components/AttendanceCard.tsx)):**
   - Phân biệt rành mạch giữa **Nghỉ trưa tại chỗ (Ca thẳng)** và **Về nhà nghỉ ngơi 5 tiếng (Ca gãy)**.
   - Đã bổ sung mã ca **`CA_GAY` (07:00 - 12:00 & 17:00 - 22:00 = 10.0 tiếng công)** vào danh mục ca chuẩn toàn chuỗi PK88.
   - Quy trình chấm công 2 phiên an toàn tuyệt đối về mặt két tiền & hàng hóa:
     + **Phiên Sáng (07:00 - 12:00):** Check-in vào ca sáng -> 12:00 Bấm Tan Ca (Check-out) bàn giao tiền/két, về nhà nghỉ ngơi tự do.
     + **Phiên Chiều/Tối (17:00 - 22:00):** 17:00 Đến cửa hàng Check-in vào ca mới -> 22:00 Bấm Tan Ca (Check-out).
     + Bảng chấm công (Tab 1.2) tự động ghi nhận đủ 2 phiên và tổng hợp thành 10 tiếng làm việc (1.25 công).
9. **Đồng Bộ Hai Chiều Toàn Diện Lên Supabase Cloud Cho Ma Trận Chia Ca (Tab 1.3) ([shiftService.ts](file:///d:/PK88%20AI%20AUTOMATION/src/lib/shiftService.ts) & [ShiftSchedulingMatrix.tsx](file:///d:/PK88%20AI%20AUTOMATION/src/components/ShiftSchedulingMatrix.tsx)):**
   - Khắc phục triệt để tình trạng lịch làm việc chỉ lưu cục bộ ở `localStorage` của từng máy, khiến bản live Vercel (`pk88-hub.vercel.app`) hiển thị trống (0.0h).
   - Tích hợp lưu trữ đám mây hai chiều trên Supabase:
     + Mọi thao tác phân ca: Đổ ca tự động 15 ngày, đổi ca trên ô, đánh dấu nghỉ luân phiên, điều động chéo, gánh ca khẩn cấp đều được tự động lưu lên Supabase Cloud tức thời.
     + Khi bất kỳ ai truy cập website từ điện thoại hay máy tính khác, hệ thống tự động tải toàn bộ lịch phân ca mới nhất từ Supabase Cloud.
     + Bổ sung nút hành động `[☁️ Đồng Bộ Cloud]` trên thanh điều khiển để Cửa hàng trưởng và Admin có thể kiểm tra và ép đồng bộ dữ liệu tức thì.

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

7. **Tích Hợp Thẻ Ca Nhỏ Lồng Nhau (Ca Gãy & 2 Ca Độc Lập) Trên Cùng 1 Ô Ngày (NEW - 17/10):**
   - **Ca Gãy (Split Shift):** Tự động hiển thị 2 thẻ con lồng nhau gồm `☀️ Ca Sáng (07:00-12:00)` và `🌙 Ca Tối (17:00-22:00)` với màu sắc phân biệt trực quan, tự động tính đủ 10 giờ công chuẩn.
   - **Xếp 2 Ca Độc Lập:** Cho phép thêm ca thứ 2 trong ngày (ca tăng cường/tăng ca) với nút xóa từng ca riêng biệt.
   - **Xóa bớt khung giờ không hợp lý:** Cho phép Cửa hàng trưởng và HR/Admin bấm icon thùng rác để xóa bỏ các khung giờ ca dư thừa, tránh làm rối mắt khi chọn ca.

8. **Đối Soát Chấm Công GPS Realtime Trực Tiếp Trên Ma Trận Lịch Làm Việc (NEW - 17/10):**
   - **Hôm nay:** Hiển thị trực quan trạng thái thực tế của nhân sự ngay trên ô ngày: `🟢 07:18 Đang làm` (đang làm việc), `☕ Nghỉ trưa / 🍱 Ăn tối`, `🏁 Ra ca 15:35`, hoặc `⚠️ Chưa check-in` (quá giờ bắt đầu ca).
   - **Thống kê tức thời:** Banner phía trên tổng hợp số lượng nhân viên đang làm việc, nghỉ trưa, tan ca và chưa vào ca tại cửa hàng.
   - **Ngày quá khứ:** Tự động đối soát dữ liệu GPS: hiển thị `✓ 07:18` nếu có dữ liệu hoặc `⚠️ Chưa CC` nếu không thấy lượt quét mã.

9. **Chế Độ Xem Theo Ngày (Mobile-First Daily Card View) (NEW - 17/10):**
   - Bộ chuyển đổi **`[ 📱 Xem Theo Ngày (Thoáng Di Động) ]`** vs **`[ 📊 Bảng Ma Trận (15 Ngày) ]`**.
   - Trên điện thoại (<768px), giao diện tự động ưu tiên chế độ xem theo ngày với thanh cuộn ngày ngang và danh sách thẻ nhân sự dạng dọc thoáng đãng.
   - Khi xem ma trận trên điện thoại, cột thông tin nhân sự được thu gọn tinh tế từ 224px xuống 128px, hiển thị đồng thời 4-5 ngày mà không bị gò bó.

10. **Chấm Bù Công Nhanh 1 Chạm & Minh Bạch Audit Trail (Kết Hợp Phương Án 1 & 3) (NEW - 17/10):**
   - **Phân quyền cấp cao:** Founder, Admin, HR và Cửa Hàng Trưởng được cấp quyền chấm bù nhanh bằng cách click trực tiếp vào bất kỳ ô ngày quá khứ nào trên Ma trận hoặc Thẻ ngày.
   - **1 Chạm Tiện Lợi:** Hệ thống tự động điền sẵn giờ vào - giờ ra theo lịch phân ca đã xếp; cung cấp các nút chọn lý do nhanh (`Quên bấm máy chấm công`, `Lỗi mạng / Hết pin`, `Cửa hàng trưởng xác nhận có mặt`...).
   - **Minh bạch dữ liệu (Audit Trail):** Mọi lượt chấm bù đều tự động lưu trữ lên Supabase `attendance` kèm đầy đủ vết lịch sử: Người phê duyệt, Chức vụ, Thời điểm duyệt chính xác, Giờ công thực tế và Lý do.
   - **Hiển thị trực quan tức thời (Optimistic UI):** Ô ngày ngay lập tức chuyển từ `⚠️ Chưa CC` sang huy hiệu `⚡ 07:30 (Bù)` màu hổ phách sang trọng, kèm tooltip và bảng thông tin Audit Trail minh bạch khi click vào xem chi tiết.

11. **Khóa Cứng Phân Quyền Chi Nhánh (Chỉ Founder, HR, Admin Được Xem Toàn Bộ) (NEW - 17/10):**
   - **Quyền toàn chuỗi:** Chỉ duy nhất 3 vai trò cấp cao (**Founder, HR, Admin**) mới có quyền chuyển đổi qua lại giữa tất cả các chi nhánh trên hệ thống (cả Header Navbar và Ma Trận Lịch Làm Việc).
   - **Cửa Hàng Trưởng (Manager) & Nhân viên:** Khóa cứng 100% vào đúng chi nhánh của mình (`currentUser.branchId`), ẩn hoàn toàn menu chọn chi nhánh khác và thay bằng huy hiệu `🔒 Cố định`. Cửa hàng trưởng chỉ quản lý và xem nội bộ lịch làm việc của chi nhánh mình phụ trách, triệt tiêu việc xem lẫn lộn giữa các shop.

12. **Sửa Triệt Để Lỗi Đồng Bộ Chấm Bù Lên Supabase & Khớp Dữ Liệu Nhân Sự (NEW - 17/10):**
   - **Lỗi schema Supabase:** Bảng `attendance` trên database chưa có các cột `dispute_status`, `dispute_handled_by`... khiến lệnh `insert` bị lỗi Postgres `42703 (column does not exist)`. Đã loại bỏ các trường thừa khỏi payload `insertPayload` và chuẩn hóa cấu trúc `notes`.
   - **Khớp mã nhân sự (Local vs DB):** Định danh nhân sự ở giao diện là `s-pk88-036` trong khi Supabase dùng UUID. Đã chuẩn hóa chuỗi ghi chú `notes` luôn bao gồm đầy đủ Họ tên và Số điện thoại nhân viên: `Võ Tuấn Anh (0915755063) - [CHẤM BÙ BỞI ...]`.
   - **Bộ lọc đa tiêu chí:** Hàm `getStaffRecordsForDate` được nâng cấp đối soát qua: `staff.id`, `staff.phone`, `staff.fullName`, `staff.code` và định dạng ngày chuẩn múi giờ Việt Nam (`Asia/Ho_Chi_Minh` UTC+7).
   - **App.tsx Fallback:** Tự động nhận diện chuỗi `[CHẤM BÙ` trong `notes` để gán `disputeStatus = 'APPROVED'` và bóc tách thông tin người duyệt `disputeHandledBy`. Sau khi bấm Chấm bù, ô ngày lập tức cập nhật huy hiệu `⚡ 07:30 (Bù)` vĩnh viễn trên Supabase.

13. **Thu Hồi & Nút Xóa Nhanh Bản Ghi Chấm Bù / Chấm Nhầm (NEW - 17/10):**
   - **Xóa nhầm tức thời:** Bổ sung nút thùng rác đỏ **`[🗑️]`** tại cột Thao tác quản lý của bảng `AttendanceTimesheetView.tsx` cho cấp Founder, Admin, HR, CHT.
   - Khi phát hiện chấm nhầm ca hoặc trùng lặp dữ liệu, quản lý có thể xóa vĩnh viễn bản ghi khỏi Supabase kèm modal xác nhận an toàn, không lo bị nhân đôi giờ công.

14. **Minh Bạch Thông Tin Audit Trail Người Duyệt Chấm Bù (NEW - 17/10):**
   - Hộp thoại chi tiết khi click vào ô đã chấm bù hiển thị khối **`LỊCH SỬ CHẤM BÙ CÔNG (AUDIT TRAIL) ✓ ĐÃ DUYỆT CÔNG`**: Hiển thị rõ Người phê duyệt (kèm chức danh), thời điểm duyệt chính xác, lý do chấm bù, giờ vào - giờ ra được công nhận.
   - Bảng Timesheet hiển thị huy hiệu `⚡ Đã chấm bù` kèm dòng `Duyệt bởi: [Tên người duyệt]`.

15. **Hộp Thoại Nhập & Hiển Thị Minh Bạch Lý Do Từ Chối Nghỉ Phép (NEW - 17/10):**
   - Khi Quản lý / HR bấm `Từ Chối Đơn` trong [AIHRModal.tsx](file:///d:/PK88%20AI%20AUTOMATION/src/components/AIHRModal.tsx), hệ thống hiển thị Popup nhập lý do từ chối với 5 nút gợi ý chọn nhanh (Quick Chips) chuẩn vận hành chuỗi.
   - Lý do từ chối được hiển thị minh bạch cho nhân viên thấy ngay trên thẻ đơn phép (`💬 Lý do từ chối: "..."`) và lưu vết lên Supabase `leave_requests`.

16. **Chuẩn Hóa Chức Danh Kế Toán & Tối Ưu Navbar Mobile (NEW - 17/10):**
   - **Chức danh Kế Toán:** Đổi hiển thị từ `Kế Toán Trưởng` sang `Kế Toán` thân thiện, giảm áp lực theo mong muốn của bạn Bích Trâm trên toàn hệ thống (Hồ sơ nhân sự, danh bạ chi nhánh, Admin panel).
   - **Navbar Mobile 2 Hàng:** Tách thanh công cụ trên điện thoại thành 2 dòng riêng biệt: Hàng 1 (Chấm công, Đồng bộ, Chi nhánh) và Hàng 2 (Avatar cá nhân, Họ tên đầy đủ, Nút Đăng xuất, Khách QR, Tuyển dụng), giải quyết triệt để tình trạng Avatar và tên bị tràn mép/khuất màn hình.

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

### L. Phân Hệ Xưởng Marketing 88 & Kho 521 Sản Phẩm (NEW - 18/10/2026)
1. **Radar Tình Báo Đối Thủ 3km Quanh Chi Nhánh (Competitor Intelligence Radar):**
   - Tích hợp tọa độ GPS thực tế từ `google-maps.txt` của chuỗi Phụ Kiện 88 và danh sách 6–7 đối thủ thực tế trên địa bàn (Thế Giới Di Động, FPT Shop, Điện Thoại Vui, Viettel Store, CellphoneS, Di Động Việt, Hoàng Hà Mobile, Sang Mobile, Bạch Long Mobile...) trong bán kính 3km.
   - Phân tích điểm mạnh, điểm yếu và gợi ý đòn phản công marketing theo thời gian thực cho từng chi nhánh.

2. **Chuyển Thể Đa Kênh Content 1 ➔ 4 & AI Vision OCR Bao Bì Sản Phẩm:**
   - Nhập nội dung thô hoặc chọn sản phẩm, AI tự động tạo 4 phiên bản riêng biệt: Facebook Fanpage, Kịch bản TikTok miền Tây, Tin nhắn Zalo OA, và Review SEO Google Maps.
   - Hỗ trợ tải lên 1 hoặc nhiều ảnh chụp thực tế hoặc dán ảnh chụp màn hình trực tiếp từ clipboard (`Ctrl+V`).
   - Tích hợp công nghệ nén ảnh client-side (`processReferenceImageFile`) và AI Vision & OCR bóc tách thông số kỹ thuật, hãng sản xuất trực tiếp từ vỏ hộp bao bì.
   - Thiết kế giao diện khung nhập liệu toàn màn hình (`100% width`), vùng soạn thảo rộng rãi (`rows={5}`, `min-h-[140px]`), cuộn trang mượt mà và thanh chọn kênh dính (Sticky Platform Bar).

3. **Toàn Diện Kho 521 Sản Phẩm & Bộ Lọc 15 Danh Mục Chuẩn Hóa:**
   - Nạp đầy đủ 521 sản phẩm từ `PK88_Danh_Sach_521_San_Pham_Cleaned.json` bao gồm 15 danh mục chuẩn: *Kính Cường Lực (244), Dán PPF (73), Lens Camera (41), Bộ Sạc (27), Cáp Sạc (27), Ốp Lưng (23), Sạc Dự Phòng (23), Pin iPhone (19), Củ Sạc (9), Tai Nghe Dây (8), Tai Nghe BT (6), Tẩu Sạc Ô Tô (6), Kệ & Giá Đỡ (6), Gậy Selfie (5), Loa BT (4)*.
   - Xóa bỏ hoàn toàn giới hạn 50 sản phẩm cũ (`slice(0, 50)`), cho phép cuộn xem mượt mà toàn bộ 521 SKU.
   - Bổ sung 15 Tab Danh Mục cuộn ngang kèm số lượng sản phẩm trực quan.
   - Thuật toán tìm kiếm thông minh không phụ thuộc dấu tiếng Việt (`removeVietnameseTones`), hỗ trợ gõ không dấu (`cu sac`, `op lung`, `pin`, `tai nghe`) hoặc tìm theo thương hiệu (`Pisen`, `Wiwu`, `URR`, `Anank`, `Quaker`, `Hoco`, `KingKong`...).
   - Hiển thị đầy đủ số thứ tự `#STT`, badge danh mục màu sắc riêng biệt, badge thương hiệu và giá niêm yết kép (k và VNĐ).

4. **Khung Ảnh Tự Động 1080×1080 (Canvas Auto-Framing) & Bàn Biên Tập Kanban:**
   - Tự động gắn khung thương hiệu PK88 Gold/Dark/Accent, dán thông tin sản phẩm và xuất ảnh JPG chuẩn tỷ lệ 1:1 cho bài đăng Fanpage.
5. **Bảng Ma Trận Phân Ca & Bảng Giám Sát Trực Tiếp Quân Số Toàn Chuỗi (19/10/2026):**
   - **Bảng Ma Trận Phân Ca Tự Động (`ShiftSchedulingMatrix.tsx`):**
     - Phân bổ định ngạch ca Sáng / Tối theo từng chi nhánh, hỗ trợ xếp ca điều chuyển chéo chi nhánh (Cross-branch shifts).
     - Tự động liên kết chặt chẽ 2 chiều với Đơn Nghỉ Phép đã duyệt (`leave_requests`) và Trợ Lý AI HR (Chị 8 HR). Khi nhân sự được duyệt nghỉ phép, ma trận tự động gán nhãn Nghỉ Phép, hiển thị người gánh ca và cảnh báo thiếu hụt quân số.
     - Lưu trữ và đồng bộ hóa thời gian thực lên Supabase Cloud.
   - **Bảng Giám Sát Trực Tiếp Quân Số Toàn Chuỗi Cho Cấp Điều Hành (`ExecutiveLivePresence.tsx`):**
     - Tích hợp trực tiếp trên Dashboard Tổng Quan (Executive Dashboard) dành riêng cho Founder, Admin và HR ở chế độ **Read-Only** an toàn tuyệt đối.
     - Phân tích theo thời gian thực trạng thái trực chiến của toàn bộ nhân sự: Đang làm việc (`WORKING`), Vào trễ (`WORKING_LATE`), Nghỉ giữa ca (`ON_BREAK`), Nghỉ phép (`ON_LEAVE`), Chưa check-in (`NOT_CHECKED_IN`), Đã tan ca (`SHIFT_ENDED`), Chưa xếp ca (`UNSCHEDULED`).
     - Kết nối Supabase Realtime Channel (`realtime_pk88_operations`) lắng nghe tức thời thay đổi dữ liệu từ các bảng `attendance`, `leave_requests`, `job_applications` (shifts), `staff`.
     - So khớp định danh nhân sự đa tầng (UUID Supabase, Số Điện Thoại `phone`, Mã NV `code`, Họ Tên).
   - **Tối Ưu Trải Nghiệm Mobile Đột Phá:**
     - Loại bỏ hoàn toàn thanh cuộn ngang chọn chi nhánh; thay thế bằng cơ chế `flex flex-wrap` tự động dàn rớt xuống dòng thứ 2-3 thẩm mỹ.
     - Thu nhỏ kích thước thẻ nhân viên, chuyển sang lưới 2 cột song song (`grid-cols-2`) trên điện thoại, hiển thị đồng thời 4–6 nhân sự trên một khung nhìn trực quan, không bị tù túng.
   - **Modal Xem Ảnh Avatar, Hồ Sơ & Nút Gọi Điện / Zalo Nhanh (`ExecutiveStaffQuickModal.tsx`):**
     - Nhấp vào bất kỳ thẻ nhân viên nào trên bảng giám sát sẽ mở Modal hồ sơ chuyên nghiệp.
     - Hiển thị ảnh chân dung chất lượng cao, huy hiệu vai trò, ngày sinh, ngày vào làm, chi nhánh gốc, ca làm việc và xác thực vị trí GPS hôm nay.
     - Tích hợp 2 nút tiện ích hỏa tốc: **Gọi Điện Thoại Ngay** (`tel:`) và **Chat Qua Zalo** (`https://zalo.me/`).
     - Cơ chế bảo mật 100% **Read-only**, không có bất kỳ nút chỉnh sửa/đổi mật khẩu nào, đảm bảo tính nguyên vẹn cho Ban Điều Hành.
   - **Chuẩn Hóa Thứ Tự Hiển Thị Chi Nhánh & Phân Nhóm Trực Quan:**
     - Sắp xếp thứ tự ưu tiên tuyệt đối theo chuỗi chuẩn: **Văn Phòng ➔ Phú Khương ➔ Đồng Khởi ➔ Mỹ Tho ➔ Cần Thơ ➔ Vĩnh Long ➔ Thủ Đức**.
     - Trong từng chi nhánh, nhân sự được sắp xếp theo cấp bậc (`ROLE_PRIORITY`: Founder/Admin ➔ Quản lý CHT ➔ Kỹ thuật ➔ Bán hàng) và trạng thái trực ca (`WORKING` lên đầu).
     - Khi xem chế độ Toàn Chuỗi, hệ thống tự động phân tách theo từng cụm chi nhánh với thanh Header hiển thị tên shop và tỷ lệ trực chiến riêng biệt (`x/y trực chiến`), giúp Ban Điều Hành giám sát bao quát toàn chuỗi khoa học, dễ nhìn.

### H. Hệ Thống Chatbot Bé 8 Tư Vấn Công Khai & Customer 360 CRM & CSKH Thông Minh (NEW - 20/10)
1. **Trang Chatbot Tư Vấn Bán Hàng & Chăm Sóc Khách Hàng Công Khai (`PublicCustomerChatView.tsx`):**
   - **Đường dẫn độc lập:** `/tu-van`, `?tab=tu-van` hoặc `/chat`. Có thể copy link gửi trực tiếp cho khách hàng, gắn bio TikTok, Fanpage hoặc mã QR tại bàn shop.
   - **Avatar & Nhận Diện Thương Hiệu:** Ảnh đại diện chính thức `public/be8-avatar.jpg` với hiệu ứng vòng tròn phát sáng xanh lá trực tuyến 24/7.
   - **Tích Hợp AI Gemini Flash:** Sử dụng model `gemini-flash-lite-latest` được nạp sẵn toàn bộ 521 sản phẩm từ `products.json` và bảng giá dịch vụ thay pin, ép kính của 7 chi nhánh PK88.
   - **Thu Thập SĐT & Sinh E-Voucher:** AI tự động gợi ý tặng voucher giảm giá độc quyền (`PK88-VIPxxxx`). Khi khách để lại SĐT và chọn chi nhánh gần nhất, dữ liệu được ghi tức thời vào bảng `leads` trên Supabase Cloud kèm theo toàn bộ lịch sử đoạn chat (`activity_log`) và tóm tắt nhu cầu (`conversation_summary`).
2. **Khung Telesales Chốt Đơn Hỏa Tốc (`CustomerLeadsCRMModal.tsx`):**
   - Nút nổi bật `[✨ Khách Chốt Đơn]` ngay trên thanh Header cho Founder, Admin, Cửa Hàng Trưởng và Nhân viên bán hàng.
   - Tự động chuyển trạng thái từ `NEW` (Mới) sang `CONTACTED` (Đang gọi) ngay khi nhân viên bấm `[📞 GỌI ĐIỆN]` hoặc `[💬 CHAT ZALO]`.
   - Các nút chip 1 chạm đổi trạng thái: `🗓️ Hẹn ghé shop`, `✅ Đã mua`, `❌ Hủy`.
   - Xem toàn bộ cuộc hội thoại đối thoại giữa khách hàng và Bé 8 để nhân viên nắm bắt tâm lý khách trước khi nhấc máy.
3. **Tab Khách Hàng 360 & CSKH Độc Lập (`CustomerCRMView.tsx` - `/khach-hang`):**
   - **Hợp Nhất Dữ Liệu Theo Số Điện Thoại (`normalizePhone`):** Tự động liên kết 3 nguồn dữ liệu: Đơn hàng bán lẻ POS (`pk88_pos_orders`), Phiếu sửa chữa (`repair_tickets`) và Khách tiềm năng Chatbot (`leads`).
   - **Hạng Thành Viên Tự Động (Tier):** Phân hạng `DIAMOND` (≥ 5 triệu), `GOLD` (≥ 2 triệu), `SILVER` (≥ 500k), `NEW` (Khách mới).
   - **AI Care Triggers (Nhắc Nhở CSKH Định Kỳ):**
     - Nhắc dán lại cường lực chống trầy sau 60-90 ngày.
     - Nhắc bảo dưỡng và đo độ chai pin sau 90-180 ngày kể từ ngày thay pin.
     - Nhắc chăm sóc và tri ân khách VIP sau 45-60 ngày chưa quay lại shop.
   - **Drawer Hồ Sơ 360:** Xem chi tiết 4 tab nghiệp vụ (Đơn hàng POS, Phiếu sửa chữa, Chatbot Bé 8, Nhật ký CSKH).
   - **Đồng Bộ Hai Chiều Supabase Cloud:** Bảng `customer_profiles` và `customer_care_logs` lưu trữ mọi cập nhật hồ sơ, ghi chú và nhật ký cuộc gọi theo thời gian thực.

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
- **`leave_requests`**: Quản lý đơn xin nghỉ phép.
- **`repair_tickets`**: Phiếu tiếp nhận & sửa chữa thiết bị khách hàng.
- **`leads`**: Khách hàng tiềm năng để lại SĐT từ Chatbot Bé 8 kèm voucher và bản ghi chat.
- **`customer_profiles`**: Hồ sơ khách hàng chuẩn hóa, hạng hội viên, dòng máy và chi nhánh quen.
- **`customer_care_logs`**: Nhật ký các lần gọi điện, nhắn tin Zalo chăm sóc khách hàng của nhân sự.
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
5. **Hệ Thống Cào Dữ Liệu Tự Động Đối Thủ (Live Stealth Scraping & Monitoring - Radar 3km):** Đã hoàn thiện toàn bộ thiết kế kiến trúc tinh vi (khắc phục timeout Vercel bằng GitHub Actions, cào Meta Ad Library API, Reverse Internal APIs giá phụ kiện/ép kính, và Google Maps Reviews) kèm mã SQL Supabase sẵn sàng tại tệp [KE_HOACH_CAO_DATA_DOI_THU_MKT.md](file:///d:/PK88%20AI%20AUTOMATION/KE_HOACH_CAO_DATA_DOI_THU_MKT.md). Hiện đang ở trạng thái **ON-HOLD**, sẵn sàng triển khai ngay khi Ban Lãnh Đạo duyệt kích hoạt.

---

*Hồ sơ bàn giao đã hoàn tất đầy đủ. Chúc AI Agent tiếp theo hợp tác vui vẻ cùng anh Trần Hoàng Sang & Founder Ngô Hồng Thao để đưa Phụ Kiện 88 phát triển rực rỡ!* 🚀

