import { StyleSheet } from 'react-native';

import { BadgeSize, FixedColors, Radius, Spacing, TouchTarget } from '@/styles/theme';

export const styles = StyleSheet.create({
  button: { width: TouchTarget, height: TouchTarget, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: FixedColors.heroGlass },
  badge: { position: 'absolute', top: Spacing.half, right: Spacing.half, minWidth: BadgeSize + Spacing.two, height: BadgeSize + Spacing.two, paddingHorizontal: Spacing.one, borderRadius: Radius.pill, backgroundColor: FixedColors.shellActive, borderWidth: 2, borderColor: FixedColors.white, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: FixedColors.white, fontSize: 10, lineHeight: 12 },
  head: { padding: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  empty: { alignItems: 'center', gap: Spacing.two, padding: Spacing.five },
  center: { textAlign: 'center' },
  row: { flexDirection: 'row', gap: Spacing.three, padding: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  icon: { width: TouchTarget, height: TouchTarget, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: Spacing.half },
  actions: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap', marginTop: Spacing.two },
  pad: { padding: Spacing.three },
});
