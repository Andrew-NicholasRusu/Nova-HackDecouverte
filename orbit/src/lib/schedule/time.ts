/**
 * Calendar-date and time-zone helpers with no third-party dependency.
 *
 * Plain dates are 'YYYY-MM-DD' strings and times are 'HH:MM' strings. Date
 * arithmetic is done in UTC so it is unaffected by the device time zone.
 * Conversions between wall-clock time and instants use Intl with an
 * explicit IANA zone.
 */

import type { Weekday } from './types';

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidDate(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

export function isValidTime(value: string): boolean {
  return TIME_RE.test(value);
}

/** Minutes since midnight for an 'HH:MM' string. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':');
  return Number(h) * 60 + Number(m);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${pad(h)}:${pad(m)}`;
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

function dateToUtcMs(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y!, m! - 1, d!);
}

function utcMsToDate(ms: number): string {
  const dt = new Date(ms);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

const DAY_MS = 86_400_000;

export function addDays(date: string, days: number): string {
  return utcMsToDate(dateToUtcMs(date) + days * DAY_MS);
}

/** Whole days from `a` to `b` (positive when b is later). */
export function daysBetween(a: string, b: string): number {
  return Math.round((dateToUtcMs(b) - dateToUtcMs(a)) / DAY_MS);
}

export function isoWeekday(date: string): Weekday {
  const day = new Date(dateToUtcMs(date)).getUTCDay(); // 0 = Sunday
  return (day === 0 ? 7 : day) as Weekday;
}

/** Monday of the week containing `date`. */
export function startOfWeek(date: string): string {
  return addDays(date, 1 - isoWeekday(date));
}

/** Inclusive list of dates from `from` to `to`. */
export function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

// ---------------------------------------------------------------------------
// Time zones
// ---------------------------------------------------------------------------

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatterFor(timeZone);
    return true;
  } catch {
    return false;
  }
}

type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function zonedParts(instant: Date, timeZone: string): ZonedParts {
  const parts: Record<string, number> = {};
  for (const p of formatterFor(timeZone).formatToParts(instant)) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }
  return {
    year: parts.year!,
    month: parts.month!,
    day: parts.day!,
    // Some engines report midnight as 24 even with h23.
    hour: parts.hour === 24 ? 0 : parts.hour!,
    minute: parts.minute!,
    second: parts.second!,
  };
}

/** Offset (ms) of `timeZone` from UTC at `instant`; e.g. -4h for Toronto in summer. */
function zoneOffsetMs(instant: number, timeZone: string): number {
  const p = zonedParts(new Date(instant), timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/**
 * The instant at which the wall clock in `timeZone` shows `date time`.
 * Nonexistent times (spring-forward gap) resolve forward by the gap length;
 * ambiguous times (fall-back overlap) resolve to the earlier instant.
 */
export function zonedToInstant(date: string, time: string, timeZone: string): Date {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const wall = Date.UTC(y!, mo! - 1, d!, h!, mi!);
  const offsetBefore = zoneOffsetMs(wall - DAY_MS / 2, timeZone);
  const offsetAfter = zoneOffsetMs(wall + DAY_MS / 2, timeZone);
  // Try the earlier offset first so ambiguous times pick the first occurrence.
  for (const offset of [offsetBefore, offsetAfter]) {
    const candidate = wall - offset;
    if (zoneOffsetMs(candidate, timeZone) === offset) return new Date(candidate);
  }
  // In a gap: neither offset round-trips; shifting by the pre-gap offset moves forward.
  return new Date(wall - offsetBefore);
}

/** Wall-clock date and time of `instant` in `timeZone`. */
export function instantToZoned(instant: Date, timeZone: string): { date: string; time: string } {
  const p = zonedParts(instant, timeZone);
  return {
    date: `${p.year}-${pad(p.month)}-${pad(p.day)}`,
    time: `${pad(p.hour)}:${pad(p.minute)}`,
  };
}

/** Today's date in `timeZone`. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  return instantToZoned(now, timeZone).date;
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function weekdayLabel(day: Weekday): string {
  return WEEKDAY_SHORT[day - 1]!;
}

/** 'Mon, Sep 8' */
export function formatDateLabel(date: string): string {
  const [, m, d] = date.split('-').map(Number);
  return `${weekdayLabel(isoWeekday(date))}, ${MONTH_SHORT[m! - 1]} ${d}`;
}

/** '1h 05m', '12m', 'now' */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60_000));
  if (totalMinutes === 0) return 'now';
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return `${hours}h ${pad(minutes)}m`;
  return `${minutes}m`;
}
