import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useSyncExternalStore } from 'react';

type Snapshot<T> = { value: T; ready: boolean };

type Store<T> = {
  snap: Snapshot<T>;
  listeners: Set<() => void>;
  loading: Promise<void> | null;
};

const stores = new Map<string, Store<unknown>>();

function getStore<T>(key: string, initial: T): Store<T> {
  let s = stores.get(key) as Store<T> | undefined;
  if (!s) {
    s = { snap: { value: initial, ready: false }, listeners: new Set(), loading: null };
    stores.set(key, s as Store<unknown>);
  }
  return s;
}

function emit<T>(s: Store<T>, snap: Snapshot<T>) {
  s.snap = snap;
  s.listeners.forEach((l) => l());
}

function ensureLoaded<T>(key: string, s: Store<T>) {
  if (s.loading) return;
  s.loading = AsyncStorage.getItem(key)
    .then((raw) => {
      let value = s.snap.value;
      if (raw) {
        try {
          value = JSON.parse(raw) as T;
        } catch {
          /* corrupt entry: fall back to the initial value */
        }
      }
      emit(s, { value, ready: true });
    })
    .catch(() => emit(s, { value: s.snap.value, ready: true }));
}

/** Small AsyncStorage-backed shared state: every hook on the same key sees the same value. */
export function usePersisted<T>(key: string, initial: T) {
  const s = getStore(key, initial);
  const snap = useSyncExternalStore(
    (cb) => {
      s.listeners.add(cb);
      return () => s.listeners.delete(cb);
    },
    () => s.snap,
    () => s.snap,
  );

  useEffect(() => {
    ensureLoaded(key, s);
  }, [key, s]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const value = typeof next === 'function' ? (next as (p: T) => T)(s.snap.value) : next;
      emit(s, { value, ready: true });
      AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
    },
    [key, s],
  );

  return [snap.value, update, snap.ready] as const;
}
