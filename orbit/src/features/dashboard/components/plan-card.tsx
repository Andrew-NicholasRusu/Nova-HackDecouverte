import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/ui/themed-text';
import type { IconName, Suggestion } from '@/data/types';
import { useBrain } from '@/features/brain/use-brain';
import { useLayout } from '@/hooks/use-layout';
import { FixedColors, Opacity } from '@/styles/theme';

import { styles, toneColor } from './plan-card.styles';

const ICON: Record<Suggestion['kind'], IconName> = {
  leave: 'directions-walk',
  food: 'restaurant',
  study: 'chair',
  friend: 'group',
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
                <ThemedText type="caption" style={{ color: toneColor[s.tone] }} numberOfLines={2}>
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
