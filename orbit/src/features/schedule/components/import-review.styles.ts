import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/styles/theme';

export const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  check: {
    width: 26,
    height: 26,
    marginTop: Spacing.three,
    borderRadius: Radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: Spacing.half },
  excluded: { opacity: 0.45 },
  note: { paddingLeft: Spacing.two },
  footer: { width: '100%', maxWidth: 480 },
});
