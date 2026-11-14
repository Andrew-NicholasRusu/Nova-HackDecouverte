import { type ComponentRef, useCallback, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, TextInput, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { Dropdown } from '@/components/ui/dropdown';
import { Icon } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { ThemedText } from '@/components/ui/themed-text';
import { FALLBACK_BUILDINGS } from '@/data/buildings';
import { STORAGE_KEYS } from '@/data/constants';
import { CAMPUSES, type CampusFilter } from '@/data/enums';
import { CAMPUS_NAME, campusName } from '@/data/labels';
import type { Building, Floor, Room } from '@/data/types';
import { useBrain } from '@/features/brain/use-brain';
import { BuildingViewer } from '@/features/navigator/components/building-viewer';
import { CampusMap } from '@/features/navigator/components/campus-map';
import { FloorPlanModal } from '@/features/navigator/components/floor-plan-modal';
import { ALL_ROOMS, findRoom } from '@/features/navigator/floorplan/navmesh';
import { filterBuildings, hasCoords, matchesBuilding, useBuildings } from '@/features/navigator/use-buildings';
import { useProfile } from '@/features/profile/use-profile';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import { directionsUrl, walkMinutes } from '@/lib/geo';
import { useDismissOutside, useOverlay } from '@/lib/overlay';
import { usePersisted } from '@/lib/persisted-store';
import { Opacity, Size } from '@/styles/theme';

import { styles } from './navigator-screen.styles';

const CAMPUS_OPTIONS: { value: CampusFilter; label: string }[] = [
  { value: 'ALL', label: 'Both campuses' },
  ...CAMPUSES.map((value) => ({ value, label: CAMPUS_NAME[value] })),
];


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
          {campusName(b.campus)}
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

export function NavigatorScreen() {
  const params = useLocalSearchParams<{ building?: string; room?: string }>();
  const theme = useTheme();
  const { isWide, isMedium } = useLayout();
  const data = useBuildings();
  const plan = useBrain();
  const profile = useProfile();

  const [searchOpen, setSearchOpen] = useOverlay('map-search');
  const searchWrap = useRef<ComponentRef<typeof View>>(null);
  const closeSearch = useCallback(() => setSearchOpen(false), [setSearchOpen]);
  useDismissOutside(searchWrap, searchOpen, closeSearch);
  const [floor, setFloor] = useState<Floor | null>(null);
  const [focusRoom, setFocusRoom] = useState<string | undefined>(undefined);
  const [campus, setCampus] = usePersisted<CampusFilter>(STORAGE_KEYS.mapCampus, 'ALL');
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
    const found = params.room ? findRoom(params.room) : null;
    if (found) {
      setFocusRoom(found.room.label);
      setFloor(found.floor);
    }
  }

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return { buildings: [] as Building[], rooms: [] as Room[] };
    const buildings = data.status === 'ready' ? data.buildings.filter((b) => matchesBuilding(b, q)).slice(0, 5) : [];
    const rooms = ALL_ROOMS.filter((r) => r.label.toLowerCase().includes(q)).slice(0, 5);
    return { buildings, rooms };
  }, [q, data]);

  const walkFrom = useMemo(() => {
    if (data.status !== 'ready' || !plan.next) return null;
    const b = data.buildings.find((x) => x.code === plan.next!.event.buildingCode);
    return b && hasCoords(b) ? { code: b.code, latitude: b.latitude, longitude: b.longitude } : null;
  }, [data, plan.next]);

  const list = useMemo(() => {
    if (data.status !== 'ready') return [];
    return filterBuildings(data.buildings, campus, q, selected);
  }, [data, campus, q, selected]);

  const mapCampus = campus === 'ALL' ? (plan.nextBuilding?.campus ?? profile?.preferred_campus ?? 'SGW') : campus;
  const selectedBuilding = (data.status === 'ready' ? data.buildings : FALLBACK_BUILDINGS).find((b) => b.code === selected && b.campus === mapCampus);
  const nextBuilding = plan.next?.event.buildingCode ?? '';
  const nextRoomLabel = plan.next ? `MB-${plan.next.event.room}` : '';
  const nextRoom = nextBuilding === 'MB' ? findRoom(nextRoomLabel)?.room : undefined;
  const nextBuildingData = data.status === 'ready' ? data.buildings.find((b) => b.code === nextBuilding) : undefined;

  const openRoom = (label: string) => {
    const found = findRoom(label);
    if (found) {
      setFocusRoom(label);
      setFloor(found.floor);
    }
    setQuery('');
  };

  const stage = (
    <View style={styles.stage}>
      <BuildingViewer onSelect={(f) => { setFocusRoom(undefined); setFloor(f); }} />
      <View style={styles.stageInfo}>
        <ThemedText type="heading" style={styles.stageTitle}>
          Molson Building
        </ThemedText>
        <ThemedText type="caption" style={styles.stageSub}>
          Tap a floor on the building to open its plan and get directions.
        </ThemedText>
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
      <View ref={searchWrap} style={styles.searchWrap}>
        <View style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <Icon name="search" size="lg" color="textSecondary" />
          <SearchInput value={query} onFocus={() => setSearchOpen(true)} onChange={setQuery} onSubmit={() => (matches.rooms[0] ? openRoom(matches.rooms[0].label) : matches.buildings[0] ? (setSelected(matches.buildings[0].code), setCampus('ALL'), setQuery('')) : undefined)} color={theme.text} placeholderColor={theme.textSecondary} />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.clear}>
              <Icon name="close" size="md" color="textSecondary" />
            </Pressable>
          ) : null}
        </View>
        {!!q && searchOpen && (
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
        <View style={[styles.stageCard, isWide && styles.stageCardWide]}>{stage}</View>
        <View style={[styles.rightCol, isWide && styles.flex1]}>
          {nextStop}
      <Card>
          <View style={styles.nextHead}>
            <Icon name="map" size="lg" color="accentLink" />
            <ThemedText type="heading" accessibilityRole="header">
              {campusName(mapCampus)} campus
            </ThemedText>
          </View>
          <CampusMap buildings={data.status === 'ready' ? data.buildings : []} campus={mapCampus} height={isWide ? Size.campusMapWide : Size.campusMap} selected={selected} next={nextBuilding} here={plan.here?.code} onSelect={(code) => setSelected(selected === code ? null : code)} />
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

        </View>
      </View>

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

function SearchInput({ value, onFocus, onChange, onSubmit, color, placeholderColor }: { value: string; onFocus: () => void; onChange: (v: string) => void; onSubmit: () => void; color: string; placeholderColor: string }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      onFocus={onFocus}
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
