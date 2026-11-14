import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';
import { Skeleton } from '@/components/ui/skeleton';
import { Radius, Spacing } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import {
  countdown,
  DAY_NAMES,
  formatRange,
  upcomingOccurrences,
  useSchedule,
} from '@/features/schedule/use-schedule';

/** Next class with a live countdown, plus the classes after it. */
export function ScheduleCard() {
  const theme = useTheme();
  const now = useNow();
  const { entries, ready } = useSchedule();
  const [next, ...later] = upcomingOccurrences(entries, now);
  const when = (d: Date) =>
    d.toDateString() === now.toDateString() ? '' : `${DAY_NAMES[d.getDay()].slice(0, 3)} · `;

  return (
    <Card style={styles.card}>
      <CardHeader
        icon="calendar-month"
        title="My Schedule"
        actionLabel="View all"
        onAction={() => router.push('/schedule')}
      />
      {!ready ? (
        <View style={styles.list}>
          <Skeleton width="70%" height={20} />
          <Skeleton width="55%" />
        </View>
      ) : next ? (
        <>
          <View style={[styles.next, { backgroundColor: theme.accentTint }]}>
            <View style={styles.nextBody}>
              <ThemedText type="smallBold" themeColor="accentLink" accessibilityLiveRegion="polite">
                {next.start <= now ? 'In progress' : `Next class · ${countdown(next.start, now)}`}
              </ThemedText>
              <ThemedText type="subtitle">{next.code}</ThemedText>
              <ThemedText type="default">{next.title}</ThemedText>
              {next.room ? (
                <View style={styles.room}>
                  <Icon name="location-on" size="sm" color="textSecondary" />
                  <ThemedText type="small" themeColor="textSecondary">
                    {next.room}
                  </ThemedText>
                </View>
              ) : null}
            </View>
            <Pill label={`${when(next.start)}${formatRange(next.start, next.end)}`} />
          </View>
          {later.length > 0 && (
            <View style={styles.list}>
              <ThemedText type="smallBold">Upcoming</ThemedText>
              {later.slice(0, 3).map((c) => (
                <View key={c.id} style={styles.row}>
                  <ThemedText type="small" style={styles.rowTitle} numberOfLines={1}>
                    <ThemedText type="smallBold">{c.code}</ThemedText> – {c.title}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.time}>
                    {when(c.start)}
                    {formatRange(c.start, c.end)}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={styles.list}>
          <ThemedText type="small" themeColor="textSecondary">
            {entries.length
              ? 'That is the week done. Nothing left on your schedule.'
              : 'Add your classes once and Orbit will count down to the next one for you.'}
          </ThemedText>
          <Button label="Add a class" icon="add" onPress={() => router.push('/schedule')} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexGrow: 1 },
  next: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  nextBody: { gap: Spacing.half, flexShrink: 1 },
  room: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, marginTop: Spacing.one },
  list: { gap: Spacing.two },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  rowTitle: { flexShrink: 1 },
  time: { flexShrink: 0 },
});
