/**
 * Pure schedule calculations (PLAN.md §5.5). No I/O, no React — reusable on any platform and on
 * the server, and covered by unit tests.
 */
import type { ClassEvent } from './model';
import { addDays, parseTime, weekdayOf, type LocalMoment } from './time';

type Timed = Pick<ClassEvent, 'days' | 'start_time' | 'end_time' | 'start_date' | 'end_date'>;

export type Occurrence<T extends Timed = ClassEvent> = {
  event: T;
  date: string;
  start: number; // minutes since midnight
  end: number;
};

export function occursOn(event: Timed, date: string): boolean {
  return (
    date >= event.start_date && date <= event.end_date && event.days.includes(weekdayOf(date))
  );
}

/** Classes meeting on `date`, sorted by start time. */
export function classesOn<T extends Timed>(events: T[], date: string): Occurrence<T>[] {
  return events
    .filter((e) => occursOn(e, date))
    .map((event) => ({
      event,
      date,
      start: parseTime(event.start_time),
      end: parseTime(event.end_time),
    }))
    .sort((a, b) => a.start - b.start || a.end - b.end);
}

export type NextClass<T extends Timed = ClassEvent> = Occurrence<T> & {
  /** Minutes from `now` until the class starts (0 or negative never returned). */
  minutesUntil: number;
};

/**
 * The class happening right now (if any) and the next one to start, looking up to `horizonDays`
 * ahead. `minutesUntil` counts whole days as 1440 minutes (DST shifts of ±60 min are ignored for
 * countdowns more than a day away).
 */
export function upcoming<T extends Timed>(
  events: T[],
  now: LocalMoment,
  horizonDays = 14,
): { current: Occurrence<T> | null; next: NextClass<T> | null } {
  const today = classesOn(events, now.date);
  const current = today.find((o) => o.start <= now.minutes && o.end > now.minutes) ?? null;

  for (let i = 0; i <= horizonDays; i++) {
    const date = i === 0 ? now.date : addDays(now.date, i);
    const list = i === 0 ? today : classesOn(events, date);
    const found = list.find((o) => i > 0 || o.start > now.minutes);
    if (found) {
      return { current, next: { ...found, minutesUntil: i * 1440 + found.start - now.minutes } };
    }
  }
  return { current, next: null };
}

function rangesOverlap(a: Timed, b: Timed) {
  return a.start_date <= b.end_date && b.start_date <= a.end_date;
}

/** Pairs of classes that meet at overlapping times on a shared weekday within overlapping dates. */
export function findConflicts<T extends Timed & { id: string }>(events: T[]): [T, T][] {
  const out: [T, T][] = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];
      if (!a.days.some((d) => b.days.includes(d)) || !rangesOverlap(a, b)) continue;
      const overlap =
        parseTime(a.start_time) < parseTime(b.end_time) &&
        parseTime(b.start_time) < parseTime(a.end_time);
      if (overlap) out.push([a, b]);
    }
  }
  return out;
}

export type FreePeriod = { start: number; end: number };

/** Gaps of at least `minMinutes` between classes on `date`, within the day window. */
export function freePeriods(
  events: Timed[],
  date: string,
  { dayStart = 8 * 60, dayEnd = 22 * 60, minMinutes = 30 } = {},
): FreePeriod[] {
  const busy = classesOn(events, date);
  const out: FreePeriod[] = [];
  let cursor = dayStart;
  for (const o of busy) {
    if (o.start - cursor >= minMinutes) out.push({ start: cursor, end: Math.min(o.start, dayEnd) });
    cursor = Math.max(cursor, o.end);
    if (cursor >= dayEnd) break;
  }
  if (dayEnd - cursor >= minMinutes) out.push({ start: cursor, end: dayEnd });
  return out.filter((p) => p.end - p.start >= minMinutes);
}
