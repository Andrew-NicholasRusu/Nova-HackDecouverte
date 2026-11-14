/**
 * Class events data access. One shared in-memory store so the Schedule screen and the
 * dashboard always show the same data and both update after an edit.
 */

import { useEffect, useSyncExternalStore } from 'react';

import { supabase } from '@/lib/supabase';

import type { ClassEvent, ClassInput, Weekday } from './model';

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
  source: ClassEvent['source'];
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

function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === 'PGRST205' || error.code === '42P01') {
    return 'The schedule table is missing. Run supabase/migrations/20261114010000_class_events.sql in the Supabase SQL editor.';
  }
  return error.message;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export type ScheduleState =
  | { status: 'idle' | 'loading'; events: ClassEvent[] }
  | { status: 'ready'; events: ClassEvent[] }
  | { status: 'error'; events: ClassEvent[]; error: string };

let state: ScheduleState = { status: 'idle', events: [] };
const listeners = new Set<() => void>();

function setState(next: ScheduleState) {
  state = next;
  listeners.forEach((l) => l());
}

const sortEvents = (events: ClassEvent[]) =>
  [...events].sort((a, b) => a.startTime.localeCompare(b.startTime) || a.courseCode.localeCompare(b.courseCode));

export async function loadClassEvents() {
  setState({ status: 'loading', events: state.events });
  const { data, error } = await supabase.from('class_events').select(COLUMNS).order('start_time');
  if (error) setState({ status: 'error', events: state.events, error: friendlyError(error) });
  else setState({ status: 'ready', events: sortEvents((data as Row[]).map(fromRow)) });
}

// Forget everything when the student signs out or another account signs in.
let currentUserId: string | undefined;
supabase.auth.onAuthStateChange((_event, session) => {
  const userId = session?.user.id;
  if (userId !== currentUserId) {
    currentUserId = userId;
    setState({ status: 'idle', events: [] });
  }
});

/** All of the signed-in student's classes, loaded on first use. */
export function useClassEvents() {
  const snapshot = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
  useEffect(() => {
    if (snapshot.status === 'idle') void loadClassEvents();
  }, [snapshot.status]);
  return snapshot;
}

// ---------------------------------------------------------------------------
// Mutations (throw a user-readable Error on failure)
// ---------------------------------------------------------------------------

export async function createClasses(inputs: ClassInput[], source: ClassEvent['source']) {
  if (inputs.length === 0) return;
  const { data, error } = await supabase
    .from('class_events')
    .insert(inputs.map((c) => ({ ...toRow(c), source })))
    .select(COLUMNS);
  if (error) throw new Error(friendlyError(error));
  setState({ status: 'ready', events: sortEvents([...state.events, ...(data as Row[]).map(fromRow)]) });
}

export async function updateClass(id: string, input: ClassInput) {
  const { data, error } = await supabase.from('class_events').update(toRow(input)).eq('id', id).select(COLUMNS).single();
  if (error) throw new Error(friendlyError(error));
  const updated = fromRow(data as Row);
  setState({ status: 'ready', events: sortEvents(state.events.map((e) => (e.id === id ? updated : e))) });
}

export async function deleteClass(id: string) {
  const { error } = await supabase.from('class_events').delete().eq('id', id);
  if (error) throw new Error(friendlyError(error));
  setState({ status: 'ready', events: state.events.filter((e) => e.id !== id) });
}
