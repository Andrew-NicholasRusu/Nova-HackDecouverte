/**
 * Shared availability engine (PLAN.md §2 Module C, §5.5 calculateSharedAvailability).
 * Works on RecurringSlot only, so it never needs course details — friends who share
 * "free/busy only" never send them.
 */

import type { BusyStatus, FreeWindow, RecurringSlot } from '../../data/types.ts';
import { occurrencesOnDate } from './engine.ts';
import { atLocalTime, toLocalDate } from './model.ts';

export type AvailabilityOptions = {
  /** Campus day bounds, "HH:MM". Defaults 08:00–22:00. */
  dayStart?: string;
  dayEnd?: string;
  /** Shortest window worth showing. Default 30 min. */
  minMinutes?: number;
  /** Ignore time before this moment (e.g. now). */
  notBefore?: Date;
};

/** Windows on `date` when every one of `schedules` is free. */
export function calculateSharedAvailability(
  schedules: RecurringSlot[][],
  date: string,
  { dayStart = '08:00', dayEnd = '22:00', minMinutes = 30, notBefore }: AvailabilityOptions = {},
): FreeWindow[] {
  let cursor = atLocalTime(date, dayStart);
  const end = atLocalTime(date, dayEnd);
  if (notBefore && notBefore > cursor) cursor = notBefore;
  if (cursor >= end) return [];

  const busy = schedules
    .flatMap((s) => occurrencesOnDate(s, date))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const windows: FreeWindow[] = [];
  const push = (from: Date, to: Date) => {
    const minutes = Math.round((to.getTime() - from.getTime()) / 60_000);
    if (minutes >= minMinutes) windows.push({ start: from, end: to, minutes });
  };
  for (const o of busy) {
    if (o.end <= cursor) continue;
    if (o.start >= end) break;
    if (o.start > cursor) push(cursor, o.start);
    if (o.end > cursor) cursor = o.end;
  }
  if (cursor < end) push(cursor, end);
  return windows;
}

/** Is someone in class right now, and until when? */
export function busyStatusAt(schedule: RecurringSlot[], now: Date): BusyStatus {
  const today = occurrencesOnDate(schedule, toLocalDate(now)).filter((o) => o.end > now);
  const current = today.filter((o) => o.start <= now);
  if (current.length > 0) {
    // Chain back-to-back / overlapping classes so "until" is when they're actually free.
    let until = new Date(Math.max(...current.map((o) => o.end.getTime())));
    for (const o of today) if (o.start <= until && o.end > until) until = o.end;
    return { state: 'in-class', until };
  }
  return { state: 'free', until: today[0]?.start ?? null };
}
