const { Client } = require('pg');
const fs = require('fs');

const dbPw = fs.existsSync('supabase-pw.txt') ? fs.readFileSync('supabase-pw.txt', 'utf8').trim() : (process.env.SUPABASE_DB_PW || '');
const client = new Client({
  connectionString: `postgresql://postgres:${dbPw}@db.kvxxkfgictaqmwcwvluf.supabase.co:5432/postgres`,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected to PG!');

  await client.query(`
    -- 1. Bảng Hồ Sơ Khách Hàng (Customer Profiles)
    CREATE TABLE IF NOT EXISTS customer_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone VARCHAR(20) UNIQUE NOT NULL,
        full_name VARCHAR(100),
        home_branch_id TEXT,
        home_branch_name VARCHAR(100),
        device_model VARCHAR(100),
        tier VARCHAR(20) DEFAULT 'NEW',
        total_spent NUMERIC(14, 2) DEFAULT 0,
        order_count INT DEFAULT 0,
        notes TEXT,
        birthday DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "customer_profiles_all_policy" ON customer_profiles;
    CREATE POLICY "customer_profiles_all_policy" ON customer_profiles FOR ALL USING (true) WITH CHECK (true);

    -- 2. Bảng Nhật Ký Chăm Sóc Khách Hàng (Customer Care Logs)
    CREATE TABLE IF NOT EXISTS customer_care_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone VARCHAR(20) NOT NULL,
        staff_name VARCHAR(100),
        action_type VARCHAR(50), -- CALL, ZALO, GIFT, NOTE, WARRANTY_REMINDER
        content TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    ALTER TABLE customer_care_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "customer_care_logs_all_policy" ON customer_care_logs;
    CREATE POLICY "customer_care_logs_all_policy" ON customer_care_logs FOR ALL USING (true) WITH CHECK (true);
  `);

  console.log('customer_profiles and customer_care_logs created & RLS configured successfully!');
  await client.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
