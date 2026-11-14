import { useCallback, useMemo } from 'react';

import { DEFAULT_QUICK_ACTION_IDS, MAX_QUICK_ACTIONS, STORAGE_KEYS } from '@/data/constants';
import { QUICK_ACTIONS } from '@/data/quick-actions';
import type { QuickAction } from '@/data/types';
import { usePersisted } from '@/lib/persisted-store';

/** The student's home screen shortcuts, saved on this device. */
export function useQuickActions() {
  const [ids, setIds, ready] = usePersisted<string[]>(STORAGE_KEYS.quickActions, DEFAULT_QUICK_ACTION_IDS);

  const selected = useMemo(
    () => ids.map((id) => QUICK_ACTIONS.find((a) => a.id === id)).filter((a): a is QuickAction => !!a),
    [ids],
  );

  const toggle = useCallback(
    (id: string) =>
      setIds((p) => (p.includes(id) ? (p.length > 1 ? p.filter((x) => x !== id) : p) : p.length < MAX_QUICK_ACTIONS ? [...p, id] : p)),
    [setIds],
  );
  const move = useCallback(
    (id: string, delta: -1 | 1) =>
      setIds((p) => {
        const i = p.indexOf(id);
        const j = i + delta;
        if (i < 0 || j < 0 || j >= p.length) return p;
        const next = [...p];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
      }),
    [setIds],
  );
  const reset = useCallback(() => setIds(DEFAULT_QUICK_ACTION_IDS), [setIds]);

  return { ids, selected, ready, toggle, move, reset };
}
