import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { FadeIn } from '@/components/ui/fade-in';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  subtitle?: string;
  /** Replaces the plain title block (e.g. the dashboard's photo hero). */
  hero?: ReactNode;
  /** Pull-to-refresh (touch devices): reload this screen's data. */
  onRefresh?: () => Promise<unknown> | void;
  children: ReactNode;
};

/** Standard screen frame: themed background, safe area, scroll, centered max width, header. */
export function Screen({ title, subtitle, hero, onRefresh, children }: Props) {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  // The browser tab says where you are.
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.title = `${title} · Orbit`;
  }, [title]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.root} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.accent} /> : undefined}>
          <FadeIn style={styles.content}>
            {hero ?? (
              <View style={styles.header}>
                <ThemedText type="displaySmall" accessibilityRole="header">
                  {title}
                </ThemedText>
                {subtitle ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {subtitle}
                  </ThemedText>
                ) : null}
              </View>
            )}
            {children}
          </FadeIn>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    alignItems: 'center',
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.six + Spacing.four,
  },
  content: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.four },
  header: { gap: Spacing.one, paddingTop: Spacing.two },
});
