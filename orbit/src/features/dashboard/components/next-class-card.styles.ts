import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/styles/theme';

export const styles = StyleSheet.create({
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  swatch: { width: Spacing.three, height: Spacing.five, borderRadius: Radius.pill },
  grow: { flex: 1 },
  meta: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  list: { gap: Spacing.two },
});
