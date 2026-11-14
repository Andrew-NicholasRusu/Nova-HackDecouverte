import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { FriendsCard, LiveCard, QuickActions } from '@/features/dashboard/cards';
import { ProfileSheet } from '@/features/profile/profile-sheet';
import { useProfile } from '@/features/profile/use-profile';
import { busyStatusAt } from '@/features/schedule/availability';
import { NextClassCard, TodayCard } from '@/features/schedule/dashboard-cards';
import { calculateNextClass } from '@/features/schedule/engine';
import { useNow } from '@/features/schedule/format';
import { useClassEvents } from '@/features/schedule/store';

function greeting(date: Date) {
  const h = date.getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const CAMPUS_NAME = { SGW: 'Sir George Williams campus', LOY: 'Loyola campus' } as const;

/**
 * Dashboard (PLAN.md §3): where am I going, who is available, what's happening.
 * Card order adapts to the moment (§3.3).
 */
export default function DashboardScreen() {
  const profile = useProfile();
  const schedule = useClassEvents();
  const now = useNow();
  const [profileOpen, setProfileOpen] = useState(false);
  const name = profile?.display_name?.split(' ')[0];

  // Context: a long break now → friends first; class starting soon → next class stays on top;
  // no classes left today → campus activity before the (empty) day.
  const { next } = calculateNextClass(schedule.events, now);
  const status = busyStatusAt(schedule.events, now);
  const minutesToNext = next ? (next.start.getTime() - now.getTime()) / 60_000 : Infinity;
  const longBreak = status.state === 'free' && minutesToNext >= 60 && minutesToNext < 12 * 60;

  const friends = <FriendsCard key="friends" now={now} />;
  const live = <LiveCard key="live" now={now} campus={profile?.preferred_campus ?? null} />;
  const today = <TodayCard key="today" />;
  const ordered = longBreak ? [friends, live, today] : [today, friends, live];

  return (
    <Screen
      title={name ? `${greeting(now)}, ${name}` : greeting(now)}
      subtitle={profile?.preferred_campus ? CAMPUS_NAME[profile.preferred_campus] : 'Your university, in one orbit.'}>
      <NextClassCard />
      <QuickActions />
      {ordered}
      <View style={styles.profile}>
        <Button label="Profile & settings" variant="secondary" onPress={() => setProfileOpen(true)} disabled={!profile} />
      </View>
      {profileOpen && profile ? <ProfileSheet profile={profile} onClose={() => setProfileOpen(false)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { marginTop: Spacing.two },
});
