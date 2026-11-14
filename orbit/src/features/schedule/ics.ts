/**
 * ICS (iCalendar, RFC 5545) → ORBIT class drafts. PLAN.md §2 Module A import workflow:
 * this only *extracts*; the student reviews every draft before anything is saved.
 *
 * Supported: line folding, escaped text, DTSTART/DTEND with UTC (Z), TZID or floating
 * times, weekly RRULE with BYDAY/UNTIL/COUNT, cancelled events, recurrence overrides
 * (skipped), and calendars that list every occurrence separately (merged into one class).
 * Anything we can't map exactly is kept but flagged with a warning for the review screen.
 */

import {
  addDays,
  CAMPUS_TIMEZONE,
  isoWeekday,
  type ClassInput,
  type ClassKind,
  type Weekday,
} from './model.ts';

export type ImportDraft = ClassInput & {
  /** Stable id for list rendering in the review screen. */
  key: string;
  warnings: string[];
};

export type IcsParseResult = {
  drafts: ImportDraft[];
  /** VEVENTs ignored (all-day, cancelled, overrides, unreadable). */
  skipped: number;
};

type Prop = { value: string; params: Record<string, string> };
type RawEvent = Map<string, Prop>;

// ---------------------------------------------------------------------------
// Low-level parsing
// ---------------------------------------------------------------------------

function unfold(text: string): string[] {
  return text.replace(/\r\n|\r/g, '\n').replace(/\n[ \t]/g, '').split('\n');
}

/** "DTSTART;TZID=America/Toronto:20260908T083000" → name, params, value. Handles quoted params. */
function parseLine(line: string): { name: string; prop: Prop } | null {
  let inQuotes = false;
  let colon = -1;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') inQuotes = !inQuotes;
    else if (line[i] === ':' && !inQuotes) {
      colon = i;
      break;
    }
  }
  if (colon < 0) return null;
  const [name, ...rawParams] = line.slice(0, colon).split(';');
  const params: Record<string, string> = {};
  for (const p of rawParams) {
    const eq = p.indexOf('=');
    if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, '');
  }
  return { name: name.toUpperCase(), prop: { value: line.slice(colon + 1), params } };
}

function unescapeText(value: string): string {
  return value.replace(/\\([\\;,nN])/g, (_, c: string) => (c === 'n' || c === 'N' ? '\n' : c)).trim();
}

function readEvents(text: string): RawEvent[] {
  const events: RawEvent[] = [];
  let current: RawEvent | null = null;
  let depth = 0; // nested components inside VEVENT (e.g. VALARM) are ignored
  for (const line of unfold(text)) {
    if (!line) continue;
    const upper = line.toUpperCase();
    if (upper === 'BEGIN:VEVENT') {
      current = new Map();
      depth = 0;
    } else if (upper === 'END:VEVENT') {
      if (current) events.push(current);
      current = null;
    } else if (current) {
      if (upper.startsWith('BEGIN:')) depth++;
      else if (upper.startsWith('END:')) depth--;
      else if (depth === 0) {
        const parsed = parseLine(line);
        if (parsed && !current.has(parsed.name)) current.set(parsed.name, parsed.prop);
      }
    }
  }
  return events;
}

// ---------------------------------------------------------------------------
// Date/time conversion to campus wall time
// ---------------------------------------------------------------------------

type WallTime = { date: string; time: string };

const pad = (n: number) => String(n).padStart(2, '0');

function partsIn(timeZone: string, utcMs: number) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const get = (type: string) => Number(fmt.formatToParts(new Date(utcMs)).find((p) => p.type === type)?.value);
  return { y: get('year'), mo: get('month'), d: get('day'), h: get('hour'), mi: get('minute'), s: get('second') };
}

/** Offset of `timeZone` from UTC at a given instant, in ms. */
function tzOffsetMs(timeZone: string, utcMs: number): number {
  const p = partsIn(timeZone, utcMs);
  return Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - utcMs;
}

function utcToCampus(utcMs: number): WallTime {
  const p = partsIn(CAMPUS_TIMEZONE, utcMs);
  return { date: `${p.y}-${pad(p.mo)}-${pad(p.d)}`, time: `${pad(p.h)}:${pad(p.mi)}` };
}

const DATE_TIME_RE = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/;

/**
 * Converts an ICS date-time to campus wall time. Returns null for all-day (DATE) values.
 * Unknown TZIDs (e.g. Windows names) are assumed to already be campus time, with a warning.
 */
function toCampusWallTime(prop: Prop, warnings: string[]): WallTime | null {
  const m = DATE_TIME_RE.exec(prop.value.trim());
  if (!m || m[4] === undefined) return null;
  const [y, mo, d, h, mi] = [m[1], m[2], m[3], m[4], m[5]].map(Number);
  const wallMs = Date.UTC(y, mo - 1, d, h, mi);

  if (m[7] === 'Z') return utcToCampus(wallMs);

  const tzid = prop.params.TZID;
  if (tzid && tzid !== CAMPUS_TIMEZONE) {
    try {
      // Wall time in `tzid` → UTC (two passes so DST edges resolve) → campus wall time.
      let utc = wallMs - tzOffsetMs(tzid, wallMs);
      utc = wallMs - tzOffsetMs(tzid, utc);
      return utcToCampus(utc);
    } catch {
      warnings.push(`Unknown time zone "${tzid}"; times assumed to be Montréal time.`);
    }
  }
  return { date: `${m[1]}-${m[2]}-${m[3]}`, time: `${m[4]}:${m[5]}` };
}

// ---------------------------------------------------------------------------
// Recurrence
// ---------------------------------------------------------------------------

const BYDAY: Record<string, Weekday> = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7 };
const DEFAULT_TERM_WEEKS = 15;

function parseRrule(value: string): Record<string, string> {
  const rule: Record<string, string> = {};
  for (const part of value.split(';')) {
    const [k, v] = part.split('=');
    if (k && v) rule[k.toUpperCase()] = v.toUpperCase();
  }
  return rule;
}

/** Last date of a weekly series that stops after `count` occurrences. */
function endDateFromCount(startDate: string, days: Weekday[], count: number): string {
  let date = startDate;
  let seen = 0;
  for (let i = 0; i < 7 * 60; i++, date = addDays(date, 1)) {
    if (days.includes(isoWeekday(date)) && ++seen >= count) return date;
  }
  return date;
}

function applyRecurrence(
  rruleValue: string | undefined,
  start: WallTime,
  warnings: string[],
): { days: Weekday[]; endDate: string; recurring: boolean } {
  const startDay = isoWeekday(start.date);
  if (!rruleValue) return { days: [startDay], endDate: start.date, recurring: false };

  const rule = parseRrule(rruleValue);
  if (rule.FREQ !== 'WEEKLY') {
    warnings.push(`Repeats ${rule.FREQ?.toLowerCase() ?? 'irregularly'}; imported as a single class.`);
    return { days: [startDay], endDate: start.date, recurring: false };
  }
  if (rule.INTERVAL && rule.INTERVAL !== '1') {
    warnings.push(`Repeats every ${rule.INTERVAL} weeks in the file; imported as every week.`);
  }

  const days = rule.BYDAY
    ? [...new Set(rule.BYDAY.split(',').map((d) => BYDAY[d.slice(-2)]).filter(Boolean))].sort((a, b) => a - b)
    : [startDay];

  let endDate: string;
  if (rule.UNTIL) {
    const until = toCampusWallTime({ value: rule.UNTIL, params: {} }, warnings);
    const m = DATE_TIME_RE.exec(rule.UNTIL);
    endDate = until?.date ?? (m ? `${m[1]}-${m[2]}-${m[3]}` : start.date);
  } else if (rule.COUNT) {
    endDate = endDateFromCount(start.date, days, Number(rule.COUNT));
  } else {
    endDate = addDays(start.date, 7 * DEFAULT_TERM_WEEKS - 1);
    warnings.push(`No end date in the file; set to ${DEFAULT_TERM_WEEKS} weeks. Check the last day.`);
  }
  return { days, endDate: endDate < start.date ? start.date : endDate, recurring: true };
}

// ---------------------------------------------------------------------------
// Course / location heuristics (best effort — the student reviews everything)
// ---------------------------------------------------------------------------

const COURSE_RE = /\b([A-Z]{3,4})[\s-]*(\d{3,4}[A-Z]?)\b/;
const LOCATION_RE = /\b([A-Z]{1,3})[\s-]+([A-Z]?\d{1,2}(?:\.\d{1,3})?|\d{3,4})\b/;

function detectKind(text: string): ClassKind {
  if (/\b(lab|laboratory)\b/i.test(text)) return 'lab';
  if (/\b(tut|tutorial)\b/i.test(text)) return 'tutorial';
  if (/\b(exam|final|midterm)\b/i.test(text)) return 'exam';
  if (/\b(lec|lecture)\b/i.test(text)) return 'lecture';
  return 'lecture';
}

function splitSummary(summary: string, warnings: string[]) {
  const m = COURSE_RE.exec(summary.toUpperCase());
  if (!m) {
    warnings.push('No course code found; please check the course code.');
    return { courseCode: summary.slice(0, 20).toUpperCase(), title: summary.slice(0, 120) };
  }
  const title = (summary.slice(0, m.index) + summary.slice(m.index + m[0].length))
    .replace(/\b(lec|lecture|tut|tutorial|lab)\b/gi, '')
    .replace(/[([]\s*[)\]]/g, '')
    .replace(/^[\s\-–:|,/]+|[\s\-–:|,/]+$/g, '')
    .replace(/\s{2,}/g, ' ');
  return { courseCode: `${m[1]} ${m[2]}`, title: title.slice(0, 120) };
}

function detectSection(text: string): string {
  return (/\b(?:section|sect?\.?)\s*([A-Z0-9]{1,6})\b/i.exec(text)?.[1] ?? '').toUpperCase();
}

function splitLocation(location: string, warnings: string[]) {
  if (!location) return { buildingCode: '', room: '' };
  const m = LOCATION_RE.exec(location.toUpperCase());
  if (!m) {
    warnings.push(`Couldn't read a building and room from "${location}".`);
    return { buildingCode: '', room: location.slice(0, 20).toUpperCase() };
  }
  return { buildingCode: m[1], room: m[2] };
}

// ---------------------------------------------------------------------------
// Merge: calendars often list each occurrence, or each weekday, as its own event
// ---------------------------------------------------------------------------

function mergeDrafts(drafts: ImportDraft[]): ImportDraft[] {
  const byKey = new Map<string, ImportDraft>();
  for (const d of drafts) {
    const key = [d.courseCode, d.title, d.kind, d.section, d.buildingCode, d.room, d.startTime, d.endTime].join('|');
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...d, days: [...d.days], warnings: [...d.warnings] });
      continue;
    }
    existing.days = [...new Set([...existing.days, ...d.days])].sort((a, b) => a - b);
    if (d.startDate < existing.startDate) existing.startDate = d.startDate;
    if (d.endDate > existing.endDate) existing.endDate = d.endDate;
    existing.warnings = [...new Set([...existing.warnings, ...d.warnings])];
  }
  return [...byKey.values()].map((d, i) => ({ ...d, key: `draft-${i}` }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function parseIcs(text: string): IcsParseResult {
  if (!/BEGIN:VCALENDAR/i.test(text)) {
    throw new Error("This doesn't look like a calendar (.ics) file.");
  }

  const drafts: ImportDraft[] = [];
  let skipped = 0;

  for (const ev of readEvents(text)) {
    const warnings: string[] = [];
    const dtstart = ev.get('DTSTART');
    const status = ev.get('STATUS')?.value.toUpperCase();
    if (!dtstart || status === 'CANCELLED' || ev.has('RECURRENCE-ID')) {
      skipped++;
      continue;
    }
    const start = toCampusWallTime(dtstart, warnings);
    if (!start) {
      skipped++; // all-day events aren't classes
      continue;
    }

    const dtend = ev.get('DTEND');
    let end = dtend ? toCampusWallTime(dtend, warnings) : null;
    if (!end) {
      const dur = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(ev.get('DURATION')?.value ?? '');
      const minutes = dur ? Number(dur[1] ?? 0) * 60 + Number(dur[2] ?? 0) : 60;
      const total = Number(start.time.slice(0, 2)) * 60 + Number(start.time.slice(3)) + minutes;
      end = { date: start.date, time: `${pad(Math.min(23, Math.floor(total / 60)))}:${pad(total % 60)}` };
      if (!dur) warnings.push('No end time in the file; assumed 1 hour.');
    }
    if (end.date !== start.date || end.time <= start.time) {
      skipped++;
      continue;
    }

    const summary = unescapeText(ev.get('SUMMARY')?.value ?? '');
    const location = unescapeText(ev.get('LOCATION')?.value ?? '');
    const description = unescapeText(ev.get('DESCRIPTION')?.value ?? '');
    const recurrence = applyRecurrence(ev.get('RRULE')?.value, start, warnings);

    drafts.push({
      key: '',
      ...splitSummary(summary || 'Untitled', warnings),
      section: detectSection(`${summary} ${description}`),
      kind: detectKind(`${summary} ${description}`),
      ...splitLocation(location, warnings),
      days: recurrence.days,
      startTime: start.time,
      endTime: end.time,
      startDate: start.date,
      endDate: recurrence.endDate,
      color: null,
      warnings,
    });
  }

  return { drafts: mergeDrafts(drafts), skipped };
}
