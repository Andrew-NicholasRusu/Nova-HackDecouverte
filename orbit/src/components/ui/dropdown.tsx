import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { styles } from './dropdown.styles';

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
