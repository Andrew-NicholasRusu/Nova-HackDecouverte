import { FixedColors } from '@/constants/theme';
import { getRoomEdges, Room } from '@/lib/floorplan/navmesh';

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
