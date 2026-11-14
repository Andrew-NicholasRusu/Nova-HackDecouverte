import { useMemo } from 'react';

import { SEARCH_PER_GROUP } from '@/data/constants';
import { SEARCH_GROUPS } from '@/data/enums';
import { MOLSON_FLOORS } from '@/data/floorplans';
import { campusName, LIVE_CATEGORY_LABEL } from '@/data/labels';
import type { SearchResult } from '@/data/types';
import { useFriends } from '@/features/friends/store';
import { useLive } from '@/features/live/store';
import { getRooms } from '@/features/navigator/floorplan/navmesh';
import { useBuildings } from '@/features/navigator/use-buildings';
import { useClassEvents } from '@/features/schedule/store';

const rooms = MOLSON_FLOORS.flatMap((f) => getRooms(f.id));

/** One search over every module: classes, buildings, Molson rooms, friends and live places. */
export function useSearch(query: string): SearchResult[] {
  const schedule = useClassEvents();
  const buildings = useBuildings();
  const friends = useFriends();
  const live = useLive();

  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const has = (...parts: (string | undefined)[]) => parts.join(' ').toLowerCase().includes(q);
    const out: SearchResult[] = [];

    for (const e of schedule.events) {
      if (has(e.courseCode, e.title, e.room, e.buildingCode)) {
        out.push({
          id: `c-${e.id}`,
          group: 'Classes',
          title: `${e.courseCode}${e.title ? ` · ${e.title}` : ''}`,
          subtitle: `${e.startTime}–${e.endTime}${e.room ? ` · ${e.buildingCode} ${e.room}` : ''}`,
          icon: 'event',
          target: { pathname: '/schedule' },
        });
      }
    }
    for (const r of rooms) {
      if (has(r.label, r.code)) {
        out.push({
          id: `r-${r.label}`,
          group: 'Rooms',
          title: r.label,
          subtitle: `Molson Building · floor ${r.floor}`,
          icon: 'meeting-room',
          target: { pathname: '/navigator', params: { room: r.label } },
        });
      }
    }
    if (buildings.status === 'ready') {
      for (const b of buildings.buildings) {
        if (has(b.code, b.longName, b.name, b.address)) {
          out.push({
            id: `b-${b.campus}-${b.code}`,
            group: 'Buildings',
            title: `${b.code} · ${b.longName || b.name}`,
            subtitle: `${campusName(b.campus) || b.campus} · ${b.address}`,
            icon: 'apartment',
            target: { pathname: '/navigator', params: { building: b.code } },
          });
        }
      }
    }
    for (const f of friends.friends) {
      if (has(f.displayName, f.username)) {
        out.push({
          id: `f-${f.id}`,
          group: 'Friends',
          title: f.displayName,
          subtitle: `@${f.username}`,
          icon: 'person',
          target: { pathname: '/friends', params: { friend: f.id } },
        });
      }
    }
    for (const l of live.locations) {
      if (has(l.name, l.buildingCode, l.detail)) {
        out.push({
          id: `l-${l.id}`,
          group: 'Campus Live',
          title: l.name,
          subtitle: `${LIVE_CATEGORY_LABEL[l.category]} · ${l.buildingCode}`,
          icon: l.category === 'food' ? 'restaurant' : 'chair',
          target: { pathname: '/live', params: { place: l.id } },
        });
      }
    }

    // Cap per group, keep a stable group order.
    return SEARCH_GROUPS.flatMap((g) => out.filter((r) => r.group === g).slice(0, SEARCH_PER_GROUP));
  }, [query, schedule.events, buildings, friends.friends, live.locations]);
}
