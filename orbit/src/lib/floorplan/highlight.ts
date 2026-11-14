import { FixedColors } from '@/constants/theme';
import { getRoomEdges, Room } from '@/lib/floorplan/navmesh';
import type { Route } from '@/lib/floorplan/route';

const RED = FixedColors.roomHighlight;

/** Returns the floor SVG with the room's region filled red and its navmesh edges drawn on top. */
export function highlightRoom(svg: string, room: Room | null): string {
  if (!room) return svg;
  const label = room.code.replace(/\./g, '\\.');
  const path = new RegExp(`<path[^>]*inkscape:label="${label}"[^>]*/>`);
  const filled = svg.replace(path, (el) =>
    el.replace(
      /style="[^"]*"/,
      `style="fill:${RED};fill-opacity:0.45;stroke:${RED};stroke-width:2.5"`,
    ),
  );
  const edges = getRoomEdges(room)
    .map(
      (e) =>
        `<line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" stroke="${RED}" stroke-width="3" stroke-linecap="round"/>`,
    )
    .join('');
  const marker = `<circle cx="${room.x}" cy="${room.y}" r="5" fill="${RED}"/>`;
  return filled.replace('</svg>', `${edges}${marker}</svg>`);
}


const ROUTE = FixedColors.routeLine;

/** Draws the walking route for one floor: white casing, burgundy line, start and end markers, lift/stair marks. */
export function drawRoute(svg: string, route: Route | null, floor: number, focus: { x: number; y: number } | null): string {
  if (!route) return svg;
  const parts: string[] = [];
  for (const seg of route.segments.filter((s) => s.floor === floor)) {
    const pts = seg.points.map((p) => `${p.x},${p.y}`).join(' ');
    parts.push(`<polyline points="${pts}" fill="none" stroke="${FixedColors.white}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`);
    parts.push(`<polyline points="${pts}" fill="none" stroke="${ROUTE}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`);
  }
  for (const step of route.steps.filter((s) => s.floor === floor && (s.kind === 'elevator' || s.kind === 'stairs'))) {
    parts.push(`<circle cx="${step.x}" cy="${step.y}" r="11" fill="${ROUTE}" stroke="${FixedColors.white}" stroke-width="3"/>`);
    parts.push(`<text x="${step.x}" y="${step.y + 5}" text-anchor="middle" font-size="14" font-family="sans-serif" font-weight="700" fill="${FixedColors.white}">${step.kind === 'stairs' ? 'S' : 'E'}</text>`);
  }
  const first = route.steps[0];
  const last = route.steps[route.steps.length - 1];
  if (first.floor === floor) {
    parts.push(`<circle cx="${first.x}" cy="${first.y}" r="12" fill="${FixedColors.routeStart}" stroke="${FixedColors.white}" stroke-width="4"/>`);
  }
  if (last.floor === floor) {
    parts.push(`<circle cx="${last.x}" cy="${last.y}" r="17" fill="none" stroke="${RED}" stroke-width="3" opacity="0.5"/>`);
    parts.push(`<circle cx="${last.x}" cy="${last.y}" r="10" fill="${RED}" stroke="${FixedColors.white}" stroke-width="4"/>`);
  }
  if (focus) {
    parts.push(`<circle cx="${focus.x}" cy="${focus.y}" r="22" fill="none" stroke="${FixedColors.gold}" stroke-width="5"/>`);
  }
  return svg.replace('</svg>', `${parts.join('')}</svg>`);
}
