import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvxxkfgictaqmwcwvluf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2eHhrZmdpY3RhcW13Y3d2bHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTExNTYsImV4cCI6MjEwNjA4NzE1Nn0.2_DlkAogz1dmdPs2lnozj4hSxekY7gmmtT2X_NGs7NQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const richContent = `
# Chào mừng bạn đến với Đại gia đình Phụ Kiện 88!

![Cửa hàng Phụ Kiện 88](/store_cover.jpg)

> Sự khác biệt lớn nhất giữa một nhân viên bình thường và một chuyên gia tư vấn xuất sắc nằm ở sự thấu cảm và nền tảng kiến thức vững chắc. Hãy bắt đầu hành trình của bạn ngay hôm nay!

## 1. Tầm Nhìn Chiến Lược
Trở thành chuỗi bán lẻ phụ kiện điện thoại và dịch vụ sửa chữa hàng đầu khu vực Miền Tây, mang đến trải nghiệm mua sắm hiện đại thông qua tự động hóa AI toàn diện.

## 2. Sứ Mệnh Cốt Lõi
Mang đến sản phẩm chất lượng, dịch vụ tận tâm và **trải nghiệm mua sắm không giới hạn**. Chúng tôi cam kết:
* Luôn cập nhật những mẫu mã mới nhất trên thị trường.
* Xử lý bảo hành nhanh chóng, minh bạch.
* Đào tạo đội ngũ nhân viên tinh nhuệ, sẵn sàng giải quyết mọi vấn đề của khách hàng.

## 3. Văn Hóa Doanh Nghiệp
**Tận tâm phục vụ khách hàng. Trung thực với tổ chức. Trách nhiệm với công việc.**
Mọi hành động và quyết định của chúng ta đều lấy khách hàng làm trung tâm. Dù là một chiếc ốp lưng 50k hay một dịch vụ ép kính 500k, thái độ phục vụ vẫn luôn đồng nhất và trân trọng.

## 4. Nội Quy Cơ Bản
1. Luôn mặc đồng phục chỉnh tề, đeo bảng tên trong ca làm việc.
2. Giữ thái độ niềm nở, mỉm cười chào đón khách hàng từ cửa.
3. Đảm bảo vệ sinh cửa hàng, quầy kệ luôn sạch sẽ, gọn gàng.
4. Chấm công GPS đúng giờ quy định.
`;

async function updateLesson() {
  const { data, error } = await supabase
    .from('lessons')
    .update({ content: richContent })
    .eq('day_number', 1);

  if (error) {
    console.error('Error updating lesson:', error);
  } else {
    console.log('Successfully updated lesson 1 with local image!');
  }
}

updateLesson();
