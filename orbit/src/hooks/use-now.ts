import { useEffect, useState } from 'react';

import { CLOCK_TICK_MS } from '@/data/constants';

/** Current time, refreshed every `intervalMs` so countdowns stay live. */
export function useNow(intervalMs = CLOCK_TICK_MS): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
