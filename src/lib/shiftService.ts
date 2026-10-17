import { ShiftDefinition, ShiftAssignment, ShiftSwapRequest, Staff, Branch } from '../types';
import { supabase } from './supabase';
import { REAL_STAFF, INITIAL_BRANCHES } from './mockData';

const SHIFT_DEFS_STORAGE_KEY = 'pk88_shift_definitions';
const SHIFT_ASSIGNMENTS_STORAGE_KEY = 'pk88_shift_assignments';
const SHIFT_SWAPS_STORAGE_KEY = 'pk88_shift_swaps';

// 1. COMPANY DEFAULT SHIFTS (Chuẩn toàn hệ thống Phụ Kiện 88)
export const DEFAULT_COMPANY_SHIFTS: ShiftDefinition[] = [
  {
    id: 'def_ca_sang_standard',
    branchId: null,
    code: 'CA_SANG',
    name: 'Ca Sáng Chuẩn',
    startTime: '07:00',
    endTime: '15:30',
    hours: 8.5,
    color: 'emerald',
    isCompanyDefault: true,
    notes: 'Ca chuẩn Phụ Kiện 88 (Giao ca 13:30 - 15:30 cùng ca chiều)'
  },
  {
    id: 'def_ca_chieu_standard',
    branchId: null,
    code: 'CA_CHIEU',
    name: 'Ca Chiều Chuẩn',
    startTime: '13:30',
    endTime: '22:00',
    hours: 8.5,
    color: 'indigo',
    isCompanyDefault: true,
    notes: 'Ca chuẩn Phụ Kiện 88 (Giao ca 13:30 - 15:30 cùng ca sáng)'
  },
  {
    id: 'def_ca_van_phong',
    branchId: null,
    code: 'HANH_CHINH',
    name: 'Ca Hành Chính VP',
    startTime: '07:30',
    endTime: '17:30',
    hours: 8.0,
    color: 'sky',
    isCompanyDefault: true,
    notes: 'Dành cho Khối Văn phòng, Kế toán, HR, Marketing (Nghỉ trưa 2h: 11:30 - 13:30)'
  },
  {
    id: 'def_vp_thu7',
    branchId: null,
    code: 'VP_THU_7',
    name: 'VP Thứ 7',
    startTime: '07:30',
    endTime: '15:30',
    hours: 8.0,
    color: 'sky',
    isCompanyDefault: true,
    notes: 'Ca làm việc Thứ 7 Khối Văn Phòng (07:30 - 15:30)'
  },
  {
    id: 'def_ca_gay_standard',
    branchId: null,
    code: 'CA_GAY',
    name: 'Ca Gãy (07h-12h & 17h-22h)',
    startTime: '07:00',
    endTime: '22:00',
    hours: 10.0,
    color: 'amber',
    isCompanyDefault: true,
    notes: 'Ca gãy bán lẻ PK88 (Sáng 07:00 - 12:00, Chiều/Tối 17:00 - 22:00. Về nhà nghỉ 12:00 - 17:00)'
  },
  {
    id: 'def_ca_trua_custom',
    branchId: null,
    code: 'CA_TRUA',
    name: 'Ca Trưa (KiotViet)',
    startTime: '12:00',
    endTime: '22:00',
    hours: 10.0,
    color: 'purple',
    isCompanyDefault: false,
    notes: 'Ca trưa 10 tiếng (áp dụng thực tế tại Thủ Đức)'
  },
  {
    id: 'def_ca_thu_viec',
    branchId: null,
    code: 'CA_THU_VIEC',
    name: 'Ca Thử Việc 1',
    startTime: '07:00',
    endTime: '15:00',
    hours: 8.0,
    color: 'amber',
    isCompanyDefault: false,
    notes: 'Ca 8 tiếng cho nhân sự thử việc (KiotViet)'
  },
  {
    id: 'def_ca_tc_sang',
    branchId: null,
    code: 'TANG_CUONG',
    name: 'Ca Tăng Cường Sáng',
    startTime: '07:00',
    endTime: '12:00',
    hours: 5.0,
    color: 'orange',
    isCompanyDefault: false,
    notes: 'Ca tăng cường nửa ngày'
  },
  {
    id: 'def_ca_tc_toi',
    branchId: null,
    code: 'TANG_CUONG',
    name: 'Ca Tăng Cường Tối',
    startTime: '15:00',
    endTime: '22:00',
    hours: 7.0,
    color: 'rose',
    isCompanyDefault: false,
    notes: 'Ca tăng cường buổi tối'
  }
];

// Helper to calculate hours between HH:mm and HH:mm
export function calculateShiftHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 8.5;
  // Ca Hành Chính VP: 07:30 - 17:30 (Trừ 2 tiếng nghỉ trưa 11:30 - 13:30 => 8.0 tiếng)
  if (startTime === '07:30' && endTime === '17:30') return 8.0;
  // Ca VP Thứ 7: 07:30 - 15:30 => 8.0 tiếng
  if (startTime === '07:30' && endTime === '15:30') return 8.0;
  // Ca Gãy PK88: 07:00 - 12:00 (5h) + 17:00 - 22:00 (5h) => 10.0 tiếng
  if (startTime === '07:00' && endTime === '22:00') return 10.0;

  const [sH, sM] = startTime.split(':').map(Number);
  const [eH, eM] = endTime.split(':').map(Number);
  let startMinutes = sH * 60 + sM;
  let endMinutes = eH * 60 + eM;
  if (endMinutes < startMinutes) {
    // Cross midnight
    endMinutes += 24 * 60;
  }
  return Math.round(((endMinutes - startMinutes) / 60) * 10) / 10;
}

// Read Shift Definitions
export function getShiftDefinitions(branchId?: string): ShiftDefinition[] {
  try {
    const raw = localStorage.getItem(SHIFT_DEFS_STORAGE_KEY);
    let defs: ShiftDefinition[] = raw ? JSON.parse(raw) : [];
    if (!defs || defs.length === 0) {
      defs = DEFAULT_COMPANY_SHIFTS;
      localStorage.setItem(SHIFT_DEFS_STORAGE_KEY, JSON.stringify(defs));
    } else {
      let updated = false;

      // Loại bỏ các ca mà HR/Admin đã xóa vào blacklist
      try {
        const rawDeleted = localStorage.getItem('pk88_deleted_shift_def_ids') || '[]';
        const deletedList: string[] = JSON.parse(rawDeleted);
        if (Array.isArray(deletedList) && deletedList.length > 0) {
          const filtered = defs.filter(d => !deletedList.includes(d.id));
          if (filtered.length !== defs.length) {
            defs = filtered;
            updated = true;
          }
        }
      } catch (e) {}

      // Đồng bộ Ca Hành Chính VP chuẩn 8 tiếng (nghỉ trưa 2h)
      defs = defs.map(d => {
        if ((d.code === 'HANH_CHINH' || d.id === 'def_ca_van_phong') && d.hours !== 8.0) {
          updated = true;
          return { ...d, hours: 8.0, notes: 'Nghỉ trưa 2 tiếng (11:30 - 13:30)' };
        }
        return d;
      });

      if (updated) {
        localStorage.setItem(SHIFT_DEFS_STORAGE_KEY, JSON.stringify(defs));
      }
    }
    if (branchId) {
      return defs.filter(d => !d.branchId || d.branchId === branchId);
    }
    return defs;
  } catch (e) {
    return DEFAULT_COMPANY_SHIFTS;
  }
}

// Save Shift Definition
export function saveShiftDefinition(def: ShiftDefinition): ShiftDefinition[] {
  const current = getShiftDefinitions();
  const index = current.findIndex(d => d.id === def.id);
  let updated: ShiftDefinition[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = def;
  } else {
    updated = [def, ...current];
  }
  localStorage.setItem(SHIFT_DEFS_STORAGE_KEY, JSON.stringify(updated));
  syncShiftDefinitionsToCloud(updated);
  return updated;
}

// Delete Shift Definition (Dành cho HR & Admin xóa bớt các khung ca thừa/rối mắt)
export function deleteShiftDefinition(defId: string): ShiftDefinition[] {
  const current = getShiftDefinitions();
  const updated = current.filter(d => d.id !== defId);
  localStorage.setItem(SHIFT_DEFS_STORAGE_KEY, JSON.stringify(updated));

  // Ghi nhận ID đã xóa để không tự phục hồi ngầm
  try {
    const rawDeleted = localStorage.getItem('pk88_deleted_shift_def_ids') || '[]';
    const deletedList: string[] = JSON.parse(rawDeleted);
    if (!deletedList.includes(defId)) {
      deletedList.push(defId);
      localStorage.setItem('pk88_deleted_shift_def_ids', JSON.stringify(deletedList));
    }
  } catch (e) {}

  syncShiftDefinitionsToCloud(updated);
  return updated;
}

// Khôi phục toàn bộ danh sách ca mặc định công ty
export function resetDefaultShiftDefinitions(): ShiftDefinition[] {
  try {
    localStorage.removeItem('pk88_deleted_shift_def_ids');
  } catch (e) {}
  localStorage.setItem(SHIFT_DEFS_STORAGE_KEY, JSON.stringify(DEFAULT_COMPANY_SHIFTS));
  syncShiftDefinitionsToCloud(DEFAULT_COMPANY_SHIFTS);
  return DEFAULT_COMPANY_SHIFTS;
}

// Generate Bi-weekly Dates
export function getBiWeeklyDates(year: number, month: number, cycle: 'cycle1' | 'cycle2'): string[] {
  // cycle1: 01 -> 15
  // cycle2: 16 -> end of month
  const dates: string[] = [];
  const monthStr = String(month).padStart(2, '0');
  
  if (cycle === 'cycle1') {
    for (let day = 1; day <= 15; day++) {
      const dayStr = String(day).padStart(2, '0');
      dates.push(`${year}-${monthStr}-${dayStr}`);
    }
  } else {
    const lastDay = new Date(year, month, 0).getDate();
    for (let day = 16; day <= lastDay; day++) {
      const dayStr = String(day).padStart(2, '0');
      dates.push(`${year}-${monthStr}-${dayStr}`);
    }
  }
  return dates;
}

// Seed initial assignments (Disabled: User requested 100% clean state for real testing)
export function seedInitialAssignments(staffList: Staff[] = [], branches: Branch[] = []): ShiftAssignment[] {
  return [];
}

export const SHIFT_CLOUD_RECORD_ID = '00000000-0000-0000-0000-000000000002';
export const SHIFT_DEFS_CLOUD_RECORD_ID = '00000000-0000-0000-0000-000000000003';

// Sync shift assignments to Supabase Cloud DB
export async function syncShiftAssignmentsToCloud(assignments: ShiftAssignment[]): Promise<boolean> {
  try {
    const { error } = await supabase.from('job_applications').upsert({
      id: SHIFT_CLOUD_RECORD_ID,
      branch_id: 'SYSTEM_CONFIG',
      full_name: 'PK88_SHIFT_ASSIGNMENTS_CLOUD',
      phone: '0988888888',
      role_applied: 'CONFIG',
      status: 'pending',
      notes: JSON.stringify(assignments)
    });
    if (error) {
      console.warn('Lỗi lưu lịch làm việc lên Supabase Cloud:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception đồng bộ lịch lên Supabase:', err);
    return false;
  }
}

// Fetch shift assignments from Supabase Cloud DB
export async function fetchShiftAssignmentsFromCloud(): Promise<ShiftAssignment[] | null> {
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .select('notes')
      .eq('id', SHIFT_CLOUD_RECORD_ID)
      .maybeSingle();

    if (error || !data || !data.notes) {
      return null;
    }

    const parsed: ShiftAssignment[] = JSON.parse(data.notes);
    if (Array.isArray(parsed) && parsed.length > 0) {
      localStorage.setItem(SHIFT_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    }
    return null;
  } catch (err) {
    console.warn('Lỗi đọc lịch làm việc từ Supabase Cloud:', err);
    return null;
  }
}

// Sync shift definitions to Supabase Cloud DB
export async function syncShiftDefinitionsToCloud(defs: ShiftDefinition[]): Promise<boolean> {
  try {
    const rawDeleted = localStorage.getItem('pk88_deleted_shift_def_ids') || '[]';
    const payload = {
      defs,
      deletedIds: JSON.parse(rawDeleted)
    };
    const { error } = await supabase.from('job_applications').upsert({
      id: SHIFT_DEFS_CLOUD_RECORD_ID,
      branch_id: 'SYSTEM_CONFIG',
      full_name: 'PK88_SHIFT_DEFINITIONS_CLOUD',
      phone: '0988888888',
      role_applied: 'CONFIG',
      status: 'pending',
      notes: JSON.stringify(payload)
    });
    if (error) {
      console.warn('Lỗi lưu danh sách khung ca lên Supabase Cloud:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exception đồng bộ khung ca lên Supabase:', err);
    return false;
  }
}

// Fetch shift definitions from Supabase Cloud DB
export async function fetchShiftDefinitionsFromCloud(): Promise<ShiftDefinition[] | null> {
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .select('notes')
      .eq('id', SHIFT_DEFS_CLOUD_RECORD_ID)
      .maybeSingle();

    if (error || !data || !data.notes) {
      return null;
    }

    const parsed = JSON.parse(data.notes);
    let cloudDefs: ShiftDefinition[] = [];
    if (Array.isArray(parsed)) {
      cloudDefs = parsed;
    } else if (parsed && Array.isArray(parsed.defs)) {
      cloudDefs = parsed.defs;
      if (Array.isArray(parsed.deletedIds)) {
        localStorage.setItem('pk88_deleted_shift_def_ids', JSON.stringify(parsed.deletedIds));
      }
    }

    if (cloudDefs.length > 0) {
      localStorage.setItem(SHIFT_DEFS_STORAGE_KEY, JSON.stringify(cloudDefs));
      return cloudDefs;
    }
    return null;
  } catch (err) {
    console.warn('Lỗi đọc danh sách ca từ Supabase Cloud:', err);
    return null;
  }
}

// Get all assignments with localStorage persistence & Cloud fallback
export function getAllAssignments(staffList: Staff[] = [], branches: Branch[] = []): ShiftAssignment[] {
  try {
    const raw = localStorage.getItem(SHIFT_ASSIGNMENTS_STORAGE_KEY);
    if (raw) {
      const parsed: ShiftAssignment[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return [];
  } catch (e) {
    return [];
  }
}

// Clear all assignments
export function clearAllAssignments(): ShiftAssignment[] {
  localStorage.removeItem(SHIFT_ASSIGNMENTS_STORAGE_KEY);
  syncShiftAssignmentsToCloud([]);
  return [];
}

// Clear assignments for a specific branch
export function clearBranchAssignments(branchId: string, cycleDates?: string[]): ShiftAssignment[] {
  const all = getAllAssignments();
  let remaining: ShiftAssignment[];
  if (cycleDates && cycleDates.length > 0) {
    remaining = all.filter(a => !(a.workingBranchId === branchId && cycleDates.includes(a.date)));
  } else {
    remaining = all.filter(a => a.workingBranchId !== branchId);
  }
  localStorage.setItem(SHIFT_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(remaining));
  syncShiftAssignmentsToCloud(remaining);
  return remaining;
}

// Delete a specific assignment by ID
export function deleteAssignment(assignmentId: string): ShiftAssignment[] {
  const all = getAllAssignments();
  const remaining = all.filter(a => a.id !== assignmentId);
  localStorage.setItem(SHIFT_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(remaining));
  syncShiftAssignmentsToCloud(remaining);
  return remaining;
}

// Clear all assignments for a specific staff member at a branch (e.g. remove cross-branch or clear their row)
export function clearStaffAssignmentsAtBranch(
  staff: { id?: string; phone?: string; fullName?: string },
  branchId: string,
  cycleDates?: string[]
): ShiftAssignment[] {
  const all = getAllAssignments();
  const id = staff.id;
  const phone = staff.phone?.trim();
  const name = staff.fullName?.trim().toLowerCase();

  const remaining = all.filter(a => {
    const isTargetStaff =
      (id && a.staffId === id) ||
      (phone && a.staffPhone && a.staffPhone.trim() === phone) ||
      (name && a.staffName && a.staffName.trim().toLowerCase() === name);
    const isTargetBranch = a.workingBranchId === branchId;
    const isInCycle = cycleDates && cycleDates.length > 0 ? cycleDates.includes(a.date) : true;
    if (isTargetStaff && isTargetBranch && isInCycle) {
      return false; // Remove
    }
    return true; // Keep
  });

  localStorage.setItem(SHIFT_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(remaining));
  syncShiftAssignmentsToCloud(remaining);
  return remaining;
}

// Save or Update an Assignment
export function saveAssignment(assignment: ShiftAssignment): ShiftAssignment[] {
  const all = getAllAssignments();
  const index = all.findIndex(a => a.id === assignment.id);
  let updated: ShiftAssignment[];
  if (index >= 0) {
    updated = [...all];
    updated[index] = assignment;
  } else {
    updated = [assignment, ...all];
  }
  localStorage.setItem(SHIFT_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(updated));
  syncShiftAssignmentsToCloud(updated);
  return updated;
}

// Batch Auto-fill for Bi-weekly Cycle (Đổ ca 1 chạm cho 15 ngày)
export function autoFillBiWeeklyCycle(params: {
  staff: Staff;
  shiftDef: ShiftDefinition;
  cycle: 'cycle1' | 'cycle2';
  year: number;
  month: number;
  workingBranch: Branch;
  offDaysOfWeek: number[]; // e.g. [2] for Tuesday
  isCrossBranch?: boolean;
}): ShiftAssignment[] {
  const { staff, shiftDef, cycle, year, month, workingBranch, offDaysOfWeek, isCrossBranch } = params;
  const dates = getBiWeeklyDates(year, month, cycle);
  const all = getAllAssignments();

  const newAssignments: ShiftAssignment[] = dates.map(dateStr => {
    const dateObj = new Date(dateStr);
    const dayOfWeek = dateObj.getDay();
    const isOff = offDaysOfWeek.includes(dayOfWeek);

    return {
      id: `asg_${staff.id}_${dateStr}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      staffId: staff.id,
      staffName: staff.fullName,
      staffPhone: staff.phone,
      staffRole: staff.role,
      homeBranchId: staff.homeBranchId || staff.branchId,
      workingBranchId: workingBranch.id,
      workingBranchName: workingBranch.name,
      date: dateStr,
      shiftDefinitionId: shiftDef.id,
      shiftCode: shiftDef.code,
      shiftName: shiftDef.name,
      startTime: shiftDef.startTime,
      endTime: shiftDef.endTime,
      hours: isOff ? 0 : shiftDef.hours,
      status: isOff ? 'OFF' : 'SCHEDULED',
      isCrossBranch: isCrossBranch || (staff.branchId !== workingBranch.id),
      notes: isCrossBranch ? `✈️ Tăng cường điều động sang ${workingBranch.name}` : undefined
    };
  });

  // Remove existing assignments for this staff in these dates and replace
  const dateSet = new Set(dates);
  const remaining = all.filter(a => !(a.staffId === staff.id && dateSet.has(a.date)));
  const combined = [...remaining, ...newAssignments];

  localStorage.setItem(SHIFT_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(combined));
  syncShiftAssignmentsToCloud(combined);
  return combined;
}

// Báo Nghỉ Ốm Đột Xuất (Biến thành OPEN_SHIFT có thưởng nóng)
export function reportSickLeaveAndOpenShift(assignmentId: string, reason: string, bountyBonus: number = 50000): ShiftAssignment[] {
  const all = getAllAssignments();
  const target = all.find(a => a.id === assignmentId);
  if (!target) return all;

  target.status = 'OPEN_SHIFT';
  target.notes = `⚠️ Nghỉ ốm đột xuất: ${reason}. Cần người gánh ca!`;
  target.bountyBonus = bountyBonus;

  localStorage.setItem(SHIFT_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(all));
  syncShiftAssignmentsToCloud(all);
  return [...all];
}

// Nhận Ca Thần Tốc (Claim Open Shift)
export function claimOpenShift(assignmentId: string, claimingStaff: Staff): ShiftAssignment[] {
  const all = getAllAssignments();
  const target = all.find(a => a.id === assignmentId);
  if (!target) return all;

  const originalStaffName = target.staffName;
  target.originalStaffId = target.staffId;
  target.staffId = claimingStaff.id;
  target.staffName = claimingStaff.fullName;
  target.staffPhone = claimingStaff.phone;
  target.staffRole = claimingStaff.role;
  target.status = 'SCHEDULED';
  target.notes = `🎯 Đã gánh ca thay cho ${originalStaffName} (+${(target.bountyBonus || 50000).toLocaleString('vi-VN')}đ)`;

  localStorage.setItem(SHIFT_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(all));
  syncShiftAssignmentsToCloud(all);
  return [...all];
}

// Điều Động Nhân Sự Chéo Chi Nhánh (Cross-Branch Dispatch)
export function dispatchCrossBranchStaff(params: {
  staff: Staff;
  toBranch: Branch;
  shiftDef: ShiftDefinition;
  startDate: string;
  endDate: string;
  notes?: string;
}): ShiftAssignment[] {
  const { staff, toBranch, shiftDef, startDate, endDate, notes } = params;
  const all = getAllAssignments();

  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates: string[] = [];

  const cur = new Date(start);
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }

  const dateSet = new Set(dates);
  // Remove existing assignment at home branch on those dates
  const filtered = all.filter(a => !(a.staffId === staff.id && dateSet.has(a.date)));

  const newCrossAssignments: ShiftAssignment[] = dates.map(dateStr => ({
    id: `asg_${staff.id}_${dateStr}_cross_${Date.now()}`,
    staffId: staff.id,
    staffName: staff.fullName,
    staffPhone: staff.phone,
    staffRole: staff.role,
    homeBranchId: staff.homeBranchId || staff.branchId,
    workingBranchId: toBranch.id,
    workingBranchName: toBranch.name,
    date: dateStr,
    shiftDefinitionId: shiftDef.id,
    shiftCode: shiftDef.code,
    shiftName: shiftDef.name,
    startTime: shiftDef.startTime,
    endTime: shiftDef.endTime,
    hours: shiftDef.hours,
    status: 'SCHEDULED',
    isCrossBranch: true,
    notes: notes || `✈️ Tăng cường điều động sang ${toBranch.name}`
  }));

  const updated = [...filtered, ...newCrossAssignments];
  localStorage.setItem(SHIFT_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(updated));
  syncShiftAssignmentsToCloud(updated);
  return updated;
}

/**
 * Chuẩn hóa thuật toán tính trễ động:
 * So sánh giờ check-in thực tế với giờ bắt đầu ca (ân hạn chuẩn 10 phút).
 * - Ca Sáng: 07:00 (ân hạn đến 07:10)
 * - Ca Chiều: 13:30 (ân hạn đến 13:40)
 * - Ca Văn Phòng: 07:30 (ân hạn đến 07:40)
 * - Ca Trưa: 12:00 (ân hạn đến 12:10)
 * - Ca Tùy Chỉnh: Giờ bắt đầu tùy chỉnh + 10 phút
 * - Ca Tăng Cường: Giờ linh hoạt, không tính trễ
 */
export function calculateAttendanceIsLate(
  shiftType?: string, 
  checkInIso?: string, 
  notes?: string,
  gracePeriodMinutes: number = 10,
  targetStartTime?: string
): { isLate: boolean; lateMinutes: number } {
  if (!checkInIso) {
    const isLateNote = notes?.toLowerCase().includes('đi trễ') || false;
    return { isLate: isLateNote, lateMinutes: 0 };
  }

  const inDate = new Date(checkInIso);
  const inMinutes = inDate.getHours() * 60 + inDate.getMinutes();

  let targetMinutes = 0;
  let hasFixedShift = false;

  // 1. Nếu có giờ ca cụ thể từ lịch phân ca (targetStartTime: '07:00'...)
  if (targetStartTime) {
    const [h, m] = targetStartTime.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      targetMinutes = h * 60 + m;
      hasFixedShift = true;
    }
  }

  // 2. Phân loại theo shiftType nếu chưa có targetMinutes
  if (!hasFixedShift) {
    if (shiftType === 'CA_SANG') {
      targetMinutes = 7 * 60; // 07:00
      hasFixedShift = true;
    } else if (shiftType === 'CA_CHIEU') {
      targetMinutes = 13 * 60 + 30; // 13:30
      hasFixedShift = true;
    } else if (shiftType === 'HANH_CHINH') {
      targetMinutes = 7 * 60 + 30; // 07:30
      hasFixedShift = true;
    } else if (shiftType === 'CA_TRUA') {
      targetMinutes = 12 * 60; // 12:00
      hasFixedShift = true;
    } else if (shiftType === 'TUY_CHINH' && notes) {
      const match = notes.match(/Ca Tùy Chỉnh \((\d{1,2}):(\d{2})/);
      if (match) {
        targetMinutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
        hasFixedShift = true;
      }
    }
  }

  // 3. Nếu là ca cố định: Áp dụng quy tắc ân hạn 10 phút chuẩn xác
  if (hasFixedShift) {
    if (inMinutes > targetMinutes + gracePeriodMinutes) {
      return {
        isLate: true,
        lateMinutes: inMinutes - targetMinutes
      };
    }
    return { isLate: false, lateMinutes: 0 };
  }

  // Fallback nếu không xác định được loại ca
  const isLateNote = notes?.toLowerCase().includes('đi trễ') || false;
  return { isLate: isLateNote, lateMinutes: 0 };
}
