import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Size, Spacing } from '@/constants/theme';
import { useBrain } from '@/features/brain/use-brain';
import { CampusMap } from '@/features/navigator/campus-map';
import { useBuildings } from '@/features/navigator/use-buildings';
import { useProfile } from '@/features/profile/use-profile';

/** Campus overview: your next class building, where you are and the walk between them. */
export function MapCard() {
  const data = useBuildings();
  const plan = useBrain();
  const profile = useProfile();
  const campus = plan.nextBuilding?.campus ?? plan.here?.campus ?? profile?.preferred_campus ?? 'SGW';

  return (
    <Card>
      <CardHeader icon="location-on" title="Campus Map" actionLabel="Open Map" onAction={() => router.push('/navigator')} />
      {data.status === 'loading' ? (
        <Skeleton height={Size.mapPreview} />
      ) : data.status === 'error' ? (
        <ThemedText type="small" themeColor="textSecondary">
          The building list could not load. Floor plans still work offline.
        </ThemedText>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open the campus map"
          onPress={() => router.push('/navigator')}
          style={styles.map}>
          <View pointerEvents="none">
            <CampusMap buildings={data.buildings} campus={campus} height={Size.mapPreview} next={plan.nextBuilding?.code} here={plan.here?.code} />
          </View>
        </Pressable>
      )}
      <ThemedText type="small" themeColor="textSecondary">
        {plan.next && plan.walkToNext !== null
          ? `${plan.next.event.courseCode} is in ${plan.nextBuilding?.code}, ${plan.walkToNext} min walk from ${plan.here?.code}.`
          : 'Search any building or room, with floor plans and step-by-step directions.'}
      </ThemedText>
      <Button label="Find a room" icon="search" onPress={() => router.push('/navigator')} />
    </Card>
  );
}

const styles = StyleSheet.create({ map: { gap: Spacing.two } });
