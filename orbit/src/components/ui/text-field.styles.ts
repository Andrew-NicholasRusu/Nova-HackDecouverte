import { StyleSheet } from 'react-native';

import { Radius, Spacing, TouchTarget, Typography } from '@/styles/theme';

export const styles = StyleSheet.create({
  wrap: { gap: Spacing.one },
  input: {
    minHeight: TouchTarget,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    ...Typography.body,
  },
});
