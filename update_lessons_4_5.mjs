import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let envFile = '';
try { envFile = fs.readFileSync('.env', 'utf8'); } catch(e){}
const url = envFile.match(/VITE_SUPABASE_URL\s*=\s*(.*)/)?.[1]?.trim();
const key = envFile.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function run() {
  const { data: lessons, error } = await supabase.from('lessons').select('id, day_number, title, content').in('day_number', [4, 5]);
  if (error || !lessons) {
    console.error('Error fetching lessons:', error);
    return;
  }

  for (const lesson of lessons) {
    let newContent = lesson.content;
    const bannerPath = `/banner-bai-${lesson.day_number}.jpg`;
    
    // Kiểm tra xem đã có banner chưa
    if (!newContent.includes(bannerPath)) {
      const headerTitle = lesson.day_number === 4 
        ? '# Kiến Thức Chuyên Sâu Về Kính Cường Lực\n\n'
        : '# Kiến Thức Chuyên Sâu Về Dán PPF Điện Thoại\n\n';
      
      const bannerMarkdown = `![Banner Bài ${lesson.day_number}](${bannerPath})\n\n`;
      
      // Nếu bài học chưa có H1 ở đầu, thêm H1 và Banner
      if (!newContent.trim().startsWith('# ')) {
        newContent = headerTitle + bannerMarkdown + newContent;
      } else {
        // Nếu đã có tiêu đề đầu tiên, chèn banner ngay dưới dòng đầu tiên
        const lines = newContent.split('\n');
        lines.splice(1, 0, '\n' + bannerMarkdown);
        newContent = lines.join('\n');
      }

      const { error: updateErr } = await supabase
        .from('lessons')
        .update({ content: newContent })
        .eq('id', lesson.id);

      if (updateErr) {
        console.error(`Error updating Day ${lesson.day_number}:`, updateErr);
      } else {
        console.log(`Successfully updated Day ${lesson.day_number} with ${bannerPath}`);
      }
    } else {
      console.log(`Day ${lesson.day_number} already has banner.`);
    }
  }
}

run();
