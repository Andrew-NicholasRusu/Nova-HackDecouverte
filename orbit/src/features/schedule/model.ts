/**
 * Class-event helpers (PLAN.md §2 Module A): date and time math, colours, normalization and
 * validation for the one class model (`ClassInput` / `ClassEvent` in data/types.ts).
 *
 * Pure TypeScript — no React Native imports — so it runs in node tests.
 */

import { COURSE_COLORS, DEFAULT_TERM_WEEKS } from '../../data/constants.ts';
import type { Weekday } from '../../data/enums.ts';
import type { ClassInput, ClassInputErrors } from '../../data/types.ts';

/** Stable colour for a course when the student didn't pick one. */
export function courseColor(event: Pick<ClassInput, 'courseCode' | 'color'>): string {
  if (event.color) return event.color;
  let hash = 0;
  for (const ch of event.courseCode.toUpperCase()) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
}

// ---------------------------------------------------------------------------
// Date & time helpers (date-only math is done in UTC so DST never shifts a day)
// ---------------------------------------------------------------------------

const TIME_RE = /^(\d{1,2}):(\d{2})$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "9:5" is rejected, "9:30" → "09:30", "21:00" → "21:00". Returns null if invalid. */
export function normalizeTime(value: string): string | null {
  const m = TIME_RE.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function isValidDate(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

function dateToUtc(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function utcToDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = dateToUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return utcToDate(d);
}

export function isoWeekday(date: string): Weekday {
  const day = dateToUtc(date).getUTCDay();
  return (day === 0 ? 7 : day) as Weekday;
}

/** Monday of the week containing `date`. */
export function startOfWeek(date: string): string {
  return addDays(date, 1 - isoWeekday(date));
}

/** Local calendar date of a JS Date as "YYYY-MM-DD". */
export function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Local JS Date for a calendar date + "HH:MM" wall time. */
export function atLocalTime(date: string, time: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, min);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Trims and normalizes an input; times like "9:30" become "09:30". */
export function normalizeClassInput(input: ClassInput): ClassInput {
  return {
    ...input,
    courseCode: input.courseCode.trim().toUpperCase().replace(/\s+/g, ' '),
    title: input.title.trim(),
    section: input.section.trim().toUpperCase(),
    buildingCode: input.buildingCode.trim().toUpperCase(),
    room: input.room.trim().toUpperCase(),
    days: [...new Set(input.days)].sort((a, b) => a - b),
    startTime: normalizeTime(input.startTime) ?? input.startTime.trim(),
    endTime: normalizeTime(input.endTime) ?? input.endTime.trim(),
    startDate: input.startDate.trim(),
    endDate: input.endDate.trim(),
  };
}

/** Returns field errors; an empty object means the input can be saved. Mirrors the DB checks. */
export function validateClassInput(input: ClassInput): ClassInputErrors {
  const errors: ClassInputErrors = {};
  if (!input.courseCode) errors.courseCode = 'Course code is required.';
  else if (input.courseCode.length > 20) errors.courseCode = 'Keep it under 20 characters.';
  if (input.title.length > 120) errors.title = 'Keep it under 120 characters.';
  if (input.section.length > 20) errors.section = 'Keep it under 20 characters.';
  if (input.buildingCode.length > 10) errors.buildingCode = 'Use the building code, e.g. H or EV.';
  if (input.room.length > 20) errors.room = 'Keep it under 20 characters.';
  if (input.days.length === 0) errors.days = 'Pick at least one day.';

  const start = normalizeTime(input.startTime);
  const end = normalizeTime(input.endTime);
  if (!start) errors.startTime = 'Use 24h time, e.g. 08:45.';
  if (!end) errors.endTime = 'Use 24h time, e.g. 10:00.';
  if (start && end && timeToMinutes(end) <= timeToMinutes(start)) {
    errors.endTime = 'Must end after it starts.';
  }

  const startOk = isValidDate(input.startDate);
  const endOk = isValidDate(input.endDate);
  if (!startOk) errors.startDate = 'Use YYYY-MM-DD.';
  if (!endOk) errors.endDate = 'Use YYYY-MM-DD.';
  if (startOk && endOk) {
    if (input.endDate < input.startDate) errors.endDate = 'Must be on or after the first day.';
    else if (dateToUtc(input.endDate).getTime() - dateToUtc(input.startDate).getTime() > 366 * 86_400_000) {
      errors.endDate = 'A class can span at most one year.';
    }
  }
  return errors;
}

export function emptyClassInput(today: string): ClassInput {
  return {
    courseCode: '',
    title: '',
    section: '',
    kind: 'lecture',
    buildingCode: '',
    room: '',
    days: [],
    startTime: '',
    endTime: '',
    startDate: today,
    endDate: addDays(today, 7 * DEFAULT_TERM_WEEKS),
    color: null,
  };
}
