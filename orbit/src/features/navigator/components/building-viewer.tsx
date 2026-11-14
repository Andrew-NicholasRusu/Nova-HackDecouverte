import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BuildingViewerMaxWidth, Radius, Spacing, FixedColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Floor, MOLSON_FLOORS, MOLSON_PHOTO, MOLSON_PHOTO_RATIO } from '@/constants/floorplans';

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

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    maxWidth: BuildingViewerMaxWidth,
    aspectRatio: MOLSON_PHOTO_RATIO,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  photo: { ...StyleSheet.absoluteFill },
  band: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    cursor: 'pointer',
  },
  bandActive: {
    borderColor: FixedColors.white,
  },
  tag: {
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
});
