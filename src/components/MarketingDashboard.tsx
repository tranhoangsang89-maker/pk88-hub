import React, { useState } from 'react';
import { Branch, MarketingPost } from '../types';
import { TrendingUp, Award, AlertTriangle, ExternalLink, Facebook, Youtube, MessageCircle, Link as LinkIcon, Sparkles, Megaphone } from 'lucide-react';
import { AIContentStudioModal } from './AIContentStudioModal';

interface MarketingDashboardProps {
  branches: Branch[];
  posts: MarketingPost[];
  currentBranch: Branch;
  onOpenSubmitModal: () => void;
}

export function MarketingDashboard({ branches, posts, currentBranch, onOpenSubmitModal }: MarketingDashboardProps) {
  const [showAIModal, setShowAIModal] = useState(false);
  
  // Today's date filter
  const today = new Date().toISOString().split('T')[0];
  const todayPosts = posts.filter(post => post.created_at.startsWith(today));

  // KPIs
  const totalPostsToday = todayPosts.length;
  
  // Platform stats
  const platformCounts = todayPosts.reduce((acc, post) => {
    acc[post.platform] = (acc[post.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Branch stats
  const branchCounts = todayPosts.reduce((acc, post) => {
    acc[post.branch_id] = (acc[post.branch_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topBranchId = Object.entries(branchCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topBranchName = branches.find(b => b.id === topBranchId)?.name || 'N/A';

  const missedBranches = branches.filter(b => (branchCounts[b.id] || 0) < 2);

  const getPlatformIcon = (platform: string, className = "w-4 h-4") => {
    switch (platform) {
      case 'facebook': return <Facebook className={`${className} text-blue-500`} />;
      case 'tiktok': return <svg className={`${className} text-slate-200`} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 15.68a6.34 6.34 0 0 0 6.27 6.36 6.3 6.3 0 0 0 6.39-5.91 6.9 6.9 0 0 0 .14-1.37V9.58a8.3 8.3 0 0 0 4.2 1.53V7.63a5.41 5.41 0 0 1-2.41-.94z"/></svg>;
      case 'youtube': return <Youtube className={`${className} text-red-500`} />;
      case 'zalo': return <MessageCircle className={`${className} text-blue-400`} />;
      default: return <LinkIcon className={className} />;
    }
  };

  const platformNames: Record<string, string> = {
    facebook: 'Facebook',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    zalo: 'Zalo'
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* AI Modal */}
      <AIContentStudioModal 
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        currentBranch={currentBranch}
        onOpenSubmitPost={() => {
          setShowAIModal(false);
          onOpenSubmitModal();
        }}
      />

      {/* KPI Header & Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-blue-500" />
          Hiệu Suất Marketing
        </h2>
        <button
          onClick={() => setShowAIModal(true)}
          className="w-full md:w-auto px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 transition-all border border-purple-500/50"
        >
          <Sparkles className="w-5 h-5" />
          ✨ AI Content Studio (Tạo Kịch Bản & Bài Viết)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/30">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-400">Tổng Bài Hôm Nay</div>
            <div className="text-2xl font-bold text-slate-100">{totalPostsToday}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-500/30">
            {getPlatformIcon(topPlatform, "w-6 h-6")}
          </div>
          <div>
            <div className="text-sm text-slate-400">Kênh Dẫn Đầu</div>
            <div className="text-lg font-bold text-slate-100 capitalize">{platformNames[topPlatform] || 'N/A'}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-sky-500/20 text-sky-500 rounded-xl flex items-center justify-center border border-sky-500/30">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-400">Shop Dẫn Đầu</div>
            <div className="text-sm font-bold text-slate-100 line-clamp-1">{topBranchName}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-500/20 text-rose-500 rounded-xl flex items-center justify-center border border-rose-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-slate-400">Shop Chưa Đạt KPI</div>
            <div className="text-2xl font-bold text-rose-500">{missedBranches.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Matrix Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-100">Bảng Ma Trận Đăng Bài Hôm Nay (KPI: 2 Bài/Shop)</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Chi nhánh</th>
                  <th className="px-4 py-3 font-medium text-center">Facebook</th>
                  <th className="px-4 py-3 font-medium text-center">TikTok</th>
                  <th className="px-4 py-3 font-medium text-center">Zalo</th>
                  <th className="px-4 py-3 font-medium text-center">YouTube</th>
                  <th className="px-4 py-3 font-medium text-center">Tổng</th>
                  <th className="px-4 py-3 font-medium text-center">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {branches.map(branch => {
                  const branchPosts = todayPosts.filter(p => p.branch_id === branch.id);
                  const fbCount = branchPosts.filter(p => p.platform === 'facebook').length;
                  const ttCount = branchPosts.filter(p => p.platform === 'tiktok').length;
                  const zlCount = branchPosts.filter(p => p.platform === 'zalo').length;
                  const ytCount = branchPosts.filter(p => p.platform === 'youtube').length;
                  const total = branchPosts.length;
                  
                  const isZero = total === 0;
                  const isReached = total >= 2;

                  return (
                    <tr key={branch.id} className={`hover:bg-slate-800/30 transition-colors ${isZero ? 'bg-rose-950/10' : ''}`}>
                      <td className="px-4 py-3 font-medium text-slate-200">
                        {branch.name.replace('Phụ Kiện 88 - ', '')}
                        {isZero && <span className="ml-2 inline-flex w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-400">{fbCount > 0 ? <span className="text-blue-400 font-bold">{fbCount}</span> : '-'}</td>
                      <td className="px-4 py-3 text-center text-slate-400">{ttCount > 0 ? <span className="text-slate-200 font-bold">{ttCount}</span> : '-'}</td>
                      <td className="px-4 py-3 text-center text-slate-400">{zlCount > 0 ? <span className="text-blue-300 font-bold">{zlCount}</span> : '-'}</td>
                      <td className="px-4 py-3 text-center text-slate-400">{ytCount > 0 ? <span className="text-red-400 font-bold">{ytCount}</span> : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${isReached ? 'text-emerald-400' : isZero ? 'text-rose-500' : 'text-amber-500'}`}>
                          {total}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isReached ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20 text-xs">
                            🟢 Vượt chỉ tiêu
                          </span>
                        ) : isZero ? (
                          <span className="inline-flex items-center gap-1 text-rose-500 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 text-xs font-bold">
                            🔴 Chưa đăng bài
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 text-xs">
                            🟡 Đang thực hiện
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-800 bg-slate-800/50">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Live Feed Bài Đăng Mới
            </h3>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
            {posts.length === 0 ? (
              <div className="text-center text-slate-500 py-10">Chưa có bài đăng nào.</div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-700">
                        {getPlatformIcon(post.platform)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{post.author_name}</div>
                        <div className="text-[10px] text-slate-500">
                          {branches.find(b => b.id === post.branch_id)?.name.replace('Phụ Kiện 88 - ', '')} • {new Date(post.created_at).toLocaleTimeString('vi-VN')}
                        </div>
                      </div>
                    </div>
                  </div>
                  <a
                    href={post.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors border border-slate-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    [Xem bài viết]
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
