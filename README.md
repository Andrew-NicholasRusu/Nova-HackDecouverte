# Orbit

Your university, connected. Orbit is a campus dashboard for Concordia University students (Sir George Williams and Loyola): your schedule, friends' availability, live campus conditions and indoor directions in one app that runs on the web, iOS and Android.

The **dashboard is the brain**. It combines Schedule, Map, Friends and Campus Live into one plan for right now: how long you are free, when to leave for your next class, the shortest food line and the emptiest study spot that fit your window, and which friend is free at the same time. Every suggestion opens the module that can act on it.

## What is in the app

| Area | What you can do |
| --- | --- |
| **Home** | Photo hero, global search, notifications, account menu, a live "Your plan" card, next class countdown, campus map, friends and Campus Live summaries, customizable Quick Access. |
| **Schedule** | Add, edit and delete classes. Week calendar grid, day list, overlap warnings. Import from `.ics`, PDF, photo/screenshot (text recognition), text/CSV or pasted text. Every import is reviewed before saving. |
| **Map** | Campus map (OpenStreetMap) with building pins and walking times. Tap the Molson Building photo to open its floor plans with indoor directions: pick a start and destination, follow a drawn route across floors with turn-by-turn steps, step-free option and zoom. |
| **Friends** | Find students as you type and send requests, accept or decline, day timelines showing who is free, shared free windows, per-friend sharing level (private, free/busy only, full). |
| **Campus Live** | Student-reported lines and seats with wait estimates, confidence, trend and walking time from where you are. Reports fade after 45 minutes. |
| **Settings** | Edit profile and photo, switch campus, set privacy for all friends, choose and order your Quick Access shortcuts. |

Quality of life: one overlay open at a time, outside click closes dropdowns, `/` focuses search, arrow keys and Enter in search, pull to refresh, remembered filters, page titles, 404 and error screens. Page content is not selectable or draggable on the web.

## Run it

```bash
cd orbit
cp .env.example .env.local      # fill in the keys
npm install
npm run web                     # or: npm start, then press i / a
```

Useful scripts (run from `orbit/`):

```bash
npx tsc --noEmit   # type check
npm run lint       # lint
npm test           # unit tests (routing, schedule parsing, availability, live confidence, plan)
```

### Environment

| Variable | Use |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` | Supabase project (publishable/anon key only). |
| `CONCORDIA_API_USER`, `CONCORDIA_API_KEY` | Concordia Open Data, used only by the server routes in `src/app/api`. Never prefix with `EXPO_PUBLIC_`. |

If the building list cannot be loaded, the campus map falls back to built-in approximate positions.

## Database

Run the files in `supabase/migrations/` in order in the Supabase SQL editor (see `supabase/README.md`). The last two matter for profiles: `…040000_avatars.sql` creates the profile-picture bucket and `…050000_profile_repair.sql` makes sure every account has a profile row it can edit.

## Deploy

The web build uses server output (the Concordia API routes run on the server), so host it on a Node-capable host. Expo's own is EAS Hosting:

```bash
cd orbit
npm run check           # types, lint, tests
npm run build:web       # production export to dist/ (what CI runs too)
npx eas-cli login       # once
npx eas-cli env:create  # add the four variables from .env.example (EXPO_PUBLIC_* as plain text, CONCORDIA_* as secret)
npm run deploy          # export + eas deploy --prod
```

Before the first deploy, run `supabase/apply-pending.sql` in the Supabase SQL editor and confirm with `npm run check:setup`. Native builds: `npx eas-cli build --profile production --platform ios|android` (bundle id `com.nova.orbit`; `eas.json` has development, preview and production profiles). `npm run serve:web` previews the production build locally.

## Project layout

```
orbit/src/app          screens (Expo Router) and API routes
orbit/src/features     schedule, friends, live, brain (dashboard plan), navigator, search, notifications, profile
orbit/src/components   shared UI (cards, popovers, dropdowns, floor plan viewer)
orbit/src/constants    design tokens (theme.ts), floor plan data
orbit/src/lib          routing, geo, overlays, persisted state, Supabase client
supabase/migrations    database schema and policies
```

All colours, sizes, type and motion come from `orbit/src/constants/theme.ts`.

## Data and privacy

- Floor plans and the building list come from Concordia Open Data; map tiles from OpenStreetMap contributors.
- Campus Live is community-reported, not official Concordia information.
- A student's schedule is private unless they share it. New friends start with free/busy times only.

## Known limits

- Photo and PDF reading runs on the web (it loads its reader from a CDN on first use); on phones use `.ics` or pasted text.
- Indoor directions cover the Molson Building. Walking times and distances are estimates.
