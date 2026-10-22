/**
 * Bộ từ điển chuẩn hóa Teencode, từ viết tắt và phương ngữ miền Nam/miền Tây
 * chuyên dụng cho ngành bán lẻ & sửa chữa điện thoại Phụ Kiện 88
 */

export interface NormalizedIntent {
  originalText: string;
  normalizedText: string;
  detectedDevice?: string;
  detectedIssue?: string;
  detectedCategory?: 'REPAIR' | 'ACCESSORY' | 'BATTERY' | 'SCREEN' | 'CHARGING' | 'PRICING' | 'GENERAL';
}

export function normalizeCustomerQuery(rawQuery: string): NormalizedIntent {
  if (!rawQuery) {
    return { originalText: '', normalizedText: '' };
  }

  const originalText = rawQuery.trim();
  let text = originalText.toLowerCase();

  // Helper thay thế an toàn cho từ tiếng Việt không bị lỗi \b với ký tự có dấu (ô, ơ, ê, đ...)
  const replaceWord = (pattern: string, replacement: string) => {
    const regex = new RegExp(`(?<=^|[^\\p{L}\\p{N}])${pattern}(?=[^\\p{L}\\p{N}]|$)`, 'gui');
    text = text.replace(regex, replacement);
  };

  // 1. Chuẩn hóa dòng máy iPhone: Đi từ cụ thể nhất (Pro Max -> Pro -> Plus -> Thường) đến chung chung
  replaceWord('ip\\s*(\\d{1,2})\\s*(?:pro\\s*max|prm|pm)', 'iPhone $1 Pro Max');
  replaceWord('ip\\s*(\\d{1,2})\\s*(?:pro|pr)', 'iPhone $1 Pro');
  replaceWord('ip\\s*(\\d{1,2})\\s*(?:plus|pl)', 'iPhone $1 Plus');
  replaceWord('ip\\s*(\\d{1,2})\\s*(?:thường|thuong|base)', 'iPhone $1 bản thường');
  replaceWord('ip\\s*(\\d{1,2})', 'iPhone $1');
  
  replaceWord('xsm', 'iPhone XS Max');
  replaceWord('(?:iphone\\s+)?xs\\s*max', 'iPhone XS Max');
  replaceWord('ipx', 'iPhone X');
  replaceWord('ip\\s*duo', 'iPhone Duo (Màn hình gập)');
  replaceWord('ip\\s*18', 'iPhone 18 Series');

  // Samsung
  replaceWord('ss\\s*s(\\d{2})\\s*u(?:ltra)?', 'Samsung Galaxy S$1 Ultra');
  replaceWord('s(\\d{2})\\s*u', 'Samsung Galaxy S$1 Ultra');
  replaceWord('ss\\s+', 'Samsung ');

  // 2. Chuẩn hóa teencode & phương ngữ miền Nam / miền Tây
  replaceWord('(?:k|ko|kh|khg)\\s+(?:dô|zô|zo)\\s*(?:pin|dien|điện)?', 'không vào pin (không nhận sạc)');
  replaceWord('(?:dô|zô|zo)\\s*(?:pin|dien|điện)', 'vào pin (nhận sạc)');
  replaceWord('(?:k|ko|kh|khg)', 'không');
  replaceWord('(?:dô|zô|zo)', 'vào');
  replaceWord('(?:đc|dc)', 'được');
  replaceWord('(?:sao|ntn|ntnao|ntnào)', 'như thế nào');
  replaceWord('(?:bn|bnhieu|bnhiu|bao nhiu|bnh)', 'bao nhiêu');
  replaceWord('(?:đt|dt)', 'điện thoại');
  replaceWord('(?:sđt|sdt)', 'số điện thoại');
  replaceWord('(?:pk)', 'phụ kiện');
  replaceWord('(?:knh)', 'kính');
  replaceWord('(?:cl|kính cl)', 'kính cường lực');
  replaceWord('(?:ép knh|ep kinh)', 'ép kính');
  replaceWord('(?:kb|inb|ib)', 'nhắn tin');
  replaceWord('(?:ad|shop|b|ad ơi|ad oi)', 'Bé 8 ơi');

  // Bệnh lý phần cứng sạc & pin
  replaceWord('(?:chân sạc|chuôi sạc|đuôi sạc|cổng sạc)', 'cụm cáp chân sạc');
  replaceWord('(?:phù pin|chai pin|pin ảo|tuột pin|sụt pin)', 'pin chai hỏng');
  replaceWord('(?:bể kính|vỡ kính|nứt kính)', 'bể mặt kính cần ép kính');
  replaceWord('(?:sọc màn|chớp màn|đen màn|mất cảm ứng)', 'hỏng màn hình cần thay màn');

  // Xác định dòng máy
  let detectedDevice = '';
  const ipMatch = text.match(/iphone\s*\d{1,2}(?:\s*(?:pro max|pro|plus|bản thường))?/i);
  if (ipMatch) detectedDevice = ipMatch[0];

  // Phân loại nhóm nhu cầu
  let detectedCategory: NormalizedIntent['detectedCategory'] = 'GENERAL';
  if (text.includes('sạc') || text.includes('chân sạc')) detectedCategory = 'CHARGING';
  else if (text.includes('pin')) detectedCategory = 'BATTERY';
  else if (text.includes('ép kính') || text.includes('màn hình')) detectedCategory = 'SCREEN';
  else if (text.includes('cường lực') || text.includes('ốp') || text.includes('tai nghe')) detectedCategory = 'ACCESSORY';
  else if (text.includes('sửa') || text.includes('kiểm tra')) detectedCategory = 'REPAIR';

  return {
    originalText,
    normalizedText: text,
    detectedDevice,
    detectedCategory
  };
}
