import type { Trend } from '../../data/enums.ts';
import type { LiveReport } from '../../data/types.ts';

const avg = (rs: LiveReport[]) => rs.reduce((s, r) => s + r.level, 0) / rs.length;

/** Compares the last 12 minutes of reports with the 33 minutes before. Needs both to say anything. */
export function trendFor(reports: LiveReport[], now: Date): Trend | null {
  const age = (r: LiveReport) => (now.getTime() - r.createdAt.getTime()) / 60_000;
  const recent = reports.filter((r) => age(r) >= -1 && age(r) <= 12);
  const older = reports.filter((r) => age(r) > 12 && age(r) <= 45);
  if (recent.length === 0 || older.length === 0) return null;
  const d = avg(recent) - avg(older);
  return d >= 0.6 ? 'busier' : d <= -0.6 ? 'quieter' : 'steady';
}
