const { Client } = require('pg');
const fs = require('fs');

const dbPw = fs.existsSync('supabase-pw.txt') ? fs.readFileSync('supabase-pw.txt', 'utf8').trim() : '';
const connectionString = process.env.DATABASE_URL || `postgresql://postgres:${dbPw}@db.kvxxkfgictaqmwcwvluf.supabase.co:5432/postgres`;

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  await client.connect();
  console.log('Connected to PostgreSQL Supabase Cloud...');

  // 1. Cập nhật bảng attendance với các cột giải trình & ảnh bằng chứng
  console.log('1. Migrating table attendance...');
  await client.query(`
    ALTER TABLE attendance ADD COLUMN IF NOT EXISTS dispute_status VARCHAR(20) DEFAULT 'NONE';
    ALTER TABLE attendance ADD COLUMN IF NOT EXISTS dispute_type VARCHAR(30);
    ALTER TABLE attendance ADD COLUMN IF NOT EXISTS dispute_reason TEXT;
    ALTER TABLE attendance ADD COLUMN IF NOT EXISTS proof_image_url TEXT;
    ALTER TABLE attendance ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE attendance ADD COLUMN IF NOT EXISTS dispute_handled_by VARCHAR(100);
    ALTER TABLE attendance ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
  `);
  console.log(' -> attendance columns updated successfully!');

  // 2. Mở rộng CHECK constraint cho bảng cleanliness_reports để chấp nhận cả 'SUBMITTED' và 'NEEDS_REDO'
  console.log('2. Updating cleanliness_reports status check constraint...');
  await client.query(`
    ALTER TABLE cleanliness_reports DROP CONSTRAINT IF EXISTS cleanliness_reports_status_check;
    ALTER TABLE cleanliness_reports ADD CONSTRAINT cleanliness_reports_status_check 
      CHECK (status IN ('PENDING', 'SUBMITTED', 'APPROVED', 'REDO_REQUESTED', 'NEEDS_REDO'));
  `);
  console.log(' -> cleanliness_reports_status_check updated successfully!');

  // 3. Đảm bảo bảng cleanliness_reports có các cột bổ sung nếu cần
  console.log('3. Ensuring cleanliness_reports columns...');
  await client.query(`
    ALTER TABLE cleanliness_reports ADD COLUMN IF NOT EXISTS staff_phone TEXT;
    ALTER TABLE cleanliness_reports ADD COLUMN IF NOT EXISTS staff_role TEXT;
  `);
  console.log(' -> cleanliness_reports phone/role columns ensured!');

  // 4. Kiểm tra quyền RLS (Row Level Security) cho các bảng
  console.log('4. Checking and configuring RLS policies...');
  // cleanliness_reports
  await client.query(`
    ALTER TABLE cleanliness_reports ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "cleanliness_reports_all_policy" ON cleanliness_reports;
    CREATE POLICY "cleanliness_reports_all_policy" ON cleanliness_reports FOR ALL USING (true) WITH CHECK (true);
  `);
  // attendance
  await client.query(`
    ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "attendance_all_policy" ON attendance;
    CREATE POLICY "attendance_all_policy" ON attendance FOR ALL USING (true) WITH CHECK (true);
  `);
  // staff
  await client.query(`
    ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "staff_all_policy" ON staff;
    CREATE POLICY "staff_all_policy" ON staff FOR ALL USING (true) WITH CHECK (true);
  `);
  // branches
  await client.query(`
    ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "branches_all_policy" ON branches;
    CREATE POLICY "branches_all_policy" ON branches FOR ALL USING (true) WITH CHECK (true);
  `);
  console.log(' -> RLS policies configured to allow seamless cloud synchronization!');

  // 5. Kiểm tra kết quả
  const attRes = await client.query(`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'attendance' AND column_name LIKE '%dispute%' OR column_name = 'proof_image_url';
  `);
  console.log('Attendance dispute columns:', attRes.rows.map(r => r.column_name));

  const cleanCols = await client.query(`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'cleanliness_reports';
  `);
  console.log('Cleanliness columns now:', cleanCols.rows.map(r => r.column_name));

  await client.end();
  console.log('Migration completed successfully!');
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
