import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseScheduleText } from './parse-text.ts';

const today = new Date('2026-09-10T09:00:00');

test('reads a Student Hub style list', () => {
  const text = `Fall 2026
COMP 352 Data Structures and Algorithms
Lecture  Section AA
Mon Wed  10:15 - 11:30  H 820
SOEN 287 Web Programming
Tuesday Thursday 2:45 PM - 4:00 PM
Room MB 2.130`;
  const { drafts } = parseScheduleText(text, today);
  assert.equal(drafts.length, 2);
  const [a, b] = drafts;
  assert.equal(a.courseCode, 'COMP 352');
  assert.equal(a.title, 'Data Structures and Algorithms');
  assert.deepEqual(a.days, [1, 3]);
  assert.equal(a.startTime, '10:15');
  assert.equal(a.endTime, '11:30');
  assert.equal(a.buildingCode, 'H');
  assert.equal(a.room, '820');
  assert.equal(a.section, 'AA');
  assert.equal(b.courseCode, 'SOEN 287');
  assert.deepEqual(b.days, [2, 4]);
  assert.equal(b.startTime, '14:45');
  assert.equal(b.endTime, '16:00');
  assert.equal(b.buildingCode, 'MB');
  assert.equal(b.room, '2.130');
  assert.equal(a.startDate, '2026-09-02');
});

test('compact day codes and 24h times', () => {
  const { drafts } = parseScheduleText('MATH 203 Linear Algebra TuTh 13:15-14:30 FG B030', today);
  assert.equal(drafts.length, 1);
  assert.deepEqual(drafts[0].days, [2, 4]);
  assert.equal(drafts[0].startTime, '13:15');
  assert.equal(drafts[0].buildingCode, 'FG');
});

test('uses dates from the file when present', () => {
  const { drafts } = parseScheduleText('ENGR 233 Calculus Mon 08:45-10:00\n2026-09-08 to 2026-12-09', today);
  assert.equal(drafts[0].startDate, '2026-09-08');
  assert.equal(drafts[0].endDate, '2026-12-09');
  assert.ok(!drafts[0].warnings.some((w) => /Term dates/.test(w)));
});

test('flags a course with no time instead of dropping it', () => {
  const { drafts } = parseScheduleText('PHYS 204 Mechanics', today);
  assert.equal(drafts.length, 1);
  assert.ok(drafts[0].warnings.some((w) => /No meeting time/.test(w)));
});

test('no course codes: nothing', () => {
  assert.deepEqual(parseScheduleText('hello world', today).drafts, []);
});
