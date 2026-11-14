import { router } from 'expo-router';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, CardHeader } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Opacity, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { DAY_NAMES, formatClock, useSchedule, WEEK_ORDER } from '@/features/schedule/use-schedule';
import { useTheme } from '@/hooks/use-theme';
import { useQuickActions, type QuickAction } from './quick-actions';

export function QuickAccessCard() {
  const theme = useTheme();
  const { selected } = useQuickActions();
  const { entries } = useSchedule();

  function run(a: QuickAction) {
    if (a.kind === 'share') {
      const text = WEEK_ORDER.flatMap((d) =>
        entries
          .filter((e) => e.day === d)
          .sort((x, y) => x.start.localeCompare(y.start))
          .map((e) => `${DAY_NAMES[d].slice(0, 3)} ${formatClock(e.start)}–${formatClock(e.end)}  ${e.code}${e.room ? ` (${e.room})` : ''}`),
      ).join('\n');
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

const styles = StyleSheet.create({
  card: { flexGrow: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  tile: {
    flexGrow: 1,
    flexBasis: '40%',
    minHeight: TouchTarget + Spacing.five,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  label: { textAlign: 'center' },
});
