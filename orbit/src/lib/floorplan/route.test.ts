import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildGraph, planRoute } from './route.ts';

const node = (id: string, floor: number, x: number, y: number, type = 'hallway_waypoint', label = '') => ({ id, data: { type, floor, x, y, label } });
const link = (fromId: string, toId: string, type = 'hallway') => ({ fromId, toId, data: { type, weight: 0, accessible: true } });

// Floor 1: entrance -> h1 -> h2 (turn right) -> room A ; elevator and stair connect h2 to floor 2 -> room B
const nodes = [
  node('entry', 1, 0, 0, 'building_entry_exit'),
  node('h1', 1, 100, 0),
  node('h2', 1, 200, 0),
  node('h3', 1, 200, 100),
  node('roomA', 1, 200, 160, 'room', 'MB-1.100'),
  node('e1', 1, 200, 50, 'elevator_door'),
  node('s1', 1, 100, 100, 'stair_landing'),
  node('e2', 2, 200, 50, 'elevator_door'),
  node('s2', 2, 100, 100, 'stair_landing'),
  node('g2', 2, 200, 100),
  node('roomB', 2, 260, 100, 'room', 'MB-2.200'),
];
const links = [
  link('entry', 'h1'), link('h1', 'h2'), link('h2', 'h3'), link('h3', 'roomA', 'room_to_door'),
  link('h2', 'e1'), link('e1', 'e2', 'elevator'), link('e2', 'g2'), link('g2', 'roomB', 'room_to_door'),
  link('h1', 's1'), link('s1', 's2', 'stair'), link('s2', 'g2'),
];
const graph = buildGraph(nodes, links);

test('same-floor route has start, a right turn and arrival', () => {
  const r = planRoute(graph, 'entry', 'roomA')!;
  assert.deepEqual(r.nodeIds, ['entry', 'h1', 'h2', 'h3', 'roomA']);
  assert.equal(r.steps[0].kind, 'start');
  assert.ok(r.steps.some((s) => s.kind === 'turn-right'));
  assert.equal(r.steps[r.steps.length - 1].text, 'Arrive at MB-1.100');
  assert.deepEqual(r.floors, [1]);
});

test('cross-floor route uses the elevator or stairs and lists both floors', () => {
  const r = planRoute(graph, 'entry', 'roomB')!;
  assert.deepEqual(r.floors, [1, 2]);
  assert.ok(r.steps.some((s) => s.kind === 'elevator' || s.kind === 'stairs'));
  assert.equal(r.segments.length, 2);
});

test('step-free mode never takes the stairs', () => {
  const r = planRoute(graph, 'entry', 'roomB', true)!;
  assert.ok(r.nodeIds.includes('e1'));
  assert.ok(!r.nodeIds.includes('s1'));
});

test('unknown nodes give no route', () => {
  assert.equal(planRoute(graph, 'entry', 'nope'), null);
});
