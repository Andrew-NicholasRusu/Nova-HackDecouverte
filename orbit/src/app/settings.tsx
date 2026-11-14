import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Opacity, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { MAX_QUICK, QUICK_ACTIONS, useQuickActions } from '@/features/dashboard/quick-actions';
import { useTheme } from '@/hooks/use-theme';
import { useProfile } from '@/features/profile/use-profile';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export default function SettingsScreen() {
  const { session } = useAuth();
  const profile = useProfile();
  const name = profile?.display_name ?? 'Student';
  const theme = useTheme();
  const quick = useQuickActions();
  const full = quick.ids.length >= MAX_QUICK;

  return (
    <Screen title="Settings" subtitle="Your account">
      <Card>
        <CardHeader icon="bolt" title="Quick Access shortcuts" />
        <ThemedText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite">
          Choose up to {MAX_QUICK} shortcuts for your home screen. {quick.ids.length} of {MAX_QUICK} selected.
        </ThemedText>
        {QUICK_ACTIONS.map((a) => {
          const on = quick.ids.includes(a.id);
          const index = quick.ids.indexOf(a.id);
          const blocked = !on && full;
          return (
            <View key={a.id} style={styles.optionRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={`${a.label}. ${a.hint}`}
                accessibilityState={{ checked: on, disabled: blocked || (on && quick.ids.length === 1) }}
                disabled={blocked}
                onPress={() => quick.toggle(a.id)}
                style={({ pressed }) => [styles.option, (pressed || blocked) && { opacity: blocked ? Opacity.disabled : Opacity.pressed }]}>
                <View style={[styles.check, { borderColor: on ? theme.accent : theme.border, backgroundColor: on ? theme.accent : 'transparent' }]}>
                  {on ? <Icon name="check" size="sm" color="accentText" /> : null}
                </View>
                <Icon name={a.icon} size="lg" color="accentLink" />
                <View style={styles.optionText}>
                  <ThemedText type="smallBold">{a.label}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {a.hint}
                  </ThemedText>
                </View>
              </Pressable>
              {on && (
                <View style={styles.move}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${a.label} earlier`}
                    disabled={index === 0}
                    onPress={() => quick.move(a.id, -1)}
                    style={[styles.moveBtn, index === 0 && { opacity: Opacity.disabled }]}>
                    <Icon name="arrow-upward" size="md" color="textSecondary" />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${a.label} later`}
                    disabled={index === quick.ids.length - 1}
                    onPress={() => quick.move(a.id, 1)}
                    style={[styles.moveBtn, index === quick.ids.length - 1 && { opacity: Opacity.disabled }]}>
                    <Icon name="arrow-downward" size="md" color="textSecondary" />
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
        <Button label="Reset to default" variant="secondary" icon="restore" onPress={quick.reset} />
      </Card>
      <Card>
        <CardHeader icon="person" title="Account" />
        <View style={styles.account}>
          <Avatar name={name} size="lg" />
          <View>
            <ThemedText type="heading">{name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {session?.user.email}
            </ThemedText>
          </View>
        </View>
        <Button label="Sign out" variant="secondary" icon="logout" onPress={() => supabase.auth.signOut()} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  option: { flex: 1, minHeight: TouchTarget + Spacing.two, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  check: { width: Spacing.four, height: Spacing.four, borderRadius: Radius.sm, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1 },
  move: { flexDirection: 'row' },
  moveBtn: { width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
  account: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
});
