/**
 * Closed sets of values used across Orbit, as `const` tuples plus their union types.
 * Plain objects instead of TypeScript `enum`s: Node's type stripping (used by the unit tests)
 * does not support enums, and string unions match the values stored in Supabase.
 *
 * Pure TypeScript, no React Native imports, so the tested modules can import it.
 */

/** Concordia's two campuses: Sir George Williams (downtown) and Loyola. */
export const CAMPUSES = ['SGW', 'LOY'] as const;
export type Campus = (typeof CAMPUSES)[number];

/** Campus filter on screens that can show both campuses at once. */
export type CampusFilter = Campus | 'ALL';

export const CLASS_KINDS = ['lecture', 'tutorial', 'lab', 'exam', 'other'] as const;
export type ClassKind = (typeof CLASS_KINDS)[number];

/** Where a saved class came from. */
export const CLASS_SOURCES = ['manual', 'ics'] as const;
export type ClassSource = (typeof CLASS_SOURCES)[number];

/** ISO weekdays: Monday = 1 … Sunday = 7. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

/** How much of my schedule a friend may see. */
export const SHARING_LEVELS = ['private', 'availability', 'full'] as const;
export type SharingLevel = (typeof SHARING_LEVELS)[number];

/** Campus Live place types. */
export const LIVE_CATEGORIES = ['food', 'study'] as const;
export type LiveCategory = (typeof LIVE_CATEGORIES)[number];

/** Reported busyness: 0 = empty / no line … 3 = full / long line. */
export type LiveLevel = 0 | 1 | 2 | 3;
export const LIVE_LEVELS: LiveLevel[] = [0, 1, 2, 3];

export const CONFIDENCES = ['none', 'low', 'medium', 'high'] as const;
export type Confidence = (typeof CONFIDENCES)[number];

export type Trend = 'busier' | 'quieter' | 'steady';

/** Semantic colour of a status or suggestion. */
export type Tone = 'success' | 'warning' | 'danger' | 'neutral';

/** Result of `send_friend_request`. */
export type FriendRequestResult = 'sent' | 'accepted' | 'already_sent' | 'already_friends';

/** Groups in the global search, in display order. */
export const SEARCH_GROUPS = ['Classes', 'Rooms', 'Buildings', 'Friends', 'Campus Live'] as const;
export type SearchGroup = (typeof SEARCH_GROUPS)[number];
