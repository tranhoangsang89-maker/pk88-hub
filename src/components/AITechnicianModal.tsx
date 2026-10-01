import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Wrench, Search, ShieldAlert, Cpu, ImagePlus } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleDiagnose = async () => {
    if (!query.trim() && !imageBase64) return;

    setLoading(true);
    setResult('');
    
    const allKeys = (import.meta.env.VITE_GEMINI_API_KEY || '').split(',').map((k: string) => k.trim());
    const apiKey = allKeys[Math.floor(Math.random() * allKeys.length)] || 'AIzaSy_MOCK_KEY_FOR_BUILD';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;

    const currentDate = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const systemInstruction = `[THÔNG TIN HỆ THỐNG]: Hôm nay là ${currentDate}.
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
[Gợi ý cách thợ giao tiếp báo giá hoặc thuyết phục khách thay lịnh kiện chính hãng]

Tình trạng máy / Câu hỏi của thợ:
${query}
`;

    try {
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setResult(`**[DEMO MODE]**\n\nChào thợ!\nVới pan bệnh "${query}", anh em chú ý test kỹ cáp màn hình trước. Nếu bị xanh màn thì 90% là do đứt đường 1.8V trên cổ cáp. Dùng máy khò nhiệt độ 280, gió 40 nhé.\n\n*(Cần thêm VITE_GEMINI_API_KEY để gọi AI thật)*`);
        setLoading(false);
        return;
      }

      const parts: any[] = [{ text: systemInstruction }];
      if (imageBase64 && imageMimeType) {
        parts.push({
          inlineData: {
            data: imageBase64,
            mimeType: imageMimeType
          }
        });
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.2, // Low temp for accurate technical info
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Lỗi API: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không có phản hồi từ AI.';
      setResult(text);
    } catch (error: any) {
      setResult(`Đã xảy ra lỗi khi gọi AI: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-700 flex flex-col h-[90vh] sm:h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                AI Kỹ Thuật PK88 <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Master Tech</span>
              </h2>
              <p className="text-xs text-slate-400">Trợ lý chẩn đoán pan bệnh & hướng dẫn sửa chữa</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Left panel - Input */}
          <div className="w-full sm:w-1/3 border-b sm:border-b-0 sm:border-r border-slate-800 bg-slate-900/50 flex flex-col p-4">
            <label className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-400" /> Nhập tình trạng máy:
            </label>
            <textarea
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ví dụ: iPhone 13 Pro Max bị trắng màn hình sau khi rớt đất. Sườn không móp. Hỏi cách xử lý nhanh nhất..."
              className="flex-1 w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 resize-none custom-scrollbar mb-2 min-h-[120px]"
            />
            
            {imagePreviewUrl ? (
              <div className="relative mb-4 w-full h-32 bg-slate-950 rounded-xl border border-slate-700 flex items-center justify-center overflow-hidden group">
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
                className="w-full flex items-center justify-center gap-2 py-2 mb-4 border border-dashed border-slate-700 hover:border-emerald-500 rounded-xl text-slate-400 hover:text-emerald-400 transition-colors text-xs font-semibold"
              >
                <ImagePlus className="w-4 h-4" /> Thêm ảnh đính kèm (Nội thất máy, Tình trạng lỗi...)
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
            
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Lưu ý an toàn:
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                AI Kỹ Thuật PK88 chỉ mang tính chất tham khảo dựa trên kiến thức chung. Luôn cách ly Pin trước khi đo đạc hoặc tháo lắp linh kiện để tránh chạm chập.
              </p>
            </div>

            <button
              onClick={handleDiagnose}
              disabled={loading || (!query.trim() && !imageBase64)}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wrench className="w-5 h-5" />}
              {loading ? 'Đang phân tích pan bệnh...' : 'Chẩn Đoán Bệnh'}
            </button>
          </div>

          {/* Right panel - Output */}
          <div className="w-full sm:w-2/3 flex flex-col bg-slate-950">
            <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/50">
              <span className="text-xs font-bold text-emerald-400">Kết quả & Hướng dẫn sửa chữa</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {result ? (
                <div className="text-sm">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h3: ({node, ...props}) => <h3 className="text-sm sm:text-base font-extrabold text-emerald-400 mt-6 mb-3 pb-2 border-b border-emerald-500/20 uppercase tracking-wide" {...props} />,
                      ul: ({node, ...props}) => <ul className="space-y-2 my-3 pl-1" {...props} />,
                      li: ({node, ...props}) => (
                        <li className="flex items-start gap-2.5">
                          <span className="text-emerald-500 mt-1.5 flex-shrink-0"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" /></span>
                          <span className="text-slate-300 leading-relaxed" {...props} />
                        </li>
                      ),
                      strong: ({node, ...props}) => <strong className="font-bold text-white bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20" {...props} />,
                      p: ({node, ...props}) => <p className="mb-3 text-slate-300 leading-relaxed" {...props} />,
                      blockquote: ({node, ...props}) => (
                        <blockquote className="border-l-4 border-rose-500 bg-rose-500/10 p-3.5 rounded-r-xl text-rose-200/90 font-medium my-4 text-sm flex items-start gap-2 shadow-inner" {...props} />
                      )
                    }}
                  >
                    {result}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3 opacity-50">
                  <Cpu className="w-12 h-12" />
                  <p className="text-sm">Chờ Kỹ thuật viên mô tả tình trạng máy...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
