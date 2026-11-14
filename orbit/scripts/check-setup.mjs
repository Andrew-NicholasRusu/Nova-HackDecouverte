// Checks that the Supabase project has what Orbit needs, using only the public (anon) key.
// Run: npm run check:setup   (reads .env.local)

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;
if (!url || !key) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_KEY in .env.local');
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };
let failed = 0;
const report = (ok, label, hint) => {
  console.log(`${ok ? 'OK     ' : 'MISSING'} ${label}${ok ? '' : `  -> ${hint}`}`);
  if (!ok) failed++;
};

// A table that exists answers 200/401/403 (RLS) for the anon key; a missing one answers 404 PGRST205.
const TABLES = [
  ['profiles', '20261114000000_profiles.sql'],
  ['class_events', '20261114010000_class_events.sql'],
  ['friendships', '20261114020000_friends.sql'],
  ['live_locations', '20261114030000_campus_live.sql'],
];
for (const [table, file] of TABLES) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, { headers });
  const body = await res.json().catch(() => ({}));
  report(!(res.status === 404 && body.code === 'PGRST205'), `table ${table}`, `run supabase/migrations/${file}`);
}

// Public bucket: "Object not found" means the bucket exists; "Bucket not found" means it does not.
const bucket = await fetch(`${url}/storage/v1/object/public/avatars/__probe__`, { headers });
const bucketBody = await bucket.json().catch(() => ({}));
report(!/bucket not found/i.test(bucketBody.message ?? bucketBody.error ?? ''), 'storage bucket avatars', 'run supabase/migrations/20261114040000_avatars.sql');

console.log('\nNot checkable with the public key: the profile repair (…050000_profile_repair.sql). Run it once in the SQL editor.');
process.exit(failed ? 1 : 0);
