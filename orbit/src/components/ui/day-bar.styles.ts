import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/styles/theme';

const BAR_HEIGHT = Spacing.three;
const MARKER = 2;

export const styles = StyleSheet.create({
  track: { height: BAR_HEIGHT, borderRadius: Radius.sm, overflow: 'hidden' },
  block: { position: 'absolute', top: 0, bottom: 0 },
  now: { position: 'absolute', top: -Spacing.half, bottom: -Spacing.half, width: MARKER },
});
