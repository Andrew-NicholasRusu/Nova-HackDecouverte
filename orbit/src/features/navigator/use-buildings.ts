import { useCallback, useEffect, useState } from 'react';

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

export function useBuildings() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiGet<Building[]>('/api/concordia/buildings')
      .then((buildings) => !cancelled && setState({ status: 'ready', buildings }))
      .catch(
        (e: Error) => !cancelled && setState({ status: 'error', message: e.message }),
      );
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
