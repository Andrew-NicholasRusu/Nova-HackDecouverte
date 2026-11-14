/**
 * Report reliability (PLAN.md §2 Module D "Reliability system", §5.5 calculateReportConfidence).
 * Pure and tested. Considers: age (exponential decay), one vote per contributor
 * (repeat submissions don't stack), number of distinct contributors, and agreement.
 */

export type LiveLevel = 0 | 1 | 2 | 3;

export type LiveReport = {
  level: LiveLevel;
  createdAt: Date;
  /** Same number = same student (per location); not linkable to a profile. */
  contributor: number;
  mine: boolean;
};

export type Confidence = 'none' | 'low' | 'medium' | 'high';

export type LiveEstimate = {
  /** Rounded weighted estimate, null when there are no usable reports. */
  level: LiveLevel | null;
  confidence: Confidence;
  reports: number;
  contributors: number;
  /** Minutes since the newest report. */
  newestMinutes: number | null;
};

export const REPORT_MAX_AGE_MIN = 45;
const HALF_LIFE_MIN = 15;

export function calculateReportConfidence(reports: LiveReport[], now: Date): LiveEstimate {
  const ageMin = (r: LiveReport) => (now.getTime() - r.createdAt.getTime()) / 60_000;
  const fresh = reports.filter((r) => ageMin(r) >= -1 && ageMin(r) <= REPORT_MAX_AGE_MIN);

  // Latest report per contributor only.
  const latest = new Map<number, LiveReport>();
  for (const r of fresh) {
    const prev = latest.get(r.contributor);
    if (!prev || r.createdAt > prev.createdAt) latest.set(r.contributor, r);
  }
  const votes = [...latest.values()];
  if (votes.length === 0) {
    return { level: null, confidence: 'none', reports: 0, contributors: 0, newestMinutes: null };
  }

  const weighted = votes.map((r) => ({ level: r.level, w: Math.pow(0.5, Math.max(0, ageMin(r)) / HALF_LIFE_MIN) }));
  const total = weighted.reduce((s, v) => s + v.w, 0);
  const estimate = weighted.reduce((s, v) => s + v.w * v.level, 0) / total;
  const spread = Math.sqrt(weighted.reduce((s, v) => s + v.w * (v.level - estimate) ** 2, 0) / total);

  const freshness = Math.min(1, total / 2); // ~2 fresh reports saturate
  const crowd = votes.length >= 3 ? 1 : votes.length === 2 ? 0.8 : 0.55;
  const agreement = 1 - (Math.min(spread, 1.5) / 1.5) * 0.6;
  const score = freshness * crowd * agreement;

  return {
    level: Math.min(3, Math.max(0, Math.round(estimate))) as LiveLevel,
    confidence: score >= 0.6 ? 'high' : score >= 0.3 ? 'medium' : 'low',
    reports: fresh.length,
    contributors: votes.length,
    newestMinutes: Math.max(0, Math.round(Math.min(...fresh.map(ageMin)))),
  };
}
