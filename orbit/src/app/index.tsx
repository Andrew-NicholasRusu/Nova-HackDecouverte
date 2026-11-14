import { Hero } from '@/features/dashboard/hero';
import { FriendsCard, LiveCard } from '@/features/dashboard/cards';
import { Grid } from '@/features/dashboard/grid';
import { MapCard } from '@/features/dashboard/map-card';
import { QuickAccessCard } from '@/features/dashboard/quick-access-card';
import { useProfile } from '@/features/profile/use-profile';
import { NextClassCard, TodayCard } from '@/features/schedule/dashboard-cards';
import { useNow } from '@/features/schedule/format';
import { Screen } from '@/components/ui/screen';
import { useLayout } from '@/hooks/use-layout';
import { useAuth } from '@/providers/auth-provider';

/** Home dashboard: photo hero over a responsive grid of data-driven cards. */
export default function DashboardScreen() {
  const { isWide, isMedium } = useLayout();
  const { session } = useAuth();
  const profile = useProfile();
  const now = useNow();

  const fullName = profile?.display_name ?? session?.user.email ?? 'Student';
  const firstName = profile?.display_name?.split(' ')[0];

  return (
    <Screen title="Home" hero={<Hero name={firstName} fullName={fullName} unread={0} />}>
      <Grid row={isWide} weights={[1, 1.15]}>
        <NextClassCard />
        <MapCard />
      </Grid>
      <Grid row={isWide || isMedium} weights={isWide ? [1, 1.2, 1] : [1, 1]}>
        <FriendsCard now={now} />
        <LiveCard now={now} campus={profile?.preferred_campus ?? null} />
        <QuickAccessCard />
      </Grid>
      <TodayCard />
    </Screen>
  );
}
