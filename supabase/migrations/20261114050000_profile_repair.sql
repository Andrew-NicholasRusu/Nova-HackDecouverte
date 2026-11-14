-- ORBIT · profile repair.
-- 1. Accounts created before the signup trigger existed have no profile row, so "Edit profile"
--    had nothing to update. Backfill them.
-- 2. Let a student create their own row if it is ever missing (the app now upserts).

insert into public.profiles (id, display_name)
select u.id, left(coalesce(u.raw_user_meta_data ->> 'display_name', ''), 60)
from auth.users u
on conflict (id) do nothing;

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

grant insert (id, username, display_name, avatar_url, bio, preferred_campus) on public.profiles to authenticated;
