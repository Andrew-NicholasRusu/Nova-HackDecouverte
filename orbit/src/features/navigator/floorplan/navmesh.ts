import navmesh from '@/assets/floor_plan/navmesh/mb.json';
import { MOLSON_FLOORS } from '@/data/floorplans';
import type { Floor, Room, Route } from '@/data/types';

import { buildGraph, planRoute } from './route';

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

/** Every Molson room, sorted by floor then code. */
export const ALL_ROOMS = getOtherRooms('');

/** A room by its label ("MB-1.130") and the floor plan it is on. */
export function findRoom(label: string): { room: Room; floor: Floor } | null {
  const room = allRooms.find((r) => r.label === label);
  const floor = room && MOLSON_FLOORS.find((f) => f.id === room.floor);
  return room && floor ? { room, floor } : null;
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


const graph = buildGraph(navmesh.nodes, navmesh.links);

/** The building's street entrance, used as the default starting point for directions. */
export const ENTRANCE: Room = (() => {
  const poi = navmesh.poiIndex.building_entry_exit[0];
  return { code: 'ENTRANCE', label: 'Main entrance', floor: String(poi.floor), nodeId: poi.nodeId, x: poi.x, y: poi.y };
})();

/** Step-by-step route between two rooms (or the entrance); null when no path exists. */
export function routeBetween(from: Room, to: Room, accessibleOnly: boolean): Route | null {
  return planRoute(graph, from.nodeId, to.nodeId, accessibleOnly);
}
