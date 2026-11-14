import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/state-views';
import { ThemedText } from '@/components/ui/themed-text';
import { REPORT_MAX_AGE_MIN, STORAGE_KEYS } from '@/data/constants';
import type { CampusFilter, LiveCategory } from '@/data/enums';
import type { LiveLocation } from '@/data/types';
import { useBrain } from '@/features/brain/use-brain';
import { LocationCard } from '@/features/live/components/location-card';
import { estimateFor, loadLive, useLive } from '@/features/live/store';
import { useBuildingIndex } from '@/features/navigator/use-buildings';
import { useProfile } from '@/features/profile/use-profile';
import { useLayout } from '@/hooks/use-layout';
import { useNow } from '@/hooks/use-now';
import { walkBetween } from '@/lib/geo';
import { usePersisted } from '@/lib/persisted-store';

import { styles } from './live-screen.styles';

const SECTIONS: { category: LiveCategory; title: string }[] = [
  { category: 'food', title: 'Food and lines' },
  { category: 'study', title: 'Study spaces' },
];

export function LiveScreen() {
  const params = useLocalSearchParams<{ place?: string }>();
  const live = useLive();
  const profile = useProfile();
  const plan = useBrain();
  const index = useBuildingIndex();
  const now = useNow();
  const { isMedium } = useLayout();
  const [campus, setCampus] = usePersisted<CampusFilter | null>(STORAGE_KEYS.liveCampus, null);
  const selected = campus ?? profile?.preferred_campus ?? 'ALL';

  const walkTo = (l: LiveLocation) => walkBetween(plan.here ?? plan.nextBuilding, index.get(l.buildingCode.toUpperCase()));

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
