import { useEffect, useState } from 'react';

import { addDays, atLocalTime, toLocalDate, WEEKDAY_SHORT, type ClassInput, type Weekday } from './model';

export const formatDays = (days: Weekday[]) => days.map((d) => WEEKDAY_SHORT[d]).join(' · ');

export const formatLocation = (c: Pick<ClassInput, 'buildingCode' | 'room'>) =>
  [c.buildingCode, c.room].filter(Boolean).join(' ') || 'No room set';

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

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
  const time = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
  const today = toLocalDate(now);
  const day = toLocalDate(start);
  if (day === today || minutes < 6 * 60) return minutes < 1 ? 'starting now' : `in ${formatDuration(minutes)}`;
  if (day === addDays(today, 1)) return `tomorrow at ${time}`;
  return `${formatDateLabel(day, 'short')} at ${time}`;
}

/** Current time, refreshed every `intervalMs` (for countdowns). */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
