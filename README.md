# 📱 PK88 HUB - HỆ THỐNG VẬN HÀNH & TỰ ĐỘNG HÓA AI CHUỖI PHỤ KIỆN 88

[![Live Deployment](https://img.shields.io/badge/Vercel-Live%20Production-success?style=for-the-badge&logo=vercel)](https://pk88-hub.vercel.app/)
[![React 19](https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Realtime-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-Flash--Lite%20AI-orange?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Meta Messenger](https://img.shields.io/badge/Meta%20Graph%20API-7%20Fanpages%20Webhook-0084FF?style=for-the-badge&logo=messenger)](https://developers.facebook.com/)

Hệ thống quản trị, tự động hóa vận hành toàn diện và AI CSKH thông minh dành riêng cho Chuỗi Cửa Hàng Bán Lẻ & Dịch Vụ Sửa Chữa **Phụ Kiện 88** (7 Chi nhánh tại TP.HCM & Miền Tây: Bến Tre, Tiền Giang, Cần Thơ, Vĩnh Long, TP. Thủ Đức).

---

## 🌟 CÁC PHÂN HỆ VẬN HÀNH NỔI BẬT

### 1. 🤖 Bé 8 AI CSKH Đa Chi Nhánh (Facebook Messenger & Web Chat)
- **Tích hợp trực tiếp 7 Fanpage:** Tự động kết nối, nhận diện và định tuyến theo thời gian thực tới 7 chi nhánh qua Webhook Vercel Serverless (`api/meta-webhook.ts`).
- **AI Phục Vụ Chuẩn Văn Hóa 88:** Sử dụng mô hình `gemini-flash-lite-latest` được huấn luyện chuyên sâu với bảng giá chuẩn (kính cường lực KingKong, ép kính chân không, thay pin dung lượng cao, củ cáp sạc) cùng nguyên tắc giao tiếp ngũ lợi (không nói "hết hàng", "không biết").
- **Tự động trích xuất Lead:** Phát hiện số điện thoại khách hàng, nhận diện chi nhánh gần nhất và đẩy tức thời vào bảng CRM Telesales.

### 2. 🎯 Bảng Điều Phối Khách Hàng Chốt Đơn Telesales CRM
- Quản lý tập trung toàn bộ khách hàng để lại thông tin từ Facebook và Web.
- **Lịch sử hội thoại chi tiết:** Hiển thị trọn vẹn từng câu chat bong bóng giữa khách hàng và Bé 8 kèm mốc thời gian, avatar đại diện.
- **Tiến độ chốt đơn 1 chạm:** Phân chia trạng thái (Mới chưa gọi, Đã gọi tư vấn, Hẹn ghé shop, Đã mua, Hủy) và tích hợp nút gọi điện / chat Zalo nhanh chóng cho nhân viên trực shop.

### 3. ❤️ Văn Hóa 88 - Phục Vụ Từ Trái Tim
- Tích hợp tab độc lập song hành cùng Học Viện 88 trên thanh điều hướng toàn chuỗi.
- **Số hóa 15 trang Cẩm Nang Quy Tắc Ứng Xử PK88:** Chế độ Trình chiếu Slide tương tác lật trang và Chế độ Đọc Liền Mạch tối ưu hoàn hảo cho màn hình điện thoại.
- Đính kèm tệp PDF gốc chuẩn in ấn (`/van-hoa-pk88.pdf`) hỗ trợ tải về 1 chạm.

### 4. 📍 Chấm Công GPS Geofencing & Quản Trị Nhân Sự RBAC
- **Định vị chuẩn xác:** Bán kính Geofencing xác định nhân viên có mặt tại đúng chi nhánh, chống gian lận vị trí.
- **Khóa cứng theo lịch phân ca:** Bắt buộc nhân viên check-in đúng ca trực được phê duyệt trên Ma Trận 15 Ngày.
- **Phân quyền RBAC nghiêm ngặt:** Quản lý Chi Nhánh (CHT) chỉ quản lý và phê duyệt nhân sự trong phạm vi chi nhánh; Ban Điều Hành & HR toàn quyền kiểm soát chuỗi.

### 5. 🗓️ Ma Trận Phân Ca 15 Ngày & Chấm Bù Thông Minh
- Bảng điều phối nhân sự trực quan theo từng ngày, ca sáng / ca chiều / ca gãy.
- Chế độ "Check-in bù (Đang làm việc)" hỗ trợ ghi nhận công thực tế linh hoạt khi nhân sự quên bấm nút đầu ca.

### 6. 🎓 Học Viện 88 (LMS Đào Tạo Nội Bộ 60 Ngày)
- Kho bài giảng số hóa và lộ trình thăng tiến chuẩn từ Nhân viên thử việc lên Chuyên viên & Cửa hàng trưởng.
- Ngân hàng trắc nghiệm tự động chấm điểm và cấp chứng chỉ số nội bộ.

### 7. 💰 Tính Lương Tự Động & Thưởng Nóng VietQR
- Bảng lương minh bạch theo từng vai trò, thưởng nóng chuyển khoản tức thời quét mã VietQR tự động.

---

## 🏗️ CẤU TRÚC KIẾN TRÚC DỰ ÁN

```
c:\PK88 AA\
├── api/
│   └── meta-webhook.ts           # Vercel Serverless Function kết nối Webhook Meta & Gemini AI
├── public/
│   ├── van-hoa-pk88.pdf          # Tệp Cẩm Nang Văn Hóa 88 gốc 15 trang
│   ├── privacy.html              # Trang Chính Sách Quyền Riêng Tư (Meta Verification)
│   └── logo-pk88.jpg             # Logo thương hiệu Phụ Kiện 88
├── src/
│   ├── components/
│   │   ├── CultureHandbookView.tsx    # Phân hệ Số hóa 15 trang Văn Hóa 88
│   │   ├── CustomerLeadsCRMModal.tsx  # Modal CRM Khách Hàng Tiềm Năng & Lịch Sử Chat
│   │   ├── MarketingDashboard.tsx     # Bảng Điều Khiển Marketing & Phân Bổ Lead
│   │   ├── AttendanceTimesheetView.tsx# Bảng Công GPS & Phân Quyền RBAC
│   │   ├── AttendanceCard.tsx         # Thẻ Chấm Công GPS & Khóa Ca Cố Định
│   │   ├── ShiftSchedulingMatrix.tsx  # Ma Trận Phân Ca 15 Ngày
│   │   └── PublicCustomerChatView.tsx # Giao Diện Chatbot Bé 8 Khách Hàng Trực Tiếp
│   ├── lib/
│   │   ├── router.ts             # Quản lý Routing & Tab điều hướng
│   │   └── supabase.ts           # Kết nối Supabase Cloud Database & Realtime
│   ├── App.tsx                   # Thành phần điều hướng chính & Navigation Bar
│   └── main.tsx
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vercel.json
```

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN

### Yêu cầu môi trường:
- Node.js >= 18.x
- NPM >= 9.x

### Các bước khởi chạy:
```bash
# 1. Cài đặt các thư viện phụ thuộc
npm install

# 2. Khởi động môi trường phát triển cục bộ
npm run dev
# Mở trình duyệt tại: http://localhost:3000/

# 3. Kiểm tra tính toàn vẹn kiểu dữ liệu
npx tsc --noEmit

# 4. Đóng gói bản Production
npm run build
```

---

## 🔒 BẢO MẬT & BẢN QUYỀN

- Toàn bộ token Facebook Fanpage, API Key và Supabase Credentials được quản lý qua biến môi trường an toàn và file bảo mật `.gitignore`.
- Bản quyền © 2026 thuộc về **Chuỗi Cửa Hàng Phụ Kiện 88**. Mọi quyền được bảo lưu.
