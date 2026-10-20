const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kvxxkfgictaqmwcwvluf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2eHhrZmdpY3RhcW13Y3d2bHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTExNTYsImV4cCI6MjEwNjA4NzE1Nn0.2_DlkAogz1dmdPs2lnozj4hSxekY7gmmtT2X_NGs7NQ';
const client = createClient(supabaseUrl, supabaseKey);

async function testFullRoundtrip() {
  const testId = '99999999-1111-2222-3333-444444444444';
  const fakeWebP = 'data:image/webp;base64,UklGRmYAAABXRUJQVlA4TFkAAAAvAAAAEAcQERGIiP4HAA==';

  console.log('1. Testing insert cleanliness report with WebP image to Supabase...');
  const { data: insData, error: insErr } = await client.from('cleanliness_reports').insert([{
    id: testId,
    branch_id: '2b150536-0b47-4e32-912b-b5ede701bfa6',
    branch_name: 'Phụ Kiện 88 - Phú Khương',
    staff_id: 'd3b4d84b-1a42-436c-8f57-e12b4662a358',
    staff_name: 'Nguyễn Hữu Đạt',
    staff_phone: '0919982861',
    staff_role: 'sales',
    date: '2026-10-20',
    report_date: '2026-10-20',
    shift_type: 'MORNING',
    images: [fakeWebP, fakeWebP],
    notes: 'Test kiểm tra đồng bộ Supabase Cloud',
    status: 'SUBMITTED'
  }]).select();

  if (insErr) {
    console.error('Insert failed:', insErr);
    process.exit(1);
  }
  console.log(' -> Insert succeeded! ID:', insData[0]?.id, 'Images count:', insData[0]?.images?.length);

  console.log('2. Testing fetch query from Supabase Cloud...');
  const { data: readData, error: readErr } = await client
    .from('cleanliness_reports')
    .select('*')
    .eq('id', testId)
    .single();

  if (readErr || !readData) {
    console.error('Read failed:', readErr);
    process.exit(1);
  }
  console.log(' -> Fetched row from Cloud successfully:', {
    id: readData.id,
    branch: readData.branch_name,
    staff: readData.staff_name,
    date: readData.date,
    status: readData.status,
    images: readData.images.length
  });

  console.log('3. Testing review/approval update to Supabase Cloud...');
  const { error: updErr } = await client
    .from('cleanliness_reports')
    .update({
      status: 'APPROVED',
      reviewed_by: 'Founder Ngô Hồng Thao',
      review_note: 'Đạt chuẩn 5 sao!'
    })
    .eq('id', testId);

  if (updErr) {
    console.error('Update failed:', updErr);
    process.exit(1);
  }
  console.log(' -> Update status APPROVED succeeded on Cloud!');

  console.log('4. Testing attendance dispute insertion with proof_image_url...');
  const { data: attData, error: attErr } = await client.from('attendance').insert([{
    staff_id: 'd3b4d84b-1a42-436c-8f57-e12b4662a358',
    branch_id: '2b150536-0b47-4e32-912b-b5ede701bfa6',
    check_in: new Date().toISOString(),
    shift_type: 'MORNING',
    lat: 10.2465,
    lng: 106.3812,
    distance_meters: 150,
    is_verified: false,
    dispute_status: 'PENDING',
    dispute_type: 'OUTSIDE_100M',
    dispute_reason: 'GPS định vị bị trôi do thời tiết',
    proof_image_url: fakeWebP,
    disputed_at: new Date().toISOString(),
    notes: '[GIẢI TRÌNH CHỜ DUYỆT]: GPS định vị bị trôi do thời tiết'
  }]).select();

  if (attErr) {
    console.error('Attendance dispute insert failed:', attErr);
    process.exit(1);
  }
  console.log(' -> Attendance dispute with proof image inserted successfully into Cloud! ID:', attData[0]?.id);

  console.log('5. Cleaning up test rows...');
  await client.from('cleanliness_reports').delete().eq('id', testId);
  if (attData && attData[0]?.id) {
    await client.from('attendance').delete().eq('id', attData[0].id);
  }
  console.log(' -> Test rows cleaned up cleanly!');

  console.log('\n=== ALL SUPABASE CLOUD TESTS PASSED 100%! ===');
}

testFullRoundtrip().catch(console.error);
