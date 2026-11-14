import { StyleSheet } from 'react-native';

import { Radius, Spacing, TouchTarget } from '@/styles/theme';

export const styles = StyleSheet.create({
  base: {
    minHeight: TouchTarget,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: { paddingHorizontal: Spacing.two },
  full: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
