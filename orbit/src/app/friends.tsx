import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { describeFriendNow, hm, nextSharedWindow } from '@/features/friends/describe';
import { FriendSheet } from '@/features/friends/friend-sheet';
import {
  loadFriends,
  removeFriendship,
  respondToRequest,
  searchStudents,
  sendFriendRequest,
  useFriends,
  type StudentSummary,
} from '@/features/friends/store';
import { useNow } from '@/features/schedule/format';
import { useClassEvents } from '@/features/schedule/store';

const SEND_RESULT: Record<string, string> = {
  sent: 'Request sent.',
  accepted: 'They had already asked you — you are now friends.',
  already_sent: 'You already sent them a request.',
  already_friends: 'You are already friends.',
};

function StudentRow({ student, right }: { student: StudentSummary; right: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {student.displayName}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          @{student.username}
          {student.campus ? ` · ${student.campus}` : ''}
        </ThemedText>
      </View>
      {right}
    </View>
  );
}

function SearchStudents({ knownIds }: { knownIds: Set<string> }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StudentSummary[]>([]);
  const [message, setMessage] = useState<{ text: string; tone: 'success' | 'danger' | 'textSecondary' } | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  // Debounced search as you type.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let cancelled = false;
    const id = setTimeout(() => {
      searchStudents(q)
        .then((r) => {
          if (cancelled) return;
          setResults(r);
          setMessage(r.length === 0 ? { text: 'No students found.', tone: 'textSecondary' } : null);
        })
        .catch((e: Error) => !cancelled && setMessage({ text: e.message, tone: 'danger' }));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [query]);

  async function add(student: StudentSummary) {
    setPending(student.id);
    try {
      const result = await sendFriendRequest(student.id);
      setMessage({ text: SEND_RESULT[result] ?? 'Done.', tone: 'success' });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Could not send the request.', tone: 'danger' });
    }
    setPending(null);
  }

  const visible = query.trim().length >= 2 ? results : [];

  return (
    <Card>
      <TextField
        label="Find students"
        placeholder="Username or name"
        autoCapitalize="none"
        autoCorrect={false}
        value={query}
        onChangeText={setQuery}
      />
      {message ? (
        <ThemedText type="small" themeColor={message.tone}>
          {message.text}
        </ThemedText>
      ) : null}
      {visible.map((s) => (
        <StudentRow
          key={s.id}
          student={s}
          right={
            knownIds.has(s.id) ? (
              <ThemedText type="caption" themeColor="textSecondary">
                Added
              </ThemedText>
            ) : (
              <Button label={pending === s.id ? '…' : 'Add'} onPress={() => add(s)} disabled={pending !== null} />
            )
          }
        />
      ))}
    </Card>
  );
}

export default function FriendsScreen() {
  const theme = useTheme();
  const data = useFriends();
  const schedule = useClassEvents();
  const now = useNow();
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const knownIds = new Set([
    ...data.friends.map((f) => f.id),
    ...data.incoming.map((r) => r.student.id),
    ...data.outgoing.map((r) => r.student.id),
  ]);
  const open = data.friends.find((f) => f.id === openId);

  async function act(fn: () => Promise<void>) {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  return (
    <Screen title="Friends" subtitle="See when your friends are free">
      <SearchStudents knownIds={knownIds} />

      {error ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {error}
        </ThemedText>
      ) : null}

      {data.status === 'error' ? <ErrorState message={data.error} onRetry={loadFriends} /> : null}

      {data.incoming.length > 0 ? (
        <Card>
          <ThemedText type="heading">Friend requests</ThemedText>
          {data.incoming.map((r) => (
            <StudentRow
              key={r.friendshipId}
              student={r.student}
              right={
                <View style={styles.buttons}>
                  <Button label="Accept" onPress={() => act(() => respondToRequest(r.friendshipId, true))} />
                  <Button
                    label="Decline"
                    variant="secondary"
                    onPress={() => act(() => respondToRequest(r.friendshipId, false))}
                  />
                </View>
              }
            />
          ))}
          <ThemedText type="caption" themeColor="textSecondary">
            Accepting shares free/busy times only, never your classes or rooms. You can change it per friend.
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
        <EmptyState
          title="No friends yet"
          message="Search for classmates by username. Once they accept, you'll see when you're both free."
        />
      ) : null}

      {data.friends.length > 0 ? (
        <View style={styles.list}>
          <ThemedText type="subtitle">Friends · {data.friends.length}</ThemedText>
          {data.friends.map((f) => {
            const status = describeFriendNow(f, now);
            const shared = nextSharedWindow(schedule.events, f, now);
            return (
              <Pressable
                key={f.id}
                accessibilityRole="button"
                accessibilityLabel={`${f.displayName}, ${status.text}`}
                onPress={() => setOpenId(f.id)}>
                <Card>
                  <View style={styles.row}>
                    <ThemedText type="heading" style={styles.flex} numberOfLines={1}>
                      {f.displayName}
                    </ThemedText>
                    {status.free !== null ? (
                      <View
                        style={[styles.dot, { backgroundColor: status.free ? theme.success : theme.warning }]}
                        accessibilityElementsHidden
                      />
                    ) : null}
                  </View>
                  <ThemedText type="small" themeColor={status.free === null ? 'textSecondary' : 'text'}>
                    {status.text}
                  </ThemedText>
                  {shared ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      Free together {shared.when} {hm(shared.window.start)}–{hm(shared.window.end)}
                    </ThemedText>
                  ) : null}
                </Card>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {data.outgoing.length > 0 ? (
        <Card>
          <ThemedText type="heading">Sent requests</ThemedText>
          {data.outgoing.map((r) => (
            <StudentRow
              key={r.friendshipId}
              student={r.student}
              right={<Button label="Cancel" variant="secondary" onPress={() => act(() => removeFriendship(r.friendshipId))} />}
            />
          ))}
        </Card>
      ) : null}

      {open ? <FriendSheet friend={open} myEvents={schedule.events} now={now} onClose={() => setOpenId(null)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
  buttons: { flexDirection: 'row', gap: Spacing.two },
  list: { gap: Spacing.two },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
