/**
 * App-wide constants: limits, timings, storage keys and external resources.
 * Visual tokens (colours, spacing, sizes) live in `styles/theme.ts`, not here.
 *
 * Pure TypeScript, no React Native imports, so the tested modules can import it.
 */

/** Concordia's timezone. Class times are wall-clock times in this zone. */
export const CAMPUS_TIMEZONE = 'America/Toronto';

/** Length of a term when an import or a new class doesn't say. */
export const DEFAULT_TERM_WEEKS = 15;

/** Muted course colours that read on both light and dark surfaces. */
export const COURSE_COLORS = ['#8A1F3D', '#2F6F8F', '#3E7C4F', '#B26B1F', '#5B4B8A', '#9C4F2E', '#2F5D8A', '#6B6B3A'] as const;

/** Mirrors the checks on public.profiles. */
export const USERNAME_RE = /^[a-z0-9_]{3,24}$/;
export const PROFILE_LIMITS = { displayName: 60, bio: 280 } as const;
export const PASSWORD_MIN_LENGTH = 8;

/** Profile pictures: square JPEG of this many pixels, in the `avatars` storage bucket. */
export const AVATAR = { bucket: 'avatars', size: 320, maxBytes: 2_000_000 } as const;

/** Largest schedule file the importer reads (web can OCR photos and PDFs, so it allows more). */
export const SCHEDULE_FILE_MAX_BYTES = { native: 8_000_000, web: 15_000_000 } as const;
/** PDF pages read by the importer. */
export const PDF_MAX_PAGES = 6;

/** OCR and PDF readers, loaded from a CDN on first use only (web). */
export const READER_SCRIPTS = {
  tesseract: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
  pdfjs: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  pdfjsWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
} as const;

/** Campus Live: reports older than this are ignored; weight halves every `REPORT_HALF_LIFE_MIN`. */
export const REPORT_MAX_AGE_MIN = 45;
export const REPORT_HALF_LIFE_MIN = 15;
/** Campus Live refresh interval while a screen shows it. */
export const LIVE_REFRESH_MS = 60_000;
/** Rough minutes in the line for each reported level. */
export const WAIT_MINUTES = [0, 3, 10, 20] as const;

/** Walking speed (about 4.8 km/h). */
export const WALK_METRES_PER_MIN = 80;
/** Scale of the Molson floor drawings. */
export const PLAN_METRES_PER_UNIT = 0.16;

/** OpenStreetMap tile size in pixels. */
export const MAP_TILE_SIZE = 256;

/** Day window drawn by the free/busy bars, in minutes since midnight (08:00–21:00). */
export const DAY_BAR = { from: 8 * 60, to: 21 * 60 } as const;

/** Home screen shortcuts. */
export const MAX_QUICK_ACTIONS = 6;
export const DEFAULT_QUICK_ACTION_IDS = ['add-class', 'directions', 'share-schedule', 'cafeteria'];

/** Results shown per group in the global search. */
export const SEARCH_PER_GROUP = 4;
/** Free friends shown on the dashboard card before "+N". */
export const DASHBOARD_FRIENDS_SHOWN = 4;

/** Clock refresh for countdowns. */
export const CLOCK_TICK_MS = 30_000;

/** AsyncStorage keys for per-device preferences. */
export const STORAGE_KEYS = {
  quickActions: 'orbit.quick-actions',
  notificationsRead: 'orbit.notifications.read',
  liveCampus: 'orbit.live.campus',
  mapCampus: 'orbit.map.campus',
  scheduleView: 'orbit.schedule.view',
} as const;
