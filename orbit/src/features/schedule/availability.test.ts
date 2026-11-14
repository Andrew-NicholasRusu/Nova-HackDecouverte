/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { RecurringSlot } from '../../data/types.ts';
import { busyStatusAt, calculateSharedAvailability } from './availability.ts';
import { atLocalTime } from './model.ts';

process.env.TZ = 'America/Toronto';

const slot = (startTime: string, endTime: string, days: RecurringSlot['days'] = [1]): RecurringSlot => ({
  days,
  startTime,
  endTime,
  startDate: '2026-09-07',
  endDate: '2026-12-07',
});

const hm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const MONDAY = '2026-09-14';

test('shared availability is the complement of everyone being busy', () => {
  const me = [slot('08:45', '10:00'), slot('13:15', '14:30')];
  const friend = [slot('10:15', '11:30'), slot('16:00', '17:15')];
  const windows = calculateSharedAvailability([me, friend], MONDAY, { dayStart: '08:00', dayEnd: '18:00' });
  assert.deepEqual(
    windows.map((w) => `${hm(w.start)}-${hm(w.end)}`),
    // 08:00–08:45 is 45 min ✓, 10:00–10:15 too short, 11:30–13:15 ✓, 14:30–16:00 ✓, 17:15–18:00 ✓
    ['08:00-08:45', '11:30-13:15', '14:30-16:00', '17:15-18:00'],
  );
});

test('notBefore trims the past and other days are untouched', () => {
  const me = [slot('08:45', '10:00')];
  const windows = calculateSharedAvailability([me], MONDAY, {
    dayEnd: '12:00',
    notBefore: atLocalTime(MONDAY, '09:30'),
  });
  assert.deepEqual(windows.map((w) => `${hm(w.start)}-${hm(w.end)}`), ['10:00-12:00']);

  const tuesday = calculateSharedAvailability([me], '2026-09-15', { dayStart: '09:00', dayEnd: '10:00' });
  assert.equal(tuesday[0].minutes, 60);
});

test('busyStatusAt chains back-to-back classes', () => {
  const s = [slot('08:45', '10:00'), slot('10:00', '11:15'), slot('14:00', '15:00')];
  const inClass = busyStatusAt(s, atLocalTime(MONDAY, '09:00'));
  assert.equal(inClass.state, 'in-class');
  assert.equal(hm(inClass.until!), '11:15');

  const free = busyStatusAt(s, atLocalTime(MONDAY, '12:00'));
  assert.deepEqual([free.state, free.until && hm(free.until)], ['free', '14:00']);

  const evening = busyStatusAt(s, atLocalTime(MONDAY, '18:00'));
  assert.deepEqual(evening, { state: 'free', until: null });
});
