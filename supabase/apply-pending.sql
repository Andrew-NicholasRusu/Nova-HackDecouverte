-- ORBIT · pending migrations in one paste: avatars bucket + profile repair.
-- Idempotent: safe to run more than once. Paste into Supabase dashboard > SQL Editor > Run.

-- ORBIT · profile pictures. profiles.avatar_url already exists (and is updatable by its owner);
-- this adds the public "avatars" storage bucket, with one folder per student.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone signed in (or not) can view pictures; they are shown to friends and in search.
drop policy if exists "Avatars are publicly readable" on storage.objects;
create policy "Avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Students can only write inside their own folder: avatars/<their user id>/...
drop policy if exists "Students upload their own avatar" on storage.objects;
create policy "Students upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Students replace their own avatar" on storage.objects;
create policy "Students replace their own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Students delete their own avatar" on storage.objects;
create policy "Students delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ORBIT · profile repair.
-- 1. Accounts created before the signup trigger existed have no profile row, so "Edit profile"
--    had nothing to update. Backfill them.
-- 2. Let a student create their own row if it is ever missing (the app now upserts).

insert into public.profiles (id, display_name)
select u.id, left(coalesce(u.raw_user_meta_data ->> 'display_name', ''), 60)
from auth.users u
on conflict (id) do nothing;

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

grant insert (id, username, display_name, avatar_url, bio, preferred_campus) on public.profiles to authenticated;
