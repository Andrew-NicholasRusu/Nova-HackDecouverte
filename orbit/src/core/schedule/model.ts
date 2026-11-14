import { z } from 'zod';

import { parseTime } from './time';

export const COMPONENTS = ['LEC', 'TUT', 'LAB', 'SEM', 'OTHER'] as const;
export type Component = (typeof COMPONENTS)[number];

export const COMPONENT_LABELS: Record<Component, string> = {
  LEC: 'Lecture',
  TUT: 'Tutorial',
  LAB: 'Lab',
  SEM: 'Seminar',
  OTHER: 'Other',
};

/** A class row as stored in public.class_events. The one class model used across ORBIT. */
export type ClassEvent = {
  id: string;
  term_label: string;
  course_code: string;
  course_title: string;
  component: Component;
  section: string;
  building_code: string;
  room: string;
  days: number[];
  start_time: string; // "HH:MM:SS", campus local time
  end_time: string;
  start_date: string; // "YYYY-MM-DD"
  end_date: string;
  timezone: string;
  color: string;
  source: 'manual' | 'ics' | 'concordia';
  notes: string | null;
};

export type ClassEventInput = Omit<ClassEvent, 'id' | 'timezone'>;

/** "comp352" / "COMP-352" / "comp 352" → "COMP 352". */
export function normalizeCourseCode(raw: string): string {
  const m = /^\s*([A-Za-z]{3,4})[\s-]*(\d{3,4}[A-Za-z]?)\s*$/.exec(raw);
  return m ? `${m[1].toUpperCase()} ${m[2].toUpperCase()}` : raw.trim().toUpperCase();
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.');
const time = z
  .string()
  .refine((v) => !Number.isNaN(parseTime(v)), 'Use 24-hour time, e.g. 13:45.');

/** Validation shared by the class form and the ICS import review. Mirrors the DB checks. */
export const classEventInputSchema = z
  .object({
    term_label: z.string().trim().min(1, 'Pick a term.').max(40),
    course_code: z
      .string()
      .transform(normalizeCourseCode)
      .pipe(z.string().regex(/^[A-Z]{3,4} \d{3,4}[A-Z]?$/, 'Use a course code like COMP 352.')),
    course_title: z.string().trim().max(120),
    component: z.enum(COMPONENTS),
    section: z.string().trim().max(10),
    building_code: z.string().trim().toUpperCase().max(10),
    room: z.string().trim().max(20),
    days: z
      .array(z.number().int().min(1).max(7))
      .min(1, 'Pick at least one day.')
      .transform((d) => [...new Set(d)].sort()),
    start_time: time,
    end_time: time,
    start_date: isoDate,
    end_date: isoDate,
    color: z.string().max(20),
    source: z.enum(['manual', 'ics', 'concordia']),
    notes: z.string().trim().max(500).nullable(),
  })
  .refine((v) => parseTime(v.end_time) > parseTime(v.start_time), {
    path: ['end_time'],
    message: 'End time must be after the start time.',
  })
  .refine((v) => v.end_date >= v.start_date, {
    path: ['end_date'],
    message: 'End date must be on or after the start date.',
  });
