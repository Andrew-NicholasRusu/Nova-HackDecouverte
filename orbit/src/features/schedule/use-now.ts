import { useEffect, useState } from 'react';

import { localMoment, type LocalMoment } from '@/core/schedule/time';

/** Campus-local "now", refreshed every 30 seconds for countdowns. */
export function useNow(): LocalMoment {
  const [now, setNow] = useState(() => localMoment(new Date()));
  useEffect(() => {
    const id = setInterval(() => setNow(localMoment(new Date())), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}
