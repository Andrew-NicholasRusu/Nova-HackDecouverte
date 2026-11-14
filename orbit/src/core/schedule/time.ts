/**
 * Campus-time helpers. Class times are wall-clock times in the campus time zone, so all
 * "what day/time is it" questions are answered in that zone, never in the device's zone.
 * Dates are ISO strings (YYYY-MM-DD); times of day are minutes since midnight.
 */

export const CAMPUS_TZ = 'America/Toronto';

export type LocalMoment = { date: string; minutes: number; weekday: number };

const pad = (n: number) => String(n).padStart(2, '0');

/** Current local date/time in `tz` for an instant. */
export function localMoment(instant: Date, tz = CAMPUS_TZ): LocalMoment {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const date = `${get('year')}-${pad(get('month'))}-${pad(get('day'))}`;
  return { date, minutes: (get('hour') % 24) * 60 + get('minute'), weekday: weekdayOf(date) };
}

/** ISO weekday (1 = Monday … 7 = Sunday) of a calendar date. */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const js = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return js === 0 ? 7 : js;
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Monday of the week containing `date`. */
export function startOfWeek(date: string): string {
  return addDays(date, 1 - weekdayOf(date));
}

/** "HH:MM" or "HH:MM:SS" → minutes since midnight. Returns NaN when malformed. */
export function parseTime(value: string): number {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!m) return NaN;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return NaN;
  return h * 60 + min;
}

/** minutes → "HH:MM:SS" for the database. */
export function toDbTime(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00`;
}

/** minutes → "9:45 AM". */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h < 12 ? 'AM' : 'PM';
  return `${((h + 11) % 12) + 1}:${pad(m)} ${suffix}`;
}

/** 20 → "20 min", 135 → "2 h 15 min", 3000 → "2 days". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 24 * 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  const days = Math.round(minutes / (24 * 60));
  return days === 1 ? '1 day' : `${days} days`;
}

export const WEEKDAYS = [
  { iso: 1, short: 'Mon', long: 'Monday' },
  { iso: 2, short: 'Tue', long: 'Tuesday' },
  { iso: 3, short: 'Wed', long: 'Wednesday' },
  { iso: 4, short: 'Thu', long: 'Thursday' },
  { iso: 5, short: 'Fri', long: 'Friday' },
  { iso: 6, short: 'Sat', long: 'Saturday' },
  { iso: 7, short: 'Sun', long: 'Sunday' },
] as const;
