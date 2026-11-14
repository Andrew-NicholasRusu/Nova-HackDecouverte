import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { calculateFreePeriods, calculateNextClass } from '@/lib/schedule/insights';
import { expandOccurrences } from '@/lib/schedule/recurrence';
import { formatDateLabel, formatDuration, todayIn } from '@/lib/schedule/time';

import { OccurrenceCard } from './occurrence-card';
import { useSchedule } from './schedule-provider';

/** Re-render every 30 s so countdowns stay current. */
function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Dashboard section: next class countdown and today's overview (PLAN.md §3.2). */
export function NextClassCard() {
  const { status, active, events, timeZone } = useSchedule();
  const now = useNow();

  if (status === 'loading') {
    return (
      <Card>
        <Skeleton width="35%" height={14} />
        <Skeleton height={56} />
      </Card>
    );
  }

  if (status === 'error' || !active || events.length === 0) {
    return (
      <EmptyState
        title="No upcoming class"
        message="Add your classes to see your next class and a countdown here."
        actionLabel="Open Schedule"
        onAction={() => router.push('/schedule')}
      />
    );
  }

  const today = todayIn(timeZone, now);
  const todays = expandOccurrences(events, today, today, timeZone);
  const remaining = todays.filter((o) => o.end.getTime() > now.getTime());
  const next = calculateNextClass(events, now, timeZone);
  const free = calculateFreePeriods(remaining.map((o) => o.event)).filter(
    (f) => f.minutes >= 60,
  );

  let heading = 'No more classes in the next two weeks';
  let badge: string | null = null;
  if (next) {
    const o = next.occurrence;
    if (next.inProgress) {
      heading = `In class · ends in ${formatDuration(o.end.getTime() - now.getTime())}`;
      badge = 'Now';
    } else {
      const wait = formatDuration(o.start.getTime() - now.getTime());
      heading = o.date === today ? `Next class in ${wait}` : `Next class ${formatDateLabel(o.date)}`;
      badge = o.date === today ? `in ${wait}` : null;
    }
  }

  return (
    <Card>
      <ThemedText type="heading">{heading}</ThemedText>
      {next ? (
        <OccurrenceCard
          occurrence={next.occurrence}
          badge={badge}
          onPress={() => router.push('/schedule')}
        />
      ) : null}
      <View style={styles.summary}>
        <ThemedText type="small" themeColor="textSecondary">
          {todays.length === 0
            ? 'No classes today.'
            : remaining.length === 0
              ? `Done for today · ${todays.length} class${todays.length === 1 ? '' : 'es'}`
              : `${remaining.length} of ${todays.length} class${todays.length === 1 ? '' : 'es'} left today`}
        </ThemedText>
        {free.map((f) => (
          <ThemedText key={f.start} type="small" themeColor="textSecondary">
            Free {f.start}–{f.end} ({formatDuration(f.minutes * 60_000)})
          </ThemedText>
        ))}
      </View>
      <Button label="Open Schedule" variant="secondary" onPress={() => router.push('/schedule')} />
    </Card>
  );
}

const styles = StyleSheet.create({
  summary: { gap: Spacing.half },
});
