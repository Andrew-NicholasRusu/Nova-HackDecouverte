import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Popover } from '@/components/ui/popover';
import { BadgeSize, FixedColors, Opacity, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { respondToRequest } from '@/features/friends/store';
import { useTheme } from '@/hooks/use-theme';

import { useNotifications } from './use-notifications';

/** Bell with an unread count; opens a list of what needs attention, with actions inline. */
export function NotificationBell() {
  const theme = useTheme();
  const { notices, unreadCount, readIds, markAllRead } = useNotifications();
  const [error, setError] = useState<string | null>(null);

  return (
    <Popover
      width={380}
      onClose={markAllRead}
      renderTrigger={(open, expanded) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={unreadCount ? `Notifications, ${unreadCount} new` : 'Notifications'}
          onPress={open}
          style={({ pressed }) => [styles.button, pressed && { opacity: Opacity.pressed }]}>
          <Icon name={unreadCount ? 'notifications-active' : 'notifications'} size="lg" color={FixedColors.white} />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <ThemedText type="caption" style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </ThemedText>
            </View>
          ) : null}
        </Pressable>
      )}>
      {(close) => (
        <View>
          <View style={[styles.head, { borderBottomColor: theme.border }]}>
            <ThemedText type="heading" accessibilityRole="header">
              Notifications
            </ThemedText>
          </View>
          {notices.length === 0 ? (
            <View style={styles.empty}>
              <Icon name="check-circle" size="xl" color="success" />
              <ThemedText type="smallBold">You are all caught up</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                Friend requests, classes starting soon and schedule problems show up here.
              </ThemedText>
            </View>
          ) : (
            notices.map((n) => {
              const fresh = n.sticky || !readIds.includes(n.id);
              return (
                <View key={n.id} style={[styles.row, { borderBottomColor: theme.border }]}>
                  <View style={[styles.icon, { backgroundColor: theme.accentTint }]}>
                    <Icon name={n.icon} size="lg" color="accentLink" />
                  </View>
                  <View style={styles.flex}>
                    <ThemedText type={fresh ? 'smallBold' : 'small'}>{n.title}</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {n.detail}
                    </ThemedText>
                    {n.request ? (
                      <View style={styles.actions}>
                        <Button
                          label="Accept"
                          icon="check"
                          onPress={() => respondToRequest(n.request!.friendshipId, true).catch((e: Error) => setError(e.message))}
                        />
                        <Button
                          label="Decline"
                          variant="secondary"
                          onPress={() => respondToRequest(n.request!.friendshipId, false).catch((e: Error) => setError(e.message))}
                        />
                      </View>
                    ) : n.target && n.cta ? (
                      <View style={styles.actions}>
                        <Button
                          label={n.cta}
                          variant="secondary"
                          iconEnd="arrow-forward"
                          onPress={() => {
                            close();
                            router.push({ pathname: n.target!.pathname, params: n.target!.params });
                          }}
                        />
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
          {error ? (
            <ThemedText type="small" themeColor="danger" style={styles.pad} accessibilityRole="alert">
              {error}
            </ThemedText>
          ) : null}
        </View>
      )}
    </Popover>
  );
}

const styles = StyleSheet.create({
  button: { width: TouchTarget, height: TouchTarget, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: FixedColors.heroGlass },
  badge: { position: 'absolute', top: Spacing.half, right: Spacing.half, minWidth: BadgeSize + Spacing.two, height: BadgeSize + Spacing.two, paddingHorizontal: Spacing.one, borderRadius: Radius.pill, backgroundColor: FixedColors.shellActive, borderWidth: 2, borderColor: FixedColors.white, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: FixedColors.white, fontSize: 10, lineHeight: 12 },
  head: { padding: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  empty: { alignItems: 'center', gap: Spacing.two, padding: Spacing.five },
  center: { textAlign: 'center' },
  row: { flexDirection: 'row', gap: Spacing.three, padding: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  icon: { width: TouchTarget, height: TouchTarget, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: Spacing.half },
  actions: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap', marginTop: Spacing.two },
  pad: { padding: Spacing.three },
});
