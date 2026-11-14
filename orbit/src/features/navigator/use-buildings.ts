import { useCallback, useEffect, useMemo, useState } from 'react';

import { apiGet } from '@/lib/api';

/** Client-side view of the building model served by /api/concordia/buildings. */
export type Building = {
  campus: string;
  code: string;
  name: string;
  longName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

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
