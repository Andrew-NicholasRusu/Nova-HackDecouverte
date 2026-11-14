import navmesh from '@/assets/floor_plan/navmesh/mb.json';

export type Room = {
  /** Room code as used in the floor SVG labels, e.g. "1.130". */
  code: string;
  /** Display/search label, e.g. "MB-1.130". */
  label: string;
  floor: string;
  nodeId: string;
  x: number;
  y: number;
};

export type Edge = { x1: number; y1: number; x2: number; y2: number };

const nodes = new Map(navmesh.nodes.map((n) => [n.id, n.data]));

const allRooms: Room[] = Object.entries(navmesh.roomIndex).flatMap(([label, nodeId]) => {
  const node = nodes.get(nodeId);
  if (!node) return [];
  const code = label.replace(/^MB-/, '');
  return [{ code, label, floor: String(node.floor), nodeId, x: node.x, y: node.y }];
});

/** Numeric-aware sort so 1.106 comes before 1.1000-style codes and 1.99 before 1.100. */
const byCode = (a: Room, b: Room) => a.code.localeCompare(b.code, undefined, { numeric: true });

export function getRooms(floorId: string): Room[] {
  return allRooms.filter((r) => r.floor === floorId).sort(byCode);
}

/** Rooms on every floor except `floorId`, ordered by floor then code. */
export function getOtherRooms(floorId: string): Room[] {
  return allRooms
    .filter((r) => r.floor !== floorId)
    .sort((a, b) => a.floor.localeCompare(b.floor, undefined, { numeric: true }) || byCode(a, b));
}

/** Navmesh edges leaving a room: room→door links, then door→hallway links. */
export function getRoomEdges(room: Room): Edge[] {
  const toEdge = (a: string, b: string): Edge | null => {
    const p = nodes.get(a);
    const q = nodes.get(b);
    return p && q ? { x1: p.x, y1: p.y, x2: q.x, y2: q.y } : null;
  };
  const doors = navmesh.links.filter(
    (l) => l.data.type === 'room_to_door' && l.fromId === room.nodeId,
  );
  const doorIds = new Set(doors.map((l) => l.toId));
  const hallways = navmesh.links.filter(
    (l) => l.data.type === 'door_to_hallway' && doorIds.has(l.fromId),
  );
  return [...doors, ...hallways].flatMap((l) => toEdge(l.fromId, l.toId) ?? []);
}
