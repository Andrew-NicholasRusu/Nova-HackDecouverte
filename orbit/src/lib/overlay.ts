import { type RefObject, useCallback, useEffect, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

/** Only one overlay (menu, popover or search dropdown) is open at any moment; opening one closes the rest. */
let current: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function useOverlay(id: string) {
  const active = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => null,
  );
  const setOpen = useCallback(
    (open: boolean) => {
      const next = open ? id : current === id ? null : current;
      if (next !== current) {
        current = next;
        emit();
      }
    },
    [id],
  );
  return [active === id, setOpen] as const;
}

/** Web: a press anywhere outside `ref` dismisses the overlay (clicks inside it are left alone). */
export function useDismissOutside(ref: RefObject<unknown>, active: boolean, onDismiss: () => void) {
  useEffect(() => {
    if (!active || Platform.OS !== 'web') return;
    const handler = (e: PointerEvent) => {
      const el = ref.current as HTMLElement | null;
      if (el && !el.contains(e.target as Node)) onDismiss();
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [active, ref, onDismiss]);
}
