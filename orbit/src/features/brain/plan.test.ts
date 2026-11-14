import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { ClassEvent, Place } from '../../data/types.ts';
import { buildPlan } from './plan.ts';

const cls = (over: Partial<ClassEvent>): ClassEvent => ({
  id: '1', source: 'manual', courseCode: 'COMP 352', title: '', section: '', kind: 'lecture',
  buildingCode: 'H', room: '820', days: [1, 2, 3, 4, 5, 6, 7], startTime: '14:00', endTime: '15:15',
  startDate: '2026-01-01', endDate: '2027-01-01', color: null, ...over,
});
const buildings = new Map<string, Place>([
  ['H', { code: 'H', campus: 'SGW', name: 'Hall', latitude: 45.4973, longitude: -73.5788 }],
  ['MB', { code: 'MB', campus: 'SGW', name: 'Molson', latitude: 45.4953, longitude: -73.5791 }],
]);
const base = { friends: [], locations: [], buildings, campus: 'SGW' as const };

test('no classes: empty state', () => {
  const p = buildPlan({ ...base, events: [], now: new Date('2026-03-04T10:00:00') });
  assert.equal(p.state, 'empty');
});

test('free before a class: headline, walk and leave-by', () => {
  const p = buildPlan({ ...base, events: [cls({}), cls({ id: '2', courseCode: 'MATH 203', buildingCode: 'MB', room: '2.130', startTime: '16:00', endTime: '17:00' })], now: new Date('2026-03-04T15:30:00') });
  assert.equal(p.state, 'free');
  assert.match(p.headline, /30 min free before MATH 203/);
  assert.ok(p.walkToNext !== null && p.leaveBy !== null);
  assert.equal(p.suggestions[0].kind, 'leave');
  assert.equal(p.suggestions[0].target.params?.building, 'MB');
});

test('in class: reports when it ends', () => {
  const p = buildPlan({ ...base, events: [cls({})], now: new Date('2026-03-04T14:30:00') });
  assert.equal(p.state, 'in-class');
  assert.match(p.headline, /until 15:15/);
});

test('done for today when nothing is left', () => {
  const p = buildPlan({ ...base, events: [cls({})], now: new Date('2026-03-04T20:00:00') });
  assert.equal(p.state, 'done');
  assert.match(p.sub, /Next up: COMP 352/);
});
