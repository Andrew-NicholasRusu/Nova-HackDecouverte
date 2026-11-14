import { StyleSheet } from 'react-native';

import { Spacing } from '@/styles/theme';

export const styles = StyleSheet.create({
  head: { gap: Spacing.one, alignItems: 'center' },
  day: { gap: Spacing.half },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  danger: { gap: Spacing.two, marginTop: Spacing.two },
});
