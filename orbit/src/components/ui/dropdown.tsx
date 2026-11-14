import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Elevation, Radius, Size, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Floating results panel anchored under its parent field. The parent must be `position: relative`
 * and must not clip overflow; the panel sits above sibling content.
 */
export function Dropdown({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="list"
      style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
