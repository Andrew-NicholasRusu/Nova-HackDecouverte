import { StyleSheet } from 'react-native';

import { DotSize, Spacing } from '@/styles/theme';

export const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute',
    right: -Spacing.half,
    bottom: -Spacing.half,
    width: DotSize + Spacing.one,
    height: DotSize + Spacing.one,
    borderRadius: DotSize,
    borderWidth: 2,
  },
});
