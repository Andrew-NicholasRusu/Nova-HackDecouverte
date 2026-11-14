/**
 * Indoor routing on a navmesh: shortest path (Dijkstra) plus plain-language steps with
 * landmarks. Pure, so it is unit-tested without the app.
 */

export type GraphNode = { id: string; x: number; y: number; floor: number; type: string; label: string };
export type GraphLink = { fromId: string; toId: string; type: string; weight: number; accessible: boolean };

export type Graph = {
  nodes: Map<string, GraphNode>;
  /** Undirected adjacency: the navmesh lists most corridors in one direction only. */
  adj: Map<string, { to: string; link: GraphLink }[]>;
};

export type RouteStep = {
  kind: 'start' | 'walk' | 'turn-left' | 'turn-right' | 'elevator' | 'stairs' | 'arrive';
  text: string;
  floor: number;
  /** Where to look on the plan for this step. */
  x: number;
  y: number;
};

export type RouteSegment = { floor: number; points: { x: number; y: number }[] };

export type Route = {
  nodeIds: string[];
  /** Path length in plan units (1024 per floor drawing). */
  length: number;
  segments: RouteSegment[];
  steps: RouteStep[];
  floors: number[];
};

const VERTICAL_COST: Record<string, number> = { elevator: 25, stair: 35 };

export function buildGraph(
  nodes: { id: string; data: { type: string; floor: number; x: number; y: number; label?: string } }[],
  links: { fromId: string; toId: string; data: { type: string; weight?: number; accessible?: boolean } }[],
): Graph {
  const map = new Map<string, GraphNode>();
  for (const n of nodes) map.set(n.id, { id: n.id, x: n.data.x, y: n.data.y, floor: n.data.floor, type: n.data.type, label: n.data.label ?? '' });
  const adj = new Map<string, { to: string; link: GraphLink }[]>();
  const add = (a: string, b: string, link: GraphLink) => adj.set(a, [...(adj.get(a) ?? []), { to: b, link }]);
  for (const l of links) {
    const a = map.get(l.fromId);
    const b = map.get(l.toId);
    if (!a || !b) continue;
    const euclid = Math.hypot(a.x - b.x, a.y - b.y);
    const link: GraphLink = {
      fromId: l.fromId,
      toId: l.toId,
      type: l.data.type,
      weight: (l.data.weight && l.data.weight > 0 ? l.data.weight : euclid) + (VERTICAL_COST[l.data.type] ?? 0),
      accessible: l.data.accessible !== false,
    };
    add(l.fromId, l.toId, link);
    add(l.toId, l.fromId, link);
  }
  return { nodes: map, adj };
}

export function findPath(graph: Graph, from: string, to: string, accessibleOnly = false): { ids: string[]; length: number } | null {
  if (!graph.nodes.has(from) || !graph.nodes.has(to)) return null;
  const dist = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, string>();
  const open = new Set<string>([from]);
  while (open.size) {
    let cur = '';
    let best = Infinity;
    for (const id of open) {
      const d = dist.get(id)!;
      if (d < best) {
        best = d;
        cur = id;
      }
    }
    open.delete(cur);
    if (cur === to) break;
    for (const { to: next, link } of graph.adj.get(cur) ?? []) {
      if (accessibleOnly && (!link.accessible || link.type === 'stair')) continue;
      const nd = best + link.weight;
      if (nd < (dist.get(next) ?? Infinity)) {
        dist.set(next, nd);
        prev.set(next, cur);
        open.add(next);
      }
    }
  }
  if (!dist.has(to)) return null;
  const ids = [to];
  while (ids[0] !== from) ids.unshift(prev.get(ids[0])!);
  return { ids, length: dist.get(to)! };
}

const TURN_MIN_DEGREES = 40;

/** Nearest named room to a point on a floor, to say "near MB-1.134". */
function landmark(graph: Graph, floor: number, x: number, y: number, skip: Set<string>) {
  let best: GraphNode | null = null;
  let bestD = 70;
  for (const n of graph.nodes.values()) {
    if (n.type !== 'room' || n.floor !== floor || skip.has(n.label)) continue;
    const d = Math.hypot(n.x - x, n.y - y);
    if (d < bestD) {
      best = n;
      bestD = d;
    }
  }
  return best?.label ?? null;
}

const pretty = (n: GraphNode) => (n.type === 'building_entry_exit' ? 'the main entrance' : n.label || n.id);

export function describeRoute(graph: Graph, ids: string[]): Pick<Route, 'segments' | 'steps' | 'floors'> {
  const path = ids.map((id) => graph.nodes.get(id)!);
  const first = path[0];
  const last = path[path.length - 1];

  const segments: RouteSegment[] = [];
  for (const n of path) {
    const seg = segments[segments.length - 1];
    if (seg && seg.floor === n.floor) seg.points.push({ x: n.x, y: n.y });
    else segments.push({ floor: n.floor, points: [{ x: n.x, y: n.y }] });
  }

  const steps: RouteStep[] = [{ kind: 'start', text: `Start at ${pretty(first)}`, floor: first.floor, x: first.x, y: first.y }];
  const skip = new Set([first.label, last.label]);

  for (let i = 1; i < path.length - 1; i++) {
    const a = path[i - 1];
    const b = path[i];
    const c = path[i + 1];
    if (b.floor !== a.floor) continue;
    if (c.floor !== b.floor) {
      const via = graph.adj.get(b.id)?.find((e) => e.to === c.id)?.link.type;
      steps.push({
        kind: via === 'stair' ? 'stairs' : 'elevator',
        text: `Take the ${via === 'stair' ? 'stairs' : 'elevator'} ${c.floor > b.floor ? 'up' : 'down'} to floor ${c.floor}`,
        floor: b.floor,
        x: b.x,
        y: b.y,
      });
      continue;
    }
    if (b.type !== 'hallway_waypoint') continue;
    const h1 = Math.atan2(b.y - a.y, b.x - a.x);
    const h2 = Math.atan2(c.y - b.y, c.x - b.x);
    let diff = ((h2 - h1) * 180) / Math.PI;
    diff = ((diff + 540) % 360) - 180;
    if (Math.abs(diff) < TURN_MIN_DEGREES || Math.hypot(b.x - a.x, b.y - a.y) < 8) continue;
    const near = landmark(graph, b.floor, b.x, b.y, skip);
    // Plan coordinates have y pointing down, so a positive angle change is a right turn.
    steps.push({ kind: diff > 0 ? 'turn-right' : 'turn-left', text: `Turn ${diff > 0 ? 'right' : 'left'}${near ? ` near ${near}` : ''}`, floor: b.floor, x: b.x, y: b.y });
  }

  const arrive = pretty(last);
  steps.push({ kind: 'arrive', text: `Arrive at ${arrive}`, floor: last.floor, x: last.x, y: last.y });

  // Collapse back-to-back identical instructions (zig-zag corridors).
  const compact = steps.filter((s, i) => i === 0 || !(s.kind === steps[i - 1].kind && s.text === steps[i - 1].text));
  return { segments, steps: compact, floors: [...new Set(path.map((n) => n.floor))] };
}

export function planRoute(graph: Graph, from: string, to: string, accessibleOnly = false): Route | null {
  const found = findPath(graph, from, to, accessibleOnly);
  if (!found) return null;
  return { nodeIds: found.ids, length: found.length, ...describeRoute(graph, found.ids) };
}
