import React from 'react';
import { Staff, Branch, ShiftAssignment } from '../types';
import { getAllAssignments, getBiWeeklyDates } from '../lib/shiftService';
import { Calendar, Clock, MapPin, X, Sun, Moon, Zap, AlertCircle } from 'lucide-react';

interface PersonalShiftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Staff;
  branches: Branch[];
}

export const PersonalShiftsModal: React.FC<PersonalShiftsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  branches
}) => {
  if (!isOpen) return null;

  // Lấy 15 ngày của chu kỳ hiện tại (hoặc 15 ngày tới từ hôm nay)
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const cycle = today.getDate() <= 15 ? 'cycle1' : 'cycle2';
  
  const rawDates = getBiWeeklyDates(year, month, cycle);
  const daysVN = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const cycleDays = rawDates.map(dateStr => {
    const d = new Date(dateStr + 'T00:00:00');
    return {
      dateString: dateStr,
      dayOfWeekVN: daysVN[d.getDay()],
      displayDate: `${d.getDate()}/${d.getMonth() + 1}`
    };
  });

  // Lấy tất cả phân ca của nhân sự này
  let allAssignments: ShiftAssignment[] = [];
  try {
    const raw = getAllAssignments();
    allAssignments = raw.filter(a => {
      const matchId = a.staffId === currentUser.id;
      const matchPhone = !!a.staffPhone && !!currentUser.phone && a.staffPhone.trim() === currentUser.phone.trim();
      const matchName = !!a.staffName && !!currentUser.fullName && a.staffName.trim().toLowerCase() === currentUser.fullName.trim().toLowerCase();
      return matchId || matchPhone || matchName;
    });
  } catch (e) {
    console.error('Error fetching personal assignments:', e);
  }

  const getBranchName = (assignment?: ShiftAssignment) => {
    if (assignment?.workingBranchName) return assignment.workingBranchName;
    if (assignment?.workingBranchId) {
      const found = branches.find(b => b.id === assignment.workingBranchId);
      if (found) return found.name;
    }
    const home = branches.find(b => b.id === currentUser.branchId);
    return home ? home.name : 'Chi nhánh';
  };

  const getShiftBadge = (assignment?: ShiftAssignment) => {
    if (!assignment || assignment.status === 'OFF') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
          Nghỉ OFF
        </span>
      );
    }

    if (assignment.shiftCode === 'CA_SANG') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <Sun className="w-3.5 h-3.5" />
          <span>Ca Sáng (08:00 - 14:00)</span>
        </span>
      );
    }

    if (assignment.shiftCode === 'CA_CHIEU') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
          <Moon className="w-3.5 h-3.5" />
          <span>Ca Chiều (14:00 - 21:30)</span>
        </span>
      );
    }

    if (assignment.shiftCode === 'HANH_CHINH') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
          <Clock className="w-3.5 h-3.5" />
          <span>Hành Chính (08:00 - 17:30)</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
        <Zap className="w-3.5 h-3.5" />
        <span>Tăng Cường ({assignment.startTime} - {assignment.endTime})</span>
      </span>
    );
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                <span>Lịch Chia Ca Cá Nhân 15 Ngày</span>
              </h3>
              <p className="text-xs text-slate-400">
                Nhân viên: <strong className="text-cyan-400">{currentUser.fullName}</strong> ({currentUser.phone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 15-Day List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-800/50">
          {cycleDays.map(item => {
            const assignment = allAssignments.find(a => a.date === item.dateString);
            const isToday = item.dateString === todayStr;

            return (
              <div 
                key={item.dateString}
                className={`pt-2.5 first:pt-0 flex items-center justify-between p-3 rounded-2xl transition-all ${
                  isToday 
                    ? 'bg-cyan-500/10 border border-cyan-500/40 shadow-inner' 
                    : 'bg-slate-950/50 hover:bg-slate-800/40 border border-slate-800/50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-extrabold ${isToday ? 'text-cyan-400' : 'text-slate-200'}`}>
                      {item.dayOfWeekVN}, {item.displayDate}
                    </span>
                    {isToday && (
                      <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black uppercase tracking-wider animate-pulse">
                        Hôm nay
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{getBranchName(assignment)}</span>
                    {assignment?.notes && (
                      <span className="text-amber-400/90 font-medium">({assignment.notes})</span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {getShiftBadge(assignment)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Nếu cần đổi ca đột xuất, vui lòng bấm Xin Nghỉ Phép (AI Chị 8)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
