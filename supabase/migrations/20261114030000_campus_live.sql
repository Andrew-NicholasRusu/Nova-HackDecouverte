-- ORBIT · Campus Live (PLAN.md §2 Module D, §6 campus live, §7 abuse prevention)
-- Community reports of cafeteria lines and study-space seating.
-- These are student observations, never official Concordia data.

create table public.live_locations (
  id            uuid primary key default gen_random_uuid(),
  campus        text not null check (campus in ('SGW', 'LOY')),
  name          text not null check (char_length(name) between 1 and 80),
  category      text not null check (category in ('food', 'study')),
  building_code text not null default '' check (char_length(building_code) <= 10),
  detail        text not null default '' check (char_length(detail) <= 120),
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (campus, name)
);

comment on table public.live_locations is
  'Places students can report on. Curated by the ORBIT team (no client writes).';

-- level meaning depends on the location category:
--   food : 0 no line · 1 short (<5 min) · 2 medium (5–15 min) · 3 long (15+ min)
--   study: 0 lots of seats · 1 some seats · 2 nearly full · 3 full
create table public.live_reports (
  id           uuid primary key default gen_random_uuid(),
  location_id  uuid not null references public.live_locations (id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  level        smallint not null check (level between 0 and 3),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '45 minutes'
);

create index live_reports_location_idx on public.live_reports (location_id, created_at desc);
create index live_reports_user_idx on public.live_reports (user_id, created_at desc);

alter table public.live_locations enable row level security;
alter table public.live_reports enable row level security;

create policy "Signed-in students see active locations"
  on public.live_locations for select to authenticated
  using (active);

-- live_reports has no client policies at all: reads and writes go through the functions
-- below, so reporter identities are never exposed.
revoke all on public.live_locations, public.live_reports from anon, authenticated;
grant select on public.live_locations to authenticated;

-- Recent (unexpired) reports per location. `contributor` is a per-location number that
-- only tells reports from the same student apart; it can't be linked to a profile.
create function public.live_feed()
returns table (
  location_id uuid,
  level smallint,
  created_at timestamptz,
  contributor integer,
  mine boolean
)
language sql stable security definer set search_path = '' as $$
  select r.location_id,
         r.level,
         r.created_at,
         (dense_rank() over (partition by r.location_id order by r.user_id))::integer,
         r.user_id = auth.uid()
  from public.live_reports r
  join public.live_locations l on l.id = r.location_id and l.active
  where r.expires_at > now()
    and auth.uid() is not null
  order by r.created_at desc;
$$;

-- Submit an observation. Rate limits: one report per location every 10 minutes,
-- and 20 reports per hour overall, per student.
create function public.submit_live_report(location uuid, report_level smallint)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'Not signed in.'; end if;
  if report_level is null or report_level not between 0 and 3 then raise exception 'Invalid report.'; end if;
  if not exists (select 1 from public.live_locations where id = location and active) then
    raise exception 'That place is not available for reports.';
  end if;
  if exists (
    select 1 from public.live_reports
    where user_id = me and location_id = location and created_at > now() - interval '10 minutes'
  ) then
    raise exception 'You reported this place in the last 10 minutes. Thanks — try again a bit later.';
  end if;
  if (select count(*) from public.live_reports where user_id = me and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'Too many reports in the last hour. Try again later.';
  end if;

  insert into public.live_reports (location_id, user_id, level) values (location, me, report_level);

  -- Retention: reports are only useful for minutes; keep a week for abuse review, then drop.
  delete from public.live_reports where created_at < now() - interval '7 days';
end;
$$;

revoke all on function public.live_feed() from public, anon;
revoke all on function public.submit_live_report(uuid, smallint) from public, anon;
grant execute on function public.live_feed() to authenticated;
grant execute on function public.submit_live_report(uuid, smallint) to authenticated;

-- Starter places. Team: check names/locations on campus and edit freely.
insert into public.live_locations (campus, name, category, building_code, detail) values
  ('SGW', 'Webster Library', 'study', 'LB', 'J.W. McConnell Building'),
  ('SGW', 'Hall Building study areas', 'study', 'H', 'Hall Building'),
  ('SGW', 'People''s Potato', 'food', 'H', 'Hall Building, 7th floor'),
  ('LOY', 'Vanier Library', 'study', 'VL', 'Vanier Library Building'),
  ('LOY', 'Hive Café', 'food', '', 'Loyola Campus');
