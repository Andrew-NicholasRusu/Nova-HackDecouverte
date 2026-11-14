import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/styles/theme';

const GUTTER = Spacing.six - Spacing.three;

export const styles = StyleSheet.create({
  wrap: { borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', padding: Spacing.two },
  row: { flexDirection: 'row' },
  gutter: { width: GUTTER, position: 'relative' },
  hour: { position: 'absolute', right: Spacing.two, transform: [{ translateY: -Spacing.two }] },
  head: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: Radius.md },
  col: { flex: 1, position: 'relative', borderLeftWidth: StyleSheet.hairlineWidth },
  line: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  block: { position: 'absolute', borderRadius: Radius.sm, paddingHorizontal: Spacing.one + Spacing.half, paddingVertical: Spacing.half, overflow: 'hidden' },
  code: {},
  now: { position: 'absolute', left: 0, right: 0, height: 2 },
});
