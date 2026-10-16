import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let envFile = '';
try { envFile = fs.readFileSync('.env', 'utf8'); } catch(e){}
const url = envFile.match(/VITE_SUPABASE_URL\s*=\s*(.*)/)?.[1]?.trim();
const key = envFile.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

const contentDay2 = `# Hội Nhập: Quy Định Chấm Công GPS & Lương Thưởng

![Quy Định Chấm Công GPS & Lương Thưởng](/banner-bai-2.jpg)

### Quy định làm việc tại cửa hàng

- **Giờ làm việc:** Phân ca linh hoạt theo sự sắp xếp của quản lý trực tiếp.
- **Hệ thống Chấm công:** Sử dụng 100% Web App tự động. Yêu cầu tính năng định vị (Geofencing). Bạn phải đứng trong bán kính 100m của cửa hàng để Check-in/Check-out.
- **Lương Thưởng:** Áp dụng mức lương cơ bản theo giờ, cộng thưởng hoa hồng khi đạt doanh số hoặc Upsell thành công.
- **Chế độ đãi ngộ:** Theo quy định của PK88 và hệ thống đánh giá tự động hàng tháng.
`;

const contentDay3 = `# Hội Nhập: Làm Quen Đội Nhóm & Không Gian Cửa Hàng

![Làm Quen Đội Nhóm & Không Gian Cửa Hàng](/banner-bai-3.jpg)

### Mục tiêu ngày thứ 3

1. **Làm quen và tương tác:** Chào hỏi, kết nối và học hỏi kinh nghiệm từ các anh chị đồng nghiệp cũ tại cửa hàng.
2. **Tham quan các khu vực trưng bày:** Tủ Kính Cường Lực, Kệ Ốp Lưng, Khu Vực Phụ Kiện Công Nghệ, Bàn Kỹ Thuật Ép Kính.
3. **Quan sát thực tế:** Học hỏi cách nhân viên tư vấn chốt đơn và thao tác thanh toán tại quầy thu ngân.
4. **Vệ sinh & Sắp xếp:** Thực hành lau kính, vệ sinh tủ kệ và sắp xếp phụ kiện gọn gàng đầu giờ và cuối ca.
`;

async function run() {
  const { error: err2 } = await supabase.from('lessons').update({ content: contentDay2 }).eq('day_number', 2);
  const { error: err3 } = await supabase.from('lessons').update({ content: contentDay3 }).eq('day_number', 3);

  if (err2 || err3) {
    console.error('Update error:', err2, err3);
  } else {
    console.log('Successfully updated Day 2 and Day 3 lessons with banner images!');
  }
}

run();
