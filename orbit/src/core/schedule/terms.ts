/**
 * Term labels with DEFAULT date windows. These are containment windows, not Concordia's official
 * class dates (which the Open Data API does not currently provide) — the UI tells students to
 * adjust them to their actual first/last class.
 */
export type Term = { label: string; start: string; end: string };

export function termFor(date: string): Term {
  const [y, m] = date.split('-').map(Number);
  if (m >= 9) return { label: `Fall ${y}`, start: `${y}-09-01`, end: `${y}-12-23` };
  if (m >= 5) return { label: `Summer ${y}`, start: `${y}-05-01`, end: `${y}-08-31` };
  return { label: `Winter ${y}`, start: `${y}-01-05`, end: `${y}-04-30` };
}

/** Current term plus the next two, for pickers. */
export function upcomingTerms(today: string): Term[] {
  const out: Term[] = [termFor(today)];
  while (out.length < 3) {
    const last = out[out.length - 1];
    const [y, m, d] = last.end.split('-').map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + 10)).toISOString().slice(0, 10);
    out.push(termFor(next));
  }
  return out;
}
