import { isoWeekday, todayIn } from '@/lib/schedule/time';
import type { ClassEventDraft, ClassKind, Schedule } from '@/lib/schedule/types';
import { DEFAULT_TIMEZONE } from '@/lib/schedule/types';

export const KIND_LABELS: Record<ClassKind, string> = {
  lecture: 'Lecture',
  tutorial: 'Tutorial',
  lab: 'Lab',
  seminar: 'Seminar',
  exam: 'Exam',
  other: 'Other',
};

/**
 * A starting point for the term form, based on today's date. These are
 * deliberately broad placeholders, not official term dates; the student
 * is asked to confirm them.
 */
export function suggestTerm(now = new Date()): { name: string; startsOn: string; endsOn: string } {
  const today = todayIn(DEFAULT_TIMEZONE, now);
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  if (month >= 9) return { name: `Fall ${year}`, startsOn: `${year}-09-01`, endsOn: `${year}-12-23` };
  if (month <= 4) return { name: `Winter ${year}`, startsOn: `${year}-01-05`, endsOn: `${year}-04-30` };
  return { name: `Summer ${year}`, startsOn: `${year}-05-01`, endsOn: `${year}-08-31` };
}

/** Empty class for the manual form, spanning the term and meeting on `date`'s weekday. */
export function blankDraft(schedule: Schedule, date?: string): ClassEventDraft {
  const day = date ?? todayIn(schedule.timezone);
  return {
    courseCode: '',
    courseName: '',
    section: null,
    kind: 'lecture',
    buildingCode: null,
    room: null,
    weekdays: [isoWeekday(day)],
    startTime: '10:00',
    endTime: '11:15',
    startDate: schedule.startsOn,
    endDate: schedule.endsOn,
    excludedDates: [],
    color: null,
    notes: null,
    source: 'manual',
  };
}

/** A one-off copy of a recurring class on `date`, used for "edit only this date". */
export function oneOffFrom(event: ClassEventDraft, date: string): ClassEventDraft {
  return { ...event, weekdays: [], startDate: date, endDate: date, excludedDates: [] };
}

