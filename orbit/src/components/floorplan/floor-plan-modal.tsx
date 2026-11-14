import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FloorSwitcher } from '@/components/floorplan/floor-switcher';
import { RoomList } from '@/components/floorplan/room-list';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Floor, MOLSON_FLOORS } from '@/constants/floorplans';
import { FixedColors, Size, Spacing, TouchTarget } from '@/constants/theme';
import { getRoomRegions } from '@/lib/floorplan/regions';
import { highlightRoom } from '@/lib/floorplan/highlight';
import { getOtherRooms, getRooms, Room } from '@/lib/floorplan/navmesh';

/** Width from which the controls move into a left sidebar and the plan gets the full height. */
const WIDE_BREAKPOINT = 800;

type Props = {
  floor: Floor | null;
  onSelect: (floor: Floor) => void;
  /** Back to the building view. */
  onClose: () => void;
  /** Room label (e.g. "MB-1.130") to highlight as soon as the plan opens, e.g. from search. */
  focusRoom?: string;
};

/**
 * Full-screen floor plan. The plan takes all space not used by controls:
 * wide screens put controls in a sidebar, narrow ones in a top bar and bottom floor row.
 */
export function FloorPlanModal({ floor, onSelect, onClose, focusRoom }: Props) {
  const wide = useWindowDimensions().width >= WIDE_BREAKPOINT;
  const [picked, setPicked] = useState<Room | null>(null);
  // A new focusRoom (from search or a deep link) selects that room; adjusted during render, not in an effect.
  const [seenFocus, setSeenFocus] = useState<string | undefined>(undefined);
  if (focusRoom !== seenFocus) {
    setSeenFocus(focusRoom);
    const target = focusRoom ? getOtherRooms('').find((r) => r.label === focusRoom) : undefined;
    if (target) setPicked(target);
  }
  const room = picked && picked.floor === floor?.id ? picked : null;
  const [listOpen, setListOpen] = useState(false);
  const [planBox, setPlanBox] = useState({ width: 0, height: 0 });
  const planSquare = Math.min(planBox.width, planBox.height);
  const rooms = useMemo(() => (floor ? getRooms(floor.id) : []), [floor]);
  const regions = useMemo(() => (floor ? getRoomRegions(floor.svg) : []), [floor]);
  const otherRooms = useMemo(() => (floor ? getOtherRooms(floor.id) : []), [floor]);
  const svg = useMemo(() => (floor ? highlightRoom(floor.svg, room) : ''), [floor, room]);

  const pick = (r: Room | null) => {
    setPicked(r);
    // A match on another floor switches to that floor first.
    const target = r && r.floor !== floor?.id ? MOLSON_FLOORS.find((f) => f.id === r.floor) : null;
    if (target) onSelect(target);
    setListOpen(false);
  };
  // Manual floor changes and closing drop the selection: a room belongs to one floor.
  const switchFloor = useCallback(
    (f: Floor) => {
      setPicked(null);
      setListOpen(false);
      onSelect(f);
    },
    [onSelect],
  );
  const close = useCallback(() => {
    setPicked(null);
    setListOpen(false);
    onClose();
  }, [onClose]);

  const index = floor ? MOLSON_FLOORS.findIndex((f) => f.id === floor.id) : -1;
  const lower = MOLSON_FLOORS[index - 1];
  const upper = MOLSON_FLOORS[index + 1];

  // Web shortcuts: Esc = back to building, ↑/↓ = next/previous floor.
  useEffect(() => {
    if (Platform.OS !== 'web' || !floor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowUp' && upper) switchFloor(upper);
      else if (e.key === 'ArrowDown' && lower) switchFloor(lower);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [floor, lower, upper, close, switchFloor]);

  const back = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to building"
      onPress={close}
      style={({ pressed }) => [styles.back, pressed && styles.pressed]}
    >
      <ThemedText type="link">← Back to building</ThemedText>
    </Pressable>
  );

  const title = (
    <View>
      <ThemedText type="small" themeColor="textSecondary">
        Molson Building
      </ThemedText>
      <ThemedText type="subtitle" accessibilityRole="header">
        {floor?.label}
      </ThemedText>
    </View>
  );

  return (
    <Modal visible={!!floor} animationType="fade" onRequestClose={close}>
      <ThemedView style={styles.root}>
        <SafeAreaView style={[styles.layout, wide && styles.layoutWide]}>
          {wide ? (
            <ThemedView type="backgroundElement" style={styles.sidebar}>
              {back}
              {title}
              <FloorSwitcher selectedId={floor?.id} onSelect={switchFloor} />
              <RoomList
                rooms={rooms}
                otherRooms={otherRooms}
                selectedCode={room?.code ?? null}
                onSelect={pick}
              />
              {Platform.OS === 'web' && (
                <ThemedText type="small" themeColor="textSecondary">
                  ↑ ↓ change floor{'\n'}Esc back to building
                </ThemedText>
              )}
            </ThemedView>
          ) : (
            <ThemedView type="backgroundElement" style={styles.topBar}>
              {back}
              {title}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: listOpen }}
                onPress={() => setListOpen((o) => !o)}
                style={({ pressed }) => [styles.roomsButton, pressed && styles.pressed]}
              >
                <ThemedText type="link">
                  {room ? `Room ${room.label} ✎` : 'Find a room ▾'}
                </ThemedText>
              </Pressable>
            </ThemedView>
          )}

          <View style={styles.plan} onLayout={(e) => setPlanBox(e.nativeEvent.layout)}>
            {floor && (
              <>
                <Image source={floor.image} style={StyleSheet.absoluteFill} contentFit="contain" />
                <Image
                  source={{
                    uri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
                  }}
                  style={StyleSheet.absoluteFill}
                  contentFit="contain"
                />
                <View
                  pointerEvents="box-none"
                  style={{
                    position: 'absolute',
                    width: planSquare,
                    height: planSquare,
                    left: (planBox.width - planSquare) / 2,
                    top: (planBox.height - planSquare) / 2,
                  }}
                >
                  {regions.map((r) => {
                    const target = rooms.find((x) => x.code === r.code);
                    if (!target) return null;
                    const selected = r.code === room?.code;
                    return (
                      <Pressable
                        key={r.code}
                        accessibilityRole="button"
                        accessibilityLabel={`Room ${target.label}${selected ? ', selected' : ''}`}
                        onPress={() => pick(selected ? null : target)}
                        style={[
                          styles.region,
                          {
                            left: `${(r.x / 1024) * 100}%`,
                            top: `${(r.y / 1024) * 100}%`,
                            width: `${(r.width / 1024) * 100}%`,
                            height: `${(r.height / 1024) * 100}%`,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              </>
            )}
            {!wide && listOpen && (
              <ThemedView type="backgroundElement" style={styles.roomsPanel}>
                <RoomList
                  rooms={rooms}
                  otherRooms={otherRooms}
                  selectedCode={room?.code ?? null}
                  onSelect={pick}
                />
              </ThemedView>
            )}
          </View>

          {!wide && (
            <ThemedView type="backgroundElement" style={styles.bottomBar}>
              <FloorSwitcher selectedId={floor?.id} onSelect={switchFloor} />
            </ThemedView>
          )}
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  layout: { flex: 1 },
  layoutWide: { flexDirection: 'row' },
  sidebar: { width: Size.roomPanel, padding: Spacing.three, gap: Spacing.three },
  topBar: { padding: Spacing.three, gap: Spacing.one },
  bottomBar: { padding: Spacing.three },
  back: { minHeight: TouchTarget, justifyContent: 'center', alignSelf: 'flex-start' },
  roomsButton: { minHeight: TouchTarget, justifyContent: 'center', alignSelf: 'flex-start' },
  roomsPanel: {
    ...StyleSheet.absoluteFill,
    padding: Spacing.three,
  },
  // Invisible hit area over each room outline; hover tint hints that it's clickable.
  region: { position: 'absolute', cursor: 'pointer' },
  pressed: { opacity: 0.7 },
  // White so the drawing stays legible in dark mode.
  plan: { flex: 1, backgroundColor: FixedColors.planSurface },
});
