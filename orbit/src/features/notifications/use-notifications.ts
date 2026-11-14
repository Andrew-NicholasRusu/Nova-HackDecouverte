import { useCallback, useMemo } from 'react';

import { STORAGE_KEYS } from '@/data/constants';
import type { Notice } from '@/data/types';
import { useBrain } from '@/features/brain/use-brain';
import { useFriends } from '@/features/friends/store';
import { useProfile } from '@/features/profile/use-profile';
import { calculateScheduleConflicts } from '@/features/schedule/engine';
import { useClassEvents } from '@/features/schedule/store';
import { useNow } from '@/hooks/use-now';
import { usePersisted } from '@/lib/persisted-store';

/** Everything that needs attention, built from the other modules. */
export function useNotifications() {
  const plan = useBrain();
  const now = useNow();
  const friends = useFriends();
  const schedule = useClassEvents();
  const profile = useProfile();
  const [readIds, setReadIds] = usePersisted<string[]>(STORAGE_KEYS.notificationsRead, []);

  const notices = useMemo(() => {
    const out: Notice[] = [];
    for (const r of friends.incoming) {
      out.push({ id: `fr-${r.friendshipId}`, icon: 'person-add', title: `${r.student.displayName} wants to be friends`, detail: `@${r.student.username}`, sticky: true, request: r });
    }
    const next = plan.next;
    if (next && !plan.current) {
      const mins = Math.round((next.start.getTime() - now.getTime()) / 60_000);
      if (mins >= 0 && mins <= 45) {
        const room = [next.event.buildingCode, next.event.room].filter(Boolean).join(' ');
        out.push({
          id: `class-${next.event.id}-${next.start.toDateString()}`,
          icon: 'directions-walk',
          title: `${next.event.courseCode} starts in ${mins} min`,
          detail: [room, plan.walkToNext !== null ? `${plan.walkToNext} min walk` : null].filter(Boolean).join(' · ') || 'Check the room',
          sticky: false,
          cta: 'Show route',
          target: { pathname: '/navigator', params: { building: next.event.buildingCode, ...(next.event.buildingCode === 'MB' && next.event.room ? { room: `MB-${next.event.room}` } : {}) } },
        });
      }
    }
    for (const c of calculateScheduleConflicts(schedule.events)) {
      out.push({ id: `conflict-${c.a.id}-${c.b.id}`, icon: 'warning', title: `${c.a.courseCode} overlaps ${c.b.courseCode}`, detail: `${c.a.startTime}–${c.a.endTime} and ${c.b.startTime}–${c.b.endTime}`, sticky: true, cta: 'Fix in Schedule', target: { pathname: '/schedule' } });
    }
    if (profile && !profile.avatar_url) {
      out.push({ id: 'nudge-photo', icon: 'photo-camera', title: 'Add a profile photo', detail: 'Friends recognise you faster.', sticky: false, cta: 'Open settings', target: { pathname: '/settings' } });
    }
    return out;
  }, [friends.incoming, plan, now, schedule.events, profile]);

  const unread = notices.filter((n) => n.sticky || !readIds.includes(n.id));
  const markAllRead = useCallback(() => setReadIds((p) => [...new Set([...p, ...notices.filter((n) => !n.sticky).map((n) => n.id)])].slice(-100)), [notices, setReadIds]);

  return { notices, unreadCount: unread.length, readIds, markAllRead };
}
