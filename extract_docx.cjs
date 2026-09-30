const fs = require('fs');
const mammoth = require('mammoth');
const path = require('path');

const files = [
  'Lộ Trình Đào Tạo Nhân Viên Mới.docx',
  'QUY TRÌNH ĐÀO TẠO NV MỚI.docx'
];

async function extract() {
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      const mdFile = file.replace('.docx', '.md');
      fs.writeFileSync(path.join(__dirname, mdFile), result.value);
      console.log(`Extracted ${file} to ${mdFile}`);
    } catch (e) {
      console.error(`Failed to extract ${file}:`, e);
    }
  }
}

extract();
