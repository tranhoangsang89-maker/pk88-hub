import type { IncomingMessage, ServerResponse } from 'http';

// Mã bí mật dùng để Meta đối soát Webhook
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'pk88_meta_webhook_2026';

// Bảng đối chiếu 7 Fanpage Chi Nhánh chuẩn hóa của Phụ Kiện 88
export const BRANCH_PAGES: Record<string, { branchId: string; branchName: string; address: string; hotline: string; zalo: string }> = {
  // 1. Phú Khương
  '101678755095111': {
    branchId: 'phu-khuong',
    branchName: 'Phú Khương',
    address: '35 B2 Đoàn Hoàng Minh, P. Phú Khương, TP. Bến Tre',
    hotline: '077 788 8688',
    zalo: '077 788 8688'
  },
  // 2. Đồng Khởi
  '112851187716380': {
    branchId: 'dong-khoi',
    branchName: 'Đồng Khởi',
    address: '139 Đại Lộ Đồng Khởi, P. Phú Khương, TP. Bến Tre',
    hotline: '081 449 6789',
    zalo: '081 449 6789'
  },
  // 3. Mỹ Tho
  '791330520729975': {
    branchId: 'my-tho',
    branchName: 'Mỹ Tho',
    address: '228 Ấp Bắc, Phường 10, TP. Mỹ Tho, Tiền Giang',
    hotline: '087 683 8688',
    zalo: '087 683 8688'
  },
  // 4. Cần Thơ
  '487433804445622': {
    branchId: 'can-tho',
    branchName: 'Cần Thơ',
    address: '128 Đường 30/4, P. An Phú, Q. Ninh Kiều, TP. Cần Thơ',
    hotline: '092 136 8688',
    zalo: '092 136 8688'
  },
  // 5. Vĩnh Long
  '102307502816794': {
    branchId: 'vinh-long',
    branchName: 'Vĩnh Long',
    address: '52 Đinh Tiên Hoàng, Phường 8, TP. Vĩnh Long',
    hotline: '058 988 6789',
    zalo: '058 988 6789'
  },
  // 6. Thủ Đức
  '1324117450777083': {
    branchId: 'thu-duc',
    branchName: 'Thủ Đức',
    address: '12 Võ Văn Ngân, P. Linh Chiểu, TP. Thủ Đức, TP.HCM',
    hotline: '086 506 8688',
    zalo: '086 506 8688'
  },
  // 7. Toàn Hệ Thống
  '109869170590318': {
    branchId: 'he-thong',
    branchName: 'Hệ Thống Phụ Kiện 88',
    address: 'Hệ Thống Chuỗi Bán Lẻ & Chăm Sóc Điện Thoại Phụ Kiện 88 Miền Tây',
    hotline: '083 389 8688',
    zalo: '083 389 8688'
  }
};

/**
 * Vercel Serverless Function: Tiếp nhận Webhook từ Meta Facebook Messenger
 */
export default async function handler(req: any, res: any) {
  // Hỗ trợ CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Hub-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. XỬ LÝ GET: XÁC MINH WEBHOOK VỚI META FACEBOOK
  if (req.method === 'GET') {
    const urlObj = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
    const mode = req.query?.['hub.mode'] || urlObj.searchParams.get('hub.mode');
    const token = req.query?.['hub.verify_token'] || urlObj.searchParams.get('hub.verify_token');
    const challenge = req.query?.['hub.challenge'] || urlObj.searchParams.get('hub.challenge');

    console.log('[Meta Webhook Verification] Mode:', mode, '| Token:', token, '| Expected:', VERIFY_TOKEN);

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ [Meta Webhook] XÁC MINH THÀNH CÔNG VỚI FACEBOOK!');
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(challenge);
    }

    console.warn('❌ [Meta Webhook] Xác minh thất bại: Sai verify token!');
    return res.status(403).send('Forbidden: Invalid verify token');
  }

  // 2. XỬ LÝ POST: TIẾP NHẬN SỰ KIỆN TIN NHẮN TỪ KHÁCH HÀNG MESSENGER
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          console.error('Lỗi parse body JSON:', e);
        }
      }

      // Kiểm tra xem payload có phải từ Facebook Page không
      if (body?.object === 'page') {
        // Phản hồi 200 OK ngay lập tức cho Facebook trong vòng 2 giây để tránh retry loop
        res.status(200).send('EVENT_RECEIVED');

        const entries = body.entry || [];
        for (const entry of entries) {
          const pageId = entry.id; // Page ID nhận tin nhắn
          const branch = BRANCH_PAGES[pageId] || {
            branchId: 'unknown',
            branchName: 'Phụ Kiện 88',
            address: 'Hệ Thống Phụ Kiện 88',
            hotline: '083 389 8688',
            zalo: '083 389 8688'
          };

          const messagingEvents = entry.messaging || [];
          for (const event of messagingEvents) {
            const senderId = event.sender?.id; // ID của khách chat
            const message = event.message;

            // Bỏ qua tin nhắn do chính page gửi đi
            if (!message || message.is_echo) continue;

            const userText = message.text || '';
            console.log(`[Tin nhắn mới] Page: ${branch.branchName} (${pageId}) | Khách: ${senderId} | Nội dung: "${userText}"`);

            // Kiểm tra số điện thoại trong tin nhắn
            const phoneMatch = userText.match(/(0[3|5|7|8|9][0-9]{8})/);
            if (phoneMatch) {
              const detectedPhone = phoneMatch[0];
              console.log(`🔥 [LEAD NÓNG] Khách để lại SĐT: ${detectedPhone} tại ${branch.branchName}!`);
              // Ghi vào Supabase sẽ được kích hoạt tại đây
            }
          }
        }
        return;
      }

      return res.status(404).send('Not a page subscription');
    } catch (err: any) {
      console.error('Lỗi xử lý Meta Webhook POST:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).send('Method Not Allowed');
}
