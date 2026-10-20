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
    -- Ensure columns exist and are flexible
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS voucher_code TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS branch_id TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS product_interest TEXT;

    -- Update RLS policies
    ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "anon_insert_leads" ON leads;
    CREATE POLICY "anon_insert_leads" ON leads FOR INSERT TO anon, authenticated WITH CHECK (true);

    DROP POLICY IF EXISTS "anon_update_leads" ON leads;
    CREATE POLICY "anon_update_leads" ON leads FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "anon_read_leads" ON leads;
    CREATE POLICY "anon_read_leads" ON leads FOR SELECT TO anon, authenticated USING (true);

    DROP POLICY IF EXISTS "leads_all_policy" ON leads;
    CREATE POLICY "leads_all_policy" ON leads FOR ALL USING (true) WITH CHECK (true);
  `);

  console.log('RLS policies on leads updated successfully!');
  await client.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
