import { StyleSheet } from 'react-native';

import { Spacing } from '@/styles/theme';

export const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: Spacing.two },
  flex: { flex: 1 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.two },
  chips: { flexDirection: 'row', gap: Spacing.two },
  list: { gap: Spacing.two },
  break: { textAlign: 'center' },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: Spacing.two },
  all: { gap: Spacing.two, marginTop: Spacing.four },
});
