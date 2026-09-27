# **HỆ THỐNG VẬN HÀNH TỰ ĐỘNG HÓA AI CHUỖI BÁN LẺ PHỤ KIỆN 88**

**Tài liệu Kỹ thuật & Chiến lược Vận hành Tự động hóa Toàn diện**  
Tổng hợp & Hệ thống hóa từ 10 Sơ đồ Thiết kế Kiến trúc Vận hành Đa Chi Nhánh  
*Kiến trúc sư hệ thống: Sang Citizen*

## **MỤC LỤC TỔNG QUAN**

> 1. **Sơ đồ 1:** Kiến trúc Tổng thể Hệ thống (System Architecture)  
> 2. **Sơ đồ 2:** Luồng Dữ liệu Xuyên suốt (Data Flow)  
> 3. **Sơ đồ 3:** Phân khu Trụ sở Chính HQ \- Giám sát & Điều hành dành cho Founder  
> 4. **Sơ đồ 4:** Phân khu Vận hành Chi nhánh (Branch Operations)  
> 5. **Sơ đồ 5:** Phân khu Đào tạo & Nhân bản Đội ngũ (Onboarding & Training)  
> 6. **Sơ đồ 6:** Động cơ AI Engine & Cơ chế Tự động hóa (AI Core)  
> 7. **Sơ đồ 7:** Thiết kế Cấu trúc Cơ sở Dữ liệu Đa Chi Nhánh (Multi-tenant Database Schema)  
> 8. **Sơ đồ 8:** 5 Luồng Công việc Thực tế Vận hành Hằng Ngày  
> 9. **Sơ đồ 9:** Lộ trình Triển khai Thực chiến 12 Tuần  
> 10. **Sơ đồ 10:** Bức tranh Toàn cảnh Chuỗi Cửa hàng khi Vận hành Tự động

## **1\. KIẾN TRÚC TỔNG THỂ HỆ THỐNG (SYSTEM ARCHITECTURE)**

Hệ thống được thiết kế theo mô hình phân tầng module hóa, tách biệt rõ ràng giữa lớp giao tiếp người dùng, lớp middleware điều phối, động cơ trí tuệ nhân tạo và kho dữ liệu hợp nhất.

| Tầng Kiến trúc | Công nghệ & Thành phần | Chức năng & Nhiệm vụ |
| :---- | :---- | :---- |
| **Frontend Layer (Giao diện)** | Web App (Next.js / Vite / TailwindCSS / PWA), Telegram Bot, Facebook Messenger, Zalo OA | Cung cấp giao diện tương tác cho Founder, Quản lý shop, Nhân viên kỹ thuật/bán hàng và Khách hàng tương tác đa kênh. |
| **Middleware & Automation** | n8n (Self-hosted) / Cloudflare Workers / Serverless Functions | Bộ não điều phối luồng dữ liệu, webhook trung gian kết nối các phần mềm chuyên môn (MISA, KiotViet/POS365) với Database. |
| **AI Engine Layer** | Gemini 1.5 Flash / Gemini Pro API, OCR Vision Model | Xử lý ngôn ngữ tự nhiên (NLP) cho cặp trợ lý Chị 8 & Bé 8, trích xuất dữ liệu hóa đơn (OCR), phân tích bất thường và dự báo tồn kho. |
| **Database & Storage** | PostgreSQL (Supabase) \+ Row Level Security (RLS), Cloudflare R2 | Lưu trữ toàn bộ dữ liệu nghiệp vụ theo cấu trúc Multi-tenant (gắn branch\_id) và kho ảnh sản phẩm CDN tốc độ cao. |

## **2\. LUỒNG DỮ LIỆU XUYÊN SUỐT (DATA FLOW)**

Luồng thông tin khép kín từ lúc phát sinh tương tác ngoài thị trường đến khi tổng hợp số liệu cho cấp điều hành:

> * **Điểm chạm Khách hàng (Touchpoint):** Khách nhắn tin qua Fanpage/Zalo hoặc ghé cửa hàng trực tiếp \-\> Chatbot AI tư vấn, định vị nhu cầu \-\> Bắn Lead về Telegram chi nhánh gần nhất.  
> * **Điểm chạm Nghiệp vụ Quầy (Store POS):** Nhân viên tạo đơn hàng trên KiotViet/POS365 hoặc tạo Phiếu sửa chữa/dán máy điện tử trên Web App.  
> * **Xử lý Bán tự động (Event Processing):** Webhook đẩy sự kiện về n8n \-\> Cập nhật trạng thái phiếu, trừ tồn kho và ghi nhận điểm doanh số nhân sự.  
> * **Đồng bộ Kế toán & Quản trị:** Cuối ngày, n8n tổng hợp doanh thu theo hình thức thanh toán (Tiền mặt / VietQR) \-\> Chuẩn hóa định dạng import vào MISA \-\> AI phân tích biên lợi nhuận ròng.

## **3\. PHÂN KHU TRỤ SỞ CHÍNH HQ \- DÀNH CHO FOUNDER**

Giúp người sáng lập (Founder) nắm quyền kiểm soát toàn chuỗi 6+ cửa hàng từ bất kỳ đâu chỉ qua chiếc điện thoại thông minh:

> * **Executive Dashboard:** Hiển thị tổng doanh thu toàn chuỗi theo thời gian thực (Real-time), xếp hạng doanh số giữa các chi nhánh (Bến Tre, Mỹ Tho, Cần Thơ, Vĩnh Long, Trà Vinh...).  
> * **Cơ chế Cảnh báo Đỏ (Red Flags):** Hệ thống tự động gửi còi báo động qua Telegram khi:  
  * Doanh thu một chi nhánh sụt giảm quá 25% trong 3 ngày liên tiếp.  
  * Phiếu sửa chữa/bảo hành tồn đọng quá 5 ngày chưa bàn giao cho khách.  
  * Tồn kho một mặt hàng chủ lực xuống dưới ngưỡng an toàn (Safety Stock).  
> * **Báo cáo Điều hành 22h15 Hằng Đêm:** Bản tin tóm tắt 3 gạch đầu dòng ngắn gọn về biên lợi nhuận, chi phí phát sinh và đề xuất luân chuyển hàng giữa các kho kèm nút bấm duyệt 1 chạm.

## **4\. PHÂN KHU VẬN HÀNH CHI NHÁNH (BRANCH OPERATIONS)**

Tối ưu hóa thao tác của nhân viên tại quầy, loại bỏ hoàn toàn sổ sách giấy:

> * **Chấm công Geofencing (GPS \+ Wifi BSSID):** Nhân viên mở Web App bằng điện thoại cá nhân bấm vào ca \-\> Hệ thống xác thực tọa độ GPS nằm trong bán kính 30m của shop \-\> Ghi nhận giờ công minh bạch.  
> * **Quản lý Phiếu Dịch vụ & Sửa chữa (Repair Tickets):**  
  * Khách gửi máy ép kính / thay pin / dán PPF \-\> Nhân viên chụp ảnh tình trạng máy, chọn dịch vụ \-\> In tem mã vạch dán lưng máy hoặc gửi hóa đơn điện tử qua Zalo cho khách.  
  * Khách quét mã QR trên phiếu để tự tra cứu tiến độ sửa chữa mà không cần gọi điện hỏi shop.  
> * **Kiểm kê Nhanh (Stock Audit):** Cuối ca, nhân viên dùng camera điện thoại quét nhanh mã vạch phụ kiện tại quầy để đối soát tồn thực tế với KiotViet.

## **5\. PHÂN KHU ĐÀO TẠO & NHÂN BẢN ĐỘI NGŨ (ONBOARDING & TRAINING)**

Mô hình "Cửa hàng trong hộp" (Store-in-a-Box) giúp mở rộng chi nhánh mà không lo hổng kiến thức nhân sự:

> * **Lộ trình 7 Ngày Huấn luyện Tự động:**  
  * **Ngày 1-2:** Văn hóa chào khách miền Tây, nội quy chi nhánh, phân loại các dòng phụ kiện (cường lực Kingkong, Hoda, ốp Likgus).  
  * **Ngày 3-4:** Quy trình kỹ thuật (dán màn hình không bụi bọt, dán PPF bo góc, an toàn tháo lắp pin).  
  * **Ngày 5-6:** Kỹ năng xử lý khiếu nại, kỹ thuật Upsell combo bảo vệ toàn diện.  
  * **Ngày 7:** Bài kiểm tra sát hạch 20 câu hỏi tình huống trên Web App do AI chấm điểm tự động. Đạt từ 85/100 mới mở quyền đứng quầy.  
> * **Trợ lý Tra cứu Nghiệp vụ 24/7:** Nhân viên gõ vào bot nội bộ: *"Màn hình 13 Pro Max bị trắng màn xử lý giá bao nhiêu?"* \-\> Bot trích xuất ngay bảng giá kỹ thuật và chính sách bảo hành trong 1 giây.

## **6\. ĐỘNG CƠ AI ENGINE & CƠ CHẾ TỰ ĐỘNG HÓA**

Các tác nhân trí tuệ nhân tạo (AI Agents) chuyên trách đảm nhiệm từng vai trò:

| Tác nhân AI | Mô hình & Nhiệm vụ | Đầu ra Thực tế |
| :---- | :---- | :---- |
| **AI Customer Support (Chị 8 & Bé 8\)** | Gemini 1.5 Flash \+ RAG Vector/Catalog | Trực chat Fanpage/Zalo, giải đáp thắc mắc, gửi hình ảnh sản phẩm, bóc tách SĐT và chi nhánh gần nhất. |
| **AI Invoice OCR Agent** | Gemini Vision OCR | Đọc file hóa đơn nhập hàng PDF/ảnh từ nhà cung cấp, xuất bảng kê chuẩn định dạng MISA/Excel. |
| **AI Inventory Predictor** | Time-series Analysis \+ Gemini Flash | Phân tích tốc độ bán ra (Burn rate), cảnh báo thiếu hàng cục bộ và đề xuất số lượng đặt hàng tối ưu. |
| **AI Executive Copilot** | LLM Synthesis Agent | Tổng hợp dữ liệu toàn chuỗi lúc 22h15 hằng đêm, viết bản tóm tắt tình hình kinh doanh cho Founder. |

## **7\. THIẾT KẾ CẤU TRÚC DỮ LIỆU ĐA CHI NHÁNH (DATABASE SCHEMA)**

Cấu trúc chuẩn PostgreSQL trên nền tảng Supabase, toàn bộ các bảng dữ liệu vận hành đều bắt buộc chứa khóa ngoại branch\_id để phân quyền và cô lập dữ liệu an toàn:

\-- 1\. BẢNG CHI NHÁNH (BRANCHES)  
CREATE TABLE branches (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    code VARCHAR(20) UNIQUE NOT NULL, \-- PK88\_MYTHO, PK88\_BENTRE...  
    name VARCHAR(100) NOT NULL,  
    address TEXT NOT NULL,  
    lat DOUBLE PRECISION,  
    lng DOUBLE PRECISION,  
    wifi\_bssid VARCHAR(50),  
    telegram\_group\_id VARCHAR(50),  
    is\_active BOOLEAN DEFAULT TRUE,  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

\-- 2\. BẢNG NHÂN SỰ (STAFF)  
CREATE TABLE staff (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    branch\_id UUID REFERENCES branches(id),  
    full\_name VARCHAR(100) NOT NULL,  
    phone VARCHAR(20) UNIQUE NOT NULL,  
    role VARCHAR(20) DEFAULT 'staff', \-- founder, manager, technician, sales  
    is\_active BOOLEAN DEFAULT TRUE  
);

\-- 3\. BẢNG PHIẾU DỊCH VỤ / SỬA CHỮA (REPAIR\_TICKETS)  
CREATE TABLE repair\_tickets (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    branch\_id UUID REFERENCES branches(id) NOT NULL,  
    customer\_phone VARCHAR(20) NOT NULL,  
    customer\_name VARCHAR(100),  
    device\_model VARCHAR(100) NOT NULL,  
    service\_type VARCHAR(50) NOT NULL, \-- THAY\_PIN, EP\_KINH, DAN\_PPF  
    status VARCHAR(30) DEFAULT 'RECEIVED', \-- RECEIVED, IN\_PROGRESS, READY, DELIVERED  
    price NUMERIC(12, 2\) DEFAULT 0,  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

\-- 4\. BẢNG CHẤM CÔNG GPS (ATTENDANCE)  
CREATE TABLE attendance (  
    id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
    staff\_id UUID REFERENCES staff(id) NOT NULL,  
    branch\_id UUID REFERENCES branches(id) NOT NULL,  
    check\_in TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  
    check\_out TIMESTAMP WITH TIME ZONE,  
    lat DOUBLE PRECISION,  
    lng DOUBLE PRECISION,  
    is\_verified BOOLEAN DEFAULT FALSE  
);

## **8\. 5 LUỒNG CÔNG VIỆC THỰC TẾ VẬN HÀNH HẰNG NGÀY**

> 1. **Luồng Tiếp nhận & Chăm sóc Khách hàng:** Khách chat Facebook/Zalo ➡️ Chị 8 & Bé 8 tư vấn kèm ảnh mẫu ➡️ Khách để lại SĐT ➡️ Bắn Lead sang Telegram Shop ➡️ Quản lý gọi chốt lịch.  
> 2. **Luồng Sửa chữa & Dán máy:** Khách đem máy đến shop ➡️ Kỹ thuật tạo phiếu trên Web App ➡️ Khách nhận tin Zalo tra cứu ➡️ Sửa xong máy chuyển trạng thái "SẴN SÀNG" ➡️ Hệ thống tự động nhắn khách ghé lấy.  
> 3. **Luồng Nhập hàng & Kiểm kê Kho:** Hàng về kèm hóa đơn PDF/ảnh ➡️ AI OCR đọc thông số tự động ➡️ Kế toán bấm "Duyệt" 1 chạm ➡️ Số liệu tự động đồng bộ vào MISA và KiotViet.  
> 4. **Luồng Giám sát & Quản trị Nhân sự:** Nhân viên check-in GPS tại cửa hàng ➡️ AI theo dõi giờ công thực tế ➡️ Tự động tính điểm thi đua và bảng lương tạm tính cuối tháng.  
> 5. **Luồng Đóng ca & Báo cáo Lợi nhuận:** 22h00 các shop chốt ca ➡️ n8n kéo số liệu KiotViet ➡️ Đối soát thanh toán VietQR ngân hàng ➡️ 22h15 gửi báo cáo tài chính tinh gọn đến Telegram Founder.

## **9\. LỘ TRÌNH TRIỂN KHAI THỰC CHIẾN 12 TUẦN**

| Giai đoạn | Mục tiêu Trọng tâm | Hạng mục Công việc Cụ thể |
| :---- | :---- | :---- |
| **Tuần 1 \- 3: Quick Wins & Minh bạch Hóa** | Tạo kết quả thấy ngay, không làm xáo trộn vận hành quầy. | \- Đấu nối chatbot Chị 8 & Bé 8 vào Fanpage Phụ Kiện 88 để tự trực chat và bắt Lead về Telegram. \- Triển khai Web App chấm công định vị GPS chống gian lận cho 6 cửa hàng. \- Cấu hình nhóm Telegram nhận cảnh báo tự động cho Founder. |
| **Tuần 4 \- 8: Chuẩn hóa Quy trình Dịch vụ** | Số hóa phân hệ sửa chữa và liên thông dữ liệu. | \- Triển khai phân hệ Phiếu sửa chữa điện tử (Repair Ticket) có mã QR tra cứu. \- Xây dựng workflow n8n tự động kéo dữ liệu bill KiotViet về Supabase lúc 22h00. \- Triển khai AI OCR tự động đọc hóa đơn đầu vào cho kế toán MISA. |
| **Tuần 9 \- 12: Động cơ AI & Tự động hóa Toàn diện** | Kích hoạt trí tuệ nhân tạo dự báo và đào tạo nội bộ. | \- Đưa Trợ lý AI Huấn luyện 7 ngày vào chạy tự động cho nhân viên thử việc mới. \- Kích hoạt thuật toán cảnh báo tồn kho và dự báo đặt hàng linh kiện. \- Tinh chỉnh Báo cáo Giám đốc 22h15 với biên lợi nhuận ròng thời gian thực. |
| **Tuần 13+: Nhân bản Không giới hạn** | Mở rộng chuỗi thần tốc theo mô hình Store-in-a-Box. | \- Đóng gói toàn bộ cấu hình: Chỉ mất 5 phút để kích hoạt thêm một chi nhánh mới vào hệ thống. \- Tối ưu hóa chi phí vận hành máy chủ và tài nguyên AI. |

## **10\. BỨC TRANH TOÀN CẢNH KHI VẬN HÀNH TỰ ĐỘNG**

Sau khi hoàn thành 12 tuần triển khai, Phụ Kiện 88 sẽ đạt được bước chuyển dịch toàn diện:

> * **Đối với Khách hàng:** Trải nghiệm chăm sóc liền mạch từ Online đến Offline, được hỗ trợ 24/7, tra cứu bảo hành minh bạch bằng QR Code, tạo dựng niềm tin tuyệt đối.  
> * **Đối với Nhân viên tại quầy:** Giảm 100% việc ghi chép sổ sách thủ công, chấm công nhanh gọn qua điện thoại, có trợ lý AI hỗ trợ kỹ thuật tức thì, lộ trình thăng tiến rõ ràng qua điểm thi đua tự động.  
> * **Đối với Bộ phận Kế toán:** Tiết kiệm hơn 70% thời gian gõ hóa đơn thủ công và đối soát tiền chuyển khoản ngân hàng, không còn cảnh làm thêm giờ căng thẳng vào cuối tháng.  
> * **Đối với Founder (Sếp Thao):** Thoát khỏi sự vụ vụn vặt, không phải gọi điện kiểm tra từng shop mỗi ngày. Mọi số liệu kinh doanh đều minh bạch trong lòng bàn tay, sẵn sàng mở rộng từ 6 lên 30 chi nhánh một cách vững chắc\!