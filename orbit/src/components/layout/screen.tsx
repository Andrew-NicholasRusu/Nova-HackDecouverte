import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { Platform, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FadeIn } from '@/components/ui/fade-in';
import { ThemedText } from '@/components/ui/themed-text';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './screen.styles';

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
