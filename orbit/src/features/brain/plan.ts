/**
 * The dashboard "brain": combines Schedule, Map, Campus Live and Friends into one plan for
 * right now. Pure and tested; every suggestion links to the module that can act on it.
 */

import type { Campus } from '../../data/enums.ts';
import { LIVE_LEVEL_PHRASE, LIVE_LEVEL_TONE } from '../../data/labels.ts';
import type { ClassEvent, FreeWindow, Friend, LiveLocation, Place, Plan, Suggestion } from '../../data/types.ts';
import { formatClock, formatSpan, minutesBetween } from '../../lib/format.ts';
import { walkBetween } from '../../lib/geo.ts';
import { calculateReportConfidence } from '../live/confidence.ts';
import { calculateSharedAvailability } from '../schedule/availability.ts';
import { calculateNextClass, occurrencesOnDate } from '../schedule/engine.ts';
import { toLocalDate } from '../schedule/model.ts';

export type PlanInput = {
  events: ClassEvent[];
  friends: Friend[];
  locations: LiveLocation[];
  buildings: Map<string, Place>;
  campus: Campus | null;
  now: Date;
};

export function buildPlan({ events, friends, locations, buildings, campus, now }: PlanInput): Plan {
  const { current, next } = calculateNextClass(events, now);
  const today = toLocalDate(now);
  const nextToday = next && toLocalDate(next.start) === today ? next : null;
  const place = (code?: string) => (code ? (buildings.get(code.toUpperCase()) ?? null) : null);

  // Where the student will be when the free time starts.
  const endedToday = occurrencesOnDate(events, today)
    .filter((o) => o.end <= now)
    .sort((a, b) => b.end.getTime() - a.end.getTime())[0];
  const anchor = place(current?.event.buildingCode) ?? place(endedToday?.event.buildingCode);
  const here = current ? place(current.event.buildingCode) : anchor;
  const freeStart = current ? current.end : now;
  const nextBuilding = place(next?.event.buildingCode);
  const freeMinutes = nextToday ? Math.max(0, minutesBetween(freeStart, nextToday.start)) : null;
  const walkToNext = walkBetween(current ? place(current.event.buildingCode) : anchor, nextBuilding);

  const suggestions: Suggestion[] = [];

  // 1. Get to the next class on time.
  let leaveBy: Date | null = null;
  if (nextToday && !current && minutesBetween(now, nextToday.start) <= 90) {
    const w = walkBetween(anchor, nextBuilding);
    if (w !== null) leaveBy = new Date(nextToday.start.getTime() - (w + 3) * 60_000);
    const room = [nextToday.event.buildingCode, nextToday.event.room].filter(Boolean).join(' ');
    suggestions.push({
      id: 'leave',
      kind: 'leave',
      title: leaveBy ? `Leave by ${formatClock(leaveBy)}` : `Head to ${room || 'your next class'}`,
      detail: w !== null ? `${w} min walk to ${room}` : `${nextToday.event.courseCode} starts at ${formatClock(nextToday.start)}`,
      tone: leaveBy && minutesBetween(now, leaveBy) <= 10 ? 'warning' : 'neutral',
      cta: 'Show route',
      target: { pathname: '/navigator', params: { building: nextToday.event.buildingCode } },
    });
  }

  // 2. Use free time: best food / study spot that fits the window.
  const budget = freeMinutes ?? 120;
  const region = nextBuilding?.campus ?? here?.campus ?? campus;
  const best = (category: 'food' | 'study') =>
    locations
      .filter((l) => l.category === category && (!region || l.campus === region))
      .map((l) => ({ l, e: calculateReportConfidence(l.reports, now), w: walkBetween(here, place(l.buildingCode)) }))
      .filter((x) => x.e.level !== null && (x.w === null || x.w * 2 + 10 <= budget))
      .sort((a, b) => (a.e.level! - b.e.level!) * 10 + ((a.w ?? 5) - (b.w ?? 5)))[0];

  if (budget >= 20) {
    for (const category of ['food', 'study'] as const) {
      const pick = best(category);
      if (!pick) continue;
      const level = pick.e.level!;
      suggestions.push({
        id: category,
        kind: category,
        title: `${pick.l.name}: ${LIVE_LEVEL_PHRASE[category][level]}`,
        detail: [
          pick.w !== null ? `${pick.w} min walk` : null,
          `${pick.e.contributors} ${pick.e.contributors === 1 ? 'student' : 'students'} reported`,
          pick.e.confidence === 'none' ? null : `${pick.e.confidence} confidence`,
        ]
          .filter(Boolean)
          .join(' · '),
        tone: LIVE_LEVEL_TONE[level],
        cta: 'Open in Live',
        target: { pathname: '/live', params: { place: pick.l.id } },
      });
    }
  }

  // 3. Friends who are free inside the same window.
  const windowEnd = nextToday ? nextToday.start : null;
  const meets = friends
    .filter((f) => f.theirLevel !== 'private')
    .map((f) => {
      const w = calculateSharedAvailability([events, f.slots], today, { notBefore: freeStart, minMinutes: 30 }).find(
        (x) => !windowEnd || x.start < windowEnd,
      );
      return w ? { f, w } : null;
    })
    .filter((x): x is { f: Friend; w: FreeWindow } => !!x)
    .sort((a, b) => a.w.start.getTime() - b.w.start.getTime())[0];
  if (meets) {
    const study = best('study');
    suggestions.push({
      id: 'friend',
      kind: 'friend',
      title: `${meets.f.displayName.split(' ')[0]} is free ${formatClock(meets.w.start)}–${formatClock(meets.w.end)}`,
      detail: study ? `Meet at ${study.l.name} (${LIVE_LEVEL_PHRASE.study[study.e.level!]})` : `${formatSpan(meets.w.minutes)} together`,
      tone: 'success',
      cta: 'Plan it',
      target: { pathname: '/friends', params: { friend: meets.f.id } },
    });
  }

  // Headline.
  if (events.length === 0) {
    return { state: 'empty', headline: 'Add your classes to unlock your plan', sub: 'Orbit combines your schedule, friends, the map and live campus reports.', current, next, freeMinutes, nextBuilding, here, walkToNext, leaveBy, suggestions };
  }
  if (current) {
    const where = [current.event.buildingCode, current.event.room].filter(Boolean).join(' ');
    return {
      state: 'in-class',
      headline: `${current.event.courseCode} until ${formatClock(current.end)}`,
      sub: nextToday ? `${formatSpan(freeMinutes ?? 0)} until ${nextToday.event.courseCode}${where ? ` · now in ${where}` : ''}` : 'Last class of the day',
      current, next, freeMinutes, nextBuilding, here, walkToNext, leaveBy, suggestions,
    };
  }
  if (nextToday) {
    return {
      state: 'free',
      headline: `${formatSpan(freeMinutes ?? 0)} free before ${nextToday.event.courseCode}`,
      sub: `Starts ${formatClock(nextToday.start)}${nextToday.event.room ? ` in ${nextToday.event.buildingCode} ${nextToday.event.room}` : ''}${walkToNext !== null ? ` · ${walkToNext} min walk` : ''}`,
      current, next, freeMinutes, nextBuilding, here, walkToNext, leaveBy, suggestions,
    };
  }
  return {
    state: 'done',
    headline: 'Done for today',
    sub: next ? `Next up: ${next.event.courseCode}, ${next.start.toLocaleDateString([], { weekday: 'long' })} ${formatClock(next.start)}` : 'No upcoming classes',
    current, next, freeMinutes, nextBuilding, here, walkToNext, leaveBy, suggestions,
  };
}
