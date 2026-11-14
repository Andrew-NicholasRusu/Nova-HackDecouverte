import { Grid } from '@/components/layout/grid';
import { Screen } from '@/components/layout/screen';
import { FriendsCard, LiveCard } from '@/features/dashboard/components/cards';
import { Hero } from '@/features/dashboard/components/hero';
import { MapCard } from '@/features/dashboard/components/map-card';
import { NextClassCard } from '@/features/dashboard/components/next-class-card';
import { PlanCard } from '@/features/dashboard/components/plan-card';
import { QuickAccessCard } from '@/features/dashboard/components/quick-access-card';
import { useProfile } from '@/features/profile/use-profile';
import { useLayout } from '@/hooks/use-layout';
import { useNow } from '@/hooks/use-now';

/** Home dashboard: photo hero over a responsive grid of data-driven cards. */
export function DashboardScreen() {
  const { isWide, isMedium } = useLayout();
  const profile = useProfile();
  const now = useNow();

  const firstName = profile?.display_name?.split(' ')[0];

  return (
    <Screen title="Home" hero={<Hero name={firstName} />}>
      <PlanCard />
      <Grid row={isWide} weights={[1, 1.15]}>
        <NextClassCard />
        <MapCard />
      </Grid>
      <Grid row={isWide || isMedium} weights={isWide ? [1, 1.2, 1] : [1, 1]}>
        <FriendsCard now={now} />
        <LiveCard now={now} campus={profile?.preferred_campus ?? null} />
        <QuickAccessCard />
      </Grid>
    </Screen>
  );
}
