import { StyleSheet } from 'react-native';

import { FixedColors, Radius, SidebarWidth, Spacing, TouchTarget } from '@/styles/theme';

export const styles = StyleSheet.create({
  root: { flex: 1 },
  slot: { flex: 1 },
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'stretch',
  },
  barItem: {
    flex: 1,
    minHeight: TouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
  },
  sidebar: {
    width: SidebarWidth,
    backgroundColor: FixedColors.shell,
    borderRightWidth: 1,
    borderRightColor: FixedColors.shellBorder,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    gap: Spacing.four,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.two, minHeight: TouchTarget },
  logo: {
    width: TouchTarget,
    height: TouchTarget,
    borderRadius: Radius.md,
    backgroundColor: FixedColors.shellActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { color: FixedColors.shellText, letterSpacing: 3 },
  nav: { gap: Spacing.one, flex: 1 },
  sideItem: {
    minHeight: TouchTarget + Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
  },
  footer: { gap: Spacing.three },
  school: { gap: Spacing.half, paddingHorizontal: Spacing.two },
  goldRule: {
    width: Spacing.five,
    height: Spacing.half,
    backgroundColor: FixedColors.gold,
    marginBottom: Spacing.two,
  },
});
