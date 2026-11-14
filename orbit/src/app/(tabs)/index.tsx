import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import {
  CampusCard,
  FriendsCard,
  LiveCard,
  QuickAccessCard,
  ScheduleCard,
} from '@/features/dashboard/dashboard-cards';
import { DashboardHero } from '@/features/dashboard/dashboard-hero';
import { useLayout } from '@/hooks/use-layout';
import { useProfile } from '@/providers/profile-provider';

/** Dashboard (PLAN.md §3): hero + module cards. Cards show real data or honest empty states. */
export default function DashboardScreen() {
  const profile = useProfile();
  const { wide } = useLayout();
  if (!profile) return null; // AppGate guarantees a profile before rendering tabs.

  return (
    <Screen header={<DashboardHero profile={profile} />} maxWidth={1240}>
      <View style={[styles.row, wide && styles.rowWide]}>
        <View style={wide ? styles.col2 : undefined}>
          <ScheduleCard />
        </View>
        <View style={wide ? styles.col3 : undefined}>
          <CampusCard profile={profile} />
        </View>
      </View>
      <View style={[styles.row, wide && styles.rowWide]}>
        <View style={wide ? styles.col1 : undefined}>
          <FriendsCard />
        </View>
        <View style={wide ? styles.col1 : undefined}>
          <LiveCard />
        </View>
        <View style={wide ? styles.col1 : undefined}>
          <QuickAccessCard />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.three },
  rowWide: { flexDirection: 'row', alignItems: 'stretch' },
  col1: { flex: 1 },
  col2: { flex: 2 },
  col3: { flex: 3 },
});
