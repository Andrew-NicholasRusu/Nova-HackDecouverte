import { useMemo, useState } from 'react';
import { Pressable, SectionList, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import type { Room } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { FixedColors } from '@/styles/theme';

import { styles } from './room-list.styles';

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
          <View style={[styles.header, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="smallBold" accessibilityRole="header">
              {section.title}
            </ThemedText>
          </View>
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
              <View
                style={[
                  styles.row,
                  { backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement },
                  selected && { borderLeftColor: FixedColors.roomHighlight },
                ]}>
                <ThemedText type={selected ? 'smallBold' : 'small'}>{item.label}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Floor {item.floor}
                </ThemedText>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
