/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  calculateFreePeriods,
  calculateNextClass,
  calculateScheduleConflicts,
  expandOccurrences,
  occurrencesOnDate,
} from './engine.ts';
import { atLocalTime, emptyClassInput, normalizeClassInput, validateClassInput, type ClassEvent } from './model.ts';

process.env.TZ = 'America/Toronto';

function cls(over: Partial<ClassEvent>): ClassEvent {
  return {
    ...emptyClassInput('2026-09-08'),
    id: over.courseCode ?? 'x',
    source: 'manual',
    courseCode: 'COMP 248',
    days: [1, 3],
    startTime: '08:45',
    endTime: '10:00',
    startDate: '2026-09-08',
    endDate: '2026-12-07',
    ...over,
  };
}

test('expandOccurrences respects weekdays and the date range', () => {
  const comp = cls({}); // Mon + Wed, starts Tue Sep 8
  const occ = expandOccurrences([comp], atLocalTime('2026-09-07', '00:00'), atLocalTime('2026-09-14', '00:00'));
  assert.deepEqual(
    occ.map((o) => o.date),
    ['2026-09-09'], // Mon Sep 7 is before startDate
  );
  assert.equal(occ[0].start.getHours(), 8);
  assert.equal(occ[0].start.getMinutes(), 45);
});

test('occurrences keep their wall-clock time across the DST change', () => {
  const comp = cls({ days: [1], startDate: '2026-10-26', endDate: '2026-11-09' });
  // Clocks fall back on Sun Nov 1 2026 in Montréal.
  const before = occurrencesOnDate([comp], '2026-10-26');
  const after = occurrencesOnDate([comp], '2026-11-02');
  assert.equal(before[0].start.getHours(), 8);
  assert.equal(after[0].start.getHours(), 8);
});

test('calculateNextClass finds the current and the next class', () => {
  const a = cls({ courseCode: 'COMP 248', days: [1], startTime: '08:45', endTime: '10:00' });
  const b = cls({ courseCode: 'SOEN 287', days: [1], startTime: '13:15', endTime: '14:30' });
  const now = atLocalTime('2026-09-14', '09:30'); // Monday
  const { current, next } = calculateNextClass([a, b], now);
  assert.equal(current?.event.courseCode, 'COMP 248');
  assert.equal(next?.event.courseCode, 'SOEN 287');

  const evening = calculateNextClass([a, b], atLocalTime('2026-09-14', '18:00'));
  assert.equal(evening.current, null);
  assert.equal(evening.next?.date, '2026-09-21');

  const afterTerm = calculateNextClass([a, b], atLocalTime('2027-01-10', '09:00'));
  assert.equal(afterTerm.next, null);
});

test('calculateScheduleConflicts flags overlaps on shared days only', () => {
  const a = cls({ courseCode: 'A', days: [1, 3], startTime: '08:45', endTime: '10:00' });
  const b = cls({ courseCode: 'B', days: [3, 5], startTime: '09:30', endTime: '11:00' });
  const c = cls({ courseCode: 'C', days: [1], startTime: '10:00', endTime: '11:00' }); // back-to-back, no conflict
  const d = cls({ courseCode: 'D', days: [1], startTime: '09:00', endTime: '09:30', startDate: '2027-01-11', endDate: '2027-04-12' });
  const conflicts = calculateScheduleConflicts([a, b, c, d]);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].a.courseCode, 'A');
  assert.equal(conflicts[0].b.courseCode, 'B');
  assert.deepEqual(conflicts[0].days, [3]);
});

test('calculateFreePeriods returns gaps between merged classes', () => {
  const day = '2026-09-14';
  const occ = occurrencesOnDate(
    [
      cls({ courseCode: 'A', days: [1], startTime: '08:45', endTime: '10:00' }),
      cls({ courseCode: 'B', days: [1], startTime: '09:30', endTime: '11:00' }),
      cls({ courseCode: 'C', days: [1], startTime: '11:10', endTime: '12:00' }),
      cls({ courseCode: 'D', days: [1], startTime: '14:00', endTime: '15:00' }),
    ],
    day,
  );
  const gaps = calculateFreePeriods(occ);
  assert.deepEqual(
    gaps.map((g) => g.minutes),
    [120], // 11:00–11:10 is too short, 12:00–14:00 counts
  );
});

test('validateClassInput mirrors the database rules', () => {
  const ok = normalizeClassInput({
    ...emptyClassInput('2026-09-08'),
    courseCode: ' comp  248 ',
    days: [3, 1, 3],
    startTime: '8:45',
    endTime: '10:00',
  });
  assert.equal(ok.courseCode, 'COMP 248');
  assert.deepEqual(ok.days, [1, 3]);
  assert.equal(ok.startTime, '08:45');
  assert.deepEqual(validateClassInput(ok), {});

  const bad = validateClassInput({
    ...ok,
    courseCode: '',
    days: [],
    startTime: '10:00',
    endTime: '09:00',
    endDate: '2026-09-01',
  });
  assert.deepEqual(Object.keys(bad).sort(), ['courseCode', 'days', 'endDate', 'endTime']);
  assert.ok(validateClassInput({ ...ok, startDate: '2026-02-30' }).startDate);
});
