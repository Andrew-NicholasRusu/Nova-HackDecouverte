/**
 * Schedule text → class drafts. Used for text read from photos (OCR), PDFs, pasted text,
 * CSV and plain-text exports. Heuristic by nature: every draft carries warnings for anything
 * guessed, and the student reviews each one before anything is saved.
 */

import { addDays, type ClassKind, type Weekday } from './model.ts';
import type { ImportDraft, IcsParseResult } from './ics.ts';

/** Concordia building codes that appear in room names ("H 820", "MB 2.130", "EV 7.210"). */
const BUILDINGS = new Set([
  'AD', 'BB', 'BH', 'CC', 'CI', 'CJ', 'CL', 'CP', 'DO', 'ER', 'EV', 'FA', 'FB', 'FG', 'GA', 'GM', 'GN', 'GS', 'H', 'HA', 'HB', 'HC', 'HU', 'JR', 'K', 'LB', 'LD', 'LS', 'MB', 'ME', 'MI', 'MU', 'P', 'PC', 'PR', 'PS', 'PT', 'PY', 'QA', 'RA', 'RF', 'RH', 'SB', 'SC', 'SF', 'SGW', 'SH', 'SI', 'SP', 'TA', 'TD', 'UC', 'VA', 'VE', 'VL', 'X', 'Z',
]);

/** Words that look like course codes ("TERM 2026") but are not. */
const NOT_SUBJECTS = new Set(['ROOM', 'TERM', 'FALL', 'WINT', 'YEAR', 'PAGE', 'DATE', 'TIME', 'WEEK', 'DAYS', 'HOUR', 'SECT', 'CLASS', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'CAMP', 'FREE', 'ROOM']);

const DAY_WORDS: [RegExp, Weekday][] = [
  [/^mon/i, 1], [/^tue/i, 2], [/^wed/i, 3], [/^thu/i, 4], [/^fri/i, 5], [/^sat/i, 6], [/^sun/i, 7],
];
const DAY_RE = /\b(mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b\.?/gi;
const TWO_LETTER: Record<string, Weekday> = { mo: 1, tu: 2, we: 3, th: 4, fr: 5, sa: 6, su: 7 };

const TIME_RE =
  /(\d{1,2})(?:[:h.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\s*(?:-|–|—|to|a|à|until)\s*(\d{1,2})(?:[:h.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i;

const KIND_RE = /\b(lec(?:ture)?|tut(?:orial)?|lab(?:oratory)?|exam|seminar|conf)\b/i;
const CODE_RE = /\b([A-Z]{3,4})[\s-]?(\d{3,4})\b/g;

const pad = (n: number) => String(n).padStart(2, '0');

export function defaultTerm(today: Date): { startDate: string; endDate: string } {
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  if (m <= 4) return { startDate: `${y}-01-05`, endDate: `${y}-04-20` };
  if (m <= 8) return { startDate: `${y}-05-05`, endDate: `${y}-08-15` };
  return { startDate: `${y}-09-02`, endDate: `${y}-12-15` };
}

function parseDays(line: string): Weekday[] {
  const found: Weekday[] = [];
  for (const m of line.matchAll(DAY_RE)) {
    const hit = DAY_WORDS.find(([re]) => re.test(m[1]));
    if (hit) found.push(hit[1]);
  }
  if (found.length) return found;

  // Compact forms: "MoWe", "TuTh", "MWF", "TTh" (only standalone tokens, and only capitalised).
  for (const m of line.matchAll(/\b([A-Z][a-z]?(?:[A-Z][a-z]?){0,4})\b/g)) {
    const token = m[1];
    const two = token.match(/[A-Z][a-z]/g);
    if (two && two.join('') === token && two.every((t) => TWO_LETTER[t.toLowerCase()])) {
      return two.map((t) => TWO_LETTER[t.toLowerCase()]);
    }
    if (/^(?:Th|[MTWRFSU])+$/.test(token) && token.length >= 2 && token.length <= 5 && /^[MTWRFSU]|^Th/.test(token)) {
      const letters: Weekday[] = [];
      for (let i = 0; i < token.length; ) {
        if (token.startsWith('Th', i)) { letters.push(4); i += 2; continue; }
        const c = token[i];
        const d: Weekday | undefined = ({ M: 1, T: 2, W: 3, R: 4, F: 5, S: 6, U: 7 } as Record<string, Weekday>)[c];
        if (!d) return found;
        letters.push(d);
        i++;
      }
      return letters;
    }
  }
  return found;
}

const meridiem = (s?: string) => (s ? (/^p/i.test(s) ? 'pm' : 'am') : null);

function parseTimes(line: string): { start: string; end: string; guessed: boolean } | null {
  const m = TIME_RE.exec(line);
  if (!m) return null;
  let sh = Number(m[1]);
  const sm = m[2] ? Number(m[2]) : 0;
  let eh = Number(m[4]);
  const em = m[5] ? Number(m[5]) : 0;
  if (sh > 24 || eh > 24 || sm > 59 || em > 59) return null;
  const sMer = meridiem(m[3]);
  const eMer = meridiem(m[6]) ?? sMer;
  let guessed = false;
  if (sMer || eMer) {
    const sUse = sMer ?? (eMer === 'pm' && sh < 12 && sh > eh % 12 ? 'am' : eMer);
    if (sUse === 'pm' && sh < 12) sh += 12;
    if (sUse === 'am' && sh === 12) sh = 0;
    if (eMer === 'pm' && eh < 12) eh += 12;
    if (eMer === 'am' && eh === 12) eh = 0;
  } else if (sh < 24 && eh < 24) {
    // No am/pm: class hours run roughly 08:00–22:00, so 1–7 means afternoon.
    if (sh >= 1 && sh <= 7) { sh += 12; guessed = true; }
    if (eh >= 1 && eh <= 7) { eh += 12; guessed = true; }
    if (eh * 60 + em <= sh * 60 + sm && eh < 12) { eh += 12; guessed = true; }
  }
  if (eh * 60 + em <= sh * 60 + sm) return null;
  if (sh > 23 || eh > 23) return null;
  return { start: `${pad(sh)}:${pad(sm)}`, end: `${pad(eh)}:${pad(em)}`, guessed };
}

function parseRoom(line: string, courseCode: string): { building: string; room: string } | null {
  const re = /\b([A-Z]{1,3})[\s-]?([A-Z]?\d{1,2}(?:[.\- ]\d{2,3})?\d{0,3})\b/g;
  for (const m of line.matchAll(re)) {
    const b = m[1];
    if (!BUILDINGS.has(b)) continue;
    if (courseCode.replace(/\s/g, '').includes(m[0].replace(/[\s-]/g, ''))) continue;
    const room = m[2].replace(/[\s-]/g, '.').replace(/\.\./g, '.');
    if (!/\d/.test(room)) continue;
    return { building: b === 'SGW' ? '' : b, room };
  }
  return null;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function parseDateRange(text: string): { startDate: string; endDate: string } | null {
  const iso = [...text.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g)].map((m) => m[0]);
  if (iso.length >= 2) return { startDate: iso[0], endDate: iso[1] };
  const named = [...text.matchAll(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(20\d{2})\b/gi)].map(
    (m) => `${m[3]}-${pad(MONTHS.indexOf(m[1].toLowerCase()) + 1)}-${pad(Number(m[2]))}`,
  );
  if (named.length >= 2) return { startDate: named[0], endDate: named[1] };
  return null;
}

type Meeting = { days: Weekday[]; start: string; end: string; room: { building: string; room: string } | null; guessed: boolean };

/** Splits `text` at each course code and builds one draft per distinct meeting pattern. */
export function parseScheduleText(text: string, today = new Date()): IcsParseResult {
  const lines = text
    .replace(/\r/g, '')
    .replace(/[|•·]/g, ' ')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const term = parseDateRange(text) ?? defaultTerm(today);
  const termGuessed = !parseDateRange(text);

  // Find course-code anchors.
  const anchors: { line: number; code: string }[] = [];
  lines.forEach((line, i) => {
    for (const m of line.toUpperCase().matchAll(CODE_RE)) {
      if (NOT_SUBJECTS.has(m[1])) continue;
      anchors.push({ line: i, code: `${m[1]} ${m[2]}` });
      break;
    }
  });
  if (anchors.length === 0) return { drafts: [], skipped: 0 };

  const drafts: ImportDraft[] = [];
  let skipped = 0;

  anchors.forEach((anchor, idx) => {
    const end = idx + 1 < anchors.length ? anchors[idx + 1].line : lines.length;
    const block = lines.slice(anchor.line, end);
    const blockText = block.join(' ');

    const kind: ClassKind = (() => {
      const k = KIND_RE.exec(blockText)?.[1].toLowerCase() ?? '';
      if (k.startsWith('tut')) return 'tutorial';
      if (k.startsWith('lab')) return 'lab';
      if (k === 'exam') return 'exam';
      if (k === 'seminar' || k === 'conf') return 'other';
      return 'lecture';
    })();
    const section = /\b(?:section|sect\.?|sec\.?)\s*([A-Z]{1,2}\d?|\d{1,2})\b/i.exec(blockText)?.[1]?.toUpperCase() ?? '';

    // Title: the rest of the anchor line (or the next line) once codes, times, days and rooms are removed.
    const clean = (s: string) =>
      s
        .replace(new RegExp(anchor.code.replace(' ', '[\\s-]?'), 'i'), '')
        .replace(TIME_RE, '')
        .replace(DAY_RE, '')
        .replace(KIND_RE, '')
        .replace(/\b(?:section|sect\.?|sec\.?)\s*[A-Z0-9]{1,3}\b/gi, '')
        .replace(/\b[A-Z]{1,3}[\s-]?[A-Z]?\d{1,2}(?:[.\- ]\d{2,3})?\d{0,3}\b/g, (x) => (BUILDINGS.has(x.match(/^[A-Z]+/)![0]) ? '' : x))
        .replace(/^[\s\-–—:,.]+|[\s\-–—:,.]+$/g, '')
        .trim();
    const title = [clean(block[0]), ...block.slice(1, 3).map(clean)].find((t) => t.length >= 4 && /[A-Za-z]{3}/.test(t) && !/^\d/.test(t)) ?? '';

    // Meetings: carry days and room forward through the block's lines.
    const meetings: Meeting[] = [];
    let days: Weekday[] = [];
    let room: Meeting['room'] = null;
    for (const line of block) {
      const d = parseDays(line);
      if (d.length) days = d;
      const r = parseRoom(line.toUpperCase().replace(anchor.code, ''), anchor.code);
      if (r) room = r;
      const t = parseTimes(line.replace(/\b20\d{2}-\d{2}-\d{2}\b/g, ''));
      if (t) meetings.push({ days, start: t.start, end: t.end, room, guessed: t.guessed });
    }
    // A day line that came after its time line ("10:15-11:30 / Mon Wed"): fill the gaps backwards.
    for (let i = meetings.length - 1, carry: Weekday[] = []; i >= 0; i--) {
      if (meetings[i].days.length) carry = meetings[i].days;
      else meetings[i].days = carry;
    }
    // Same for a room that follows its time line ("2:45 PM - 4:00 PM / Room MB 2.130").
    for (let i = meetings.length - 1, carry: Meeting['room'] = room; i >= 0; i--) {
      if (meetings[i].room) carry = meetings[i].room;
      else meetings[i].room = carry;
    }
    if (meetings.length === 0 || meetings.every((m) => m.days.length === 0)) {
      const lone = parseDays(blockText);
      if (meetings.length) meetings.forEach((m) => (m.days = lone));
    }

    const make = (m: Meeting | null, n: number): ImportDraft => {
      const warnings: string[] = [];
      if (!m) warnings.push('No meeting time found. Set the days and times before importing.');
      else {
        if (m.days.length === 0) warnings.push('No weekday found. Pick the days before importing.');
        if (m.guessed) warnings.push('Times had no AM/PM; assumed daytime hours. Please check them.');
      }
      if (termGuessed) warnings.push('Term dates were not in the file; assumed the current term.');
      return {
        key: `txt-${idx}-${n}`,
        courseCode: anchor.code,
        title,
        section,
        kind,
        buildingCode: m?.room?.building ?? '',
        room: m?.room?.room ?? '',
        days: m?.days ?? [],
        startTime: m?.start ?? '',
        endTime: m?.end ?? '',
        startDate: term.startDate,
        endDate: term.endDate,
        color: null,
        warnings,
      };
    };

    if (meetings.length === 0) {
      drafts.push(make(null, 0));
      return;
    }
    // Merge identical time/room patterns that differ only by day.
    const merged = new Map<string, Meeting>();
    for (const m of meetings) {
      const key = `${m.start}|${m.end}|${m.room?.building}|${m.room?.room}`;
      const ex = merged.get(key);
      if (ex) ex.days = [...new Set([...ex.days, ...m.days])].sort((a, b) => a - b) as Weekday[];
      else merged.set(key, { ...m, days: [...new Set(m.days)].sort((a, b) => a - b) as Weekday[] });
    }
    [...merged.values()].forEach((m, n) => drafts.push(make(m, n)));
  });

  // Same course repeated identically (OCR often reads a table twice): drop exact duplicates.
  const seen = new Set<string>();
  const unique = drafts.filter((d) => {
    const k = [d.courseCode, d.kind, d.days.join(), d.startTime, d.endTime, d.room].join('|');
    if (seen.has(k)) { skipped++; return false; }
    seen.add(k);
    return true;
  });
  void addDays;
  return { drafts: unique, skipped };
}
