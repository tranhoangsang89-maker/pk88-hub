import React, { useState, useRef, useEffect } from 'react';
import { Branch } from '../types';
import { submitCustomerLead, generateVoucherCode } from '../lib/leadService';
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
  Share2
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
  voucherCode?: string;
  isLeadPrompt?: boolean;
}

const QUICK_ACTIONS = [
  { icon: 'Smartphone', text: 'Tìm ốp lưng & cường lực theo dòng máy' },
  { icon: 'Wrench', text: 'Báo giá thay pin & ép kính lấy liền' },
  { icon: 'Sparkles', text: 'Củ sạc nhanh & cáp sạc chính hãng' },
  { icon: 'MapPin', text: 'Xem địa chỉ 7 chi nhánh gần tôi nhất' },
  { icon: 'Gift', text: 'Nhận E-Voucher giảm giá 10% hôm nay' }
];

export const PublicCustomerChatView: React.FC<PublicCustomerChatViewProps> = ({
  branches,
  onBackToApp
}) => {
  const activeBranches = branches.filter(b => b.isActive !== false);

  // Chọn chi nhánh ưu tiên (mặc định Phú Khương hoặc Bến Tre)
  const [selectedBranch, setSelectedBranch] = useState<Branch>(() => {
    return activeBranches.find(b => b.code === 'PK88_PHUKHUONG') || activeBranches[0] || {
      id: 'default',
      code: 'PK88_PHUKHUONG',
      name: 'Phụ Kiện 88 - Phú Khương',
      address: '35 B2 Đoàn Hoàng Minh, Phường Phú Khương, TP. Bến Tre',
      lat: 10.2527,
      lng: 106.3707,
      isActive: true
    };
  });

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Form thu thập SĐT & Tên khách hàng (Lead Capture)
  const [showLeadModal, setShowLeadModal] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerNeed, setCustomerNeed] = useState<string>('');
  const [isSubmittingLead, setIsSubmittingLead] = useState<boolean>(false);
  const [claimedVoucher, setClaimedVoucher] = useState<string | null>(null);

  // Lịch sử tin nhắn
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'be8',
      text: `Dạ chào Anh/Chị! Em là **Bé 8** - Chuyên Viên Tư Vấn AI của Chuỗi Cửa Hàng **Phụ Kiện 88** 🤖💖

Anh/Chị đang tìm phụ kiện cho dòng máy nào (iPhone, Samsung, Xiaomi...) hay cần báo giá dịch vụ kỹ thuật (thay pin dung lượng cao, ép kính lấy liền, dán cường lực bảo hành)?

Cứ nhắn cho Bé 8, em tư vấn chi tiết và tặng mình **E-Voucher giảm giá 10%** ngay nhé! ✨`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Xây dựng kho tri thức cho System Prompt của Gemini AI
  const buildSystemPrompt = () => {
    const branchListStr = activeBranches
      .map(b => `- ${b.name}: ${b.address}`)
      .join('\n');

    // Lấy mẫu các sản phẩm tiêu biểu theo danh mục
    const sampleProducts = [
      'Cường lực KingKong / Anank / URR chống va đập, chống nhìn trộm (giá từ 60k - 180k)',
      'Lens Camera URR Sapphire bảo vệ mắt kính camera (giá 60k - 300k)',
      'Ốp lưng Chống sốc, Magsafe, viền xi, chống ố vàng cho mọi dòng iPhone từ iP7 đến 16 Pro Max (giá từ 45k - 250k)',
      'Củ sạc nhanh 20W, 35W, 65W GaN sạc siêu tốc chuẩn Power Delivery bảo hành 1 đổi 1 12 tháng',
      'Cáp sạc bọc dù siêu bền Type-C, Lightning, 3-in-1 chống gãy đứt',
      'Tai nghe Bluetooth TWS pin trâu 6-8 tiếng, bass ấm (giá từ 180k - 450k)',
      'Pin dung lượng cao cho iPhone chính hãng Pisen / Deji bảo hành 12 tháng (giá từ 250k - 650k tùy dòng máy)',
      'Ép kính màn hình cong, thay mặt kính lấy liền trong 30-45 phút'
    ].join('\n');

    return `BẠN LÀ "BÉ 8" - CHUYÊN VIÊN TƯ VẤN KHÁCH HÀNG AI DUYÊN DÁNG, NHIỆT TÌNH CỦA CHUỖI CỬA HÀNG PHỤ KIỆN 88 (HỆ THỐNG BÁN LẺ & SỬA CHỮA ĐIỆN THOẠI UY TÍN TẠI MIỀN TÂY & TP.HCM).

1. TÔN CHỈ PHỤC VỤ & PHONG CÁCH:
- Luôn xưng "Bé 8" hoặc "em", gọi khách là "Anh/Chị" (hoặc "bạn").
- Giọng điệu: Thân thiện, chu đáo, lịch thiệp, nhiều năng lượng tích cực, dùng emoji tự nhiên (✨, 💖, 📱, 🔋, 🛡️).
- Trả lời rõ ràng, định dạng gạch đầu dòng ngắn gọn, báo giá công khai minh bạch.
- KHÔNG BAO GIỜ bịa đặt giá trên trời, nếu khách hỏi món không có thì khéo léo nói shop có sẵn nhiều mẫu tương đương chất lượng cao.

2. DANH SÁCH 7 CHI NHÁNH PHỤ KIỆN 88:
${branchListStr}
- Chi nhánh hiện tại khách đang chọn: ${selectedBranch.name} (${selectedBranch.address}).
- Giờ mở cửa: 07:30 - 22:00 tất cả các ngày trong tuần (kể cả Thứ 7, Chủ Nhật và ngày lễ).

3. CÁC SẢN PHẨM & DỊCH VỤ NỔI BẬT:
${sampleProducts}
- Tổng kho có hơn 521 phụ kiện có sẵn tại quầy.
- Miễn phí công dán cường lực & vệ sinh máy tại chỗ.
- Bảo hành 1 đổi 1 trong 12 tháng với củ sạc, cáp sạc, tai nghe lỗi do nhà sản xuất.

4. NHIỆM VỤ CHỐT SALE & XIN SỐ ĐIỆN THOẠI KHÉO LÉO (LEAD CAPTURE):
- Khi khách hỏi giá, hỏi dòng máy, hoặc cần mua: Sau khi tư vấn sản phẩm phù hợp, hãy khuyên khách:
  "Dạ chi nhánh bên em đang có sẵn hàng, Anh/Chị cho em xin Tên và Số Điện Thoại Zalo để em gửi ảnh mẫu thực tế và kích hoạt mã giảm giá 10% giữ hàng cho mình trước nhé ạ!"
- Nếu khách gửi số điện thoại trong tin nhắn (dạng 10 số 03x, 05x, 07x, 08x, 09x):
  HÃY CẢM ƠN NỒNG NHIỆT, xác nhận đã tiếp nhận thông tin và hứa hẹn chi nhánh gần nhất sẽ gọi điện / nhắn Zalo hỗ trợ trong 3-5 phút tới!`;
  };

  // Gửi tin nhắn đến Gemini AI
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsgObj: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsgObj]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    // Kiểm tra xem khách có vừa gửi số điện thoại trực tiếp trong tin nhắn không
    const phoneMatch = text.match(/(0[3|5|7|8|9][0-9]{8})/);
    if (phoneMatch) {
      const extractedPhone = phoneMatch[1];
      // Tự động lưu lead vào hệ thống kèm toàn bộ lịch sử tin nhắn
      submitCustomerLead({
        customerName: 'Khách hàng Web Chat',
        phone: extractedPhone,
        need: text,
        branchName: selectedBranch.name,
        branchId: selectedBranch.id,
        conversationSummary: `Khách cung cấp SĐT trong chat: "${text}"`,
        source: 'web_chatbot_inline',
        chatMessages: [...messages, userMsgObj]
      });
    }

    // Lấy API key xoay tua từ biến môi trường
    const envKeys = import.meta.env.VITE_GEMINI_API_KEY || '';
    const allKeys = envKeys
      .split(',')
      .map((k: string) => k.trim())
      .filter(Boolean);

    const chatHistory = messages.slice(-6).map(m => 
      `${m.sender === 'user' ? 'Khách hàng' : 'Bé 8'}: ${m.text}`
    ).join('\n\n');

    const prompt = `${buildSystemPrompt()}

LỊCH SỬ CHAT TRƯỚC ĐÓ:
${chatHistory}

TIN NHẮN MỚI TỪ KHÁCH HÀNG:
"${text}"

Hãy đóng vai Bé 8 trả lời khách hàng thật thân thiện, tư vấn chính xác và khéo léo xin SĐT để chốt đơn/giữ hàng:`;

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

    // Fallback nếu API bận
    if (!aiReplyText) {
      if (phoneMatch) {
        aiReplyText = `Dạ em đã nhận được số điện thoại **${phoneMatch[1]}** của Anh/Chị rồi ạ! 💖\n\nChuyên viên của **${selectedBranch.name}** sẽ gọi điện thoại hoặc nhắn Zalo tư vấn chi tiết và áp dụng ưu đãi giảm giá 10% cho mình ngay trong ít phút nhé ạ! Anh/Chị để ý điện thoại giúp Bé 8 nha! ✨`;
      } else {
        aiReplyText = `Dạ hiện tại chi nhánh **${selectedBranch.name}** đang có sẵn rất nhiều mẫu phụ kiện chuẩn đẹp cho máy của mình ạ!\n\nAnh/Chị bấm vào nút **[🎁 Nhận E-Voucher & Báo Giá]** bên dưới hoặc để lại Số Điện Thoại để Bé 8 báo giá ưu đãi và giữ sẵn hàng cho mình ghé xem nhé ạ! ✨`;
      }
    }

    const aiMsgObj: ChatMessage = {
      id: `be8-${Date.now()}`,
      sender: 'be8',
      text: aiReplyText,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, aiMsgObj]);
    setIsLoading(false);
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

    const res = await submitCustomerLead({
      customerName: customerName.trim() || 'Khách hàng nhận Voucher',
      phone: cleanPhone,
      need: customerNeed.trim() || 'Nhận E-Voucher 10% & Tư vấn phụ kiện',
      branchName: selectedBranch.name,
      branchId: selectedBranch.id,
      voucherCode: voucher,
      conversationSummary: `Khách đăng ký qua Form E-Voucher. Nhu cầu: "${customerNeed || 'Chưa ghi chú'}"`,
      source: 'web_voucher_modal',
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
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
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
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 shadow-2xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Thông tin Bot & Avatar */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="/be8-avatar.jpg"
                alt="Bé 8 AI CSKH"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover ring-2 ring-rose-500/50 shadow-lg shadow-rose-500/20"
                onError={(e) => {
                  // Fallback nếu ảnh không tải được
                  (e.target as HTMLImageElement).src = '/logo-pk88.jpg';
                }}
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5 tracking-tight">
                  <span>Bé 8 AI CSKH</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                    Phụ Kiện 88
                  </span>
                </h1>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Trực tuyến 24/7 • Tư vấn & Giữ mã giảm 10%</span>
              </p>
            </div>
          </div>

          {/* Nút hành động đầu trang */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyShareLink}
              title="Sao chép link chia sẻ Chatbot"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-slate-700 transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Đã chép link' : 'Copy link'}</span>
            </button>

            <a
              href="tel:0394336726"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-rose-500/10"
            >
              <Phone className="w-3.5 h-3.5 animate-bounce" />
              <span className="hidden sm:inline">Hotline:</span>
              <span>0394.336.726</span>
            </a>

            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
                title="Quay lại Cổng Nội Bộ"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Thanh chọn chi nhánh gần nhất */}
        <div className="bg-slate-950/70 border-t border-slate-800/80 px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap">
              <Store className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="hidden sm:inline text-slate-400 font-medium">Chi nhánh phục vụ:</span>
              <select
                value={selectedBranch.id}
                onChange={(e) => {
                  const b = activeBranches.find(item => item.id === e.target.value);
                  if (b) setSelectedBranch(b);
                }}
                className="bg-slate-900 border border-slate-700 text-amber-300 font-bold rounded-lg px-2 py-1 text-xs outline-none focus:border-amber-400 max-w-[220px] sm:max-w-xs cursor-pointer"
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
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-[11px] shadow-md shadow-rose-500/20 hover:scale-105 transition-all cursor-pointer"
            >
              <Gift className="w-3 h-3 text-slate-950" />
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
            <p className="text-[11px] text-slate-400">{selectedBranch.address}</p>
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
                  <div className="whitespace-pre-line">
                    {msg.text}
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
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bảo hành chính hãng 1 đổi 1 • Dán máy miễn phí</span>
            </span>

            <button
              type="button"
              onClick={() => setShowLeadModal(true)}
              className="text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-1 cursor-pointer"
            >
              <Gift className="w-3 h-3" />
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
    </div>
  );
};
