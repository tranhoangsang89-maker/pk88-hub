import React, { useState, useEffect } from 'react';
import { Staff, Course, Lesson, Quiz, StaffProgress } from '../types';
import { supabase } from '../lib/supabase';
import { BookOpen, CheckCircle2, ChevronRight, PlayCircle, Trophy, GraduationCap, Shield, Layers, Camera, Smartphone, BatteryCharging, Headphones, PenTool, Car, Monitor, Watch, Zap, HardDrive, Book, Lock } from 'lucide-react';

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
    const fetchTrainingData = async () => {
      setLoading(true);
      try {
        // Fetch courses and lessons
        const { data: coursesData } = await supabase.from('courses').select('*');
        const { data: lessonsData } = await supabase.from('lessons').select('*').order('day_number', { ascending: true });
        const { data: progressData } = await supabase.from('staff_progress').select('*').eq('staff_id', currentUser.id);
        
        if (coursesData) setCourses(coursesData);
        if (lessonsData) setLessons(lessonsData);
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
      } finally {
        setLoading(false);
      }
    };
    fetchTrainingData();
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
      if (quizAnswers[q.id] === q.correct_option_index) {
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

  if (loading) return <div className="text-center py-10 text-emerald-500 animate-pulse">Đang tải phân khu Đào tạo...</div>;

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto h-[calc(100vh-180px)]">
      
      {/* Cột trái: Lộ trình 60 ngày */}
      <div className="w-full md:w-1/3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <GraduationCap className="w-5 h-5" />
            <h2 className="font-extrabold text-sm uppercase tracking-wider">Học Viện Phụ Kiện 88</h2>
          </div>
          <p className="text-xs text-slate-400">Lộ trình Đào tạo Hội nhập & Kỹ thuật (60 Ngày)</p>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1">
              <span>Tiến độ hoàn thành</span>
              <span className="text-emerald-400">{Math.round((progress.filter(p => p.status === 'COMPLETED').length / (lessons.length || 1)) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000" 
                style={{ width: `${(progress.filter(p => p.status === 'COMPLETED').length / (lessons.length || 1)) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {lessons.map((lesson, index) => {
            const isCompleted = progress.some(p => p.lessonId === lesson.id && p.status === 'COMPLETED');
            const isSelected = selectedLesson?.id === lesson.id;
            
            let isLocked = false;
            let lockedReason = '';
            // Bài 1 luôn mở. Các bài sau chỉ mở khi bài trước đó đã COMPLETED
            if (index > 0) {
              const prevLesson = lessons[index - 1];
              const prevProgress = progress.find(p => p.lessonId === prevLesson.id && p.status === 'COMPLETED');
              
              if (!prevProgress) {
                isLocked = true;
                lockedReason = 'Bạn phải hoàn thành Bài kiểm tra của ngày trước đó để mở khóa!';
              } else {
                // Ràng buộc: Chỉ được học 1 bài mỗi ngày
                const completedDate = new Date(prevProgress.completedAt).toDateString();
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

      {/* Cột phải: Nội dung bài học */}
      <div className="w-full md:w-2/3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-xl overflow-hidden relative">
        {selectedLesson ? (
          <>
            <div className="p-5 border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10 flex items-center justify-between">
              <div>
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

              <div className="space-y-3 mb-10">
                {selectedLesson.content.split('\n').map((para, i) => {
                  const p = para.trim();
                  if (!p) return null;
                  
                  // Format bullets
                  if (p.startsWith('-')) {
                    return (
                      <div key={i} className="flex items-start gap-2 pl-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                        <p className="text-slate-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: p.substring(1).replace(/(\d{2,3}k)/g, '<span class="text-amber-400 font-bold">$1</span>') }}></p>
                      </div>
                    );
                  }
                  
                  // Format headers (all caps)
                  if (p.toUpperCase() === p && p.length > 5 && !p.includes('?')) {
                    return (
                      <div key={i} className="mt-6 mb-2">
                        <span className="inline-block px-3 py-1 bg-slate-800 text-sky-400 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-700">
                          {p}
                        </span>
                      </div>
                    );
                  }

                  // Questions
                  if (p.match(/^\d+\./)) {
                    return (
                      <div key={i} className="mt-4 font-bold text-emerald-400 text-sm">
                        {p}
                      </div>
                    );
                  }

                  // Default paragraphs with price highlighting
                  return (
                    <p 
                      key={i} 
                      className="text-slate-300 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: p.replace(/(\d{2,3}k)/g, '<span class="text-amber-400 font-bold">$1</span>') }}
                    ></p>
                  );
                })}
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
                      const isSuccess = completedProgress ? true : (quizResult?.score === quizResult?.total && quizResult?.total > 0);
                      
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
