import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Elevation, FixedColors, Opacity, Radius, Size, Spacing, TouchTarget } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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

/** Schematic campus map drawn from real building coordinates: pins, your route and the next class. */
export function CampusMap({ buildings, campus, height, selected, next, here, onSelect }: Props) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  const placed = useMemo(() => {
    const list = buildings.filter((b) => b.campus === campus && b.latitude != null && b.longitude != null);
    if (list.length === 0 || width === 0) return [];
    const lats = list.map((b) => b.latitude!);
    const lons = list.map((b) => b.longitude!);
    const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const k = Math.cos((midLat * Math.PI) / 180);
    const dx = Math.max((Math.max(...lons) - Math.min(...lons)) * k, 1e-6);
    const dy = Math.max(Math.max(...lats) - Math.min(...lats), 1e-6);
    const pad = Spacing.five;
    const scale = Math.min((width - pad * 2) / dx, (height - pad * 2) / dy);
    const ox = (width - dx * scale) / 2;
    const oy = (height - dy * scale) / 2;
    return list.map((b) => ({
      b,
      x: ox + (b.longitude! - Math.min(...lons)) * k * scale,
      y: oy + (Math.max(...lats) - b.latitude!) * scale,
    }));
  }, [buildings, campus, width, height]);

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
      {/* Faint blocks give it a street-map feel without pretending to be one. */}
      {[0.25, 0.5, 0.75].map((f) => (
        <View key={`h${f}`} style={[styles.gridH, { top: `${f * 100}%`, backgroundColor: theme.border }]} />
      ))}
      {[0.2, 0.4, 0.6, 0.8].map((f) => (
        <View key={`v${f}`} style={[styles.gridV, { left: `${f * 100}%`, backgroundColor: theme.border }]} />
      ))}
      {line ? (
        <View
          style={[styles.route, { left: line.left, top: line.top, width: line.width, backgroundColor: theme.accentLink, transform: [{ rotate: `${line.angle}rad` }] }]}
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
            hitSlop={onSelect ? Spacing.two : 0}
            style={({ pressed }) => [styles.pinWrap, { left: x - TouchTarget / 2, top: y - TouchTarget / 2 }, pressed && { opacity: Opacity.pressed }]}>
            <View
              style={[
                styles.pin,
                isNext || isSel
                  ? { backgroundColor: FixedColors.shellActive, borderColor: FixedColors.gold, width: PIN + Spacing.two, height: PIN + Spacing.two }
                  : isHere
                    ? { backgroundColor: theme.success, borderColor: theme.backgroundElement }
                    : { backgroundColor: theme.accentLink, borderColor: theme.backgroundElement, opacity: 0.75 },
              ]}
            />
            {labelled ? (
              <View style={[styles.label, { backgroundColor: FixedColors.shell }]}>
                <ThemedText type="caption" numberOfLines={1} style={styles.labelText}>
                  {isHere && !isNext ? `${b.code} · you` : isNext ? `${b.code} · next` : b.code}
                </ThemedText>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', position: 'relative' },
  gridH: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth },
  route: { position: 'absolute', height: 3, borderRadius: Radius.pill, opacity: 0.8 },
  pinWrap: { position: 'absolute', width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
  pin: { width: PIN, height: PIN, borderRadius: Radius.pill, borderWidth: 2, ...Elevation.card },
  label: { position: 'absolute', top: TouchTarget / 2 + Spacing.one, left: (TouchTarget - Size.pinLabelWidth) / 2, width: Size.pinLabelWidth, paddingVertical: Spacing.half, borderRadius: Radius.pill, alignItems: 'center' },
  labelText: { color: FixedColors.shellText },
});
