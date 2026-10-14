Hãy nâng cấp toàn diện phân hệ "Chấm Công & Quản Lý Ca Kíp" hiện tại trên dự án PK88 Hub theo chuẩn giao diện Dashboard hiện đại (Dark-mode, phong cách giống AFOODS Hub). Giữ nguyên kết nối cơ sở dữ liệu và xác thực người dùng hiện có, triển khai cụ thể các module sau:

### 1. Nâng cấp Màn hình Check-in Nhân viên (User View):
- **Trực quan hóa Bản đồ GPS Geofencing:**
  - Tích hợp bản đồ tương tác (sử dụng Leaflet / react-leaflet hoặc OpenStreetMap).
  - Tọa độ tâm là vị trí chi nhánh đang chọn. Vẽ vòng tròn bán kính Geofence an toàn (150m - 200m) màu xanh ngọc (Emerald).
  - Đánh dấu marker vị trí thực tế của nhân viên. Hiển thị khoảng cách chính xác đến cửa hàng và dòng trạng thái: "Trong phạm vi hợp lệ" (Xanh) hoặc "Ngoài phạm vi" (Đỏ/Cam).
  - Thêm nút chuyển đổi "Chế độ Test/Demo" (Tại shop 15m / Ngoài shop 15km) để hỗ trợ kiểm thử tính năng khi không có GPS thật.
- **Đồng hồ đếm giờ làm việc Realtime (Live Work Timer):**
  - Khi nhân viên bấm "Chấm Công Vào" thành công, hiển thị đồng hồ số đếm thời gian làm việc thực tế (HH:mm:ss) chạy theo thời gian thực.
  - Tự động đổi trạng thái nút bấm chính từ "Chấm Công Vào" sang "Chấm Công Ra".
- **Hệ thống Ca làm việc:**
  - Mở rộng danh sách ca: Ca Sáng (07:00 - 15:00), Ca Chiều (14:00 - 22:00), Ca Hành chính (08:00 - 17:00) và Ca Tăng cường/Part-time.
  - Tự động gắn cờ "Đi trễ" nếu bấm check-in sau giờ bắt đầu ca quy định.

### 2. Nâng cấp Bảng Nhật ký & Quản trị Chấm công (Admin/HR View):
- **Thẻ KPI tổng quan (Dashboard Summary):**
  - Tổng nhân sự hôm nay, Tỷ lệ hiện diện (%), Số lượt đi trễ, Số lượt cảnh báo ngoài vùng GPS.
- **Bảng Nhật ký Chi tiết (Daily Detailed Timesheet Grid):**
  - Thay vì chỉ hiển thị một con số tổng giờ gộp, hãy bổ sung bảng hiển thị chi tiết từng lượt vào/ra:
    - Cột: [Mã NV] | [Họ Tên] | [Chi Nhánh] | [Ngày] | [Ca Làm Việc] | [Giờ Vào] | [Giờ Ra] | [Tổng Giờ] | [Khoảng Cách GPS] | [Trạng Thái].
  - Cột [Trạng Thái] sử dụng Badge màu:
    - Xanh lá: "Đúng giờ / Hợp lệ"
    - Vàng: "Đi trễ (sau ...)"
    - Đỏ: "Ngoài phạm vi GPS (> 200m)"
- **Bộ lọc đa tiêu chí:**
  - Lọc theo khoảng ngày (Từ ngày - Đến ngày).
  - Lọc theo Chi nhánh và Loại ca làm việc.
  - Lọc riêng các bản ghi "Có cảnh báo" (Đi trễ hoặc ngoài GPS) để quản lý dễ dàng đối soát.

### 3. Tính năng Xuất Báo Cáo (Excel Export):
- Bổ sung nút "Xuất Excel (.xlsx)" ở góc bảng quản trị.
- Dùng thư viện `xlsx` (SheetJS) xuất toàn bộ dữ liệu bảng công chi tiết theo danh sách đã lọc ra tệp `bang_cham_cong_pk88_[Ngay-Thang-Nam].xlsx`.

### 4. Yêu cầu Giao diện (UI/UX Styling):
- Sử dụng Tailwind CSS với bảng màu Dark Theme sang trọng (Background Slate/Zinc-900, Card bo góc bo viền xám mờ border-slate-800, điểm nhấn màu Emerald cho trạng thái thành công).
- Bổ sung Toast Notification phản hồi tức thì mỗi khi bấm Check-in/out hoặc Xuất dữ liệu.