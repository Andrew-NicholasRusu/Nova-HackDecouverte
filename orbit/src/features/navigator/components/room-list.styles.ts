import { StyleSheet } from 'react-native';

import { Radius, Size, Spacing, TouchTarget, Typography } from '@/styles/theme';

export const styles = StyleSheet.create({
  root: { flex: 1, gap: Spacing.two },
  input: {
    minHeight: TouchTarget,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
    ...Typography.body,
  },
  header: {
    minHeight: Size.sectionHeader,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
    marginTop: Spacing.one,
  },
  row: {
    minHeight: TouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  pressed: { opacity: 0.7 },
});
