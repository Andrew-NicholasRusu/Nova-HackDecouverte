import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RoomList } from '@/components/floorplan/room-list';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Floor, MOLSON_FLOORS } from '@/constants/floorplans';
import { Elevation, FixedColors, Opacity, Radius, Size, Spacing, TouchTarget } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import { drawRoute, highlightRoom } from '@/lib/floorplan/highlight';
import { ENTRANCE, getOtherRooms, getRooms, Room, routeBetween } from '@/lib/floorplan/navmesh';
import { getRoomRegions } from '@/lib/floorplan/regions';
import type { RouteStep } from '@/lib/floorplan/route';

type Props = {
  floor: Floor | null;
  onSelect: (floor: Floor) => void;
  onClose: () => void;
  /** Room label (e.g. "MB-1.130") to route to as soon as the plan opens, e.g. from search or your next class. */
  focusRoom?: string;
};

const STEP_ICON: Record<RouteStep['kind'], IconName> = {
  start: 'my-location',
  walk: 'directions-walk',
  'turn-left': 'turn-left',
  'turn-right': 'turn-right',
  elevator: 'elevator',
  stairs: 'stairs',
  arrive: 'flag',
};

const allRooms = getOtherRooms('');
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
/** Rough size of a plan unit, for a walking-time estimate only. */
const METRES_PER_UNIT = 0.16;
const METRES_PER_MINUTE = 80;

/**
 * Full-screen indoor map with directions. Pick where you are and where you are going; the route is
 * drawn on every floor it crosses, with turn-by-turn steps, a step-free option and landmarks.
 */
export function FloorPlanModal({ floor, onSelect, onClose, focusRoom }: Props) {
  const theme = useTheme();
  const { width } = useLayout();
  const wide = width >= Size.planWide;

  const [from, setFrom] = useState<Room>(ENTRANCE);
  const [to, setTo] = useState<Room | null>(null);
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);
  const [accessible, setAccessible] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [planBox, setPlanBox] = useState({ width: 0, height: 0 });

  // A new focusRoom (search, next class, deep link) becomes the destination; adjusted during render.
  const [seenFocus, setSeenFocus] = useState<string | undefined>(undefined);
  if (focusRoom !== seenFocus) {
    setSeenFocus(focusRoom);
    const target = focusRoom ? allRooms.find((r) => r.label === focusRoom) : undefined;
    if (target) {
      setTo(target);
      setFrom(ENTRANCE);
      setStepIndex(null);
    }
  }

  const route = useMemo(() => (to ? routeBetween(from, to, accessible) : null), [from, to, accessible]);
  const floorNumber = floor ? Number(floor.id) : 0;
  const rooms = useMemo(() => (floor ? getRooms(floor.id) : []), [floor]);
  const otherRooms = useMemo(() => (floor ? getOtherRooms(floor.id) : []), [floor]);
  const regions = useMemo(() => (floor ? getRoomRegions(floor.svg) : []), [floor]);
  const svg = useMemo(() => {
    if (!floor) return '';
    const base = highlightRoom(floor.svg, to && to.floor === floor.id ? to : null);
    const focus = route && stepIndex !== null && route.steps[stepIndex]?.floor === floorNumber ? route.steps[stepIndex] : null;
    return drawRoute(base, route, floorNumber, focus);
  }, [floor, to, route, floorNumber, stepIndex]);

  const floorById = (id: number | string) => MOLSON_FLOORS.find((f) => f.id === String(id));
  const close = useCallback(() => {
    setTo(null);
    setFrom(ENTRANCE);
    setPicking(null);
    setStepIndex(null);
    setZoom(1);
    onClose();
  }, [onClose]);

  const choose = (room: Room) => {
    if (picking === 'from') setFrom(room);
    else setTo(room);
    setPicking(null);
    setStepIndex(null);
    const f = floorById(room.floor);
    if (f) onSelect(f);
  };

  const goStep = (i: number) => {
    if (!route) return;
    setStepIndex(i);
    const f = floorById(route.steps[i].floor);
    if (f) onSelect(f);
  };

  useEffect(() => {
    if (Platform.OS !== 'web' || !floor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [floor, close]);

  const minutes = route ? Math.max(1, Math.round((route.length * METRES_PER_UNIT) / METRES_PER_MINUTE)) : 0;
  const metres = route ? Math.round(route.length * METRES_PER_UNIT) : 0;
  const planSquare = Math.min(planBox.width, planBox.height);
  const canvas = Math.max(planSquare * zoom, 1);

  const field = (kind: 'from' | 'to', room: Room | null) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${kind === 'from' ? 'Starting point' : 'Destination'}: ${room?.label ?? 'not set'}. Change`}
      onPress={() => setPicking(kind)}
      style={(s) => [styles.field, { backgroundColor: theme.background, borderColor: picking === kind ? theme.accentLink : theme.border }, s.pressed && { opacity: Opacity.pressed }]}>
      <View style={[styles.dot, { backgroundColor: kind === 'from' ? theme.success : theme.accent }]} />
      <View style={styles.flex}>
        <ThemedText type="caption" themeColor="textSecondary">
          {kind === 'from' ? 'From' : 'To'}
        </ThemedText>
        <ThemedText type="smallBold" numberOfLines={1} themeColor={room ? 'text' : 'textSecondary'}>
          {room ? room.label : 'Choose a room'}
        </ThemedText>
      </View>
      <Icon name="edit" size="md" color="textSecondary" />
    </Pressable>
  );

  const panel = (
    <View style={styles.panelInner}>
      {wide ? (
        <View style={styles.panelHead}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to the building" onPress={close} style={styles.back}>
          <Icon name="arrow-back" size="lg" color="accentLink" />
          <ThemedText type="link">Building</ThemedText>
        </Pressable>
        <ThemedText type="heading" accessibilityRole="header">
          Molson Building
        </ThemedText>
        </View>

      ) : null}

      <View style={styles.form}>
        {field('from', from)}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Swap start and destination"
          disabled={!to}
          onPress={() => {
            if (!to) return;
            setFrom(to);
            setTo(from);
            setStepIndex(null);
          }}
          style={[styles.swap, { backgroundColor: theme.backgroundSelected }, !to && { opacity: Opacity.disabled }]}>
          <Icon name="swap-vert" size="md" color="accentLink" />
        </Pressable>
        {field('to', to)}
      </View>

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: accessible }}
        accessibilityLabel="Step-free route: avoid stairs"
        onPress={() => setAccessible((a) => !a)}
        style={[styles.toggle, { backgroundColor: accessible ? theme.accentTint : theme.backgroundSelected }]}>
        <Icon name="accessible" size="md" color={accessible ? 'accentLink' : 'textSecondary'} />
        <ThemedText type="smallBold" themeColor={accessible ? 'accentLink' : 'text'}>
          Step-free route {accessible ? 'on' : 'off'}
        </ThemedText>
      </Pressable>

      {picking ? (
        <View style={styles.flex}>
          <View style={styles.pickHead}>
            <ThemedText type="smallBold">{picking === 'from' ? 'Where are you?' : 'Where do you want to go?'}</ThemedText>
            <Button label="Cancel" variant="ghost" onPress={() => setPicking(null)} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Main entrance"
            onPress={() => choose(ENTRANCE)}
            style={(s) => [styles.entrance, { backgroundColor: theme.accentTint }, s.pressed && { opacity: Opacity.pressed }]}>
            <Icon name="meeting-room" size="lg" color="accentLink" />
            <ThemedText type="smallBold">Main entrance</ThemedText>
          </Pressable>
          <RoomList rooms={rooms} otherRooms={otherRooms} selectedCode={null} onSelect={(r) => r && choose(r)} />
        </View>
      ) : route && to ? (
        <ScrollView style={styles.flex} contentContainerStyle={styles.steps} showsVerticalScrollIndicator={Platform.OS === 'web'}>
          <View style={[styles.summary, { backgroundColor: FixedColors.shell }]}>
            <ThemedText type="displaySmall" style={styles.summaryText}>
              {minutes} min
            </ThemedText>
            <ThemedText type="small" style={styles.summaryMuted}>
              About {metres} m{route.floors.length > 1 ? ` · floors ${route.floors.join(' → ')}` : ` · floor ${route.floors[0]}`}
            </ThemedText>
          </View>
          {route.floors.length > 1 ? (
            <View style={styles.floorChips}>
              {route.floors.map((n) => {
                const f = floorById(n);
                const active = floor?.id === String(n);
                return (
                  <Pressable key={n} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={`Show floor ${n}`} onPress={() => f && onSelect(f)} style={[styles.chip, { backgroundColor: active ? theme.accent : theme.backgroundSelected }]}>
                    <ThemedText type="smallBold" style={{ color: active ? theme.accentText : theme.text }}>
                      Floor {n}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          {route.steps.map((s, i) => {
            const active = stepIndex === i;
            return (
              <Pressable
                key={`${s.kind}-${i}`}
                accessibilityRole="button"
                accessibilityLabel={`Step ${i + 1}: ${s.text}, floor ${s.floor}`}
                onPress={() => goStep(i)}
                style={(st) => [styles.step, { borderColor: active ? theme.gold : 'transparent', backgroundColor: active ? theme.accentTint : 'transparent' }, st.pressed && { opacity: Opacity.pressed }]}>
                <View style={[styles.stepIcon, { backgroundColor: s.kind === 'arrive' ? theme.accent : theme.backgroundSelected }]}>
                  <Icon name={STEP_ICON[s.kind]} size="md" color={s.kind === 'arrive' ? 'accentText' : 'accentLink'} />
                </View>
                <ThemedText type="small" style={styles.flex}>
                  {s.text}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  F{s.floor}
                </ThemedText>
              </Pressable>
            );
          })}
          <ThemedText type="caption" themeColor="textSecondary">
            Distances and times are estimates. Tap a step to see it on the plan.
          </ThemedText>
        </ScrollView>
      ) : to && !route ? (
        <View style={styles.pad}>
          <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
            {accessible ? 'No step-free route found. Turn off step-free to allow stairs.' : 'No route found between these two places.'}
          </ThemedText>
        </View>
      ) : (
        <View style={styles.flex}>
          <ThemedText type="smallBold" style={styles.prompt}>
            Where to? Pick a room below or tap one on the plan.
          </ThemedText>
          <RoomList rooms={rooms} otherRooms={otherRooms} selectedCode={null} onSelect={(r) => r && choose(r)} />
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={!!floor} animationType="fade" onRequestClose={close}>
      <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.layout, wide && styles.layoutWide]}>
          {wide ? <View style={[styles.sidebar, { backgroundColor: theme.backgroundElement, borderRightColor: theme.border }]}>{panel}</View> : null}

          <View style={styles.planArea}>
            <View style={styles.plan}>
              <View style={styles.paper} onLayout={(e) => setPlanBox(e.nativeEvent.layout)}>
              {floor && (
                <ScrollView horizontal contentContainerStyle={{ width: Math.max(canvas, planBox.width), height: Math.max(canvas, planBox.height), alignItems: 'center', justifyContent: 'center' }} showsHorizontalScrollIndicator={zoom > 1}>
                  <ScrollView nestedScrollEnabled contentContainerStyle={{ width: Math.max(canvas, planBox.width), height: Math.max(canvas, planBox.height), alignItems: 'center', justifyContent: 'center' }} showsVerticalScrollIndicator={zoom > 1}>
                    <View style={{ width: canvas, height: canvas }}>
                      <Image source={floor.image} style={StyleSheet.absoluteFill} contentFit="contain" />
                      <Image source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` }} style={StyleSheet.absoluteFill} contentFit="contain" />
                      {regions.map((r) => {
                        const target = rooms.find((x) => x.code === r.code);
                        if (!target) return null;
                        return (
                          <Pressable
                            key={r.code}
                            accessibilityRole="button"
                            accessibilityLabel={`Room ${target.label}. Get directions`}
                            onPress={() => choose(target)}
                            style={(st) => [styles.region, (st as { hovered?: boolean }).hovered && { backgroundColor: theme.accentTint }, { left: `${(r.x / 1024) * 100}%`, top: `${(r.y / 1024) * 100}%`, width: `${(r.width / 1024) * 100}%`, height: `${(r.height / 1024) * 100}%` }]}
                          />
                        );
                      })}
                    </View>
                  </ScrollView>
                </ScrollView>
              )}
              </View>

              <View style={styles.floorBar} accessibilityRole="tablist">
                {MOLSON_FLOORS.map((f) => {
                  const active = f.id === floor?.id;
                  const onRoute = route?.floors.includes(Number(f.id));
                  return (
                    <Pressable key={f.id} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={f.label} onPress={() => onSelect(f)} style={[styles.floorTab, { backgroundColor: active ? FixedColors.shellActive : FixedColors.shell, borderColor: onRoute ? FixedColors.gold : FixedColors.shellBorder }]}>
                      <ThemedText type="smallBold" style={styles.onShell}>
                        {f.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.zoom}>
                <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" disabled={zoom >= MAX_ZOOM} onPress={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.5).toFixed(1)))} style={[styles.zoomBtn, zoom >= MAX_ZOOM && { opacity: Opacity.disabled }]}>
                  <Icon name="zoom-in" size="lg" color={FixedColors.shellText} />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Zoom out" disabled={zoom <= MIN_ZOOM} onPress={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.5).toFixed(1)))} style={[styles.zoomBtn, zoom <= MIN_ZOOM && { opacity: Opacity.disabled }]}>
                  <Icon name="zoom-out" size="lg" color={FixedColors.shellText} />
                </Pressable>
              </View>

              {route ? (
                <View style={styles.legend} pointerEvents="none">
                  <View style={[styles.legendDot, { backgroundColor: FixedColors.routeStart }]} />
                  <ThemedText type="caption" style={styles.onShell}>
                    Start
                  </ThemedText>
                  <View style={[styles.legendDot, { backgroundColor: FixedColors.roomHighlight }]} />
                  <ThemedText type="caption" style={styles.onShell}>
                    Destination
                  </ThemedText>
                  <ThemedText type="caption" style={styles.onShell}>
                    E lift · S stairs
                  </ThemedText>
                </View>
              ) : null}

              {!wide ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Back to the building" onPress={close} style={styles.backFloat}>
                  <Icon name="arrow-back" size="lg" color={FixedColors.shellText} />
                </Pressable>
              ) : null}
            </View>

            {!wide ? <View style={[styles.sheet, { backgroundColor: theme.backgroundElement, borderTopColor: theme.border }]}>{panel}</View> : null}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  layout: { flex: 1 },
  layoutWide: { flexDirection: 'row' },
  flex: { flex: 1 },
  sidebar: { width: Size.planSidebar, borderRightWidth: StyleSheet.hairlineWidth },
  sheet: { height: '50%', borderTopWidth: StyleSheet.hairlineWidth },
  panelInner: { flex: 1, padding: Spacing.three, gap: Spacing.three },
  panelHead: { gap: Spacing.one },
  back: { minHeight: TouchTarget, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, alignSelf: 'flex-start' },
  form: { gap: Spacing.one },
  field: { minHeight: TouchTarget + Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three, borderRadius: Radius.lg, borderWidth: 1 },
  dot: { width: Spacing.three, height: Spacing.three, borderRadius: Radius.pill },
  swap: { alignSelf: 'flex-end', width: TouchTarget - Spacing.two, height: TouchTarget - Spacing.two, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center', marginVertical: -Spacing.one },
  toggle: { minHeight: TouchTarget, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, borderRadius: Radius.pill, alignSelf: 'flex-start' },
  pickHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entrance: { minHeight: TouchTarget, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three, borderRadius: Radius.md, marginBottom: Spacing.two },
  prompt: { marginBottom: Spacing.two },
  pad: { padding: Spacing.three },
  steps: { gap: Spacing.one, paddingBottom: Spacing.four },
  summary: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.half, marginBottom: Spacing.two },
  summaryText: { color: FixedColors.shellText },
  summaryMuted: { color: FixedColors.shellMuted },
  floorChips: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.two },
  chip: { minHeight: TouchTarget - Spacing.two, paddingHorizontal: Spacing.three, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  step: { minHeight: TouchTarget + Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.two, borderRadius: Radius.md, borderWidth: 2 },
  stepIcon: { width: TouchTarget - Spacing.two, height: TouchTarget - Spacing.two, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  planArea: { flex: 1 },
  plan: { flex: 1, backgroundColor: FixedColors.shell, padding: Spacing.three },
  paper: { flex: 1, backgroundColor: FixedColors.planSurface, borderRadius: Radius.xl, overflow: 'hidden', ...Elevation.raised },
  region: { position: 'absolute', cursor: 'pointer' },
  floorBar: { position: 'absolute', top: Spacing.five, left: Spacing.five, flexDirection: 'row', gap: Spacing.two },
  floorTab: { minHeight: TouchTarget, paddingHorizontal: Spacing.three, borderRadius: Radius.pill, borderWidth: 2, alignItems: 'center', justifyContent: 'center', ...Elevation.card },
  onShell: { color: FixedColors.shellText },
  zoom: { position: 'absolute', right: Spacing.five, bottom: Spacing.five, gap: Spacing.two },
  zoomBtn: { width: TouchTarget, height: TouchTarget, borderRadius: Radius.pill, backgroundColor: FixedColors.shell, alignItems: 'center', justifyContent: 'center', ...Elevation.card },
  legend: { position: 'absolute', left: Spacing.five, bottom: Spacing.five, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: FixedColors.shell, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Radius.pill },
  legendDot: { width: Spacing.two + Spacing.half, height: Spacing.two + Spacing.half, borderRadius: Radius.pill },
  backFloat: { position: 'absolute', top: Spacing.five, right: Spacing.five, width: TouchTarget, height: TouchTarget, borderRadius: Radius.pill, backgroundColor: FixedColors.shell, alignItems: 'center', justifyContent: 'center', ...Elevation.card },
});
