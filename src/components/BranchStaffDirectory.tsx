import React, { useState } from 'react';
import { Branch, Staff, UserRole, CompetencyScores, AttendanceRecord, LeaveRequest } from '../types';
import { Users, Search, Filter, Phone, ShieldCheck, Star, Building2, ChevronRight, UserCheck, Sparkles, Gift } from 'lucide-react';
import { StaffDetailModal } from './StaffDetailModal';
import { getStaffRealtimeStatus } from '../lib/staffStatus';

interface BranchStaffDirectoryProps {
  currentBranch: Branch;
  currentUser: Staff;
  staffList: Staff[];
  attendanceLogs?: AttendanceRecord[];
  leaveRequests?: LeaveRequest[];
  onUpdateScores?: (staffId: string, updatedScores: CompetencyScores) => void;
  onUpdateStaff?: (updatedStaff: Staff) => void;
}

export const BranchStaffDirectory: React.FC<BranchStaffDirectoryProps> = ({
  currentBranch,
  currentUser,
  staffList,
  attendanceLogs = [],
  leaveRequests = [],
  onUpdateScores,
  onUpdateStaff,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedColleague, setSelectedColleague] = useState<Staff | null>(null);

  // Filter staff by selected branch
  const branchStaff = staffList.filter(s => {
    // 1. Direct match by branch ID
    if (s.branchId && s.branchId === currentBranch.id) return true;
    
    // 2. Match by Branch Code & Employee code prefixes
    if (currentBranch.code === 'PK88_VANPHONG') {
      if (s.code === 'PK88-FOUNDER' || s.code === 'PK88-ADMIN') return true;
      if (s.code && ['PK88-034', 'PK88-035', 'PK88-036', 'PK88-037', 'PK88-038'].includes(s.code)) return true;
    }
    if (currentBranch.code === 'PK88_PHUKHUONG' || currentBranch.code === 'PK88_BENTRE_1') {
      if (s.code && ['PK88-001', 'PK88-002', 'PK88-003', 'PK88-004', 'PK88-005', 'PK88-006', 'PK88-007', 'PK88-008', 'PK88-009'].includes(s.code)) return true;
    }
    if (currentBranch.code === 'PK88_DONGKHOI' || currentBranch.code === 'PK88_BENTRE_2') {
      if (s.code && ['PK88-010', 'PK88-011', 'PK88-012', 'PK88-013'].includes(s.code)) return true;
    }
    if (currentBranch.code === 'PK88_VINHLONG') {
      if (s.code && ['PK88-014', 'PK88-015', 'PK88-016', 'PK88-017', 'PK88-018'].includes(s.code)) return true;
    }
    if (currentBranch.code === 'PK88_MYTHO') {
      if (s.code && ['PK88-019', 'PK88-020', 'PK88-021', 'PK88-022', 'PK88-023', 'PK88-024'].includes(s.code)) return true;
    }
    if (currentBranch.code === 'PK88_CANTHO') {
      if (s.code && ['PK88-025', 'PK88-026', 'PK88-027', 'PK88-028', 'PK88-029', 'PK88-030'].includes(s.code)) return true;
    }
    if (currentBranch.code === 'PK88_THUDUC') {
      if (s.code && ['PK88-031', 'PK88-032', 'PK88-033'].includes(s.code)) return true;
    }
    
    return false;
  });

  // Hierarchy Sorting
  const ROLE_PRIORITY: Record<string, number> = {
    founder: 1, admin: 2, sales_head: 3, accountant: 4, warehouse_accountant: 4, marketing: 5, media: 5, hr: 6, manager: 7, technician: 8, sales: 9
  };

  const sortedStaff = [...branchStaff].sort((a, b) => {
    const pA = ROLE_PRIORITY[a.role] || 99;
    const pB = ROLE_PRIORITY[b.role] || 99;
    return pA - pB;
  });

  // Filter by search & role
  const filteredStaff = sortedStaff.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone.includes(searchTerm);
    const matchesRole = roleFilter === 'ALL' || 
      s.role === roleFilter ||
      (roleFilter === 'accountant' && (s.role === 'accountant' || s.role === 'warehouse_accountant')) ||
      (roleFilter === 'marketing' && (s.role === 'marketing' || s.role === 'media'));
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-5 border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-extrabold shadow-lg shadow-cyan-500/10">
              <Users className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-100 uppercase tracking-wide">
                  ĐỘI NGŨ NHÂN SỰ CHI NHÁNH
                </h2>
                <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
                  {filteredStaff.length} Nhân Sự
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cửa hàng: <strong className="text-cyan-300 font-bold">{currentBranch.name}</strong> • {currentBranch.address}
              </p>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-2 text-xs">
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
              <ShieldCheck className={`w-4 h-4 ${currentBranch.isActive ? 'text-emerald-400' : 'text-rose-400'}`} />
              <span className="text-slate-300">Trạng thái: <strong className={currentBranch.isActive ? 'text-emerald-400' : 'text-rose-400'}>{currentBranch.isActive ? 'Đang Hoạt Động' : 'Tạm Đóng (Offline)'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-inner">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên đồng nghiệp hoặc SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60"
          />
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 pr-1">
            <Filter className="w-3.5 h-3.5 text-cyan-400" /> Vai trò:
          </span>

          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'manager', label: 'Quản lý' },
            { key: 'technician', label: 'Kỹ thuật' },
            { key: 'sales', label: 'Bán hàng' },
            { key: 'hr', label: 'HC - NS' },
            { key: 'accountant', label: 'Kế toán' },
            { key: 'marketing', label: 'Marketing' },
            { key: 'media', label: 'Media' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === f.key
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Directory Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((staffMember) => {
          const isMe = staffMember.id === currentUser.id || staffMember.phone === currentUser.phone;

          const roleDisplay = 
            staffMember.role === 'founder' ? 'Founder' :
            staffMember.role === 'admin' ? 'Admin System' :
            staffMember.role === 'sales_head' ? 'TP. Kinh Doanh' :
            staffMember.role === 'accountant' ? 'Kế Toán Trưởng' :
            staffMember.role === 'warehouse_accountant' ? 'Kế Toán Kho' :
            staffMember.role === 'marketing' ? 'Chuyên Viên Marketing' :
            staffMember.role === 'media' ? 'Chuyên Viên Media' :
            staffMember.role === 'hr' ? 'Chuyên Viên HC - NS' :
            staffMember.role === 'manager' ? 'Quản Lý Chi Nhánh' :
            staffMember.role === 'technician' ? 'Kỹ Thuật Viên' : 'Nhân Viên Bán Hàng';

          const roleColor = 
            staffMember.role === 'founder' || staffMember.role === 'admin' ? 'from-purple-500 to-indigo-600 border-purple-400 text-purple-200' :
            staffMember.role === 'sales_head' ? 'from-amber-500 to-orange-600 border-amber-400 text-amber-200' :
            staffMember.role === 'accountant' ? 'from-emerald-500 to-teal-600 border-emerald-400 text-emerald-200' :
            staffMember.role === 'warehouse_accountant' ? 'from-teal-500 to-emerald-600 border-teal-400 text-teal-200' :
            staffMember.role === 'marketing' ? 'from-pink-500 to-rose-600 border-pink-400 text-pink-200' :
            staffMember.role === 'media' ? 'from-fuchsia-500 to-rose-500 border-fuchsia-400 text-fuchsia-200' :
            staffMember.role === 'hr' ? 'from-sky-500 to-cyan-600 border-sky-400 text-sky-200' :
            staffMember.role === 'technician' ? 'from-blue-500 to-cyan-600 border-blue-400 text-blue-200' :
            'from-cyan-500 to-blue-600 border-cyan-400 text-cyan-200';

          const avgScore = Math.round(
            ((staffMember.competencyScores?.expertise || 92) +
             (staffMember.competencyScores?.discipline || 96) +
             (staffMember.competencyScores?.attitude || 98) +
             (staffMember.competencyScores?.kpi || 88) +
             (staffMember.competencyScores?.lms || 94)) / 5
          );

          const isBday = (() => {
            if (!staffMember.birthDate) return false;
            let d: number | null = null, m: number | null = null;
            if (staffMember.birthDate.includes('-')) {
              const p = staffMember.birthDate.split('-');
              if (p.length === 3) { m = parseInt(p[1], 10); d = parseInt(p[2], 10); }
            } else if (staffMember.birthDate.includes('/')) {
              const p = staffMember.birthDate.split('/');
              if (p.length === 3) { m = parseInt(p[1], 10); d = parseInt(p[0], 10); }
            }
            if (!d || !m) return false;
            const now = new Date();
            return d === now.getDate() && m === (now.getMonth() + 1);
          })();

          return (
            <div
              key={staffMember.id}
              onClick={() => setSelectedColleague(staffMember)}
              className={`group relative glass-card rounded-2xl p-4 border transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl ${
                isMe
                  ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/30 border-amber-500/50 shadow-amber-500/10 ring-1 ring-amber-500/40'
                  : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-cyan-500/40'
              }`}
            >
              {/* Top Row: Avatar & Badges */}
              <div className="flex items-start gap-3.5">
                <div className="relative w-14 h-14 rounded-2xl bg-slate-950 border-2 border-slate-700/80 overflow-hidden flex-shrink-0 shadow-md group-hover:border-cyan-400 transition-colors">
                  <img
                    src={staffMember.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(staffMember.fullName)}&background=0284c7&color=fff&size=150&bold=true`}
                    alt={staffMember.fullName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(staffMember.fullName)}&background=0284c7&color=fff&size=150&bold=true`;
                    }}
                  />
                  {isMe && (
                    <span className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-slate-950" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-extrabold bg-gradient-to-r ${roleColor} uppercase tracking-wider`}>
                      {roleDisplay}
                    </span>

                    <div className="flex items-center gap-1">
                      {isBday && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-pink-300 border border-pink-500/50 rounded-full text-[9px] font-black animate-pulse shadow-sm shadow-pink-500/20" title="Sinh nhật hôm nay!">
                          <Gift className="w-3 h-3 text-pink-400 fill-pink-400/40 animate-bounce" /> 🎂
                        </span>
                      )}

                      {isMe && (
                        <span className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded-full text-[9px] font-black uppercase">
                          BẠN
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-extrabold text-white truncate group-hover:text-cyan-300 transition-colors">
                    {staffMember.fullName}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 truncate mt-0.5 gap-1">
                    <span className="truncate">SĐT: <strong className="text-slate-200">{staffMember.phone}</strong></span>
                    {(() => {
                      const status = getStaffRealtimeStatus(staffMember, attendanceLogs, leaveRequests);
                      return (
                        <span 
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold border shrink-0 inline-flex items-center gap-1 ${status.colorClass}`}
                          title={status.description}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                          <span>{status.label}</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Middle Section: Competency & Status Footer */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-[11px] text-slate-300 font-semibold">Năng lực:</span>
                  <span className="text-[11px] font-mono font-black text-cyan-400">{avgScore}%</span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${staffMember.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all"
                    title={`Gọi điện cho ${staffMember.fullName}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>

                  <span className="text-[10px] text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-bold">
                    <span>Xem Hồ Sơ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-2 text-slate-600" />
          <p className="text-xs font-bold">Không tìm thấy nhân sự phù hợp theo từ khóa tìm kiếm.</p>
        </div>
      )}

      {/* Staff Detail Profile Modal */}
      <StaffDetailModal
        staff={selectedColleague}
        currentUser={currentUser}
        branch={currentBranch}
        branches={[currentBranch]}
        attendanceLogs={attendanceLogs}
        canEdit={
          currentUser?.role === 'founder' || 
          currentUser?.role === 'admin' || 
          currentUser?.role === 'hr' || 
          (selectedColleague ? (selectedColleague.id === currentUser?.id || selectedColleague.phone === currentUser?.phone) : false)
        }
        onClose={() => setSelectedColleague(null)}
        onUpdateScores={onUpdateScores}
        onUpdateStaff={(updatedStaff) => {
          setSelectedColleague(updatedStaff);
          if (onUpdateStaff) onUpdateStaff(updatedStaff);
        }}
      />
    </div>
  );
};
