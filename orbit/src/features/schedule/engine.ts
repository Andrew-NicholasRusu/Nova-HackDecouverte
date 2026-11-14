/**
 * Schedule business logic (PLAN.md §5.5): pure, independently testable functions
 * shared by the Schedule screen, the dashboard and (later) the Friends availability engine.
 */

import {
  addDays,
  atLocalTime,
  isoWeekday,
  timeToMinutes,
  toLocalDate,
  type ClassEvent,
  type RecurringSlot,
  type Weekday,
} from './model.ts';

export type Occurrence<E extends RecurringSlot = ClassEvent> = {
  event: E;
  /** Local calendar date, "YYYY-MM-DD". */
  date: string;
  start: Date;
  end: Date;
};

/** Every occurrence that overlaps [from, to), sorted by start time. */
export function expandOccurrences<E extends RecurringSlot>(events: E[], from: Date, to: Date): Occurrence<E>[] {
  const result: Occurrence<E>[] = [];
  const last = toLocalDate(to);
  for (let date = toLocalDate(from); date <= last; date = addDays(date, 1)) {
    const weekday = isoWeekday(date);
    for (const event of events) {
      if (date < event.startDate || date > event.endDate || !event.days.includes(weekday)) continue;
      const start = atLocalTime(date, event.startTime);
      const end = atLocalTime(date, event.endTime);
      if (end > from && start < to) result.push({ event, date, start, end });
    }
  }
  return result.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** Occurrences on one local calendar day. */
export function occurrencesOnDate<E extends RecurringSlot>(events: E[], date: string): Occurrence<E>[] {
  return expandOccurrences(events, atLocalTime(date, '00:00'), atLocalTime(addDays(date, 1), '00:00'));
}

export type NextClass<E extends RecurringSlot = ClassEvent> = {
  /** The class happening right now, if any. */
  current: Occurrence<E> | null;
  /** The next class that hasn't started yet, if any within the horizon. */
  next: Occurrence<E> | null;
};

/** What's on now and what's next (PLAN.md §3.2 B). */
export function calculateNextClass<E extends RecurringSlot>(events: E[], now: Date, horizonDays = 120): NextClass<E> {
  const upcoming = expandOccurrences(events, now, atLocalTime(addDays(toLocalDate(now), horizonDays), '00:00'));
  const current = upcoming.find((o) => o.start <= now && o.end > now) ?? null;
  const next = upcoming.find((o) => o.start > now) ?? null;
  return { current, next };
}

export type ScheduleConflict<E extends RecurringSlot = ClassEvent> = {
  a: E;
  b: E;
  /** Weekdays on which both classes meet at overlapping times. */
  days: Weekday[];
};

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart <= bEnd && bStart <= aEnd;
}

/** Pairs of classes that overlap in time on a shared weekday within overlapping date ranges. */
export function calculateScheduleConflicts<E extends RecurringSlot>(events: E[]): ScheduleConflict<E>[] {
  const conflicts: ScheduleConflict<E>[] = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];
      if (!rangesOverlap(a.startDate, a.endDate, b.startDate, b.endDate)) continue;
      const overlapsInTime =
        timeToMinutes(a.startTime) < timeToMinutes(b.endTime) && timeToMinutes(b.startTime) < timeToMinutes(a.endTime);
      if (!overlapsInTime) continue;
      const days = a.days.filter((d) => b.days.includes(d));
      if (days.length > 0) conflicts.push({ a, b, days });
    }
  }
  return conflicts;
}

export type FreePeriod = { start: Date; end: Date; minutes: number };

/**
 * Gaps between consecutive classes in a list of occurrences (typically one day).
 * Overlapping classes are merged first; gaps shorter than `minMinutes` are dropped.
 */
export function calculateFreePeriods(occurrences: Occurrence<RecurringSlot>[], minMinutes = 15): FreePeriod[] {
  const sorted = [...occurrences].sort((a, b) => a.start.getTime() - b.start.getTime());
  const gaps: FreePeriod[] = [];
  let busyUntil: Date | null = null;
  for (const o of sorted) {
    if (busyUntil && o.start > busyUntil) {
      const minutes = Math.round((o.start.getTime() - busyUntil.getTime()) / 60_000);
      if (minutes >= minMinutes) gaps.push({ start: busyUntil, end: o.start, minutes });
    }
    if (!busyUntil || o.end > busyUntil) busyUntil = o.end;
  }
  return gaps;
}
