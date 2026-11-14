# Supabase setup

Run each migration **in order** in the Supabase dashboard → SQL Editor (paste the file, Run):

1. `migrations/20261114000000_profiles.sql` — profiles + auto-create on sign-up
2. `migrations/20261114010000_class_events.sql` — Schedule
3. `migrations/20261114020000_friends.sql` — Friends, blocking, schedule sharing
4. `migrations/20261114030000_campus_live.sql` — Campus Live (+ starter places)
5. `migrations/20261114040000_avatars.sql` — profile pictures (public `avatars` storage bucket)
6. `migrations/20261114050000_profile_repair.sql` — creates missing profile rows so every account can edit its profile

Each file only needs to run once per project. If the app shows "table is missing",
the matching file hasn't been run yet.

Campus Live places are curated, not user-created. Add or fix them with SQL, e.g.:

```sql
insert into public.live_locations (campus, name, category, building_code, detail)
values ('SGW', 'EV Building atrium', 'study', 'EV', 'Ground floor');
```
