import { StyleSheet } from 'react-native';

import { BadgeSize, FixedColors, Radius, Spacing, TouchTarget } from '@/styles/theme';

export const styles = StyleSheet.create({
  hero: {
    // No overflow clipping here: the search dropdown must escape the banner. The photo clips itself.
    zIndex: 20,
    padding: Spacing.four,
    justifyContent: 'space-between',
    gap: Spacing.four,
  },
  clip: { ...StyleSheet.absoluteFill, borderRadius: Radius.xl, overflow: 'hidden', backgroundColor: FixedColors.shell },
  // Above the greeting block: the search dropdown lives in this row and must win hit-testing.
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.three, zIndex: 30 },
  iconButton: {
    width: TouchTarget,
    height: TouchTarget,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FixedColors.heroGlass,
  },
  badge: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two + Spacing.half,
    width: BadgeSize,
    height: BadgeSize,
    borderRadius: BadgeSize / 2,
    backgroundColor: FixedColors.shellActive,
    borderWidth: 2,
    borderColor: FixedColors.white,
  },
  copy: { gap: Spacing.one },
  greeting: { color: FixedColors.white },
  tagline: { color: FixedColors.white },
});
