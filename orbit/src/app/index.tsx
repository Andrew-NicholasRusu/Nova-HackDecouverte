import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/features/profile/use-profile';
import { supabase } from '@/lib/supabase';

function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Dashboard shell (PLAN.md §3). Real data is wired in as each module lands. */
export default function DashboardScreen() {
  const profile = useProfile();
  const name = profile?.display_name?.split(' ')[0];

  return (
    <Screen
      title={name ? `${greeting()}, ${name}` : greeting()}
      subtitle="Your university, in one orbit.">
      <EmptyState
        title="No upcoming class"
        message="Add your classes to see your next class and a countdown here."
        actionLabel="Open Schedule"
        onAction={() => router.push('/schedule')}
      />

      <Card>
        <ThemedText type="heading">Find a room</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Browse Concordia buildings on both campuses.
        </ThemedText>
        <Button label="Open Navigator" onPress={() => router.push('/navigator')} />
      </Card>

      <Card>
        <ThemedText type="heading">Friends & Campus Live</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Friend availability and community reports will show up here.
        </ThemedText>
      </Card>

      <Button label="Sign out" variant="secondary" onPress={() => supabase.auth.signOut()} />
    </Screen>
  );
}
