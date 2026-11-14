import { StyleSheet } from 'react-native';

import { MOLSON_PHOTO_RATIO } from '@/data/floorplans';
import { BuildingViewerMaxWidth, FixedColors, Radius, Spacing } from '@/styles/theme';

export const styles = StyleSheet.create({
  frame: {
    width: '100%',
    maxWidth: BuildingViewerMaxWidth,
    aspectRatio: MOLSON_PHOTO_RATIO,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  photo: { ...StyleSheet.absoluteFill },
  band: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    cursor: 'pointer',
  },
  bandActive: {
    borderColor: FixedColors.white,
  },
  tag: {
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
});
