/**
 * Data access for the schedule module. The only place that knows the
 * database column names; everything else uses the models in lib/schedule.
 */

import { supabase } from '@/lib/supabase';
import type { ClassEvent, ClassEventDraft, Schedule, Weekday } from '@/lib/schedule/types';

type ScheduleRow = {
  id: string;
  name: string;
  starts_on: string;
  ends_on: string;
  timezone: string;
  is_active: boolean;
};

type EventRow = {
  id: string;
  schedule_id: string;
  course_code: string;
  course_name: string;
  section: string | null;
  kind: ClassEvent['kind'];
  building_code: string | null;
  room: string | null;
  weekdays: number[];
  start_time: string; // 'HH:MM:SS'
  end_time: string;
  start_date: string;
  end_date: string;
  excluded_dates: string[];
  color: string | null;
  notes: string | null;
  source: ClassEvent['source'];
};

const SCHEDULE_COLUMNS = 'id, name, starts_on, ends_on, timezone, is_active';
const EVENT_COLUMNS =
  'id, schedule_id, course_code, course_name, section, kind, building_code, room, weekdays, start_time, end_time, start_date, end_date, excluded_dates, color, notes, source';

function toSchedule(r: ScheduleRow): Schedule {
  return {
    id: r.id,
    name: r.name,
    startsOn: r.starts_on,
    endsOn: r.ends_on,
    timezone: r.timezone,
    isActive: r.is_active,
  };
}

function toEvent(r: EventRow): ClassEvent {
  return {
    id: r.id,
    scheduleId: r.schedule_id,
    courseCode: r.course_code,
    courseName: r.course_name,
    section: r.section,
    kind: r.kind,
    buildingCode: r.building_code,
    room: r.room,
    weekdays: [...r.weekdays].sort((a, b) => a - b) as Weekday[],
    startTime: r.start_time.slice(0, 5),
    endTime: r.end_time.slice(0, 5),
    startDate: r.start_date,
    endDate: r.end_date,
    excludedDates: [...r.excluded_dates].sort(),
    color: r.color,
    notes: r.notes,
    source: r.source,
  };
}

function toEventRow(d: ClassEventDraft) {
  return {
    course_code: d.courseCode,
    course_name: d.courseName,
    section: d.section,
    kind: d.kind,
    building_code: d.buildingCode,
    room: d.room,
    weekdays: d.weekdays,
    start_time: d.startTime,
    end_time: d.endTime,
    start_date: d.startDate,
    end_date: d.endDate,
    excluded_dates: d.excludedDates,
    color: d.color,
    notes: d.notes,
    source: d.source,
  };
}

/** Turn PostgREST errors into something a student can act on. */
function fail(error: { code?: string; message: string }): never {
  if (error.code === '42P01' || error.code === 'PGRST205') {
    throw new Error('The schedule tables are not set up on the server yet. Ask the team to run the latest migration.');
  }
  if (error.code === '23514') throw new Error('Some class details are invalid. Check the times and dates.');
  throw new Error(error.message);
}

export async function fetchScheduleData(): Promise<{ schedules: Schedule[]; events: ClassEvent[] }> {
  const [s, e] = await Promise.all([
    supabase.from('student_schedules').select(SCHEDULE_COLUMNS).order('starts_on', { ascending: false }),
    supabase.from('class_events').select(EVENT_COLUMNS),
  ]);
  if (s.error) fail(s.error);
  if (e.error) fail(e.error);
  return {
    schedules: (s.data as ScheduleRow[]).map(toSchedule),
    events: (e.data as EventRow[]).map(toEvent),
  };
}

export type ScheduleInput = Pick<Schedule, 'name' | 'startsOn' | 'endsOn'>;

export async function insertSchedule(ownerId: string, input: ScheduleInput): Promise<Schedule> {
  const { data, error } = await supabase
    .from('student_schedules')
    .insert({ owner_id: ownerId, name: input.name, starts_on: input.startsOn, ends_on: input.endsOn })
    .select(SCHEDULE_COLUMNS)
    .single();
  if (error) fail(error);
  return toSchedule(data as ScheduleRow);
}

export async function updateScheduleRow(id: string, input: ScheduleInput): Promise<void> {
  const { error } = await supabase
    .from('student_schedules')
    .update({ name: input.name, starts_on: input.startsOn, ends_on: input.endsOn })
    .eq('id', id);
  if (error) fail(error);
}

export async function deleteScheduleRow(id: string): Promise<void> {
  const { error } = await supabase.from('student_schedules').delete().eq('id', id);
  if (error) fail(error);
}

export async function activateSchedule(id: string): Promise<void> {
  const { error } = await supabase.rpc('set_active_schedule', { target: id });
  if (error) fail(error);
}

export async function insertEvents(
  ownerId: string,
  scheduleId: string,
  drafts: ClassEventDraft[],
): Promise<ClassEvent[]> {
  if (drafts.length === 0) return [];
  const { data, error } = await supabase
    .from('class_events')
    .insert(drafts.map((d) => ({ ...toEventRow(d), owner_id: ownerId, schedule_id: scheduleId })))
    .select(EVENT_COLUMNS);
  if (error) fail(error);
  return (data as EventRow[]).map(toEvent);
}

export async function updateEventRow(id: string, draft: ClassEventDraft): Promise<ClassEvent> {
  const { data, error } = await supabase
    .from('class_events')
    .update(toEventRow(draft))
    .eq('id', id)
    .select(EVENT_COLUMNS)
    .single();
  if (error) fail(error);
  return toEvent(data as EventRow);
}

export async function deleteEventRow(id: string): Promise<void> {
  const { error } = await supabase.from('class_events').delete().eq('id', id);
  if (error) fail(error);
}
