import { describe, expect, it } from '@jest/globals';

import {
  addDays,
  dateRange,
  formatDuration,
  instantToZoned,
  isoWeekday,
  isValidDate,
  isValidTime,
  startOfWeek,
  todayIn,
  zonedToInstant,
} from '../time';
import { TZ } from '../test-fixtures';

describe('calendar dates', () => {
  it('validates dates and times strictly', () => {
    expect(isValidDate('2026-02-29')).toBe(false);
    expect(isValidDate('2028-02-29')).toBe(true);
    expect(isValidDate('2026-9-1')).toBe(false);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('9:00')).toBe(false);
  });

  it('does date arithmetic across month/year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(dateRange('2026-10-30', '2026-11-02')).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ]);
  });

  it('uses ISO weekdays (Monday = 1)', () => {
    expect(isoWeekday('2026-11-16')).toBe(1); // Monday
    expect(isoWeekday('2026-11-15')).toBe(7); // Sunday
    expect(startOfWeek('2026-11-15')).toBe('2026-11-09');
  });
});

describe('time zones (America/Toronto)', () => {
  it('maps winter and summer wall times to the right UTC instants', () => {
    expect(zonedToInstant('2026-01-15', '10:00', TZ).toISOString()).toBe('2026-01-15T15:00:00.000Z');
    expect(zonedToInstant('2026-07-15', '10:00', TZ).toISOString()).toBe('2026-07-15T14:00:00.000Z');
  });

  it('keeps a recurring class at the same wall time across the DST change', () => {
    // DST ends 2026-11-01 at 02:00 local.
    const before = zonedToInstant('2026-10-29', '10:15', TZ);
    const after = zonedToInstant('2026-11-05', '10:15', TZ);
    expect(instantToZoned(before, TZ).time).toBe('10:15');
    expect(instantToZoned(after, TZ).time).toBe('10:15');
    expect(after.getTime() - before.getTime()).toBe((7 * 24 + 1) * 3600_000);
  });

  it('resolves the spring-forward gap forward and fall-back overlap to the first instant', () => {
    // 2026-03-08 02:30 does not exist in Toronto.
    expect(instantToZoned(zonedToInstant('2026-03-08', '02:30', TZ), TZ).time).toBe('03:30');
    // 2026-11-01 01:30 happens twice; pick the EDT (UTC-4) one.
    expect(zonedToInstant('2026-11-01', '01:30', TZ).toISOString()).toBe('2026-11-01T05:30:00.000Z');
  });

  it("computes today's date in the campus zone, not UTC", () => {
    // 02:00 UTC on the 15th is still the evening of the 14th in Montréal.
    expect(todayIn(TZ, new Date('2026-11-15T02:00:00Z'))).toBe('2026-11-14');
  });
});

describe('formatDuration', () => {
  it.each([
    [0, 'now'],
    [59_000, '1m'],
    [65 * 60_000, '1h 05m'],
    [26 * 3600_000, '1d 2h'],
  ])('%d ms → %s', (ms, label) => {
    expect(formatDuration(ms)).toBe(label);
  });
});
