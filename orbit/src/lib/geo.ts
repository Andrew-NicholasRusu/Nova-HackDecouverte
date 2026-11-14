/** Great-circle distance in metres. */
export function distanceMetres(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const WALK_M_PER_MIN = 80;

/** Whole minutes to walk between two points (about 4.8 km/h, plus a minute to get in and out). */
export function walkMinutes(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  return Math.max(1, Math.round(distanceMetres(a, b) / WALK_M_PER_MIN));
}

export function directionsUrl(b: { latitude: number; longitude: number }) {
  return `https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}&travelmode=walking`;
}
