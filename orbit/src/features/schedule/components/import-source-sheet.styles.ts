import { StyleSheet } from 'react-native';

import { Radius, Size, Spacing, Typography } from '@/styles/theme';

export const styles = StyleSheet.create({
  drop: { alignItems: 'center', gap: Spacing.three, padding: Spacing.five, borderRadius: Radius.xl, borderWidth: 2, borderStyle: 'dashed' },
  center: { textAlign: 'center' },
  track: { height: Spacing.two, alignSelf: 'stretch', borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%' },
  paste: { minHeight: Size.pasteHeight, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.three, textAlignVertical: 'top', ...Typography.small },
});
