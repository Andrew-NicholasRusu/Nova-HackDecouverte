import type { IconName } from '@/components/ui/icon';

export type Kind = 'wait' | 'seats';
export type Level = 'good' | 'ok' | 'bad';

export type Place = {
  id: string;
  kind: Kind;
  name: string;
  where: string;
  icon: IconName;
};

/** Places students can report on. Names are real Concordia spaces; levels are student-reported. */
export const PLACES: Place[] = [
  { id: 'hall-food', kind: 'wait', name: 'Hall Building food court', where: 'Sir George Williams · H', icon: 'restaurant' },
  { id: 'mb-cafe', kind: 'wait', name: 'Molson Building café', where: 'Sir George Williams · MB', icon: 'local-cafe' },
  { id: 'loy-cafeteria', kind: 'wait', name: 'Loyola Campus Centre cafeteria', where: 'Loyola · CC', icon: 'restaurant' },
  { id: 'webster', kind: 'seats', name: 'Webster Library study floors', where: 'Sir George Williams · LB', icon: 'menu-book' },
  { id: 'ev-atrium', kind: 'seats', name: 'EV Building atrium', where: 'Sir George Williams · EV', icon: 'chair' },
  { id: 'mb-lounge', kind: 'seats', name: 'Molson Building study lounge', where: 'Sir George Williams · MB', icon: 'chair' },
  { id: 'vanier', kind: 'seats', name: 'Vanier Library', where: 'Loyola · VL', icon: 'menu-book' },
];

export const LEVEL_TEXT: Record<Kind, Record<Level, string>> = {
  wait: { good: 'Under 5 min', ok: 'About 10 min', bad: '15+ min' },
  seats: { good: 'Plenty of seats', ok: 'Filling up', bad: 'Almost full' },
};

export const LEVEL_TONE: Record<Level, 'success' | 'warning' | 'danger'> = {
  good: 'success',
  ok: 'warning',
  bad: 'danger',
};

export const LEVEL_RANK: Record<Level, number> = { good: 0, ok: 1, bad: 2 };

/** What is typical at this hour, so every place has an honest baseline before anyone reports. */
export function typicalLevel(place: Place, now: Date): Level {
  const day = now.getDay();
  if (day === 0 || day === 6) return 'good';
  const t = now.getHours() + now.getMinutes() / 60;
  if (place.kind === 'wait') {
    if (t >= 11.75 && t < 13.5) return 'bad';
    if ((t >= 11 && t < 11.75) || (t >= 13.5 && t < 14.5) || (t >= 17 && t < 18.5)) return 'ok';
    return 'good';
  }
  if (t >= 11 && t < 16) return place.id === 'webster' ? 'bad' : 'ok';
  if (t >= 9 && t < 11) return place.id === 'webster' ? 'ok' : 'good';
  return 'good';
}

export type AlertCategory = 'transit' | 'events' | 'facilities' | 'food';

export const CATEGORY_LABEL: Record<AlertCategory | 'all', string> = {
  all: 'All',
  transit: 'Getting around',
  events: 'Events',
  facilities: 'Buildings',
  food: 'Food',
};

export type CampusAlert = {
  id: string;
  category: AlertCategory;
  title: string;
  detail: string;
  icon: IconName;
  minutesAgo: number;
};

/** Sample campus notices until a moderated feed exists. */
export const ALERTS: CampusAlert[] = [
  { id: 'a1', category: 'events', title: 'Winter Carnival this Friday', detail: 'Games and hot chocolate in the Hall Building mezzanine from noon.', icon: 'event', minutesAgo: 35 },
  { id: 'a2', category: 'transit', title: 'Shuttle between campuses', detail: 'The Loyola and Sir George Williams shuttle runs every 20 minutes at peak.', icon: 'directions-bus', minutesAgo: 90 },
  { id: 'a3', category: 'facilities', title: 'Elevator maintenance in the Hall Building', detail: 'Use the east bank of elevators until 3 PM.', icon: 'build', minutesAgo: 140 },
  { id: 'a4', category: 'food', title: 'Vegan lunch special', detail: 'New menu at the Molson Building café, while it lasts.', icon: 'local-cafe', minutesAgo: 200 },
];
