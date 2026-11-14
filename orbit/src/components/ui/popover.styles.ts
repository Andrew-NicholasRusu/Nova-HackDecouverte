import { StyleSheet } from 'react-native';

import { Elevation, Radius } from '@/styles/theme';

export const styles = StyleSheet.create({
  panel: { position: 'absolute', borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', ...Elevation.raised },
});
