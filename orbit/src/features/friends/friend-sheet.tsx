import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Sheet } from '@/components/ui/sheet';
import { Spacing } from '@/constants/theme';
import { calculateSharedAvailability } from '@/features/schedule/availability';
import { occurrencesOnDate } from '@/features/schedule/engine';
import { formatDuration } from '@/features/schedule/format';
import { addDays, toLocalDate, type ClassEvent } from '@/features/schedule/model';

import { describeFriendNow, hm, SHARING_HELP, SHARING_LABEL } from './describe';
import { blockStudent, removeFriendship, setSharingLevel, type Friend, type SharingLevel } from './store';

type Props = { friend: Friend; myEvents: ClassEvent[]; now: Date; onClose: () => void };

/** A friend's details: status, free time together, what you share, unfriend / block. */
export function FriendSheet({ friend, myEvents, now, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'remove' | 'block' | null>(null);

  const today = toLocalDate(now);
  const status = describeFriendNow(friend, now);
  const days = [
    { label: 'Today', date: today, notBefore: now },
    { label: 'Tomorrow', date: addDays(today, 1), notBefore: undefined },
  ];
  const theirClassesToday =
    friend.theirLevel === 'full' ? occurrencesOnDate(friend.slots, today).filter((o) => o.end > now) : [];

  async function act(fn: () => Promise<void>, closeAfter = false) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      if (closeAfter) onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
    setBusy(false);
  }

  return (
    <Sheet visible title={friend.displayName} onClose={onClose}>
      <View style={styles.head}>
        <ThemedText type="small" themeColor="textSecondary">
          @{friend.username}
          {friend.campus ? ` · ${friend.campus === 'SGW' ? 'Sir George Williams' : 'Loyola'}` : ''}
        </ThemedText>
        <ThemedText type="default" themeColor={status.free ? 'success' : status.free === false ? 'warning' : 'textSecondary'}>
          {status.text}
        </ThemedText>
      </View>

      {error ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {error}
        </ThemedText>
      ) : null}

      {friend.theirLevel !== 'private' ? (
        <Card>
          <ThemedText type="heading">Free together</ThemedText>
          {days.map(({ label, date, notBefore }) => {
            const windows = calculateSharedAvailability([myEvents, friend.slots], date, { notBefore });
            return (
              <View key={date} style={styles.day}>
                <ThemedText type="smallBold">{label}</ThemedText>
                {windows.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    No shared free time between 08:00 and 22:00.
                  </ThemedText>
                ) : (
                  windows.map((w) => (
                    <ThemedText key={w.start.toISOString()} type="small">
                      {hm(w.start)}–{hm(w.end)} · {formatDuration(w.minutes)}
                    </ThemedText>
                  ))
                )}
              </View>
            );
          })}
          <ThemedText type="caption" themeColor="textSecondary">
            Based on both class schedules only. They may have other plans.
          </ThemedText>
        </Card>
      ) : (
        <Card>
          <ThemedText type="small" themeColor="textSecondary">
            {friend.displayName} keeps their schedule private, so ORBIT can&apos;t find free time together.
          </ThemedText>
        </Card>
      )}

      {theirClassesToday.length > 0 ? (
        <Card>
          <ThemedText type="heading">Their classes today</ThemedText>
          {theirClassesToday.map((o, i) => (
            <ThemedText key={i} type="small">
              {o.event.startTime}–{o.event.endTime} · {o.event.courseCode}
              {o.event.buildingCode ? ` · ${o.event.buildingCode} ${o.event.room}` : ''}
            </ThemedText>
          ))}
        </Card>
      ) : null}

      <Card>
        <ThemedText type="heading">What you share with {friend.displayName}</ThemedText>
        <View style={styles.chips}>
          {(['private', 'availability', 'full'] as SharingLevel[]).map((level) => (
            <Chip
              key={level}
              label={SHARING_LABEL[level]}
              selected={friend.myLevel === level}
              onPress={() => !busy && act(() => setSharingLevel(friend.id, level))}
            />
          ))}
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {SHARING_HELP[friend.myLevel]} You can change this any time.
        </ThemedText>
      </Card>

      <View style={styles.danger}>
        <Button
          label={confirm === 'remove' ? 'Tap again to remove friend' : 'Remove friend'}
          variant="secondary"
          disabled={busy}
          onPress={() =>
            confirm === 'remove' ? act(() => removeFriendship(friend.friendshipId), true) : setConfirm('remove')
          }
        />
        <Button
          label={confirm === 'block' ? 'Tap again to block' : 'Block'}
          variant="secondary"
          disabled={busy}
          onPress={() => (confirm === 'block' ? act(() => blockStudent(friend.id), true) : setConfirm('block'))}
        />
        {confirm === 'block' ? (
          <ThemedText type="caption" themeColor="textSecondary">
            Blocking removes the friendship and all sharing. They won&apos;t be able to find or add you.
          </ThemedText>
        ) : null}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: { gap: Spacing.one },
  day: { gap: Spacing.half },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  danger: { gap: Spacing.two, marginTop: Spacing.two },
});
