import { StyleSheet } from 'react-native';

import { Elevation, Radius, Size, Spacing } from '@/styles/theme';

export const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: Spacing.two,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    zIndex: 50,
    ...Elevation.raised,
  },
  scroll: { maxHeight: Size.dropdownMax },
});
