import { StyleSheet } from 'react-native';

import { Elevation, Radius, Size, Spacing, TouchTarget, Typography } from '@/styles/theme';

export const styles = StyleSheet.create({
  flex: { flex: 1, gap: Spacing.half },
  pad: { padding: Spacing.four },
  searchWrap: { position: 'relative', zIndex: 30 },
  field: { minHeight: TouchTarget + Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingLeft: Spacing.four, borderRadius: Radius.pill, borderWidth: 1, ...Elevation.card },
  input: { flex: 1, minHeight: TouchTarget, ...Typography.body, outlineStyle: 'none' } as object,
  iconBtn: { width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
  result: { minHeight: TouchTarget + Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
  doneChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  roster: { padding: Spacing.three, gap: Spacing.one },
  rosterHead: { paddingBottom: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: TouchTarget + Spacing.three, paddingVertical: Spacing.two },
  rowStack: { flexDirection: 'column', alignItems: 'stretch', gap: Spacing.two },
  friendRow: { borderTopWidth: StyleSheet.hairlineWidth },
  who: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, width: Size.rosterName },
  axis: { height: Spacing.three, position: 'relative' },
  tick: { position: 'absolute' },
});
