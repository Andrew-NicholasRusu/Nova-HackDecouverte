import { useCallback, useMemo } from 'react';

import { useNow } from '@/hooks/use-now';
import { usePersisted } from '@/lib/persisted-store';
import {
  LEVEL_RANK,
  PLACES,
  typicalLevel,
  type Kind,
  type Level,
  type Place,
} from './catalog';

type Reports = Record<string, { level: Level; at: number }>;

/** Student reports expire after 2 h so nobody plans around old numbers. */
const FRESH_MS = 2 * 60 * 60_000;

export function ago(at: number, now = Date.now()) {
  const mins = Math.max(0, Math.round((now - at) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.round(mins / 60)} h ago`;
}

export type PlaceStatus = {
  place: Place;
  level: Level;
  /** 'you' when reported from this device within 2 h, else the typical level for the hour. */
  source: 'you' | 'typical';
  at?: number;
};

export function useLive() {
  const now = useNow(60_000);
  const [reports, setReports, ready] = usePersisted<Reports>('orbit.live.places', {});
  const nowMs = now.getTime();

  const report = useCallback(
    (id: string, level: Level) => setReports((p) => ({ ...p, [id]: { level, at: Date.now() } })),
    [setReports],
  );

  return useMemo(() => {
    const statuses: PlaceStatus[] = PLACES.map((place) => {
      const r = reports[place.id];
      return r && nowMs - r.at < FRESH_MS
        ? { place, level: r.level, source: 'you', at: r.at }
        : { place, level: typicalLevel(place, new Date(nowMs)), source: 'typical' };
    });
    const best = (kind: Kind) =>
      statuses.filter((s) => s.place.kind === kind).sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level])[0];
    return { ready, now, nowMs, statuses, report, bestFood: best('wait'), bestStudy: best('seats') };
  }, [reports, nowMs, now, ready, report]);
}
