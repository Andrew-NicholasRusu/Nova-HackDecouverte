/**
 * Friends data (PLAN.md §2 Module C). All writes go through the RPCs in
 * supabase/migrations/20261114020000_friends.sql, which enforce blocking, rate limits
 * and sharing levels server-side.
 */

import { useEffect, useSyncExternalStore } from 'react';

import { supabase } from '@/lib/supabase';
import type { ClassKind, RecurringSlot, Weekday } from '@/features/schedule/model';

export type SharingLevel = 'private' | 'availability' | 'full';

export type StudentSummary = {
  id: string;
  avatarUrl?: string | null;
  username: string;
  displayName: string;
  campus: 'SGW' | 'LOY' | null;
};

/** A friend's class as we're allowed to see it. Course fields only exist with 'full' sharing. */
export type FriendSlot = RecurringSlot & {
  courseCode?: string;
  title?: string;
  kind?: ClassKind;
  buildingCode?: string;
  room?: string;
};

export type Friend = StudentSummary & {
  friendshipId: string;
  /** What they share with me. */
  theirLevel: SharingLevel;
  /** What I share with them. */
  myLevel: SharingLevel;
  slots: FriendSlot[];
};

export type FriendRequest = { friendshipId: string; student: StudentSummary; createdAt: string };

type Data = { friends: Friend[]; incoming: FriendRequest[]; outgoing: FriendRequest[] };
export type FriendsState =
  | ({ status: 'idle' | 'loading' | 'ready' } & Data)
  | ({ status: 'error'; error: string } & Data);

const EMPTY: Data = { friends: [], incoming: [], outgoing: [] };
let state: FriendsState = { status: 'idle', ...EMPTY };
const listeners = new Set<() => void>();
const setState = (next: FriendsState) => {
  state = next;
  listeners.forEach((l) => l());
};

let currentUserId: string | undefined;
supabase.auth.onAuthStateChange((_e, session) => {
  if (session?.user.id !== currentUserId) {
    currentUserId = session?.user.id;
    setState({ status: 'idle', ...EMPTY });
  }
});

function friendlyError(error: { code?: string; message: string }) {
  if (error.code === 'PGRST205' || error.code === 'PGRST202' || error.code === '42P01') {
    return 'Friends tables are missing. Run supabase/migrations/20261114020000_friends.sql in the Supabase SQL editor.';
  }
  return error.message;
}

type ProfileRow = { id: string; username: string | null; display_name: string; avatar_url?: string | null; preferred_campus: 'SGW' | 'LOY' | null };
const toStudent = (p: ProfileRow): StudentSummary => ({
  id: p.id,
  avatarUrl: p.avatar_url ?? null,
  username: p.username ?? '',
  displayName: p.display_name || p.username || 'Student',
  campus: p.preferred_campus,
});

type SlotJson = {
  days: number[];
  start_time: string;
  end_time: string;
  start_date: string;
  end_date: string;
  course_code: string | null;
  title: string | null;
  kind: ClassKind | null;
  building_code: string | null;
  room: string | null;
};
const toSlot = (s: SlotJson): FriendSlot => ({
  days: s.days as Weekday[],
  startTime: s.start_time,
  endTime: s.end_time,
  startDate: s.start_date,
  endDate: s.end_date,
  ...(s.course_code
    ? {
        courseCode: s.course_code,
        title: s.title ?? '',
        kind: s.kind ?? 'lecture',
        buildingCode: s.building_code ?? '',
        room: s.room ?? '',
      }
    : {}),
});

export async function loadFriends() {
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user?.id;
  if (!me) return;
  setState({ ...state, status: 'loading' } as FriendsState);

  const fail = (error: { code?: string; message: string }) =>
    setState({ status: 'error', error: friendlyError(error), friends: state.friends, incoming: state.incoming, outgoing: state.outgoing });

  const [ships, perms, avail] = await Promise.all([
    supabase.from('friendships').select('id, requester_id, addressee_id, status, created_at'),
    supabase.from('schedule_permissions').select('viewer_id, level').eq('owner_id', me),
    supabase.rpc('friends_availability'),
  ]);
  if (ships.error) return fail(ships.error);
  if (perms.error) return fail(perms.error);
  if (avail.error) return fail(avail.error);

  const rows = ships.data as { id: string; requester_id: string; addressee_id: string; status: string; created_at: string }[];
  const otherIds = [...new Set(rows.map((r) => (r.requester_id === me ? r.addressee_id : r.requester_id)))];
  const profiles = new Map<string, StudentSummary>();
  if (otherIds.length > 0) {
    const res = await supabase.from('profiles').select('id, username, display_name, avatar_url, preferred_campus').in('id', otherIds);
    if (res.error) return fail(res.error);
    for (const p of res.data as ProfileRow[]) profiles.set(p.id, toStudent(p));
  }

  const myLevels = new Map((perms.data as { viewer_id: string; level: SharingLevel }[]).map((p) => [p.viewer_id, p.level]));
  const availability = new Map(
    (avail.data as { friend_id: string; level: SharingLevel; events: SlotJson[] }[]).map((a) => [a.friend_id, a]),
  );

  const data: Data = { friends: [], incoming: [], outgoing: [] };
  for (const r of rows) {
    const otherId = r.requester_id === me ? r.addressee_id : r.requester_id;
    const student = profiles.get(otherId);
    if (!student) continue;
    if (r.status === 'accepted') {
      const a = availability.get(otherId);
      data.friends.push({
        ...student,
        friendshipId: r.id,
        theirLevel: a?.level ?? 'private',
        myLevel: myLevels.get(otherId) ?? 'private',
        slots: (a?.events ?? []).map(toSlot),
      });
    } else if (r.addressee_id === me) {
      data.incoming.push({ friendshipId: r.id, student, createdAt: r.created_at });
    } else {
      data.outgoing.push({ friendshipId: r.id, student, createdAt: r.created_at });
    }
  }
  data.friends.sort((a, b) => a.displayName.localeCompare(b.displayName));
  setState({ status: 'ready', ...data });
}

export function useFriends() {
  const snapshot = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
  useEffect(() => {
    if (snapshot.status === 'idle') void loadFriends();
  }, [snapshot.status]);
  return snapshot;
}

// ---------------------------------------------------------------------------
// Actions — throw a readable Error, then refresh
// ---------------------------------------------------------------------------

async function run<T>(op: PromiseLike<{ data: T; error: { code?: string; message: string } | null }>): Promise<T> {
  const { data, error } = await op;
  if (error) throw new Error(friendlyError(error));
  return data;
}

export async function searchStudents(q: string): Promise<StudentSummary[]> {
  if (q.trim().length < 2) return [];
  const rows = await run(supabase.rpc('search_students', { q: q.trim() }));
  return (rows as ProfileRow[]).map(toStudent);
}

/** Returns 'sent' | 'accepted' | 'already_sent' | 'already_friends'. */
export async function sendFriendRequest(target: string): Promise<string> {
  const result = await run(supabase.rpc('send_friend_request', { target }));
  await loadFriends();
  return result as string;
}

export async function respondToRequest(friendshipId: string, accept: boolean) {
  await run(supabase.rpc('respond_friend_request', { request_id: friendshipId, accept }));
  await loadFriends();
}

/** Cancel a sent request, or unfriend. */
export async function removeFriendship(friendshipId: string) {
  await run(supabase.from('friendships').delete().eq('id', friendshipId));
  await loadFriends();
}

export async function blockStudent(target: string) {
  await run(supabase.rpc('block_user', { target }));
  await loadFriends();
}

export async function setSharingLevel(friendId: string, level: SharingLevel) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not signed in.');
  await run(
    supabase
      .from('schedule_permissions')
      .upsert({ owner_id: auth.user.id, viewer_id: friendId, level }, { onConflict: 'owner_id,viewer_id' }),
  );
  await loadFriends();
}
