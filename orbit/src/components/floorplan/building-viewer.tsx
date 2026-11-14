import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Floor, MOLSON_FLOORS, MOLSON_PHOTO, MOLSON_PHOTO_RATIO } from '@/constants/floorplans';

type Props = { onSelect: (floor: Floor) => void };

/** Street photo of the Molson building; each floor band highlights on hover and opens its plan. */
export function BuildingViewer({ onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <View style={styles.frame}>
      <Image source={MOLSON_PHOTO} style={styles.photo} contentFit="cover" />
      {MOLSON_FLOORS.map((floor) => {
        const active = hovered === floor.id;
        const { band } = floor;
        return (
          <Pressable
            key={floor.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${floor.label} plan`}
            onHoverIn={() => setHovered(floor.id)}
            onHoverOut={() => setHovered(null)}
            onPressIn={() => setHovered(floor.id)}
            onPressOut={() => setHovered(null)}
            onPress={() => onSelect(floor)}
            style={[
              styles.band,
              {
                left: `${band.left}%`,
                width: `${band.width}%`,
                top: `${band.top}%`,
                height: `${band.height}%`,
              },
              active && styles.bandActive,
            ]}
          >
            {active && (
              <View style={styles.tag}>
                <ThemedText type="smallBold" style={styles.tagText}>
                  {floor.label}
                </ThemedText>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    maxWidth: 520,
    aspectRatio: MOLSON_PHOTO_RATIO,
    borderRadius: 16,
    overflow: 'hidden',
  },
  photo: { ...StyleSheet.absoluteFill },
  band: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    // Always-visible outline so the clickable floors are discoverable without hovering.
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    cursor: 'pointer',
  },
  bandActive: {
    backgroundColor: 'rgba(145, 35, 56, 0.45)',
    borderColor: '#ffffff',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#912338',
  },
  tagText: { color: '#ffffff' },
});
