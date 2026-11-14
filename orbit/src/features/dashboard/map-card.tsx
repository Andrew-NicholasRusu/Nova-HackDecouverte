import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { MOLSON_PHOTO } from '@/constants/floorplans';
import { Radius, Size } from '@/constants/theme';


/** Entry to the Map: a real building preview (Molson floor plans) and the primary room-finding action. */
export function MapCard() {
  return (
    <Card style={styles.card}>
      <CardHeader
        icon="location-on"
        title="Campus Map"
        actionLabel="Open Map"
        onAction={() => router.push('/navigator')}
      />
      <View style={styles.preview}>
        <Image
          source={MOLSON_PHOTO}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="center"
          accessibilityLabel="Molson Building, Sir George Williams campus"
        />
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Lost in the Molson Building? Open the floor plans and search any room by number.
      </ThemedText>
      <Button label="Find a room" icon="search" onPress={() => router.push('/navigator')} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexGrow: 1 },
  preview: { height: Size.mapPreview, borderRadius: Radius.lg, overflow: 'hidden' },
});
