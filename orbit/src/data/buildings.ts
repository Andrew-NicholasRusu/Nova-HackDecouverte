import type { Building } from './types.ts';

const b = (campus: string, code: string, longName: string, address: string, latitude: number, longitude: number): Building => ({
  campus,
  code,
  name: code,
  longName,
  address,
  latitude,
  longitude,
});

/**
 * Approximate positions of the main buildings, used only when Concordia's building list cannot be
 * loaded, so the campus map is never empty. Live data replaces them as soon as it arrives.
 */
export const FALLBACK_BUILDINGS: Building[] = [
  b('SGW', 'H', 'Henry F. Hall Building', '1455 De Maisonneuve Blvd. W.', 45.49728, -73.57895),
  b('SGW', 'MB', 'John Molson Building', '1600 De Maisonneuve Blvd. W.', 45.49533, -73.57918),
  b('SGW', 'EV', 'Engineering, Computer Science and Visual Arts Complex', '1515 Ste-Catherine St. W.', 45.49565, -73.57754),
  b('SGW', 'LB', 'J.W. McConnell Building (Library)', '1400 De Maisonneuve Blvd. W.', 45.49685, -73.5779),
  b('SGW', 'GM', 'Guy-De Maisonneuve Building', '1550 De Maisonneuve Blvd. W.', 45.49585, -73.57897),
  b('SGW', 'FG', 'Faubourg Ste-Catherine Building', '1610 Ste-Catherine St. W.', 45.49458, -73.57844),
  b('SGW', 'CL', 'CL Annex', '1665 Ste-Catherine St. W.', 45.49482, -73.58),
  b('SGW', 'GN', 'Grey Nuns Building', '1190 Guy St.', 45.49339, -73.57763),
  b('LOY', 'AD', 'Administration Building', '7141 Sherbrooke St. W.', 45.458, -73.6392),
  b('LOY', 'CC', 'Loyola Campus Centre', '7141 Sherbrooke St. W.', 45.4577, -73.64),
  b('LOY', 'VL', 'Vanier Library', '7141 Sherbrooke St. W.', 45.4591, -73.6386),
  b('LOY', 'SP', 'Richard J. Renaud Science Complex', '7141 Sherbrooke St. W.', 45.4571, -73.6416),
  b('LOY', 'PY', 'Psychology Building', '7141 Sherbrooke St. W.', 45.4577, -73.6409),
  b('LOY', 'HU', 'Hingston Hall (HU)', '7141 Sherbrooke St. W.', 45.4578, -73.6395),
];
