import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, Target, AlertCircle, Award, BookOpen } from 'lucide-react';
import { MOCK_STAFF } from '../lib/mockData';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export function LMSDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStaff: 0,
    totalTestsCompleted: 0,
    averageScore: 0,
  });
  const [progressDistribution, setProgressDistribution] = useState<any[]>([]);
  const [topStaff, setTopStaff] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Use MOCK_STAFF since staff_progress stores mock IDs (s0, s1, etc)
        const staffData = MOCK_STAFF;
        
        // Fetch progress
        const { data: progressData } = await supabase.from('staff_progress').select('*').eq('status', 'COMPLETED');
        // Fetch lessons
        const { data: lessonsData } = await supabase.from('lessons').select('id, day_number');

        if (!staffData || !progressData || !lessonsData) return;

        setStats({
          totalStaff: staffData.length,
          totalTestsCompleted: progressData.length,
          averageScore: progressData.length > 0 
            ? Math.round(progressData.reduce((acc, curr) => acc + (curr.score || 0), 0) / progressData.length) 
            : 0
        });

        // Calculate progress distribution (where is each staff currently?)
        const staffLatestLesson: Record<string, number> = {};
        staffData.forEach(s => staffLatestLesson[s.id] = 0);

        progressData.forEach(p => {
          const lesson = lessonsData.find(l => l.id === p.lesson_id);
          if (lesson && lesson.day_number > (staffLatestLesson[p.staff_id] || 0)) {
            staffLatestLesson[p.staff_id] = lesson.day_number;
          }
        });

        let dist = [
          { name: 'Ngày 1-15', count: 0 },
          { name: 'Ngày 16-30', count: 0 },
          { name: 'Ngày 31-45', count: 0 },
          { name: 'Ngày 46-60', count: 0 },
        ];

        Object.values(staffLatestLesson).forEach(day => {
          if (day <= 15) dist[0].count++;
          else if (day <= 30) dist[1].count++;
          else if (day <= 45) dist[2].count++;
          else dist[3].count++;
        });
        setProgressDistribution(dist);

        // Top Staff (most completed lessons & highest avg score)
        const staffMetrics: Record<string, { count: number, totalScore: number, name: string }> = {};
        staffData.forEach(s => staffMetrics[s.id] = { count: 0, totalScore: 0, name: s.fullName || 'Nhân viên' });
        
        progressData.forEach(p => {
          if (staffMetrics[p.staff_id]) {
            staffMetrics[p.staff_id].count++;
            staffMetrics[p.staff_id].totalScore += (p.score || 0);
          }
        });

        const sortedStaff = Object.values(staffMetrics)
          .filter(s => s.count > 0)
          .sort((a, b) => b.count - a.count || b.totalScore - a.totalScore)
          .slice(0, 3)
          .map(s => ({ ...s, avg: Math.round(s.totalScore / s.count) }));
        
        setTopStaff(sortedStaff);

        // Warnings: Staff who haven't studied in the last 3 days
        const now = new Date();
        const inactive = staffData.map(s => {
          const staffProg = progressData.filter(p => p.staff_id === s.id);
          if (staffProg.length === 0) return { name: s.fullName, daysInactive: 'Chưa học bài nào' };
          
          const lastProg = staffProg.reduce((latest, curr) => {
            if (!latest.completed_at) return curr;
            if (!curr.completed_at) return latest;
            return new Date(curr.completed_at) > new Date(latest.completed_at) ? curr : latest;
          }, staffProg[0]);

          if (lastProg.completed_at) {
            const diffTime = Math.abs(now.getTime() - new Date(lastProg.completed_at).getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 3) {
              return { name: s.fullName, daysInactive: `${diffDays} ngày` };
            }
          }
          return null;
        }).filter(Boolean);

        setWarnings(inactive.slice(0, 5)); // Just show top 5

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-20 flex flex-col items-center justify-center h-full">
      <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
      <p className="text-emerald-500 font-bold">Đang tải dữ liệu phân tích...</p>
    </div>;
  }

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-y-auto custom-scrollbar h-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-white">LMS Analytics Dashboard</h2>
          <p className="text-sm text-slate-400">Bảng điều khiển Quản trị Tiến độ Đào tạo Toàn Chuỗi</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:scale-110 transition-transform">
            <Users className="w-32 h-32 text-emerald-500" />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 text-sm font-bold mb-1">Tổng Số Nhân Viên Học</p>
            <h3 className="text-4xl font-extrabold text-emerald-400">{stats.totalStaff}</h3>
          </div>
        </div>

        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:scale-110 transition-transform">
            <BookOpen className="w-32 h-32 text-sky-500" />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 text-sm font-bold mb-1">Tổng Số Bài Đã Thi</p>
            <h3 className="text-4xl font-extrabold text-sky-400">{stats.totalTestsCompleted}</h3>
          </div>
        </div>

        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:scale-110 transition-transform">
            <Target className="w-32 h-32 text-amber-500" />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 text-sm font-bold mb-1">Điểm Số Trung Bình</p>
            <h3 className="text-4xl font-extrabold text-amber-400">{stats.averageScore}%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-lg">
          <h3 className="text-lg font-bold text-slate-200 mb-6">Tiến Độ Học Tập Toàn Chuỗi</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#0f172a'}}
                  contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9', borderRadius: '8px'}} 
                />
                <Bar dataKey="count" name="Số nhân viên" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {progressDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lists */}
        <div className="space-y-6">
          <div className="bg-slate-950 p-6 rounded-2xl border border-emerald-900/50 shadow-[0_0_15px_rgba(16,185,129,0.05)] h-full">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Top Học Bá</h3>
            </div>
            <div className="space-y-4">
              {topStaff.map((staff, i) => (
                <div key={i} className="flex justify-between items-center pb-3 border-b border-slate-800 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-400 border border-slate-700">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">{staff.name}</p>
                      <p className="text-[10px] text-slate-500">{staff.count} bài học đã qua</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">{staff.avg}%</p>
                  </div>
                </div>
              ))}
              {topStaff.length === 0 && <p className="text-xs text-slate-500">Chưa có dữ liệu học tập.</p>}
            </div>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-rose-900/50 shadow-[0_0_15px_rgba(225,29,72,0.05)] h-full">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider">Cảnh Báo Đứng Im</h3>
            </div>
            <div className="space-y-4">
              {warnings.map((warn, i) => (
                <div key={i} className="flex justify-between items-center pb-3 border-b border-slate-800 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-slate-300">{warn.name}</p>
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md">
                    Chậm {warn.daysInactive}
                  </span>
                </div>
              ))}
              {warnings.length === 0 && <p className="text-xs text-slate-500">Tất cả nhân viên đều học đúng tiến độ!</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
