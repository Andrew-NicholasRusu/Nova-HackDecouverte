import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';
import { Opacity, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { describeFriendNow, hm, nextSharedWindow } from '@/features/friends/describe';
import { useFriends } from '@/features/friends/store';
import { LEVEL_SHORT, estimateFor, useLive } from '@/features/live/store';
import type { Campus } from '@/features/profile/use-profile';
import { useClassEvents } from '@/features/schedule/store';
import { useTheme } from '@/hooks/use-theme';

const SHOWN = 4;

/** Who is free now, and the next free time together. */
export function FriendsCard({ now }: { now: Date }) {
  const friends = useFriends();
  const schedule = useClassEvents();

  if (friends.status === 'error') return null;
  const freeNow = friends.friends.filter((f) => describeFriendNow(f, now).free === true);
  const best = friends.friends
    .map((f) => ({ friend: f, shared: nextSharedWindow(schedule.events, f, now) }))
    .filter((x) => x.shared?.when === 'today')
    .sort((a, b) => a.shared!.window.start.getTime() - b.shared!.window.start.getTime())[0];

  return (
    <Card>
      <CardHeader icon="group" title="Friends" actionLabel="View all" onAction={() => router.push('/friends')} />
      {friends.friends.length === 0 ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {friends.incoming.length > 0
              ? `You have ${friends.incoming.length} friend ${friends.incoming.length === 1 ? 'request' : 'requests'} waiting.`
              : 'Add friends to see when you are both free between classes.'}
          </ThemedText>
          <Button label={friends.incoming.length > 0 ? 'Review requests' : 'Find friends'} icon="person-add" variant="secondary" onPress={() => router.push('/friends')} />
        </>
      ) : (
        <>
          {freeNow.length > 0 ? (
            <View style={styles.avatars}>
              {freeNow.slice(0, SHOWN).map((f) => (
                <Avatar key={f.id} name={f.displayName} uri={f.avatarUrl} size="lg" presence="free" />
              ))}
              {freeNow.length > SHOWN ? <Pill label={`+${freeNow.length - SHOWN}`} /> : null}
            </View>
          ) : null}
          <ThemedText type="small" themeColor={freeNow.length ? 'text' : 'textSecondary'} accessibilityLiveRegion="polite">
            {freeNow.length
              ? `${freeNow.slice(0, 2).map((f) => f.displayName.split(' ')[0]).join(', ')}${freeNow.length > 2 ? ` and ${freeNow.length - 2} more` : ''} ${freeNow.length === 1 ? 'is' : 'are'} free right now.`
              : 'Nobody is free right now.'}
          </ThemedText>
          {best ? (
            <ThemedText type="caption" themeColor="accentLink">
              Next together: {best.friend.displayName.split(' ')[0]}, {hm(best.shared!.window.start)}–{hm(best.shared!.window.end)}
            </ThemedText>
          ) : null}
        </>
      )}
      {friends.incoming.length > 0 && friends.friends.length > 0 ? (
        <Pill label={`${friends.incoming.length} new ${friends.incoming.length === 1 ? 'request' : 'requests'}`} tone="gold" />
      ) : null}
    </Card>
  );
}

/** Freshest community reports on your campus. */
export function LiveCard({ now, campus }: { now: Date; campus: Campus | null }) {
  const live = useLive();
  const theme = useTheme();
  if (live.status === 'error') return null;

  const items = live.locations
    .filter((l) => !campus || l.campus === campus)
    .map((l) => ({ location: l, estimate: estimateFor(l, now) }))
    .sort((a, b) => (a.estimate.level ?? 9) - (b.estimate.level ?? 9))
    .slice(0, 3);

  return (
    <Card>
      <CardHeader icon="sensors" title="Campus Live" actionLabel="View all" onAction={() => router.push('/live')} />
      {items.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Student reports on lines and seats show up here.
        </ThemedText>
      ) : (
        items.map(({ location, estimate }) => (
          <Pressable
            key={location.id}
            accessibilityRole="button"
            accessibilityLabel={`${location.name}: ${estimate.level === null ? 'no recent reports' : LEVEL_SHORT[location.category][estimate.level]}`}
            onPress={() => router.push({ pathname: '/live', params: { place: location.id } })}
            style={({ pressed }) => [styles.row, pressed && { opacity: Opacity.pressed }]}>
            <View style={[styles.tile, { backgroundColor: theme.accentTint }]}>
              <Icon name={location.category === 'food' ? 'restaurant' : 'chair'} size="lg" color="accentLink" />
            </View>
            <View style={styles.grow}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {location.name}
              </ThemedText>
              <ThemedText
                type="small"
                themeColor={estimate.level === null ? 'textSecondary' : estimate.level <= 1 ? 'success' : estimate.level === 2 ? 'warning' : 'danger'}
                numberOfLines={1}>
                {estimate.level === null ? 'No recent reports' : LEVEL_SHORT[location.category][estimate.level]}
              </ThemedText>
            </View>
            <Icon name="chevron-right" size="md" color="textSecondary" />
          </Pressable>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  avatars: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  row: { minHeight: TouchTarget + Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  tile: { width: TouchTarget, height: TouchTarget, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1, gap: Spacing.half },
});
