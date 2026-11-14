import { occursOn } from './recurrence';
import { addDays, timeToMinutes } from './time';
import type { EventTiming, Occurrence } from './types';

export type Conflict<T> = {
  a: T;
  b: T;
  /** First local date on which both meet at overlapping times. */
  firstDate: string;
  /** How many dates the two classes collide on. */
  dates: number;
};

/** Do the two time-of-day ranges overlap? Touching ranges (10:00–11:00, 11:00–12:00) do not. */
export function timesOverlap(a: EventTiming, b: EventTiming): boolean {
  return (
    timeToMinutes(a.startTime) < timeToMinutes(b.endTime) &&
    timeToMinutes(b.startTime) < timeToMinutes(a.endTime)
  );
}

/** Collision details for a pair of events, or null if they never overlap. */
export function conflictBetween<T extends EventTiming>(a: T, b: T): Conflict<T> | null {
  if (!timesOverlap(a, b)) return null;
  const from = a.startDate > b.startDate ? a.startDate : b.startDate;
  const to = a.endDate < b.endDate ? a.endDate : b.endDate;
  let firstDate: string | null = null;
  let dates = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (occursOn(a, d) && occursOn(b, d)) {
      firstDate ??= d;
      dates += 1;
    }
  }
  return firstDate ? { a, b, firstDate, dates } : null;
}

/** All pairwise conflicts within `events`. */
export function findConflicts<T extends EventTiming>(events: readonly T[]): Conflict<T>[] {
  const out: Conflict<T>[] = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const c = conflictBetween(events[i]!, events[j]!);
      if (c) out.push(c);
    }
  }
  return out;
}

/** Occurrences that overlap another occurrence, for marking clashes in a calendar view. */
export function overlappingOccurrences<T extends EventTiming>(
  occurrences: readonly Occurrence<T>[],
): Set<Occurrence<T>> {
  const out = new Set<Occurrence<T>>();
  const sorted = [...occurrences].sort((a, b) => a.start.getTime() - b.start.getTime());
  let latest: Occurrence<T> | null = null;
  for (const o of sorted) {
    if (latest && o.start.getTime() < latest.end.getTime()) {
      out.add(o);
      out.add(latest);
    }
    if (!latest || o.end.getTime() > latest.end.getTime()) latest = o;
  }
  return out;
}

/** Conflicts between `candidates` and the existing `events` (e.g. during import review). */
export function findConflictsWith<T extends EventTiming, U extends EventTiming>(
  candidates: readonly T[],
  events: readonly U[],
): { candidate: T; existing: U; firstDate: string }[] {
  const out: { candidate: T; existing: U; firstDate: string }[] = [];
  for (const candidate of candidates) {
    for (const existing of events) {
      const c = conflictBetween<EventTiming>(candidate, existing);
      if (c) out.push({ candidate, existing, firstDate: c.firstDate });
    }
  }
  return out;
}
