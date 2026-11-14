import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, CardHeader } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import { Opacity, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { ALERTS, LEVEL_TEXT, LEVEL_TONE } from '@/features/live/catalog';
import { ago, useLive, type PlaceStatus } from '@/features/live/use-live';
import { useTheme } from '@/hooks/use-theme';

type Row = { id: string; icon: IconName; title: string; detail: string; tone: 'success' | 'warning' | 'danger' | 'textSecondary' };

function placeRow(label: string, s: PlaceStatus, nowMs: number): Row {
  return {
    id: s.place.id,
    icon: s.place.icon,
    title: `${label}: ${s.place.name}`,
    detail: `${LEVEL_TEXT[s.place.kind][s.level]}${s.source === 'you' && s.at ? ` · you, ${ago(s.at, nowMs)}` : ' · typical now'}`,
    tone: LEVEL_TONE[s.level],
  };
}

export function LiveCard() {
  const theme = useTheme();
  const live = useLive();
  const latest = ALERTS[0];

  const rows: Row[] = [
    placeRow('Shortest line', live.bestFood, live.nowMs),
    placeRow('Study seats', live.bestStudy, live.nowMs),
    { id: latest.id, icon: latest.icon, title: latest.title, detail: latest.detail, tone: 'textSecondary' },
  ];

  return (
    <Card style={styles.card}>
      <CardHeader icon="sensors" title="Campus Live" actionLabel="View all" onAction={() => router.push('/live')} />
      <View style={styles.list}>
        {rows.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${item.detail}`}
            onPress={() => router.push('/live')}
            style={({ pressed }) => [styles.row, pressed && { opacity: Opacity.pressed }]}>
            <View style={[styles.iconTile, { backgroundColor: theme.accentTint }]}>
              <Icon name={item.icon} size="lg" color="accentLink" />
            </View>
            <View style={styles.text}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {item.title}
              </ThemedText>
              <ThemedText type="small" themeColor={item.tone} numberOfLines={1}>
                {item.detail}
              </ThemedText>
            </View>
            <Icon name="chevron-right" size="md" color="textSecondary" />
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexGrow: 1 },
  list: { gap: Spacing.two },
  row: { minHeight: TouchTarget + Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  iconTile: {
    width: TouchTarget,
    height: TouchTarget,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: Spacing.half },
});
