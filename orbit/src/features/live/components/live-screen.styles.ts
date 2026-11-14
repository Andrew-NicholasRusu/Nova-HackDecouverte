import { StyleSheet } from 'react-native';

import { Spacing } from '@/styles/theme';

export const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: Spacing.two },
  section: { gap: Spacing.three },
  grid: { gap: Spacing.three },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { flexBasis: '48%', flexGrow: 1 },
});
