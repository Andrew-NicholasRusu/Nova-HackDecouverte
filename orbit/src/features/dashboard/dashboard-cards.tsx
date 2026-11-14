import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { SectionCard } from '@/components/ui/section-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Radius, Spacing } from '@/constants/theme';
import { useBuildings } from '@/features/navigator/use-buildings';
import { campusName, type Profile } from '@/features/profile/profile-schema';
import { useTheme } from '@/hooks/use-theme';
import { isHovered } from '@/lib/pressable';

/* ---------- My Schedule ---------- */

export function ScheduleCard() {
  return (
    <SectionCard icon="schedule" title="My Schedule" href="/schedule">
      <View style={styles.empty}>
        <ThemedText type="heading">No upcoming class</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Add or import your classes to see your next class, a countdown and today&apos;s schedule
          here.
        </ThemedText>
      </View>
      <Button label="Add your classes" onPress={() => router.push('/schedule')} />
    </SectionCard>
  );
}

/* ---------- Campus ---------- */

export function CampusCard({ profile }: { profile: Profile }) {
  const theme = useTheme();
  const data = useBuildings();
  const campus = profile.preferred_campus;
  const buildings =
    data.status === 'ready' ? data.buildings.filter((b) => b.campus === campus) : [];

  return (
    <SectionCard icon="map" title="Campus Map" actionLabel="Open map" href="/navigator">
      <View style={[styles.campusPanel, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="caption" themeColor="textSecondary">
          YOUR CAMPUS
        </ThemedText>
        <ThemedText type="subtitle">{campusName(campus) ?? 'Concordia'}</ThemedText>

        {data.status === 'loading' && (
          <View style={styles.chips}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} width={52} height={28} />
            ))}
          </View>
        )}
        {data.status === 'error' && (
          <ThemedText type="small" themeColor="danger">
            Couldn&apos;t load buildings. {data.message}
          </ThemedText>
        )}
        {data.status === 'ready' && (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              {buildings.length} buildings · Source: Concordia Open Data
            </ThemedText>
            <View style={styles.chips}>
              {buildings.slice(0, 8).map((b) => (
                <Pressable
                  key={b.code}
                  accessibilityRole="link"
                  accessibilityLabel={`${b.code}, ${b.longName}`}
                  onPress={() => router.push({ pathname: '/navigator', params: { q: b.code } })}
                  style={[styles.chip, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                  <ThemedText type="smallBold">{b.code}</ThemedText>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Button label="Find a building" variant="secondary" onPress={() => router.push('/navigator')} />
        </View>
        <View style={styles.flex}>
          <Button label="Floor plans" variant="secondary" onPress={() => router.push('/floorplan')} />
        </View>
      </View>
    </SectionCard>
  );
}

/* ---------- Friends ---------- */

export function FriendsCard() {
  return (
    <SectionCard icon="friends" title="Friends" href="/friends">
      <ThemedText type="small" themeColor="textSecondary">
        Connect with friends to see who&apos;s free between classes. You decide what you share.
      </ThemedText>
      <Button label="Find a study buddy" variant="secondary" onPress={() => router.push('/friends')} />
    </SectionCard>
  );
}

/* ---------- Campus Live ---------- */

const LIVE_ROWS: { icon: IconName; title: string }[] = [
  { icon: 'cafe', title: 'Cafeterias' },
  { icon: 'study', title: 'Study spaces' },
  { icon: 'live', title: 'Campus updates' },
];

export function LiveCard() {
  const theme = useTheme();
  return (
    <SectionCard icon="live" title="Campus Live" href="/live">
      {LIVE_ROWS.map((r) => (
        <View key={r.title} style={[styles.liveRow, { borderColor: theme.border }]}>
          <View style={[styles.liveIcon, { backgroundColor: theme.backgroundSelected }]}>
            <Icon name={r.icon} color={theme.accent} />
          </View>
          <View style={styles.flex}>
            <ThemedText type="smallBold">{r.title}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              No recent reports
            </ThemedText>
          </View>
        </View>
      ))}
    </SectionCard>
  );
}

/* ---------- Quick access ---------- */

const QUICK: { icon: IconName; label: string; href: Href }[] = [
  { icon: 'import', label: 'Import schedule', href: '/schedule' },
  { icon: 'directions', label: 'Find a building', href: '/navigator' },
  { icon: 'share', label: 'Share schedule', href: '/friends' },
  { icon: 'cafe', label: 'Check cafeteria', href: '/live' },
];

export function QuickAccessCard() {
  const theme = useTheme();
  return (
    <SectionCard icon="bolt" title="Quick Access">
      <View style={styles.grid}>
        {QUICK.map((q) => (
          <Pressable
            key={q.label}
            accessibilityRole="button"
            onPress={() => router.push(q.href)}
            style={(state) => [
              styles.tile,
              { borderColor: theme.border, backgroundColor: theme.background },
              (state.pressed || isHovered(state)) && { backgroundColor: theme.backgroundSelected },
            ]}>
            <Icon name={q.icon} size={24} />
            <ThemedText type="small" style={styles.center}>
              {q.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: Spacing.two },
  center: { textAlign: 'center' },
  empty: { gap: Spacing.one },
  campusPanel: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    minWidth: 44,
    minHeight: 32,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  liveIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 88,
    borderWidth: 1,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
  },
});
