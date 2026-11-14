/**
 * Minimal iCalendar (RFC 5545) reader for class schedules. Extracts VEVENTs into ORBIT's class
 * model as *candidates*: they are always shown on a review screen before anything is saved
 * (PLAN.md: never silently add unverified extracted events).
 *
 * Supported: DTSTART/DTEND with TZID, floating or UTC ("Z") times; RRULE FREQ=WEEKLY with BYDAY,
 * UNTIL or COUNT; single (non-recurring) events. Not supported (reported as warnings): other
 * frequencies, INTERVAL > 1, EXDATE (cancelled sessions are kept).
 */
import { normalizeCourseCode, type ClassEventInput, type Component } from './model';
import { CAMPUS_TZ, addDays, localMoment, toDbTime, weekdayOf } from './time';

export type ImportCandidate = ClassEventInput & { key: string; warnings: string[] };

const BYDAY: Record<string, number> = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7 };

type Prop = { name: string; params: Record<string, string>; value: string };

function unfold(text: string): string[] {
  return text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);
}

function parseProp(line: string): Prop | null {
  const idx = line.indexOf(':');
  if (idx < 0) return null;
  const [name, ...rawParams] = line.slice(0, idx).split(';');
  const params: Record<string, string> = {};
  for (const p of rawParams) {
    const [k, v] = p.split('=');
    if (k && v) params[k.toUpperCase()] = v.replace(/^"|"$/g, '');
  }
  const value = line
    .slice(idx + 1)
    .replace(/\\n/gi, ' ')
    .replace(/\\([,;\\])/g, '$1')
    .trim();
  return { name: name.toUpperCase(), params, value };
}

/** Returns campus-local { date, minutes } for an iCal date-time value. */
function toCampusLocal(prop: Prop): { date: string; minutes: number } | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(prop.value);
  if (!m) return null;
  const [, y, mo, d, h = '00', mi = '00', s = '00', z] = m;
  const date = `${y}-${mo}-${d}`;
  const tz = prop.params.TZID;
  if (z) {
    // UTC instant → campus wall clock.
    const lm = localMoment(new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)), CAMPUS_TZ);
    return { date: lm.date, minutes: lm.minutes };
  }
  if (tz && tz !== CAMPUS_TZ) {
    // Interpret wall time in `tz`, then express it in campus time.
    const guess = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
    const inTz = localMoment(new Date(guess), tz);
    const offset = guess - Date.UTC(+inTz.date.slice(0, 4), +inTz.date.slice(5, 7) - 1, +inTz.date.slice(8, 10), Math.floor(inTz.minutes / 60), inTz.minutes % 60);
    const lm = localMoment(new Date(guess + offset), CAMPUS_TZ);
    return { date: lm.date, minutes: lm.minutes };
  }
  // Floating time or campus TZID: already campus wall clock.
  return { date, minutes: +h * 60 + +mi };
}

function guessComponent(text: string): Component {
  if (/\b(tut|tutorial)\b/i.test(text)) return 'TUT';
  if (/\b(lab|laboratory)\b/i.test(text)) return 'LAB';
  if (/\b(sem|seminar)\b/i.test(text)) return 'SEM';
  if (/\b(lec|lecture)\b/i.test(text)) return 'LEC';
  return 'LEC';
}

/** "H 920", "H-920", "EV 3.309", "SGW EV 3.309" → { building, room }. */
export function parseLocation(location: string): { building: string; room: string } {
  const m = /\b([A-Z]{1,3})[\s-]+(S?\d[\w.-]*)\b/.exec(location.toUpperCase().replace(/\b(SGW|LOY)\b/g, ''));
  return m ? { building: m[1], room: m[2] } : { building: '', room: location.slice(0, 20) };
}

export function parseIcs(text: string, termLabel: string): ImportCandidate[] {
  const lines = unfold(text);
  const out: ImportCandidate[] = [];
  let props: Prop[] | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') props = [];
    else if (line === 'END:VEVENT' && props) {
      const c = toCandidate(props, termLabel, out.length);
      if (c) out.push(c);
      props = null;
    } else if (props) {
      const p = parseProp(line);
      if (p) props.push(p);
    }
  }
  return out;
}

function toCandidate(props: Prop[], termLabel: string, index: number): ImportCandidate | null {
  const get = (n: string) => props.find((p) => p.name === n);
  const dtStart = get('DTSTART');
  const dtEnd = get('DTEND');
  if (!dtStart) return null;
  const start = toCampusLocal(dtStart);
  const end = dtEnd ? toCampusLocal(dtEnd) : null;
  if (!start) return null;

  const warnings: string[] = [];
  const summary = get('SUMMARY')?.value ?? '';
  const location = get('LOCATION')?.value ?? '';
  const codeMatch = /\b([A-Z]{3,4})[\s-]?(\d{3,4}[A-Z]?)\b/i.exec(summary);
  const course_code = codeMatch ? normalizeCourseCode(`${codeMatch[1]} ${codeMatch[2]}`) : '';
  if (!course_code) warnings.push('No course code found — enter it before importing.');

  const title = summary
    .replace(codeMatch?.[0] ?? '', '')
    .replace(/\b(lec|lecture|tut|tutorial|lab|laboratory|sem|seminar)\b/gi, '')
    .replace(/^[\s\-–:/|]+|[\s\-–:/|]+$/g, '')
    .slice(0, 120);

  const endMinutes = end?.minutes ?? start.minutes + 60;
  if (!end) warnings.push('No end time in the file — assumed 1 hour.');

  let days = [weekdayOf(start.date)];
  let endDate = start.date;
  const rruleRaw = get('RRULE')?.value;
  if (rruleRaw) {
    const rule = Object.fromEntries(rruleRaw.split(';').map((kv) => kv.split('=') as [string, string]));
    if (rule.FREQ !== 'WEEKLY') warnings.push(`Repeats ${rule.FREQ?.toLowerCase() ?? 'irregularly'} — imported as weekly.`);
    if (rule.INTERVAL && rule.INTERVAL !== '1') warnings.push('Repeats every few weeks — imported as every week.');
    if (rule.BYDAY) {
      const parsed = rule.BYDAY.split(',').map((d) => BYDAY[d.slice(-2)]).filter(Boolean);
      if (parsed.length) days = parsed;
    }
    if (rule.UNTIL) {
      const until = toCampusLocal({ name: 'UNTIL', params: {}, value: rule.UNTIL });
      if (until) endDate = until.date;
    } else if (rule.COUNT) {
      endDate = addDays(start.date, Math.ceil(Number(rule.COUNT) / days.length) * 7 - 1);
    } else {
      warnings.push('No end date in the file — set the last day of class.');
    }
  }
  if (get('EXDATE')) warnings.push('Some sessions are cancelled in the file; ORBIT shows every week.');

  const { building, room } = parseLocation(location);

  return {
    key: `${index}-${get('UID')?.value ?? summary}`,
    term_label: termLabel,
    course_code,
    course_title: title,
    component: guessComponent(summary),
    section: '',
    building_code: building,
    room,
    days: [...new Set(days)].sort(),
    start_time: toDbTime(start.minutes),
    end_time: toDbTime(endMinutes),
    start_date: start.date,
    end_date: endDate,
    color: 'accent',
    source: 'ics',
    notes: null,
    warnings,
  };
}
