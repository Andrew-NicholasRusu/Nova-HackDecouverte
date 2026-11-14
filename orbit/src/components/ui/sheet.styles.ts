import { StyleSheet } from 'react-native';

import { FormWidth, Spacing } from '@/styles/theme';

export const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  side: { width: 72 },
  right: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center' },
  disabled: { opacity: 0.4 },
  scroll: { alignItems: 'center', padding: Spacing.three, paddingBottom: Spacing.six },
  content: { width: '100%', maxWidth: FormWidth, gap: Spacing.three },
  footer: {
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
});
