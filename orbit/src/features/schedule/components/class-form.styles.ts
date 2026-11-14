import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/styles/theme';

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.three },
  flex: { flex: 1, gap: Spacing.one },
  narrow: { width: 96, gap: Spacing.one },
  group: { gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  swatch: { width: 32, height: 32, borderRadius: Radius.pill, borderWidth: 3 },
  delete: { marginTop: Spacing.three },
});
