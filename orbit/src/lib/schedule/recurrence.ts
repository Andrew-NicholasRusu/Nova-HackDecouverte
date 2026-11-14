import { addDays, dateRange, isoWeekday, timeToMinutes, zonedToInstant } from './time';
import type { EventTiming, Occurrence } from './types';

/** Does the event meet on `date` (local, 'YYYY-MM-DD')? */
export function occursOn(event: EventTiming, date: string): boolean {
  if (date < event.startDate || date > event.endDate) return false;
  if (event.excludedDates.includes(date)) return false;
  if (event.weekdays.length === 0) return date === event.startDate;
  return event.weekdays.includes(isoWeekday(date));
}

export function occurrenceOn<T extends EventTiming>(
  event: T,
  date: string,
  timeZone: string,
): Occurrence<T> {
  return {
    event,
    date,
    start: zonedToInstant(date, event.startTime, timeZone),
    end: zonedToInstant(date, event.endTime, timeZone),
  };
}

/**
 * Every occurrence of `events` between `from` and `to` (inclusive local dates),
 * sorted by start time.
 */
export function expandOccurrences<T extends EventTiming>(
  events: readonly T[],
  from: string,
  to: string,
  timeZone: string,
): Occurrence<T>[] {
  const out: Occurrence<T>[] = [];
  for (const date of dateRange(from, to)) {
    for (const event of events) {
      if (occursOn(event, date)) out.push(occurrenceOn(event, date, timeZone));
    }
  }
  return out.sort(
    (a, b) =>
      a.start.getTime() - b.start.getTime() ||
      timeToMinutes(a.event.endTime) - timeToMinutes(b.event.endTime),
  );
}

/** Number of meetings in the series, after exclusions. */
export function countOccurrences(event: EventTiming): number {
  let n = 0;
  for (let d = event.startDate; d <= event.endDate; d = addDays(d, 1)) {
    if (occursOn(event, d)) n += 1;
  }
  return n;
}
