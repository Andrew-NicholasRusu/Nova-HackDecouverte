import { useCallback, useMemo } from 'react';

import { usePersisted } from '@/lib/persisted-store';
import { useAuth } from '@/providers/auth-provider';

export type ClassEntry = {
  id: string;
  code: string;
  title: string;
  room: string;
  /** 0 = Sunday … 6 = Saturday (Date.getDay). */
  day: number;
  /** 24 h "HH:MM". */
  start: string;
  end: string;
};

export type Occurrence = Omit<ClassEntry, 'start' | 'end'> & { start: Date; end: Date };

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
/** Mon–Sun display order. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function parseTime(t: string): { h: number; m: number } | null {
  const match = TIME_RE.exec(t.trim());
  return match ? { h: Number(match[1]), m: Number(match[2]) } : null;
}

export function formatClock(t: string) {
  const p = parseTime(t);
  if (!p) return t;
  const d = new Date();
  d.setHours(p.h, p.m, 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Next (or in-progress) occurrence of each class within the coming week, soonest first. */
export function upcomingOccurrences(entries: ClassEntry[], now: Date): Occurrence[] {
  const out: Occurrence[] = [];
  for (const e of entries) {
    const s = parseTime(e.start);
    const en = parseTime(e.end);
    if (!s || !en) continue;
    for (let add = 0; add < 8; add++) {
      const base = new Date(now);
      base.setDate(now.getDate() + add);
      if (base.getDay() !== e.day) continue;
      const start = new Date(base);
      start.setHours(s.h, s.m, 0, 0);
      const end = new Date(base);
      end.setHours(en.h, en.m, 0, 0);
      if (end > now) {
        out.push({ ...e, start, end });
        break;
      }
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** The signed-in student's weekly classes, stored on this device. */
export function useSchedule() {
  const { session } = useAuth();
  const key = `orbit.schedule.${session?.user.id ?? 'guest'}`;
  const [entries, setEntries, ready] = usePersisted<ClassEntry[]>(key, []);

  const add = useCallback(
    (entry: Omit<ClassEntry, 'id'>) =>
      setEntries((prev) => [...prev, { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }]),
    [setEntries],
  );
  const remove = useCallback(
    (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id)),
    [setEntries],
  );

  return useMemo(() => ({ entries, ready, add, remove }), [entries, ready, add, remove]);
}

const MIN = 60_000;

/** Human countdown to `start`: "in 20 min", "in 1 h 5 min", or "now" once started. */
export function countdown(start: Date, now: Date) {
  const mins = Math.ceil((start.getTime() - now.getTime()) / MIN);
  if (mins <= 0) return 'now';
  if (mins < 60) return `in ${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `in ${h} h ${m} min` : `in ${h} h`;
}

export function formatRange(start: Date, end: Date) {
  const f = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${f(start)} – ${f(end)}`;
}

export function formatMinutes(total: number) {
  const d = new Date();
  d.setHours(Math.floor(total / 60), total % 60, 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export type Gap = { from: number; to: number };

const DAY_START = 8 * 60;
const DAY_END = 21 * 60;

/** Minutes-of-day gaps (08:00–21:00, from `now` onward) not covered by the given class blocks. */
export function freeGaps(blocks: { start: string; end: string }[], now: Date): Gap[] {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const busy = blocks
    .map((b) => ({ s: parseTime(b.start), e: parseTime(b.end) }))
    .filter((b): b is { s: { h: number; m: number }; e: { h: number; m: number } } => !!b.s && !!b.e)
    .map((b) => ({ from: b.s.h * 60 + b.s.m, to: b.e.h * 60 + b.e.m }))
    .sort((a, b) => a.from - b.from);
  const gaps: Gap[] = [];
  let cursor = Math.max(DAY_START, nowMin);
  for (const b of busy) {
    if (b.to <= cursor) continue;
    if (b.from > cursor) gaps.push({ from: cursor, to: Math.min(b.from, DAY_END) });
    cursor = Math.max(cursor, b.to);
  }
  if (cursor < DAY_END) gaps.push({ from: cursor, to: DAY_END });
  return gaps.filter((g) => g.to > g.from);
}

/** Time ranges that are free in both lists, at least `minLength` minutes long. */
export function commonGaps(a: Gap[], b: Gap[], minLength = 45): Gap[] {
  const out: Gap[] = [];
  for (const x of a) {
    for (const y of b) {
      const from = Math.max(x.from, y.from);
      const to = Math.min(x.to, y.to);
      if (to - from >= minLength) out.push({ from, to });
    }
  }
  return out.sort((p, q) => p.from - q.from);
}
