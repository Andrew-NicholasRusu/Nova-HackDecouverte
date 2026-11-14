import { useMemo } from 'react';

import type { Place, Plan } from '@/data/types';
import { useFriends } from '@/features/friends/store';
import { useLive } from '@/features/live/store';
import { useBuildingIndex } from '@/features/navigator/use-buildings';
import { useProfile } from '@/features/profile/use-profile';
import { useClassEvents } from '@/features/schedule/store';
import { useNow } from '@/hooks/use-now';

import { buildPlan } from './plan';

/** The one object the dashboard and every module read: today's plan across all modules. */
export function useBrain(): Plan {
  const now = useNow();
  const schedule = useClassEvents();
  const friends = useFriends();
  const live = useLive();
  const profile = useProfile();
  const index = useBuildingIndex();

  return useMemo(() => {
    const buildings = new Map<string, Place>();
    index.forEach((b, code) => buildings.set(code, b));
    return buildPlan({
      events: schedule.events,
      friends: friends.friends,
      locations: live.locations,
      buildings,
      campus: profile?.preferred_campus ?? null,
      now,
    });
  }, [now, schedule.events, friends.friends, live.locations, profile?.preferred_campus, index]);
}
