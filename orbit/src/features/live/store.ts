/**
 * Campus Live data (PLAN.md §2 Module D): places and their recent reports. Reports are
 * written through the RPCs in supabase/migrations/20261114030000_campus_live.sql.
 */

import { useEffect } from 'react';

import { LIVE_REFRESH_MS } from '@/data/constants';
import type { Campus, LiveCategory, LiveLevel } from '@/data/enums';
import type { LiveEstimate, LiveLocation, LiveReport } from '@/data/types';
import { createStore } from '@/lib/store';
import { onUserChange, supabase, toUserError } from '@/lib/supabase';

import { calculateReportConfidence } from './confidence';

type LocationRow = { id: string; campus: Campus; name: string; category: LiveCategory; building_code: string; detail: string };
type ReportRow = { location_id: string; level: LiveLevel; created_at: string; contributor: number; mine: boolean };

type State =
  | { status: 'idle' | 'loading' | 'ready'; locations: LiveLocation[]; loadedAt: number }
  | { status: 'error'; locations: LiveLocation[]; loadedAt: number; error: string };

const store = createStore<State>({ status: 'idle', locations: [], loadedAt: 0 });
onUserChange(() => store.set({ status: 'idle', locations: [], loadedAt: 0 }));

const friendlyError = (error: { code?: string; message: string }) =>
  toUserError(error, 'Campus Live tables are missing. Run supabase/migrations/20261114030000_campus_live.sql in the Supabase SQL editor.');

export async function loadLive() {
  const { locations, loadedAt } = store.get();
  store.set({ status: 'loading', locations, loadedAt });
  const [locs, feed] = await Promise.all([
    supabase.from('live_locations').select('id, campus, name, category, building_code, detail').order('name'),
    supabase.rpc('live_feed'),
  ]);
  const error = locs.error ?? feed.error;
  if (error) {
    store.set({ status: 'error', locations, loadedAt, error: friendlyError(error) });
    return;
  }
  const byLocation = new Map<string, LiveReport[]>();
  for (const r of feed.data as ReportRow[]) {
    const list = byLocation.get(r.location_id) ?? [];
    list.push({ level: r.level, createdAt: new Date(r.created_at), contributor: r.contributor, mine: r.mine });
    byLocation.set(r.location_id, list);
  }
  store.set({
    status: 'ready',
    loadedAt: Date.now(),
    locations: (locs.data as LocationRow[]).map((l) => ({
      id: l.id,
      campus: l.campus,
      name: l.name,
      category: l.category,
      buildingCode: l.building_code,
      detail: l.detail,
      reports: byLocation.get(l.id) ?? [],
    })),
  });
}

/** Locations with their recent reports; refreshes every minute while a screen uses it. */
export function useLive() {
  const snapshot = store.useSnapshot();
  useEffect(() => {
    if (snapshot.status === 'idle') void loadLive();
  }, [snapshot.status]);
  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - store.get().loadedAt >= LIVE_REFRESH_MS - 1000) void loadLive();
    }, LIVE_REFRESH_MS);
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
