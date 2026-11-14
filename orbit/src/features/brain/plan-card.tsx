import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Elevation, FixedColors, Opacity, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';

import type { Plan, Suggestion } from './plan';
import { useBrain } from './use-brain';

const ICON: Record<Suggestion['kind'], IconName> = {
  leave: 'directions-walk',
  food: 'restaurant',
  study: 'chair',
  friend: 'group',
};

const TONE_COLOR = {
  success: FixedColors.successOnShell,
  warning: FixedColors.warningOnShell,
  danger: FixedColors.dangerOnShell,
  neutral: FixedColors.shellMuted,
} as const;

const STATE_LABEL: Record<Plan['state'], string> = {
  empty: 'Get started',
  'in-class': 'In class',
  free: 'Free now',
  done: 'Done for today',
};

/**
 * The dashboard brain: one plan across Schedule, Map, Campus Live and Friends. Every suggestion
 * opens the module that can act on it, focused on the right place, class or person.
 */
export function PlanCard() {
  const plan = useBrain();
  const { isMedium } = useLayout();

  return (
    <View style={styles.card} accessibilityRole="summary" accessibilityLabel={`Your plan. ${plan.headline}`}>
      <View style={[styles.head, isMedium && styles.headRow]}>
        <View style={styles.headText}>
          <View style={styles.state}>
            <View style={[styles.dot, { backgroundColor: plan.state === 'free' ? FixedColors.successOnShell : FixedColors.gold }]} />
            <ThemedText type="caption" style={styles.stateText}>
              {STATE_LABEL[plan.state]}
            </ThemedText>
          </View>
          <ThemedText type="displaySmall" style={styles.headline} accessibilityRole="header">
            {plan.headline}
          </ThemedText>
          <ThemedText type="default" style={styles.sub}>
            {plan.sub}
          </ThemedText>
        </View>
        {plan.state === 'empty' ? (
          <Button label="Add classes" icon="add" onPress={() => router.push('/schedule')} />
        ) : plan.next ? (
          <Button
            label="Show route"
            icon="near-me"
            variant="secondary"
            onPress={() => router.push({ pathname: '/navigator', params: { building: plan.next!.event.buildingCode } })}
          />
        ) : null}
      </View>

      {plan.suggestions.length > 0 && (
        <View style={[styles.tiles, isMedium && styles.tilesRow]}>
          {plan.suggestions.map((s) => (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              accessibilityLabel={`${s.title}. ${s.detail}. ${s.cta}`}
              onPress={() => router.push({ pathname: s.target.pathname, params: s.target.params })}
              style={(state) => [
                styles.tile,
                isMedium && styles.tileFlex,
                (state as { hovered?: boolean }).hovered && { backgroundColor: FixedColors.shellHover },
                state.pressed && { opacity: Opacity.pressed },
              ]}>
              <View style={styles.tileIcon}>
                <Icon name={ICON[s.kind]} size="lg" color={FixedColors.gold} />
              </View>
              <View style={styles.tileText}>
                <ThemedText type="smallBold" style={styles.tileTitle} numberOfLines={2}>
                  {s.title}
                </ThemedText>
                <ThemedText type="caption" style={{ color: TONE_COLOR[s.tone] }} numberOfLines={2}>
                  {s.detail}
                </ThemedText>
              </View>
              <Icon name="chevron-right" size="md" color={FixedColors.shellMuted} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export function PlanCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width="30%" height={16} />
      <Skeleton width="60%" height={30} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: FixedColors.shell,
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.four,
    borderWidth: 1,
    borderColor: FixedColors.shellBorder,
    ...Elevation.raised,
  },
  head: { gap: Spacing.three },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headText: { gap: Spacing.one, flexShrink: 1 },
  state: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: Spacing.two, height: Spacing.two, borderRadius: Radius.pill },
  stateText: { color: FixedColors.gold, textTransform: 'uppercase', letterSpacing: 1.5 },
  headline: { color: FixedColors.shellText },
  sub: { color: FixedColors.shellMuted },
  tiles: { gap: Spacing.two },
  tilesRow: { flexDirection: 'row' },
  tile: {
    minHeight: TouchTarget + Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    backgroundColor: FixedColors.shellRaised,
    borderWidth: 1,
    borderColor: FixedColors.shellBorder,
  },
  tileFlex: { flex: 1 },
  tileIcon: { width: TouchTarget, height: TouchTarget, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: FixedColors.shellHover },
  tileText: { flex: 1, gap: Spacing.half },
  tileTitle: { color: FixedColors.shellText },
});
