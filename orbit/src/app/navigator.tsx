import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { BuildingViewer } from '@/components/floorplan/building-viewer';
import { FloorPlanModal } from '@/components/floorplan/floor-plan-modal';
import { FloorSwitcher } from '@/components/floorplan/floor-switcher';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { TextField } from '@/components/ui/text-field';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { Floor } from '@/constants/floorplans';
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
  const [floor, setFloor] = useState<Floor | null>(null);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  return (
    <Screen title="Map" subtitle="Concordia building directory · Source: Concordia Open Data">
      <View style={styles.group}>
        <ThemedText type="subtitle">Molson Building · Floor plans</ThemedText>
        <Card style={styles.viewer}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            Hover a floor to highlight it, then open its plan to browse and search rooms. Or pick a
            floor below.
          </ThemedText>
          <BuildingViewer onSelect={setFloor} />
          <FloorSwitcher onSelect={setFloor} />
        </Card>
      </View>
      <FloorPlanModal floor={floor} onSelect={setFloor} onClose={() => setFloor(null)} />

      <ThemedText type="subtitle">Building directory</ThemedText>
      <TextField
        label="Search buildings"
        value={query}
        onChangeText={setQuery}
        placeholder="Code, name or street, e.g. EV or Guy"
        autoCorrect={false}
        autoCapitalize="none"
      />

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

      {data.status === 'ready' && !!q && !data.buildings.some((b) => `${b.code} ${b.longName} ${b.name} ${b.address}`.toLowerCase().includes(q)) && (
        <EmptyState title="No match" message={`No building matches “${query}”. Try a code like EV or a street name.`} />
      )}

      {data.status === 'ready' &&
        groupByCampus(
          data.buildings.filter((b) => !q || `${b.code} ${b.longName} ${b.name} ${b.address}`.toLowerCase().includes(q)),
        ).map(([campus, list]) => (
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
                {b.latitude != null && b.longitude != null && (
                  <View style={styles.action}>
                    <Button
                      label="Get directions"
                      variant="secondary"
                      icon="near-me"
                      onPress={() =>
                        Linking.openURL(
                          `https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}&travelmode=walking`,
                        )
                      }
                    />
                  </View>
                )}
                {b.code === 'MB' && (
                  <ThemedText type="small" themeColor="success">
                    Floor plans available above
                  </ThemedText>
                )}
              </Card>
            ))}
          </View>
        ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
  viewer: { alignItems: 'center', gap: Spacing.three },
  hint: { textAlign: 'center' },
  action: { alignItems: 'flex-start', marginTop: Spacing.one },
});
