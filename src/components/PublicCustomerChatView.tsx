import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Branch } from '../types';
import { submitCustomerLead, submitOrUpdateCustomerLead, generateVoucherCode } from '../lib/leadService';
import { normalizeCustomerQuery } from '../lib/teencodeHelper';
import productsData from '../lib/products.json';
import { 
  Send, 
  Sparkles, 
  Phone, 
  MapPin, 
  Tag, 
  CheckCircle2, 
  Clock, 
  Gift, 
  ArrowLeft, 
  Copy, 
  Check, 
  Smartphone, 
  Wrench, 
  ShieldCheck, 
  Store,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  Share2,
  QrCode
} from 'lucide-react';

interface PublicCustomerChatViewProps {
  branches: Branch[];
  onBackToApp?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'be8' | 'user';
  text: string;
  time: string;
  imageUrl?: string;
  voucherCode?: string;
  isLeadPrompt?: boolean;
}

// Bảng tra cứu số Hotline / Zalo chính xác của từng chi nhánh PK88
export const getBranchHotline = (branch?: { code?: string; id?: string; name?: string; hotline?: string; zalo?: string }) => {
  if (branch?.hotline) {
    const raw = branch.hotline.replace(/\D/g, '');
    const display = branch.hotline;
    const zalo = branch.zalo || branch.hotline;
    return { tel: raw, display, zalo, zaloLink: `https://zalo.me/${raw}` };
  }

  const code = (branch?.code || '').toUpperCase();
  const name = (branch?.name || '').toLowerCase();
  
  if (code.includes('PHUKHUONG') || name.includes('phú khương')) {
    return { tel: '0777888688', display: '077 788 8688', zalo: '077 788 8688', zaloLink: 'https://zalo.me/0777888688' };
  }
  if (code.includes('DONGKHOI') || name.includes('đồng khởi')) {
    return { tel: '0814496789', display: '081 449 6789', zalo: '081 449 6789', zaloLink: 'https://zalo.me/0814496789' };
  }
  if (code.includes('MYTHO') || name.includes('mỹ tho')) {
    return { tel: '0876838688', display: '087 683 8688', zalo: '087 683 8688', zaloLink: 'https://zalo.me/0876838688' };
  }
  if (code.includes('CANTHO') || name.includes('cần thơ')) {
    return { tel: '0921368688', display: '092 136 8688', zalo: '092 136 8688', zaloLink: 'https://zalo.me/0921368688' };
  }
  if (code.includes('VINHLONG') || name.includes('vĩnh long')) {
    return { tel: '0589886789', display: '058 988 6789', zalo: '058 988 6789', zaloLink: 'https://zalo.me/0589886789' };
  }
  if (code.includes('THUDUC') || name.includes('thủ đức')) {
    return { tel: '0865068688', display: '086 506 8688', zalo: '086 506 8688', zaloLink: 'https://zalo.me/0865068688' };
  }
  return { tel: '0833898688', display: '083 389 8688', zalo: '083 389 8688', zaloLink: 'https://zalo.me/0833898688' };
};

const QUICK_ACTIONS = [
  { icon: 'Smartphone', text: 'Tìm ốp lưng & cường lực theo dòng máy' },
  { icon: 'Wrench', text: 'Tư vấn thay pin & ép kính lấy liền' },
  { icon: 'Sparkles', text: 'Củ sạc nhanh & cáp sạc chính hãng' },
  { icon: 'MapPin', text: 'Xem địa chỉ 7 chi nhánh gần tôi nhất' },
  { icon: 'Gift', text: 'Nhận E-Voucher giảm giá 10% hôm nay' }
];

import { LeadLinkGeneratorModal } from './LeadLinkGeneratorModal';

export const PublicCustomerChatView: React.FC<PublicCustomerChatViewProps> = ({
  branches,
  onBackToApp
}) => {
  const activeBranches = branches.filter(b => b.isActive !== false);

  // Đọc nguồn chiến dịch (src / utm_source) từ URL
  const [trackingSource] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('src') || p.get('utm_source') || 'web_chatbot';
    }
    return 'web_chatbot';
  });

  // Chọn chi nhánh ưu tiên (tự nhận diện từ URL nếu có param branch)
  const [selectedBranch, setSelectedBranch] = useState<Branch>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const bCode = p.get('branch') || p.get('branch_code');
      if (bCode) {
        const found = activeBranches.find(b => b.code?.toLowerCase() === bCode.toLowerCase());
        if (found) return found;
      }
    }
    return activeBranches.find(b => b.code === 'PK88_PHUKHUONG') || activeBranches[0] || {
      id: 'default',
      code: 'PK88_PHUKHUONG',
      name: 'Phụ Kiện 88 - Phú Khương',
      address: '35 B2 Đoàn Hoàng Minh, Phường Phú Khương, TP Vĩnh Long (Bến Tre cũ) (đối diện cây xăng ngã tư Phú Khương)',
      lat: 10.2527,
      lng: 106.3707,
      isActive: true,
      mapUrl: 'https://maps.app.goo.gl/rTUneKwULXKE4jTy8'
    };
  });

  const currentBranchHotline = getBranchHotline(selectedBranch);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showLinkGenModal, setShowLinkGenModal] = useState<boolean>(false);

  // Form thu thập SĐT & Tên khách hàng (Lead Capture)
  const [showLeadModal, setShowLeadModal] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerNeed, setCustomerNeed] = useState<string>('');
  const [isSubmittingLead, setIsSubmittingLead] = useState<boolean>(false);
  const [claimedVoucher, setClaimedVoucher] = useState<string | null>(null);

  // Định danh phiên chat độc nhất (Persistent Chat Session ID)
  const [chatSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('pk88_chat_session_id');
        if (saved) return saved;
        const newId = `web-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        sessionStorage.setItem('pk88_chat_session_id', newId);
        return newId;
      } catch (e) {
        return `web-${Date.now()}`;
      }
    }
    return `web-${Date.now()}`;
  });

  // Lịch sử tin nhắn
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'be8',
      text: `Dạ chào Anh/Chị! Em là **Bé 8** - Chuyên Viên Tư Vấn AI của Chuỗi Cửa Hàng **Phụ Kiện 88** 🤖💖

Anh/Chị đang tìm phụ kiện cho dòng máy nào (iPhone, Samsung, Xiaomi...) hay cần tư vấn dịch vụ kỹ thuật (thay pin dung lượng cao, ép kính lấy liền, dán cường lực bảo hành)?

Cứ nhắn cho Bé 8 để được tư vấn dòng sản phẩm phù hợp nhất, em hỗ trợ giữ hàng và tặng mình **E-Voucher giảm giá 10%** ngay nhé! ✨`,
      time: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Thuật toán tìm kiếm thông minh từ kho 521 sản phẩm thực tế của Phụ Kiện 88 (Real-time Inventory RAG)
  const searchRelevantProducts = (query: string) => {
    if (!query || !productsData || !Array.isArray(productsData)) return [];
    
    // Chuẩn hóa từ viết tắt và teencode để tìm kiếm chính xác
    const normalized = normalizeCustomerQuery(query);
    const combinedQuery = `${query} ${normalized.normalizedText}`;

    const cleanQ = combinedQuery.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim();

    const words = cleanQ.split(/\s+/).filter(w => w.length > 1);
    if (words.length === 0) return [];

    const scored = (productsData as any[]).map(p => {
      const rawName = (p.name || '').toLowerCase();
      const cleanName = rawName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const cleanCat = (p.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const cleanBrand = (p.brand || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      let score = 0;
      
      // Khớp nguyên cụm từ khóa
      if (cleanName.includes(cleanQ)) score += 40;

      // Khớp từng từ
      words.forEach(w => {
        if (cleanName.includes(w)) score += 10;
        if (cleanCat.includes(w)) score += 6;
        if (cleanBrand.includes(w)) score += 4;
      });

      // Trọng số dòng máy iPhone đặc biệt
      if (cleanQ.includes('18') && cleanName.includes('18')) score += 20;
      if (cleanQ.includes('duo') && cleanName.includes('duo')) score += 20;
      if (cleanQ.includes('17') && cleanName.includes('17')) score += 20;
      if (cleanQ.includes('16') && cleanName.includes('16')) score += 20;
      if (cleanQ.includes('15') && cleanName.includes('15')) score += 15;
      if ((cleanQ.includes('s24') || cleanQ.includes('s 24')) && cleanName.includes('s24')) score += 20;
      if ((cleanQ.includes('s25') || cleanQ.includes('s 25')) && cleanName.includes('s25')) score += 20;
      if (cleanQ.includes('pin') && (cleanCat.includes('pin') || cleanName.includes('pin'))) score += 25;
      if ((cleanQ.includes('cuong luc') || cleanQ.includes('kinh')) && cleanCat.includes('kinh')) score += 25;
      if ((cleanQ.includes('op') || cleanQ.includes('case')) && cleanCat.includes('op')) score += 25;
      if (cleanQ.includes('lens') && cleanCat.includes('lens')) score += 25;

      return { product: p, score };
    });

    return scored
      .filter(item => item.score > 8)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(item => item.product);
  };

  // Xây dựng kho tri thức thời gian thực cho System Prompt của Gemini AI
  const buildSystemPrompt = (userQueryText?: string) => {
    const currentBranchHotline = getBranchHotline(selectedBranch);
    const branchListStr = activeBranches
      .map(b => {
        const h = getBranchHotline(b);
        return `- ${b.name}: ${b.address} (Hotline/Zalo: ${h.display})`;
      })
      .join('\n');

    // Lấy mốc thời gian thực tại Việt Nam
    const now = new Date();
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const currentDayName = dayNames[now.getDay()];
    const currentDateStr = `${currentDayName}, ngày ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentYear = now.getFullYear();

    // Tìm kiếm các sản phẩm khớp trực tiếp trong kho thực tế theo câu hỏi của khách (loại bỏ trường giá)
    const matchedProducts = userQueryText ? searchRelevantProducts(userQueryText) : [];
    let realTimeProductContext = '';
    if (matchedProducts.length > 0) {
      realTimeProductContext = `
5. DỮ LIỆU TỒN KHO THỰC TẾ KHỚP TRỰC TIẾP VỚI YÊU CẦU CỦA KHÁCH (CHỈ DÙNG TÊN VÀ ĐẶC ĐIỂM SẢN PHẨM ĐỂ TƯ VẤN, TUYỆT ĐỐI KHÔNG TỰ BÁO GIÁ):
${matchedProducts.map(p => `- ${p.name} | Danh mục: ${p.category} | Hãng: ${p.brand || 'Chính hãng'}`).join('\n')}
(Cam kết shop luôn có sẵn hàng tại quầy và hỗ trợ dán/thay máy miễn phí công lấy liền)`;
    }

    // Các sản phẩm tiêu biểu đa dạng (không kèm giá tiền)
    const sampleProducts = [
      'Cường lực KingKong / Anank / URR / Wiwu chống va đập, chống nhìn trộm, bề mặt nano mượt mà',
      'Lens Camera URR Sapphire bảo vệ mắt kính camera siêu cứng trong suốt chuẩn HD',
      'Ốp lưng Chống sốc, Magsafe, viền xi cao cấp, chống ố vàng cho đầy đủ các dòng iPhone (từ iPhone 7 đến iPhone 18 Series, iPhone Duo) và Samsung, Xiaomi',
      'Củ sạc nhanh 20W, 30W, 35W, 65W GaN sạc siêu tốc chuẩn Power Delivery bảo hành 1 đổi 1 trong 12 tháng',
      'Cáp sạc bọc dù siêu bền Type-C, Lightning, 3-in-1 chống gãy gập',
      'Tai nghe Bluetooth TWS pin trâu 6-8 tiếng, bass ấm, đàm thoại to rõ',
      'Pin dung lượng cao cho iPhone chính hãng Pisen / Deji bảo hành 12 tháng, miễn phí công thay lấy ngay',
      'Ép kính màn hình cong hút chân không không bọt bụi, thay mặt kính lấy liền trong 30-45 phút'
    ].join('\n');

    return `BẠN LÀ "BÉ 8" - CHUYÊN VIÊN TƯ VẤN KHÁCH HÀNG AI DUYÊN DÁNG, NHIỆT TÌNH CỦA CHUỖI CỬA HÀNG PHỤ KIỆN 88 (HỆ THỐNG BÁN LẺ & SỬA CHỮA ĐIỆN THOẠI UY TÍN TẠI MIỀN TÂY & TP.HCM).

==============================
MỐC THỜI GIAN THỰC TẾ HỆ THỐNG:
- Thời điểm trò chuyện: ${currentDateStr} lúc ${currentTimeStr} (Múi giờ Việt Nam GMT+7).
- Năm hiện tại: NĂM ${currentYear}.

NHẬN THỨC THỜI GIAN THỰC & ĐỊNH HƯỚNG DÒNG MÁY SMARTPHONE NĂM ${currentYear}:
- Bạn LUÔN NHẬN THỨC RÕ hiện tại đang là năm ${currentYear}.
- Về các dòng máy Apple iPhone mới nhất:
  + Dòng máy mới nhất: Apple đã chính thức ra mắt thế hệ **iPhone 18 Series (iPhone 18, 18 Air/Slim, 18 Pro, 18 Pro Max)** và điện thoại màn hình gập đột phá **iPhone Duo**!
  + Chuỗi Phụ Kiện 88 liên tục có sẵn các mẫu ốp lưng Magsafe cao cấp, cường lực KingKong/URR, dán PPF full body và lens bảo vệ camera riêng cho iPhone 18 Series và iPhone Duo.
  + Với các dòng máy iPhone 17 Series, 16 Series, 15 Series, 14, 13, 12, 11... trở về trước: Shop luôn có sẵn đầy đủ linh kiện và phụ kiện chính hãng tại quầy.
- Về các dòng máy Samsung & Android:
  + Galaxy S24, S25 Series, Galaxy Z Fold6, Z Flip6, Z Fold7... Shop luôn có sẵn cường lực, ốp chống sốc, củ sạc siêu nhanh 25W/45W/65W GaN.
==============================

QUY TẮC BẮT BUỘC SỐ 1 - CHÍNH SÁCH BẢO MẬT & ĐIỀU CHỈNH GIÁ BÁN TOÀN CHUỖI:
HIỆN TẠI CHUỖI CỬA HÀNG PHỤ KIỆN 88 ĐANG TRONG ĐỢT CÂN ĐỐI LẠI BẢNG GIÁ BÁN TOÀN BỘ SẢN PHẨM & DỊCH VỤ TRÊN TOÀN HỆ THỐNG ĐỂ ÁP DỤNG CHÍNH SÁCH TRỢ GIÁ TỐT NHẤT CHO KHÁCH HÀNG.
VÌ VẬY, BẠN TUÂN THỦ TUYỆT ĐỐI CÁC ĐIỀU SAU:
1. TUYỆT ĐỐI KHÔNG BÁO BẤT KỲ GIÁ TIỀN NÀO:
   - KHÔNG đưa ra con số giá cụ thể (TUYỆT ĐỐI KHÔNG nói bất kỳ số tiền nào như 50k, 120k, 250k, 1.535.000đ, 2.299.000đ...).
   - KHÔNG đưa ra khoảng giá (KHÔNG nói "khoảng từ... đến...", "dao động từ...").
   - Kể cả khi khách hỏi trực tiếp "thay pin giá bao nhiêu", "cường lực giá sao", "ốp lưng bao nhiêu tiền", bạn TUYỆT ĐỐI KHÔNG TỰ BÁO GIÁ TIỀN.

2. TẬP TRUNG TƯ VẤN SẢN PHẨM & DỊCH VỤ CHUYÊN SÂU:
   - Tư vấn chi tiết về xuất xứ, thương hiệu chính hãng (Pisen, Deji, KingKong, URR, Wiwu, Anank...).
   - Tư vấn tính năng, sự khác biệt (ví dụ: Pin Pisen chuẩn zin hoạt động bền bỉ, ổn định; Pin Pisen Superman/Dragon siêu dung lượng cho thời lượng pin trâu hơn hẳn).
   - Nêu rõ các cam kết vàng: Bảo hành chính hãng 12 tháng 1 đổi 1, miễn phí hoàn toàn công tháo lắp và dán máy tại chỗ, kiểm tra và vệ sinh máy sạch sẽ bên trong, khách được quan sát kỹ thuật viên thao tác trực tiếp lấy liền ngay trước mặt trong 30-45 phút.

3. KỊCH BẢN ĐIỀU HƯỚNG BÁO GIÁ (XIN SĐT HOẶC ĐỀ NGHỊ GỌI HOTLINE CHI NHÁNH):
   - Khi khách hỏi giá hoặc có nhu cầu thay pin, ép kính, dán máy, mua phụ kiện:
     Sau khi tư vấn tính năng và chính sách dịch vụ, hãy thông báo duyên dáng rằng chi nhánh đang có chương trình trợ giá ưu đãi riêng và khéo léo đề xuất 2 phương án:
     + PHƯƠNG ÁN 1 (XIN SĐT): "Dạ hiện tại hệ thống bên em đang có chương trình trợ giá ưu đãi đặc biệt cho dòng máy của mình tại ${selectedBranch.name} ạ. Anh/Chị cho em xin Tên + Số Điện Thoại (hoặc Zalo) để em nhắn bạn kỹ thuật viên tại quầy gọi lại tư vấn và báo mức giá ưu đãi nhất kèm giữ quà tặng cho mình nhé ạ! ✨"
     + PHƯƠNG ÁN 2 (GỌI HOTLINE CHI NHÁNH): "Hoặc Anh/Chị có thể gọi điện/nhắn Zalo trực tiếp đến Hotline của ${selectedBranch.name}: ${currentBranchHotline.display} để các bạn kỹ thuật viên kiểm tra máy và báo giá ưu đãi chính xác liền tay cho mình ạ! 📞"
   - Nếu khách gửi số điện thoại trong tin nhắn (10 chữ số): HÃY CẢM ƠN NỒNG NHIỆT, xác nhận đã tiếp nhận thông tin và cam kết bạn kỹ thuật viên tại ${selectedBranch.name} sẽ liên hệ lại trong 3-5 phút tới!

4. TÔN CHỈ PHỤC VỤ & PHONG CÁCH:
- Luôn xưng "Bé 8" hoặc "em", gọi khách là "Anh/Chị" (hoặc "bạn").
- Giọng điệu: Thân thiện, chu đáo, lịch thiệp, nhiều năng lượng tích cực, dùng emoji tự nhiên (✨, 💖, 📱, 🔋, 🛡️, 📞).
- Trình bày thông thoáng, gạch đầu dòng rõ ràng, KHÔNG lạm dụng dấu sao in đậm tràn lan.

5. DANH SÁCH 7 CHI NHÁNH PHỤ KIỆN 88:
${branchListStr}
- Chi nhánh hiện tại khách đang chọn: ${selectedBranch.name} (${selectedBranch.address}) - Hotline/Zalo: ${currentBranchHotline.display}.
- Giờ mở cửa: 07:30 - 22:00 tất cả các ngày trong tuần (kể cả Thứ 7, Chủ Nhật và ngày lễ).

6. CÁC DỊCH VỤ NỔI BẬT:
${sampleProducts}
- Miễn phí công dán cường lực & vệ sinh máy tại chỗ.
- Bảo hành 1 đổi 1 trong 12 tháng với củ sạc, cáp sạc, tai nghe lỗi do nhà sản xuất.
${realTimeProductContext}

7. BỘ TỪ ĐIỂN DỊCH TEENCODE & CHỈ DẪN TRẢ LỜI ĐÚNG TRỌNG TÂM CÂU HỎI (QUAN TRỌNG NHẤT):
- Khách hàng Việt Nam thường nhắn tin nhanh bằng teencode / từ viết tắt / phương ngữ miền Tây:
  + Dòng máy: "ip11 thường" / "ip 11" = iPhone 11 bản tiêu chuẩn, "11pm/12pm/13pm/14pm/15pm/16pm" = iPhone Pro Max, "xsm" = iPhone XS Max, "ss" = Samsung.
  + Viết tắt & phương ngữ: "k / ko / kh" = không, "dô / zô" = vào, "k dô pin" = cắm sạc không vào điện / không nhận sạc, "có sửa k vậy" = bên mình có nhận sửa chữa lỗi này không, "bn / bnhieu" = bao nhiêu, "cl" = cường lực, "knh" = kính.
- NGUYÊN TẮC BẮT BUỘC KHI TRẢ LỜI KHÁCH:
  1. TRẢ LỜI ĐÚNG VÀO TRỌNG TÂM CÂU HỎI CỦA KHÁCH:
     - Nếu khách hỏi lỗi kỹ thuật ("sạc k dô pin", "ép kính", "thay pin", "mất nguồn", "vỡ màn hình"):
       -> BẮT BUỘC KHẲNG ĐỊNH NGAY: "Dạ bên em CÓ NHẬN SỬA CHỮA / KIỂM TRA lỗi [tên lỗi & dòng máy của khách] ạ! 💖"
       -> Nêu ngắn gọn nguyên nhân thường gặp (bụi bẩn bám chân sạc, lỗi cụm cáp sạc, pin chai phồng hoặc IC sạc).
       -> Mời khách ghé ngay chi nhánh ${selectedBranch.name} (${selectedBranch.address}) để kỹ thuật viên KIỂM TRA & ĐO DÒNG SẠC MIỄN PHÍ lấy liền ngay trước mặt.
       -> Khéo léo xin Tên + SĐT hoặc mời gọi Hotline/Zalo: ${currentBranchHotline.display} để được báo giá ưu đãi chính xác trong 3-5 phút!
  2. TUYỆT ĐỐI KHÔNG CHÀO HỎI CHUNG CHUNG HOẶC HỎI LẠI CÂU KHÁCH VỪA HỎI (Không được hỏi kiểu "Anh/Chị cần kiểm tra ép kính, thay pin vậy ạ" khi khách vừa mới nói rõ là sạc không vào pin)!`;
  };

  // Gửi tin nhắn đến Gemini AI
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsgObj: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsgObj]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    // Kiểm tra xem khách có vừa gửi số điện thoại trực tiếp trong tin nhắn không
    const phoneMatch = text.match(/(0[3|5|7|8|9][0-9]{8})/);
    const updatedMessages = [...messages, userMsgObj];

    // Tự động lưu realtime phiên chat ngay từ tin nhắn đầu tiên (Dù có hay chưa có SĐT)
    submitOrUpdateCustomerLead({
      sessionId: chatSessionId,
      phone: phoneMatch ? phoneMatch[1] : undefined,
      customerName: phoneMatch ? 'Khách hàng Web Chat' : undefined,
      need: text,
      branchName: selectedBranch.name,
      branchId: selectedBranch.id,
      source: trackingSource || 'web_chatbot',
      chatMessages: updatedMessages
    });

    // Lấy API key xoay tua từ biến môi trường + fallback dự phòng
    const B64_FALLBACK_KEYS = 'QVEuQWI4Uk42SjYyeWlZbkRZT19BQzFkcUo1QW1jc1MzSGthU2J1QnNFYVZobG1IWW1BTFEsQVEuQWI4Uk42TEEza0VmRkZBNjhJZzN1TVFFSTRGZzQ0dWxnWldVd0NrbVlKNjBwQktpSHcsQVEuQWI4Uk42SzV2elRGSTFkWlRONUFUem1WTjhxWFA0a3ktbVMyVW93NnVLTGQxcnoyOGc=';
    const envKeys = import.meta.env.VITE_GEMINI_API_KEY || '';
    const decodedFallback = typeof atob !== 'undefined' ? atob(B64_FALLBACK_KEYS) : '';
    const combinedKeys = envKeys ? `${envKeys},${decodedFallback}` : decodedFallback;
    const allKeys = Array.from(new Set(combinedKeys.split(',').map((k: string) => k.trim()).filter(Boolean)));

    const chatHistory = messages.slice(-6).map(m => 
      `${m.sender === 'user' ? 'Khách hàng' : 'Bé 8'}: ${m.text}`
    ).join('\n\n');

    const normalized = normalizeCustomerQuery(text);
    const curHotline = getBranchHotline(selectedBranch);

    const prompt = `${buildSystemPrompt(text)}

LỊCH SỬ CHAT TRƯỚC ĐÓ:
${chatHistory}

TIN NHẮN MỚI TỪ KHÁCH HÀNG:
"${text}"
${normalized.normalizedText !== text.toLowerCase() ? `[BẢN DỊCH CHUẨN NGHĨA TEENCODE/TỪ VIẾT TẮT]: "${normalized.normalizedText}"` : ''}
${normalized.detectedDevice ? `[DÒNG MÁY KHÁCH SỬ DỤNG]: ${normalized.detectedDevice}` : ''}
${normalized.detectedCategory === 'CASE' ? `[CHỈ DẪN TRỌNG TÂM]: Khách hỏi về ỐP LƯNG / BAO DA cho máy ${normalized.detectedDevice || 'của khách'}. Khẳng định shop CÓ SẴN rất nhiều mẫu ốp đẹp (chống sốc, dẻo trong suốt, bảo vệ camera, thời trang), viền êm cầm chắc tay. KHÔNG tư vấn dán cường lực hay sửa chữa nếu khách không hỏi! Mời khách ghé thử trực tiếp hoặc nhắn Zalo ${curHotline.display} để shop chụp mẫu thật gửi mình chọn!` : ''}
${normalized.detectedCategory === 'SCREEN_PROTECTOR' ? `[CHỈ DẪN TRỌNG TÂM]: Khách hỏi về KÍNH CƯỜNG LỰC / DÁN MÀN HÌNH cho máy ${normalized.detectedDevice || 'của khách'}. Khẳng định CÓ SẴN KingKong/Nano 9D vát cạnh, dán PPF, dán bao đẹp, chống vân tay, miễn phí công dán!` : ''}
${normalized.detectedCategory === 'CHARGING' ? `[CHỈ DẪN TRỌNG TÂM]: Khách đang hỏi về lỗi sạc không vào pin / không nhận sạc. BẮT BUỘC KHẲNG ĐỊNH SHOP CÓ NHẬN SỬA CHỮA, nêu nguyên nhân (chân sạc, cáp sạc, pin, IC), mời ghé ${selectedBranch.name} kiểm tra đo dòng sạc MIỄN PHÍ lấy liền ngay!` : ''}
${normalized.detectedCategory === 'BATTERY' ? `[CHỈ DẪN TRỌNG TÂM]: Khách hỏi về pin / thay pin. Tư vấn pin Pisen/Deji bảo hành 12 tháng 1 đổi 1, miễn phí công thay lấy ngay 15 phút tại ${selectedBranch.name}!` : ''}
${normalized.detectedCategory === 'SCREEN' ? `[CHỈ DẪN TRỌNG TÂM]: Khách hỏi về ép kính / vỡ màn hình. Tư vấn ép kính hút chân không lấy ngay 30-45 phút tại ${selectedBranch.name}!` : ''}

Hãy đóng vai Bé 8 trả lời khách hàng thật thân thiện, tư vấn đúng trọng tâm vấn đề của khách, TUYỆT ĐỐI KHÔNG BÁO GIÁ TIỀN, và khéo léo xin Tên + SĐT hoặc hướng dẫn gọi Hotline chi nhánh:`;

    const MODEL_NAME = 'gemini-flash-lite-latest';
    let aiReplyText = '';

    const shuffledKeys = [...allKeys].sort(() => Math.random() - 0.5);

    for (const apiKey of shuffledKeys) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 600
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            aiReplyText = reply;
            break;
          }
        }
      } catch (err) {
        console.warn('Lỗi gọi Gemini Key:', err);
      }
    }

    // Fallback thông minh nếu API bận
    if (!aiReplyText) {
      if (phoneMatch) {
        aiReplyText = `Dạ em đã nhận được số điện thoại **${phoneMatch[1]}** của Anh/Chị rồi ạ! 💖\n\nChuyên viên của **${selectedBranch.name}** sẽ gọi điện thoại hoặc nhắn Zalo tư vấn chi tiết và áp dụng ưu đãi giảm giá 10% cho mình ngay trong ít phút nhé ạ! Anh/Chị để ý điện thoại giúp Bé 8 nha! ✨`;
      } else {
        const lowerQ = text.toLowerCase();
        if (lowerQ.includes('ốp') || lowerQ.includes('bao da') || lowerQ.includes('case')) {
          aiReplyText = `Dạ chi nhánh **${selectedBranch.name}** CÓ SẴN rất nhiều mẫu ốp lưng thời trang, ốp dẻo trong suốt và ốp chống sốc bảo vệ camera cho máy mình luôn ạ! 🥰\n\nViền êm, cầm chắc tay và tháo lắp dễ dàng không lo trầy máy. Bé 8 mời Anh/Chị ghé shop (${selectedBranch.address}) để thử trực tiếp lên máy, hoặc nhắn Zalo shop: **${curHotline.display}** để các bạn chụp mẫu thật gửi mình chọn nhé! ✨`;
        } else if (lowerQ.includes('cường lực') || lowerQ.includes('cl') || lowerQ.includes('dán') || lowerQ.includes('ppf') || lowerQ.includes('nano')) {
          aiReplyText = `Dạ chi nhánh **${selectedBranch.name}** CÓ SẴN đầy đủ kính cường lực KingKong / Nano 9D vát cạnh và dán PPF chống trầy cho dòng máy mình ạ! 💖\n\nKính trong vắt, cảm ứng mượt mà và chống bám vân tay tối đa. Ghé shop được kỹ thuật viên dán bao đẹp, ưng ý mới thanh toán. Mời Anh/Chị ghé shop (${selectedBranch.address}) hoặc gọi Hotline/Zalo: **${curHotline.display}** shop giữ phần cho mình nhé! ✨`;
        } else if (lowerQ.includes('sạc') || lowerQ.includes('dô pin') || lowerQ.includes('vô pin') || lowerQ.includes('chân sạc') || lowerQ.includes('k vao') || lowerQ.includes('khong vao')) {
          aiReplyText = `Dạ bên em CÓ NHẬN SỬA CHỮA và kiểm tra lỗi sạc không vào pin cho dòng máy của mình ạ! 💖\n\nTình trạng này thường do chân sạc bám bụi bẩn, lỏng cáp sạc, pin bị chai kiệt hoặc lỗi IC sạc. Bé 8 mời Anh/Chị mang máy ghé trực tiếp chi nhánh **${selectedBranch.name}** (${selectedBranch.address}) để kỹ thuật viên kiểm tra và đo dòng sạc MIỄN PHÍ lấy liền ngay trước mặt cho mình nhé ạ!\n\nAnh/Chị cho em xin **Tên + Số Điện Thoại Zalo** hoặc gọi ngay Hotline/Zalo shop: **${curHotline.display}** để được các bạn hỗ trợ liền tay nha! ✨`;
        } else if (lowerQ.includes('pin') || lowerQ.includes('thay pin')) {
          aiReplyText = `Dạ chi nhánh **${selectedBranch.name}** CÓ SẴN PIN CHÍNH HÃNG Pisen / Deji dung lượng chuẩn và siêu dung lượng cho máy mình ạ! 🔋\n\nBên em bảo hành chính hãng 12 tháng 1 đổi 1 và MIỄN PHÍ hoàn toàn công thay lấy ngay trong 15-20 phút. Anh/Chị cho em xin **Tên + SĐT** hoặc gọi Hotline/Zalo: **${curHotline.display}** để shop giữ pin và giữ quà tặng cho mình nhé ạ! ✨`;
        } else if (lowerQ.includes('kính') || lowerQ.includes('ép kính') || lowerQ.includes('bể kính')) {
          aiReplyText = `Dạ bên em CÓ NHẬN ÉP KÍNH màn hình công nghệ hút chân không chuẩn nhà máy, lấy liền trong 30-45 phút ạ! 📱\n\nMời Anh/Chị ghé chi nhánh **${selectedBranch.name}** (${selectedBranch.address}) để kỹ thuật viên kiểm tra màn hình miễn phí cho mình, hoặc gọi Hotline/Zalo: **${curHotline.display}** để được phục vụ liền tay nhé ạ! ✨`;
        } else if (lowerQ.includes('địa chỉ') || lowerQ.includes('ở đâu') || lowerQ.includes('chỗ nào') || lowerQ.includes('đoạn nào') || lowerQ.includes('chỉ đường') || lowerQ.includes('bản đồ') || lowerQ.includes('map')) {
          aiReplyText = `Dạ chi nhánh **${selectedBranch.name}** tọa lạc tại: **${selectedBranch.address}** ạ! 🏠📍\n\n${(selectedBranch as any).mapUrl ? `Anh/Chị có thể bấm xem chỉ đường Google Maps tại đây: ${(selectedBranch as any).mapUrl}\n\n` : ''}Shop mở cửa phục vụ từ 07:30 đến 22:00 tất cả các ngày trong tuần. Nếu đến gần chưa thấy shop, Anh/Chị gọi ngay Hotline/Zalo: **${curHotline.display}** để nhân viên quầy ra đón nha! ✨`;
        } else {
          aiReplyText = `Dạ hiện tại chi nhánh **${selectedBranch.name}** đang có sẵn rất nhiều sản phẩm và dịch vụ kỹ thuật cho dòng máy của mình ạ!\n\nVì hệ thống đang cân đối mức giá trợ giá tốt nhất, Anh/Chị cho em xin **Tên + Số Điện Thoại Zalo** để kỹ thuật viên gọi lại tư vấn và báo giá ưu đãi chính xác nhất trong 3-5 phút, hoặc mình có thể gọi trực tiếp Hotline/Zalo chi nhánh: **${curHotline.display}** để được phục vụ liền tay nhé ạ! ✨`;
        }
      }
    }

    const aiMsgObj: ChatMessage = {
      id: `be8-${Date.now()}`,
      sender: 'be8',
      text: aiReplyText,
      time: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })
    };

    const finalMessages = [...updatedMessages, aiMsgObj];
    setMessages(finalMessages);
    setIsLoading(false);

    // Đồng bộ tiếp câu trả lời của Bé 8 vào CRM Cloud để nhân viên thấy trọn vẹn cuộc trò chuyện
    submitOrUpdateCustomerLead({
      sessionId: chatSessionId,
      branchName: selectedBranch.name,
      branchId: selectedBranch.id,
      source: trackingSource || 'web_chatbot',
      chatMessages: finalMessages
    });
  };

  // Nộp form nhận E-Voucher và Số Điện Thoại
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = customerPhone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      alert('Vui lòng nhập số điện thoại hợp lệ (10 chữ số) để nhận mã ưu đãi ạ!');
      return;
    }

    setIsSubmittingLead(true);
    const voucher = generateVoucherCode(cleanPhone);

    const res = await submitOrUpdateCustomerLead({
      sessionId: chatSessionId,
      customerName: customerName.trim() || 'Khách hàng nhận Voucher',
      phone: cleanPhone,
      need: customerNeed.trim() || 'Nhận E-Voucher 10% & Tư vấn phụ kiện',
      branchName: selectedBranch.name,
      branchId: selectedBranch.id,
      voucherCode: voucher,
      conversationSummary: `Khách đăng ký qua Form E-Voucher. Nhu cầu: "${customerNeed || 'Chưa ghi chú'}"`,
      source: trackingSource ? `${trackingSource}_voucher` : 'web_voucher_modal',
      chatMessages: messages
    });

    setIsSubmittingLead(false);

    if (res.success) {
      setClaimedVoucher(voucher);
      setShowLeadModal(false);

      // Thêm tin nhắn xác nhận của Bé 8 vào khung chat
      const confirmMsg: ChatMessage = {
        id: `voucher-${Date.now()}`,
        sender: 'be8',
        text: `🎉 **CHÚC MỪNG ${customerName.toUpperCase() || 'ANH/CHỊ'} ĐÃ KÍCH HOẠT THÀNH CÔNG E-VOUCHER!**

🎟️ Mã giảm giá của mình là: **${voucher}** (Giảm ngay 10% trên tổng hóa đơn)  
📍 Áp dụng tại: **${selectedBranch.name}**  
📱 Số điện thoại đăng ký: **${cleanPhone}**

Chuyên viên tại cửa hàng sẽ liên hệ xác nhận và chuẩn bị sẵn quà tặng cho Anh/Chị trong vòng **3 - 5 phút** tới ạ! Anh/Chị chỉ cần đọc số điện thoại này khi ghé shop là được giảm giá ngay nha! 💖`,
        time: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }),
        voucherCode: voucher
      };
      setMessages(prev => [...prev, confirmMsg]);
    } else {
      alert('Có lỗi xảy ra khi gửi thông tin, xin quý khách thử lại hoặc liên hệ Hotline!');
    }
  };

  // Sao chép link chia sẻ
  const handleCopyShareLink = () => {
    const url = window.location.origin + window.location.pathname + '?tab=tu-van';
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* 1. HEADER CHÍNH */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 shadow-2xl">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
          {/* Thông tin Bot & Avatar */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src="/be8-avatar.jpg"
                alt="Bé 8 AI CSKH"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover ring-2 ring-rose-500/50 shadow-lg shadow-rose-500/20"
                onError={(e) => {
                  // Fallback nếu ảnh không tải được
                  (e.target as HTMLImageElement).src = '/logo-pk88.jpg';
                }}
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-lg font-black text-white tracking-tight whitespace-nowrap">
                  Bé 8 AI CSKH
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 whitespace-nowrap">
                  PK88
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-emerald-400 flex items-center gap-1 font-medium whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="hidden sm:inline">Trực tuyến 24/7 • Tư vấn & Giữ mã giảm 10%</span>
                <span className="sm:hidden">Trực tuyến 24/7</span>
              </p>
            </div>
          </div>

          {/* Nút hành động đầu trang */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowLinkGenModal(true)}
              title="Tạo Link & Mã QR Đa Kênh (Facebook, TikTok, Zalo, Bàn Shop)"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 text-xs font-bold text-amber-300 border border-amber-500/40 transition-all cursor-pointer shadow-md shadow-amber-500/10"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Tạo Link & QR</span>
              <span className="sm:hidden">Tạo QR</span>
            </button>

            <button
              type="button"
              onClick={handleCopyShareLink}
              title="Sao chép link chia sẻ Chatbot"
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'Đã chép link' : 'Copy link'}</span>
            </button>

            <a
              href={`tel:${currentBranchHotline.tel}`}
              title={`Hotline: ${currentBranchHotline.display} (${selectedBranch.name})`}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-rose-500/10 whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5 animate-bounce shrink-0 text-rose-400" />
              <span className="hidden sm:inline">Hotline:</span>
              <span className="hidden sm:inline">{currentBranchHotline.display}</span>
              <span className="sm:hidden">{currentBranchHotline.display}</span>
            </a>

            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0"
                title="Quay lại Cổng Nội Bộ"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Thanh chọn chi nhánh gần nhất */}
        <div className="bg-slate-950/80 border-t border-slate-800/80 px-3 sm:px-4 py-1.5 sm:py-2">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 min-w-0 flex-1">
              <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline text-slate-400 font-medium whitespace-nowrap shrink-0">Chi nhánh:</span>
              <select
                value={selectedBranch.id}
                onChange={(e) => {
                  const b = activeBranches.find(item => item.id === e.target.value);
                  if (b) setSelectedBranch(b);
                }}
                className="bg-slate-900 border border-slate-700 text-amber-300 font-bold rounded-lg px-2 py-1 text-xs outline-none focus:border-amber-400 w-full sm:w-auto sm:max-w-xs cursor-pointer truncate"
              >
                {activeBranches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowLeadModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-[11px] sm:text-xs shadow-md shadow-rose-500/20 hover:scale-105 transition-all cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Gift className="w-3 h-3 text-slate-950 shrink-0" />
              <span>Nhận Voucher 10%</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. KHUNG TRÒ CHUYỆN (CHAT CONTAINER) */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col justify-between overflow-hidden">
        {/* Vùng tin nhắn cuộn */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Thông báo chi nhánh đang trực */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center max-w-md mx-auto text-xs text-slate-400">
            <p className="flex items-center justify-center gap-1 text-amber-400 font-bold mb-0.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Đang kết nối với: {selectedBranch.name}</span>
            </p>
            <p className="text-[11px] text-slate-400">
              {selectedBranch.address}
            </p>
            <div className="flex items-center justify-center gap-3 text-[11px] mt-1 pt-1 border-t border-slate-800/60">
              <span>Hotline: <a href={`tel:${currentBranchHotline.tel}`} className="text-amber-400 font-bold hover:underline">{currentBranchHotline.display}</a></span>
              <span className="text-slate-600">•</span>
              <span>Zalo: <a href={currentBranchHotline.zaloLink} target="_blank" rel="noreferrer" className="text-cyan-400 font-bold hover:underline">{currentBranchHotline.zalo}</a></span>
            </div>
          </div>

          {/* Danh sách tin nhắn */}
          {messages.map((msg) => {
            const isBe8 = msg.sender === 'be8';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${isBe8 ? 'justify-start' : 'justify-end'}`}
              >
                {isBe8 && (
                  <img
                    src="/be8-avatar.jpg"
                    alt="Bé 8"
                    className="w-9 h-9 rounded-xl object-cover ring-1 ring-rose-500/40 flex-shrink-0 mt-0.5 shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo-pk88.jpg';
                    }}
                  />
                )}

                <div className={`max-w-[85%] sm:max-w-md rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-lg ${
                  isBe8
                    ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-sm'
                    : 'bg-gradient-to-r from-rose-600 to-amber-600 text-white rounded-tr-sm font-medium'
                }`}>
                  {msg.imageUrl && (
                    <div className="my-2">
                      <img 
                        src={msg.imageUrl} 
                        alt="Ảnh đính kèm" 
                        className="max-w-[200px] rounded-lg border border-white/20 shadow-md"
                        loading="lazy" 
                      />
                    </div>
                  )}
                  <div className="chat-markdown leading-relaxed text-xs sm:text-sm">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                        strong: ({ node, ...props }) => (
                          <strong
                            className={`font-bold ${isBe8 ? 'text-amber-300' : 'text-white'}`}
                            {...props}
                          />
                        ),
                        ul: ({ node, ...props }) => <ul className="space-y-1 my-1.5 pl-3 list-disc list-outside" {...props} />,
                        ol: ({ node, ...props }) => <ol className="space-y-1 my-1.5 pl-3 list-decimal list-outside" {...props} />,
                        li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                        a: ({ node, ...props }) => <a className="text-amber-300 underline font-semibold" target="_blank" rel="noreferrer" {...props} />
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>

                  {/* Nút hành động đính kèm nếu có voucher */}
                  {msg.voucherCode && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="font-mono font-black text-amber-400 text-sm tracking-wider">
                        {msg.voucherCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(msg.voucherCode || '');
                          alert('Đã sao chép mã Voucher: ' + msg.voucherCode);
                        }}
                        className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded text-[11px] font-bold border border-amber-500/40 hover:bg-amber-500/30 cursor-pointer"
                      >
                        Sao Chép Mã
                      </button>
                    </div>
                  )}

                  <div className={`text-[10px] mt-1.5 flex items-center justify-end ${
                    isBe8 ? 'text-slate-400' : 'text-rose-100/70'
                  }`}>
                    <span>{msg.time}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Hiệu ứng đang gõ tin nhắn */}
          {isLoading && (
            <div className="flex gap-3 items-start justify-start animate-fade-in">
              <img
                src="/be8-avatar.jpg"
                alt="Bé 8"
                className="w-9 h-9 rounded-xl object-cover ring-1 ring-rose-500/40 flex-shrink-0 mt-0.5 animate-pulse"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo-pk88.jpg';
                }}
              />
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm p-3.5 flex items-center gap-2">
                <span className="text-xs text-rose-400 font-bold">Bé 8 đang kiểm tra kho & gõ tin nhắn...</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 3. GỢI Ý CÂU HỎI NHANH (QUICK ACTIONS CHIPS) */}
        <div className="py-2 overflow-x-auto no-scrollbar flex items-center gap-2">
          {QUICK_ACTIONS.map((action, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage(action.text)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer shadow-sm hover:border-slate-700"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{action.text}</span>
            </button>
          ))}
        </div>

        {/* 4. THANH NHẬP LIỆU CHAT (INPUT BAR) */}
        <div className="pt-2 border-t border-slate-800/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 focus-within:border-rose-500/60 p-2 rounded-2xl shadow-xl transition-all"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Nhập tên phụ kiện, dòng máy (VD: Ốp lưng iPhone 15, thay pin 11...)"
              className="flex-1 bg-transparent border-none text-xs sm:text-sm text-slate-100 placeholder-slate-400 px-2 py-1 outline-none"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                inputMessage.trim() && !isLoading
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-bold shadow-lg shadow-rose-500/25 hover:scale-105'
                  : 'bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Banner nhắc nhở ưu đãi dưới cùng */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400 pt-2 px-1">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Bảo hành 1 đổi 1 • Dán máy miễn phí</span>
            </span>

            <button
              type="button"
              onClick={() => setShowLeadModal(true)}
              className="text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Gift className="w-3 h-3 shrink-0" />
              <span>Nhận mã giảm giá 10% ngay</span>
            </button>
          </div>
        </div>
      </main>

      {/* 5. POPUP NHẬN E-VOUCHER & ĐỂ LẠI SỐ ĐIỆN THOẠI (LEAD CAPTURE MODAL) */}
      {showLeadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden animate-scale-up">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-rose-500/20 to-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Nút đóng */}
            <button
              type="button"
              onClick={() => setShowLeadModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
            >
              ✕
            </button>

            {/* Tiêu đề modal */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 p-0.5 shadow-lg shadow-rose-500/30">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-amber-400 font-black">
                  <Gift className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-black text-white">NHẬN E-VOUCHER GIẢM 10%</h3>
                <p className="text-xs text-amber-400 font-medium">Áp dụng cho mọi phụ kiện & dịch vụ tại shop</p>
              </div>
            </div>

            <form onSubmit={handleLeadSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Họ và tên của bạn:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Anh Hoàng, Chị Mai..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Số điện thoại nhận mã (Zalo): <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="09xx xxx xxx"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-mono tracking-wider font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  * Chi nhánh sẽ nhắn tin mã voucher và giữ hàng có sẵn cho bạn.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Chi nhánh bạn muốn ghé:
                </label>
                <select
                  value={selectedBranch.id}
                  onChange={(e) => {
                    const b = activeBranches.find(item => item.id === e.target.value);
                    if (b) setSelectedBranch(b);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-bold outline-none cursor-pointer"
                >
                  {activeBranches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} - {b.address.split(',')[0]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Sản phẩm bạn đang quan tâm (Không bắt buộc):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ốp lưng 15 Pro Max, thay pin 11..."
                  value={customerNeed}
                  onChange={(e) => setCustomerNeed(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingLead}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmittingLead ? (
                  <span>Đang kích hoạt voucher...</span>
                ) : (
                  <>
                    <Gift className="w-4 h-4 text-slate-950" />
                    <span>KÍCH HOẠT MÃ GIẢM 10% NGAY</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL TẠO LINK & MÃ QR ĐA KÊNH */}
      <LeadLinkGeneratorModal
        isOpen={showLinkGenModal}
        onClose={() => setShowLinkGenModal(false)}
        branches={branches}
        defaultBranchCode={selectedBranch.code}
      />
    </div>
  );
};
