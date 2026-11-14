import { StyleSheet } from 'react-native';

import { Radius, Spacing, TouchTarget } from '@/styles/theme';

export const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  flex: { flex: 1, gap: Spacing.half },
  iconTile: { width: TouchTarget, height: TouchTarget, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  reading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  meter: { flexDirection: 'row', gap: Spacing.one },
  seg: { width: Spacing.three, height: Spacing.four, borderRadius: Radius.sm },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  report: { gap: Spacing.two },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  choice: { minHeight: TouchTarget, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, borderRadius: Radius.pill, borderWidth: 2 },
  choiceDot: { width: Spacing.two + Spacing.half, height: Spacing.two + Spacing.half, borderRadius: Radius.pill },
});
