-- ORBIT · class_events (PLAN.md §2 Module A, §6 academic system, §7 security)
-- One row = one weekly-recurring class (or a one-off when start_date = end_date).
-- Times are wall-clock times in `timezone` (campus time), dates are calendar dates.
-- Simplification for the hackathon MVP: no separate student_schedules / courses tables yet;
-- a student's schedule is simply their set of class_events.

create table public.class_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  course_code   text not null check (char_length(course_code) between 1 and 20),
  title         text not null default '' check (char_length(title) <= 120),
  section       text not null default '' check (char_length(section) <= 20),
  kind          text not null default 'lecture'
                  check (kind in ('lecture', 'tutorial', 'lab', 'exam', 'other')),
  building_code text not null default '' check (char_length(building_code) <= 10),
  room          text not null default '' check (char_length(room) <= 20),
  -- ISO weekdays, Monday = 1 … Sunday = 7
  days          smallint[] not null
                  check (cardinality(days) between 1 and 7 and days <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]),
  start_time    time not null,
  end_time      time not null,
  start_date    date not null,
  end_date      date not null,
  timezone      text not null default 'America/Toronto',
  color         text check (color ~ '^#[0-9A-Fa-f]{6}$'),
  source        text not null default 'manual' check (source in ('manual', 'ics')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (end_time > start_time),
  check (end_date >= start_date),
  check (end_date - start_date <= 366)
);

comment on table public.class_events is
  'A student''s classes. Recurs weekly on `days` between start_date and end_date, in campus wall time.';

create index class_events_user_id_idx on public.class_events (user_id, end_date);

create trigger class_events_set_updated_at
  before update on public.class_events
  for each row execute function public.set_updated_at();

-- Row Level Security: a student only ever sees and edits their own classes.
-- Friends' access will go through explicit schedule permissions (Milestone 5), not these policies.
alter table public.class_events enable row level security;

create policy "Students read their own classes"
  on public.class_events for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students add their own classes"
  on public.class_events for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Students edit their own classes"
  on public.class_events for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Students delete their own classes"
  on public.class_events for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.class_events from anon;
grant select, insert, update, delete on public.class_events to authenticated;
