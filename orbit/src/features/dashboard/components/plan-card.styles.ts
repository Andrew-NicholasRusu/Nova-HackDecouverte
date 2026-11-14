import { StyleSheet } from 'react-native';

import { Elevation, FixedColors, Radius, Spacing, TouchTarget } from '@/styles/theme';

/** Suggestion tone on the navy plan card. */
export const toneColor = {
  success: FixedColors.successOnShell,
  warning: FixedColors.warningOnShell,
  danger: FixedColors.dangerOnShell,
  neutral: FixedColors.shellMuted,
} as const;

export const styles = StyleSheet.create({
  card: {
    backgroundColor: FixedColors.shell,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.four,
    borderWidth: 1,
    borderColor: FixedColors.shellBorder,
    ...Elevation.raised,
  },
  head: { gap: Spacing.three },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headText: { gap: Spacing.one, flexShrink: 1 },
  headline: { color: FixedColors.shellText },
  sub: { color: FixedColors.shellMuted },
  tiles: { gap: Spacing.two },
  tilesRow: { flexDirection: 'row' },
  tile: {
    minHeight: TouchTarget + Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    backgroundColor: FixedColors.shellRaised,
    borderWidth: 1,
    borderColor: FixedColors.shellBorder,
  },
  tileFlex: { flex: 1 },
  tileIcon: { width: TouchTarget, height: TouchTarget, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: FixedColors.shellHover },
  tileText: { flex: 1, gap: Spacing.half },
  tileTitle: { color: FixedColors.shellText },
});
