-- ORBIT · schedule module (PLAN.md Module A, §6 academic system, Milestone 3)
--
-- Design notes
-- * One standardized class-event model (class_events) used by every module.
-- * Recurring classes are stored as local wall-clock times plus the schedule's
--   IANA time zone, not as UTC instants: a 10:15 class must stay at 10:15
--   when DST changes. Concrete instants are derived per occurrence in the app
--   (orbit/src/lib/schedule). created_at/updated_at remain UTC timestamptz.
-- * owner_id is duplicated on class_events (kept consistent by a composite
--   foreign key) so RLS is a simple equality check without a join.
-- * Friends' read access to schedules (schedule_permissions) is Milestone 5.

create table public.student_schedules (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  starts_on   date not null,
  ends_on     date not null,
  timezone    text not null default 'America/Toronto'
                check (char_length(timezone) between 1 and 64),
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint student_schedules_dates_check check (ends_on >= starts_on),
  constraint student_schedules_span_check check (ends_on - starts_on <= 366),
  -- Target for the composite FK from class_events.
  constraint student_schedules_id_owner_key unique (id, owner_id)
);

comment on table public.student_schedules is
  'A student''s schedule for one academic term. At most one is active per student.';

create index student_schedules_owner_idx on public.student_schedules (owner_id);
create unique index student_schedules_one_active_idx
  on public.student_schedules (owner_id) where is_active;

create trigger student_schedules_set_updated_at
  before update on public.student_schedules
  for each row execute function public.set_updated_at();


create table public.class_events (
  id             uuid primary key default gen_random_uuid(),
  schedule_id    uuid not null,
  owner_id       uuid not null,
  course_code    text not null default '' check (char_length(course_code) <= 20),
  course_name    text not null default '' check (char_length(course_name) <= 120),
  section        text check (char_length(section) <= 20),
  kind           text not null default 'lecture'
                   check (kind in ('lecture', 'tutorial', 'lab', 'seminar', 'exam', 'other')),
  building_code  text check (char_length(building_code) <= 10),
  room           text check (char_length(room) <= 20),
  -- ISO weekdays (1 = Monday … 7 = Sunday). Empty = one-off event on start_date.
  weekdays       smallint[] not null default '{}'
                   check (weekdays <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
                          and cardinality(weekdays) <= 7),
  start_time     time not null,
  end_time       time not null,
  start_date     date not null,
  end_date       date not null,
  excluded_dates date[] not null default '{}' check (cardinality(excluded_dates) <= 200),
  color          text check (color ~ '^#[0-9A-Fa-f]{6}$'),
  notes          text check (char_length(notes) <= 500),
  source         text not null default 'manual'
                   check (source in ('manual', 'ics', 'pdf', 'image')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint class_events_name_check check (course_code <> '' or course_name <> ''),
  constraint class_events_times_check check (end_time > start_time),
  constraint class_events_dates_check check (end_date >= start_date),
  constraint class_events_span_check check (end_date - start_date <= 366),
  constraint class_events_schedule_fkey
    foreign key (schedule_id, owner_id)
    references public.student_schedules (id, owner_id) on delete cascade
);

comment on table public.class_events is
  'Standardized class event (PLAN.md Module A). Times are local to the schedule time zone.';

create index class_events_schedule_idx on public.class_events (schedule_id);
create index class_events_owner_idx on public.class_events (owner_id);

create trigger class_events_set_updated_at
  before update on public.class_events
  for each row execute function public.set_updated_at();


-- Row Level Security: students only see and change their own schedules.
alter table public.student_schedules enable row level security;
alter table public.class_events enable row level security;

create policy "Students manage their own schedules"
  on public.student_schedules for all
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Students manage their own class events"
  on public.class_events for all
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

revoke all on public.student_schedules from anon;
revoke all on public.class_events from anon;
grant select, insert, update, delete on public.student_schedules to authenticated;
grant select, insert, update, delete on public.class_events to authenticated;


-- Make one schedule the active one atomically (the partial unique index
-- would reject a two-step client update). SECURITY INVOKER so RLS applies.
create function public.set_active_schedule(target uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.student_schedules
    where id = target and owner_id = (select auth.uid())
  ) then
    raise exception 'schedule not found' using errcode = 'P0002';
  end if;

  update public.student_schedules
     set is_active = false
   where owner_id = (select auth.uid()) and is_active and id <> target;

  update public.student_schedules
     set is_active = true
   where id = target;
end;
$$;

revoke all on function public.set_active_schedule(uuid) from public, anon;
grant execute on function public.set_active_schedule(uuid) to authenticated;
