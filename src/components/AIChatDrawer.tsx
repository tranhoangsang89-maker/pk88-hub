import React, { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, X, ExternalLink, RefreshCw } from 'lucide-react';
import { User } from '../types';

interface AIChatDrawerProps {
  currentUser: User | null;
  isCustomerMode: boolean;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({ currentUser, isCustomerMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [key, setKey] = useState(0); // To reload iframe if needed
  const [contextData, setContextData] = useState<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Lắng nghe tín hiệu Context từ App
  useEffect(() => {
    const handleContextUpdate = (e: any) => {
      setContextData(e.detail);
      setIsOpen(true); // Tự động bật Chatbot lên để chào khách
      
      // Bắn tín hiệu real-time vào trong iframe (nếu iFrame có hỗ trợ nhận)
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: 'CONTEXT_INJECT', data: e.detail }, '*');
      }
    };
    
    window.addEventListener('AI_CONTEXT_UPDATE', handleContextUpdate);
    return () => window.removeEventListener('AI_CONTEXT_UPDATE', handleContextUpdate);
  }, []);

  // Xóa context khi chuyển chế độ hoặc nhân viên đăng nhập
  useEffect(() => {
    if (!isCustomerMode && currentUser) {
      setContextData(null);
    }
  }, [isCustomerMode, currentUser]);

  // Truyền Context qua URL Query (cho lúc tải lại iFrame)
  const baseUrl = "https://chatbot-pk88.vercel.app/";
  let iframeUrl = baseUrl;
  
  if (isCustomerMode && contextData) {
    const params = new URLSearchParams();
    if (contextData.userName) params.append('name', contextData.userName);
    if (contextData.phone) params.append('phone', contextData.phone);
    if (contextData.ticketCode) params.append('ticket', contextData.ticketCode);
    if (contextData.device) params.append('device', contextData.device);
    iframeUrl = `${baseUrl}?${params.toString()}`;
  } else if (!isCustomerMode && currentUser) {
    // Chế độ nhân viên nội bộ
    const params = new URLSearchParams();
    params.append('name', currentUser.fullName);
    params.append('role', currentUser.role);
    iframeUrl = `${baseUrl}?${params.toString()}`;
  }

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-amber-500 via-rose-600 to-pink-600 text-slate-950 p-3.5 rounded-full shadow-2xl hover:scale-105 transition-all glow-red flex items-center gap-2 font-extrabold text-xs cursor-pointer"
        >
          <Sparkles className="w-5 h-5 text-slate-950 animate-spin-slow" />
          <span className="font-bold">Trợ Lý AI Chị 8 & Bé 8</span>
        </button>
      )}

      {/* Live Chatbot Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-md h-[600px] glass-card bg-slate-950 rounded-3xl border border-amber-500/40 shadow-2xl overflow-hidden flex flex-col transition-all">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-3.5 border-b border-amber-500/30 flex items-center justify-between text-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-300">Chị 8 & Bé 8 (Trực Tuyến 24/7)</h4>
                <p className="text-[10px] text-slate-400">Hệ thống AI Chatbot PK88 Live</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setKey((k) => k + 1)}
                title="Tải lại Chatbot"
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <a
                href="https://chatbot-pk88.vercel.app/"
                target="_blank"
                rel="noreferrer"
                title="Mở trang Chatbot full"
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Embedded Live Chatbot Iframe */}
          <div className="flex-1 w-full bg-black relative">
            <iframe
              ref={iframeRef}
              key={key}
              src={iframeUrl}
              title="Phụ Kiện 88 Chatbot Live"
              className="w-full h-full border-none"
              allow="microphone; camera"
            />
          </div>
        </div>
      )}
    </>
  );
};
