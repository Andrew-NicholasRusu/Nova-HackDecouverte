import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Elevation, FixedColors, Opacity, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { FALLBACK_BUILDINGS } from './fallback-buildings';
import type { Building } from './use-buildings';

type Props = {
  buildings: Building[];
  campus: string;
  height: number;
  selected?: string | null;
  /** Building of the next class (gold ring, always labelled). */
  next?: string | null;
  /** Building the student is in or just left. */
  here?: string | null;
  onSelect?: (code: string) => void;
};

const PIN = Spacing.three;
const TILE = 256;
const MAX_ZOOM = 18;
const MIN_ZOOM = 13;
const LABEL_WIDTH = 88;

/** Web-mercator world pixel for a coordinate at zoom `z` (256 px tiles). */
const worldX = (lon: number, z: number) => ((lon + 180) / 360) * TILE * 2 ** z;
const worldY = (lat: number, z: number) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * TILE * 2 ** z;
};

/**
 * Campus map: OpenStreetMap tiles with a pin for each building, your route and the next class.
 * If Concordia's building list is unavailable it falls back to built-in approximate positions.
 */
export function CampusMap({ buildings, campus, height, selected, next, here, onSelect }: Props) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  const view = useMemo(() => {
    const live = buildings.filter((b) => b.campus === campus && b.latitude != null && b.longitude != null);
    const list = live.length > 0 ? live : FALLBACK_BUILDINGS.filter((b) => b.campus === campus);
    if (list.length === 0 || width === 0) return null;
    const pad = Spacing.five;
    let z = MIN_ZOOM;
    for (let t = MAX_ZOOM; t >= MIN_ZOOM; t--) {
      const xs = list.map((b) => worldX(b.longitude!, t));
      const ys = list.map((b) => worldY(b.latitude!, t));
      if (Math.max(...xs) - Math.min(...xs) <= width - pad * 2 && Math.max(...ys) - Math.min(...ys) <= height - pad * 2) {
        z = t;
        break;
      }
    }
    const xs = list.map((b) => worldX(b.longitude!, z));
    const ys = list.map((b) => worldY(b.latitude!, z));
    const ox = (Math.min(...xs) + Math.max(...xs)) / 2 - width / 2;
    const oy = (Math.min(...ys) + Math.max(...ys)) / 2 - height / 2;
    const tiles: { key: string; left: number; top: number; uri: string }[] = [];
    for (let tx = Math.floor(ox / TILE); tx <= Math.floor((ox + width) / TILE); tx++) {
      for (let ty = Math.floor(oy / TILE); ty <= Math.floor((oy + height) / TILE); ty++) {
        tiles.push({ key: `${tx}/${ty}`, left: tx * TILE - ox, top: ty * TILE - oy, uri: `https://tile.openstreetmap.org/${z}/${tx}/${ty}.png` });
      }
    }
    return { tiles, placed: list.map((b, i) => ({ b, x: xs[i] - ox, y: ys[i] - oy })) };
  }, [buildings, campus, width, height]);

  const placed = view?.placed ?? [];
  const at = (code?: string | null) => placed.find((p) => p.b.code === code);
  const from = at(here);
  const to = at(next);
  const line =
    from && to && from !== to
      ? {
          left: (from.x + to.x) / 2 - Math.hypot(to.x - from.x, to.y - from.y) / 2,
          top: (from.y + to.y) / 2,
          width: Math.hypot(to.x - from.x, to.y - from.y),
          angle: Math.atan2(to.y - from.y, to.x - from.x),
        }
      : null;

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityLabel={`${campus === 'LOY' ? 'Loyola' : 'Sir George Williams'} campus map`}
      style={[styles.map, { height, backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
      {view?.tiles.map((t) => (
        <Image key={t.key} source={{ uri: t.uri }} style={[styles.tile, { left: t.left, top: t.top }]} accessibilityElementsHidden />
      ))}
      {line ? (
        <View
          style={[styles.route, { left: line.left, top: line.top, width: line.width, backgroundColor: FixedColors.shellActive, transform: [{ rotate: `${line.angle}rad` }] }]}
        />
      ) : null}
      {placed.map(({ b, x, y }) => {
        const isSel = selected === b.code;
        const isNext = next === b.code;
        const isHere = here === b.code;
        const labelled = isSel || isNext || isHere;
        return (
          <Pressable
            key={b.code}
            disabled={!onSelect}
            accessibilityRole={onSelect ? 'button' : undefined}
            accessibilityLabel={`${b.code}, ${b.longName || b.name}${isNext ? ', next class' : ''}`}
            onPress={() => onSelect?.(b.code)}
            style={({ pressed }) => [styles.pinWrap, { left: x - TouchTarget / 2, top: y - TouchTarget / 2 }, pressed && { opacity: Opacity.pressed }]}>
            <View
              style={[
                styles.pin,
                isNext || isSel
                  ? { backgroundColor: FixedColors.shellActive, borderColor: FixedColors.gold, width: PIN + Spacing.two, height: PIN + Spacing.two }
                  : isHere
                    ? { backgroundColor: FixedColors.routeStart, borderColor: FixedColors.white }
                    : { backgroundColor: FixedColors.shellActive, borderColor: FixedColors.white },
              ]}
            />
            {labelled || onSelect ? (
              <View style={[styles.label, { backgroundColor: FixedColors.shell }, !labelled && styles.labelQuiet]}>
                <ThemedText type="caption" numberOfLines={1} style={styles.labelText}>
                  {isHere && !isNext ? `${b.code} · you` : isNext ? `${b.code} · next` : b.code}
                </ThemedText>
              </View>
            ) : null}
          </Pressable>
        );
      })}
      <View style={styles.credit} pointerEvents="none">
        <ThemedText type="caption" style={styles.creditText}>
          © OpenStreetMap
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', position: 'relative' },
  tile: { position: 'absolute', width: TILE, height: TILE },
  route: { position: 'absolute', height: 4, borderRadius: Radius.pill, opacity: 0.85 },
  pinWrap: { position: 'absolute', width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
  pin: { width: PIN, height: PIN, borderRadius: Radius.pill, borderWidth: 2, ...Elevation.card },
  label: { position: 'absolute', top: TouchTarget / 2 + Spacing.one, left: (TouchTarget - LABEL_WIDTH) / 2, width: LABEL_WIDTH, paddingVertical: Spacing.half, borderRadius: Radius.pill, alignItems: 'center' },
  labelQuiet: { backgroundColor: FixedColors.heroGlass, width: LABEL_WIDTH / 2, left: (TouchTarget - LABEL_WIDTH / 2) / 2 },
  labelText: { color: FixedColors.shellText },
  credit: { position: 'absolute', right: Spacing.one, bottom: Spacing.one, backgroundColor: FixedColors.heroGlass, paddingHorizontal: Spacing.one, borderRadius: Radius.sm },
  creditText: { color: FixedColors.shellText, fontSize: 10, lineHeight: 12 },
});
