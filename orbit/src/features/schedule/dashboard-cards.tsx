import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';

import { ClassBlock } from './class-block';
import { calculateFreePeriods, calculateNextClass, occurrencesOnDate } from './engine';
import { formatDuration, formatLocation, formatStartsIn, useNow } from './format';
import { courseColor, toLocalDate, type ClassEvent } from './model';
import { useClassEvents } from './store';

/** Molson (MB) has indoor floor plans; everything else opens the building directory. */
function openRoom(event: ClassEvent) {
  router.push(event.buildingCode === 'MB' ? '/floorplan' : '/navigator');
}

/** Dashboard hero (PLAN.md §3.2 B): what's on now / next, with a countdown and a route to the room. */
export function NextClassCard() {
  const schedule = useClassEvents();
  const now = useNow();

  if (schedule.events.length === 0) {
    if (schedule.status !== 'ready') {
      return (
        <Card>
          <Skeleton width="30%" />
          <Skeleton width="60%" height={24} />
          <Skeleton width="45%" />
        </Card>
      );
    }
    return (
      <EmptyState
        title="No classes yet"
        message="Add your classes to see your next class and a countdown here."
        actionLabel="Set up my schedule"
        onAction={() => router.push('/schedule')}
      />
    );
  }

  const { current, next } = calculateNextClass(schedule.events, now);
  const occ = current ?? next;
  if (!occ) {
    return (
      <Card>
        <ThemedText type="heading">No upcoming classes</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Nothing scheduled in the next few months. Add next term&apos;s classes when you have them.
        </ThemedText>
        <Button label="Open Schedule" variant="secondary" onPress={() => router.push('/schedule')} />
      </Card>
    );
  }

  const e = occ.event;
  const color = courseColor(e);
  const label = current
    ? `Now · ends in ${formatDuration(Math.max(1, Math.round((occ.end.getTime() - now.getTime()) / 60_000)))}`
    : `Next class · ${formatStartsIn(occ.start, now)}`;

  return (
    <Card style={[styles.hero, { borderLeftColor: color }]}>
      <ThemedText type="caption" style={{ color }}>
        {label.toUpperCase()}
      </ThemedText>
      <View>
        <ThemedText type="subtitle">{e.courseCode}</ThemedText>
        {e.title ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {e.title}
          </ThemedText>
        ) : null}
      </View>
      <ThemedText type="default">
        {e.startTime}–{e.endTime} · {formatLocation(e)}
      </ThemedText>
      {e.buildingCode ? (
        <Button label={`Find ${formatLocation(e)}`} onPress={() => openRoom(e)} />
      ) : null}
      {current && next && toLocalDate(next.start) === toLocalDate(now) ? (
        <ThemedText type="small" themeColor="textSecondary">
          Then {next.event.courseCode} at {next.event.startTime} · {formatLocation(next.event)}
        </ThemedText>
      ) : null}
    </Card>
  );
}

/** Today's classes and breaks (PLAN.md §3.2 C). Hidden when there's nothing today. */
export function TodayCard() {
  const schedule = useClassEvents();
  const now = useNow();
  const today = occurrencesOnDate(schedule.events, toLocalDate(now));
  if (today.length === 0) return null;

  const remaining = today.filter((o) => o.end > now).length;
  const longestBreak = calculateFreePeriods(today.filter((o) => o.end > now), 30).sort((a, b) => b.minutes - a.minutes)[0];

  return (
    <Card>
      <View style={styles.row}>
        <ThemedText type="heading">Today</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {remaining === 0 ? 'Done for the day' : `${remaining} left`}
        </ThemedText>
      </View>
      {today.map((o, i) => (
        <ClassBlock
          key={`${o.event.id}-${i}`}
          event={o.event}
          status={o.start <= now && o.end > now ? 'now' : o.end <= now ? 'done' : undefined}
          onPress={() => router.push('/schedule')}
        />
      ))}
      {longestBreak ? (
        <ThemedText type="small" themeColor="textSecondary">
          Longest break: {formatDuration(longestBreak.minutes)} from{' '}
          {String(longestBreak.start.getHours()).padStart(2, '0')}:
          {String(longestBreak.start.getMinutes()).padStart(2, '0')}
        </ThemedText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: { borderLeftWidth: 4, gap: Spacing.two },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
});
