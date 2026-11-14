import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { DAY_FROM, DayBar } from '@/components/ui/day-bar';
import { Icon } from '@/components/ui/icon';
import { Pill } from '@/components/ui/pill';
import { Screen } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/state-views';
import { TextField } from '@/components/ui/text-field';
import { Opacity, Radius, Size, Spacing, TouchTarget } from '@/constants/theme';
import {
  freeTogether,
  statusOf,
  toMin,
  todayClasses,
  useFriends,
  type Friend,
} from '@/features/friends/use-friends';
import { formatClock, formatMinutes, useSchedule } from '@/features/schedule/use-schedule';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import { SAMPLE_DATA } from '@/lib/sample';

const FILTERS = [
  { value: 'all', label: 'Everyone' },
  { value: 'free', label: 'Free now' },
  { value: 'SGW', label: 'SGW' },
  { value: 'LOY', label: 'Loyola' },
] as const;
type Filter = (typeof FILTERS)[number]['value'];

const AXIS = [8, 12, 16, 20];

function statusText(f: Friend, now: Date) {
  const s = statusOf(f, now);
  if (s.kind === 'class') return `In class until ${formatClock(s.endsAt)}`;
  return s.until ? `Free until ${formatClock(s.until)}` : 'Free all day';
}

/** Hour labels that line up with every DayBar below. */
function Axis() {
  return (
    <View style={styles.axis}>
      {AXIS.map((h) => (
        <ThemedText key={h} type="caption" themeColor="textSecondary" numberOfLines={1} style={[styles.tick, h === 20 ? { right: 0 } : { left: `${((h * 60 - DAY_FROM) / (13 * 60)) * 100}%` }]}>
          {formatMinutes(h * 60).replace(':00', '')}
        </ThemedText>
      ))}
    </View>
  );
}

function Row({ friend, now, open, onToggle, isMedium }: { friend: Friend; now: Date; open: boolean; onToggle: () => void; isMedium: boolean }) {
  const theme = useTheme();
  const { entries } = useSchedule();
  const status = statusOf(friend, now);
  const classes = todayClasses(friend, now);
  const together = freeTogether(friend, entries, now);
  const first = together[0];
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const blocks = classes.map((c) => ({ from: toMin(c.start), to: toMin(c.end) }));

  return (
    <View style={[styles.rowWrap, { borderTopColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${friend.name}. ${statusText(friend, now)}`}
        onPress={onToggle}
        style={({ pressed }) => [styles.row, !isMedium && styles.rowStack, pressed && { opacity: Opacity.pressed }]}>
        <View style={styles.who}>
          <Avatar name={friend.name} size="md" presence={status.kind === 'free' ? 'free' : 'busy'} />
          <View style={styles.whoText}>
            <ThemedText type="smallBold" numberOfLines={1}>
              {friend.name}
            </ThemedText>
            <ThemedText type="caption" themeColor={status.kind === 'free' ? 'success' : 'textSecondary'} numberOfLines={1}>
              {statusText(friend, now)}
            </ThemedText>
          </View>
          {!isMedium && <Icon name={open ? 'expand-less' : 'expand-more'} size="md" color="textSecondary" />}
        </View>
        <View style={styles.bar}>
          <DayBar blocks={blocks} nowMin={nowMin} label={`${friend.name}'s day: ${blocks.length} classes`} />
        </View>
        {isMedium && <Icon name={open ? 'expand-less' : 'expand-more'} size="md" color="textSecondary" />}
      </Pressable>

      {open && (
        <View style={[styles.detail, { backgroundColor: theme.accentTint }]}>
          <ThemedText type="caption" themeColor="textSecondary">
            {friend.program} · {friend.campus === 'SGW' ? 'Sir George Williams' : 'Loyola'}
          </ThemedText>
          <ThemedText type="small">
            <ThemedText type="smallBold">Free together: </ThemedText>
            {together.length
              ? together.slice(0, 3).map((g) => `${formatMinutes(g.from)}–${formatMinutes(g.to)}`).join('  ·  ')
              : 'no shared gap of 45 min or more left today'}
          </ThemedText>
          {classes.length > 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              {classes.map((c) => `${c.code} ${formatClock(c.start)}`).join('  ·  ')}
            </ThemedText>
          )}
          <View style={styles.actions}>
            <Button
              label="Plan a study session"
              icon="menu-book"
              disabled={!first}
              onPress={() =>
                first &&
                Share.share({
                  message: `Hey ${friend.name.split(' ')[0]}, we are both free ${formatMinutes(first.from)}–${formatMinutes(first.to)}. Study together? (sent from Orbit)`,
                })
              }
            />
            <Button label="Find a room" variant="secondary" icon="search" onPress={() => router.push('/navigator')} />
          </View>
        </View>
      )}
    </View>
  );
}

export default function FriendsScreen() {
  const { isMedium } = useLayout();
  const { friends, now, freeNow, invites, invite, cancel } = useFriends();
  const { entries } = useSchedule();
  const legendColor = useTheme().accent;
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [username, setUsername] = useState('');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const q = query.trim().toLowerCase();
  const shown = friends.filter(
    (f) =>
      (!q || `${f.name} ${f.program}`.toLowerCase().includes(q)) &&
      (filter === 'all' || (filter === 'free' && statusOf(f, now).kind === 'free') || f.campus === filter),
  );
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const mine = entries
    .filter((e) => e.day === now.getDay())
    .map((e) => ({ from: toMin(e.start), to: toMin(e.end) }));

  function send() {
    const problem = invite(username);
    if (problem) return setMsg({ text: problem, ok: false });
    setMsg({ text: `Invite sent to ${username.trim().replace(/^@/, '')}.`, ok: true });
    setUsername('');
  }

  return (
    <Screen title="Friends" subtitle={`${freeNow.length} of ${friends.length} are free right now`}>
      <View style={styles.toolbarRow}>
        <View style={styles.search}>
          <TextField label="Search friends" value={query} onChangeText={setQuery} placeholder="Name or program" autoCorrect={false} />
        </View>
        <Button label="Add friend" icon="person-add" variant={adding ? 'secondary' : 'primary'} onPress={() => setAdding((a) => !a)} />
      </View>

      {adding && (
        <Card>
          <View style={styles.toolbarRow}>
            <View style={styles.search}>
              <TextField
                label="Username or Concordia email"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="@username"
                onSubmitEditing={send}
              />
            </View>
            <Button label="Send invite" icon="send" onPress={send} />
          </View>
          {msg ? (
            <ThemedText type="small" themeColor={msg.ok ? 'success' : 'danger'} accessibilityRole={msg.ok ? undefined : 'alert'}>
              {msg.text}
            </ThemedText>
          ) : null}
          {invites.map((i) => (
            <View key={i.username} style={styles.invite}>
              <Avatar name={i.username} size="sm" />
              <ThemedText type="small" style={styles.search}>
                {i.username} · waiting for a reply
              </ThemedText>
              <Pressable accessibilityRole="button" accessibilityLabel={`Cancel invite to ${i.username}`} onPress={() => cancel(i.username)} style={styles.cancel}>
                <Icon name="close" size="md" color="textSecondary" />
              </Pressable>
            </View>
          ))}
        </Card>
      )}

      <ChoiceChips label="Filter friends" options={FILTERS} value={filter} onChange={setFilter} />

      <Card style={styles.roster}>
        <View style={[styles.row, !isMedium && styles.rowStack, styles.header]}>
          <View style={styles.who}>
            <Avatar name="You" size="md" />
            <View style={styles.whoText}>
              <ThemedText type="smallBold">You</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {mine.length ? `${mine.length} class${mine.length > 1 ? 'es' : ''} today` : 'No classes today'}
              </ThemedText>
            </View>
          </View>
          <View style={styles.bar}>
            <DayBar blocks={mine} nowMin={nowMin} label="Your day" />
            <Axis />
          </View>
        </View>
        {shown.length === 0 ? (
          <EmptyState title="No friends match" message={filter === 'free' ? 'Everyone is in class. Check back at the next break.' : 'Try a different name or filter.'} />
        ) : (
          shown.map((f) => (
            <Row key={f.id} friend={f} now={now} isMedium={isMedium} open={openId === f.id} onToggle={() => setOpenId(openId === f.id ? null : f.id)} />
          ))
        )}
      </Card>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: legendColor }]} />
          <ThemedText type="caption" themeColor="textSecondary">
            In class
          </ThemedText>
        </View>
        <ThemedText type="caption" themeColor="textSecondary">
          Light = free · line = now
        </ThemedText>
        {SAMPLE_DATA ? <Pill label="Sample friends" /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbarRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.three },
  search: { flex: 1 },
  invite: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  cancel: { width: TouchTarget, height: TouchTarget, alignItems: 'center', justifyContent: 'center' },
  roster: { padding: Spacing.three, gap: Spacing.one },
  header: { paddingBottom: Spacing.three },
  rowWrap: { borderTopWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: TouchTarget + Spacing.three, paddingVertical: Spacing.two },
  rowStack: { flexDirection: 'column', alignItems: 'stretch', gap: Spacing.two },
  who: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, width: Size.rosterName },
  whoText: { flex: 1, gap: Spacing.half },
  bar: { flex: 1, gap: Spacing.one },
  axis: { height: Spacing.three, position: 'relative' },
  tick: { position: 'absolute' },
  detail: { padding: Spacing.three, borderRadius: Radius.lg, gap: Spacing.two, marginBottom: Spacing.two },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  legend: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  swatch: { width: Spacing.three, height: Spacing.three, borderRadius: Radius.sm },
});
