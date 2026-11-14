import { StyleSheet } from 'react-native';

import { Spacing } from '@/styles/theme';

export const styles = StyleSheet.create({
  fields: { gap: Spacing.three },
  field: { gap: Spacing.one },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  bio: { minHeight: 88, paddingTop: Spacing.two, textAlignVertical: 'top' },
});
