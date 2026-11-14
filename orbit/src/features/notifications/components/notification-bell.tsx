import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Popover } from '@/components/ui/popover';
import { ThemedText } from '@/components/ui/themed-text';
import { respondToRequest } from '@/features/friends/store';
import { useNotifications } from '@/features/notifications/use-notifications';
import { useTheme } from '@/hooks/use-theme';
import { FixedColors, Opacity } from '@/styles/theme';

import { styles } from './notification-bell.styles';

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
