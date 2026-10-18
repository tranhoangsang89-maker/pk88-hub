# YÊU CẦU NÂNG CẤP: BỘ TỨ TỰ ĐỘNG HÓA MARKETING (PK88 MARKETING AUTOMATION SUITE)

## 1. BỐI CẢNH & MỤC TIÊU
Nhằm giải phóng 80% thời gian làm việc thủ công của team Marketing (Leader Khả Tú, Media Quốc Việt và nhân sự 7 chi nhánh), hệ thống cần tích hợp một phân hệ toàn diện mang tên **"Xưởng Marketing 88 (PK88 Marketing Studio)"** vào `src/components/` và liên kết với `MarketingDashboard.tsx`.
Hệ thống gồm 4 Module nghiệp vụ cốt lõi:
1. **Radar Hot Trend:** Gợi ý ý tưởng viral & chuyển thể sang kịch bản miền Tây độc quyền.
2. **Content Repurposing (1 ra 4):** Nhập 1 nội dung thô, AI tự động nhân bản ra 4 định dạng chuẩn (Facebook, TikTok, Zalo OA, Google Maps).
3. **Khung Ảnh Tự Động (HTML5 Canvas Auto-Framing):** Kéo ảnh chụp thật tại shop thả vào -> tự động dập khung thương hiệu PK88, tự điền tên & giá niêm yết từ kho 521 SKU, xuất ảnh 1080x1080 trong 1 giây.
4. **Bàn Tổng Biên Tập (Editorial Review Queue):** Bảng Kanban dành riêng cho Leader Tú duyệt bài từ 7 shop trước khi đăng, kèm nút Duyệt 1-click, Sửa nhanh và Trả về kèm góp ý.

---

## 2. CẬP NHẬT CƠ SỞ DỮ LIỆU (SUPABASE SCHEMA)
Bổ sung các trường vào bảng `marketing_posts` để phục vụ quy trình kiểm duyệt và lưu trữ đa kênh:
```sql
ALTER TABLE marketing_posts 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS reviewer_feedback TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS facebook_caption TEXT,
ADD COLUMN IF NOT EXISTS tiktok_script TEXT,
ADD COLUMN IF NOT EXISTS zalo_text TEXT,
ADD COLUMN IF NOT EXISTS gmaps_text TEXT,
ADD COLUMN IF NOT EXISTS framed_image_url TEXT;