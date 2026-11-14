import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/styles/theme';

export const styles = StyleSheet.create({
  block: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.two,
    paddingRight: Spacing.three,
    overflow: 'hidden',
  },
  bar: { width: 4, alignSelf: 'stretch', borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  time: { width: 44, alignItems: 'flex-start' },
  body: { flex: 1, gap: Spacing.half },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
  done: { opacity: 0.55 },
  pressed: { opacity: 0.75 },
});
