/**
 * Domain types shared by more than one module. Types private to one implementation (database
 * row shapes, parser internals, store state) stay next to that implementation.
 *
 * Type-only module: safe to import from the pure, node-tested logic.
 */

import type { ComponentProps } from 'react';
import type { MaterialIcons } from '@expo/vector-icons';

import type { Campus, ClassKind, ClassSource, Confidence, LiveCategory, LiveLevel, SearchGroup, SharingLevel, Tone, Weekday } from './enums.ts';

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

/** Tab routes a suggestion, search result or notice can open. */
export type AppPath = '/' | '/schedule' | '/navigator' | '/friends' | '/live' | '/settings';

/** A place in the app to open, with optional route params (e.g. a building or room to focus). */
export type Target = { pathname: Exclude<AppPath, '/'>; params?: Record<string, string> };

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export type Profile = {
  id: string;
  username: string | null;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  preferred_campus: Campus | null;
};

export type ProfileEdit = Pick<Profile, 'username' | 'display_name' | 'bio' | 'preferred_campus'>;
export type ProfileErrors = Partial<Record<keyof ProfileEdit, string>>;

// ---------------------------------------------------------------------------
// Schedule
//
// Time model: `startTime`/`endTime` are wall-clock times ("HH:MM") in the campus timezone.
// Dates are "YYYY-MM-DD". A class repeats weekly on `days` between `startDate` and `endDate`.
// ---------------------------------------------------------------------------

/** What a student enters (form) or what an import produces, before it is saved. */
export type ClassInput = {
  courseCode: string;
  title: string;
  section: string;
  kind: ClassKind;
  buildingCode: string;
  room: string;
  days: Weekday[];
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  color: string | null;
};

export type ClassInputErrors = Partial<Record<keyof ClassInput, string>>;

/** The minimum needed to place a class in time. Friends shared as free/busy only expose just this. */
export type RecurringSlot = Pick<ClassInput, 'days' | 'startTime' | 'endTime' | 'startDate' | 'endDate'>;

/** A saved class event. */
export type ClassEvent = ClassInput & { id: string; source: ClassSource };

/** One dated meeting of a recurring class. */
export type Occurrence<E extends RecurringSlot = ClassEvent> = {
  event: E;
  /** Local calendar date, "YYYY-MM-DD". */
  date: string;
  start: Date;
  end: Date;
};

export type NextClass<E extends RecurringSlot = ClassEvent> = {
  /** The class happening right now, if any. */
  current: Occurrence<E> | null;
  /** The next class that hasn't started yet, if any within the horizon. */
  next: Occurrence<E> | null;
};

export type ScheduleConflict<E extends RecurringSlot = ClassEvent> = {
  a: E;
  b: E;
  /** Weekdays on which both classes meet at overlapping times. */
  days: Weekday[];
};

/** A stretch of free time. */
export type FreeWindow = { start: Date; end: Date; minutes: number };

/** Is someone in class right now, and until when? `until: null` = free for the rest of the day. */
export type BusyStatus = { state: 'in-class'; until: Date } | { state: 'free'; until: Date | null };

/** A class extracted from an import, waiting for the student's review. */
export type ImportDraft = ClassInput & {
  /** Stable id for list rendering in the review screen. */
  key: string;
  warnings: string[];
};

export type ImportParseResult = {
  drafts: ImportDraft[];
  /** Entries ignored (all-day, cancelled, overrides, unreadable). */
  skipped: number;
};

/** A parsed import file, shown on the review screen. */
export type PendingImport = ImportParseResult & { fileName: string };

export type ReadProgress = (label: string, fraction: number | null) => void;

export type ReadResult = {
  name: string;
  /** 'ics' goes to the calendar parser; everything else is text for the schedule text parser. */
  kind: 'ics' | 'text';
  text: string;
  /** True when the text came from OCR, so the review screen can say to double-check it. */
  ocr: boolean;
};

// ---------------------------------------------------------------------------
// Friends
// ---------------------------------------------------------------------------

export type StudentSummary = {
  id: string;
  avatarUrl?: string | null;
  username: string;
  displayName: string;
  campus: Campus | null;
};

/** A friend's class as we're allowed to see it. Course fields only exist with 'full' sharing. */
export type FriendSlot = RecurringSlot & {
  courseCode?: string;
  title?: string;
  kind?: ClassKind;
  buildingCode?: string;
  room?: string;
};

export type Friend = StudentSummary & {
  friendshipId: string;
  /** What they share with me. */
  theirLevel: SharingLevel;
  /** What I share with them. */
  myLevel: SharingLevel;
  slots: FriendSlot[];
};

export type FriendRequest = { friendshipId: string; student: StudentSummary; createdAt: string };

// ---------------------------------------------------------------------------
// Campus Live
// ---------------------------------------------------------------------------

export type LiveReport = {
  level: LiveLevel;
  createdAt: Date;
  /** Same number = same student (per location); not linkable to a profile. */
  contributor: number;
  mine: boolean;
};

export type LiveEstimate = {
  /** Rounded weighted estimate, null when there are no usable reports. */
  level: LiveLevel | null;
  confidence: Confidence;
  reports: number;
  contributors: number;
  /** Minutes since the newest report. */
  newestMinutes: number | null;
};

export type LiveLocation = {
  id: string;
  campus: Campus;
  name: string;
  category: LiveCategory;
  buildingCode: string;
  detail: string;
  reports: LiveReport[];
};

// ---------------------------------------------------------------------------
// Map and buildings
// ---------------------------------------------------------------------------

/** Client-side view of the building model served by /api/concordia/buildings. */
export type Building = {
  campus: string;
  code: string;
  name: string;
  longName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

/** The part of a building the planner needs. */
export type Place = Pick<Building, 'code' | 'campus' | 'name' | 'latitude' | 'longitude'>;

export type Coordinates = { latitude: number; longitude: number };

/** A floor of a building with an indoor plan. */
export type Floor = {
  id: string;
  label: string;
  /** Where the floor sits on the building photo, in percent. */
  band: { top: number; height: number; left: number; width: number };
  image: number;
  svg: string;
};

export type Room = {
  /** Room code as used in the floor SVG labels, e.g. "1.130". */
  code: string;
  /** Display/search label, e.g. "MB-1.130". */
  label: string;
  floor: string;
  nodeId: string;
  x: number;
  y: number;
};

export type RouteStep = {
  kind: 'start' | 'walk' | 'turn-left' | 'turn-right' | 'elevator' | 'stairs' | 'arrive';
  text: string;
  floor: number;
  /** Where to look on the plan for this step. */
  x: number;
  y: number;
};

export type RouteSegment = { floor: number; points: { x: number; y: number }[] };

export type Route = {
  nodeIds: string[];
  /** Path length in plan units (1024 per floor drawing). */
  length: number;
  segments: RouteSegment[];
  steps: RouteStep[];
  floors: number[];
};

// ---------------------------------------------------------------------------
// Dashboard, search and notifications
// ---------------------------------------------------------------------------

export type Suggestion = {
  id: string;
  kind: 'leave' | 'food' | 'study' | 'friend';
  title: string;
  detail: string;
  tone: Tone;
  cta: string;
  target: Target;
};

/** Today's plan across every module (see features/brain/plan.ts). */
export type Plan = {
  state: 'empty' | 'in-class' | 'free' | 'done';
  headline: string;
  sub: string;
  current: Occurrence | null;
  next: Occurrence | null;
  /** Minutes of free time before the next class today (counted from the end of the current class). */
  freeMinutes: number | null;
  nextBuilding: Place | null;
  /** Building the student is in or just left, used for walking times. */
  here: Place | null;
  walkToNext: number | null;
  leaveBy: Date | null;
  suggestions: Suggestion[];
};

export type QuickAction = {
  id: string;
  label: string;
  hint: string;
  icon: IconName;
  /** 'share' shares the weekly schedule; otherwise opens `href`. */
  href?: Exclude<AppPath, '/'>;
  kind?: 'share';
};

export type SearchResult = {
  id: string;
  group: SearchGroup;
  title: string;
  subtitle: string;
  icon: IconName;
  target: Target;
};

export type Notice = {
  id: string;
  icon: IconName;
  title: string;
  detail: string;
  /** Sticky notices stay until acted on (requests, conflicts); others can be marked read. */
  sticky: boolean;
  target?: Target;
  cta?: string;
  request?: FriendRequest;
};
