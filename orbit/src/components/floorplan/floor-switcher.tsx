import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Floor, MOLSON_FLOORS } from '@/constants/floorplans';
import { Spacing } from '@/constants/theme';

type Props = {
  selectedId?: string;
  onSelect: (floor: Floor) => void;
};

/** Row of floor buttons (44pt targets); the selected one is marked for assistive tech too. */
export function FloorSwitcher({ selectedId, onSelect }: Props) {
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
              style={[styles.chip, selected && styles.chipSelected]}
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
    minHeight: 44,
    minWidth: 88,
    paddingHorizontal: Spacing.three,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipSelected: { borderColor: '#912338' },
  pressed: { opacity: 0.7 },
});
