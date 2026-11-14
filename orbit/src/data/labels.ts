/**
 * User-facing names for the values in `enums.ts`. One place for copy that several screens show.
 *
 * Pure TypeScript, no React Native imports, so the tested modules can import it.
 */

import type { Campus, Confidence, FriendRequestResult, LiveCategory, LiveLevel, SharingLevel, Tone, Weekday } from './enums.ts';

export const CAMPUS_NAME: Record<Campus, string> = { SGW: 'Sir George Williams', LOY: 'Loyola' };

/** Campus name for a building or student, where the campus may be unknown or not one of ours. */
export const campusName = (campus: string | null | undefined) =>
  campus && campus in CAMPUS_NAME ? CAMPUS_NAME[campus as Campus] : (campus ?? '');

export const WEEKDAY_SHORT: Record<Weekday, string> = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' };

export const SHARING_LABEL: Record<SharingLevel, string> = {
  private: 'Private',
  availability: 'Free/busy only',
  full: 'Full schedule',
};

export const SHARING_HELP: Record<SharingLevel, string> = {
  private: 'They see nothing about your schedule.',
  availability: 'They see when you are busy or free, never which class or where.',
  full: 'They also see your courses and rooms.',
};

export const FRIEND_REQUEST_RESULT: Record<FriendRequestResult, string> = {
  sent: 'Request sent',
  accepted: 'You are now friends',
  already_sent: 'Already requested',
  already_friends: 'Already friends',
};

export const LIVE_CATEGORY_LABEL: Record<LiveCategory, string> = { food: 'Food', study: 'Study space' };

/** Full description of a report level, for the report buttons and cards. */
export const LIVE_LEVEL_LABEL: Record<LiveCategory, Record<LiveLevel, string>> = {
  food: { 0: 'No line', 1: 'Short line · under 5 min', 2: 'Medium line · 5–15 min', 3: 'Long line · 15+ min' },
  study: { 0: 'Lots of seats', 1: 'Some seats', 2: 'Nearly full', 3: 'Full' },
};

/** Compact report level, for chips and the dashboard. */
export const LIVE_LEVEL_SHORT: Record<LiveCategory, Record<LiveLevel, string>> = {
  food: { 0: 'No line', 1: 'Short', 2: 'Medium', 3: 'Long' },
  study: { 0: 'Lots', 1: 'Some', 2: 'Nearly full', 3: 'Full' },
};

/** Report level inside a sentence ("Hive Café: short line"). */
export const LIVE_LEVEL_PHRASE: Record<LiveCategory, readonly string[]> = {
  food: ['no line', 'short line', 'medium line', 'long line'],
  study: ['lots of seats', 'some seats', 'nearly full', 'full'],
};

export const LIVE_LEVEL_TONE: Record<LiveLevel, Exclude<Tone, 'neutral'>> = { 0: 'success', 1: 'success', 2: 'warning', 3: 'danger' };

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  none: 'No data',
  low: 'Low confidence',
  medium: 'Good confidence',
  high: 'High confidence',
};
