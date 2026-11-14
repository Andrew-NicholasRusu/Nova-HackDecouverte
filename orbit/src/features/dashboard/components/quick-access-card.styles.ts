import { StyleSheet } from 'react-native';

import { Radius, Spacing, TouchTarget } from '@/styles/theme';

export const styles = StyleSheet.create({
  card: { flexGrow: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  tile: {
    flexGrow: 1,
    flexBasis: '40%',
    minHeight: TouchTarget + Spacing.five,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  label: { textAlign: 'center' },
});
