/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { LiveLevel } from '../../data/enums.ts';
import type { LiveReport } from '../../data/types.ts';
import { calculateReportConfidence } from './confidence.ts';

const now = new Date('2026-11-14T17:00:00Z');
const r = (level: LiveLevel, minutesAgo: number, contributor: number): LiveReport => ({
  level,
  createdAt: new Date(now.getTime() - minutesAgo * 60_000),
  contributor,
  mine: false,
});

test('no reports means no estimate', () => {
  assert.deepEqual(calculateReportConfidence([], now), {
    level: null,
    confidence: 'none',
    reports: 0,
    contributors: 0,
    newestMinutes: null,
  });
});

test('expired reports are ignored', () => {
  const e = calculateReportConfidence([r(3, 50, 1), r(3, 90, 2)], now);
  assert.equal(e.level, null);
});

test('a single fresh report gives a low-confidence estimate', () => {
  const e = calculateReportConfidence([r(2, 2, 1)], now);
  assert.equal(e.level, 2);
  assert.equal(e.confidence, 'low');
  assert.equal(e.newestMinutes, 2);
});

test('independent agreeing reports give high confidence', () => {
  const e = calculateReportConfidence([r(3, 1, 1), r(3, 4, 2), r(2, 6, 3)], now);
  assert.equal(e.level, 3);
  assert.equal(e.confidence, 'high');
  assert.equal(e.contributors, 3);
});

test('repeat submissions from one student count once (latest wins)', () => {
  const spam = [r(3, 1, 7), r(3, 2, 7), r(3, 3, 7), r(3, 4, 7), r(0, 2, 8)];
  const e = calculateReportConfidence(spam, now);
  assert.equal(e.contributors, 2);
  assert.equal(e.reports, 5);
  assert.notEqual(e.confidence, 'high'); // two people who disagree
});

test('newer reports outweigh older ones', () => {
  const e = calculateReportConfidence([r(0, 40, 1), r(3, 1, 2)], now);
  assert.equal(e.level, 3);
});
