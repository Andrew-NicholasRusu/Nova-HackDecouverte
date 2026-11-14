import { StyleSheet } from 'react-native';

import { Elevation, Radius, Spacing } from '@/styles/theme';

export const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    gap: Spacing.three,
    ...Elevation.card,
  },
  titleText: { flexShrink: 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  title: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two, flexShrink: 1 },
});
