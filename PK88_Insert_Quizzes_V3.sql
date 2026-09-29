-- ==================================================
-- TẠO BỘ CÂU HỎI TRẮC NGHIỆM CHUYÊN SÂU (3-4 CÂU/BÀI)
-- ==================================================

DELETE FROM quizzes;

DO $$ 
DECLARE
    lesson_rec RECORD;
BEGIN
    FOR lesson_rec IN SELECT id, day_number, title FROM lessons ORDER BY day_number LOOP
        
        -- Ngày 1: Tầm nhìn & Sứ mệnh
        IF lesson_rec.day_number = 1 THEN
            INSERT INTO quizzes (lesson_id, question, options, correct_option_index) VALUES 
            (lesson_rec.id, 'Tầm nhìn chiến lược của Phụ Kiện 88 trong tương lai là gì?', '["Mở 100 cửa hàng toàn quốc", "Trở thành chuỗi bán lẻ phụ kiện hàng đầu khu vực miền Tây", "Trở thành trung tâm bảo hành của Apple"]', 1),
            (lesson_rec.id, 'Sứ mệnh cốt lõi mà Phụ Kiện 88 mang lại cho khách hàng là gì?', '["Bán hàng rẻ nhất thị trường", "Mang đến sản phẩm chất lượng, dịch vụ tận tâm và trải nghiệm AI", "Chỉ tập trung vào bán sỉ"]', 1),
            (lesson_rec.id, 'Ba giá trị văn hóa cốt lõi của nhân viên PK88 là gì?', '["Tận tâm, Trung thực, Trách nhiệm", "Nhanh nhẹn, Thông minh, Thân thiện", "Tôn trọng, Lắng nghe, Chia sẻ"]', 0);
        END IF;

        -- Ngày 2: Chấm công
        IF lesson_rec.day_number = 2 THEN
            INSERT INTO quizzes (lesson_id, question, options, correct_option_index) VALUES 
            (lesson_rec.id, 'Nhân viên bắt buộc phải đứng trong bán kính bao nhiêu mét để có thể Check-in GPS thành công?', '["50m", "100m", "200m"]', 1),
            (lesson_rec.id, 'Trường hợp quên Check-in trên hệ thống Web App, nhân viên sẽ bị xử lý như thế nào?', '["Bị trừ 50% lương ca đó", "Không được tính lương ca làm việc đó do hệ thống AI ghi nhận", "Được quản lý chấm công tay lại"]', 1),
            (lesson_rec.id, 'Ngoài lương cơ bản theo giờ, nhân viên còn được nhận thêm khoản thu nhập nào?', '["Tiền thưởng chuyên cần", "Hoa hồng bán hàng và Upsell thành công", "Tiền tip của khách"]', 1);
        END IF;

        -- Ngày 3: Làm quen
        IF lesson_rec.day_number = 3 THEN
            INSERT INTO quizzes (lesson_id, question, options, correct_option_index) VALUES 
            (lesson_rec.id, 'Nhiệm vụ đầu tiên và cuối cùng mỗi ngày của một nhân viên PK88 là gì?', '["Lướt Tiktok cập nhật xu hướng", "Vệ sinh quầy kệ và sắp xếp hàng hóa gọn gàng", "Kiểm tra doanh thu"]', 1),
            (lesson_rec.id, 'Khu vực nào KHÔNG thuộc không gian trưng bày tiêu chuẩn của PK88?', '["Tủ kính Cường Lực", "Khu vực Bàn Kỹ Thuật", "Khu vực bán đồ ăn nhanh"]', 2);
        END IF;

        -- Ngày 4: Cường Lực 
        IF lesson_rec.day_number = 4 THEN
            INSERT INTO quizzes (lesson_id, question, options, correct_option_index) VALUES 
            (lesson_rec.id, 'Phụ Kiện 88 hiện đang kinh doanh mấy loại kính cường lực chính?', '["2 loại: Trong suốt và Nhám", "3 loại: Trong suốt, Chống nhìn trộm, Chống vân tay", "Chỉ 1 loại duy nhất"]', 1),
            (lesson_rec.id, 'Chính sách bảo hành MIỄN PHÍ 45 NGÀY áp dụng cho trường hợp nào?', '["Rơi vỡ màn hình", "Bong tróc keo tự nhiên hoặc cảm ứng không ăn", "Trầy xước do sử dụng"]', 1),
            (lesson_rec.id, 'Nếu khách hàng làm rơi vỡ kính cường lực trong vòng 45 ngày, cửa hàng sẽ hỗ trợ như thế nào?', '["Từ chối bảo hành hoàn toàn", "Dán lại kính mới miễn phí 100%", "Hỗ trợ giảm 50% chi phí dán kính mới"]', 2),
            (lesson_rec.id, 'Cường lực Vua (Kingkong) cho iPhone 15 Promax có mức giá niêm yết chuẩn là bao nhiêu?', '["150.000 VNĐ", "199.000 VNĐ", "299.000 VNĐ"]', 1);
        END IF;

        -- Ngày 5: PPF 
        IF lesson_rec.day_number = 5 THEN
            INSERT INTO quizzes (lesson_id, question, options, correct_option_index) VALUES 
            (lesson_rec.id, 'Miếng dán PPF tại cửa hàng có tính năng đặc biệt nào?', '["Chống vỡ màn hình tuyệt đối", "Tự phục hồi các vết xước dăm, xước nhẹ", "Chống nước cho điện thoại"]', 1),
            (lesson_rec.id, 'Thời gian bảo hành của miếng dán PPF là bao lâu?', '["15 Ngày", "30 Ngày", "45 Ngày"]', 1),
            (lesson_rec.id, 'Nếu khách hàng tự bóc PPF làm dính bụi, chính sách xử lý là gì?', '["Miễn phí dán lại", "Giảm 50% phí dán mới", "Không hỗ trợ"]', 1);
        END IF;

        -- Ngày 19: Quy trình 6 bước
        IF lesson_rec.day_number = 19 THEN
            INSERT INTO quizzes (lesson_id, question, options, correct_option_index) VALUES 
            (lesson_rec.id, 'Trong quy trình bán hàng 6 bước, Bước số 2 là gì?', '["Chào đón khách hàng", "Tìm hiểu nhu cầu thực tế của khách", "Chốt Sale"]', 1),
            (lesson_rec.id, 'Kỹ năng "Cross-sell" (Bán chéo) diễn ra ở bước nào?', '["Bước 1", "Bước 3", "Bước 4"]', 2),
            (lesson_rec.id, 'Mục đích chính của việc xin Số điện thoại khách hàng ở Bước 5 là gì?', '["Để gọi điện làm phiền", "Lưu thông tin bảo hành điện tử trên hệ thống tự động", "Để kết bạn Zalo"]', 1);
        END IF;

        -- Generic cho các ngày còn lại (6-18, 20-60)
        IF lesson_rec.day_number NOT IN (1, 2, 3, 4, 5, 19) THEN
            INSERT INTO quizzes (lesson_id, question, options, correct_option_index) VALUES 
            (lesson_rec.id, 'Theo bạn, kiến thức trong bài học Ngày ' || lesson_rec.day_number || ' giúp giải quyết nỗi đau (pain point) nào của khách hàng?', '["Sợ mua hớ giá", "Sợ mua phải hàng giả, hàng kém chất lượng không được bảo hành", "Sợ nhân viên thái độ kém"]', 1),
            (lesson_rec.id, 'Nếu khách hàng so sánh giá sản phẩm trong bài này với đối thủ cạnh tranh rẻ hơn 20k, bạn sẽ tư vấn sao?', '["Dạ bên em đắt hơn vì mặt bằng lớn", "Dạ anh chị ra chỗ đó mua đi ạ", "Phân tích giá trị gia tăng: Bảo hành đổi trả, chế độ hậu mãi và uy tín thương hiệu PK88"]', 2),
            (lesson_rec.id, 'Chi tiết quan trọng nhất cần lưu ý khi thực hiện nghiệp vụ của Ngày ' || lesson_rec.day_number || ' là?', '["Làm thật nhanh để chốt khách khác", "Tuân thủ đúng quy trình, kiểm tra kỹ lưỡng trước khi giao cho khách", "Bỏ qua các bước kiểm tra nếu khách đang vội"]', 1);
        END IF;

    END LOOP;
END $$;
