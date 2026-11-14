import { busyStatusAt, calculateSharedAvailability, type FreeWindow } from '@/features/schedule/availability';
import { occurrencesOnDate } from '@/features/schedule/engine';
import { addDays, toLocalDate, type RecurringSlot } from '@/features/schedule/model';

import type { Friend } from './store';

export const hm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export const SHARING_LABEL = {
  private: 'Private',
  availability: 'Free/busy only',
  full: 'Full schedule',
} as const;

export const SHARING_HELP = {
  private: 'They see nothing about your schedule.',
  availability: 'They see when you are busy or free, never which class or where.',
  full: 'They also see your courses and rooms.',
} as const;

/** One-line status for a friend right now, respecting what they share. */
export function describeFriendNow(friend: Friend, now: Date): { text: string; free: boolean | null } {
  if (friend.theirLevel === 'private') return { text: 'Not sharing their schedule', free: null };
  const status = busyStatusAt(friend.slots, now);
  if (status.state === 'in-class') {
    const current = occurrencesOnDate(friend.slots, toLocalDate(now)).find((o) => o.start <= now && o.end > now)?.event;
    const where = current?.courseCode ? ` (${current.courseCode}${current.buildingCode ? ` · ${current.buildingCode}` : ''})` : '';
    return { text: `In class until ${hm(status.until)}${where}`, free: false };
  }
  return {
    text: status.until ? `Free now · until ${hm(status.until)}` : 'Free for the rest of the day',
    free: true,
  };
}

/**
 * Next shared free window with a friend: rest of today first, then tomorrow.
 * Returns null when they don't share their schedule.
 */
export function nextSharedWindow(
  mine: RecurringSlot[],
  friend: Friend,
  now: Date,
): { window: FreeWindow; when: 'today' | 'tomorrow' } | null {
  if (friend.theirLevel === 'private') return null;
  const today = toLocalDate(now);
  const t = calculateSharedAvailability([mine, friend.slots], today, { notBefore: now, minMinutes: 30 });
  if (t[0]) return { window: t[0], when: 'today' };
  const tomorrow = calculateSharedAvailability([mine, friend.slots], addDays(today, 1), { minMinutes: 30 });
  return tomorrow[0] ? { window: tomorrow[0], when: 'tomorrow' } : null;
}
