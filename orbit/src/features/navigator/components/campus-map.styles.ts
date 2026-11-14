import { StyleSheet } from 'react-native';

import { MAP_TILE_SIZE as TILE } from '@/data/constants';
import { Elevation, FixedColors, Radius, Spacing, TouchTarget } from '@/styles/theme';

export const PIN = Spacing.three;
const LABEL_WIDTH = 88;

export const styles = StyleSheet.create({
  map: { borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', position: 'relative' },
  tile: { position: 'absolute', width: TILE, height: TILE },
  route: { position: 'absolute', height: 4, borderRadius: Radius.pill, opacity: 0.85 },
  pinWrap: { position: 'absolute', width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
  pin: { width: PIN, height: PIN, borderRadius: Radius.pill, borderWidth: 2, ...Elevation.card },
  label: { position: 'absolute', top: TouchTarget / 2 + Spacing.one, left: (TouchTarget - LABEL_WIDTH) / 2, width: LABEL_WIDTH, paddingVertical: Spacing.half, borderRadius: Radius.pill, alignItems: 'center' },
  labelQuiet: { backgroundColor: FixedColors.heroGlass, width: LABEL_WIDTH / 2, left: (TouchTarget - LABEL_WIDTH / 2) / 2 },
  labelText: { color: FixedColors.shellText },
  credit: { position: 'absolute', right: Spacing.one, bottom: Spacing.one, backgroundColor: FixedColors.heroGlass, paddingHorizontal: Spacing.one, borderRadius: Radius.sm },
  creditText: { color: FixedColors.shellText, fontSize: 10, lineHeight: 12 },
});
