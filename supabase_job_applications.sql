-- ==============================================================================
-- PK88 AUTOMATION PORTAL - MODULE TUYỂN DỤNG (JOB APPLICATIONS)
-- Bảng lưu trữ hồ sơ ứng tuyển từ website /tuyen-dung công khai và quản lý HR
-- ==============================================================================

-- 1. Tạo bảng job_applications
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    role_applied TEXT NOT NULL,
    experience_note TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'interview', 'hired', 'rejected')),
    interview_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Chỉ mục tối ưu tìm kiếm theo chi nhánh & trạng thái
CREATE INDEX IF NOT EXISTS idx_job_applications_branch ON public.job_applications(branch_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_phone ON public.job_applications(phone);
CREATE INDEX IF NOT EXISTS idx_job_applications_created ON public.job_applications(created_at DESC);

-- 3. Kích hoạt Row Level Security (RLS)
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- 4. Chính sách cho phép công chúng / ứng viên nộp hồ sơ công khai (anon INSERT)
DROP POLICY IF EXISTS "Cho phép ứng viên nộp hồ sơ công khai" ON public.job_applications;
CREATE POLICY "Cho phép ứng viên nộp hồ sơ công khai" 
ON public.job_applications 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- 5. Chính sách cho phép đọc và cập nhật hồ sơ (Admin, HR, Quản lý)
DROP POLICY IF EXISTS "Cho phép xem danh sách ứng tuyển" ON public.job_applications;
CREATE POLICY "Cho phép xem danh sách ứng tuyển" 
ON public.job_applications 
FOR SELECT 
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Cho phép cập nhật trạng thái ứng tuyển" ON public.job_applications;
CREATE POLICY "Cho phép cập nhật trạng thái ứng tuyển" 
ON public.job_applications 
FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phép xóa hồ sơ ứng tuyển" ON public.job_applications;
CREATE POLICY "Cho phép xóa hồ sơ ứng tuyển" 
ON public.job_applications 
FOR DELETE 
TO anon, authenticated
USING (true);
