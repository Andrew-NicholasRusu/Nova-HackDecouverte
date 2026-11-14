import { useCallback, useMemo } from 'react';

import type { IconName } from '@/components/ui/icon';
import { usePersisted } from '@/lib/persisted-store';

export type QuickAction = {
  id: string;
  label: string;
  hint: string;
  icon: IconName;
  /** 'share' shares the weekly schedule; otherwise opens `href`. */
  href?: '/schedule' | '/navigator' | '/live' | '/friends' | '/settings';
  kind?: 'share';
};

export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'add-class', label: 'Add a class', hint: 'Put a class on your week', icon: 'add', href: '/schedule' },
  { id: 'share-schedule', label: 'Share Schedule', hint: 'Send your week as text', icon: 'ios-share', kind: 'share' },
  { id: 'directions', label: 'Get Directions', hint: 'Browse buildings and walk there', icon: 'near-me', href: '/navigator' },
  { id: 'find-room', label: 'Find a room', hint: 'Floor plans and room search', icon: 'search', href: '/navigator' },
  { id: 'cafeteria', label: 'Check Cafeteria', hint: 'Live line lengths', icon: 'local-cafe', href: '/live' },
  { id: 'study', label: 'Find a study seat', hint: 'Libraries and lounges', icon: 'menu-book', href: '/live' },
  { id: 'free-friends', label: 'Who is free', hint: 'Friends between classes', icon: 'group', href: '/friends' },
  { id: 'report', label: 'Report a wait', hint: 'Help other students', icon: 'campaign', href: '/live' },
  { id: 'settings', label: 'Settings', hint: 'Your account and shortcuts', icon: 'settings', href: '/settings' },
];

export const DEFAULT_QUICK_IDS = ['add-class', 'directions', 'share-schedule', 'cafeteria'];
export const MAX_QUICK = 6;

export function useQuickActions() {
  const [ids, setIds, ready] = usePersisted<string[]>('orbit.quick-actions', DEFAULT_QUICK_IDS);

  const selected = useMemo(
    () => ids.map((id) => QUICK_ACTIONS.find((a) => a.id === id)).filter((a): a is QuickAction => !!a),
    [ids],
  );

  const toggle = useCallback(
    (id: string) =>
      setIds((p) => (p.includes(id) ? (p.length > 1 ? p.filter((x) => x !== id) : p) : p.length < MAX_QUICK ? [...p, id] : p)),
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
  const reset = useCallback(() => setIds(DEFAULT_QUICK_IDS), [setIds]);

  return { ids, selected, ready, toggle, move, reset };
}
