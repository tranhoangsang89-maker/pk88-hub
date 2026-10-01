import React, { useState, useEffect } from 'react';
import { Staff, Course, Lesson, Quiz, StaffProgress } from '../types';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, CheckCircle2, ChevronRight, PlayCircle, Trophy, GraduationCap, Shield, Layers, Camera, Smartphone, BatteryCharging, Headphones, PenTool, Car, Monitor, Watch, Zap, HardDrive, Book, Lock, TrendingUp, ArrowLeft, Bot, Sparkles, Send } from 'lucide-react';
import { LMSDashboard } from './LMSDashboard';
import { PK88_KNOWLEDGE_BASE } from '../lib/knowledgeBase';
import productsData from '../lib/products.json';
import loTrinhData from '../lib/loTrinhDaoTao.md?raw';

interface TrainingLMSProps {
  currentUser: Staff;
}

export function TrainingLMS({ currentUser }: TrainingLMSProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<StaffProgress[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{score: number, total: number} | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  
  // AI Chat States
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const isSuperUser = currentUser.role === 'admin' || currentUser.role === 'founder';

  const getLessonIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('cường lực')) return <Shield className="w-5 h-5" />;
    if (t.includes('ppf')) return <Layers className="w-5 h-5" />;
    if (t.includes('camera')) return <Camera className="w-5 h-5" />;
    if (t.includes('ốp lưng')) return <Smartphone className="w-5 h-5" />;
    if (t.includes('sạc')) return <BatteryCharging className="w-5 h-5" />;
    if (t.includes('tai nghe') || t.includes('loa') || t.includes('mic')) return <Headphones className="w-5 h-5" />;
    if (t.includes('sửa chữa')) return <PenTool className="w-5 h-5" />;
    if (t.includes('ô tô')) return <Car className="w-5 h-5" />;
    if (t.includes('ipad')) return <Monitor className="w-5 h-5" />;
    if (t.includes('apple watch')) return <Watch className="w-5 h-5" />;
    if (t.includes('cáp') || t.includes('jack')) return <Zap className="w-5 h-5" />;
    if (t.includes('thẻ nhớ') || t.includes('usb')) return <HardDrive className="w-5 h-5" />;
    return <Book className="w-5 h-5" />;
  };

  useEffect(() => {
    let isMounted = true;
    const fetchTrainingData = async () => {
      if (!isMounted) return;
      setLoading(true);
      
      const applyMockData = () => {
        if (!isMounted) return;
        setCourses([{ id: 'c1', title: 'Khóa Đào Tạo 60 Ngày', totalDays: 60, createdAt: new Date().toISOString() }]);
        setLessons([
          { id: 'l1', courseId: 'c1', dayNumber: 1, title: 'Tổng quan công ty & Quy định', content: '# Mục tiêu Ngày 1\nHiểu rõ văn hóa và quy định làm việc tại Phụ Kiện 88.', createdAt: new Date().toISOString() },
          { id: 'l2', courseId: 'c1', dayNumber: 2, title: 'Kiến thức: Kính cường lực & PPF', content: '# Mục tiêu Ngày 2\nNhận biết các dòng kính cường lực và cách dán.', createdAt: new Date().toISOString() },
          { id: 'l3', courseId: 'c1', dayNumber: 3, title: 'Kiến thức: Cáp sạc & Pin dự phòng', content: '# Mục tiêu Ngày 3\nPhân biệt cáp sạc nhanh, pin dự phòng chính hãng.', createdAt: new Date().toISOString() },
          { id: 'l4', courseId: 'c1', dayNumber: 4, title: 'Kỹ năng Bán hàng (Basic)', content: '# Mục tiêu Ngày 4\nCách tiếp đón và tư vấn khách hàng cơ bản.', createdAt: new Date().toISOString() }
        ]);
        setLoading(false);
      };

      // Fallback timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (isMounted && loading) {
          console.warn('LMS data fetch timeout. Applying mock data...');
          applyMockData();
        }
      }, 3000);

      try {
        // Fetch courses and lessons
        const { data: coursesData, error: cErr } = await supabase.from('courses').select('*');
        if (cErr) console.error(cErr);
        
        const { data: lessonsData, error: lErr } = await supabase.from('lessons').select('*').order('day_number', { ascending: true });
        if (lErr) console.error(lErr);
        
        const { data: progressData, error: pErr } = await supabase.from('staff_progress').select('*').eq('staff_id', currentUser.id);
        if (pErr) console.error(pErr);
        
        if (!isMounted) return;
        clearTimeout(timeoutId);

        if (coursesData && coursesData.length > 0) setCourses(coursesData);
        if (lessonsData && lessonsData.length > 0) {
          setLessons(lessonsData.map((l: any) => ({
            id: l.id,
            courseId: l.course_id,
            dayNumber: l.day_number,
            title: l.title,
            content: l.content,
            createdAt: l.created_at
          })));
        } else {
          // If no lessons found in DB, fallback to mock data
          applyMockData();
        }
        if (progressData) {
          setProgress(progressData.map((p: any) => ({
            id: p.id,
            staffId: p.staff_id,
            lessonId: p.lesson_id,
            status: p.status,
            score: p.score,
            completedAt: p.completed_at
          })));
        }
      } catch (e) {
        console.error('Lỗi tải dữ liệu LMS:', e);
        applyMockData();
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) setLoading(false);
      }
    };
    
    fetchTrainingData();
    
    return () => {
      isMounted = false;
    };
  }, [currentUser.id]);

  const loadLessonQuizzes = async (lessonId: string) => {
    const { data } = await supabase.from('quizzes').select('*').eq('lesson_id', lessonId);
    if (data) setQuizzes(data);
    setQuizAnswers({});
    setQuizResult(null);
  };

  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    loadLessonQuizzes(lesson.id);
  };

  const handleSubmitQuiz = async () => {
    let score = 0;
    quizzes.forEach(q => {
      // Handle both camelCase and snake_case from DB
      const correctIdx = (q as any).correct_option_index ?? (q as any).correctOptionIndex;
      if (quizAnswers[q.id] === correctIdx) {
        score++;
      }
    });
    
    const finalScore = Math.round((score / quizzes.length) * 100) || 100; // 100 if no quizzes
    setQuizResult({ score, total: quizzes.length });

    // Cập nhật tiến độ lên Supabase
    try {
      const existingProgress = progress.find(p => p.lessonId === selectedLesson?.id);
      if (existingProgress) {
        await supabase.from('staff_progress').update({
          status: 'COMPLETED',
          score: finalScore,
          completed_at: new Date().toISOString()
        }).eq('id', existingProgress.id);
      } else if (selectedLesson) {
        await supabase.from('staff_progress').insert({
          staff_id: currentUser.id,
          lesson_id: selectedLesson.id,
          status: 'COMPLETED',
          score: finalScore,
          completed_at: new Date().toISOString()
        });
      }
      
      // Cập nhật state local
      const { data: progressData } = await supabase.from('staff_progress').select('*').eq('staff_id', currentUser.id);
      if (progressData) {
        setProgress(progressData.map((p: any) => ({
          id: p.id,
          staffId: p.staff_id,
          lessonId: p.lesson_id,
          status: p.status,
          score: p.score,
          completedAt: p.completed_at
        })));
      }
      
    } catch(e) {
      console.error(e);
    }
  };

  const handleSendAIChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Hỗ trợ xoay vòng API Key (nếu VITE_GEMINI_API_KEY là danh sách phân tách bằng dấu phẩy)
      const apiKeysString = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKeysString) {
        setChatMessages(prev => [...prev, { role: 'ai', text: 'Thiếu cấu hình VITE_GEMINI_API_KEY. Vui lòng liên hệ Admin.' }]);
        setIsChatLoading(false);
        return;
      }
      
      const apiKeys = apiKeysString.split(',').map((k: string) => k.trim()).filter(Boolean);
      // Chọn ngẫu nhiên 1 key trong danh sách để chia đều tải (Load Balancing)
      const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

      const allLessonsText = lessons.map(l => `Bài Ngày ${l.dayNumber} - ${l.title}:\n${l.content}`).join('\n\n');

      const prompt = `Bạn là Trợ lý Ảo đào tạo nội bộ của hệ thống Phụ Kiện 88. Dưới đây là Bộ Não Nội Bộ (Knowledge Base) chứa quy định và chính sách công ty:
      
${PK88_KNOWLEDGE_BASE}

THÔNG TIN VỀ NGƯỜI ĐANG CHAT VỚI BẠN:
- Tên: ${currentUser.name}
- Chức vụ: ${currentUser.role}
- Chi nhánh: ${currentUser.branch_id || 'Chưa rõ'}
Hãy luôn xưng hô lịch sự, gọi đúng tên của họ (nếu có thể) để tạo sự gần gũi.

DƯỚI ĐÂY LÀ CHI TIẾT NỘI DUNG TẤT CẢ CÁC BÀI HỌC (TỪ NGÀY 1 ĐẾN NGÀY CUỐI):
${allLessonsText}

DƯỚI ĐÂY LÀ CHI TIẾT BÀI HỌC VÀ LỘ TRÌNH ĐÀO TẠO NHÂN VIÊN MỚI (TÀI LIỆU KỸ THUẬT):
${loTrinhData}

DƯỚI ĐÂY LÀ DANH SÁCH BẢNG GIÁ VÀ SẢN PHẨM HIỆN CÓ TẠI PHỤ KIỆN 88 (ĐỊNH DẠNG JSON):
${JSON.stringify(productsData)}

Dựa vào thông tin trên, hãy trả lời câu hỏi của nhân viên một cách ngắn gọn, súc tích và thân thiện. Nếu khách hỏi giá, hãy tìm kỹ trong danh sách sản phẩm. NẾU CÂU HỎI KHÔNG LIÊN QUAN ĐẾN PHỤ KIỆN 88 HOẶC NẰM NGOÀI TÀI LIỆU, hãy từ chối trả lời một cách lịch sự.

Câu hỏi của nhân viên: ${userMessage}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 } // Low temp for more factual answers
        })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0].content.parts[0].text) {
        setChatMessages(prev => [...prev, { role: 'ai', text: data.candidates[0].content.parts[0].text }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', text: 'Hệ thống AI đang bảo trì hoặc phản hồi bị lỗi.' }]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Đã xảy ra lỗi kết nối với máy chủ AI.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10 text-emerald-500 animate-pulse">Đang tải phân khu Đào tạo...</div>;

  if (showDashboard) {
    return (
      <div className="flex flex-col max-w-7xl mx-auto h-[calc(100vh-180px)]">
        <div className="mb-4">
          <button 
            onClick={() => setShowDashboard(false)}
            className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-sm font-bold shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại Giao diện Học viên
          </button>
        </div>
        <LMSDashboard />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto h-[calc(100vh-180px)]">
      
      {/* Cột trái: Lộ trình 60 ngày */}
      <div className={`w-full md:w-1/3 bg-slate-900 border border-slate-800 rounded-2xl flex-col shadow-xl overflow-hidden ${selectedLesson ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-emerald-400">
              <GraduationCap className="w-5 h-5" />
              <h2 className="font-extrabold text-sm uppercase tracking-wider">Học Viện Phụ Kiện 88</h2>
            </div>
            {isSuperUser && (
              <button 
                onClick={() => setShowDashboard(true)}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 p-1.5 rounded-lg border border-emerald-500/30 transition-all"
                title="Mở Bảng Điều Khiển Quản Lý"
              >
                <TrendingUp className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400">Lộ trình Đào tạo Hội nhập & Kỹ thuật (60 Ngày)</p>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1">
              <span>Tiến độ hoàn thành</span>
              <span className="text-emerald-400">{Math.round((progress.filter(p => p.status === 'COMPLETED').length / (lessons.length || 1)) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mb-4">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000" 
                style={{ width: `${(progress.filter(p => p.status === 'COMPLETED').length / (lessons.length || 1)) * 100}%` }}
              ></div>
            </div>
            
            <button
              onClick={() => setShowAIChat(true)}
              className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all ${
                showAIChat 
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 shadow-lg' 
                  : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Bot className="w-4 h-4" /> Hỏi Trợ Lý Đào Tạo AI
              {showAIChat && <Sparkles className="w-3.5 h-3.5 animate-pulse" />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {lessons.map((lesson, index) => {
            const isCompleted = progress.some(p => p.lessonId === lesson.id && p.status === 'COMPLETED');
            const isSelected = selectedLesson?.id === lesson.id;
            
            let isLocked = false;
            let lockedReason = '';

            // Bài 1 luôn mở. Các bài sau chỉ mở khi bài trước đó đã COMPLETED (trừ Admin/Founder)
            if (index > 0 && !isSuperUser) {
              const prevLesson = lessons[index - 1];
              const prevProgress = progress.find(p => p.lessonId === prevLesson.id && p.status === 'COMPLETED');
              
              if (!prevProgress) {
                isLocked = true;
                lockedReason = 'Bạn phải hoàn thành Bài kiểm tra của ngày trước đó để mở khóa!';
              } else {
                // Ràng buộc: Chỉ được học 1 bài mỗi ngày
                const completedDate = new Date(prevProgress.completedAt || new Date()).toDateString();
                const today = new Date().toDateString();
                if (completedDate === today) {
                  isLocked = true;
                  lockedReason = 'Bạn đã hoàn thành định mức học của hôm nay. Hãy quay lại vào ngày mai để học tiếp nhé!';
                }
              }
            }
            
            return (
              <div 
                key={lesson.id}
                onClick={() => {
                  if (isLocked) {
                    alert(lockedReason);
                    return;
                  }
                  handleLessonSelect(lesson);
                  setShowAIChat(false);
                }}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between group ${
                  isLocked 
                    ? 'bg-slate-900/30 border-slate-800 opacity-50 cursor-not-allowed'
                    : isSelected 
                      ? 'bg-emerald-900/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)] cursor-pointer' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-lg transition-all ${
                    isCompleted 
                      ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/40 text-emerald-400 border border-emerald-500/40 shadow-emerald-500/10'
                      : isSelected
                        ? 'bg-gradient-to-br from-sky-500/20 to-sky-600/40 text-sky-400 border border-sky-500/40 shadow-sky-500/10'
                        : 'bg-gradient-to-br from-slate-800 to-slate-900 text-slate-500 border border-slate-700'
                  }`}>
                    {getLessonIcon(lesson.title)}
                  </div>
                  <div className="text-left">
                    <h3 className={`text-sm font-extrabold ${isSelected ? 'text-emerald-400' : 'text-slate-200'}`}>Ngày {lesson.dayNumber}</h3>
                    <p className="text-[10px] text-slate-400 line-clamp-1 group-hover:text-slate-300">{lesson.title}</p>
                  </div>
                </div>
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : isLocked ? (
                  <Lock className="w-4 h-4 text-slate-700" />
                ) : (
                  <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-600'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cột phải: Nội dung bài học hoặc Chat AI */}
      <div className={`w-full md:w-2/3 bg-slate-900 border border-slate-800 rounded-2xl flex-col shadow-xl overflow-hidden relative ${(!selectedLesson && !showAIChat) ? 'hidden md:flex' : 'flex'}`}>
        {showAIChat ? (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/10">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">Trợ Lý AI Nội Bộ <Sparkles className="w-3.5 h-3.5 text-amber-400" /></h2>
                  <p className="text-[10px] text-slate-400">Hỏi đáp trực tiếp với trí tuệ nhân tạo PK88</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAIChat(false)}
                className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/50">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <Bot className="w-12 h-12 text-slate-700 mb-3" />
                  <h3 className="text-sm font-bold text-slate-300">Bạn cần hỗ trợ gì?</h3>
                  <p className="text-xs text-slate-500 mt-2 max-w-sm">Tôi đã được học toàn bộ quy trình, bảng giá và chính sách của Phụ Kiện 88. Hãy đặt câu hỏi bất kỳ!</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {["Pin iPhone 13 Pro Max bảo hành bao lâu?", "Khách chê giá ép kính đắt", "Thái độ đón khách chuẩn PK88"].map(s => (
                      <button key={s} onClick={() => setChatInput(s)} className="text-[10px] px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 hover:bg-slate-700 transition-colors">
                        "{s}"
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none shadow-lg'}`}>
                      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text || ''}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none p-4 flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-75" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-150" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800">
              <form onSubmit={handleSendAIChat} className="relative flex items-center">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isChatLoading}
                  placeholder="Hỏi trợ lý nội bộ..." 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                />
                <button 
                  type="submit" 
                  disabled={isChatLoading || !chatInput.trim()}
                  className="absolute right-2 p-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        ) : selectedLesson ? (
          <>
            <div className="p-5 border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10 flex items-center justify-between">
              <div>
                <button 
                  onClick={() => setSelectedLesson(null)}
                  className="md:hidden flex items-center gap-1 text-slate-400 hover:text-emerald-400 mb-3 text-xs font-bold transition-colors bg-slate-800/50 px-2 py-1 rounded-md"
                >
                  <ArrowLeft className="w-3 h-3" /> Quay lại Lộ trình
                </button>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 mb-2 inline-block">
                  Bài học Ngày {selectedLesson.dayNumber}
                </span>
                <h2 className="text-xl font-extrabold text-slate-100">{selectedLesson.title}</h2>
              </div>
              <BookOpen className="w-8 h-8 text-slate-700" />
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="mb-6 rounded-2xl overflow-hidden border border-slate-800 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/40 to-slate-900/40 z-0"></div>
                <div className="relative z-10 p-6 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-lg">
                    <BookOpen className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Mục Tiêu Bài Học</h3>
                    <p className="text-sm text-slate-300">Hoàn thành bài học này để nắm vững các kiến thức cốt lõi, nâng cao kỹ năng tư vấn và phục vụ khách hàng tại chuỗi Phụ Kiện 88.</p>
                  </div>
                </div>
              </div>

              <div className="prose prose-invert prose-emerald max-w-none mb-10">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-2xl font-extrabold text-emerald-400 mb-4 pb-2 border-b border-slate-800" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-bold text-sky-400 mt-6 mb-3" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-bold text-amber-400 mt-5 mb-2" {...props} />,
                    p: ({node, ...props}) => <p className="text-slate-300 text-[15px] leading-relaxed mb-4" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-outside space-y-2 mb-6 ml-5 text-slate-300 text-[15px]" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-outside space-y-2 mb-6 ml-5 text-slate-300 text-[15px]" {...props} />,
                    li: ({node, ...props}) => <li className="pl-2 marker:text-emerald-500" {...props} />,
                    a: ({node, ...props}) => <a className="text-sky-400 hover:text-sky-300 underline underline-offset-4 font-medium transition-colors" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-extrabold text-slate-100" {...props} />,
                    blockquote: ({node, ...props}) => (
                      <blockquote className="border-l-4 border-emerald-500 bg-emerald-500/10 p-4 my-6 rounded-r-xl italic text-slate-200" {...props} />
                    ),
                    img: ({node, ...props}) => (
                      <div className="my-8 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl relative group">
                        <img className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105" {...props} />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </div>
                    )
                  }}
                >
                  {selectedLesson.content}
                </ReactMarkdown>
              </div>

              {/* Phần Kiểm tra Sát hạch */}
              {quizzes.length > 0 && (
                <div className="mt-8 border-t border-slate-800 pt-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-bold text-slate-200">Bài Kiểm Tra Sát Hạch (AI Chấm Điểm)</h3>
                  </div>

                  {(() => {
                    const completedProgress = progress.find(p => p.lessonId === selectedLesson.id && p.status === 'COMPLETED');
                    const showResult = completedProgress || quizResult;
                    
                    if (showResult) {
                      const finalScore = completedProgress ? completedProgress.score : quizResult?.score;
                      // Giả sử 100% là pass cho bài đã hoàn thành
                      const isSuccess = completedProgress ? true : (quizResult?.score === quizResult?.total && (quizResult?.total || 0) > 0);
                      
                      return (
                        <div className={`p-6 rounded-2xl border text-center ${isSuccess ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-rose-900/20 border-rose-500/30'}`}>
                          <div className="text-4xl mb-2 font-extrabold">{isSuccess ? '🎉' : '💪'}</div>
                          <h4 className={`text-xl font-bold mb-1 ${isSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {completedProgress ? 'Bạn đã hoàn thành bài học này!' : `Bạn đạt ${quizResult?.score}/${quizResult?.total} điểm`}
                          </h4>
                          <p className="text-sm text-slate-400 mt-2">
                            {completedProgress 
                              ? `Điểm số đã lưu trên hệ thống: ${completedProgress.score}%`
                              : isSuccess 
                                ? 'Xuất sắc! Bạn đã vượt qua bài kiểm tra của ngày hôm nay.' 
                                : 'Hãy ôn lại bài và thử sức lại nhé!'}
                          </p>
                          {!completedProgress && !isSuccess && (
                            <button 
                              onClick={() => setQuizResult(null)}
                              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-bold transition-all"
                            >
                              Làm lại bài kiểm tra
                            </button>
                          )}
                        </div>
                      );
                    }

                    return (
                    <div className="space-y-6">
                      {quizzes.map((quiz, idx) => {
                        // Handle both old formats (JSON string) or valid JSONB array
                        let opts: string[] = [];
                        try {
                          opts = typeof quiz.options === 'string' ? JSON.parse(quiz.options) : quiz.options;
                        } catch(e) { opts = []; }

                        return (
                          <div key={quiz.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                            <h4 className="text-sm font-bold text-slate-200 mb-4">Câu {idx + 1}: {quiz.question}</h4>
                            <div className="space-y-2">
                              {opts.map((opt, optIdx) => (
                                <button
                                  key={optIdx}
                                  onClick={() => setQuizAnswers(prev => ({...prev, [quiz.id]: optIdx}))}
                                  className={`w-full text-left p-3 rounded-xl border text-sm transition-all flex items-center justify-between ${
                                    quizAnswers[quiz.id] === optIdx
                                      ? 'bg-sky-500/10 border-sky-500 text-sky-400 font-medium'
                                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  {quizAnswers[quiz.id] === optIdx && <CheckCircle2 className="w-4 h-4" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(quizAnswers).length !== quizzes.length}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Nộp Bài & Chấm Điểm
                      </button>
                    </div>
                  );
                })()}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
              <PlayCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Chào mừng đến với Học viện Phụ Kiện 88</h3>
            <p className="text-sm text-slate-400 max-w-md mt-2">
              Hãy chọn một bài học ở danh sách bên trái để bắt đầu lộ trình đào tạo của bạn.<br/><br/>
              <span className="text-amber-400 font-bold">Lưu ý:</span> Hệ thống thiết lập tiêu chuẩn <strong>Mỗi ngày chỉ học 1 bài</strong>. Sau khi hoàn thành bài hôm nay, bài tiếp theo sẽ được mở khóa vào lúc 00:00 ngày hôm sau!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
