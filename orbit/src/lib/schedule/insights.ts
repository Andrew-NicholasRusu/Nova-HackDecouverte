import { expandOccurrences } from './recurrence';
import { addDays, minutesToTime, timeToMinutes, todayIn } from './time';
import type { EventTiming, Occurrence } from './types';

export type NextClass<T extends EventTiming> = {
  occurrence: Occurrence<T>;
  /** True when `now` is between the class start and end. */
  inProgress: boolean;
};

/**
 * The class in progress, or the next one to start, within `horizonDays`.
 * (PLAN.md §5.5 calculateNextClass)
 */
export function calculateNextClass<T extends EventTiming>(
  events: readonly T[],
  now: Date,
  timeZone: string,
  horizonDays = 14,
): NextClass<T> | null {
  const today = todayIn(timeZone, now);
  const upcoming = expandOccurrences(events, today, addDays(today, horizonDays), timeZone);
  const next = upcoming.find((o) => o.end.getTime() > now.getTime());
  if (!next) return null;
  return { occurrence: next, inProgress: next.start.getTime() <= now.getTime() };
}

export type FreePeriod = { start: string; end: string; minutes: number };

/**
 * Gaps of at least `minMinutes` between a day's classes. Time before the
 * first class and after the last one is not counted as a free period.
 * (PLAN.md §5.5 calculateFreePeriods)
 */
export function calculateFreePeriods(
  dayEvents: readonly EventTiming[],
  minMinutes = 30,
): FreePeriod[] {
  const intervals = dayEvents
    .map((e) => [timeToMinutes(e.startTime), timeToMinutes(e.endTime)] as const)
    .sort((a, b) => a[0] - b[0]);

  const out: FreePeriod[] = [];
  let busyUntil: number | null = null;
  for (const [start, end] of intervals) {
    if (busyUntil !== null && start - busyUntil >= minMinutes) {
      out.push({
        start: minutesToTime(busyUntil),
        end: minutesToTime(start),
        minutes: start - busyUntil,
      });
    }
    busyUntil = busyUntil === null ? end : Math.max(busyUntil, end);
  }
  return out;
}
