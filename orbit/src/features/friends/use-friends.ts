import { useCallback, useMemo } from 'react';

import { useNow } from '@/hooks/use-now';
import { usePersisted } from '@/lib/persisted-store';
import {
  commonGaps,
  freeGaps,
  parseTime,
  type ClassEntry,
  type Gap,
} from '@/features/schedule/use-schedule';

export type FriendClass = Pick<ClassEntry, 'code' | 'room' | 'start' | 'end'>;

export type Friend = {
  id: string;
  name: string;
  program: string;
  campus: 'SGW' | 'LOY';
  /** Sample daily timetable. */
  classes: FriendClass[];
};

/** Sample classmates with realistic Concordia timetables. */
export const SAMPLE_FRIENDS: Friend[] = [
  {
    id: 'maya',
    name: 'Maya Chen',
    program: 'Computer Science',
    campus: 'SGW',
    classes: [
      { code: 'COMP 352', room: 'H-820', start: '09:15', end: '10:30' },
      { code: 'COMP 346', room: 'EV 3.309', start: '13:15', end: '14:30' },
    ],
  },
  {
    id: 'samir',
    name: 'Samir Haddad',
    program: 'Software Engineering',
    campus: 'SGW',
    classes: [
      { code: 'SOEN 287', room: 'MB 2.130', start: '10:15', end: '11:30' },
      { code: 'ENGR 233', room: 'H-937', start: '14:45', end: '16:00' },
    ],
  },
  {
    id: 'lea',
    name: 'Léa Tremblay',
    program: 'Finance',
    campus: 'SGW',
    classes: [
      { code: 'FINA 300', room: 'MB 3.265', start: '11:45', end: '13:00' },
      { code: 'ACCO 220', room: 'MB 1.210', start: '15:15', end: '16:30' },
    ],
  },
  {
    id: 'jordan',
    name: 'Jordan Wells',
    program: 'Psychology',
    campus: 'LOY',
    classes: [
      { code: 'PSYC 230', room: 'PY 244', start: '08:45', end: '10:00' },
      { code: 'PSYC 315', room: 'PY 101', start: '12:30', end: '13:45' },
      { code: 'BIOL 201', room: 'SP 165', start: '16:15', end: '17:30' },
    ],
  },
  {
    id: 'priya',
    name: 'Priya Nair',
    program: 'Mechanical Engineering',
    campus: 'SGW',
    classes: [
      { code: 'MECH 215', room: 'H-535', start: '08:30', end: '11:15' },
      { code: 'ENGR 213', room: 'EV 2.260', start: '12:45', end: '14:00' },
    ],
  },
];

export type FriendStatus =
  | { kind: 'class'; code: string; room: string; endsAt: string }
  | { kind: 'free'; until: string | null };

export const toMin = (t: string) => {
  const p = parseTime(t)!;
  return p.h * 60 + p.m;
};

/** Sample timetables repeat daily so the demo is meaningful on any day of the week. */
function isWeekday(_now: Date) {
  return true;
}

/** What a friend is doing at `now`, computed from their timetable. */
export function statusOf(f: Friend, now: Date): FriendStatus {
  if (!isWeekday(now)) return { kind: 'free', until: null };
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const sorted = [...f.classes].sort((a, b) => toMin(a.start) - toMin(b.start));
  const current = sorted.find((c) => toMin(c.start) <= nowMin && nowMin < toMin(c.end));
  if (current) return { kind: 'class', code: current.code, room: current.room, endsAt: current.end };
  const next = sorted.find((c) => toMin(c.start) > nowMin);
  return { kind: 'free', until: next ? next.start : null };
}

export function todayClasses(f: Friend, now: Date) {
  return isWeekday(now) ? [...f.classes].sort((a, b) => toMin(a.start) - toMin(b.start)) : [];
}

/** Windows (≥45 min) where both the student and the friend are free today. */
export function freeTogether(f: Friend, mine: ClassEntry[], now: Date): Gap[] {
  const mineToday = mine.filter((e) => e.day === now.getDay());
  return commonGaps(freeGaps(mineToday, now), freeGaps(todayClasses(f, now), now));
}

type Invite = { username: string; at: number };

export function useFriends() {
  const now = useNow();
  const [invites, setInvites, ready] = usePersisted<Invite[]>('orbit.friends.invites', []);

  const invite = useCallback(
    (raw: string) => {
      const username = raw.trim().replace(/^@/, '').toLowerCase();
      if (!username) return 'Enter a username or Concordia email.';
      if (invites.some((i) => i.username === username)) return `You already invited ${username}.`;
      setInvites((p) => [...p, { username, at: Date.now() }]);
      return null;
    },
    [invites, setInvites],
  );
  const cancel = useCallback(
    (username: string) => setInvites((p) => p.filter((i) => i.username !== username)),
    [setInvites],
  );

  return useMemo(
    () => ({
      now,
      ready,
      friends: SAMPLE_FRIENDS,
      invites,
      invite,
      cancel,
      freeNow: SAMPLE_FRIENDS.filter((f) => statusOf(f, now).kind === 'free'),
    }),
    [now, ready, invites, invite, cancel],
  );
}
