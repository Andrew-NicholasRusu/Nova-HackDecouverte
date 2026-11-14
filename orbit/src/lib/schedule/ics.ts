/**
 * ICS (iCalendar, RFC 5545) → ORBIT class drafts.
 *
 * Output is always a list of *drafts* for the import review screen; nothing
 * here saves data (PLAN.md: "Never silently add unverified extracted events").
 *
 * Supported: VEVENT with DTSTART/DTEND or DURATION (UTC, TZID or floating),
 * RRULE FREQ=WEEKLY|DAILY with BYDAY/UNTIL/COUNT/INTERVAL, EXDATE,
 * RECURRENCE-ID overrides and STATUS:CANCELLED. Exports that list every
 * meeting as its own VEVENT are merged back into weekly series.
 */

import { occursOn } from './recurrence';
import {
  addDays,
  daysBetween,
  instantToZoned,
  isoWeekday,
  isValidTimeZone,
  startOfWeek,
  zonedToInstant,
} from './time';
import type { ClassEventDraft, ClassKind, Weekday } from './types';

export type IcsImportResult = {
  drafts: ClassEventDraft[];
  /** Human-readable notes about anything that was skipped or guessed. */
  warnings: string[];
};

export type IcsImportOptions = {
  /** Time zone the drafts are expressed in (the schedule's zone). */
  timeZone: string;
  /** End date for open-ended recurring events (usually the term end). */
  defaultEndDate?: string;
};

type Property = { name: string; params: Record<string, string>; value: string };
type RawEvent = Property[];

/** Windows zone names some exporters (Outlook) emit instead of IANA ids. */
const WINDOWS_ZONES: Record<string, string> = {
  'Eastern Standard Time': 'America/Toronto',
  'Central Standard Time': 'America/Chicago',
  'Mountain Standard Time': 'America/Denver',
  'Pacific Standard Time': 'America/Los_Angeles',
  'Atlantic Standard Time': 'America/Halifax',
  UTC: 'UTC',
};

const BYDAY: Record<string, Weekday> = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7 };

// ---------------------------------------------------------------------------
// Lexing
// ---------------------------------------------------------------------------

function unfold(text: string): string[] {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/\n[ \t]/g, '')
    .split('\n')
    .filter((l) => l.length > 0);
}

function parseLine(line: string): Property | null {
  // The value starts at the first ':' outside a quoted parameter value.
  let inQuotes = false;
  let colon = -1;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if (c === ':' && !inQuotes) {
      colon = i;
      break;
    }
  }
  if (colon < 0) return null;
  const [rawName, ...rawParams] = line.slice(0, colon).split(';');
  const params: Record<string, string> = {};
  for (const p of rawParams) {
    const eq = p.indexOf('=');
    if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, '');
  }
  return { name: rawName!.toUpperCase(), params, value: line.slice(colon + 1) };
}

function unescapeText(value: string): string {
  return value.replace(/\\([\\;,nN])/g, (_, c: string) => (c === 'n' || c === 'N' ? '\n' : c));
}

function readEvents(lines: string[]): RawEvent[] {
  const events: RawEvent[] = [];
  let current: RawEvent | null = null;
  let nested = 0; // VALARM etc. inside a VEVENT
  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper === 'BEGIN:VEVENT') {
      current = [];
      nested = 0;
    } else if (upper === 'END:VEVENT') {
      if (current) events.push(current);
      current = null;
    } else if (current) {
      if (upper.startsWith('BEGIN:')) nested += 1;
      else if (upper.startsWith('END:')) nested = Math.max(0, nested - 1);
      else if (nested === 0) {
        const prop = parseLine(line);
        if (prop) current.push(prop);
      }
    }
  }
  return events;
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

type LocalDateTime = { date: string; time: string; allDay: boolean };

class ZoneWarnings {
  readonly unknown = new Set<string>();
}

const DT_RE = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/;

/** Convert an ICS date/date-time value into wall time in `timeZone`. */
function toLocal(
  value: string,
  params: Record<string, string>,
  timeZone: string,
  zones: ZoneWarnings,
): LocalDateTime | null {
  const m = DT_RE.exec(value.trim());
  if (!m) return null;
  const date = `${m[1]}-${m[2]}-${m[3]}`;
  if (m[4] === undefined) return { date, time: '00:00', allDay: true };
  const time = `${m[4]}:${m[5]}`;

  if (m[7] === 'Z') {
    const instant = new Date(
      Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5])),
    );
    return { ...instantToZoned(instant, timeZone), allDay: false };
  }

  const tzid = params.TZID?.replace(/^\//, '');
  if (!tzid || tzid === timeZone) return { date, time, allDay: false };

  const zone = isValidTimeZone(tzid) ? tzid : WINDOWS_ZONES[tzid];
  if (!zone) {
    // Unknown zone: keep the wall time as written and tell the student.
    zones.unknown.add(tzid);
    return { date, time, allDay: false };
  }
  return { ...instantToZoned(zonedToInstant(date, time, zone), timeZone), allDay: false };
}

/** 'PT1H15M' → minutes. Only the time components classes need are supported. */
function durationMinutes(value: string): number | null {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:\d+S)?)?$/.exec(value.trim());
  if (!m) return null;
  return Number(m[1] ?? 0) * 1440 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

function addMinutes(dt: LocalDateTime, minutes: number): LocalDateTime {
  const [h, mi] = dt.time.split(':').map(Number);
  const total = h! * 60 + mi! + minutes;
  const dayShift = Math.floor(total / 1440);
  const rem = total - dayShift * 1440;
  return {
    date: addDays(dt.date, dayShift),
    time: `${String(Math.floor(rem / 60)).padStart(2, '0')}:${String(rem % 60).padStart(2, '0')}`,
    allDay: false,
  };
}

// ---------------------------------------------------------------------------
// Text heuristics (Concordia-style "COMP 248 LEC AA", "H 937", "MB S2.330")
// ---------------------------------------------------------------------------

const COURSE_RE = /\b([A-Z]{3,4})[\s-]?(\d{3,4}[A-Z]?)\b/;
const KIND_RE = /\b(LEC|LECT|LECTURE|TUT|TUTORIAL|LAB|LABORATORY|SEM|SEMINAR|EXAM|FINAL|MIDTERM)\b/i;
const SECTION_RE =
  /\b(?:LEC|LECT|LECTURE|TUT|TUTORIAL|LAB|LABORATORY|SEM|SEMINAR|SECTION|SEC\.?)\s+([A-Z0-9]{1,6})\b/i;
const LOCATION_RE = /^\s*([A-Z]{1,3})[\s-]+([A-Z]{0,2}\d[\w.-]*)\s*$/i;

function kindFrom(word: string | undefined): ClassKind {
  switch (word?.toUpperCase()) {
    case 'LEC':
    case 'LECT':
    case 'LECTURE':
      return 'lecture';
    case 'TUT':
    case 'TUTORIAL':
      return 'tutorial';
    case 'LAB':
    case 'LABORATORY':
      return 'lab';
    case 'SEM':
    case 'SEMINAR':
      return 'seminar';
    case 'EXAM':
    case 'FINAL':
    case 'MIDTERM':
      return 'exam';
    default:
      return 'lecture';
  }
}

export function parseSummary(summary: string): {
  courseCode: string;
  courseName: string;
  section: string | null;
  kind: ClassKind;
} {
  const upper = summary.toUpperCase();
  const course = COURSE_RE.exec(upper);
  const kind = KIND_RE.exec(summary);
  const section = SECTION_RE.exec(summary);
  let name = summary;
  for (const m of [section, kind]) if (m) name = name.replace(m[0], ' ');
  if (course) name = name.replace(new RegExp(`${course[1]}[\\s-]?${course[2]}`, 'i'), ' ');
  name = name
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–—:|,/]+|[\s\-–—:|,/]+$/g, '')
    .trim();
  return {
    courseCode: course ? `${course[1]} ${course[2]}` : '',
    courseName: course ? name : name || summary.trim(),
    section: section ? section[1]!.toUpperCase() : null,
    kind: kindFrom(kind?.[1]),
  };
}

export function parseLocation(location: string): { buildingCode: string | null; room: string | null } {
  const trimmed = location.trim();
  if (!trimmed) return { buildingCode: null, room: null };
  const m = LOCATION_RE.exec(trimmed);
  if (m) return { buildingCode: m[1]!.toUpperCase(), room: m[2]!.toUpperCase() };
  return { buildingCode: null, room: trimmed.length <= 20 ? trimmed : null };
}

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

type Parsed = { uid: string | null; recurrenceId: string | null; draft: ClassEventDraft | null };

function get(event: RawEvent, name: string): Property | undefined {
  return event.find((p) => p.name === name);
}

function convertEvent(
  event: RawEvent,
  opts: IcsImportOptions,
  zones: ZoneWarnings,
  warnings: string[],
): Parsed {
  const uid = get(event, 'UID')?.value ?? null;
  const ridProp = get(event, 'RECURRENCE-ID');
  const rid = ridProp ? toLocal(ridProp.value, ridProp.params, opts.timeZone, zones) : null;
  const recurrenceId = rid?.date ?? null;
  const summary = unescapeText(get(event, 'SUMMARY')?.value ?? '').trim() || 'Untitled class';

  if (get(event, 'STATUS')?.value.toUpperCase() === 'CANCELLED') {
    return { uid, recurrenceId, draft: null };
  }

  const dtstart = get(event, 'DTSTART');
  const start = dtstart ? toLocal(dtstart.value, dtstart.params, opts.timeZone, zones) : null;
  if (!start) {
    warnings.push(`Skipped "${summary}": missing or unreadable start time.`);
    return { uid, recurrenceId, draft: null };
  }
  if (start.allDay) {
    warnings.push(`Skipped "${summary}" on ${start.date}: all-day events are not classes.`);
    return { uid, recurrenceId, draft: null };
  }

  const dtend = get(event, 'DTEND');
  const duration = get(event, 'DURATION');
  let end: LocalDateTime | null = null;
  if (dtend) end = toLocal(dtend.value, dtend.params, opts.timeZone, zones);
  else if (duration) {
    const mins = durationMinutes(duration.value);
    if (mins !== null) end = addMinutes(start, mins);
  }
  if (!end) end = addMinutes(start, 60);

  if (end.date !== start.date || end.time <= start.time) {
    warnings.push(`Skipped "${summary}" on ${start.date}: it ends on a different day.`);
    return { uid, recurrenceId, draft: null };
  }

  const course = parseSummary(summary);
  const locationText = unescapeText(get(event, 'LOCATION')?.value ?? '');
  const location = parseLocation(locationText);
  const description = unescapeText(get(event, 'DESCRIPTION')?.value ?? '').trim();
  const notesParts = [
    location.room === null && locationText.trim() ? `Location: ${locationText.trim()}` : '',
    description,
  ].filter(Boolean);

  const draft: ClassEventDraft = {
    ...course,
    ...location,
    weekdays: [],
    startTime: start.time,
    endTime: end.time,
    startDate: start.date,
    endDate: start.date,
    excludedDates: [],
    color: null,
    notes: notesParts.length ? notesParts.join('\n').slice(0, 500) : null,
    source: 'ics',
  };

  const rrule = get(event, 'RRULE');
  if (rrule && !recurrenceId) applyRule(draft, rrule.value, summary, opts, zones, warnings);

  for (const ex of event.filter((p) => p.name === 'EXDATE')) {
    for (const v of ex.value.split(',')) {
      const local = toLocal(v, ex.params, opts.timeZone, zones);
      if (local) draft.excludedDates.push(local.date);
    }
  }
  draft.excludedDates = [...new Set(draft.excludedDates)].sort();
  return { uid, recurrenceId, draft };
}

function applyRule(
  draft: ClassEventDraft,
  rule: string,
  summary: string,
  opts: IcsImportOptions,
  zones: ZoneWarnings,
  warnings: string[],
): void {
  const parts = Object.fromEntries(
    rule.split(';').map((kv) => {
      const [k, v = ''] = kv.split('=');
      return [k!.toUpperCase(), v];
    }),
  );
  const freq = parts.FREQ?.toUpperCase();
  if (freq !== 'WEEKLY' && freq !== 'DAILY') {
    warnings.push(`"${summary}" repeats ${freq?.toLowerCase() ?? 'irregularly'}; only the first date was imported.`);
    return;
  }

  const byDay = (parts.BYDAY ?? '')
    .split(',')
    .map((d: string) => BYDAY[d.replace(/^[+-]?\d+/, '').toUpperCase()])
    .filter((d: Weekday | undefined): d is Weekday => d !== undefined);
  draft.weekdays = byDay.length
    ? [...new Set(byDay)].sort((a, b) => a - b)
    : freq === 'DAILY'
      ? [1, 2, 3, 4, 5, 6, 7]
      : [isoWeekday(draft.startDate)];

  const interval = Math.max(1, Number(parts.INTERVAL ?? 1) || 1);
  const step = freq === 'DAILY' ? 1 : 7;
  const anchor = freq === 'DAILY' ? draft.startDate : startOfWeek(draft.startDate);
  const inInterval = (d: string) =>
    interval === 1 || Math.floor(daysBetween(anchor, freq === 'DAILY' ? d : startOfWeek(d)) / step) % interval === 0;

  if (parts.UNTIL) {
    const until = toLocal(parts.UNTIL, {}, opts.timeZone, zones);
    draft.endDate = until ? until.date : draft.startDate;
  } else if (parts.COUNT) {
    const count = Math.max(1, Number(parts.COUNT) || 1);
    let seen = 0;
    let d = draft.startDate;
    const probe = { ...draft, endDate: addDays(draft.startDate, 3660) };
    for (let guard = 0; guard < 3660; guard++, d = addDays(d, 1)) {
      if (occursOn(probe, d) && inInterval(d)) {
        seen += 1;
        if (seen === count) break;
      }
    }
    draft.endDate = d;
  } else {
    draft.endDate = opts.defaultEndDate ?? addDays(draft.startDate, 7 * 15 - 1);
    warnings.push(
      `"${summary}" has no end date; it was set to end on ${draft.endDate}. Check this in the review.`,
    );
  }

  if (interval > 1) {
    const probe = { ...draft, excludedDates: [] };
    for (let d = draft.startDate; d <= draft.endDate; d = addDays(d, 1)) {
      if (occursOn(probe, d) && !inInterval(d)) draft.excludedDates.push(d);
    }
  }
}

/** Collapse one-off drafts of the same class on the same weekday into a weekly series. */
function mergeIntoSeries(drafts: ClassEventDraft[]): ClassEventDraft[] {
  const groups = new Map<string, ClassEventDraft[]>();
  const result: ClassEventDraft[] = [];
  for (const d of drafts) {
    if (d.weekdays.length > 0) {
      result.push(d);
      continue;
    }
    const key = [
      d.courseCode,
      d.courseName,
      d.section,
      d.kind,
      d.buildingCode,
      d.room,
      d.startTime,
      d.endTime,
      isoWeekday(d.startDate),
    ].join('|');
    const group = groups.get(key) ?? [];
    group.push(d);
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    if (group.length < 2) {
      result.push(group[0]!);
      continue;
    }
    const dates = [...new Set(group.map((g) => g.startDate))].sort();
    const first = dates[0]!;
    const last = dates[dates.length - 1]!;
    const present = new Set(dates);
    const excluded: string[] = [];
    for (let d = addDays(first, 7); d < last; d = addDays(d, 7)) {
      if (!present.has(d)) excluded.push(d);
    }
    result.push({
      ...group[0]!,
      weekdays: [isoWeekday(first)],
      startDate: first,
      endDate: last,
      excludedDates: excluded,
    });
  }
  return result;
}

function sortDrafts(drafts: ClassEventDraft[]): ClassEventDraft[] {
  return drafts.sort(
    (a, b) =>
      a.courseCode.localeCompare(b.courseCode) ||
      (a.weekdays[0] ?? isoWeekday(a.startDate)) - (b.weekdays[0] ?? isoWeekday(b.startDate)) ||
      a.startTime.localeCompare(b.startTime),
  );
}

export function parseIcs(text: string, opts: IcsImportOptions): IcsImportResult {
  const warnings: string[] = [];
  const zones = new ZoneWarnings();

  if (!/BEGIN:VCALENDAR/i.test(text)) {
    return { drafts: [], warnings: ['This file is not an iCalendar (.ics) file.'] };
  }

  const parsed = readEvents(unfold(text)).map((e) => convertEvent(e, opts, zones, warnings));

  // RECURRENCE-ID overrides replace one meeting of their master series.
  const masters = new Map<string, ClassEventDraft>();
  for (const p of parsed) if (p.uid && !p.recurrenceId && p.draft) masters.set(p.uid, p.draft);
  const drafts: ClassEventDraft[] = [];
  for (const p of parsed) {
    if (p.recurrenceId && p.uid) {
      const master = masters.get(p.uid);
      if (master && !master.excludedDates.includes(p.recurrenceId)) {
        master.excludedDates = [...master.excludedDates, p.recurrenceId].sort();
      }
      if (p.draft) drafts.push(p.draft);
    } else if (p.draft) {
      drafts.push(p.draft);
    }
  }

  for (const zone of zones.unknown) {
    warnings.push(`Unknown time zone "${zone}"; times were kept as written in the file.`);
  }
  if (drafts.length === 0 && warnings.length === 0) {
    warnings.push('No classes were found in this file.');
  }
  return { drafts: sortDrafts(mergeIntoSeries(drafts)), warnings };
}
