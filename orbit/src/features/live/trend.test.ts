import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { LiveReport } from '../../data/types.ts';
import { trendFor } from './trend.ts';

const now = new Date('2026-03-04T12:00:00');
const r = (minAgo: number, level: 0 | 1 | 2 | 3, contributor = 1): LiveReport => ({
  level, contributor, mine: false, createdAt: new Date(now.getTime() - minAgo * 60_000),
});

test('needs both recent and older reports', () => {
  assert.equal(trendFor([r(2, 3)], now), null);
});
test('detects a line getting longer', () => {
  assert.equal(trendFor([r(2, 3, 1), r(30, 1, 2)], now), 'busier');
});
test('detects a line getting shorter', () => {
  assert.equal(trendFor([r(2, 0, 1), r(30, 3, 2)], now), 'quieter');
});
test('steady when similar', () => {
  assert.equal(trendFor([r(2, 2, 1), r(30, 2, 2)], now), 'steady');
});
