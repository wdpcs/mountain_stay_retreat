const SUPABASE_URL = 'https://djbizcrfqqurtfwiivds.supabase.co';
const SUPABASE_KEY = 'sb_publishable_l3CBp7BV49BdGVfsOKQ2HA_3vXO3eP8';

async function testUpdateRooms() {
  console.log('Testing PATCH on rooms table:');
  const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/rooms?id=eq.suite-executive`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: 'return=representation'
    },
    body: JSON.stringify({ default_price: 2700 })
  });
  console.log('PATCH status:', patchRes.status, patchRes.statusText);
  const text = await patchRes.text();
  console.log('PATCH response:', text);
}
testUpdateRooms();
