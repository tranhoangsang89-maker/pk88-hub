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

      // Hợp nhất dữ liệu Cloud với LocalStorage để không bị sót
      const mergedMap = new Map<string, CleanlinessReport>();
      formatted.forEach(r => mergedMap.set(r.id, r));
      localReports.forEach(r => {
        if (!mergedMap.has(r.id)) {
          mergedMap.set(r.id, r);
        }
      });

      const mergedList = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedList));
      return mergedList;
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
 * Tự động xóa dọn dẹp các báo cáo cũ vượt quá retentionDays (Mặc định 14 ngày)
 * Giữ cho hệ thống luôn nhẹ và không bao giờ đầy database
 */
export const purgeOldCleanlinessReports = async (retentionDays = 14): Promise<number> => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10); // YYYY-MM-DD

  let purgedCount = 0;

  // 1. Dọn dẹp LocalStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const list: CleanlinessReport[] = JSON.parse(raw);
      const remaining = list.filter(r => r.reportDate >= cutoffStr);
      purgedCount = list.length - remaining.length;
      if (purgedCount > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
        window.dispatchEvent(new CustomEvent('pk88_cleanliness_updated'));
      }
    }
  } catch (err) {
    console.warn('Purge local error:', err);
  }

  // 2. Dọn dẹp Supabase Cloud
  try {
    const { count, error } = await supabase
      .from('cleanliness_reports')
      .delete({ count: 'exact' })
      .lt('date', cutoffStr);

    if (!error && typeof count === 'number') {
      purgedCount = Math.max(purgedCount, count);
    }
  } catch (err) {
    console.warn('Purge cloud error:', err);
  }

  return purgedCount;
};
