import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title?: string;
  subtitle?: string;
  /** Replaces the default title block (e.g. the dashboard hero). */
  header?: ReactNode;
  /** Show a "Back" link (web screens outside the tab shell). */
  back?: boolean;
  maxWidth?: number;
  children: ReactNode;
};

/** Standard screen frame: themed background, safe area, scroll, centered max width. */
export function Screen({ title, subtitle, header, back, maxWidth = 800, children }: Props) {
  const theme = useTheme();
  const { sidebar } = useLayout();
  // Compact web shows a floating top tab bar; leave room for it.
  const topPad =
    Platform.OS === 'web' && !sidebar && !back ? Spacing.six + Spacing.three : Spacing.three;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.root} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topPad }]}
          showsVerticalScrollIndicator={false}>
          <View style={[styles.content, { maxWidth }]}>
            {back && Platform.OS === 'web' ? (
              <Pressable
                accessibilityRole="link"
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
                style={styles.back}>
                <Icon name="back" size={18} />
                <ThemedText type="smallBold">Back</ThemedText>
              </Pressable>
            ) : null}
            {header ??
              (title ? (
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
              ) : null)}
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
    paddingBottom: BottomTabInset + Spacing.six,
  },
  content: { width: '100%', gap: Spacing.three },
  header: { gap: Spacing.one, paddingBottom: Spacing.two },
  back: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, minHeight: 44 },
});
