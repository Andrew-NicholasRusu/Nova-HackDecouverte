import { StyleSheet } from 'react-native';

import { Elevation, FixedColors, Radius, Spacing, TouchTarget } from '@/styles/theme';

export const styles = StyleSheet.create({
  cols: { gap: Spacing.four },
  colsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  col: { gap: Spacing.four },
  flex: { flex: 1 },
  profile: { backgroundColor: FixedColors.shell, borderRadius: Radius.xl, padding: Spacing.four, gap: Spacing.three, borderWidth: 1, borderColor: FixedColors.shellBorder, ...Elevation.raised },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  profileTopStack: { flexDirection: 'column', alignItems: 'flex-start' },
  photoActions: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap', marginTop: Spacing.two },
  right: { textAlign: 'right' },
  onShell: { color: FixedColors.shellText },
  onShellMuted: { color: FixedColors.shellMuted },
  gold: { color: FixedColors.gold },
  stats: { flexDirection: 'row', gap: Spacing.five, flexWrap: 'wrap' },
  stat: { gap: Spacing.half },
  campus: { gap: Spacing.two },
  pills: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  option: { flex: 1, minHeight: TouchTarget + Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  check: { width: Spacing.four, height: Spacing.four, borderRadius: Radius.sm, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1 },
  move: { flexDirection: 'row' },
  moveBtn: { width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
});
