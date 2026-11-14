/**
 * Milestone 5 acceptance check against the real Supabase project (PLAN.md §9, M5):
 *   - students can connect
 *   - sharing permissions are enforced server-side
 *   - unauthorized schedule access is prevented
 *   - blocking prevents interaction
 *
 * Needs two existing, confirmed test accounts. Add to orbit/.env.local:
 *   TEST_A_EMAIL=...  TEST_A_PASSWORD=...
 *   TEST_B_EMAIL=...  TEST_B_PASSWORD=...
 * Run:  npm run check:friends
 *
 * It only touches data belonging to those two accounts and cleans up after itself.
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;
const creds = ['TEST_A_EMAIL', 'TEST_A_PASSWORD', 'TEST_B_EMAIL', 'TEST_B_PASSWORD'];
const missing = [!url && 'EXPO_PUBLIC_SUPABASE_URL', !key && 'EXPO_PUBLIC_SUPABASE_KEY', ...creds.filter((c) => !process.env[c])].filter(Boolean);
if (missing.length) {
  console.error(`Missing in .env.local: ${missing.join(', ')}`);
  process.exit(1);
}

let failures = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? '✔' : '✖'} ${name}${!ok && detail ? `\n    ${detail}` : ''}`);
  if (!ok) failures++;
}

async function signIn(label, email, password) {
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`${label}: sign-in failed (${error.message}). Is the account confirmed?`);
  return { client, id: data.user.id };
}

async function ensureUsername(user, fallback) {
  const { data, error } = await user.client.from('profiles').select('username').eq('id', user.id).single();
  if (error) throw new Error(`profiles: ${error.message}`);
  if (data.username) return data.username;
  const { error: e } = await user.client.from('profiles').update({ username: fallback }).eq('id', user.id);
  if (e) throw new Error(`could not set username: ${e.message}`);
  return fallback;
}

const TEST_CLASS = {
  course_code: 'ORBT 999',
  title: 'M5 check (safe to delete)',
  kind: 'lecture',
  building_code: 'H',
  room: '999',
  days: [1, 2, 3, 4, 5],
  start_time: '10:00',
  end_time: '11:00',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
};

async function cleanup(a, b) {
  await a.client.from('blocks').delete().eq('blocker_id', a.id);
  await b.client.from('blocks').delete().eq('blocker_id', b.id);
  await a.client.from('friendships').delete().or(`requester_id.eq.${b.id},addressee_id.eq.${b.id}`);
  await a.client.from('class_events').delete().eq('course_code', TEST_CLASS.course_code);
  await b.client.from('class_events').delete().eq('course_code', TEST_CLASS.course_code);
}

const a = await signIn('A', process.env.TEST_A_EMAIL, process.env.TEST_A_PASSWORD);
const b = await signIn('B', process.env.TEST_B_EMAIL, process.env.TEST_B_PASSWORD);
if (a.id === b.id) throw new Error('TEST_A and TEST_B must be different accounts.');
const aName = await ensureUsername(a, `test_a_${a.id.slice(0, 6)}`);
await ensureUsername(b, `test_b_${b.id.slice(0, 6)}`);
await cleanup(a, b);

try {
  // --- Schedules are private by default --------------------------------------
  const ins = await a.client.from('class_events').insert(TEST_CLASS).select('id').single();
  check('A can add a class', !ins.error, ins.error?.message);
  const aClassId = ins.data?.id;

  const peek = await b.client.from('class_events').select('id').eq('id', aClassId);
  check('B cannot read A’s class directly', !peek.error && peek.data.length === 0, JSON.stringify(peek));

  const tamper = await b.client.from('class_events').update({ room: 'HACKED' }).eq('id', aClassId).select('id');
  check('B cannot edit A’s class', (tamper.data ?? []).length === 0, JSON.stringify(tamper));

  const before = await b.client.rpc('friends_availability');
  check('Strangers get no availability', !before.error && !before.data.some((r) => r.friend_id === a.id), JSON.stringify(before));

  // --- Connecting ------------------------------------------------------------
  const found = await b.client.rpc('search_students', { q: aName });
  check('B can find A by username', !found.error && found.data.some((s) => s.id === a.id), JSON.stringify(found));
  check('Search never returns emails', !found.error && found.data.every((s) => !('email' in s)));

  const forged = await b.client.from('friendships').insert({ requester_id: b.id, addressee_id: a.id, status: 'accepted' });
  check('B cannot force an accepted friendship', !!forged.error);

  const sent = await b.client.rpc('send_friend_request', { target: a.id });
  check('B sends A a request', sent.data === 'sent', JSON.stringify(sent));

  const pendingAvail = await b.client.rpc('friends_availability');
  check('Pending request shares nothing', !pendingAvail.data?.some((r) => r.friend_id === a.id));

  const selfAccept = await b.client.from('friendships').select('id').eq('requester_id', b.id).eq('addressee_id', a.id).single();
  const bAccepts = await b.client.rpc('respond_friend_request', { request_id: selfAccept.data?.id, accept: true });
  check('B cannot accept their own request', !!bAccepts.error);

  const aAccepts = await a.client.rpc('respond_friend_request', { request_id: selfAccept.data?.id, accept: true });
  check('A accepts', !aAccepts.error, aAccepts.error?.message);

  // --- Sharing levels --------------------------------------------------------
  const levelOf = async () => {
    const { data, error } = await b.client.rpc('friends_availability');
    if (error) throw new Error(error.message);
    return data.find((r) => r.friend_id === a.id);
  };

  let row = await levelOf();
  const ev = row?.events?.find((e) => e.start_time === '10:00');
  check('Default is free/busy only', row?.level === 'availability', JSON.stringify(row));
  check('Free/busy shows the time', !!ev && ev.end_time === '11:00', JSON.stringify(row?.events));
  check('Free/busy hides course and room', !!ev && ev.course_code === null && ev.room === null, JSON.stringify(ev));

  await a.client.from('schedule_permissions').update({ level: 'full' }).eq('owner_id', a.id).eq('viewer_id', b.id);
  row = await levelOf();
  check('Full sharing shows course and room', row?.events?.some((e) => e.course_code === 'ORBT 999' && e.room === '999'), JSON.stringify(row));

  await a.client.from('schedule_permissions').update({ level: 'private' }).eq('owner_id', a.id).eq('viewer_id', b.id);
  row = await levelOf();
  check('Private shares nothing', row?.level === 'private' && row.events.length === 0, JSON.stringify(row));

  const escalate = await b.client
    .from('schedule_permissions')
    .update({ level: 'full' })
    .eq('owner_id', a.id)
    .eq('viewer_id', b.id)
    .select('level');
  check('B cannot change what A shares', (escalate.data ?? []).length === 0, JSON.stringify(escalate));
  const forgePerm = await b.client.from('schedule_permissions').upsert({ owner_id: a.id, viewer_id: b.id, level: 'full' });
  check('B cannot grant themselves access', !!forgePerm.error);
  row = await levelOf();
  check('A’s schedule is still private', row?.level === 'private' && row.events.length === 0);

  // --- Blocking --------------------------------------------------------------
  const block = await a.client.rpc('block_user', { target: b.id });
  check('A blocks B', !block.error, block.error?.message);
  const afterBlock = await b.client.rpc('friends_availability');
  check('Block ends the friendship and sharing', !afterBlock.data?.some((r) => r.friend_id === a.id));
  const hidden = await b.client.rpc('search_students', { q: aName });
  check('Blocked student can’t find A', !hidden.data?.some((s) => s.id === a.id));
  const retry = await b.client.rpc('send_friend_request', { target: a.id });
  check('Blocked student can’t send a request', !!retry.error);
} finally {
  await cleanup(a, b);
}

console.log(failures === 0 ? '\nAll Milestone 5 checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
