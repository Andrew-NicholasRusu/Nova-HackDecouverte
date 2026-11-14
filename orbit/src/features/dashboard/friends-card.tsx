import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { Spacing } from '@/constants/theme';
import { statusOf, useFriends } from '@/features/friends/use-friends';
import { SAMPLE_DATA } from '@/lib/sample';

const SHOWN = 3;

export function FriendsCard() {
  const { friends, freeNow, now } = useFriends();
  const free = freeNow.slice(0, SHOWN);
  const extra = freeNow.length - free.length;

  return (
    <Card style={styles.card}>
      <CardHeader
        icon="group"
        title="Friends"
        actionLabel="View all"
        onAction={() => router.push('/friends')}
        sample={SAMPLE_DATA}
      />
      {friends.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Add friends and you will see who is free for a coffee between classes.
        </ThemedText>
      ) : free.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Everyone is in class right now. {statusOf(friends[0], now).kind === 'class' ? 'Check back at the next break.' : ''}
        </ThemedText>
      ) : (
        <>
          <View style={styles.avatars}>
            {free.map((f) => (
              <Avatar key={f.id} name={f.name} size="lg" presence="free" />
            ))}
            {extra > 0 && <Pill label={`+${extra}`} />}
          </View>
          <ThemedText type="small" accessibilityLiveRegion="polite">
            <ThemedText type="smallBold" themeColor="success">
              {freeNow.length}
            </ThemedText>{' '}
            {freeNow.length === 1 ? 'friend is' : 'friends are'} free now
          </ThemedText>
        </>
      )}
      <Button label="Find a study buddy" variant="secondary" iconEnd="arrow-forward" onPress={() => router.push('/friends')} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexGrow: 1 },
  avatars: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
});
