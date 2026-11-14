-- ORBIT · Friends (PLAN.md §2 Module C, §6 social system, §7 security)
-- Friend requests, blocking and per-friend schedule sharing.
-- All state changes go through SECURITY DEFINER functions that enforce the rules;
-- clients can only read their own rows and delete friendships they're part of.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references auth.users (id) on delete cascade,
  addressee_id  uuid not null references auth.users (id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  check (requester_id <> addressee_id)
);
-- One relationship per pair, whichever direction it was requested in.
create unique index friendships_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_addressee_idx on public.friendships (addressee_id, status);
create index friendships_requester_idx on public.friendships (requester_id, status);

create table public.blocks (
  blocker_id  uuid not null references auth.users (id) on delete cascade,
  blocked_id  uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- What `owner` lets `viewer` see of their schedule.
--   private      → nothing
--   availability → free/busy times only (no course, room or title)
--   full         → class details too
create table public.schedule_permissions (
  owner_id    uuid not null references auth.users (id) on delete cascade,
  viewer_id   uuid not null references auth.users (id) on delete cascade,
  level       text not null default 'availability' check (level in ('private', 'availability', 'full')),
  updated_at  timestamptz not null default now(),
  primary key (owner_id, viewer_id),
  check (owner_id <> viewer_id)
);

create trigger schedule_permissions_set_updated_at
  before update on public.schedule_permissions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.friendships enable row level security;
alter table public.blocks enable row level security;
alter table public.schedule_permissions enable row level security;

create policy "See friendships you're part of"
  on public.friendships for select to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

-- Covers cancel (requester), decline (addressee) and unfriend (either).
create policy "Leave friendships you're part of"
  on public.friendships for delete to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

create policy "See who you blocked"
  on public.blocks for select to authenticated
  using ((select auth.uid()) = blocker_id);

create policy "Unblock"
  on public.blocks for delete to authenticated
  using ((select auth.uid()) = blocker_id);

create policy "See sharing you granted or received"
  on public.schedule_permissions for select to authenticated
  using ((select auth.uid()) in (owner_id, viewer_id));

create policy "Grant sharing on your own schedule"
  on public.schedule_permissions for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Change sharing on your own schedule"
  on public.schedule_permissions for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

revoke all on public.friendships, public.blocks, public.schedule_permissions from anon;
grant select, delete on public.friendships to authenticated;
grant select, delete on public.blocks to authenticated;
grant select, insert, update on public.schedule_permissions to authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function public.is_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

revoke all on function public.is_blocked_between(uuid, uuid) from public, anon;

-- ---------------------------------------------------------------------------
-- Operations (PLAN.md §2 Module C friend management)
-- ---------------------------------------------------------------------------

-- Find students by username or name. Excludes yourself and anyone blocked either way.
create function public.search_students(q text)
returns table (id uuid, username text, display_name text, preferred_campus text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username, p.display_name, p.preferred_campus
  from public.profiles p
  where length(trim(q)) >= 2
    and p.username is not null
    and p.id <> auth.uid()
    and not public.is_blocked_between(auth.uid(), p.id)
    and (p.username ilike replace(replace(lower(trim(q)), '%', ''), '_', '\_') || '%'
         or p.display_name ilike '%' || replace(trim(q), '%', '') || '%')
  order by (p.username = lower(trim(q))) desc, p.username
  limit 20;
$$;

-- Send a request. If they already asked you, this accepts theirs instead.
create function public.send_friend_request(target uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  existing public.friendships;
begin
  if me is null then raise exception 'Not signed in.'; end if;
  if target is null or target = me then raise exception 'You can''t add yourself.'; end if;
  if not exists (select 1 from public.profiles where id = target) then
    raise exception 'That student doesn''t exist.';
  end if;
  if public.is_blocked_between(me, target) then
    raise exception 'You can''t send a request to this student.';
  end if;
  if (select count(*) from public.friendships where requester_id = me and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Too many requests. Try again later.';
  end if;

  select * into existing from public.friendships
  where least(requester_id, addressee_id) = least(me, target)
    and greatest(requester_id, addressee_id) = greatest(me, target);

  if found then
    if existing.status = 'accepted' then return 'already_friends'; end if;
    if existing.requester_id = me then return 'already_sent'; end if;
    perform public.respond_friend_request(existing.id, true);
    return 'accepted';
  end if;

  insert into public.friendships (requester_id, addressee_id) values (me, target);
  return 'sent';
end;
$$;

-- Accept or decline a request addressed to you.
create function public.respond_friend_request(request_id uuid, accept boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  req public.friendships;
begin
  select * into req from public.friendships
  where id = request_id and addressee_id = me and status = 'pending';
  if not found then raise exception 'That request no longer exists.'; end if;

  if not accept then
    delete from public.friendships where id = request_id;
    return;
  end if;

  update public.friendships set status = 'accepted', responded_at = now() where id = request_id;
  -- Default sharing: free/busy only, never class details. Each side can change theirs.
  insert into public.schedule_permissions (owner_id, viewer_id, level)
  values (me, req.requester_id, 'availability'), (req.requester_id, me, 'availability')
  on conflict do nothing;
end;
$$;

-- Block someone: ends any friendship/request and all sharing, both ways.
create function public.block_user(target uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
begin
  if me is null or target is null or target = me then raise exception 'Invalid request.'; end if;
  insert into public.blocks (blocker_id, blocked_id) values (me, target) on conflict do nothing;
  delete from public.friendships
  where least(requester_id, addressee_id) = least(me, target)
    and greatest(requester_id, addressee_id) = greatest(me, target);
  delete from public.schedule_permissions
  where (owner_id = me and viewer_id = target) or (owner_id = target and viewer_id = me);
end;
$$;

-- What each accepted friend lets you see of their schedule (PLAN.md §2 Module C availability).
-- 'availability' returns times only — course, title, room are never sent to the client.
create function public.friends_availability()
returns table (friend_id uuid, level text, events jsonb)
language sql stable security definer set search_path = '' as $$
  with me as (select auth.uid() as id),
  friends as (
    select case when f.requester_id = me.id then f.addressee_id else f.requester_id end as friend_id
    from public.friendships f, me
    where f.status = 'accepted' and me.id in (f.requester_id, f.addressee_id)
  )
  select
    fr.friend_id,
    coalesce(sp.level, 'private') as level,
    case coalesce(sp.level, 'private')
      when 'private' then '[]'::jsonb
      else coalesce((
        select jsonb_agg(jsonb_build_object(
          'days', e.days,
          'start_time', to_char(e.start_time, 'HH24:MI'),
          'end_time', to_char(e.end_time, 'HH24:MI'),
          'start_date', e.start_date,
          'end_date', e.end_date,
          'course_code', case when sp.level = 'full' then e.course_code end,
          'title', case when sp.level = 'full' then e.title end,
          'kind', case when sp.level = 'full' then e.kind end,
          'building_code', case when sp.level = 'full' then e.building_code end,
          'room', case when sp.level = 'full' then e.room end
        ))
        from public.class_events e
        where e.user_id = fr.friend_id and e.end_date >= current_date - 1
      ), '[]'::jsonb)
    end as events
  from friends fr
  cross join me
  left join public.schedule_permissions sp
    on sp.owner_id = fr.friend_id and sp.viewer_id = me.id
  where not public.is_blocked_between(me.id, fr.friend_id);
$$;

revoke all on function public.search_students(text) from public, anon;
revoke all on function public.send_friend_request(uuid) from public, anon;
revoke all on function public.respond_friend_request(uuid, boolean) from public, anon;
revoke all on function public.block_user(uuid) from public, anon;
revoke all on function public.friends_availability() from public, anon;
grant execute on function public.search_students(text) to authenticated;
grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;
grant execute on function public.block_user(uuid) to authenticated;
grant execute on function public.friends_availability() to authenticated;
