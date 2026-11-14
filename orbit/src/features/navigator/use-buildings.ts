import { useCallback, useEffect, useMemo, useState } from 'react';

import type { CampusFilter } from '@/data/enums';
import type { Building, Coordinates } from '@/data/types';
import { apiGet } from '@/lib/api';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; buildings: Building[] };

/** One shared request: the dashboard, search, Map and Campus Live all read the same building list. */
let cache: Building[] | null = null;
let inflight: Promise<Building[]> | null = null;

function fetchOnce(force = false) {
  if (cache && !force) return Promise.resolve(cache);
  if (!inflight || force) {
    inflight = apiGet<Building[]>('/api/concordia/buildings')
      .then((b) => (cache = b))
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useBuildings() {
  const [state, setState] = useState<State>(cache ? { status: 'ready', buildings: cache } : { status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchOnce(attempt > 0)
      .then((buildings) => !cancelled && setState({ status: 'ready', buildings }))
      .catch((e: Error) => !cancelled && setState({ status: 'error', message: e.message }));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, retry };
}

/** Building lookup by code (e.g. "MB", "H"), empty until the list loads. */
export function useBuildingIndex() {
  const data = useBuildings();
  return useMemo(() => {
    const byCode = new Map<string, Building>();
    if (data.status === 'ready') for (const b of data.buildings) byCode.set(b.code.toUpperCase(), b);
    return byCode;
  }, [data]);
}

export const hasCoords = (b: Building): b is Building & Coordinates => b.latitude != null && b.longitude != null;

/** Case-insensitive match on code, names and address; `q` is already lower-cased. */
export const matchesBuilding = (b: Building, q: string) => `${b.code} ${b.longName} ${b.name} ${b.address}`.toLowerCase().includes(q);

/** Buildings on `campus` matching `q`: the selected one first, then downtown, then by code. */
export function filterBuildings(buildings: Building[], campus: CampusFilter, q: string, selected: string | null) {
  return buildings
    .filter((b) => (campus === 'ALL' || b.campus === campus) && (!q || matchesBuilding(b, q)))
    .sort(
      (a, b) =>
        Number(b.code === selected) - Number(a.code === selected) ||
        Number(b.campus === 'SGW') - Number(a.campus === 'SGW') ||
        a.code.localeCompare(b.code),
    );
}
