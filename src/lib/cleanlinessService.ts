import { supabase } from './supabase';
import { CleanlinessReport, CleanlinessShiftType, CleanlinessStatus } from '../types';

const STORAGE_KEY = 'pk88_cleanliness_reports';

/**
 * SQL Schema khởi tạo bảng cleanliness_reports trên Supabase
 */
export const CLEANLINESS_REPORTS_SQL = `
-- Tạo bảng báo cáo vệ sinh cửa hàng hàng ngày
CREATE TABLE IF NOT EXISTS cleanliness_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id TEXT,
  branch_name TEXT,
  staff_id TEXT,
  staff_name TEXT,
  staff_phone TEXT,
  staff_role TEXT,
  shift_type TEXT DEFAULT 'MORNING',
  report_date DATE DEFAULT CURRENT_DATE,
  images JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  status TEXT DEFAULT 'SUBMITTED',
  reviewed_by TEXT,
  review_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bật Row Level Security (RLS) mở quyền đọc ghi
ALTER TABLE cleanliness_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cleanliness_reports_policy" ON cleanliness_reports;
CREATE POLICY "cleanliness_reports_policy" ON cleanliness_reports FOR ALL USING (true) WITH CHECK (true);

-- Index tối ưu hóa truy vấn theo ngày và chi nhánh
CREATE INDEX IF NOT EXISTS idx_cleanliness_date ON cleanliness_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_cleanliness_branch ON cleanliness_reports(branch_id);
`;

/**
 * Nén ảnh chất lượng cao trực tiếp trên trình duyệt (Client-Side Compression)
 * Chuyển đổi sang WebP chất lượng 78%, độ phân giải tối đa 1280px (~35KB - 65KB/ảnh)
 */
export const compressCleanlinessImage = (file: File, maxDimension = 1280, quality = 0.78): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Tính toán tỷ lệ co giãn giữ nguyên aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Vẽ ảnh lên canvas với smooth image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Xuất định dạng WebP siêu nhẹ
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          // Fallback sang JPEG nếu trình duyệt cũ không hỗ trợ toDataURL webp
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

// Helper kiểm tra chuỗi có phải UUID hợp lệ chuẩn Postgres
const isValidUuid = (val?: string): boolean => {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
};

/**
 * Lấy danh sách báo cáo vệ sinh từ Supabase (có fallback LocalStorage)
 */
export const fetchCleanlinessReports = async (
  targetDate?: string,
  targetBranchId?: string
): Promise<CleanlinessReport[]> => {
  let localReports: CleanlinessReport[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) localReports = JSON.parse(raw);
  } catch {
    localReports = [];
  }

  try {
    let query = supabase.from('cleanliness_reports').select('*');

    if (targetDate) {
      query = query.eq('date', targetDate);
    }
    if (targetBranchId && targetBranchId !== 'ALL') {
      if (isValidUuid(targetBranchId)) {
        query = query.eq('branch_id', targetBranchId);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (!error && data && Array.isArray(data)) {
      const formatted: CleanlinessReport[] = data.map((item: any) => ({
        id: item.id,
        branchId: item.branch_id || '',
        branchName: item.branch_name || '',
        staffId: item.staff_id || '',
        staffName: item.staff_name || '',
        staffPhone: item.staff_phone || '',
        staffRole: item.staff_role || '',
        shiftType: (item.shift_type || 'MORNING') as CleanlinessShiftType,
        reportDate: item.date || item.report_date || targetDate || new Date().toISOString().slice(0, 10),
        images: Array.isArray(item.images) ? item.images : (typeof item.images === 'string' ? JSON.parse(item.images || '[]') : []),
        notes: item.notes || '',
        status: (item.status === 'PENDING' ? 'SUBMITTED' : (item.status === 'REDO_REQUESTED' ? 'NEEDS_REDO' : item.status)) as CleanlinessStatus,
        reviewedBy: item.reviewed_by,
        reviewNote: item.review_note,
        createdAt: item.created_at || new Date().toISOString()
      }));

      // Khi kết nối Supabase Cloud thành công:
      // Supabase Cloud là Chân Lý Thực Tế (Single Source of Truth).
      // Đối với targetDate đã truy vấn: cập nhật LocalStorage theo Cloud để xóa sạch mọi báo cáo
      // đã bị xóa trên thiết bị khác (không giữ lại zombie report).
      let updatedLocalStorage: CleanlinessReport[] = [];
      if (targetDate && targetBranchId && targetBranchId !== 'ALL') {
        const nonMatching = localReports.filter(r => r.reportDate !== targetDate || r.branchId !== targetBranchId);
        updatedLocalStorage = [...formatted, ...nonMatching];
      } else if (targetDate) {
        const nonMatching = localReports.filter(r => r.reportDate !== targetDate);
        updatedLocalStorage = [...formatted, ...nonMatching];
      } else {
        updatedLocalStorage = formatted;
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLocalStorage));
      } catch (err) {
        console.warn('Sync local storage error:', err);
      }

      return formatted;
    }
  } catch (err) {
    console.warn('Supabase fetchCleanlinessReports fallback to local:', err);
  }

  // Fallback lọc từ localReports
  return localReports.filter(r => {
    if (targetDate && r.reportDate !== targetDate) return false;
    if (targetBranchId && targetBranchId !== 'ALL' && r.branchId !== targetBranchId) return false;
    return true;
  });
};

/**
 * Gửi báo cáo vệ sinh mới (Lưu đồng thời Supabase Cloud và LocalStorage)
 */
export const submitCleanlinessReport = async (
  reportData: Omit<CleanlinessReport, 'id' | 'createdAt'>
): Promise<CleanlinessReport> => {
  const newReport: CleanlinessReport = {
    ...reportData,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'SUBMITTED'
  };

  // 1. Lưu LocalStorage tức thì
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: CleanlinessReport[] = raw ? JSON.parse(raw) : [];
    list.unshift(newReport);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('pk88_cleanliness_updated', { detail: newReport }));
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }

  // 2. Đồng bộ lên Supabase Cloud
  try {
    const payload = {
      id: newReport.id,
      branch_id: isValidUuid(newReport.branchId) ? newReport.branchId : null,
      branch_name: newReport.branchName,
      staff_id: isValidUuid(newReport.staffId) ? newReport.staffId : null,
      staff_name: newReport.staffName,
      date: newReport.reportDate,
      shift_type: newReport.shiftType,
      images: newReport.images || [],
      notes: newReport.notes || '',
      status: 'PENDING',
      created_at: newReport.createdAt
    };

    const { error } = await supabase.from('cleanliness_reports').insert([payload]);
    if (error) {
      console.warn('Supabase insert cleanliness report warning:', error.message);
    }
  } catch (err) {
    console.warn('Supabase insert exception:', err);
  }

  return newReport;
};

/**
 * Đánh giá báo cáo vệ sinh (Founder / Admin duyệt đạt chuẩn hoặc yêu cầu làm lại)
 */
export const reviewCleanlinessReport = async (
  id: string,
  status: CleanlinessStatus,
  reviewedBy: string,
  reviewNote?: string
): Promise<boolean> => {
  // 1. Cập nhật LocalStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const list: CleanlinessReport[] = JSON.parse(raw);
      const idx = list.findIndex(r => r.id === id);
      if (idx !== -1) {
        list[idx].status = status;
        list[idx].reviewedBy = reviewedBy;
        if (reviewNote) list[idx].reviewNote = reviewNote;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('pk88_cleanliness_updated'));
      }
    }
  } catch (err) {
    console.warn('LocalStorage review update error:', err);
  }

  // 2. Cập nhật Supabase Cloud
  try {
    const dbStatus = status === 'APPROVED' ? 'APPROVED' :
                     (status === 'NEEDS_REDO' || status === 'REDO_REQUESTED') ? 'REDO_REQUESTED' : 'PENDING';

    await supabase.from('cleanliness_reports').update({
      status: dbStatus,
      reviewed_by: reviewedBy,
      review_note: reviewNote || null
    }).eq('id', id);
    return true;
  } catch {
    return false;
  }
};

/**
 * Thống kê số ca vệ sinh của nhân viên trong tháng
 */
export interface StaffCleanlinessStats {
  approvedCount: number;
  totalSubmitted: number;
  redoCount: number;
}

/**
 * Thống kê số ca vệ sinh đạt chuẩn trong tháng của từng nhân viên
 * Dữ liệu được tính toán và đồng bộ trực tiếp từ Supabase Cloud
 * @param monthStr Định dạng 'YYYY-MM' (Mặc định là tháng hiện tại theo giờ VN)
 */
export const fetchMonthlyCleanlinessStats = async (monthStr?: string): Promise<{
  byStaffId: Record<string, StaffCleanlinessStats>;
  byStaffName: Record<string, StaffCleanlinessStats>;
}> => {
  const targetMonth = monthStr || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()).slice(0, 7);
  const startDate = `${targetMonth}-01`;
  const endDate = `${targetMonth}-31`;

  const byStaffId: Record<string, StaffCleanlinessStats> = {};
  const byStaffName: Record<string, StaffCleanlinessStats> = {};

  const recordStats = (staffId: string | undefined, staffName: string | undefined, status: string) => {
    const isApproved = status === 'APPROVED';
    const isRedo = status === 'REDO_REQUESTED' || status === 'NEEDS_REDO';

    if (staffId) {
      if (!byStaffId[staffId]) {
        byStaffId[staffId] = { approvedCount: 0, totalSubmitted: 0, redoCount: 0 };
      }
      byStaffId[staffId].totalSubmitted++;
      if (isApproved) byStaffId[staffId].approvedCount++;
      if (isRedo) byStaffId[staffId].redoCount++;
    }

    if (staffName) {
      const cleanName = staffName.trim().toLowerCase();
      if (!byStaffName[cleanName]) {
        byStaffName[cleanName] = { approvedCount: 0, totalSubmitted: 0, redoCount: 0 };
      }
      byStaffName[cleanName].totalSubmitted++;
      if (isApproved) byStaffName[cleanName].approvedCount++;
      if (isRedo) byStaffName[cleanName].redoCount++;
    }
  };

  // 1. Quét LocalStorage (Dành cho trường hợp offline hoặc báo cáo vừa tạo)
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const localList: CleanlinessReport[] = JSON.parse(raw);
      localList
        .filter(r => r.reportDate && r.reportDate.startsWith(targetMonth))
        .forEach(r => recordStats(r.staffId, r.staffName, r.status));
    }
  } catch (err) {
    console.warn('Read local monthly cleanliness stats error:', err);
  }

  // 2. Lấy dữ liệu chính xác từ bảng cleanliness_reports trên Supabase Cloud
  try {
    const { data, error } = await supabase
      .from('cleanliness_reports')
      .select('id, staff_id, staff_name, status, date')
      .gte('date', startDate)
      .lte('date', endDate);

    if (!error && data) {
      const cloudByStaffId: Record<string, StaffCleanlinessStats> = {};
      const cloudByStaffName: Record<string, StaffCleanlinessStats> = {};

      data.forEach(r => {
        const isApproved = r.status === 'APPROVED';
        const isRedo = r.status === 'REDO_REQUESTED' || r.status === 'NEEDS_REDO';

        if (r.staff_id) {
          if (!cloudByStaffId[r.staff_id]) {
            cloudByStaffId[r.staff_id] = { approvedCount: 0, totalSubmitted: 0, redoCount: 0 };
          }
          cloudByStaffId[r.staff_id].totalSubmitted++;
          if (isApproved) cloudByStaffId[r.staff_id].approvedCount++;
          if (isRedo) cloudByStaffId[r.staff_id].redoCount++;
        }

        if (r.staff_name) {
          const cleanName = r.staff_name.trim().toLowerCase();
          if (!cloudByStaffName[cleanName]) {
            cloudByStaffName[cleanName] = { approvedCount: 0, totalSubmitted: 0, redoCount: 0 };
          }
          cloudByStaffName[cleanName].totalSubmitted++;
          if (isApproved) cloudByStaffName[cleanName].approvedCount++;
          if (isRedo) cloudByStaffName[cleanName].redoCount++;
        }
      });

      return { byStaffId: cloudByStaffId, byStaffName: cloudByStaffName };
    }
  } catch (err) {
    console.warn('Fetch Supabase monthly cleanliness stats error:', err);
  }

  return { byStaffId, byStaffName };
};

/**
 * Tự động xóa dọn dẹp dung lượng ảnh cũ (>14 ngày)
 * Thay vì xóa mất lịch sử ca trực của nhân viên, hệ thống làm rỗng mảng images = [] 
 * để giải phóng 100% dung lượng lưu trữ ảnh trên Supabase, đồng thời BẢO LƯU TOÀN BỘ
 * số ca đạt chuẩn của nhân sự cho báo cáo tháng. Chỉ xóa vĩnh viễn báo cáo cũ hơn 60 ngày.
 */
export const purgeOldCleanlinessReports = async (retentionDays = 14): Promise<number> => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10); // YYYY-MM-DD

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const sixtyDaysCutoffStr = sixtyDaysAgo.toISOString().slice(0, 10);

  let purgedCount = 0;

  // 1. Dọn dẹp LocalStorage (Làm rỗng mảng images của các báo cáo cũ để giải phóng bộ nhớ máy)
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const list: CleanlinessReport[] = JSON.parse(raw);
      let changed = false;
      const updatedList = list
        .filter(r => r.reportDate >= sixtyDaysCutoffStr) // Chỉ xóa bỏ hoàn toàn nếu quá 60 ngày
        .map(r => {
          if (r.reportDate < cutoffStr && r.images && r.images.length > 0) {
            changed = true;
            purgedCount++;
            return { ...r, images: [] }; // Giữ lại thông tin ca & trạng thái APPROVED, xóa mảng ảnh nặng
          }
          return r;
        });

      if (changed || updatedList.length !== list.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
        window.dispatchEvent(new CustomEvent('pk88_cleanliness_updated'));
      }
    }
  } catch (err) {
    console.warn('Purge local error:', err);
  }

  // 2. Dọn dẹp Supabase Cloud
  try {
    // Làm rỗng mảng images giải phóng dung lượng ảnh
    const { count: imageClearedCount } = await supabase
      .from('cleanliness_reports')
      .update({ images: [] }, { count: 'exact' })
      .lt('date', cutoffStr);

    if (typeof imageClearedCount === 'number') {
      purgedCount = Math.max(purgedCount, imageClearedCount);
    }

    // Xóa vĩnh viễn các dòng quá cũ (> 60 ngày)
    await supabase
      .from('cleanliness_reports')
      .delete()
      .lt('date', sixtyDaysCutoffStr);

  } catch (err) {
    console.warn('Purge cloud error:', err);
  }

  return purgedCount;
};

/**
 * Xóa vĩnh viễn 1 báo cáo vệ sinh (Dành cho Founder/Admin khi phát hiện ảnh gửi nhầm/ảnh rác)
 */
export const deleteCleanlinessReport = async (id: string): Promise<boolean> => {
  // 1. Xóa trong LocalStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const list: CleanlinessReport[] = JSON.parse(raw);
      const remaining = list.filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
      window.dispatchEvent(new CustomEvent('pk88_cleanliness_updated'));
    }
  } catch (err) {
    console.warn('Delete local report error:', err);
  }

  // 2. Xóa trên Supabase Cloud
  try {
    const { error } = await supabase.from('cleanliness_reports').delete().eq('id', id);
    if (error) {
      console.warn('Delete cloud report error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Delete cloud report exception:', err);
    return false;
  }
};
