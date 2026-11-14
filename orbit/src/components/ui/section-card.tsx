import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  icon: IconName;
  title: string;
  actionLabel?: string;
  href?: Href;
  style?: ViewStyle;
  children: ReactNode;
};

/** Dashboard module card: icon + title header with an optional "View all →" link. */
export function SectionCard({ icon, title, actionLabel = 'View all', href, style, children }: Props) {
  const theme = useTheme();
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.header}>
        <Icon name={icon} color={theme.accent} />
        <ThemedText type="heading" style={styles.title} accessibilityRole="header">
          {title}
        </ThemedText>
        {href ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`${actionLabel}: ${title}`}
            onPress={() => router.push(href)}
            hitSlop={8}
            style={styles.action}>
            <ThemedText type="link" themeColor="text">
              {actionLabel}
            </ThemedText>
            <Icon name="arrow" size={16} />
          </Pressable>
        ) : null}
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three, padding: Spacing.four, flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { flex: 1 },
  action: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, minHeight: 32 },
});
