import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let envFile = '';
try { envFile = fs.readFileSync('.env', 'utf8'); } catch(e){}
const url = envFile.match(/VITE_SUPABASE_URL\s*=\s*(.*)/)?.[1]?.trim();
const key = envFile.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function run() {
  const { data: lessons, error } = await supabase.from('lessons').select('id, day_number, title, content').in('day_number', [6, 7]);
  if (error || !lessons) {
    console.error('Error fetching lessons:', error);
    return;
  }

  for (const lesson of lessons) {
    let newContent = lesson.content;
    const bannerPath = `/banner-bai-${lesson.day_number}.jpg`;
    
    if (!newContent.includes(bannerPath)) {
      const headerTitle = lesson.day_number === 6 
        ? '# Kiến Thức Chuyên Sâu Về Len Bảo Vệ Camera\n\n'
        : '# Kiến Thức Chuyên Sâu Về Các Dòng Ốp Lưng Điện Thoại\n\n';
      
      const bannerMarkdown = `![Banner Bài ${lesson.day_number}](${bannerPath})\n\n`;
      
      if (!newContent.trim().startsWith('# ')) {
        newContent = headerTitle + bannerMarkdown + newContent;
      } else {
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
