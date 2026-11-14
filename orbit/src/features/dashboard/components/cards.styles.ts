import { StyleSheet } from 'react-native';

import { Radius, Spacing, TouchTarget } from '@/styles/theme';

export const styles = StyleSheet.create({
  avatars: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  row: { minHeight: TouchTarget + Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  tile: { width: TouchTarget, height: TouchTarget, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1, gap: Spacing.half },
});
