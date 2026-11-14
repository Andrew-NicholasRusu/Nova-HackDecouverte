import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { BuildingViewer } from '@/components/floorplan/building-viewer';
import { FloorPlanModal } from '@/components/floorplan/floor-plan-modal';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { Dropdown } from '@/components/ui/dropdown';
import { Icon } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { Floor, MOLSON_FLOORS } from '@/constants/floorplans';
import { Elevation, FixedColors, Opacity, Radius, Size, Spacing, TouchTarget, Typography } from '@/constants/theme';
import { useBrain } from '@/features/brain/use-brain';
import { CampusMap } from '@/features/navigator/campus-map';
import { useBuildings, type Building } from '@/features/navigator/use-buildings';
import { useProfile } from '@/features/profile/use-profile';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import { directionsUrl, walkMinutes } from '@/lib/geo';
import { usePersisted } from '@/lib/persisted-store';
import { getOtherRooms, getRooms } from '@/lib/floorplan/navmesh';

const CAMPUS_NAMES: Record<string, string> = { SGW: 'Sir George Williams', LOY: 'Loyola' };
const CAMPUS_OPTIONS = [
  { value: 'ALL', label: 'Both campuses' },
  { value: 'SGW', label: 'Sir George Williams' },
  { value: 'LOY', label: 'Loyola' },
] as const;
type CampusFilter = (typeof CAMPUS_OPTIONS)[number]['value'];

const allRooms = getOtherRooms('');
const hasCoords = (b: Building): b is Building & { latitude: number; longitude: number } =>
  b.latitude != null && b.longitude != null;

function BuildingTile({
  b,
  selected,
  isNext,
  walkFrom,
  onSelect,
}: {
  b: Building;
  selected: boolean;
  isNext: boolean;
  walkFrom: { code: string; latitude: number; longitude: number } | null;
  onSelect: () => void;
}) {
  const theme = useTheme();
  const walk = walkFrom && hasCoords(b) && walkFrom.code !== b.code ? walkMinutes(walkFrom, b) : null;
  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: theme.backgroundElement, borderColor: selected ? theme.gold : theme.border },
        selected && styles.tileSelected,
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${b.code}, ${b.longName || b.name}, ${b.address}`}
        onPress={onSelect}
        style={(s) => [styles.tileMain, s.pressed && { opacity: Opacity.pressed }]}>
        <View style={styles.tileTop}>
          <View style={styles.code}>
            <ThemedText type="heading" style={styles.codeText}>
              {b.code}
            </ThemedText>
          </View>
          <View style={styles.tileBadges}>
            {isNext ? <Pill label="Next class" tone="gold" /> : null}
            {b.code === 'MB' ? <Pill label="Floor plans" tone="accent" /> : null}
          </View>
        </View>
        <View style={styles.tileText}>
          <ThemedText type="smallBold" numberOfLines={2}>
            {b.longName || b.name}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            {b.address}
          </ThemedText>
        </View>
      </Pressable>
      <View style={styles.tileFoot}>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.flex}>
          {CAMPUS_NAMES[b.campus] ?? b.campus}
          {walk !== null ? ` · ${walk} min from ${walkFrom!.code}` : ''}
        </ThemedText>
        {hasCoords(b) && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Walking directions to ${b.code}`}
            onPress={() => Linking.openURL(directionsUrl(b))}
            style={({ pressed }) => [styles.dir, { backgroundColor: theme.accentTint }, pressed && { opacity: Opacity.pressed }]}>
            <Icon name="near-me" size="md" color="accentLink" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function NavigatorScreen() {
  const params = useLocalSearchParams<{ building?: string; room?: string }>();
  const theme = useTheme();
  const { isWide, isMedium } = useLayout();
  const data = useBuildings();
  const plan = useBrain();
  const profile = useProfile();

  const [floor, setFloor] = useState<Floor | null>(null);
  const [focusRoom, setFocusRoom] = useState<string | undefined>(undefined);
  const [campus, setCampus] = usePersisted<CampusFilter>('orbit.map.campus', 'ALL');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  // Deep links from search, the dashboard plan and Campus Live: adjusted during render, not in effects.
  const [seen, setSeen] = useState<string>('');
  const paramKey = `${params.building ?? ''}|${params.room ?? ''}`;
  if (paramKey !== seen) {
    setSeen(paramKey);
    if (params.building) {
      setSelected(params.building.toUpperCase());
      setCampus('ALL');
    }
    if (params.room) {
      const r = allRooms.find((x) => x.label === params.room);
      const f = r && MOLSON_FLOORS.find((x) => x.id === r.floor);
      if (f) {
        setFocusRoom(r.label);
        setFloor(f);
      }
    }
  }

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return { buildings: [] as Building[], rooms: [] as typeof allRooms };
    const buildings = data.status === 'ready' ? data.buildings.filter((b) => `${b.code} ${b.longName} ${b.name} ${b.address}`.toLowerCase().includes(q)).slice(0, 5) : [];
    const rooms = allRooms.filter((r) => r.label.toLowerCase().includes(q)).slice(0, 5);
    return { buildings, rooms };
  }, [q, data]);

  const walkFrom = useMemo(() => {
    if (data.status !== 'ready' || !plan.next) return null;
    const b = data.buildings.find((x) => x.code === plan.next!.event.buildingCode);
    return b && hasCoords(b) ? { code: b.code, latitude: b.latitude, longitude: b.longitude } : null;
  }, [data, plan.next]);

  const list = useMemo(() => {
    if (data.status !== 'ready') return [];
    const filtered = data.buildings.filter((b) => (campus === 'ALL' || b.campus === campus) && (!q || `${b.code} ${b.longName} ${b.name} ${b.address}`.toLowerCase().includes(q)));
    return filtered.sort(
      (a, b) =>
        Number(b.code === selected) - Number(a.code === selected) ||
        Number(b.campus === 'SGW') - Number(a.campus === 'SGW') ||
        a.code.localeCompare(b.code),
    );
  }, [data, campus, q, selected]);

  const mapCampus = campus === 'ALL' ? (plan.nextBuilding?.campus ?? profile?.preferred_campus ?? 'SGW') : campus;
  const selectedBuilding = data.status === 'ready' ? data.buildings.find((b) => b.code === selected && b.campus === mapCampus) : undefined;
  const nextBuilding = plan.next?.event.buildingCode ?? '';
  const nextRoomLabel = plan.next ? `MB-${plan.next.event.room}` : '';
  const nextRoom = nextBuilding === 'MB' ? allRooms.find((r) => r.label === nextRoomLabel) : undefined;
  const nextBuildingData = data.status === 'ready' ? data.buildings.find((b) => b.code === nextBuilding) : undefined;

  const openRoom = (label: string) => {
    const r = allRooms.find((x) => x.label === label);
    const f = r && MOLSON_FLOORS.find((x) => x.id === r.floor);
    if (f) {
      setFocusRoom(label);
      setFloor(f);
    }
    setQuery('');
  };

  const stage = (
    <View style={styles.stage}>
      <View style={styles.stageViewer}>
        <BuildingViewer onSelect={(f) => { setFocusRoom(undefined); setFloor(f); }} />
      </View>
      <View style={styles.stageInfo}>
        <ThemedText type="caption" style={styles.stageKicker}>
          Sir George Williams · Indoor maps
        </ThemedText>
        <ThemedText type="displaySmall" style={styles.stageTitle}>
          Molson Building
        </ThemedText>
        <ThemedText type="small" style={styles.stageSub}>
          John Molson School of Business. Tap a floor on the building or below to explore every room.
        </ThemedText>
        <View style={styles.floors}>
          {MOLSON_FLOORS.map((f) => (
            <Pressable
              key={f.id}
              accessibilityRole="button"
              accessibilityLabel={`Open ${f.label} plan, ${getRooms(f.id).length} rooms`}
              onPress={() => { setFocusRoom(undefined); setFloor(f); }}
              style={(s) => [styles.floorTile, (s as { hovered?: boolean }).hovered && { backgroundColor: FixedColors.shellHover }, s.pressed && { opacity: Opacity.pressed }]}>
              <View>
                <ThemedText type="heading" style={styles.stageTitle}>
                  {f.label}
                </ThemedText>
                <ThemedText type="caption" style={styles.stageSub}>
                  {getRooms(f.id).length} rooms mapped
                </ThemedText>
              </View>
              <Icon name="arrow-forward" size="lg" color={FixedColors.gold} />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  const nextStop = (
    <Card style={styles.next}>
      <View style={styles.nextHead}>
        <Icon name="flag" size="lg" color="accentLink" />
        <ThemedText type="heading" accessibilityRole="header">
          Your next stop
        </ThemedText>
      </View>
      {plan.next ? (
        <>
          <ThemedText type="subtitle">{plan.next.event.courseCode}</ThemedText>
          <ThemedText type="default">
            {[plan.next.event.buildingCode, plan.next.event.room].filter(Boolean).join(' ') || 'Room not set'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {plan.next.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            {plan.walkToNext !== null ? ` · ${plan.walkToNext} min walk` : ''}
            {plan.leaveBy ? ` · leave by ${plan.leaveBy.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
          </ThemedText>
          <View style={styles.nextActions}>
            {nextRoom && (
              <Button label="Open floor plan" icon="meeting-room" onPress={() => openRoom(nextRoom.label)} />
            )}
            {nextBuildingData && hasCoords(nextBuildingData) && (
              <Button label="Walking directions" icon="near-me" variant={nextRoom ? 'secondary' : 'primary'} onPress={() => Linking.openURL(directionsUrl(nextBuildingData))} />
            )}
          </View>
        </>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          Add your classes and the map will route you to your next room, with the walk time.
        </ThemedText>
      )}
    </Card>
  );

  return (
    <Screen title="Map" subtitle="Find any building or room, and get there on time">
      <View style={styles.searchWrap}>
        <View style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Icon name="search" size="lg" color="textSecondary" />
          <SearchInput value={query} onChange={setQuery} onSubmit={() => (matches.rooms[0] ? openRoom(matches.rooms[0].label) : matches.buildings[0] ? (setSelected(matches.buildings[0].code), setCampus('ALL'), setQuery('')) : undefined)} color={theme.text} placeholderColor={theme.textSecondary} />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.clear}>
              <Icon name="close" size="md" color="textSecondary" />
            </Pressable>
          ) : null}
        </View>
        {!!q && (
          <Dropdown>
            {matches.rooms.length + matches.buildings.length === 0 ? (
              <View style={styles.empty}>
                <ThemedText type="small" themeColor="textSecondary">
                  No building or room matches “{query.trim()}”.
                </ThemedText>
              </View>
            ) : (
              <>
                {matches.rooms.map((r) => (
                  <Pressable key={r.label} accessibilityRole="button" accessibilityLabel={`Room ${r.label}, floor ${r.floor}`} onPress={() => openRoom(r.label)} style={styles.result}>
                    <Icon name="meeting-room" size="lg" color="accentLink" />
                    <View style={styles.flex}>
                      <ThemedText type="smallBold">{r.label}</ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary">
                        Molson Building · floor {r.floor}
                      </ThemedText>
                    </View>
                  </Pressable>
                ))}
                {matches.buildings.map((b) => (
                  <Pressable key={`${b.campus}-${b.code}`} accessibilityRole="button" accessibilityLabel={`${b.code}, ${b.longName}`} onPress={() => { setSelected(b.code); setCampus('ALL'); setQuery(''); }} style={styles.result}>
                    <Icon name="apartment" size="lg" color="accentLink" />
                    <View style={styles.flex}>
                      <ThemedText type="smallBold">
                        {b.code} · {b.longName || b.name}
                      </ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary">
                        {b.address}
                      </ThemedText>
                    </View>
                  </Pressable>
                ))}
              </>
            )}
          </Dropdown>
        )}
      </View>

      <View style={[styles.top, isWide && styles.topRow]}>
        <View style={[styles.stageCard, isWide && styles.flex2]}>{stage}</View>
        <View style={isWide ? styles.flex1 : undefined}>{nextStop}</View>
      </View>

      {data.status === 'ready' ? (
        <Card>
          <View style={styles.nextHead}>
            <Icon name="map" size="lg" color="accentLink" />
            <ThemedText type="heading" accessibilityRole="header">
              {CAMPUS_NAMES[mapCampus] ?? mapCampus} campus
            </ThemedText>
          </View>
          <CampusMap buildings={data.buildings} campus={mapCampus} height={isWide ? Size.campusMapWide : Size.campusMap} selected={selected} next={nextBuilding} here={plan.here?.code} onSelect={(code) => setSelected(selected === code ? null : code)} />
          {selectedBuilding ? (
            <View style={styles.callout}>
              <View style={styles.flex}>
                <ThemedText type="smallBold">
                  {selectedBuilding.code} · {selectedBuilding.longName || selectedBuilding.name}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {selectedBuilding.address}
                </ThemedText>
              </View>
              {hasCoords(selectedBuilding) ? <Button label="Directions" icon="near-me" onPress={() => Linking.openURL(directionsUrl(selectedBuilding))} /> : null}
            </View>
          ) : (
            <ThemedText type="caption" themeColor="textSecondary">
              Tap a pin to see the building. Gold is your next class, green is where you are.
            </ThemedText>
          )}
        </Card>
      ) : null}

      <View style={styles.dirHead}>
        <ThemedText type="subtitle" accessibilityRole="header">
          Building directory
        </ThemedText>
        <ChoiceChips label="Campus" options={CAMPUS_OPTIONS} value={campus} onChange={setCampus} />
      </View>

      {data.status === 'loading' && (
        <View style={[styles.grid, isMedium && styles.gridRow]}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={isMedium ? styles.cell : undefined}>
              <Card>
                <Skeleton width="30%" height={32} />
                <Skeleton width="70%" />
                <Skeleton width="50%" />
              </Card>
            </View>
          ))}
        </View>
      )}
      {data.status === 'error' && <ErrorState message={data.message} onRetry={data.retry} />}
      {data.status === 'ready' && list.length === 0 && <EmptyState title="No buildings found" message="Try another name, code or campus." />}
      {data.status === 'ready' && list.length > 0 && (
        <View style={[styles.grid, isMedium && styles.gridRow]}>
          {list.map((b) => (
            <View key={`${b.campus}-${b.code}`} style={isMedium ? (isWide ? styles.cell3 : styles.cell) : undefined}>
              <BuildingTile b={b} selected={selected === b.code} isNext={nextBuilding === b.code} walkFrom={walkFrom} onSelect={() => setSelected(selected === b.code ? null : b.code)} />
            </View>
          ))}
        </View>
      )}

      <FloorPlanModal floor={floor} onSelect={setFloor} onClose={() => { setFloor(null); setFocusRoom(undefined); }} focusRoom={focusRoom} />
    </Screen>
  );
}

function SearchInput({ value, onChange, onSubmit, color, placeholderColor }: { value: string; onChange: (v: string) => void; onSubmit: () => void; color: string; placeholderColor: string }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      onSubmitEditing={onSubmit}
      placeholder="Search a building, address or room, e.g. EV, Guy, 1.130"
      placeholderTextColor={placeholderColor}
      accessibilityLabel="Search buildings and rooms"
      autoCorrect={false}
      autoCapitalize="none"
      style={[styles.input, { color }]}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  searchWrap: { position: 'relative', zIndex: 30 },
  search: { minHeight: TouchTarget + Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingLeft: Spacing.four, borderRadius: Radius.pill, borderWidth: 1, ...Elevation.card },
  input: { flex: 1, minHeight: TouchTarget, ...Typography.body, outlineStyle: 'none' } as object,
  clear: { width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
  result: { minHeight: TouchTarget + Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.four },
  empty: { padding: Spacing.four },
  top: { gap: Spacing.four },
  topRow: { flexDirection: 'row', alignItems: 'stretch' },
  stageCard: { backgroundColor: FixedColors.shell, borderRadius: Radius.xl, padding: Spacing.four, borderWidth: 1, borderColor: FixedColors.shellBorder, ...Elevation.raised },
  stage: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.four, alignItems: 'center' },
  stageViewer: { width: Size.stageViewer, maxWidth: '100%', borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: FixedColors.planSurface },
  stageInfo: { flex: 1, minWidth: Size.stageInfoMin, gap: Spacing.two },
  stageKicker: { color: FixedColors.gold, textTransform: 'uppercase', letterSpacing: 1.5 },
  stageTitle: { color: FixedColors.shellText },
  stageSub: { color: FixedColors.shellMuted },
  floors: { gap: Spacing.two, marginTop: Spacing.two },
  floorTile: { minHeight: TouchTarget + Spacing.three, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.three, borderRadius: Radius.lg, backgroundColor: FixedColors.shellRaised, borderWidth: 1, borderColor: FixedColors.shellBorder },
  next: { gap: Spacing.two },
  callout: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, flexWrap: 'wrap' },
  nextHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  nextActions: { gap: Spacing.two, marginTop: Spacing.two },
  dirHead: { gap: Spacing.three },
  grid: { gap: Spacing.three },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { flexBasis: '48%', flexGrow: 1 },
  cell3: { flexBasis: '31%', flexGrow: 1 },
  tile: { borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.four, gap: Spacing.three, ...Elevation.card },
  tileSelected: { borderWidth: 2 },
  tileMain: { gap: Spacing.three },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tileBadges: { flexDirection: 'row', gap: Spacing.one, flexWrap: 'wrap', justifyContent: 'flex-end' },
  code: { minWidth: TouchTarget + Spacing.two, height: TouchTarget, paddingHorizontal: Spacing.three, borderRadius: Radius.md, backgroundColor: FixedColors.shellActive, alignItems: 'center', justifyContent: 'center' },
  codeText: { color: FixedColors.gold },
  tileText: { gap: Spacing.half },
  tileFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  dir: { width: TouchTarget, height: TouchTarget, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
});
