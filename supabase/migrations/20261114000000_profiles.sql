-- ORBIT · profiles (PLAN.md §6 user system, §7 security)
-- Email is intentionally NOT stored here; it stays in auth.users and is never exposed.

create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  username         text unique
                     check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name     text not null default ''
                     check (char_length(display_name) <= 60),
  avatar_url       text,
  bio              text check (char_length(bio) <= 280),
  university       text not null default 'concordia',
  preferred_campus text check (preferred_campus in ('SGW', 'LOY')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.profiles is 'Public-facing student profile. One row per auth user, created by trigger.';

-- Keep updated_at current.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile automatically when someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 60)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;

-- Signed-in students can see profiles (needed for friend search). Anonymous visitors cannot.
create policy "Profiles are viewable by signed-in users"
  on public.profiles for select
  to authenticated
  using (true);

-- Students can only edit their own profile.
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No insert/delete policies: rows are created by the trigger and removed via auth.users cascade.

revoke all on public.profiles from anon;
grant select on public.profiles to authenticated;
grant update (username, display_name, avatar_url, bio, preferred_campus) on public.profiles to authenticated;
