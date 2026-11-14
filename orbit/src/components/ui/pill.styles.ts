import { StyleSheet } from 'react-native';

import { Radius, Spacing } from '@/styles/theme';

export const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
});
