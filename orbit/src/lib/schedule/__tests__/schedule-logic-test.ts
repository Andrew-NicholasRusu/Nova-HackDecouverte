import { describe, expect, it } from '@jest/globals';

import { courseColor } from '../colors';
import {
  conflictBetween,
  findConflicts,
  findConflictsWith,
  overlappingOccurrences,
} from '../conflicts';
import { calculateFreePeriods, calculateNextClass } from '../insights';
import { countOccurrences, expandOccurrences, occursOn } from '../recurrence';
import { hasErrors, normalizeDraft, validateClassDraft } from '../validate';
import { draft, TZ } from '../test-fixtures';

describe('recurrence', () => {
  it('expands weekly classes within the term and honours skipped dates', () => {
    const e = draft({ excludedDates: ['2026-10-12'] }); // Thanksgiving Monday
    expect(occursOn(e, '2026-09-07')).toBe(true); // Mon
    expect(occursOn(e, '2026-09-08')).toBe(false); // Tue
    expect(occursOn(e, '2026-10-12')).toBe(false);
    expect(occursOn(e, '2026-12-09')).toBe(false); // after end
    const week = expandOccurrences([e], '2026-09-07', '2026-09-13', TZ);
    expect(week.map((o) => o.date)).toEqual(['2026-09-07', '2026-09-09']);
    expect(week[0]!.start.toISOString()).toBe('2026-09-07T14:15:00.000Z');
  });

  it('treats an event with no weekdays as a one-off', () => {
    const exam = draft({ weekdays: [], startDate: '2026-12-10', endDate: '2026-12-10', kind: 'exam' });
    expect(countOccurrences(exam)).toBe(1);
    expect(expandOccurrences([exam], '2026-12-01', '2026-12-31', TZ)).toHaveLength(1);
  });

  it('sorts occurrences from several events by start', () => {
    const a = draft({ startTime: '13:00', endTime: '14:00' });
    const b = draft({ courseCode: 'MATH 205', startTime: '08:45', endTime: '10:00' });
    const day = expandOccurrences([a, b], '2026-09-07', '2026-09-07', TZ);
    expect(day.map((o) => o.event.courseCode)).toEqual(['MATH 205', 'COMP 248']);
  });
});

describe('conflicts', () => {
  it('detects overlapping classes on a shared day', () => {
    const a = draft();
    const b = draft({ courseCode: 'MATH 205', weekdays: [3], startTime: '11:00', endTime: '12:15' });
    const c = conflictBetween(a, b);
    expect(c?.firstDate).toBe('2026-09-09');
    expect(c?.dates).toBe(13);
  });

  it('does not flag back-to-back classes, different days or disjoint terms', () => {
    const a = draft();
    expect(conflictBetween(a, draft({ startTime: '11:30', endTime: '12:45' }))).toBeNull();
    expect(conflictBetween(a, draft({ weekdays: [2, 4] }))).toBeNull();
    expect(
      conflictBetween(a, draft({ startDate: '2027-01-05', endDate: '2027-04-10' })),
    ).toBeNull();
  });

  it('ignores collisions only on skipped dates', () => {
    const a = draft({ weekdays: [1], startDate: '2026-09-07', endDate: '2026-09-14' });
    const b = draft({ weekdays: [], startDate: '2026-09-14', endDate: '2026-09-14' });
    expect(conflictBetween(a, b)).not.toBeNull();
    expect(conflictBetween({ ...a, excludedDates: ['2026-09-14'] }, b)).toBeNull();
  });

  it('finds all pairs and candidate-vs-existing conflicts', () => {
    const events = [
      draft(),
      draft({ courseCode: 'X', startTime: '11:00', endTime: '12:00' }),
      draft({ courseCode: 'Y', startTime: '11:15', endTime: '12:30' }),
    ];
    expect(findConflicts(events)).toHaveLength(3);
    expect(findConflictsWith([events[1]!], [events[0]!, events[2]!])).toHaveLength(2);
  });
});

describe('overlappingOccurrences', () => {
  it('marks every occurrence in a clash, including ones covered by a long class', () => {
    const long = draft({ courseCode: 'L', startTime: '09:00', endTime: '13:00' });
    const a = draft({ courseCode: 'A', startTime: '10:15', endTime: '11:30' });
    const b = draft({ courseCode: 'B', startTime: '13:00', endTime: '14:00' }); // touches, no clash
    const c = draft({ courseCode: 'C', startTime: '12:00', endTime: '12:30' });
    const day = expandOccurrences([long, a, b, c], '2026-09-07', '2026-09-07', TZ);
    const marked = [...overlappingOccurrences(day)].map((o) => o.event.courseCode).sort();
    expect(marked).toEqual(['A', 'C', 'L']);
  });
});

describe('calculateNextClass', () => {
  const events = [draft()]; // Mon/Wed 10:15–11:30

  it('returns the class in progress', () => {
    const now = new Date('2026-09-07T14:30:00Z'); // Mon 10:30 EDT
    const next = calculateNextClass(events, now, TZ);
    expect(next?.inProgress).toBe(true);
    expect(next?.occurrence.date).toBe('2026-09-07');
  });

  it('skips to the next meeting after today’s class ended', () => {
    const now = new Date('2026-09-07T16:00:00Z'); // Mon 12:00 EDT
    const next = calculateNextClass(events, now, TZ);
    expect(next?.inProgress).toBe(false);
    expect(next?.occurrence.date).toBe('2026-09-09');
  });

  it('returns null when nothing is scheduled within the horizon', () => {
    expect(calculateNextClass(events, new Date('2027-01-10T12:00:00Z'), TZ)).toBeNull();
  });
});

describe('calculateFreePeriods', () => {
  it('finds gaps between classes, merging overlaps', () => {
    const day = [
      draft({ startTime: '08:45', endTime: '10:00' }),
      draft({ startTime: '09:30', endTime: '10:15' }),
      draft({ startTime: '10:30', endTime: '11:45' }),
      draft({ startTime: '14:00', endTime: '15:15' }),
    ];
    expect(calculateFreePeriods(day)).toEqual([{ start: '11:45', end: '14:00', minutes: 135 }]);
    expect(calculateFreePeriods(day, 15)).toEqual([
      { start: '10:15', end: '10:30', minutes: 15 },
      { start: '11:45', end: '14:00', minutes: 135 },
    ]);
  });
});

describe('validation', () => {
  it('accepts a valid class', () => {
    expect(hasErrors(validateClassDraft(draft()))).toBe(false);
  });

  it('reports field errors', () => {
    const errors = validateClassDraft(
      draft({
        courseCode: '',
        courseName: '',
        startTime: '11:00',
        endTime: '10:00',
        startDate: '2026-12-01',
        endDate: '2026-09-01',
      }),
    );
    expect(Object.keys(errors).sort()).toEqual(['courseCode', 'endDate', 'endTime']);
  });

  it('normalizes input', () => {
    const n = normalizeDraft(
      draft({ courseCode: ' comp  248 ', section: ' ', room: 'h-937', weekdays: [3, 1, 3] }),
    );
    expect(n.courseCode).toBe('COMP 248');
    expect(n.section).toBeNull();
    expect(n.weekdays).toEqual([1, 3]);
  });
});

describe('courseColor', () => {
  it('is stable per course and respects an explicit colour', () => {
    expect(courseColor({ courseCode: 'COMP 248', color: null })).toBe(
      courseColor({ courseCode: 'comp248', color: null }),
    );
    expect(courseColor({ courseCode: 'COMP 248', color: '#123456' })).toBe('#123456');
  });
});
