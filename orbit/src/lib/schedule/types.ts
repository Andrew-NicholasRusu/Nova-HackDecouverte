/**
 * ORBIT's single class-event model (PLAN.md Module A: "Use one standardized
 * class-event data model throughout ORBIT"). Calendar, dashboard, friends
 * availability and notifications must all consume this shape.
 *
 * Times are local wall-clock times in the schedule's IANA time zone
 * (America/Toronto for Concordia). A 10:15 class stays at 10:15 across the
 * DST change, which a fixed UTC instant would get wrong for a recurring
 * series. Concrete instants are derived per occurrence (see recurrence.ts).
 */

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7];

export const CLASS_KINDS = ['lecture', 'tutorial', 'lab', 'seminar', 'exam', 'other'] as const;
export type ClassKind = (typeof CLASS_KINDS)[number];

export type EventSource = 'manual' | 'ics' | 'pdf' | 'image';

/** The timing fields every recurrence/conflict calculation needs. */
export type EventTiming = {
  /** Weekly days the class meets. Empty = one-off event on `startDate`. */
  weekdays: Weekday[];
  /** 'HH:MM', 24h, local to the schedule time zone. */
  startTime: string;
  /** 'HH:MM', 24h, strictly after startTime (classes never cross midnight). */
  endTime: string;
  /** 'YYYY-MM-DD', first date of the series (inclusive). */
  startDate: string;
  /** 'YYYY-MM-DD', last date of the series (inclusive). */
  endDate: string;
  /** Dates ('YYYY-MM-DD') on which a recurring class does not meet. */
  excludedDates: string[];
};

/** A class that has not been saved yet (manual form or import review). */
export type ClassEventDraft = EventTiming & {
  courseCode: string;
  courseName: string;
  section: string | null;
  kind: ClassKind;
  buildingCode: string | null;
  room: string | null;
  color: string | null;
  notes: string | null;
  source: EventSource;
};

export type ClassEvent = ClassEventDraft & {
  id: string;
  scheduleId: string;
};

/** A student's schedule for one academic term. */
export type Schedule = {
  id: string;
  name: string;
  /** 'YYYY-MM-DD' */
  startsOn: string;
  /** 'YYYY-MM-DD' */
  endsOn: string;
  timezone: string;
  isActive: boolean;
};

/** One concrete meeting of a class on a specific date. */
export type Occurrence<T extends EventTiming = ClassEvent> = {
  event: T;
  /** Local date 'YYYY-MM-DD' in the schedule time zone. */
  date: string;
  start: Date;
  end: Date;
};

export const DEFAULT_TIMEZONE = 'America/Toronto';
