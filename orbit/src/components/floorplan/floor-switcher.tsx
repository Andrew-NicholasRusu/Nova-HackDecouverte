import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Floor, MOLSON_FLOORS } from '@/constants/floorplans';
import { Radius, Size, Spacing, TouchTarget } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  selectedId?: string;
  onSelect: (floor: Floor) => void;
};

/** Row of floor buttons (44pt targets); the selected one is marked for assistive tech too. */
export function FloorSwitcher({ selectedId, onSelect }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {MOLSON_FLOORS.map((floor) => {
        const selected = floor.id === selectedId;
        return (
          <Pressable
            key={floor.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={floor.label}
            onPress={() => onSelect(floor)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <ThemedView
              type={selected ? 'backgroundSelected' : 'background'}
              style={[styles.chip, selected && { borderColor: theme.accent }]}
            >
              <ThemedText type={selected ? 'smallBold' : 'small'}>{floor.label}</ThemedText>
            </ThemedView>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'center',
  },
  chip: {
    minHeight: TouchTarget,
    minWidth: Size.chipMin,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pressed: { opacity: 0.7 },
});
