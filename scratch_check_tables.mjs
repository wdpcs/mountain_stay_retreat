const SUPABASE_URL = 'https://djbizcrfqqurtfwiivds.supabase.co';
const SUPABASE_KEY = 'sb_publishable_l3CBp7BV49BdGVfsOKQ2HA_3vXO3eP8';

async function checkAllTables() {
  const possibleTables = ['rooms', 'bookings', 'prices', 'settings', 'rates', 'inventory', 'pricing', 'config'];
  for (const t of possibleTables) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=*&limit=5`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      console.log(`Table '${t}': status ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`  Rows in '${t}':`, data);
      }
    } catch (err) {
      console.log(`Error checking '${t}':`, err.message);
    }
  }
}
checkAllTables();
