const SUPABASE_URL = 'https://djbizcrfqqurtfwiivds.supabase.co';
const SUPABASE_KEY = 'sb_publishable_l3CBp7BV49BdGVfsOKQ2HA_3vXO3eP8';

async function inspectDb() {
  console.log('--- 1. Querying bookings table ---');
  const bRes = await fetch(SUPABASE_URL + '/rest/v1/bookings?select=*', {
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
  });
  console.log('bookings status:', bRes.status);
  const bookings = await bRes.json();
  console.log('Total rows in bookings:', bookings.length);
  for (const b of bookings) {
    console.log(`- ID: ${b.id} | room_type: ${b.room_type} | amount: ${b.amount} | notes: ${b.notes ? b.notes.slice(0, 80) : ''}`);
  }

  console.log('\n--- 2. Querying rooms table ---');
  const rRes = await fetch(SUPABASE_URL + '/rest/v1/rooms?select=*', {
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
  });
  console.log('rooms status:', rRes.status);
  if (rRes.ok) {
    const rooms = await rRes.json();
    console.log('Rooms:', rooms);
  } else {
    console.log('Rooms error:', await rRes.text());
  }

  console.log('\n--- 3. Querying schema tables list ---');
  const schemaRes = await fetch(SUPABASE_URL + '/rest/v1/', {
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
  });
  console.log('Schema root status:', schemaRes.status);
  if (schemaRes.ok) {
    const schema = await schemaRes.json();
    console.log('Exposed endpoints / tables:', Object.keys(schema.definitions || {}));
  }
}
inspectDb();
