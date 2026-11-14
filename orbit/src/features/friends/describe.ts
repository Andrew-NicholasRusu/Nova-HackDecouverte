import type { SharingLevel } from '@/data/enums';
import type { FreeWindow, Friend, RecurringSlot } from '@/data/types';
import { busyStatusAt, calculateSharedAvailability } from '@/features/schedule/availability';
import { occurrencesOnDate } from '@/features/schedule/engine';
import { addDays, toLocalDate } from '@/features/schedule/model';
import { formatClock } from '@/lib/format';

/** One-line status for a friend right now, respecting what they share. */
export function describeFriendNow(friend: Friend, now: Date): { text: string; free: boolean | null } {
  if (friend.theirLevel === 'private') return { text: 'Not sharing their schedule', free: null };
  const status = busyStatusAt(friend.slots, now);
  if (status.state === 'in-class') {
    const current = occurrencesOnDate(friend.slots, toLocalDate(now)).find((o) => o.start <= now && o.end > now)?.event;
    const where = current?.courseCode ? ` (${current.courseCode}${current.buildingCode ? ` · ${current.buildingCode}` : ''})` : '';
    return { text: `In class until ${formatClock(status.until)}${where}`, free: false };
  }
  return {
    text: status.until ? `Free now · until ${formatClock(status.until)}` : 'Free for the rest of the day',
    free: true,
  };
}

/** The level I share with every friend, or undefined when friends have different levels. */
export function commonSharingLevel(friends: Friend[]): SharingLevel | undefined {
  const levels = new Set(friends.map((f) => f.myLevel));
  return levels.size === 1 ? [...levels][0] : undefined;
}

/** Free friends first, then busy, then those not sharing; alphabetical within each. */
export function sortByAvailability(friends: Friend[], now: Date): Friend[] {
  const rank = (f: Friend) => {
    const free = describeFriendNow(f, now).free;
    return free === true ? 0 : free === false ? 1 : 2;
  };
  return [...friends].sort((a, b) => rank(a) - rank(b) || a.displayName.localeCompare(b.displayName));
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
