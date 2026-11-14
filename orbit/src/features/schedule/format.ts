import { type Weekday, WEEKDAYS } from '@/data/enums';
import { WEEKDAY_SHORT } from '@/data/labels';
import type { ClassEvent, ClassInput } from '@/data/types';
import { formatClock, formatDuration } from '@/lib/format';

import { addDays, atLocalTime, toLocalDate } from './model';

export const formatDays = (days: Weekday[]) => days.map((d) => WEEKDAY_SHORT[d]).join(' · ');

export const formatLocation = (c: Pick<ClassInput, 'buildingCode' | 'room'>) =>
  [c.buildingCode, c.room].filter(Boolean).join(' ') || 'No room set';

export function formatDateLabel(date: string, style: 'long' | 'short' = 'long'): string {
  return atLocalTime(date, '12:00').toLocaleDateString('en-CA', {
    weekday: style,
    month: 'short',
    day: 'numeric',
  });
}

/** "in 25 min", "in 2h 10m", "tomorrow at 08:45", "Mon, Sep 14 at 08:45". */
export function formatStartsIn(start: Date, now: Date): string {
  const minutes = Math.max(0, Math.round((start.getTime() - now.getTime()) / 60_000));
  const time = formatClock(start);
  const today = toLocalDate(now);
  const day = toLocalDate(start);
  if (day === today || minutes < 6 * 60) return minutes < 1 ? 'starting now' : `in ${formatDuration(minutes)}`;
  if (day === addDays(today, 1)) return `tomorrow at ${time}`;
  return `${formatDateLabel(day, 'short')} at ${time}`;
}

/** The week as plain text for sharing: one line per class, Monday first. Empty when there are no classes. */
export function formatWeekAsText(events: ClassEvent[]): string {
  return WEEKDAYS.flatMap((d) =>
    events
      .filter((e) => e.days.includes(d))
      .sort((x, y) => x.startTime.localeCompare(y.startTime))
      .map((e) => `${WEEKDAY_SHORT[d]} ${e.startTime}–${e.endTime}  ${e.courseCode}${e.room ? ` (${e.buildingCode} ${e.room})` : ''}`),
  ).join('\n');
}
