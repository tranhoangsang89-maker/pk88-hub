-- ==========================================
-- PHÂN KHU ĐÀO TẠO & NHÂN BẢN ĐỘI NGŨ (LMS)
-- ==========================================

-- 5. BẢNG KHÓA HỌC (COURSES)
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_days INT DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. BẢNG BÀI HỌC (LESSONS)
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. BẢNG CÂU HỎI TRẮC NGHIỆM (QUIZZES)
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Ví dụ: ["Đáp án A", "Đáp án B", "Đáp án C"]
    correct_option_index INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. BẢNG TIẾN ĐỘ HỌC TẬP (STAFF_PROGRESS)
CREATE TABLE staff_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED
    score INT,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(staff_id, lesson_id)
);

-- TẠO DỮ LIỆU MẪU: KHÓA HỌC ĐÀO TẠO 60 NGÀY
INSERT INTO courses (title, description, total_days)
VALUES ('Chương trình Đào tạo Hội nhập & Nghiệp vụ 60 Ngày', 'Áp dụng cho toàn bộ nhân viên mới tại cửa hàng và hệ thống Phụ Kiện 88.', 60);

-- MỘT SỐ BÀI HỌC MẪU ĐƯỢC TRÍCH TỪ TÀI LIỆU
DO $$ 
DECLARE
    course_id UUID;
    lesson_1_id UUID;
    lesson_2_id UUID;
BEGIN
    SELECT id INTO course_id FROM courses LIMIT 1;

    -- Bài học 1
    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 1, 'Kiến Thức Về Cường Lực', 
        'Có 3 loại cường lực chính: Cường lực trong suốt, chống nhìn trộm, chống vân tay.
Bảo hành: 45 ngày (Giảm 50% nếu rơi vỡ, Miễn phí nếu bong keo hoặc cảm ứng không ăn).
- Cường lực Android: S24 Ultra kính trong Anank 269k, chống nhìn trộm Anank 299k.
- Cường lực iPhone: Kingkong (150k), Wiwu (200k), Hoda (399k).'
    ) RETURNING id INTO lesson_1_id;

    -- Bài học 2
    INSERT INTO lessons (course_id, day_number, title, content)
    VALUES (
        course_id, 2, 'Kiến Thức về PPF', 
        'PPF (Paint Protection Film) cắt máy dán mặt trước và mặt sau.
- PPF phục hồi vết xước: 99k.
- PPF UV mỏng cứng chống va đập nhẹ: 148k.
- PPF chống nhìn trộm dẻo: 148k.
Bảo hành: 30 ngày (Dán lại miễn phí nếu lướt không ăn, nổi bọt khí). Giảm 50% nếu tự bóc gây dính bụi.'
    ) RETURNING id INTO lesson_2_id;

    -- Thêm câu hỏi trắc nghiệm mẫu cho bài 1
    INSERT INTO quizzes (lesson_id, question, options, correct_option_index)
    VALUES 
    (lesson_1_id, 'Khách hàng thắc mắc: "Cường lực chị không làm gì mà cũng nứt bể vậy em?" Bạn sẽ trả lời như thế nào?', '["Dạ do kính kém chất lượng ạ", "Dạ cường lực là dạng kính nên cọ sát chìa khóa cũng có thể nứt. Mình nên dùng ốp lưng ạ", "Dạ cửa hàng em không bảo hành trường hợp này ạ"]', 1),
    (lesson_1_id, 'Thời gian bảo hành kính cường lực tại Phụ Kiện 88 là bao lâu?', '["30 ngày", "45 ngày", "60 ngày"]', 1);

END $$;
