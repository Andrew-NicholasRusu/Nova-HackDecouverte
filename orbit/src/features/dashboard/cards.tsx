import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Spacing } from '@/constants/theme';
import { describeFriendNow, hm, nextSharedWindow } from '@/features/friends/describe';
import { useFriends } from '@/features/friends/store';
import { describeEstimate } from '@/features/live/location-card';
import { estimateFor, LEVEL_LABEL, useLive } from '@/features/live/store';
import type { Campus } from '@/features/profile/use-profile';
import { useClassEvents } from '@/features/schedule/store';

/** PLAN.md §3.2 E — who's free now, and the next free time together. */
export function FriendsCard({ now }: { now: Date }) {
  const friends = useFriends();
  const schedule = useClassEvents();

  if (friends.status === 'error') return null;
  if (friends.friends.length === 0) {
    return (
      <Card>
        <ThemedText type="heading">Friends</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {friends.incoming.length > 0
            ? `You have ${friends.incoming.length} friend ${friends.incoming.length === 1 ? 'request' : 'requests'} waiting.`
            : 'Add friends to see when you are both free between classes.'}
        </ThemedText>
        <Button label={friends.incoming.length > 0 ? 'Review requests' : 'Find friends'} variant="secondary" onPress={() => router.push('/friends')} />
      </Card>
    );
  }

  const freeNow = friends.friends.filter((f) => describeFriendNow(f, now).free === true);
  const best = friends.friends
    .map((f) => ({ friend: f, shared: nextSharedWindow(schedule.events, f, now) }))
    .filter((x) => x.shared?.when === 'today')
    .sort((a, b) => a.shared!.window.start.getTime() - b.shared!.window.start.getTime())[0];

  return (
    <Card>
      <View style={styles.row}>
        <ThemedText type="heading">Friends</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {freeNow.length} free now
        </ThemedText>
      </View>
      {freeNow.length > 0 ? (
        <ThemedText type="small">
          {freeNow
            .slice(0, 3)
            .map((f) => f.displayName.split(' ')[0])
            .join(', ')}
          {freeNow.length > 3 ? ` and ${freeNow.length - 3} more` : ''} {freeNow.length === 1 ? 'is' : 'are'} free right now.
        </ThemedText>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          No friends sharing a free moment right now.
        </ThemedText>
      )}
      {best ? (
        <ThemedText type="small" themeColor="textSecondary">
          Next free time together: {best.friend.displayName.split(' ')[0]}, {hm(best.shared!.window.start)}–
          {hm(best.shared!.window.end)}
        </ThemedText>
      ) : null}
      {friends.incoming.length > 0 ? (
        <ThemedText type="small" themeColor="accent">
          {friends.incoming.length} new friend {friends.incoming.length === 1 ? 'request' : 'requests'}
        </ThemedText>
      ) : null}
      <Button label="Open Friends" variant="secondary" onPress={() => router.push('/friends')} />
    </Card>
  );
}

/** PLAN.md §3.2 F — freshest community reports on your campus. */
export function LiveCard({ now, campus }: { now: Date; campus: Campus | null }) {
  const live = useLive();
  if (live.status === 'error' || live.locations.length === 0) return null;

  const items = live.locations
    .filter((l) => !campus || l.campus === campus)
    .map((l) => ({ location: l, estimate: estimateFor(l, now) }))
    .sort((a, b) => (a.estimate.newestMinutes ?? 999) - (b.estimate.newestMinutes ?? 999))
    .slice(0, 3);

  return (
    <Card>
      <View style={styles.row}>
        <ThemedText type="heading">Campus Live</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          Student reports
        </ThemedText>
      </View>
      {items.map(({ location, estimate }) => (
        <View key={location.id} style={styles.item}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {location.name} ·{' '}
            <ThemedText type="small" themeColor={estimate.level === null ? 'textSecondary' : 'text'}>
              {estimate.level === null ? 'no recent reports' : LEVEL_LABEL[location.category][estimate.level]}
            </ThemedText>
          </ThemedText>
          {estimate.level !== null ? (
            <ThemedText type="caption" themeColor="textSecondary">
              {describeEstimate(estimate)}
            </ThemedText>
          ) : null}
        </View>
      ))}
      <Button label="Open Campus Live" variant="secondary" onPress={() => router.push('/live')} />
    </Card>
  );
}

/** PLAN.md §3.2 G — quick actions. */
export function QuickActions() {
  return (
    <View style={styles.actions}>
      <Chip label="+ Add class" onPress={() => router.push('/schedule')} />
      <Chip label="Find a room" onPress={() => router.push('/navigator')} />
      <Chip label="Find friends" onPress={() => router.push('/friends')} />
      <Chip label="Report a line" onPress={() => router.push('/live')} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  item: { gap: Spacing.half },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
