import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { Skeleton } from '@/components/ui/skeleton';
import { Radius, Spacing } from '@/constants/theme';

import { ClassBlock } from './class-block';
import { calculateFreePeriods, calculateNextClass, occurrencesOnDate } from './engine';
import { formatDuration, formatLocation, formatStartsIn, useNow } from './format';
import { courseColor, toLocalDate, type ClassEvent } from './model';
import { useClassEvents } from './store';

/** Molson (MB) has indoor floor plans; everything else opens the building directory. */
function openRoom(event: ClassEvent) {
  router.push({
    pathname: '/navigator',
    params: { building: event.buildingCode, ...(event.buildingCode === 'MB' && event.room ? { room: `MB-${event.room}` } : {}) },
  });
}

/** What's on now / next, with a live countdown and a route to the room. */
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
      <Card>
        <CardHeader icon="event" title="Next class" />
        <ThemedText type="small" themeColor="textSecondary">
          Add your classes once and Orbit counts down to the next one for you.
        </ThemedText>
        <Button label="Set up my schedule" icon="add" onPress={() => router.push('/schedule')} />
      </Card>
    );
  }

  const { current, next } = calculateNextClass(schedule.events, now);
  const occ = current ?? next;
  if (!occ) {
    return (
      <Card>
        <CardHeader icon="event" title="Next class" />
        <ThemedText type="small" themeColor="textSecondary">
          Nothing scheduled in the next few months. Add next term&apos;s classes when you have them.
        </ThemedText>
        <Button label="Open Schedule" variant="secondary" onPress={() => router.push('/schedule')} />
      </Card>
    );
  }

  const e = occ.event;
  const color = courseColor(e);
  const countdown = current
    ? `Ends in ${formatDuration(Math.max(1, Math.round((occ.end.getTime() - now.getTime()) / 60_000)))}`
    : formatStartsIn(occ.start, now);

  return (
    <Card>
      <CardHeader icon="event" title={current ? 'In class now' : 'Next class'} actionLabel="Schedule" onAction={() => router.push('/schedule')} />
      <View style={styles.codeRow}>
        <View style={[styles.swatch, { backgroundColor: color }]} />
        <View style={styles.grow}>
          <ThemedText type="subtitle">{e.courseCode}</ThemedText>
          {e.title ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {e.title}
            </ThemedText>
          ) : null}
        </View>
      </View>
      <ThemedText type="stat" themeColor="accentLink" accessibilityLiveRegion="polite">
        {countdown}
      </ThemedText>
      <View style={styles.meta}>
        <Pill label={`${e.startTime}–${e.endTime}`} />
        {e.buildingCode ? <Pill label={formatLocation(e)} tone="accent" /> : null}
      </View>
      {e.buildingCode ? <Button label={`Find ${formatLocation(e)}`} icon="near-me" onPress={() => openRoom(e)} /> : null}
      {current && next && toLocalDate(next.start) === toLocalDate(now) ? (
        <ThemedText type="small" themeColor="textSecondary">
          Then {next.event.courseCode} at {next.event.startTime} · {formatLocation(next.event)}
        </ThemedText>
      ) : null}
    </Card>
  );
}

/** Today's classes and breaks. Hidden when there's nothing today. */
export function TodayCard() {
  const schedule = useClassEvents();
  const now = useNow();
  const today = occurrencesOnDate(schedule.events, toLocalDate(now));
  if (today.length === 0) return null;

  const remaining = today.filter((o) => o.end > now).length;
  const longestBreak = calculateFreePeriods(today.filter((o) => o.end > now), 30).sort((a, b) => b.minutes - a.minutes)[0];

  return (
    <Card>
      <CardHeader icon="today" title={remaining === 0 ? 'Today · done for the day' : `Today · ${remaining} left`} actionLabel="Schedule" onAction={() => router.push('/schedule')} />
      <View style={styles.list}>
        {today.map((o, i) => (
          <ClassBlock
            key={`${o.event.id}-${i}`}
            event={o.event}
            status={o.start <= now && o.end > now ? 'now' : o.end <= now ? 'done' : undefined}
            onPress={() => router.push('/schedule')}
          />
        ))}
      </View>
      {longestBreak ? (
        <ThemedText type="small" themeColor="textSecondary">
          Longest break: {formatDuration(longestBreak.minutes)} from{' '}
          {String(longestBreak.start.getHours()).padStart(2, '0')}:{String(longestBreak.start.getMinutes()).padStart(2, '0')}
        </ThemedText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  swatch: { width: Spacing.three, height: Spacing.five, borderRadius: Radius.pill },
  grow: { flex: 1 },
  meta: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  list: { gap: Spacing.two },
});
