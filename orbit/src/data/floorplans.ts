import { john1Svg } from '@/assets/floor_plan/svg/john1';
import { john2Svg } from '@/assets/floor_plan/svg/john2';

import type { Floor } from './types.ts';

export const MOLSON_PHOTO = require('@/assets/images/buildings/molson.jpg');
export const MOLSON_PHOTO_RATIO = 1280 / 1707;

// Ascending by floor. Bands are eyeballed over the podium floors of the photo; extend as more plans arrive.
export const MOLSON_FLOORS: Floor[] = [
  {
    id: '1',
    label: 'Floor 1',
    band: { left: 0, width: 92, top: 75, height: 13 },
    image: require('@/assets/floor_plan/images/mb_1.png'),
    svg: john1Svg,
  },
  {
    id: '2',
    label: 'Floor 2',
    band: { left: 0, width: 92, top: 65, height: 10 },
    image: require('@/assets/floor_plan/images/mb_2.png'),
    svg: john2Svg,
  },
];
