import { Link, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useBuildings, type Building } from '@/features/navigator/use-buildings';
import { campusName } from '@/features/profile/profile-schema';
import { useProfile } from '@/providers/profile-provider';

function matches(b: Building, q: string) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return [b.code, b.name, b.longName, b.address].some((f) => f.toLowerCase().includes(needle));
}

/** Groups by campus, putting the student's preferred campus first. */
function groupByCampus(buildings: Building[], preferred: string | null | undefined) {
  const groups = new Map<string, Building[]>();
  for (const b of buildings) groups.set(b.campus, [...(groups.get(b.campus) ?? []), b]);
  return [...groups.entries()].sort(([a], [b]) => (a === preferred ? -1 : b === preferred ? 1 : 0));
}

export default function NavigatorScreen() {
  const data = useBuildings();
  const profile = useProfile();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q ?? '');
  const [lastParam, setLastParam] = useState(params.q);

  // A new ?q= (e.g. from the dashboard search) replaces the current query.
  if (params.q !== lastParam) {
    setLastParam(params.q);
    setQuery(params.q ?? '');
  }

  const groups = useMemo(() => {
    if (data.status !== 'ready') return [];
    const filtered = data.buildings.filter((b) => matches(b, query.trim()));
    return groupByCampus(filtered, profile?.preferred_campus);
  }, [data, query, profile?.preferred_campus]);

  return (
    <Screen title="Map" subtitle="Concordia buildings · Source: Concordia Open Data">
      <TextField
        label="Search buildings"
        value={query}
        onChangeText={setQuery}
        placeholder="Code, name or address (e.g. EV, Library)"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      <Link href="/floorplan" asChild>
        <Pressable accessibilityRole="link" accessibilityLabel="Open Molson Building floor plans">
          <Card>
            <ThemedText type="heading">Molson Building · Floor plans</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Browse floors, search rooms and see them on the plan.
            </ThemedText>
          </Card>
        </Pressable>
      </Link>

      {data.status === 'loading' &&
        [0, 1, 2].map((i) => (
          <Card key={i}>
            <Skeleton width="40%" height={18} />
            <Skeleton width="70%" />
          </Card>
        ))}

      {data.status === 'error' && <ErrorState message={data.message} onRetry={data.retry} />}

      {data.status === 'ready' && groups.length === 0 && (
        <EmptyState
          title="No matching buildings"
          message={query ? `Nothing matches “${query.trim()}”. Try a building code like EV or H.` : 'Concordia returned an empty building list.'}
          actionLabel={query ? 'Clear search' : undefined}
          onAction={query ? () => setQuery('') : undefined}
        />
      )}

      {groups.map(([campus, list]) => (
        <View key={campus} style={styles.group}>
          <ThemedText type="subtitle">{campusName(campus) ?? campus}</ThemedText>
          {list.map((b) => (
            <Card key={`${campus}-${b.code}`}>
              <ThemedText type="heading">
                {b.code} · {b.longName}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {b.address}
              </ThemedText>
            </Card>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
});
