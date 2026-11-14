import { useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { MOLSON_FLOORS, MOLSON_PHOTO } from '@/data/floorplans';
import type { Floor } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './building-viewer.styles';

type Props = { onSelect: (floor: Floor) => void };

/** Street photo of the Molson building; each floor band highlights on hover and opens its plan. */
export function BuildingViewer({ onSelect }: Props) {
  const theme = useTheme();
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
              active && [styles.bandActive, { backgroundColor: theme.accentSoft }],
            ]}
          >
            {active && (
              <View style={[styles.tag, { backgroundColor: theme.accent }]}>
                <ThemedText type="smallBold" style={{ color: theme.accentText }}>
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
