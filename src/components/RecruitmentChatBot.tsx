import React, { useState, useRef, useEffect } from 'react';
import { Branch } from '../types';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  ChevronDown, 
  ExternalLink, 
  Phone, 
  CheckCircle2, 
  RefreshCw,
  HelpCircle,
  Clock,
  DollarSign,
  GraduationCap,
  MapPin,
  ShieldCheck
} from 'lucide-react';

interface RecruitmentChatBotProps {
  branches: Branch[];
  onScrollToForm?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'be8' | 'user';
  text: string;
  time: string;
  suggestedAction?: 'scroll_to_form' | 'call_hr';
}

const QUICK_QUESTIONS = [
  'Shop có tuyển ca part-time cho sinh viên không?',
  'Chưa biết ép kính có được công ty đào tạo không?',
  'Lương thưởng và hoa hồng được tính thế nào?',
  'Công ty có giữ bằng gốc hay bắt cọc tiền không?',
  'Bao lâu sau khi nộp đơn thì được gọi phỏng vấn?',
  'Cho mình xem địa chỉ các chi nhánh gần nhất'
];

export const RecruitmentChatBot: React.FC<RecruitmentChatBotProps> = ({
  branches,
  onScrollToForm
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState<boolean>(true);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'be8',
      text: 'Dạ chào bạn! Bé 8 là Trợ Lý Tuyển Dụng AI của Phụ Kiện 88 🤖✨\n\nBạn đang quan tâm đến vị trí nào (Bán hàng, Kỹ thuật sửa chữa, Cửa hàng trưởng, Marketing...) hay có thắc mắc gì về ca làm, lương thưởng thì cứ nhắn cho Bé 8 giải đáp ngay nhé!',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setShowSpeechBubble(false);
    }
  }, [messages, isOpen]);

  // Hệ thống Prompt tri thức tuyển dụng của Phụ Kiện 88
  const buildSystemPrompt = () => {
    const branchListText = branches
      .filter(b => b.isActive !== false)
      .map(b => `- ${b.name}: ${b.address}`)
      .join('\n');

    return `Bạn là "Bé 8", Trợ lý Tuyển Dụng AI thông minh, cực kỳ dễ thương, hoạt bát và tận tâm của Hệ Thống Bán Lẻ & Sửa Chữa PHỤ KIỆN 88 (chuỗi 8 cửa hàng công nghệ hàng đầu Miền Tây).
Model AI của bạn là: gemini-flash-lite-latest.

THÔNG TIN CHUẨN XÁC VỀ TUYỂN DỤNG CỦA PHỤ KIỆN 88:
1. MẠNG LƯỚI CHI NHÁNH:
${branchListText}

2. CÁC VỊ TRÍ ĐANG TUYỂN DỤNG (THÁNG 10/2026):
- Nhân viên Tư vấn Bán hàng & Phụ kiện: Thu nhập 7 - 12 triệu/tháng (Lương cơ bản + Hoa hồng sản phẩm + Thưởng doanh số). Xoay ca linh hoạt (Ca sáng: 07h30 - 15h30, Ca chiều: 14h00 - 22h00). CÓ HỖ TRỢ SINH VIÊN làm bán thời gian (part-time) xếp ca theo lịch học.
- Kỹ thuật viên Ép kính / Sửa chữa phần cứng Smartphone: Thu nhập 9 - 18 triệu/tháng. Được cấp máy móc hút chân không, kính hiển vi xịn. ĐẶC BIỆT: Ứng viên chưa biết ép kính hoặc tay nghề yếu VẪN ĐƯỢC NHẬN ĐÀO TẠO, có Kỹ thuật trưởng (anh Trung Hiếu) kèm cặp 1-1 tại xưởng.
- Cửa hàng trưởng / Quản lý ca: Thu nhập 12 - 22 triệu/tháng + Thưởng % KPI lợi nhuận cửa hàng. Yêu cầu có kinh nghiệm quản lý tối thiểu 1 năm.
- Nhân viên Sáng tạo nội dung TikTok / Media: Thu nhập 8 - 15 triệu/tháng + Thưởng view clip. Có sẵn studio mini, đèn livestream và điện thoại xịn tại shop để quay.

3. QUYỀN LỢI & CAM KẾT VÀNG TỪ PHỤ KIỆN 88:
- TUYỆT ĐỐI KHÔNG GIỮ BẰNG GỐC CỦA NHÂN VIÊN.
- TUYỆT ĐỐI KHÔNG BẮT ĐÓNG CỌC TIỀN HAY BẤT KỲ KHOẢN PHÍ NÀO.
- Được đào tạo bài bản 60 ngày trên hệ thống LMS chuyên nghiệp của chuỗi.
- Giảm giá 30% khi mua sắm điện thoại, phụ kiện, đồ chơi công nghệ tại chuỗi PK88.
- Chế độ thưởng lễ, Tết, du lịch hàng năm, sinh nhật chu đáo.

4. QUY TRÌNH PHỎNG VẤN & XÉT DUYỆT:
- Sau khi ứng viên điền form nộp hồ sơ online trên web, Bộ phận Nhân sự (chuyên viên Phan Hoàng Khánh) sẽ gọi điện hoặc nhắn tin Zalo trong vòng 24 giờ làm việc để hẹn phỏng vấn gần nhà nhất.
- Hotline HR trực tiếp (Phan Hoàng Khánh): 0394.336.726.

QUY TẮC TRẢ LỜI CỦA BÉ 8:
- Luôn xưng "Bé 8" và gọi người hỏi là "bạn" hoặc "anh/chị".
- Trả lời ngắn gọn, vui vẻ, súc tích, định dạng gạch đầu dòng rõ ràng, dễ đọc trên màn hình điện thoại.
- Sau khi giải đáp thắc mắc, hãy nhiệt tình gợi ý ứng viên nộp hồ sơ nhanh qua form ở trên trang web để HR giữ chỗ phỏng vấn!`;
  };

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

    // Lấy API key xoay tua từ biến môi trường
    const envKeys = import.meta.env.VITE_GEMINI_API_KEY || '';
    const allKeys = envKeys
      .split(',')
      .map((k: string) => k.trim())
      .filter(Boolean);

    // Chuẩn bị context chat
    const chatHistory = messages.slice(-6).map(m => 
      `${m.sender === 'user' ? 'Ứng viên' : 'Bé 8'}: ${m.text}`
    ).join('\n\n');

    const prompt = `${buildSystemPrompt()}

LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ:
${chatHistory}

CÂU HỎI MỚI NHẤT CỦA ỨNG VIÊN:
"${text}"

Hãy trả lời ứng viên với phong cách thân thiện, nhiệt tình của Bé 8:`;

    const MODEL_NAME = 'gemini-flash-lite-latest';
    let aiReplyText = '';

    // Xoay vòng API Keys ngẫu nhiên (Round-Robin)
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

    // Fallback thông minh nếu các key đều bận
    if (!aiReplyText) {
      const lower = text.toLowerCase();
      if (lower.includes('part-time') || lower.includes('sinh viên') || lower.includes('ca')) {
        aiReplyText = 'Dạ được bạn nha! Chuỗi Phụ Kiện 88 có các ca linh hoạt (Ca sáng: 7h30 - 15h30, Ca chiều: 14h - 22h) và hỗ trợ đổi ca cho các bạn sinh viên theo lịch học. Bạn cứ điền form ứng tuyển để HR sắp xếp nha!';
      } else if (lower.includes('kinh nghiệm') || lower.includes('ép kính') || lower.includes('học việc')) {
        aiReplyText = 'Dạ hoàn toàn yên tâm nè! Đối với vị trí Bán hàng thì không cần kinh nghiệm. Còn Kỹ thuật ép kính thì nếu bạn chưa biết hoặc tay nghề còn yếu, Kỹ thuật trưởng sẽ cầm tay chỉ việc 1-1 tại xưởng và có lộ trình học LMS 60 ngày nha!';
      } else if (lower.includes('lương') || lower.includes('thu nhập')) {
        aiReplyText = 'Dạ thu nhập tại PK88 rất cạnh tranh:\n• Bán hàng: 7 - 12 triệu (Lương cứng + Hoa hồng + Thưởng).\n• Kỹ thuật sửa chữa: 9 - 18 triệu.\n• Quản lý: 12 - 22 triệu.\nLương được nhận đúng ngày và có xét tăng lương theo năng lực bạn nhé!';
      } else if (lower.includes('bằng') || lower.includes('cọc')) {
        aiReplyText = 'Dạ PHỤ KIỆN 88 CAM KẾT 100%: Tuyệt đối KHÔNG giữ bằng gốc và KHÔNG thu bất kỳ khoản tiền cọc nào của ứng viên bạn nhé!';
      } else {
        aiReplyText = 'Dạ Bé 8 đã ghi nhận câu hỏi của bạn! Các thông tin chi tiết về quyền lợi và chế độ bạn có thể xem thêm ở các thẻ công việc bên cạnh, hoặc điền form nhanh để anh Khánh HR liên hệ trực tiếp tư vấn chi tiết cho bạn nha!';
      }
    }

    const aiMsgObj: ChatMessage = {
      id: `be8-${Date.now()}`,
      sender: 'be8',
      text: aiReplyText,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      suggestedAction: 'scroll_to_form'
    };

    setMessages(prev => [...prev, aiMsgObj]);
    setIsLoading(false);
  };

  return (
    <>
      {/* Speech Bubble Gợi Ý Khi Chưa Mở */}
      {!isOpen && showSpeechBubble && (
        <div className="fixed bottom-24 right-5 z-40 max-w-xs animate-bounce hidden sm:block">
          <div className="relative bg-slate-900 border border-amber-500/40 text-amber-200 text-xs px-3.5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2">
            <span className="font-medium">Hỏi Bé 8 về ca làm, lương & học việc nhé! 👋</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowSpeechBubble(false);
              }}
              className="text-slate-400 hover:text-white ml-1 text-sm"
            >
              ×
            </button>
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-slate-900 border-r border-b border-amber-500/40 rotate-45"></div>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 group flex items-center gap-3 p-1.5 pr-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-extrabold shadow-2xl shadow-amber-500/40 hover:scale-105 transition-all duration-300"
          title="Chat cùng Trợ lý Tuyển Dụng Bé 8"
        >
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-slate-950 shadow-md">
            <img 
              src="/be8-avatar.jpg" 
              alt="Bé 8 Tuyển Dụng" 
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-black tracking-wide flex items-center gap-1">
              <span>HỎI BÉ 8 AI</span>
              <Sparkles className="w-3 h-3" />
            </div>
            <div className="text-[10px] font-semibold text-slate-900/80">Tư vấn tuyển dụng 24/7</div>
          </div>
        </button>
      )}

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[95vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-slate-900/95 backdrop-blur-xl border border-amber-500/30 rounded-3xl shadow-2xl shadow-black/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 p-3.5 text-slate-950 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-slate-950 shadow-md shrink-0">
                <img 
                  src="/be8-avatar.jpg" 
                  alt="Bé 8 Tuyển Dụng" 
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full animate-pulse"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-sm tracking-wide">Bé 8 - Trợ Lý Tuyển Dụng</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-950 text-amber-300 rounded-md">
                    AI 24/7
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-900 flex items-center gap-1">
                  <span>gemini-flash-lite-latest</span>
                  <span>•</span>
                  <span>Phụ Kiện 88</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-950/20 text-slate-950 transition"
                title="Thu nhỏ cửa sổ chat"
              >
                <X className="w-5 h-5 font-bold" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'be8' && (
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-amber-500/40 shrink-0 mt-0.5 shadow-sm">
                    <img 
                      src="/be8-avatar.jpg" 
                      alt="Bé 8" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className={`space-y-1.5 max-w-[82%]`}>
                  <div
                    className={`p-3 rounded-2xl whitespace-pre-line leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none ml-auto'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {msg.suggestedAction === 'scroll_to_form' && onScrollToForm && (
                    <button
                      onClick={() => {
                        onScrollToForm();
                        setIsOpen(false);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition shadow-sm"
                    >
                      <span>📝 Bấm vào đây để điền form ứng tuyển ngay</span>
                    </button>
                  )}

                  <div className={`text-[10px] text-slate-500 px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                <div className="w-6 h-6 rounded-full overflow-hidden border border-amber-500/40 shrink-0">
                  <img src="/be8-avatar.jpg" alt="Bé 8" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center gap-1 bg-slate-800/80 px-3 py-2 rounded-2xl border border-slate-700 text-[11px]">
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                  <span>Bé 8 đang suy nghĩ câu trả lời...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Chips */}
          <div className="px-3 py-2 bg-slate-950/80 border-t border-slate-800 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-amber-500/20 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 text-slate-300 text-[11px] transition shrink-0 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Nhập câu hỏi của bạn (ví dụ: ca làm, lương, địa chỉ)..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition disabled:opacity-40 disabled:hover:bg-amber-500 shadow-md shadow-amber-500/20 shrink-0"
              title="Gửi câu hỏi"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
