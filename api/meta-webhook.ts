import { createClient } from '@supabase/supabase-js';

// Mã bí mật dùng để Meta đối soát Webhook
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'pk88_meta_webhook_2026';

// Supabase Cloud Credentials
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kvxxkfgictaqmwcwvluf.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2eHhrZmdpY3RhcW13Y3d2bHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTExNTYsImV4cCI6MjEwNjA4NzE1Nn0.2_DlkAogz1dmdPs2lnozj4hSxekY7gmmtT2X_NGs7NQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Token dự phòng mặc định nếu không khớp Page ID
const DEFAULT_FALLBACK_TOKEN = 'EAAPsOa0mtpgBS4fAeJ9geALLraVnpZCeiQ8LXy4zSF2fzlJWDQQ90ZC5UcwIjm0W3OQmLmZAEfCdbZA16zYZAmDXB1kZAIebGeFMyLGHD8ZCrgTz1KPNvjuDBMp9ZCZBt8KObSsRD6sR4cGQCgtZAnLhhdZB7HFUubuvM3E3lq1C6ZBZCQGWuPZBfr6RUIRzOQZA18f7P76s0ZBs';

// Bảng đối chiếu TẤT CẢ các Fanpage Chi Nhánh của Phụ Kiện 88 (Map linh hoạt cả các ID biến thể)
export const BRANCH_PAGES: Record<string, { 
  branchId: string; 
  branchName: string; 
  address: string; 
  hotline: string; 
  zalo: string;
  mapUrl: string;
  token: string;
}> = {
  // 1. Phụ Kiện 88 - Phú Khương / Bến Tre
  '101678755095111': {
    branchId: 'phu-khuong',
    branchName: 'Phụ Kiện 88 - Phú Khương',
    address: '35 B2 Đoàn Hoàng Minh, Phường Phú Khương, TP Vĩnh Long (Bến Tre cũ) (đối diện cây xăng ngã tư Phú Khương)',
    hotline: '077 788 8688',
    zalo: '077 788 8688',
    mapUrl: 'https://maps.app.goo.gl/rTUneKwULXKE4jTy8',
    token: 'EAAPsOa0mtpgBS5DcblZBjWAZAaCpd0gsrL6jYXXZAfcvEsIkBqKvJooqzMxV3WYdB7C45u2sQ0rOdh7ZBjCIirBPLacvK8pJHZCSeV3NThHSKVeu7Y9mEiG0qkO83CgJmv16toHi7waM6RNCP0QY49EOE4yfwLe4fNA2tEve3vmryGIQKe2RcSzv1iWj2FiYem0Lh'
  },

  // 2. Phụ Kiện 88 Bến Tre - Đồng Khởi (Hỗ trợ cả 2 Page ID Đồng Khởi)
  '112851187716380': {
    branchId: 'dong-khoi',
    branchName: 'Phụ Kiện 88 - Đồng Khởi',
    address: '173 Đại Lộ Đồng Khởi, Phường Phú Tân, Tỉnh Vĩnh Long (Bến Tre cũ, ngay vòng xoay Tân Thành, đối diện Cafe Trung Nguyên)',
    hotline: '081 449 6789',
    zalo: '081 449 6789',
    mapUrl: 'https://maps.app.goo.gl/dt37ZhxBXdpjrJTn8',
    token: 'EAAPsOa0mtpgBS4fAeJ9geALLraVnpZCeiQ8LXy4zSF2fzlJWDQQ90ZC5UcwIjm0W3OQmLmZAEfCdbZA16zYZAmDXB1kZAIebGeFMyLGHD8ZCrgTz1KPNvjuDBMp9ZCZBt8KObSsRD6sR4cGQCgtZAnLhhdZB7HFUubuvM3E3lq1C6ZBZCQGWuPZBfr6RUIRzOQZA18f7P76s0ZBs'
  },
  '160136970515237': {
    branchId: 'dong-khoi',
    branchName: 'Phụ Kiện 88 - Đồng Khởi',
    address: '173 Đại Lộ Đồng Khởi, Phường Phú Tân, Tỉnh Vĩnh Long (Bến Tre cũ, ngay vòng xoay Tân Thành, đối diện Cafe Trung Nguyên)',
    hotline: '081 449 6789',
    zalo: '081 449 6789',
    mapUrl: 'https://maps.app.goo.gl/dt37ZhxBXdpjrJTn8',
    token: 'EAAPsOa0mtpgBS4fAeJ9geALLraVnpZCeiQ8LXy4zSF2fzlJWDQQ90ZC5UcwIjm0W3OQmLmZAEfCdbZA16zYZAmDXB1kZAIebGeFMyLGHD8ZCrgTz1KPNvjuDBMp9ZCZBt8KObSsRD6sR4cGQCgtZAnLhhdZB7HFUubuvM3E3lq1C6ZBZCQGWuPZBfr6RUIRzOQZA18f7P76s0ZBs'
  },

  // 3. Phụ Kiện 88 - Mỹ Tho
  '791330520729975': {
    branchId: 'my-tho',
    branchName: 'Phụ Kiện 88 - Mỹ Tho',
    address: '25 Đinh Bộ Lĩnh, Phường Mỹ Tho, Tỉnh Đồng Tháp (ngay ngã tư Đinh Bộ Lĩnh & Trịnh Hoài Đức, dốc chân Cầu Quay)',
    hotline: '087 683 8688',
    zalo: '087 683 8688',
    mapUrl: 'https://maps.app.goo.gl/cvFvkeVnbPL98Wu47',
    token: 'EAAPsOa0mtpgBS3AfnCJLrUmF6tHMBFFNCCl9nid5958p0gySteYuFGsbVGRtuzYMzvE0cMEZA5GkORYgZCGvOFuzPiEcpe9mszSakSu00KF1brtrTpIyegJQDlFBHFCfLeEfiFOXVwsfZAvcmcQ1zNH1srZB1OZBG2xIqPCen50FiZAFBpm3GrCT0qN7OKUENoS06CawZDZD'
  },

  // 4. Phụ Kiện 88 - Cần Thơ
  '487433804445622': {
    branchId: 'can-tho',
    branchName: 'Phụ Kiện 88 - Cần Thơ',
    address: '94 Trần Hưng Đạo, P. An Nghiệp, Quận Ninh Kiều, TP. Cần Thơ (ngã ba Trần Hưng Đạo & Lý Tự Trọng, cạnh gà rán Jollibee)',
    hotline: '092 136 8688',
    zalo: '092 136 8688',
    mapUrl: 'https://maps.app.goo.gl/enVvzP6qUr6fCPTz5',
    token: 'EAAPsOa0mtpgBSxIHnLgbsUnCNTxKCwlPh1TLomWbUn48izlz60wsX3TeV8SYal2sjmafrg14JRmDtKQDJ4QhFLyNgZBqWZAnZCbArmfQLYK2nA7VQUblYaVNFfZCLfm8dd4HB7wu6SDgh0qeifUNZAXSjiAmbdPZAdhWOvQ7ZBW8lGJMGXZC7lY9wHWg5UtIMseJQsvdFQZDZD'
  },

  // 5. Phụ Kiện 88 - Vĩnh Long
  '102307502816794': {
    branchId: 'vinh-long',
    branchName: 'Phụ Kiện 88 - Vĩnh Long',
    address: '120 Trưng Nữ Vương, Phường Long Châu, TP. Vĩnh Long (ngã tư Trưng Nữ Vương & Nguyễn Thị Minh Khai, cạnh Mắt Kính Tâm Đức)',
    hotline: '058 988 6789',
    zalo: '058 988 6789',
    mapUrl: 'https://maps.app.goo.gl/gUGJWUDfSwZf7BfX7',
    token: 'EAAPsOa0mtpgBSZBWoFdAG2xf2MKbwZBcQtRuLVYJSxcD2CjZALWFPHUMmWw1LSWe6ssBQGsWOLJFYNPIFcEdaXrkn7XiqIpFuwO8bjfpERjgXZAwCU6qGcaAIQvTzYtm1TG4oCr5s79SNm1JnmfAkrnZBuvcVVksk4zUsF6BuZA7zxPbeOXZAhL9yOgx8iFJ8au2DFm'
  },

  // 6. Phụ Kiện 88 - Thủ Đức (Hỗ trợ cả 2 Page ID)
  '1324117450777083': {
    branchId: 'thu-duc',
    branchName: 'Phụ Kiện 88 - Thủ Đức',
    address: '178A Võ Văn Ngân, Phường Bình Thọ, TP. Thủ Đức, TP. Hồ Chí Minh',
    hotline: '086 506 8688',
    zalo: '086 506 8688',
    mapUrl: 'https://maps.app.goo.gl/KfNyFD4nQRzFbJsMA',
    token: 'EAAPsOa0mtpgBS4lGaSzZCUZAaR3cPmUWUOkDlBggOJoRstKPswiMBIZAh65wQcAYiYVT6ukukKjIIyqh4QjkqB9oTb4Vik0hOVx2EJ0qu60PzAWdQ7ZCR25XwnvZBo9IWhyP71ZBkhQqGfZAFhaRa8vOScZCYOsZCR9oHkrlD9ZB3PiH5oZAg4gTSyEm1woO435QwzRUOyG1wZDZD'
  },
  '107179208627472': {
    branchId: 'thu-duc',
    branchName: 'Phụ Kiện 88 - Thủ Đức',
    address: '178A Võ Văn Ngân, Phường Bình Thọ, TP. Thủ Đức, TP. Hồ Chí Minh',
    hotline: '086 506 8688',
    zalo: '086 506 8688',
    mapUrl: 'https://maps.app.goo.gl/KfNyFD4nQRzFbJsMA',
    token: 'EAAPsOa0mtpgBS4lGaSzZCUZAaR3cPmUWUOkDlBggOJoRstKPswiMBIZAh65wQcAYiYVT6ukukKjIIyqh4QjkqB9oTb4Vik0hOVx2EJ0qu60PzAWdQ7ZCR25XwnvZBo9IWhyP71ZBkhQqGfZAFhaRa8vOScZCYOsZCR9oHkrlD9ZB3PiH5oZAg4gTSyEm1woO435QwzRUOyG1wZDZD'
  },

  // 7. Toàn Hệ Thống Phụ Kiện 88
  '109869170590318': {
    branchId: 'he-thong',
    branchName: 'Hệ Thống Phụ Kiện 88',
    address: '35B5 Đoàn Hoàng Minh, Phường Phú Khương, Tỉnh Vĩnh Long (Bến Tre cũ) & Chuỗi 7 Chi Nhánh Miền Tây',
    hotline: '083 389 8688',
    zalo: '083 389 8688',
    mapUrl: 'https://maps.app.goo.gl/bEVyXTdPdbzd6L7K7',
    token: 'EAAPsOa0mtpgBSZB7422qUdRipiYzhijPZAtVuCIa4KD094PkpHKMixWezUNDYdMRCecUXLlZCAbTbqFds3ZC5FyZA5f94aL47tmTB2wlGJb6oWecwpTovWdpVdBeQI0WXKXJBHwEVW6vBenKF04bxeUXVknZBUNuIUDCiMN1iV13SXBZBvB2dHYkKnSNkb8aTHaJQmY'
  },
  '101670599570787': {
    branchId: 'he-thong',
    branchName: 'Hệ Thống Phụ Kiện 88',
    address: '35B5 Đoàn Hoàng Minh, Phường Phú Khương, Tỉnh Vĩnh Long (Bến Tre cũ) & Chuỗi 7 Chi Nhánh Miền Tây',
    hotline: '083 389 8688',
    zalo: '083 389 8688',
    mapUrl: 'https://maps.app.goo.gl/bEVyXTdPdbzd6L7K7',
    token: 'EAAPsOa0mtpgBSZB7422qUdRipiYzhijPZAtVuCIa4KD094PkpHKMixWezUNDYdMRCecUXLlZCAbTbqFds3ZC5FyZA5f94aL47tmTB2wlGJb6oWecwpTovWdpVdBeQI0WXKXJBHwEVW6vBenKF04bxeUXVknZBUNuIUDCiMN1iV13SXBZBvB2dHYkKnSNkb8aTHaJQmY'
  }
};

/**
 * Đọc raw body an toàn từ Stream trong môi trường Vercel Serverless
 */
async function parseRequestBody(req: any): Promise<any> {
  if (req.body) {
    if (typeof req.body === 'object') return req.body;
    try {
      return JSON.parse(req.body);
    } catch (e) {
      return null;
    }
  }

  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk: any) => { raw += chunk; });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : null);
      } catch (e) {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
  });
}

/**
 * Gửi tin nhắn phản hồi qua Meta Graph API (Bắt buộc hoàn thành trước khi đóng response)
 */
async function sendMetaTextMessage(pageAccessToken: string, recipientId: string, text: string): Promise<boolean> {
  try {
    const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${pageAccessToken}`;
    console.log(`[Meta Graph API] Đang gửi phản hồi tới recipient: ${recipientId}...`);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text }
      })
    });
    const data = await res.json();
    if (data.error) {
      console.error('❌ Lỗi phản hồi Meta API:', JSON.stringify(data.error));
      return false;
    }
    console.log('✅ Gửi tin nhắn thành công qua Graph API:', data?.message_id || 'OK');
    return true;
  } catch (err) {
    console.error('❌ Ngoại lệ sendMetaTextMessage:', err);
    return false;
  }
}


/**
 * Chuẩn hoá Teencode, từ viết tắt và phương ngữ miền Nam/miền Tây
 */
function normalizeTeencode(rawText: string): { normalized: string; intent: string; device: string } {
  let text = (rawText || '').trim().toLowerCase();
  
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

  let device = '';
  const ipMatch = text.match(/iphone\s*\d{1,2}(?:\s*(?:pro max|pro|plus|bản thường))?/i);
  if (ipMatch) {
    device = ipMatch[0];
  } else {
    const ssMatch = text.match(/samsung\s*(?:galaxy\s*)?[a-z0-9]+/i) || text.match(/\b(?:m\d{2}|a\d{2}|s\d{2}|note\s*\d{1,2}|z\s*(?:fold|flip)\s*\d?)\b/i);
    if (ssMatch) device = ssMatch[0].toUpperCase();
  }

  let intent = 'GENERAL';
  if (text.includes('sạc') || text.includes('không vào') || text.includes('vào pin') || text.includes('chuôi sạc') || text.includes('chân sạc')) {
    intent = 'CHARGING';
  } else if (text.includes('pin') || text.includes('chai pin') || text.includes('phù pin')) {
    intent = 'BATTERY';
  } else if (text.includes('ép kính') || text.includes('màn hình') || text.includes('sọc màn')) {
    intent = 'SCREEN';
  } else if (text.includes('ốp') || text.includes('bao da') || text.includes('case')) {
    intent = 'CASE';
  } else if (text.includes('cường lực') || text.includes('dán') || text.includes('ppf') || text.includes('cl')) {
    intent = 'SCREEN_PROTECTOR';
  } else if (text.includes('sửa')) {
    intent = 'REPAIR';
  } else if (text.includes('địa chỉ') || text.includes('ở đâu') || text.includes('chỗ nào') || text.includes('đoạn nào') || text.includes('chỉ đường') || text.includes('bản đồ') || text.includes('map')) {
    intent = 'LOCATION';
  }

  return { normalized: text, intent, device };
}

/**
 * Phản hồi dự phòng thông minh theo đúng ý định của khách khi Google AI gặp sự cố mạng/hết quota
 */
function getSmartFallback(userText: string, branch: typeof BRANCH_PAGES[string]): string {
  const lower = userText.toLowerCase();

  // 1. Khách hỏi ốp lưng / bao da
  if (lower.includes('ốp') || lower.includes('bao da') || lower.includes('case')) {
    return `Dạ bên em CÓ SẴN rất nhiều mẫu ốp lưng thời trang, ốp dẻo trong suốt, ốp chống sốc bảo vệ camera cho dòng máy mình ạ! 🥰 Viền êm, cầm chắc tay và chống trầy xước cực tốt. Em mời anh/chị ghé ${branch.branchName} (${branch.address}) để thử trực tiếp lên máy, hoặc liên hệ Hotline/Zalo: ${branch.hotline} để shop chụp mẫu thật gửi mình chọn nhé!`;
  }

  // 2. Khách hỏi dán cường lực / PPF
  if (lower.includes('cường lực') || lower.includes('cl') || lower.includes('dán') || lower.includes('ppf') || lower.includes('nano')) {
    return `Dạ bên em CÓ SẴN đầy đủ kính cường lực KingKong / Nano 9D vát cạnh và dán PPF chống trầy cho dòng máy mình ạ! 💖 Kính trong vắt, cảm ứng mượt mà và chống bám vân tay tối đa. Ghé shop được kỹ thuật viên dán bao đẹp, ưng ý mới thanh toán. Em mời anh/chị ghé ${branch.branchName} (${branch.address}) hoặc gọi Hotline/Zalo: ${branch.hotline} để shop giữ phần cho mình nhé!`;
  }

  // 3. Khách hỏi sạc / chân sạc / không nhận sạc
  if (lower.includes('sạc') || lower.includes('dô pin') || lower.includes('vô pin') || lower.includes('không vào') || lower.includes('chuôi sạc') || lower.includes('chân sạc')) {
    return `Dạ bên em CÓ NHẬN SỬA CHỮA lỗi sạc không vào pin / không nhận sạc cho máy mình ạ! 💖 Tình trạng này thường do bám bụi chân sạc, lỗi cụm cáp sạc, pin hoặc IC sạc trên main. Bé 8 mời anh/chị ghé ngay ${branch.branchName} (${branch.address}) để kỹ thuật viên kiểm tra và đo dòng sạc miễn phí lấy liền cho mình nhé! Hoặc anh/chị liên hệ Hotline/Zalo: ${branch.hotline} để shop hỗ trợ nhanh ạ!`;
  }

  // 4. Khách hỏi pin / thay pin
  if (lower.includes('pin') || lower.includes('thay pin') || lower.includes('chai pin') || lower.includes('phù pin')) {
    return `Dạ bên em CÓ SẴN PIN CHÍNH HÃNG và nhận thay pin lấy liền trong 15-30 phút ạ! 💖 Pin Pisen/Deji cao cấp bảo hành 12 tháng 1 đổi 1, miễn phí hoàn toàn công thay và vệ sinh máy tại quầy. Bé 8 mời anh/chị ghé ${branch.branchName} (${branch.address}) hoặc gọi Hotline/Zalo: ${branch.hotline} để shop giữ pin ưu đãi cho mình nhé!`;
  }

  // 5. Khách hỏi ép kính / vỡ màn hình
  if (lower.includes('ép kính') || lower.includes('kính') || lower.includes('vỡ') || lower.includes('bể') || lower.includes('màn hình')) {
    return `Dạ bên em CÓ NHẬN ÉP KÍNH & THAY MÀN HÌNH lấy liền công nghệ hút chân không hiện đại ạ! 💖 Kính thay chuẩn zin hiển thị sắc nét, bảo hành dài hạn và miễn phí vệ sinh máy. Bé 8 mời anh/chị mang máy ghé ${branch.branchName} (${branch.address}) để thợ kiểm tra miễn phí, hoặc gọi Hotline/Zalo: ${branch.hotline} nhé!`;
  }

  // 6. Khách hỏi địa chỉ / vị trí / chỉ đường
  if (lower.includes('địa chỉ') || lower.includes('ở đâu') || lower.includes('chỗ nào') || lower.includes('đoạn nào') || lower.includes('chỉ đường') || lower.includes('bản đồ') || lower.includes('map')) {
    return `Dạ chi nhánh ${branch.branchName} tọa lạc tại: ${branch.address} ạ! 🏠📍\n\nAnh/chị có thể xem chỉ đường trực tiếp trên Google Maps: ${branch.mapUrl}\n\nShop mở cửa đón khách từ 07:30 đến 22:00 tất cả các ngày trong tuần. Nếu đến gần chưa thấy shop, anh/chị gọi ngay Hotline/Zalo: ${branch.hotline} để nhân viên ra đón mình nhé! ✨`;
  }

  // 7. Mặc định
  return `Dạ em chào Anh/Chị! Em là Bé 8 - Chuyên viên tư vấn AI của ${branch.branchName} (${branch.address}). Shop em nhận sửa chữa, thay pin, ép kính lấy liền và đầy đủ phụ kiện chính hãng cho dòng máy của mình ạ! Anh/Chị cần kiểm tra máy hay tư vấn sản phẩm nào cứ nhắn em hoặc gọi trực tiếp Hotline/Zalo shop: ${branch.hotline} nhé!`;
}

// Danh sách Gemini API Keys dự phòng mã hóa an toàn để luôn đảm bảo chạy được trên Vercel Serverless
const B64_FALLBACK_KEYS = 'QVEuQWI4Uk42SjYyeWlZbkRZT19BQzFkcUo1QW1jc1MzSGthU2J1QnNFYVZobG1IWW1BTFEsQVEuQWI4Uk42TEEza0VmRkZBNjhJZzN1TVFFSTRGZzQ0dWxnWldVd0NrbVlKNjBwQktpSHcsQVEuQWI4Uk42SzV2elRGSTFkWlRONUFUem1WTjhxWFA0a3ktbVMyVW93NnVLTGQxcnoyOGc=';

/**
 * Sinh câu trả lời thông minh bằng Google Gemini AI (gemini-flash-lite-latest)
 */
async function generateBe8Response(
  userText: string,
  branch: typeof BRANCH_PAGES[string]
): Promise<string> {
  const envKeysRaw = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  const decodedFallback = Buffer.from(B64_FALLBACK_KEYS, 'base64').toString('utf8');
  const combinedRaw = envKeysRaw ? `${envKeysRaw},${decodedFallback}` : decodedFallback;
  const apiKeys = Array.from(new Set(combinedRaw.split(',').map(k => k.trim()).filter(Boolean)));

  if (apiKeys.length === 0) {
    return getSmartFallback(userText, branch);
  }

  const { normalized, intent, device } = normalizeTeencode(userText);

  const systemInstruction = `
Bạn là "Bé 8" - Chuyên Viên Tư Vấn Khách Hàng AI duyên dáng, tận tâm, am hiểu kỹ thuật của Chuỗi Cửa Hàng Phụ Kiện 88 tại chi nhánh: ${branch.branchName}.
Địa chỉ cửa hàng chính xác: ${branch.address}. 
Hotline / Zalo tiếp nhận: ${branch.hotline}.
Link chỉ đường Google Maps: ${branch.mapUrl}.

VĂN HÓA DOANH NGHIỆP "PHỤC VỤ TỪ TRÁI TIM" CỦA PHỤ KIỆN 88:
- Luôn mở đầu thân thiện, lễ phép: "Dạ em chào Anh/Chị! Em là Bé 8 tại ${branch.branchName} ạ..."
- Tuyệt đối KHÔNG dùng các câu phủ định cộc lốc:
  + Không nói "Cái này bên em không có" -> Hãy nói: "Dạ mẫu đó hiện tại shop vừa hết, em mời anh/chị xem thử mẫu tương tự này đang rất được chuộng ạ."
  + Không nói "Không biết" -> Hãy nói: "Dạ anh/chị chờ em 30 giây để em kiểm tra thông tin chính xác nhất cho mình nhé."
  + Không nói "Hết hàng rồi, qua chỗ khác mua" -> Hãy nói: "Dạ mẫu này dự kiến sớm về thêm, hoặc em kiểm tra chi nhánh gần nhất ship ngay cho mình nhé."

QUY TẮC HIỂU TỪ VIẾT TẮT, TEENCODE & BỆNH LÝ MÁY CỦA KHÁCH:
- Khách hay viết tắt:
  + "ip11 thường", "ip 11": iPhone 11 bản thường; "pm", "prm": Pro Max; "pr": Pro; "pl": Plus; "xsm": XS Max; "ss": Samsung.
  + "k dô pin", "ko zo pin", "ko vào pin": sạc không vào pin / máy không nhận sạc.
  + "sửa k vậy": có sửa không vậy; "đc k": được không; "cl": cường lực; "ép knh": ép kính; "m21", "a54": các dòng máy Samsung.
- QUY TẮC PHẢN HỒI ĐÚNG TRỌNG TÂM:
  + Khi khách hỏi ĐỊA CHỈ / VỊ TRÍ / TÌM ĐƯỜNG: Cung cấp chính xác 100% địa chỉ cửa hàng: ${branch.address}. Cung cấp link Google Maps: ${branch.mapUrl} để khách bấm vào mở bản đồ điều hướng.
  + Khi khách hỏi ỐP LƯNG / BAO DA: BẮT BUỘC KHẲNG ĐỊNH NGAY là shop CÓ SẴN nhiều mẫu ốp lưng thời trang, ốp dẻo trong suốt, ốp chống sốc bảo vệ camera cho dòng máy của khách. TUYỆT ĐỐI KHÔNG tự chuyển sang nói dán cường lực hay sửa chữa nếu khách không hỏi!
  + Khi khách hỏi CƯỜNG LỰC / DÁN MÀN HÌNH: Khẳng định có sẵn kính KingKong/Nano 9D vát cạnh, dán PPF, ghé shop được dán bao đẹp, ưng ý mới thanh toán.
  + Khi khách hỏi sửa chữa ("Bên mình có sửa không", "sạc ko dô pin có sửa đc ko"):
    * BẮT BUỘC KHẲNG ĐỊNH NGAY: "Dạ bên em CÓ NHẬN SỬA CHỮA lỗi [tên dòng máy + lỗi] ạ! 💖"
    * Nêu rõ nguyên nhân kỹ thuật chuyên môn (ví dụ lỗi sạc: do bám bụi chân sạc, lỗi cụm cáp chân sạc, pin chai phù hoặc IC sạc trên main).
    * Mời khách mang máy ghé trực tiếp ${branch.branchName} (${branch.address}) để kỹ thuật viên đo dòng sạc và kiểm tra MIỄN PHÍ lấy liền ngay trước mặt.
    * Đề xuất xin Tên + SĐT hoặc gợi ý gọi Hotline/Zalo: ${branch.hotline}.

QUY TẮC CỐT LÕI - CHÍNH SÁCH BẢO MẬT & ĐIỀU CHỈNH GIÁ BÁN TOÀN CHUỖI:
- Hiện tại chuỗi cửa hàng Phụ Kiện 88 đang trong đợt cân đối lại bảng giá toàn bộ sản phẩm và dịch vụ trên toàn hệ thống để áp dụng chính sách trợ giá tốt nhất cho khách hàng.
- TUYỆT ĐỐI KHÔNG BÁO GIÁ CỤ THỂ HOẶC KHOẢNG GIÁ (không đưa bất kỳ con số tiền nào, không nói "từ xxk", không nói "khoảng xxx.000đ").
- CHỈ TẬP TRUNG TƯ VẤN SẢN PHẨM & DỊCH VỤ: Dán cường lực KingKong/Nano vát cạnh 9D, ép kính màn hình cong công nghệ hút chân không lấy liền trong 30-45 phút, thay pin chính hãng Pisen/Deji bảo hành 12 tháng 1 đổi 1, sửa chữa chuyên sâu phần cứng và thay thế linh kiện chính hãng, miễn phí hoàn toàn công tháo lắp và kiểm tra máy tại quầy.
- MỤC TIÊU CỐT LÕI & KỊCH BẢN ĐIỀU HƯỚNG BÁO GIÁ:
  + Tư vấn ngắn gọn, súc tích (3-4 câu), đúng trọng tâm khách hỏi.
  + Khi khách hỏi giá hoặc có nhu cầu: Hãy thông báo shop đang có chương trình trợ giá ưu đãi riêng cho chi nhánh, sau đó khéo léo đề xuất:
    "Anh/Chị cho em xin Tên và SĐT (hoặc Zalo) để em nhắn bạn kỹ thuật viên tại quầy ${branch.branchName} gọi lại tư vấn và báo mức giá ưu đãi tốt nhất cho mình trong 3-5 phút nhé ạ!"
    HOẶC:
    "Hoặc Anh/Chị có thể gọi điện/nhắn Zalo trực tiếp đến Hotline chi nhánh: ${branch.hotline} để các bạn kỹ thuật viên kiểm tra máy và báo giá ưu đãi chính xác liền tay ạ! ✨"
  + Cung cấp hotline/Zalo: ${branch.hotline} để khách tiện liên hệ trực tiếp.
`;

  const userPrompt = `Khách hàng nhắn: "${userText}"
${normalized !== userText.toLowerCase() ? `[Bản dịch chuẩn nghĩa tiếng Việt/Teencode]: "${normalized}"` : ''}
${device ? `[Dòng máy khách dùng]: ${device}` : ''}
${intent === 'LOCATION' ? `[LƯU Ý TRỌNG TÂM]: Khách hỏi về ĐỊA CHỈ / VỊ TRÍ / TÌM ĐƯỜNG đến chi nhánh ${branch.branchName}. Hãy báo chính xác địa chỉ: ${branch.address}, gửi link Google Maps: ${branch.mapUrl} và Hotline/Zalo: ${branch.hotline} để khách tiện liên hệ đón!` : ''}
${intent === 'CASE' ? `[LƯU Ý TRỌNG TÂM]: Khách hỏi về ỐP LƯNG / BAO DA cho máy ${device || 'của khách'}. Khẳng định shop CÓ SẴN rất nhiều mẫu ốp đẹp (chống sốc, dẻo trong suốt, bảo vệ camera, thời trang), viền êm cầm chắc tay. KHÔNG tư vấn dán cường lực hay sửa chữa nếu khách không hỏi! Mời khách ghé thử trực tiếp hoặc nhắn Zalo ${branch.hotline} để shop chụp mẫu thật gửi mình chọn!` : ''}
${intent === 'SCREEN_PROTECTOR' ? `[LƯU Ý TRỌNG TÂM]: Khách hỏi về KÍNH CƯỜNG LỰC / DÁN MÀN HÌNH cho máy ${device || 'của khách'}. Khẳng định có sẵn kính KingKong/Nano 9D vát cạnh, dán PPF, dán bao đẹp, chống vân tay. Mời khách ghé shop dán miễn phí lấy liền!` : ''}
${intent === 'CHARGING' ? `[LƯU Ý TRỌNG TÂM]: Khách hỏi lỗi sạc không vào pin. KHẲNG ĐỊNH SHOP CÓ NHẬN SỬA, giải thích nguyên nhân (chân sạc, cáp, pin, IC), mời ghé quầy ${branch.branchName} kiểm tra đo dòng sạc MIỄN PHÍ lấy liền!` : ''}
${intent === 'BATTERY' ? `[LƯU Ý TRỌNG TÂM]: Khách hỏi về pin. Khẳng định có sẵn pin Pisen/Deji chính hãng BH 12T 1 đổi 1, miễn phí công thay lấy ngay 15-30p!` : ''}
${intent === 'SCREEN' ? `[LƯU Ý TRỌNG TÂM]: Khách hỏi ép kính/màn hình. Khẳng định có nhận ép kính hút chân không lấy ngay 30-45p, chuẩn zin!` : ''}
${intent === 'REPAIR' ? `[LƯU Ý TRỌNG TÂM]: Khách hỏi sửa chữa máy. Khẳng định shop CÓ NHẬN SỬA CHỮA đầy đủ phần cứng & phần mềm lấy liền!` : ''}

Hãy trả lời ngắn gọn, đúng trọng tâm câu hỏi của khách, chuẩn phong cách Bé 8 Phụ Kiện 88.`;

  // Thử lần lượt các API key (xoay tua & chịu lỗi rate limit/mạng)
  const shuffledKeys = [...apiKeys].sort(() => 0.5 - Math.random());

  for (const apiKey of shuffledKeys) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }]
            }
          ],
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 350
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText && replyText.trim()) {
          return replyText.trim();
        }
      } else {
        console.warn(`[Gemini API] Key kết thúc với mã ${response.status}, thử key tiếp theo...`);
      }
    } catch (err) {
      console.error('[Gemini API] Lỗi kết nối Google AI:', err);
    }
  }

  // Nếu tất cả API key đều lỗi mạng, dùng phản hồi dự phòng thông minh đúng theo từng nhóm nhu cầu
  return getSmartFallback(userText, branch);
}

/**
 * Xử lý chính của Vercel Serverless Function
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Hub-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. XÁC MINH WEBHOOK (GET)
  if (req.method === 'GET') {
    const urlObj = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
    const mode = req.query?.['hub.mode'] || urlObj.searchParams.get('hub.mode');
    const token = req.query?.['hub.verify_token'] || urlObj.searchParams.get('hub.verify_token');
    const challenge = req.query?.['hub.challenge'] || urlObj.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ [Meta Webhook] XÁC MINH THÀNH CÔNG VỚI FACEBOOK!');
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(challenge);
    }

    return res.status(403).send('Forbidden: Invalid verify token');
  }

  // 2. TIẾP NHẬN TIN NHẮN TỪ KHÁCH HÀNG (POST)
  if (req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);

      if (!body) {
        console.warn('⚠️ Webhook nhận request body rỗng hoặc lỗi JSON');
        return res.status(400).send('Bad Request: Invalid JSON Body');
      }

      if (body.object === 'page') {
        const entries = body.entry || [];
        const processTasks: Promise<any>[] = [];

        for (const entry of entries) {
          const pageId = String(entry.id || '');
          const branch = BRANCH_PAGES[pageId] || {
            branchId: 'dong-khoi',
            branchName: 'Phụ Kiện 88 - Đồng Khởi',
            address: '173 Đại Lộ Đồng Khởi, Phường Phú Tân, Tỉnh Vĩnh Long (Bến Tre cũ, ngay vòng xoay Tân Thành, đối diện Cafe Trung Nguyên)',
            hotline: '081 449 6789',
            zalo: '081 449 6789',
            mapUrl: 'https://maps.app.goo.gl/dt37ZhxBXdpjrJTn8',
            token: DEFAULT_FALLBACK_TOKEN
          };

          const activeToken = branch.token || DEFAULT_FALLBACK_TOKEN;
          const messagingEvents = entry.messaging || [];

          for (const event of messagingEvents) {
            const senderId = event.sender?.id;
            const message = event.message;

            // Bỏ qua tin nhắn do page tự gửi hoặc tin echo
            if (!message || message.is_echo) continue;

            const userText = message.text || '';
            if (!userText.trim()) continue;

            console.log(`📩 [Fanpage ${branch.branchName}] (${pageId}) Khách ${senderId}: "${userText}"`);

            // Đưa task xử lý vào mảng để ĐẢM BẢO HOÀN THÀNH trước khi kết thúc response
            const task = (async () => {
              // 1. Gọi AI Bé 8 tạo câu trả lời
              const botReply = await generateBe8Response(userText, branch);

              // 2. Gửi tin nhắn trả lời qua Facebook Graph API
              await sendMetaTextMessage(activeToken, senderId, botReply);

              // 3. Ghi nhận hội thoại khách hàng vào Supabase Cloud (Realtime Lead Capture & Upgrade)
              const phoneMatch = userText.match(/(0[3|5|7|8|9][0-9]{8})/);
              const timeStr = new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' });
              const sessionLeadId = `fb-${pageId}-${senderId}`;
              
              const chatLog = [
                { sender: 'user', text: userText, time: timeStr },
                { sender: 'bot', text: botReply, time: timeStr }
              ];

              try {
                // Kiểm tra xem đã có lead với sessionLeadId này chưa
                const { data: existingLeads } = await supabase
                  .from('leads')
                  .select('id, phone, activity_log, status')
                  .eq('lead_id', sessionLeadId)
                  .limit(1);

                const existingLead = existingLeads && existingLeads.length > 0 ? existingLeads[0] : null;

                if (existingLead) {
                  const currentLog = Array.isArray(existingLead.activity_log) ? existingLead.activity_log : [];
                  const updatedLog = [...currentLog, ...chatLog];
                  const updatePayload: Record<string, any> = {
                    need: userText,
                    activity_log: updatedLog,
                    notes: `Fanpage: ${branch.branchName} (${pageId}) | Cập nhật lúc ${timeStr}`,
                    last_action_at: new Date().toISOString()
                  };

                  if (phoneMatch) {
                    const detectedPhone = phoneMatch[0];
                    console.log(`🔥 [HOT LEAD FB UPGRADE] Khách SĐT: ${detectedPhone} tại ${branch.branchName}!`);
                    updatePayload.phone = detectedPhone;
                    updatePayload.status = 'NEW';
                    updatePayload.priority = 'HIGH';
                    updatePayload.label = 'HOT LEAD FB';
                    updatePayload.score = 100;
                    updatePayload.conversation_summary = `Khách gửi SĐT: ${detectedPhone} qua tin nhắn: "${userText}"\nBé 8 AI tư vấn: "${botReply}"`;
                  }

                  await supabase.from('leads').update(updatePayload).eq('id', existingLead.id);
                } else {
                  // Tạo mới session lead
                  if (phoneMatch) {
                    const detectedPhone = phoneMatch[0];
                    console.log(`🔥 [HOT LEAD FB] Khách SĐT: ${detectedPhone} tại ${branch.branchName}!`);
                    await supabase.from('leads').insert([{
                      lead_id: sessionLeadId,
                      customer_name: 'Khách Facebook Messenger',
                      phone: detectedPhone,
                      need: userText,
                      branch: branch.branchName,
                      branch_id: branch.branchId,
                      source: 'facebook_messenger',
                      status: 'NEW',
                      priority: 'HIGH',
                      label: 'HOT LEAD FB',
                      score: 100,
                      notes: `Fanpage: ${branch.branchName} (${pageId}) | Yêu cầu: "${userText}"`,
                      activity_log: chatLog,
                      conversation_summary: `Khách gửi SĐT: ${detectedPhone} qua tin nhắn: "${userText}"\nBé 8 AI tư vấn: "${botReply}"`
                    }]);
                  } else {
                    console.log(`💬 [CHATTING FB] Khách Messenger ${senderId} đang chat tại ${branch.branchName}`);
                    await supabase.from('leads').insert([{
                      lead_id: sessionLeadId,
                      customer_name: 'Khách Facebook Messenger',
                      phone: '',
                      need: userText,
                      branch: branch.branchName,
                      branch_id: branch.branchId,
                      source: 'facebook_messenger',
                      status: 'CHATTING',
                      priority: 'MEDIUM',
                      label: 'ĐANG TƯ VẤN FB',
                      score: 50,
                      notes: `Fanpage: ${branch.branchName} (${pageId}) | Đang chat: "${userText}"`,
                      activity_log: chatLog,
                      conversation_summary: `Khách đang chat: "${userText}"\nBé 8 AI tư vấn: "${botReply}"`
                    }]);
                  }
                }
              } catch (dbErr) {
                console.error('Lỗi ghi Supabase leads:', dbErr);
              }
            })();

            processTasks.push(task);
          }
        }

        // Đợi toàn bộ tin nhắn được gửi đi thành công trước khi đóng kết nối Vercel
        if (processTasks.length > 0) {
          await Promise.all(processTasks);
        }

        // Báo 200 OK cho Facebook
        return res.status(200).send('EVENT_RECEIVED');
      }

      return res.status(404).send('Not a page subscription');
    } catch (err: any) {
      console.error('❌ Lỗi xử lý POST Meta Webhook:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).send('Method Not Allowed');
}
