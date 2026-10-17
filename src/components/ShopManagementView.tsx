import React, { useState } from 'react';
import { Branch, Staff, AttendanceRecord, LeaveRequest } from '../types';
import { ShiftSchedulingMatrix } from './ShiftSchedulingMatrix';
import { AttendanceTimesheetView } from './AttendanceTimesheetView';
import { BranchStaffDirectory } from './BranchStaffDirectory';
import { Calendar, Clock, Users, Building2 } from 'lucide-react';

interface ShopManagementViewProps {
  currentBranch: Branch;
  branches: Branch[];
  staffList: Staff[];
  attendanceLogs: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  currentUser: Staff;
  onRefreshStaff?: () => void;
  onRefreshAttendance?: () => void;
  onUpdateStaff?: (updatedStaff: Staff) => void;
  onApproveDispute?: (recordId: string, approverName: string) => Promise<void> | void;
  onRejectDispute?: (recordId: string, rejecterName: string, reason: string) => Promise<void> | void;
}

export const ShopManagementView: React.FC<ShopManagementViewProps> = ({
  currentBranch,
  branches,
  staffList,
  attendanceLogs,
  leaveRequests,
  currentUser,
  onRefreshStaff,
  onRefreshAttendance,
  onUpdateStaff,
  onApproveDispute,
  onRejectDispute,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'shifts' | 'attendance' | 'directory'>('shifts');

  // Lọc số lượng giải trình đang chờ duyệt của riêng shop này
  const pendingDisputesCount = attendanceLogs.filter(
    l => l.branchId === currentBranch.id && l.disputeStatus === 'PENDING'
  ).length;

  return (
    <div className="space-y-5">
      {/* Shop Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/30 p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
              <span>QUẢN LÝ NỘI BỘ {currentBranch.name.toUpperCase()}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                SHOP MANAGER
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Quản lý ca làm việc 15 ngày, duyệt chấm công GPS & danh bạ nhân sự tại điểm bán
            </p>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('shifts')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'shifts'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Lịch Chia Ca Shop</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('attendance')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'attendance'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Duyệt Công & Giải Trình</span>
            {pendingDisputesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {pendingDisputesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('directory')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'directory'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Đồng Nghiệp Chi Nhánh</span>
          </button>
        </div>
      </div>

      {/* Subtab Contents */}
      {activeSubTab === 'shifts' && (
        <ShiftSchedulingMatrix
          branches={branches}
          staffList={staffList}
          attendanceLogs={attendanceLogs}
          leaveRequests={leaveRequests}
          currentUser={currentUser}
          onRefreshStaff={onRefreshStaff}
          defaultBranchId={currentBranch.id}
          onRefreshAttendance={onRefreshAttendance}
        />
      )}

      {activeSubTab === 'attendance' && (
        <AttendanceTimesheetView
          branches={branches}
          staffList={staffList}
          attendanceLogs={attendanceLogs}
          onRefreshLogs={onRefreshAttendance}
          currentUser={currentUser}
          onApproveDispute={onApproveDispute}
          onRejectDispute={onRejectDispute}
          defaultBranchId={currentBranch.id}
        />
      )}

      {activeSubTab === 'directory' && (
        <BranchStaffDirectory
          currentBranch={currentBranch}
          currentUser={currentUser}
          staffList={staffList}
          attendanceLogs={attendanceLogs}
          leaveRequests={leaveRequests}
          onUpdateStaff={onUpdateStaff}
        />
      )}
    </div>
  );
};
