import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { useBrain } from '@/features/brain/use-brain';
import { REPORT_MAX_AGE_MIN } from '@/features/live/confidence';
import { LocationCard } from '@/features/live/location-card';
import { estimateFor, loadLive, useLive, type LiveCategory, type LiveLocation } from '@/features/live/store';
import { useBuildingIndex } from '@/features/navigator/use-buildings';
import { useProfile } from '@/features/profile/use-profile';
import { useNow } from '@/features/schedule/format';
import { useLayout } from '@/hooks/use-layout';
import { walkMinutes } from '@/lib/geo';
import { usePersisted } from '@/lib/persisted-store';

const SECTIONS: { category: LiveCategory; title: string }[] = [
  { category: 'food', title: 'Food and lines' },
  { category: 'study', title: 'Study spaces' },
];

export default function LiveScreen() {
  const params = useLocalSearchParams<{ place?: string }>();
  const live = useLive();
  const profile = useProfile();
  const plan = useBrain();
  const index = useBuildingIndex();
  const now = useNow();
  const { isMedium } = useLayout();
  const [campus, setCampus] = usePersisted<'SGW' | 'LOY' | 'ALL' | null>('orbit.live.campus', null);
  const selected = campus ?? profile?.preferred_campus ?? 'ALL';

  const walkTo = (l: LiveLocation) => {
    const from = plan.here ?? plan.nextBuilding;
    const to = index.get(l.buildingCode.toUpperCase());
    if (!from || !to || from.latitude == null || from.longitude == null || to.latitude == null || to.longitude == null) return null;
    return walkMinutes({ latitude: from.latitude, longitude: from.longitude }, { latitude: to.latitude, longitude: to.longitude });
  };

  const sections = useMemo(
    () =>
      SECTIONS.map((s) => {
        const list = live.locations
          .filter((l) => l.category === s.category && (selected === 'ALL' || l.campus === selected))
          .map((l) => ({ l, e: estimateFor(l, now) }))
          .sort((a, b) => (a.e.level ?? 9) - (b.e.level ?? 9) || a.l.name.localeCompare(b.l.name));
        return { ...s, list, bestId: list[0]?.e.level != null ? list[0].l.id : null };
      }),
    [live.locations, selected, now],
  );
  const reported = live.locations.reduce((n, l) => n + estimateFor(l, now).contributors, 0);

  return (
    <Screen onRefresh={loadLive} title="Campus Live" subtitle="Real-time lines and seats, from students on campus">
      <ThemedText type="caption" themeColor="textSecondary">
        {reported > 0 ? `${reported} student ${reported === 1 ? 'report' : 'reports'} in the last ${REPORT_MAX_AGE_MIN} min` : `No reports in the last ${REPORT_MAX_AGE_MIN} min`}
        {plan.here ? ` · walking times from ${plan.here.code}` : ''}
      </ThemedText>

      <View style={styles.chips}>
        <Chip label="SGW" selected={selected === 'SGW'} onPress={() => setCampus('SGW')} />
        <Chip label="Loyola" selected={selected === 'LOY'} onPress={() => setCampus('LOY')} />
        <Chip label="Both" selected={selected === 'ALL'} onPress={() => setCampus('ALL')} />
      </View>

      {live.status === 'error' ? <ErrorState message={live.error} onRetry={loadLive} /> : null}
      {live.status !== 'error' && live.locations.length === 0 && live.status !== 'ready' ? (
        <Card>
          <Skeleton width="50%" height={18} />
          <Skeleton width="30%" />
        </Card>
      ) : null}

      {sections.map(({ category, title, list, bestId }) =>
        list.length === 0 ? null : (
          <View key={category} style={styles.section}>
            <ThemedText type="subtitle" accessibilityRole="header">
              {title}
            </ThemedText>
            <View style={[styles.grid, isMedium && styles.gridRow]}>
              {list.map(({ l }) => (
                <View key={l.id} style={isMedium ? styles.cell : undefined}>
                  <LocationCard location={l} now={now} walk={walkTo(l)} best={l.id === bestId} highlighted={params.place === l.id} />
                </View>
              ))}
            </View>
          </View>
        ),
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: Spacing.two },
  section: { gap: Spacing.three },
  grid: { gap: Spacing.three },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { flexBasis: '48%', flexGrow: 1 },
});
