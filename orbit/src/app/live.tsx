import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { LocationCard } from '@/features/live/location-card';
import { loadLive, useLive, type LiveCategory } from '@/features/live/store';
import { useProfile } from '@/features/profile/use-profile';
import { useNow } from '@/features/schedule/format';

const SECTIONS: { category: LiveCategory; title: string }[] = [
  { category: 'food', title: 'Food' },
  { category: 'study', title: 'Study spaces' },
];

export default function LiveScreen() {
  const live = useLive();
  const profile = useProfile();
  const now = useNow();
  const [campus, setCampus] = useState<'SGW' | 'LOY' | 'ALL' | null>(null);
  const selected = campus ?? profile?.preferred_campus ?? 'ALL';

  const shown = live.locations.filter((l) => selected === 'ALL' || l.campus === selected);

  return (
    <Screen title="Campus Live" subtitle="Lines and seats, reported by students">
      <Card>
        <ThemedText type="small" themeColor="textSecondary">
          Community reports from students, not official Concordia data. Each report fades out after 45 minutes; confidence
          rises when several students agree.
        </ThemedText>
      </Card>

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

      {live.status === 'ready' && shown.length === 0 ? (
        <EmptyState title="No places yet" message="No Campus Live places on this campus yet." />
      ) : null}

      {SECTIONS.map(({ category, title }) => {
        const list = shown.filter((l) => l.category === category);
        if (list.length === 0) return null;
        return (
          <View key={category} style={styles.section}>
            <ThemedText type="subtitle">{title}</ThemedText>
            {list.map((l) => (
              <LocationCard key={l.id} location={l} now={now} />
            ))}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: Spacing.two },
  section: { gap: Spacing.two },
});
