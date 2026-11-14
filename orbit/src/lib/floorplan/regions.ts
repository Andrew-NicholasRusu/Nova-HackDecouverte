export type Region = { code: string; x: number; y: number; width: number; height: number };

/** Bounding boxes (in the SVG's 1024-unit space) of the labelled room paths in a floor SVG. */
export function getRoomRegions(svg: string): Region[] {
  const regions: Region[] = [];
  for (const [el] of svg.matchAll(/<path[^>]*\/>/g)) {
    const code = el.match(/inkscape:label="([^"]+)"/)?.[1];
    const d = el.match(/\sd="([^"]+)"/)?.[1];
    if (!code || !d) continue;
    const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    const xs = nums.filter((_, i) => i % 2 === 0);
    const ys = nums.filter((_, i) => i % 2 === 1);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    regions.push({ code, x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y });
  }
  // Largest first, so smaller rooms nested inside bigger ones are drawn (and hit) on top.
  return regions.sort((a, b) => b.width * b.height - a.width * a.height);
}
