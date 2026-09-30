-- ==================================================
-- TẠO CÂU HỎI SÁT HẠCH TỰ ĐỘNG CHO 60 NGÀY
-- ==================================================

-- 1. Xóa các câu hỏi cũ (nếu có)
DELETE FROM quizzes;

DO $$ 
DECLARE
    lesson_rec RECORD;
BEGIN
    FOR lesson_rec IN SELECT id, day_number, title FROM lessons ORDER BY day_number LOOP
        
        -- Câu 1: Câu hỏi xác nhận kiến thức chung cho MỌI BÀI HỌC
        INSERT INTO quizzes (lesson_id, question, options, correct_option_index)
        VALUES (
            lesson_rec.id, 
            'Sau khi học xong Bài ngày ' || lesson_rec.day_number || ' (' || lesson_rec.title || '), bạn đã nắm rõ các quy định và kiến thức cốt lõi chưa?', 
            '["Đã nắm rõ và có thể tư vấn khách hàng / áp dụng vào thực tế", "Tôi vẫn còn phân vân, cần quản lý đào tạo lại", "Nội dung quá dài, tôi chưa đọc hết"]', 
            0
        );

        -- Câu 2: Câu hỏi sát hạch chuyên sâu (Dành riêng cho Giai đoạn Bán Hàng - Kiến thức Sản phẩm)
        IF lesson_rec.day_number >= 4 AND lesson_rec.day_number <= 18 THEN
            INSERT INTO quizzes (lesson_id, question, options, correct_option_index)
            VALUES (
                lesson_rec.id, 
                'Thời gian bảo hành tiêu chuẩn và cách xử lý khi khách hàng phàn nàn về lỗi của dòng sản phẩm này là gì?', 
                '["Từ chối bảo hành nếu sản phẩm đã bóc seal", "Tùy thuộc vào thái độ của khách hàng", "Tuân thủ đúng chính sách 30/45 ngày hoặc 8 tháng. Kiểm tra ngoại quan, lỗi NSX thì đổi mới/dán lại. Lỗi người dùng thì hỗ trợ giảm 50%."]', 
                2
            );
        END IF;

        -- Câu hỏi riêng cho Ngày 19: Quy trình 6 bước
        IF lesson_rec.day_number = 19 THEN
            INSERT INTO quizzes (lesson_id, question, options, correct_option_index)
            VALUES (
                lesson_rec.id, 
                'Trong quy trình bán hàng 6 bước chuẩn Phụ Kiện 88, bước nào là quan trọng nhất để gia tăng doanh thu trên mỗi khách hàng?', 
                '["Bước 1: Chào đón khách hàng", "Bước 4: Chốt sale và Cross-sell (Bán chéo thêm sản phẩm)", "Bước 6: Tiễn khách"]', 
                1
            );
        END IF;

    END LOOP;
END $$;
