import { StyleSheet } from 'react-native';

import { FixedColors, Radius, Size, Spacing, TouchTarget, Typography } from '@/styles/theme';

export const styles = StyleSheet.create({
  pill: {
    flex: 1,
    maxWidth: Size.searchMax,
    minHeight: TouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    backgroundColor: FixedColors.heroGlass,
    borderWidth: 1,
    borderColor: FixedColors.heroGlassBorder,
  },
  key: { marginLeft: 'auto', paddingHorizontal: Spacing.two, borderRadius: Radius.sm, borderWidth: 1, borderColor: FixedColors.heroGlassBorder },
  open: { flex: 1, maxWidth: Size.searchOpen, position: 'relative', zIndex: 60 },
  field: {
    minHeight: TouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingLeft: Spacing.three,
    borderRadius: Radius.pill,
    backgroundColor: FixedColors.shell,
    borderWidth: 1,
    borderColor: FixedColors.gold,
  },
  input: { flex: 1, minHeight: TouchTarget, color: FixedColors.shellText, ...Typography.small, outlineStyle: 'none' } as object,
  close: { width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
  group: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.one, borderTopWidth: StyleSheet.hairlineWidth, textTransform: 'uppercase', letterSpacing: 1 },
  row: { minHeight: TouchTarget + Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three },
  icon: { width: TouchTarget - Spacing.two, height: TouchTarget - Spacing.two, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  empty: { padding: Spacing.three },
});
