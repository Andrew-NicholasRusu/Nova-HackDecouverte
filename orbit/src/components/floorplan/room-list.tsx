import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FixedColors, Radius, Size, Spacing, TouchTarget, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Room } from '@/lib/floorplan/navmesh';

type Props = {
  /** Rooms on the floor being viewed (primary results). */
  rooms: Room[];
  /** Rooms on other floors; only listed, as a secondary section, while searching. */
  otherRooms: Room[];
  selectedCode: string | null;
  onSelect: (room: Room | null) => void;
  /** Called when the search box gains focus (lets narrow layouts open the list). */
  onFocus?: () => void;
};

/** Searchable room list; tapping the selected room again clears the highlight. */
export function RoomList({ rooms, otherRooms, selectedCode, onSelect, onFocus }: Props) {
  const theme = useTheme();
  const [query, setQuery] = useState('');

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (r: Room) => r.label.toLowerCase().includes(q);
    const here = q ? rooms.filter(match) : rooms;
    const elsewhere = q ? otherRooms.filter(match) : [];
    return [
      { title: 'This floor', data: here },
      ...(elsewhere.length ? [{ title: 'Other floors', data: elsewhere }] : []),
    ];
  }, [rooms, otherRooms, query]);
  const total = sections.reduce((n, s) => n + s.data.length, 0);

  return (
    <View style={styles.root}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        onFocus={onFocus}
        placeholder="Search rooms (e.g. 130)"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Search rooms"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
      />
      <ThemedText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite">
        {total} {total === 1 ? 'room' : 'rooms'}
      </ThemedText>
      <SectionList
        sections={sections}
        keyExtractor={(r) => r.code}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled
        renderSectionHeader={({ section }) => (
          <ThemedView type="backgroundSelected" style={styles.header}>
            <ThemedText type="smallBold" accessibilityRole="header">
              {section.title}
            </ThemedText>
          </ThemedView>
        )}
        ListEmptyComponent={
          <ThemedText type="small" themeColor="textSecondary">
            No room matches “{query}”.
          </ThemedText>
        }
        renderItem={({ item }) => {
          const selected = item.code === selectedCode;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Room ${item.label}, floor ${item.floor}${selected ? ', selected' : ''}`}
              onPress={() => onSelect(selected ? null : item)}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <ThemedView
                type={selected ? 'backgroundSelected' : 'backgroundElement'}
                style={[styles.row, selected && { borderLeftColor: FixedColors.roomHighlight }]}
              >
                <ThemedText type={selected ? 'smallBold' : 'small'}>{item.label}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Floor {item.floor}
                </ThemedText>
              </ThemedView>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: Spacing.two },
  input: {
    minHeight: TouchTarget,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
    ...Typography.body,
  },
  header: {
    minHeight: Size.sectionHeader,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
    marginTop: Spacing.one,
  },
  row: {
    minHeight: TouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  pressed: { opacity: 0.7 },
});
