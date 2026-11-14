import { useSyncExternalStore } from 'react';

/**
 * A module-level state container shared by every screen that reads it. Each data store
 * (profile, schedule, friends, Campus Live) is one of these plus its loaders and mutations.
 */
export function createStore<S>(initial: S) {
  let state = initial;
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  const get = () => state;

  return {
    get,
    set(next: S) {
      state = next;
      listeners.forEach((l) => l());
    },
    /** Subscribes the component to the store. */
    useSnapshot: () => useSyncExternalStore(subscribe, get, get),
  };
}
