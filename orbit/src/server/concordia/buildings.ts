import { concordiaGet } from './client';

/** Shape returned by GET facilities/buildinglist/ (verified against the live API). */
type RawBuilding = {
  Campus: string;
  Building: string;
  Building_Name: string;
  Building_Long_Name: string;
  Address: string;
  Latitude: string;
  Longitude: string;
};

/** ORBIT's normalized building model; Concordia field names stop here. */
export type Building = {
  campus: 'SGW' | 'LOY' | string;
  code: string;
  name: string;
  longName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  provenance: { source: 'concordia-open-data'; fetchedAt: string };
};

const toNumber = (v: string) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

export async function fetchBuildings(): Promise<Building[]> {
  const raw = await concordiaGet<RawBuilding[]>('facilities/buildinglist', { trailingSlash: true });
  const fetchedAt = new Date().toISOString();
  return raw.map((b) => ({
    campus: b.Campus,
    code: b.Building,
    name: b.Building_Name,
    longName: b.Building_Long_Name,
    address: b.Address,
    latitude: toNumber(b.Latitude),
    longitude: toNumber(b.Longitude),
    provenance: { source: 'concordia-open-data', fetchedAt },
  }));
}
