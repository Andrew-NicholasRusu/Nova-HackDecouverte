import { describe, expect, it } from '@jest/globals';

import { parseIcs, parseLocation, parseSummary } from '../ics';
import { TZ } from '../test-fixtures';

const opts = { timeZone: TZ, defaultEndDate: '2026-12-07' };

function cal(...events: string[]): string {
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', ...events, 'END:VCALENDAR'].join('\r\n');
}

describe('parseSummary / parseLocation', () => {
  it('extracts Concordia-style course info', () => {
    expect(parseSummary('COMP 248 LEC AA - Object-Oriented Programming I')).toEqual({
      courseCode: 'COMP 248',
      courseName: 'Object-Oriented Programming I',
      section: 'AA',
      kind: 'lecture',
    });
    expect(parseSummary('SOEN287 Tutorial AAAB')).toMatchObject({
      courseCode: 'SOEN 287',
      kind: 'tutorial',
      section: 'AAAB',
    });
    expect(parseSummary('Study group')).toMatchObject({ courseCode: '', courseName: 'Study group' });
  });

  it('splits building and room', () => {
    expect(parseLocation('H 937')).toEqual({ buildingCode: 'H', room: '937' });
    expect(parseLocation('MB S2.330')).toEqual({ buildingCode: 'MB', room: 'S2.330' });
    expect(parseLocation('FG-B055')).toEqual({ buildingCode: 'FG', room: 'B055' });
    expect(parseLocation('Online')).toEqual({ buildingCode: null, room: 'Online' });
  });
});

describe('parseIcs', () => {
  it('imports a weekly RRULE with TZID, UNTIL and EXDATE', () => {
    const { drafts, warnings } = parseIcs(
      cal(
        'BEGIN:VEVENT',
        'UID:comp248',
        'SUMMARY:COMP 248 LEC AA',
        'LOCATION:H 937',
        'DTSTART;TZID=America/Toronto:20260909T101500',
        'DTEND;TZID=America/Toronto:20260909T113000',
        'RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261207T235959Z',
        'EXDATE;TZID=America/Toronto:20261012T101500',
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'DESCRIPTION:Should not leak into the class',
        'END:VALARM',
        'END:VEVENT',
      ),
      opts,
    );
    expect(warnings).toEqual([]);
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({
      courseCode: 'COMP 248',
      section: 'AA',
      buildingCode: 'H',
      room: '937',
      weekdays: [1, 3],
      startTime: '10:15',
      endTime: '11:30',
      startDate: '2026-09-09',
      endDate: '2026-12-07',
      excludedDates: ['2026-10-12'],
      notes: null,
      source: 'ics',
    });
  });

  it('converts UTC times to campus time on both sides of DST', () => {
    const { drafts } = parseIcs(
      cal(
        'BEGIN:VEVENT',
        'SUMMARY:MATH 205',
        'DTSTART:20261102T140000Z', // EST → 09:00
        'DTEND:20261102T151500Z',
        'END:VEVENT',
      ),
      opts,
    );
    expect(drafts[0]).toMatchObject({ startTime: '09:00', endTime: '10:15', weekdays: [] });
  });

  it('handles COUNT, DURATION, line folding and escaped text', () => {
    const { drafts } = parseIcs(
      cal(
        'BEGIN:VEVENT',
        'SUMMARY:ENGR 201 LAB 2\\, Professional Practice',
        'LOCATION:Hall Building\\, room 1',
        ' 001 (temporary)',
        'DTSTART:20260908T130000',
        'DURATION:PT1H45M',
        'RRULE:FREQ=WEEKLY;COUNT=3',
        'END:VEVENT',
      ),
      opts,
    );
    expect(drafts[0]).toMatchObject({
      courseCode: 'ENGR 201',
      kind: 'lab',
      section: '2',
      startTime: '13:00',
      endTime: '14:45',
      weekdays: [2],
      endDate: '2026-09-22',
      buildingCode: null,
      room: null,
      notes: 'Location: Hall Building, room 1001 (temporary)',
    });
  });

  it('expands INTERVAL=2 into skipped weeks', () => {
    const { drafts } = parseIcs(
      cal(
        'BEGIN:VEVENT',
        'SUMMARY:COMP 249 TUT',
        'DTSTART:20260910T160000',
        'DTEND:20260910T170000',
        'RRULE:FREQ=WEEKLY;INTERVAL=2;UNTIL=20261008',
        'END:VEVENT',
      ),
      opts,
    );
    expect(drafts[0]).toMatchObject({
      startDate: '2026-09-10',
      endDate: '2026-10-08',
      excludedDates: ['2026-09-17', '2026-10-01'],
    });
  });

  it('merges per-meeting exports into a weekly series with the missing week skipped', () => {
    const meeting = (date: string) => [
      'BEGIN:VEVENT',
      'SUMMARY:SOEN 287 LEC S',
      'LOCATION:MB S2.330',
      `DTSTART;TZID=America/Toronto:${date}T174500`,
      `DTEND;TZID=America/Toronto:${date}T201500`,
      'END:VEVENT',
    ];
    const { drafts } = parseIcs(
      cal(...meeting('20260915'), ...meeting('20260922'), ...meeting('20261006')),
      opts,
    );
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({
      weekdays: [2],
      startDate: '2026-09-15',
      endDate: '2026-10-06',
      excludedDates: ['2026-09-29'],
    });
  });

  it('applies RECURRENCE-ID overrides and cancellations', () => {
    const { drafts } = parseIcs(
      cal(
        'BEGIN:VEVENT',
        'UID:x1',
        'SUMMARY:COMP 248 LEC AA',
        'DTSTART:20260907T101500',
        'DTEND:20260907T113000',
        'RRULE:FREQ=WEEKLY;BYDAY=MO;UNTIL=20260928',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:x1',
        'RECURRENCE-ID:20260914T101500',
        'SUMMARY:COMP 248 LEC AA',
        'DTSTART:20260915T101500',
        'DTEND:20260915T113000',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:x1',
        'RECURRENCE-ID:20260921T101500',
        'STATUS:CANCELLED',
        'DTSTART:20260921T101500',
        'END:VEVENT',
      ),
      opts,
    );
    const series = drafts.find((d) => d.weekdays.length > 0);
    const moved = drafts.find((d) => d.weekdays.length === 0);
    expect(series?.excludedDates).toEqual(['2026-09-14', '2026-09-21']);
    expect(moved?.startDate).toBe('2026-09-15');
  });

  it('warns about skipped and guessed data', () => {
    const { drafts, warnings } = parseIcs(
      cal(
        'BEGIN:VEVENT',
        'SUMMARY:Reading week',
        'DTSTART;VALUE=DATE:20261012',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'SUMMARY:PHYS 204',
        'DTSTART;TZID=Mars/Olympus:20260908T090000',
        'DTEND;TZID=Mars/Olympus:20260908T100000',
        'RRULE:FREQ=WEEKLY',
        'END:VEVENT',
      ),
      opts,
    );
    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.endDate).toBe('2026-12-07');
    expect(warnings.join('\n')).toMatch(/all-day/);
    expect(warnings.join('\n')).toMatch(/no end date/);
    expect(warnings.join('\n')).toMatch(/Unknown time zone "Mars\/Olympus"/);
  });

  it('rejects non-calendar files', () => {
    expect(parseIcs('hello', opts)).toEqual({
      drafts: [],
      warnings: ['This file is not an iCalendar (.ics) file.'],
    });
  });
});
