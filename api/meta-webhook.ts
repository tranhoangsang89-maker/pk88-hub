import { createClient } from '@supabase/supabase-js';

// Mã bí mật dùng để Meta đối soát Webhook
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'pk88_meta_webhook_2026';

// Supabase Cloud Credentials
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kvxxkfgictaqmwcwvluf.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2eHhrZmdpY3RhcW13Y3d2bHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTExNTYsImV4cCI6MjEwNjA4NzE1Nn0.2_DlkAogz1dmdPs2lnozj4hSxekY7gmmtT2X_NGs7NQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Bảng đối chiếu 7 Fanpage Chi Nhánh & Mã Truy Cập (Page Access Tokens)
export const BRANCH_PAGES: Record<string, { 
  branchId: string; 
  branchName: string; 
  address: string; 
  hotline: string; 
  zalo: string;
  token: string;
}> = {
  // 1. Phụ Kiện 88 - Phú Khương
  '101678755095111': {
    branchId: 'phu-khuong',
    branchName: 'Phụ Kiện 88 - Phú Khương',
    address: '35 B2 Đoàn Hoàng Minh, P. Phú Khương, TP. Bến Tre',
    hotline: '077 788 8688',
    zalo: '077 788 8688',
    token: 'EAAPsOa0mtpgBS5DcblZBjWAZAaCpd0gsrL6jYXXZAfcvEsIkBqKvJooqzMxV3WYdB7C45u2sQ0rOdh7ZBjCIirBPLacvK8pJHZCSeV3NThHSKVeu7Y9mEiG0qkO83CgJmv16toHi7waM6RNCP0QY49EOE4yfwLe4fNA2tEve3vmryGIQKe2RcSzv1iWj2FiYem0Lh'
  },
  // 2. Phụ Kiện 88 - Đồng Khởi
  '112851187716380': {
    branchId: 'dong-khoi',
    branchName: 'Phụ Kiện 88 - Đồng Khởi',
    address: '139 Đại Lộ Đồng Khởi, P. Phú Khương, TP. Bến Tre',
    hotline: '081 449 6789',
    zalo: '081 449 6789',
    token: 'EAAPsOa0mtpgBS4fAeJ9geALLraVnpZCeiQ8LXy4zSF2fzlJWDQQ90ZC5UcwIjm0W3OQmLmZAEfCdbZA16zYZAmDXB1kZAIebGeFMyLGHD8ZCrgTz1KPNvjuDBMp9ZCZBt8KObSsRD6sR4cGQCgtZAnLhhdZB7HFUubuvM3E3lq1C6ZBZCQGWuPZBfr6RUIRzOQZA18f7P76s0ZBs'
  },
  // 3. Phụ Kiện 88 - Mỹ Tho
  '791330520729975': {
    branchId: 'my-tho',
    branchName: 'Phụ Kiện 88 - Mỹ Tho',
    address: '228 Ấp Bắc, Phường 10, TP. Mỹ Tho, Tiền Giang',
    hotline: '087 683 8688',
    zalo: '087 683 8688',
    token: 'EAAPsOa0mtpgBS3AfnCJLrUmF6tHMBFFNCCl9nid5958p0gySteYuFGsbVGRtuzYMzvE0cMEZA5GkORYgZCGvOFuzPiEcpe9mszSakSu00KF1brtrTpIyegJQDlFBHFCfLeEfiFOXVwsfZAvcmcQ1zNH1srZB1OZBG2xIqPCen50FiZAFBpm3GrCT0qN7OKUENoS06CawZDZD'
  },
  // 4. Phụ Kiện 88 - Cần Thơ
  '487433804445622': {
    branchId: 'can-tho',
    branchName: 'Phụ Kiện 88 - Cần Thơ',
    address: '128 Đường 30/4, P. An Phú, Q. Ninh Kiều, TP. Cần Thơ',
    hotline: '092 136 8688',
    zalo: '092 136 8688',
    token: 'EAAPsOa0mtpgBSxIHnLgbsUnCNTxKCwlPh1TLomWbUn48izlz60wsX3TeV8SYal2sjmafrg14JRmDtKQDJ4QhFLyNgZBqWZAnZCbArmfQLYK2nA7VQUblYaVNFfZCLfm8dd4HB7wu6SDgh0qeifUNZAXSjiAmbdPZAdhWOvQ7ZBW8lGJMGXZC7lY9wHWg5UtIMseJQsvdFQZDZD'
  },
  // 5. Phụ Kiện 88 - Vĩnh Long
  '102307502816794': {
    branchId: 'vinh-long',
    branchName: 'Phụ Kiện 88 - Vĩnh Long',
    address: '52 Đinh Tiên Hoàng, Phường 8, TP. Vĩnh Long',
    hotline: '058 988 6789',
    zalo: '058 988 6789',
    token: 'EAAPsOa0mtpgBSZBWoFdAG2xf2MKbwZBcQtRuLVYJSxcD2CjZALWFPHUMmWw1LSWe6ssBQGsWOLJFYNPIFcEdaXrkn7XiqIpFuwO8bjfpERjgXZAwCU6qGcaAIQvTzYtm1TG4oCr5s79SNm1JnmfAkrnZBuvcVVksk4zUsF6BuZA7zxPbeOXZAhL9yOgx8iFJ8au2DFm'
  },
  // 6. Phụ Kiện 88 - Thủ Đức
  '1324117450777083': {
    branchId: 'thu-duc',
    branchName: 'Phụ Kiện 88 - Thủ Đức',
    address: '12 Võ Văn Ngân, P. Linh Chiểu, TP. Thủ Đức, TP.HCM',
    hotline: '086 506 8688',
    zalo: '086 506 8688',
    token: 'EAAPsOa0mtpgBS4lGaSzZCUZAaR3cPmUWUOkDlBggOJoRstKPswiMBIZAh65wQcAYiYVT6ukukKjIIyqh4QjkqB9oTb4Vik0hOVx2EJ0qu60PzAWdQ7ZCR25XwnvZBo9IWhyP71ZBkhQqGfZAFhaRa8vOScZCYOsZCR9oHkrlD9ZB3PiH5oZAg4gTSyEm1woO435QwzRUOyG1wZDZD'
  },
  // 7. Toàn Hệ Thống Phụ Kiện 88
  '109869170590318': {
    branchId: 'he-thong',
    branchName: 'Hệ Thống Phụ Kiện 88',
    address: 'Hệ Thống Chuỗi Cửa Hàng Bán Lẻ & Chăm Sóc Điện Thoại Phụ Kiện 88 Miền Tây',
    hotline: '083 389 8688',
    zalo: '083 389 8688',
    token: 'EAAPsOa0mtpgBSZB7422qUdRipiYzhijPZAtVuCIa4KD094PkpHKMixWezUNDYdMRCecUXLlZCAbTbqFds3ZC5FyZA5f94aL47tmTB2wlGJb6oWecwpTovWdpVdBeQI0WXKXJBHwEVW6vBenKF04bxeUXVknZBUNuIUDCiMN1iV13SXBZBvB2dHYkKnSNkb8aTHaJQmY'
  }
};

/**
 * Gửi tin nhắn phản hồi qua Meta Graph API
 */
async function sendMetaTextMessage(pageAccessToken: string, recipientId: string, text: string) {
  try {
    const url = `https://graph.facebook.com/v20.0/me/messages?access_token=${pageAccessToken}`;
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
      console.error('❌ Lỗi gửi tin nhắn Meta:', data.error);
    } else {
      console.log('✅ Đã gửi phản hồi Messenger thành công tới:', recipientId);
    }
  } catch (err) {
    console.error('Lỗi ngoại lệ sendMetaTextMessage:', err);
  }
}

/**
 * Sinh câu trả lời thông minh bằng Google Gemini AI (gemini-flash-lite-latest)
 */
async function generateBe8Response(
  userText: string,
  branch: typeof BRANCH_PAGES[string]
): Promise<string> {
  const geminiKeysRaw = process.env.VITE_GEMINI_API_KEY || '';
  const apiKeys = geminiKeysRaw.split(',').map(k => k.trim()).filter(Boolean);
  const selectedKey = apiKeys.length > 0 
    ? apiKeys[Math.floor(Math.random() * apiKeys.length)]
    : '';

  if (!selectedKey) {
    return `Dạ chào Anh/Chị! Em là Bé 8 - Trợ lý tư vấn của ${branch.branchName} (${branch.address}). Anh/Chị cho em xin Tên và Số Điện Thoại để nhân viên shop chuẩn bị sẵn sản phẩm tại quầy, khi mình ghé là có ngay không phải đợi nhé! Hotline shop: ${branch.hotline}`;
  }

  const systemInstruction = `
Bạn là "Bé 8" - Chuyên Viên Tư Vấn Khách Hàng AI duyên dáng, tận tâm của Chuỗi Cửa Hàng Phụ Kiện 88 tại chi nhánh: ${branch.branchName}.
Địa chỉ cửa hàng: ${branch.address}. Hotline / Zalo tiếp nhận: ${branch.hotline}.

VĂN HÓA DOANH NGHIỆP "PHỤC VỤ TỪ TRÁI TIM" CỦA PHỤ KIỆN 88:
- Luôn mở đầu thân thiện, lễ phép: "Dạ em chào Anh/Chị! Em là Bé 8 tại ${branch.branchName} ạ..."
- Tuyệt đối KHÔNG dùng các câu phủ định cộc lốc:
  + Không nói "Cái này bên em không có" -> Hãy nói: "Dạ mẫu đó hiện tại shop vừa hết, em mời anh/chị xem thử mẫu tương tự này đang rất được chuộng ạ."
  + Không nói "Không biết" -> Hãy nói: "Dạ anh/chị chờ em 30 giây để em kiểm tra thông tin chính xác nhất cho mình nhé."
  + Không nói "Hết hàng rồi, qua chỗ khác mua" -> Hãy nói: "Dạ mẫu này dự kiến sớm về thêm, hoặc em kiểm tra chi nhánh gần nhất ship ngay cho mình nhé."
- BẢNG GIÁ DỊCH VỤ THỰC TẾ:
  + Dán kính cường lực KingKong / Nano chống va đập: từ 50.000đ - 120.000đ (bảo hành dán lại).
  + Ép kính lấy liền: 350.000đ - 650.000đ tùy dòng máy (hút chân không không bụi, lấy ngay sau 45-60p).
  + Thay pin dung lượng cao (chính hãng bảo hành 12 tháng): từ 250.000đ - 750.000đ.
  + Củ sạc nhanh 20W/30W/65W Type-C, cáp dù bọc thép, ốp lưng chống sốc chuẩn thiết kế.
- MỤC TIÊU CỐT LÕI:
  + Tư vấn ngắn gọn, súc tích (dưới 4 câu), đúng trọng tâm khách hỏi.
  + Luôn khéo léo xin Tên + Số Điện Thoại: "Anh/Chị cho em xin Tên và SĐT để em nhắn bạn kỹ thuật viên tại quầy ${branch.branchName} giữ sẵn hàng, khi mình ghé là phục vụ ngay không cần chờ đợi nhé!"
  + Cung cấp hotline/Zalo: ${branch.hotline} để khách tiện liên hệ trực tiếp.
  + Hiện tại chưa có chương trình khuyến mãi nào, không tự bịa voucher nếu không có.
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${selectedKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `Khách hàng nhắn: "${userText}". Hãy trả lời theo đúng phong cách Bé 8 Phụ Kiện 88.` }]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300
        }
      })
    });

    const data = await response.json();
    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (replyText) {
      return replyText.trim();
    }
  } catch (err) {
    console.error('Lỗi gọi Gemini AI:', err);
  }

  // Fallback nếu API lỗi
  return `Dạ em chào Anh/Chị! Em là Bé 8 của ${branch.branchName} (${branch.address}). Anh/Chị cho em xin Tên và Số Điện Thoại để shop chuẩn bị phụ kiện sẵn cho mình nhé! Hotline hỗ trợ 24/7: ${branch.hotline}.`;
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
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {}
      }

      if (body?.object === 'page') {
        // Phản hồi 200 OK ngay lập tức cho Facebook để tránh retry loop
        res.status(200).send('EVENT_RECEIVED');

        const entries = body.entry || [];
        for (const entry of entries) {
          const pageId = entry.id;
          const branch = BRANCH_PAGES[pageId];

          if (!branch || !branch.token) {
            console.warn(`[Meta Webhook] Bỏ qua Page ID chưa cấu hình token: ${pageId}`);
            continue;
          }

          const messagingEvents = entry.messaging || [];
          for (const event of messagingEvents) {
            const senderId = event.sender?.id;
            const message = event.message;

            // Bỏ qua tin nhắn do page tự gửi hoặc tin echo
            if (!message || message.is_echo) continue;

            const userText = message.text || '';
            if (!userText.trim()) continue;

            console.log(`📩 [Fanpage ${branch.branchName}] Khách ${senderId}: "${userText}"`);

            // Kiểm tra số điện thoại của khách
            const phoneMatch = userText.match(/(0[3|5|7|8|9][0-9]{8})/);
            if (phoneMatch) {
              const detectedPhone = phoneMatch[0];
              console.log(`🔥 [LEAD NÓNG PHỤ KIỆN 88] Khách SĐT: ${detectedPhone} tại ${branch.branchName}!`);

              // Tự động lưu thẳng vào Supabase Bảng `leads` (SSOT)
              try {
                await supabase.from('leads').insert([{
                  lead_id: `fb-${Date.now()}-${senderId.slice(-4)}`,
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
                  notes: `Fanpage: ${branch.branchName} | ID: ${pageId} | Yêu cầu: "${userText}"`
                }]);
                console.log(`✅ Đã lưu khách ${detectedPhone} vào Supabase Cloud CRM thành công!`);
              } catch (dbErr) {
                console.error('Lỗi ghi Supabase leads:', dbErr);
              }
            }

            // Gọi AI Bé 8 sinh câu trả lời
            const botReply = await generateBe8Response(userText, branch);

            // Gửi tin nhắn trả lời qua Facebook Graph API
            await sendMetaTextMessage(branch.token, senderId, botReply);
          }
        }
        return;
      }

      return res.status(404).send('Not a page subscription');
    } catch (err: any) {
      console.error('Lỗi xử lý POST Meta Webhook:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).send('Method Not Allowed');
}
