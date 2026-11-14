import { Hero } from '@/features/dashboard/hero';
import { FriendsCard } from '@/features/dashboard/friends-card';
import { Grid } from '@/features/dashboard/grid';
import { LiveCard } from '@/features/dashboard/live-card';
import { MapCard } from '@/features/dashboard/map-card';
import { QuickAccessCard } from '@/features/dashboard/quick-access-card';
import { ScheduleCard } from '@/features/dashboard/schedule-card';
import { ALERTS } from '@/features/live/catalog';
import { useProfile } from '@/features/profile/use-profile';
import { Screen } from '@/components/ui/screen';
import { useLayout } from '@/hooks/use-layout';
import { useAuth } from '@/providers/auth-provider';

/** Home dashboard: photo hero over a responsive grid of data-driven cards. */
export default function DashboardScreen() {
  const { isWide, isMedium } = useLayout();
  const { session } = useAuth();
  const profile = useProfile();

  const fullName = profile?.display_name ?? session?.user.email ?? 'Student';
  const firstName = profile?.display_name?.split(' ')[0];

  return (
    <Screen
      title="Home"
      hero={<Hero name={firstName} fullName={fullName} unread={ALERTS.length} />}>
      <Grid row={isWide} weights={[1, 1.15]}>
        <ScheduleCard />
        <MapCard />
      </Grid>
      <Grid row={isWide || isMedium} weights={isWide ? [1, 1.2, 1] : [1, 1]}>
        <FriendsCard />
        <LiveCard />
        <QuickAccessCard />
      </Grid>
    </Screen>
  );
}
