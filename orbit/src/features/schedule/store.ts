/**
 * Class events data access. One shared in-memory store so the Schedule screen and the
 * dashboard always show the same data and both update after an edit.
 */

import { useEffect } from 'react';

import type { ClassSource, Weekday } from '@/data/enums';
import type { ClassEvent, ClassInput } from '@/data/types';
import { createStore } from '@/lib/store';
import { onUserChange, supabase, toUserError } from '@/lib/supabase';

type Row = {
  id: string;
  course_code: string;
  title: string;
  section: string;
  kind: ClassEvent['kind'];
  building_code: string;
  room: string;
  days: number[];
  start_time: string;
  end_time: string;
  start_date: string;
  end_date: string;
  color: string | null;
  source: ClassSource;
};

const COLUMNS =
  'id, course_code, title, section, kind, building_code, room, days, start_time, end_time, start_date, end_date, color, source';

const fromRow = (r: Row): ClassEvent => ({
  id: r.id,
  courseCode: r.course_code,
  title: r.title,
  section: r.section,
  kind: r.kind,
  buildingCode: r.building_code,
  room: r.room,
  days: r.days as Weekday[],
  startTime: r.start_time.slice(0, 5),
  endTime: r.end_time.slice(0, 5),
  startDate: r.start_date,
  endDate: r.end_date,
  color: r.color,
  source: r.source,
});

const toRow = (c: ClassInput) => ({
  course_code: c.courseCode,
  title: c.title,
  section: c.section,
  kind: c.kind,
  building_code: c.buildingCode,
  room: c.room,
  days: c.days,
  start_time: c.startTime,
  end_time: c.endTime,
  start_date: c.startDate,
  end_date: c.endDate,
  color: c.color,
});

const friendlyError = (error: { code?: string; message: string }) =>
  toUserError(error, 'The schedule table is missing. Run supabase/migrations/20261114010000_class_events.sql in the Supabase SQL editor.');

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export type ScheduleState =
  | { status: 'idle' | 'loading'; events: ClassEvent[] }
  | { status: 'ready'; events: ClassEvent[] }
  | { status: 'error'; events: ClassEvent[]; error: string };

const store = createStore<ScheduleState>({ status: 'idle', events: [] });

const sortEvents = (events: ClassEvent[]) =>
  [...events].sort((a, b) => a.startTime.localeCompare(b.startTime) || a.courseCode.localeCompare(b.courseCode));

export async function loadClassEvents() {
  store.set({ status: 'loading', events: store.get().events });
  const { data, error } = await supabase.from('class_events').select(COLUMNS).order('start_time');
  if (error) store.set({ status: 'error', events: store.get().events, error: friendlyError(error) });
  else store.set({ status: 'ready', events: sortEvents((data as Row[]).map(fromRow)) });
}

// Forget everything when the student signs out or another account signs in.
onUserChange(() => store.set({ status: 'idle', events: [] }));

/** All of the signed-in student's classes, loaded on first use. */
export function useClassEvents() {
  const snapshot = store.useSnapshot();
  useEffect(() => {
    if (snapshot.status === 'idle') void loadClassEvents();
  }, [snapshot.status]);
  return snapshot;
}

// ---------------------------------------------------------------------------
// Mutations (throw a user-readable Error on failure)
// ---------------------------------------------------------------------------

export async function createClasses(inputs: ClassInput[], source: ClassSource) {
  if (inputs.length === 0) return;
  const { data, error } = await supabase
    .from('class_events')
    .insert(inputs.map((c) => ({ ...toRow(c), source })))
    .select(COLUMNS);
  if (error) throw new Error(friendlyError(error));
  store.set({ status: 'ready', events: sortEvents([...store.get().events, ...(data as Row[]).map(fromRow)]) });
}

export async function updateClass(id: string, input: ClassInput) {
  const { data, error } = await supabase.from('class_events').update(toRow(input)).eq('id', id).select(COLUMNS).single();
  if (error) throw new Error(friendlyError(error));
  const updated = fromRow(data as Row);
  store.set({ status: 'ready', events: sortEvents(store.get().events.map((e) => (e.id === id ? updated : e))) });
}

export async function deleteClass(id: string) {
  const { error } = await supabase.from('class_events').delete().eq('id', id);
  if (error) throw new Error(friendlyError(error));
  store.set({ status: 'ready', events: store.get().events.filter((e) => e.id !== id) });
}
