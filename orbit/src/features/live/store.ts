import { useEffect, useSyncExternalStore } from 'react';

import { supabase } from '@/lib/supabase';

import { calculateReportConfidence, type LiveEstimate, type LiveLevel, type LiveReport } from './confidence';

export type LiveCategory = 'food' | 'study';

export type LiveLocation = {
  id: string;
  campus: 'SGW' | 'LOY';
  name: string;
  category: LiveCategory;
  buildingCode: string;
  detail: string;
  reports: LiveReport[];
};

export const LEVEL_LABEL: Record<LiveCategory, Record<LiveLevel, string>> = {
  food: { 0: 'No line', 1: 'Short line · under 5 min', 2: 'Medium line · 5–15 min', 3: 'Long line · 15+ min' },
  study: { 0: 'Lots of seats', 1: 'Some seats', 2: 'Nearly full', 3: 'Full' },
};

export const LEVEL_SHORT: Record<LiveCategory, Record<LiveLevel, string>> = {
  food: { 0: 'No line', 1: 'Short', 2: 'Medium', 3: 'Long' },
  study: { 0: 'Lots', 1: 'Some', 2: 'Nearly full', 3: 'Full' },
};

type State =
  | { status: 'idle' | 'loading' | 'ready'; locations: LiveLocation[]; loadedAt: number }
  | { status: 'error'; locations: LiveLocation[]; loadedAt: number; error: string };

let state: State = { status: 'idle', locations: [], loadedAt: 0 };
const listeners = new Set<() => void>();
const setState = (next: State) => {
  state = next;
  listeners.forEach((l) => l());
};

let currentUserId: string | undefined;
supabase.auth.onAuthStateChange((_e, session) => {
  if (session?.user.id !== currentUserId) {
    currentUserId = session?.user.id;
    setState({ status: 'idle', locations: [], loadedAt: 0 });
  }
});

function friendlyError(error: { code?: string; message: string }) {
  if (error.code === 'PGRST205' || error.code === 'PGRST202' || error.code === '42P01') {
    return 'Campus Live tables are missing. Run supabase/migrations/20261114030000_campus_live.sql in the Supabase SQL editor.';
  }
  return error.message;
}

export async function loadLive() {
  setState({ ...state, status: 'loading' } as State);
  const [locs, feed] = await Promise.all([
    supabase.from('live_locations').select('id, campus, name, category, building_code, detail').order('name'),
    supabase.rpc('live_feed'),
  ]);
  const error = locs.error ?? feed.error;
  if (error) {
    setState({ status: 'error', locations: state.locations, loadedAt: state.loadedAt, error: friendlyError(error) });
    return;
  }
  const byLocation = new Map<string, LiveReport[]>();
  for (const r of feed.data as { location_id: string; level: LiveLevel; created_at: string; contributor: number; mine: boolean }[]) {
    const list = byLocation.get(r.location_id) ?? [];
    list.push({ level: r.level, createdAt: new Date(r.created_at), contributor: r.contributor, mine: r.mine });
    byLocation.set(r.location_id, list);
  }
  const locations = (
    locs.data as { id: string; campus: 'SGW' | 'LOY'; name: string; category: LiveCategory; building_code: string; detail: string }[]
  ).map((l) => ({
    id: l.id,
    campus: l.campus,
    name: l.name,
    category: l.category,
    buildingCode: l.building_code,
    detail: l.detail,
    reports: byLocation.get(l.id) ?? [],
  }));
  setState({ status: 'ready', locations, loadedAt: Date.now() });
}

const REFRESH_MS = 60_000;

/** Locations with their recent reports; refreshes every minute while a screen uses it. */
export function useLive() {
  const snapshot = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
  useEffect(() => {
    if (snapshot.status === 'idle') void loadLive();
  }, [snapshot.status]);
  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - state.loadedAt >= REFRESH_MS - 1000) void loadLive();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, []);
  return snapshot;
}

export function estimateFor(location: LiveLocation, now: Date): LiveEstimate {
  return calculateReportConfidence(location.reports, now);
}

export async function submitReport(locationId: string, level: LiveLevel) {
  const { error } = await supabase.rpc('submit_live_report', { location: locationId, report_level: level });
  if (error) throw new Error(friendlyError(error));
  await loadLive();
}
