import { StyleSheet } from 'react-native';

import { Spacing } from '@/styles/theme';

export const styles = StyleSheet.create({
  grid: { gap: Spacing.four },
  row: { flexDirection: 'row', alignItems: 'stretch' },
  column: { flexDirection: 'column' },
});
