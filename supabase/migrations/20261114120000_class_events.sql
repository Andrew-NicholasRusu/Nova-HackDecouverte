-- ORBIT · class_events (PLAN.md §2 Module A, §6, §7)
-- One standardized class model used by the calendar, dashboard and (later) friends/notifications.
--
-- Decision: no separate student_schedules table yet. "Switching between semesters" is a filter on
-- term_label; a table can be added if schedules ever need their own settings or sharing.
--
-- Time model: recurring classes are wall-clock times in the campus time zone (start_time/end_time
-- are local times in `timezone`), repeating on `days` between start_date and end_date inclusive.
-- Storing local time + zone (not UTC instants) keeps classes correct across DST changes.

create table public.class_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  term_label    text not null check (char_length(term_label) between 1 and 40),
  course_code   text not null check (course_code ~ '^[A-Z]{3,4} [0-9]{3,4}[A-Z]?$'),
  course_title  text not null default '' check (char_length(course_title) <= 120),
  component     text not null default 'LEC' check (component in ('LEC', 'TUT', 'LAB', 'SEM', 'OTHER')),
  section       text not null default '' check (char_length(section) <= 10),
  building_code text not null default '' check (char_length(building_code) <= 10),
  room          text not null default '' check (char_length(room) <= 20),
  -- ISO weekdays: 1 = Monday … 7 = Sunday
  days          smallint[] not null check (
                  cardinality(days) between 1 and 7
                  and days <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
                ),
  start_time    time not null,
  end_time      time not null,
  start_date    date not null,
  end_date      date not null,
  timezone      text not null default 'America/Toronto',
  color         text not null default 'accent' check (char_length(color) <= 20),
  source        text not null default 'manual' check (source in ('manual', 'ics', 'concordia')),
  notes         text check (char_length(notes) <= 500),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint class_events_time_order check (end_time > start_time),
  constraint class_events_date_order check (end_date >= start_date),
  constraint class_events_max_span check (end_date - start_date <= 366)
);

comment on table public.class_events is 'A recurring class meeting owned by one student.';

create index class_events_user_term_idx on public.class_events (user_id, term_label);

create trigger class_events_set_updated_at
  before update on public.class_events
  for each row execute function public.set_updated_at();

-- Row Level Security: owner-only for now. Friend visibility arrives with Milestone 5
-- through explicit schedule_permissions, never by loosening these policies.
alter table public.class_events enable row level security;

create policy "Students can read their own classes"
  on public.class_events for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students can add their own classes"
  on public.class_events for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Students can update their own classes"
  on public.class_events for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Students can delete their own classes"
  on public.class_events for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.class_events from anon;
grant select, insert, update, delete on public.class_events to authenticated;
