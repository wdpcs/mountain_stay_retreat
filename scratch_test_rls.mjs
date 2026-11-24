const SUPABASE_URL = 'https://djbizcrfqqurtfwiivds.supabase.co';
const SUPABASE_KEY = 'sb_publishable_l3CBp7BV49BdGVfsOKQ2HA_3vXO3eP8';

async function testBookingsRls() {
  console.log('--- 1. Testing INSERT to bookings ---');
  const payload = {
    id: 'SYS-RATES-CONFIG',
    guest_name: 'SYSTEM RATES CONFIGURATION',
    guest_email: 'admin@wdpcs.in',
    guest_phone: '+91 70250 17611',
    check_in_date: '2099-12-31',
    room_type: 'System Config',
    amount: 0,
    payment_method: 'Pay at Counter / Property',
    status: 'Cancelled',
    notes: JSON.stringify({ suitePrice: 2800, dormPrice: 500, updatedAt: new Date().toISOString() })
  };

  const insRes = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(payload)
  });

  console.log('INSERT status:', insRes.status);
  const insText = await insRes.text();
  console.log('INSERT response:', insText);

  console.log('\n--- 2. Testing SELECT immediately after INSERT ---');
  const selRes = await fetch(`${SUPABASE_URL}/rest/v1/bookings?id=eq.SYS-RATES-CONFIG`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  console.log('SELECT status:', selRes.status);
  const selText = await selRes.text();
  console.log('SELECT response:', selText);

  console.log('\n--- 3. Testing SELECT * from bookings ---');
  const selAllRes = await fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  console.log('SELECT * response:', await selAllRes.text());
}
testBookingsRls();
