import { describe, expect, it } from '@jest/globals';

import { parseIcs, parseLocation } from '../ics';
import { classesOn, findConflicts, freePeriods, upcoming } from '../logic';
import { classEventInputSchema, normalizeCourseCode, type ClassEvent } from '../model';
import { termFor, upcomingTerms } from '../terms';
import {
  addDays,
  formatDuration,
  formatTime,
  localMoment,
  parseTime,
  startOfWeek,
  weekdayOf,
} from '../time';

function cls(over: Partial<ClassEvent> = {}): ClassEvent {
  return {
    id: over.id ?? 'a',
    term_label: 'Fall 2026',
    course_code: 'COMP 352',
    course_title: 'Data Structures and Algorithms',
    component: 'LEC',
    section: 'AA',
    building_code: 'H',
    room: '920',
    days: [1, 3], // Mon, Wed
    start_time: '09:45:00',
    end_time: '11:00:00',
    start_date: '2026-09-01',
    end_date: '2026-12-07',
    timezone: 'America/Toronto',
    color: 'accent',
    source: 'manual',
    notes: null,
    ...over,
  };
}

describe('time', () => {
  it('computes ISO weekdays', () => {
    expect(weekdayOf('2026-11-16')).toBe(1); // Monday
    expect(weekdayOf('2026-11-15')).toBe(7); // Sunday
  });

  it('adds days across months and years', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(startOfWeek('2026-11-15')).toBe('2026-11-09');
  });

  it('converts instants to campus time across DST', () => {
    // 2026-07-01 13:00Z = 09:00 EDT (UTC-4); 2026-12-01 14:00Z = 09:00 EST (UTC-5)
    expect(localMoment(new Date('2026-07-01T13:00:00Z'))).toEqual({ date: '2026-07-01', minutes: 540, weekday: 3 });
    expect(localMoment(new Date('2026-12-01T14:00:00Z'))).toEqual({ date: '2026-12-01', minutes: 540, weekday: 2 });
    // Late evening UTC is still the previous campus day.
    expect(localMoment(new Date('2026-11-17T03:30:00Z')).date).toBe('2026-11-16');
  });

  it('parses and formats times', () => {
    expect(parseTime('9:45')).toBe(585);
    expect(parseTime('13:05:00')).toBe(785);
    expect(parseTime('24:00')).toBeNaN();
    expect(parseTime('nope')).toBeNaN();
    expect(formatTime(585)).toBe('9:45 AM');
    expect(formatTime(0)).toBe('12:00 AM');
    expect(formatTime(720)).toBe('12:00 PM');
    expect(formatDuration(20)).toBe('20 min');
    expect(formatDuration(135)).toBe('2 h 15 min');
  });
});

describe('logic', () => {
  const monday = '2026-11-16';

  it('lists classes on a date within the term only', () => {
    expect(classesOn([cls()], monday)).toHaveLength(1);
    expect(classesOn([cls()], '2026-11-17')).toHaveLength(0); // Tuesday
    expect(classesOn([cls()], '2026-12-14')).toHaveLength(0); // after end_date
  });

  it('finds the next class later today', () => {
    const { current, next } = upcoming([cls()], { date: monday, minutes: 9 * 60 + 25, weekday: 1 });
    expect(current).toBeNull();
    expect(next?.date).toBe(monday);
    expect(next?.minutesUntil).toBe(20);
  });

  it('reports the current class and the next one on a later day', () => {
    const { current, next } = upcoming([cls()], { date: monday, minutes: 10 * 60, weekday: 1 });
    expect(current?.event.id).toBe('a');
    expect(next?.date).toBe('2026-11-18'); // Wednesday
    expect(next?.minutesUntil).toBe(2 * 1440 - 15);
  });

  it('returns no next class after the term ends', () => {
    expect(upcoming([cls()], { date: '2026-12-08', minutes: 0, weekday: 2 }).next).toBeNull();
  });

  it('detects overlapping classes on shared days only', () => {
    const a = cls({ id: 'a' });
    const b = cls({ id: 'b', days: [3], start_time: '10:30:00', end_time: '11:45:00' });
    const c = cls({ id: 'c', days: [2], start_time: '10:00:00', end_time: '11:00:00' });
    const d = cls({ id: 'd', days: [1], start_time: '11:00:00', end_time: '12:00:00' }); // back-to-back
    expect(findConflicts([a, b, c, d]).map(([x, y]) => x.id + y.id)).toEqual(['ab']);
  });

  it('ignores conflicts in different terms', () => {
    const a = cls({ id: 'a' });
    const b = cls({ id: 'b', start_date: '2027-01-05', end_date: '2027-04-30' });
    expect(findConflicts([a, b])).toEqual([]);
  });

  it('computes free periods between classes', () => {
    const a = cls({ id: 'a' }); // 9:45–11:00
    const b = cls({ id: 'b', start_time: '13:00:00', end_time: '14:15:00' });
    expect(freePeriods([a, b], monday, { dayStart: 9 * 60, dayEnd: 17 * 60 })).toEqual([
      { start: 540, end: 585 }, // 9:00–9:45 before the first class
      { start: 660, end: 780 },
      { start: 855, end: 1020 },
    ]);
  });
});

describe('model', () => {
  it('normalizes course codes', () => {
    expect(normalizeCourseCode('comp352')).toBe('COMP 352');
    expect(normalizeCourseCode(' soen-287 ')).toBe('SOEN 287');
  });

  it('validates a class and reports field errors', () => {
    const base = { ...cls(), notes: null };
    expect(classEventInputSchema.safeParse(base).success).toBe(true);
    const bad = classEventInputSchema.safeParse({ ...base, end_time: '09:00', days: [] });
    expect(bad.success).toBe(false);
    const paths = bad.error!.issues.map((i) => i.path[0]);
    expect(paths).toContain('days');
  });
});

describe('terms', () => {
  it('maps dates to terms', () => {
    expect(termFor('2026-11-14').label).toBe('Fall 2026');
    expect(termFor('2027-02-01').label).toBe('Winter 2027');
    expect(upcomingTerms('2026-11-14').map((t) => t.label)).toEqual(['Fall 2026', 'Winter 2027', 'Summer 2027']);
  });
});

describe('ics', () => {
  const ics = [
    'BEGIN:VCALENDAR',
    'BEGIN:VEVENT',
    'UID:1',
    'SUMMARY:COMP 352 - Data Structures and Algorithms Lecture',
    'LOCATION:SGW H 920',
    'DTSTART;TZID=America/Toronto:20260908T094500',
    'DTEND;TZID=America/Toronto:20260908T110000',
    'RRULE:FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=20261208T045959Z',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'UID:2',
    'SUMMARY:SOEN287 Tut',
    'LOCATION:EV 3.309',
    'DTSTART:20260911T170000Z',
    'DTEND:20260911T184000Z',
    'RRULE:FREQ=WEEKLY;COUNT=13',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'UID:3',
    'SUMMARY:Study group',
    'DTSTART;VALUE=DATE:20261001',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  it('extracts weekly classes with campus-local times', () => {
    const [a, b, c] = parseIcs(ics, 'Fall 2026');
    expect(a).toMatchObject({
      course_code: 'COMP 352',
      course_title: 'Data Structures and Algorithms',
      component: 'LEC',
      building_code: 'H',
      room: '920',
      days: [2, 4],
      start_time: '09:45:00',
      end_time: '11:00:00',
      start_date: '2026-09-08',
      end_date: '2026-12-07',
      source: 'ics',
    });
    expect(a.warnings).toEqual([]);

    // 17:00Z in September = 13:00 EDT; COUNT=13 on one weekday → 13 weeks.
    expect(b).toMatchObject({
      course_code: 'SOEN 287',
      component: 'TUT',
      building_code: 'EV',
      room: '3.309',
      days: [5],
      start_time: '13:00:00',
      end_time: '14:40:00',
      end_date: '2026-12-10',
    });

    expect(c.course_code).toBe('');
    expect(c.warnings.length).toBeGreaterThan(0);
  });

  it('parses room locations', () => {
    expect(parseLocation('H-920')).toEqual({ building: 'H', room: '920' });
    expect(parseLocation('LOY CC 320')).toEqual({ building: 'CC', room: '320' });
  });
});
