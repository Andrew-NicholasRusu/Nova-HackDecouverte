/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseIcs } from './ics.ts';

const cal = (...events: string[]) =>
  ['BEGIN:VCALENDAR', 'VERSION:2.0', ...events.flatMap((e) => ['BEGIN:VEVENT', e.trim(), 'END:VEVENT']), 'END:VCALENDAR'].join('\r\n');

test('weekly RRULE with BYDAY and UNTIL becomes one class', () => {
  const { drafts, skipped } = parseIcs(
    cal(`
SUMMARY:COMP 248 - Object-Oriented Programming I (LEC)
LOCATION:H 820
DTSTART;TZID=America/Toronto:20260909T084500
DTEND;TZID=America/Toronto:20260909T100000
RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261207T235959Z`),
  );
  assert.equal(skipped, 0);
  assert.equal(drafts.length, 1);
  const d = drafts[0];
  assert.equal(d.courseCode, 'COMP 248');
  assert.equal(d.title, 'Object-Oriented Programming I');
  assert.equal(d.kind, 'lecture');
  assert.equal(d.buildingCode, 'H');
  assert.equal(d.room, '820');
  assert.deepEqual(d.days, [1, 3]);
  assert.equal(d.startTime, '08:45');
  assert.equal(d.endTime, '10:00');
  assert.equal(d.startDate, '2026-09-09');
  assert.equal(d.endDate, '2026-12-07');
  assert.deepEqual(d.warnings, []);
});

test('UTC times are converted to Montréal wall time, including after DST', () => {
  const { drafts } = parseIcs(
    cal(`
SUMMARY:SOEN 287 Tutorial
LOCATION:EV 7.720
DTSTART:20261104T181500Z
DTEND:20261104T192500Z`),
  );
  const d = drafts[0];
  assert.equal(d.startTime, '13:15'); // EST = UTC-5 in November
  assert.equal(d.endTime, '14:25');
  assert.equal(d.kind, 'tutorial');
  assert.equal(d.buildingCode, 'EV');
  assert.equal(d.room, '7.720');
  assert.deepEqual(d.days, [3]);
  assert.equal(d.startDate, d.endDate);
});

test('separately listed occurrences are merged into one weekly class', () => {
  const occ = (date: string) => `
SUMMARY:ENGR 213 Lab
LOCATION:H-1010
DTSTART:${date}T140000
DTEND:${date}T165000`;
  const { drafts } = parseIcs(cal(occ('20260910'), occ('20260917'), occ('20260924'), occ('20260911')));
  assert.equal(drafts.length, 1);
  assert.deepEqual(drafts[0].days, [4, 5]);
  assert.equal(drafts[0].startDate, '2026-09-10');
  assert.equal(drafts[0].endDate, '2026-09-24');
  assert.equal(drafts[0].kind, 'lab');
  assert.equal(drafts[0].room, '1010');
});

test('COUNT, folded lines, escaped text and skipped events', () => {
  const { drafts, skipped } = parseIcs(
    cal(
      `
SUMMARY:MATH 205\\, Differential & Integral Calculus II
LOCATION:MB S2.330
DTSTART:20260908T101500
DTEND:20260908T113000
RRULE:FREQ=WEEKLY;BYDAY=TU,TH;COUNT=4
DESCRIPTION:Section AA - a very long description that wraps onto the next li
 ne when exported`,
      `
SUMMARY:Reading week
DTSTART;VALUE=DATE:20261012
DTEND;VALUE=DATE:20261017`,
      `
SUMMARY:COMP 248
STATUS:CANCELLED
DTSTART:20260908T084500
DTEND:20260908T100000`,
    ),
  );
  assert.equal(skipped, 2);
  assert.equal(drafts.length, 1);
  const d = drafts[0];
  assert.equal(d.courseCode, 'MATH 205');
  assert.equal(d.title, 'Differential & Integral Calculus II');
  assert.equal(d.section, 'AA');
  assert.equal(d.buildingCode, 'MB');
  assert.equal(d.room, 'S2.330');
  assert.equal(d.endDate, '2026-09-17'); // Tue 8, Thu 10, Tue 15, Thu 17
});

test('missing information becomes a warning, not a silent guess', () => {
  const { drafts } = parseIcs(
    cal(`
SUMMARY:Study group
DTSTART:20260908T120000
DTEND:20260908T130000
RRULE:FREQ=WEEKLY`),
  );
  assert.equal(drafts[0].warnings.length, 2); // no course code, no end date
});

test('rejects files that are not calendars', () => {
  assert.throws(() => parseIcs('hello'), /calendar/);
});
