import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Wrench, Search, ShieldAlert, Cpu, ImagePlus, Sparkles, ArrowDownCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AITechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AITechnicianModal({ isOpen, onClose }: AITechnicianModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDiagnose = async () => {
    if (!query.trim() && !imageBase64) return;

    setLoading(true);
    setResult('');

    // Smooth scroll to output panel on mobile upon triggering diagnosis
    setTimeout(() => {
      outputPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    const envKeys = import.meta.env.VITE_GEMINI_API_KEY || '';
    const allKeys = envKeys.split(',').map((k: string) => k.trim()).filter(Boolean);

    const currentDate = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const systemPromptText = `[THÔNG TIN HỆ THỐNG]: Hôm nay là ${currentDate}.
Bạn là một "Sư Phụ Kỹ Thuật Bậc 8/8" (Master Technician) tại chuỗi sửa chữa Phụ Kiện 88. 
Nhiệm vụ của bạn là chẩn đoán pan bệnh dựa trên ảnh (nếu có) và mô tả của thợ cấp dưới, sau đó đưa ra hướng giải quyết an toàn, thực tế.

BẮT BUỘC TRÌNH BÀY ĐÚNG THEO CẤU TRÚC MARKDOWN SAU ĐÂY (dùng H3 cho các mục chính):

### 🚨 CHẨN ĐOÁN NGUYÊN NHÂN
[Phân tích ngắn gọn về tình trạng máy, chỉ đích danh linh kiện có khả năng lỗi cao nhất]

### 🛠️ HƯỚNG XỬ LÝ (TỪ NHẸ ĐẾN NẶNG)
* **Bước 1:** [Cách xử lý]
* **Bước 2:** [Cách xử lý]
* **Bước 3:** [Cách xử lý]

### ⚠️ LƯU Ý KHI THÁO LẮP
> Luôn cách ly Pin đầu tiên!
* [Cảnh báo rủi ro đứt cáp, mẻ kính...]
* [Nhiệt độ khò/hàn khuyến nghị nếu có]

### 💵 TƯ VẤN KHÁCH HÀNG
[Gợi ý cách thợ giao tiếp báo giá hoặc thuyết phục khách thay linh kiện chính hãng]
`;

    const userPromptText = `Tình trạng máy / Câu hỏi của thợ:
${query}
`;

    if (allKeys.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setResult(`**[DEMO MODE]**\n\nChào thợ!\nWith pan bệnh "${query}", anh em chú ý test kỹ cáp màn hình trước. Nếu bị xanh/trắng màn thì 90% là do đứt đường 1.8V trên cổ cáp hoặc lỗi IC hiển thị. Dùng máy khò nhiệt độ 280°C, gió 40 nhé.\n\n*(Cần thêm VITE_GEMINI_API_KEY vào .env để gọi AI thật)*`);
      setLoading(false);
      return;
    }

    // Strictly use ONLY 'gemini-flash-lite-latest'
    const MODEL_NAME = 'gemini-flash-lite-latest';
    let lastError = '';
    let successText = '';

    const contentsParts: any[] = [{ text: userPromptText }];
    if (imageBase64 && imageMimeType) {
      contentsParts.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType
        }
      });
    }

    const requestPayload = {
      system_instruction: {
        parts: [{ text: systemPromptText }]
      },
      contents: [{ parts: contentsParts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024
      }
    };

    const shuffledKeys = [...allKeys].sort(() => Math.random() - 0.5);
    for (const apiKey of shuffledKeys) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            successText = text;
            break;
          }
        } else {
          const errJson = await response.json().catch(() => ({}));
          lastError = errJson?.error?.message || `HTTP status ${response.status}`;
        }
      } catch (err: any) {
        lastError = err.message || 'Network error';
      }
    }

    if (successText) {
      setResult(successText);
    } else {
      setResult(`⚠️ Không thể kết nối với AI Kỹ Thuật (${lastError}). Vui lòng kiểm tra VITE_GEMINI_API_KEY hoặc kết nối mạng.`);
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-700 flex flex-col max-h-[95vh] md:h-[85vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                AI Kỹ Thuật PK88 <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Master Tech</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">Trợ lý chẩn đoán pan bệnh & hướng dẫn sửa chữa</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body - Mobile scrollable, desktop flex side-by-side */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden min-h-0">
          
          {/* Left panel - Input */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/50 flex flex-col p-3 sm:p-4 shrink-0">
            <label className="text-xs sm:text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-400" /> Nhập tình trạng máy:
            </label>
            <textarea
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ví dụ: iPhone 13 Pro Max bị trắng màn hình sau khi rớt đất. Sườn không móp. Hỏi cách xử lý nhanh nhất..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 resize-none custom-scrollbar mb-2 min-h-[90px] sm:min-h-[120px] md:flex-1"
            />
            
            {imagePreviewUrl ? (
              <div className="relative mb-3 w-full h-28 sm:h-32 bg-slate-950 rounded-xl border border-slate-700 flex items-center justify-center overflow-hidden group shrink-0">
                <img src={imagePreviewUrl} alt="Upload preview" className="h-full object-contain" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => {
                      setImagePreviewUrl(null);
                      setImageBase64(null);
                      setImageMimeType(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-2 bg-rose-500 text-white rounded-full hover:bg-rose-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2 mb-3 border border-dashed border-slate-700 hover:border-emerald-500 rounded-xl text-slate-400 hover:text-emerald-400 transition-colors text-xs font-semibold shrink-0"
              >
                <ImagePlus className="w-4 h-4" /> Thêm ảnh đính kèm (Nội thất, Pan lỗi...)
              </button>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  setImagePreviewUrl(url);
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64String = (reader.result as string).split(',')[1];
                    setImageBase64(base64String);
                    setImageMimeType(file.type);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 mb-3 shrink-0">
              <h4 className="text-[11px] sm:text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Lưu ý an toàn:
              </h4>
              <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed">
                AI Kỹ Thuật PK88 chỉ mang tính chất tham khảo. Luôn cách ly Pin trước khi đo đạc hoặc tháo lắp linh kiện để tránh chạm chập.
              </p>
            </div>

            <button
              onClick={handleDiagnose}
              disabled={loading || (!query.trim() && !imageBase64)}
              className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />}
              {loading ? 'Đang phân tích pan bệnh...' : 'Chẩn Đoán Bệnh'}
            </button>
          </div>

          {/* Right panel - Output */}
          <div ref={outputPanelRef} className="w-full md:w-2/3 flex flex-col bg-slate-950 min-h-[350px] md:min-h-0 md:flex-1 shrink-0 md:shrink">
            <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/50 shrink-0">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> Kết quả & Hướng dẫn sửa chữa
              </span>
              {result && (
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  Model: gemini-flash-lite-latest
                </span>
              )}
            </div>
            
            <div className="flex-1 md:overflow-y-auto p-3 sm:p-4 custom-scrollbar">
              {result ? (
                <div className="text-xs sm:text-sm">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h3: ({node, ...props}) => <h3 className="text-xs sm:text-base font-extrabold text-emerald-400 mt-5 mb-2.5 pb-1.5 border-b border-emerald-500/20 uppercase tracking-wide flex items-center gap-1.5" {...props} />,
                      ul: ({node, ...props}) => <ul className="space-y-2 my-2.5 pl-1" {...props} />,
                      li: ({node, ...props}) => (
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 mt-1 flex-shrink-0"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" /></span>
                          <span className="text-slate-300 leading-relaxed" {...props} />
                        </li>
                      ),
                      strong: ({node, ...props}) => <strong className="font-bold text-white bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20" {...props} />,
                      p: ({node, ...props}) => <p className="mb-2.5 text-slate-300 leading-relaxed" {...props} />,
                      blockquote: ({node, ...props}) => (
                        <blockquote className="border-l-4 border-rose-500 bg-rose-500/10 p-3 rounded-r-xl text-rose-200/90 font-medium my-3 text-xs sm:text-sm flex items-start gap-2 shadow-inner" {...props} />
                      )
                    }}
                  >
                    {result}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-slate-500 space-y-3 opacity-60">
                  <Cpu className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600" />
                  <p className="text-xs sm:text-sm text-center px-4">Chờ Kỹ thuật viên mô tả tình trạng máy để chẩn đoán...</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

