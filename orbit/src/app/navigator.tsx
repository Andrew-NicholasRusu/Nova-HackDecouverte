import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { useBuildings, type Building } from '@/features/navigator/use-buildings';

const CAMPUS_NAMES: Record<string, string> = {
  SGW: 'Sir George Williams',
  LOY: 'Loyola',
};

function groupByCampus(buildings: Building[]) {
  const groups = new Map<string, Building[]>();
  for (const b of buildings) groups.set(b.campus, [...(groups.get(b.campus) ?? []), b]);
  return [...groups.entries()];
}

export default function NavigatorScreen() {
  const data = useBuildings();

  return (
    <Screen title="Navigator" subtitle="Concordia building directory · Source: Concordia Open Data">
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

      {data.status === 'loading' && (
        <>
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <Skeleton width="40%" height={18} />
              <Skeleton width="70%" />
            </Card>
          ))}
        </>
      )}

      {data.status === 'error' && <ErrorState message={data.message} onRetry={data.retry} />}

      {data.status === 'ready' && data.buildings.length === 0 && (
        <EmptyState title="No buildings" message="Concordia returned an empty building list." />
      )}

      {data.status === 'ready' &&
        groupByCampus(data.buildings).map(([campus, list]) => (
          <View key={campus} style={styles.group}>
            <ThemedText type="subtitle">{CAMPUS_NAMES[campus] ?? campus}</ThemedText>
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
