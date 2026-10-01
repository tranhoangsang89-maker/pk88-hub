import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Copy, Send, Loader2, Video, FileText, Search, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Branch } from '../types';
import productsData from '../lib/products.json';

interface AIContentStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBranch: Branch;
  onOpenSubmitPost: () => void;
}

// Extract unique product names from the JSON, mapped with price for context
const ALL_PRODUCTS = productsData.map((p: any) => ({
  name: p.name,
  price: p.price,
  label: `${p.name} - ${(p.price / 1000).toLocaleString()}k`,
  category: p.category
}));

const STYLES = [
  "Hài hước, tếu táo chuẩn miền Tây",
  "Chuyên gia kỹ thuật giật gân (Cảnh báo lỗi máy)",
  "Trải nghiệm thực tế bàn giao máy cho khách",
  "Chương trình ưu đãi / Quà tặng"
];

export function AIContentStudioModal({ isOpen, onClose, currentBranch, onOpenSubmitPost }: AIContentStudioModalProps) {
  const [format, setFormat] = useState<'video' | 'post'>('video');
  const [selectedProduct, setSelectedProduct] = useState(ALL_PRODUCTS[0]?.label || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [style, setStyle] = useState(STYLES[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = ALL_PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  const handleGenerate = async () => {
    const product = selectedProduct.trim();
    if (!product) {
      alert("Vui lòng chọn hoặc nhập sản phẩm!");
      return;
    }

    setLoading(true);
    setResult('');
    
    const allKeys = (import.meta.env.VITE_GEMINI_API_KEY || '').split(',').map(k => k.trim());
    const apiKey = allKeys[Math.floor(Math.random() * allKeys.length)] || 'AIzaSy_MOCK_KEY_FOR_BUILD';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;

    const systemInstruction = `Bạn là một chuyên gia sáng tạo nội dung Marketing xuất sắc cho chuỗi bán lẻ sửa chữa điện thoại "Phụ Kiện 88". 
Hãy viết nội dung dựa trên yêu cầu sau:
Sản phẩm/Dịch vụ: ${product}
Phong cách: ${style}
Địa chỉ chi nhánh gắn vào CTA: ${currentBranch.name} - ${currentBranch.address}

${format === 'video' ? `
Yêu cầu định dạng [Kịch bản Video ngắn]:
- Phân cảnh 1 (0s - 3s): Hook giật gân (Góc quay + Lời thoại mở đầu).
- Phân cảnh 2 (4s - 25s): Hành động thực tế (Thao tác kỹ thuật + Điểm nổi bật sản phẩm).
- Phân cảnh 3 (26s - 35s): Kêu gọi hành động (CTA) gắn đúng địa chỉ chi nhánh.
- Gợi ý nhạc nền trend TikTok + Bộ Hashtag chuẩn SEO.
` : `
Yêu cầu định dạng [Bài viết Fanpage/Zalo + Gợi ý ảnh]:
- Tiêu đề giật tít (Headline bắt mắt).
- Thân bài caption ngắn gọn (4-5 câu, tự nhiên, lôi cuốn).
- Gợi ý 3 góc chụp ảnh thực tế tại quầy (Ảnh 1: Cận cảnh máy cũ trầy xước lúc nhận; Ảnh 2: Cận cảnh máy sau khi dán xong bóng loáng; Ảnh 3: Nhân viên trao máy cho khách tại quầy).
- Chữ gợi ý chèn lên ảnh (Text Overlay).
- Lời mời ghé đúng địa chỉ chi nhánh + Bộ Hashtag chuẩn SEO.
`}

Viết bằng tiếng Việt, định dạng Markdown rõ ràng, sáng tạo, thực tế, đúng phong cách yêu cầu. Không thêm phần giới thiệu dông dài.`;

    try {
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        console.warn("VITE_GEMINI_API_KEY is not set. Using mocked response for demo.");
        await new Promise(resolve => setTimeout(resolve, 2000));
        setResult(`**[DEMO MODE - CHƯA CẤU HÌNH API KEY]**\n\nNội dung được tạo ra bởi AI dựa trên: ${product}, phong cách: ${style}.\n\nVui lòng thêm \`VITE_GEMINI_API_KEY\` vào file \`.env\` để sử dụng tính năng này thật sự.`);
        setLoading(false);
        return;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemInstruction }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
        })
      });

      if (!res.ok) {
        throw new Error(`Lỗi API: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        setResult(data.candidates[0].content.parts[0].text);
      } else {
        setResult('Không thể tạo nội dung. Vui lòng thử lại.');
      }
    } catch (error: any) {
      console.error(error);
      setResult(`Đã xảy ra lỗi khi gọi AI: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    alert('Đã sao chép nội dung vào Clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/50 flex-shrink-0">
          <h3 className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Xưởng Sáng Tạo Nội Dung AI - Phụ Kiện 88
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden custom-scrollbar">
          {/* LEO - Form Settings */}
          <div className="w-full md:w-1/3 md:border-r border-b md:border-b-0 border-slate-800 p-4 md:p-5 flex-shrink-0 md:overflow-y-auto bg-slate-900/50 space-y-5">
            
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Định dạng mong muốn</label>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('video')}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left text-sm font-medium ${
                    format === 'video'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                      : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  Kịch bản Video ngắn (TikTok/Reels)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('post')}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left text-sm font-medium ${
                    format === 'post'
                      ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                      : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Bài viết Fanpage/Zalo + Gợi ý ảnh
                </button>
              </div>
            </div>

            {/* Product Selection */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-slate-300 mb-2">Sản phẩm / Dịch vụ</label>
              
              <div 
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 cursor-pointer flex justify-between items-center hover:border-slate-500 transition-colors"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="truncate">{selectedProduct || 'Chọn sản phẩm...'}</span>
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </div>

              {isDropdownOpen && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[250px]">
                  <div className="p-2 border-b border-slate-800 bg-slate-900/90 sticky top-0">
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm sản phẩm (Tên, Danh mục)..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto custom-scrollbar p-1">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((p, idx) => (
                        <div 
                          key={idx}
                          className={`px-3 py-2 text-sm rounded-lg cursor-pointer flex justify-between items-center transition-colors ${selectedProduct === p.label ? 'bg-purple-500/20 text-purple-400 font-medium' : 'text-slate-300 hover:bg-slate-800'}`}
                          onClick={() => {
                            setSelectedProduct(p.label);
                            setIsDropdownOpen(false);
                            setSearchTerm('');
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="truncate max-w-[200px] sm:max-w-xs">{p.name}</span>
                            <span className="text-xs text-slate-500">{p.category}</span>
                          </div>
                          <span className="text-emerald-400 font-medium ml-2 whitespace-nowrap">{(p.price / 1000).toLocaleString()}k</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-slate-500 text-sm">
                        Không tìm thấy sản phẩm.
                        <button 
                          className="mt-2 block w-full text-purple-400 hover:text-purple-300 text-xs underline"
                          onClick={() => {
                            setSelectedProduct(searchTerm);
                            setIsDropdownOpen(false);
                          }}
                        >
                          Sử dụng "{searchTerm}" làm sản phẩm tùy chỉnh
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Style Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Phong cách nội dung</label>
              <div className="flex flex-col gap-2">
                {STYLES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStyle(s)}
                    className={`px-3 py-2 text-xs rounded-lg border text-left transition-colors ${
                      style === s
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Context Notice */}
            <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-xl">
              <div className="text-xs text-blue-300">
                <span className="font-bold">📍 Địa chỉ chèn CTA:</span> {currentBranch.name} - {currentBranch.address}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang sáng tạo AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Tạo Nội Dung Ngay
                </>
              )}
            </button>
          </div>

          {/* RIGHT - AI Result */}
          <div className="w-full md:w-2/3 p-4 md:p-5 flex flex-col bg-slate-950 flex-shrink-0 md:flex-shrink min-h-[500px] md:min-h-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h4 className="text-sm font-bold text-slate-300">Kết quả AI tạo ra</h4>
              {result && (
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={copyToClipboard} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700">
                    <Copy className="w-3.5 h-3.5" />
                    Sao chép nội dung
                  </button>
                  <button 
                    onClick={() => {
                      onClose();
                      onOpenSubmitPost();
                    }} 
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-500/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Đã Đăng Xong {'>'} Nộp Link (5s)
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-y-auto custom-scrollbar text-sm">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                  <p className="animate-pulse">Đang nạp dữ liệu từ não bộ AI Gemini...</p>
                </div>
              ) : result ? (
                <div className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center">
                  <Sparkles className="w-12 h-12 mb-3 opacity-20" />
                  <p>Chọn thông số và bấm "Tạo Nội Dung Ngay" để AI làm việc cho bạn.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
