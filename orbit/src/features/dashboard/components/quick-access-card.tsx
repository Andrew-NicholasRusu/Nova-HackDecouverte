import { router } from 'expo-router';
import { Pressable, Share, View } from 'react-native';

import { Card, CardHeader } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import type { QuickAction } from '@/data/types';
import { useQuickActions } from '@/features/dashboard/quick-actions';
import { formatWeekAsText } from '@/features/schedule/format';
import { useClassEvents } from '@/features/schedule/store';
import { useTheme } from '@/hooks/use-theme';
import { Opacity } from '@/styles/theme';

import { styles } from './quick-access-card.styles';

export function QuickAccessCard() {
  const theme = useTheme();
  const { selected } = useQuickActions();
  const { events } = useClassEvents();

  function run(a: QuickAction) {
    if (a.kind === 'share') {
      const text = formatWeekAsText(events);
      if (text) Share.share({ message: text });
      else router.push('/schedule');
      return;
    }
    if (a.href) router.push(a.href);
  }

  return (
    <Card style={styles.card}>
      <CardHeader icon="bolt" title="Quick Access" actionLabel="Edit" onAction={() => router.push('/settings')} />
      <View style={styles.grid}>
        {selected.map((a) => (
          <Pressable
            key={a.id}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            accessibilityHint={a.hint}
            onPress={() => run(a)}
            style={(state) => {
              const hovered = (state as { hovered?: boolean }).hovered;
              return [
                styles.tile,
                { borderColor: theme.border, backgroundColor: hovered ? theme.accentTint : theme.background },
                state.pressed && { opacity: Opacity.pressed },
              ];
            }}>
            <Icon name={a.icon} size="lg" color="accentLink" />
            <ThemedText type="smallBold" style={styles.label}>
              {a.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}
