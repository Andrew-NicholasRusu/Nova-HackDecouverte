import { WALK_METRES_PER_MIN } from '../data/constants.ts';
import type { Coordinates } from '../data/types.ts';

/** Great-circle distance in metres. */
export function distanceMetres(a: Coordinates, b: Coordinates) {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Whole minutes to walk between two points (about 4.8 km/h, at least one minute). */
export function walkMinutes(a: Coordinates, b: Coordinates) {
  return Math.max(1, Math.round(distanceMetres(a, b) / WALK_METRES_PER_MIN));
}

type MaybePlace = { latitude: number | null; longitude: number | null } | null | undefined;

/** Walking minutes between two buildings, or null when either position is unknown. */
export function walkBetween(a: MaybePlace, b: MaybePlace): number | null {
  if (!a || !b || a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) return null;
  return walkMinutes({ latitude: a.latitude, longitude: a.longitude }, { latitude: b.latitude, longitude: b.longitude });
}

export function directionsUrl(b: Coordinates) {
  return `https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}&travelmode=walking`;
}
