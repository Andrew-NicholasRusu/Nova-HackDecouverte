import { type ComponentRef, useCallback, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, TextInput, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DayBar } from '@/components/ui/day-bar';
import { Dropdown } from '@/components/ui/dropdown';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { ThemedText } from '@/components/ui/themed-text';
import { DAY_BAR } from '@/data/constants';
import { CAMPUS_NAME, FRIEND_REQUEST_RESULT } from '@/data/labels';
import type { ClassEvent, Friend, StudentSummary } from '@/data/types';
import { busyBlocks } from '@/features/schedule/engine';
import { toLocalDate } from '@/features/schedule/model';
import { useClassEvents } from '@/features/schedule/store';
import { useLayout } from '@/hooks/use-layout';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { formatClock, minutesOfDay } from '@/lib/format';
import { useDismissOutside, useOverlay } from '@/lib/overlay';
import { Opacity } from '@/styles/theme';

import { describeFriendNow, nextSharedWindow, sortByAvailability } from '../describe';
import { loadFriends, removeFriendship, respondToRequest, sendFriendRequest, useFriends, useStudentSearch } from '../store';
import { FriendSheet } from './friend-sheet';
import { styles } from './friends-screen.styles';

type Sent = 'idle' | 'busy' | 'done' | 'error';

/** Suggest-as-you-type student search: results drop down under the field with an inline Add. */
function FindStudents({ knownIds }: { knownIds: Set<string> }) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [sent, setSent] = useState<Record<string, { status: Sent; text?: string }>>({});
  const [focused, setFocused] = useOverlay('friend-search');
  const wrap = useRef<ComponentRef<typeof View>>(null);
  const dismiss = useCallback(() => setFocused(false), [setFocused]);
  useDismissOutside(wrap, focused, dismiss);

  const q = query.trim();
  const { status: state, results, error } = useStudentSearch(q);

  async function add(s: StudentSummary) {
    setSent((p) => ({ ...p, [s.id]: { status: 'busy' } }));
    try {
      const r = await sendFriendRequest(s.id);
      setSent((p) => ({ ...p, [s.id]: { status: 'done', text: FRIEND_REQUEST_RESULT[r] ?? 'Done' } }));
    } catch (e) {
      setSent((p) => ({ ...p, [s.id]: { status: 'error', text: e instanceof Error ? e.message : 'Could not send' } }));
    }
  }

  const show = focused && q.length >= 1;
  return (
    <View ref={wrap} style={styles.searchWrap}>
      <View style={[styles.field, { backgroundColor: theme.backgroundElement, borderColor: focused ? theme.accentLink : theme.border }]}>
        <Icon name="person-add" size="lg" color="accentLink" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          placeholder="Find a classmate by username or name"
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Find students"
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, { color: theme.text }]}
        />
        {query ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear" onPress={() => setQuery('')} style={styles.iconBtn}>
            <Icon name="close" size="md" color="textSecondary" />
          </Pressable>
        ) : null}
      </View>
      {show && (
        <Dropdown>
          {q.length < 2 ? (
            <View style={styles.pad}>
              <ThemedText type="small" themeColor="textSecondary">
                Keep typing: at least 2 characters.
              </ThemedText>
            </View>
          ) : state === 'error' ? (
            <View style={styles.pad}>
              <ThemedText type="small" themeColor="danger">
                {error}
              </ThemedText>
            </View>
          ) : state === 'loading' && results.length === 0 ? (
            <View style={styles.pad}>
              <Skeleton width="60%" />
            </View>
          ) : results.length === 0 ? (
            <View style={styles.pad}>
              <ThemedText type="small" themeColor="textSecondary">
                No student found for “{q}”. Check the username with your friend.
              </ThemedText>
            </View>
          ) : (
            results.map((s) => {
              const st = sent[s.id];
              const known = knownIds.has(s.id);
              return (
                <View key={s.id} style={styles.result}>
                  <Avatar name={s.displayName} size="md" />
                  <View style={styles.flex}>
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {s.displayName}
                    </ThemedText>
                    <ThemedText type="caption" themeColor={st?.status === 'error' ? 'danger' : 'textSecondary'} numberOfLines={1}>
                      {st?.text ?? `@${s.username}${s.campus ? ` · ${CAMPUS_NAME[s.campus]}` : ''}`}
                    </ThemedText>
                  </View>
                  {known || st?.status === 'done' ? (
                    <View style={styles.doneChip}>
                      <Icon name="check" size="md" color="success" />
                      <ThemedText type="caption" themeColor="success">
                        {known && !st ? 'Connected' : 'Sent'}
                      </ThemedText>
                    </View>
                  ) : (
                    <Button label={st?.status === 'busy' ? 'Sending…' : 'Add'} icon="person-add" disabled={st?.status === 'busy'} onPress={() => add(s)} />
                  )}
                </View>
              );
            })
          )}
        </Dropdown>
      )}
    </View>
  );
}

function Roster({ friends, now, onOpen, mineEvents }: { friends: Friend[]; now: Date; onOpen: (id: string) => void; mineEvents: ClassEvent[] }) {
  const theme = useTheme();
  const { isMedium } = useLayout();
  const today = toLocalDate(now);
  const nowMin = minutesOfDay(now);
  const myBlocks = busyBlocks(mineEvents, today);

  return (
    <Card style={styles.roster}>
      <View style={[styles.row, !isMedium && styles.rowStack, styles.rosterHead]}>
        <View style={styles.who}>
          <Avatar name="You" size="md" />
          <View style={styles.flex}>
            <ThemedText type="smallBold">You</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {myBlocks.length} classes today
            </ThemedText>
          </View>
        </View>
        <View style={styles.flex}>
          <DayBar blocks={myBlocks} nowMin={nowMin} label="Your day" />
          <View style={styles.axis}>
            {[8, 12, 16].map((h) => (
              <ThemedText key={h} type="caption" themeColor="textSecondary" style={[styles.tick, { left: `${((h * 60 - DAY_BAR.from) / (DAY_BAR.to - DAY_BAR.from)) * 100}%` }]}>
                {h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
              </ThemedText>
            ))}
          </View>
        </View>
      </View>
      {sortByAvailability(friends, now).map((f) => {
        const status = describeFriendNow(f, now);
        const shared = nextSharedWindow(mineEvents, f, now);
        return (
          <Pressable
            key={f.id}
            accessibilityRole="button"
            accessibilityLabel={`${f.displayName}. ${status.text}`}
            onPress={() => onOpen(f.id)}
            style={(s) => [styles.row, !isMedium && styles.rowStack, styles.friendRow, { borderTopColor: theme.border }, s.pressed && { opacity: Opacity.pressed }]}>
            <View style={styles.who}>
              <Avatar name={f.displayName} uri={f.avatarUrl} size="md" presence={status.free === null ? undefined : status.free ? 'free' : 'busy'} />
              <View style={styles.flex}>
                <ThemedText type="smallBold" numberOfLines={1}>
                  {f.displayName}
                </ThemedText>
                <ThemedText type="caption" themeColor={status.free ? 'success' : 'textSecondary'} numberOfLines={2}>
                  {status.text}
                </ThemedText>
                {shared ? (
                  <ThemedText type="caption" themeColor="accentLink">
                    Together {shared.when === 'today' ? '' : 'tomorrow '}
                    {formatClock(shared.window.start)}–{formatClock(shared.window.end)}
                  </ThemedText>
                ) : null}
              </View>
            </View>
            <View style={styles.flex}>
              {f.theirLevel === 'private' ? null : (
                <DayBar blocks={busyBlocks(f.slots, today)} nowMin={nowMin} label={`${f.displayName}'s day`} />
              )}
            </View>
          </Pressable>
        );
      })}
    </Card>
  );
}

export function FriendsScreen() {
  const params = useLocalSearchParams<{ friend?: string }>();
  const data = useFriends();
  const schedule = useClassEvents();
  const now = useNow();
  const [openId, setOpenId] = useState<string | null>(null);
  const [seen, setSeen] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  // Deep link (from search or the dashboard plan) opens that friend's sheet.
  if (params.friend !== seen) {
    setSeen(params.friend);
    if (params.friend) setOpenId(params.friend);
  }

  const knownIds = new Set([
    ...data.friends.map((f) => f.id),
    ...data.incoming.map((r) => r.student.id),
    ...data.outgoing.map((r) => r.student.id),
  ]);
  const open = data.friends.find((f) => f.id === openId);
  const freeNow = data.friends.filter((f) => describeFriendNow(f, now).free === true).length;

  async function act(fn: () => Promise<void>) {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  return (
    <Screen
      onRefresh={loadFriends}
      title="Friends"
      subtitle={data.friends.length ? `${freeNow} of ${data.friends.length} free right now` : 'See when your friends are free'}>
      <FindStudents knownIds={knownIds} />

      {error ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {error}
        </ThemedText>
      ) : null}
      {data.status === 'error' ? <ErrorState message={data.error} onRetry={loadFriends} /> : null}

      {data.incoming.length > 0 ? (
        <Card>
          <ThemedText type="heading">Friend requests · {data.incoming.length}</ThemedText>
          {data.incoming.map((r) => (
            <View key={r.friendshipId} style={styles.result}>
              <Avatar name={r.student.displayName} uri={r.student.avatarUrl} size="md" />
              <View style={styles.flex}>
                <ThemedText type="smallBold" numberOfLines={1}>
                  {r.student.displayName}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  @{r.student.username}
                </ThemedText>
              </View>
              <Button label="Accept" icon="check" onPress={() => act(() => respondToRequest(r.friendshipId, true))} />
              <Button label="Decline" variant="secondary" onPress={() => act(() => respondToRequest(r.friendshipId, false))} />
            </View>
          ))}
          <ThemedText type="caption" themeColor="textSecondary">
            Accepting shares free/busy times only, never your classes or rooms. Change it per friend any time.
          </ThemedText>
        </Card>
      ) : null}

      {data.status === 'loading' && data.friends.length === 0 ? (
        <Card>
          <Skeleton width="40%" height={18} />
          <Skeleton width="70%" />
        </Card>
      ) : null}

      {data.status === 'ready' && data.friends.length === 0 ? (
        <EmptyState title="No friends yet" message="Search a classmate above. Once they accept, you see exactly when you are both free." />
      ) : null}

      {data.friends.length > 0 ? <Roster friends={data.friends} now={now} mineEvents={schedule.events} onOpen={setOpenId} /> : null}

      {data.outgoing.length > 0 ? (
        <Card>
          <ThemedText type="heading">Waiting for a reply · {data.outgoing.length}</ThemedText>
          {data.outgoing.map((r) => (
            <View key={r.friendshipId} style={styles.result}>
              <Avatar name={r.student.displayName} uri={r.student.avatarUrl} size="sm" />
              <ThemedText type="small" style={styles.flex} numberOfLines={1}>
                {r.student.displayName} · @{r.student.username}
              </ThemedText>
              <Button label="Cancel" variant="ghost" onPress={() => act(() => removeFriendship(r.friendshipId))} />
            </View>
          ))}
        </Card>
      ) : null}

      {open ? <FriendSheet friend={open} myEvents={schedule.events} now={now} onClose={() => setOpenId(null)} /> : null}
    </Screen>
  );
}
