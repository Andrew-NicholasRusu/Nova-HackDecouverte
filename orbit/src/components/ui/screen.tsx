import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

/** Standard screen frame: themed background, safe area, scroll, centered max width, header. */
export function Screen({ title, subtitle, children }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.root} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.header}>
              <ThemedText type="title" accessibilityRole="header">
                {title}
              </ThemedText>
              {subtitle ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {subtitle}
                </ThemedText>
              ) : null}
            </View>
            {children}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    // On web the tab bar floats at the top, so leave room for it.
    paddingTop: Platform.OS === 'web' ? Spacing.six + Spacing.three : Spacing.three,
    paddingBottom: BottomTabInset + Spacing.six,
  },
  content: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  header: { gap: Spacing.one, paddingBottom: Spacing.two },
});
