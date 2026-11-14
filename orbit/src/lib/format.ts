/**
 * Generic time formatting shared by every module. Schedule-specific labels live in
 * features/schedule/format.ts. Pure, so the tested modules can import it.
 */

/** "08:05" */
export const formatClock = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Compact duration for chips and cards: "45 min", "2h", "1h 30m". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Duration inside a sentence: "45 min", "2 h", "1 h 30 min". */
export function formatSpan(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Minutes since local midnight. */
export const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();

/** Whole minutes from `a` to `b`. */
export const minutesBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 60_000);
