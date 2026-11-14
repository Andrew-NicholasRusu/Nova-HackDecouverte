import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { Icon } from '@/components/ui/icon';
import { LevelMeter } from '@/components/ui/level-meter';
import { Pill } from '@/components/ui/pill';
import { Screen } from '@/components/ui/screen';
import { Opacity, Radius, Spacing, TouchTarget } from '@/constants/theme';
import {
  ALERTS,
  CATEGORY_LABEL,
  LEVEL_RANK,
  LEVEL_TEXT,
  LEVEL_TONE,
  type AlertCategory,
  type Kind,
  type Level,
} from '@/features/live/catalog';
import { ago, useLive, type PlaceStatus } from '@/features/live/use-live';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import { SAMPLE_DATA } from '@/lib/sample';

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABEL) as (AlertCategory | 'all')[]).map((value) => ({
  value,
  label: CATEGORY_LABEL[value],
}));

function PlaceRow({
  status,
  best,
  open,
  nowMs,
  onToggle,
  onReport,
}: {
  status: PlaceStatus;
  best: boolean;
  open: boolean;
  nowMs: number;
  onToggle: () => void;
  onReport: (l: Level) => void;
}) {
  const theme = useTheme();
  const { place, level, source, at } = status;
  const options = (['good', 'ok', 'bad'] as Level[]).map((l) => ({ value: l, label: LEVEL_TEXT[place.kind][l] }));
  const tone = LEVEL_TONE[level];

  return (
    <View style={[styles.rowWrap, { borderTopColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${place.name}, ${place.where}. ${LEVEL_TEXT[place.kind][level]}. Tap to report.`}
        onPress={onToggle}
        style={({ pressed }) => [styles.row, pressed && { opacity: Opacity.pressed }]}>
        <Icon name={place.icon} size="lg" color="accentLink" />
        <View style={styles.name}>
          <View style={styles.nameLine}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.nameText}>
              {place.name}
            </ThemedText>
            {best ? <Pill label="Best now" tone="gold" /> : null}
          </View>
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            {place.where}
          </ThemedText>
        </View>
        <View style={styles.status}>
          <ThemedText type="smallBold" themeColor={tone} accessibilityLiveRegion="polite">
            {LEVEL_TEXT[place.kind][level]}
          </ThemedText>
          <LevelMeter filled={(LEVEL_RANK[level] + 1) as 1 | 2 | 3} tone={tone} />
        </View>
        <Icon name={open ? 'expand-less' : 'expand-more'} size="md" color="textSecondary" />
      </Pressable>
      {open && (
        <View style={[styles.report, { backgroundColor: theme.accentTint }]}>
          <ThemedText type="small" themeColor="textSecondary">
            {source === 'you' && at ? `You reported this ${ago(at, nowMs)}. ` : 'Typical for this time of day. '}
            {place.kind === 'wait' ? 'How long is the line right now?' : 'How full is it right now?'}
          </ThemedText>
          <ChoiceChips label={`Report ${place.name}`} options={options} value={source === 'you' ? level : undefined} onChange={onReport} />
        </View>
      )}
    </View>
  );
}

function Section({
  title,
  icon,
  kind,
  statuses,
  openId,
  setOpenId,
  nowMs,
  report,
}: {
  title: string;
  icon: 'restaurant' | 'chair';
  kind: Kind;
  statuses: PlaceStatus[];
  openId: string | null;
  setOpenId: (id: string | null) => void;
  nowMs: number;
  report: (id: string, l: Level) => void;
}) {
  const list = statuses.filter((s) => s.place.kind === kind);
  const bestId = [...list].sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level])[0]?.place.id;
  return (
    <Card style={styles.section}>
      <View style={styles.sectionHead}>
        <Icon name={icon} size="lg" color="accentLink" />
        <ThemedText type="heading" accessibilityRole="header">
          {title}
        </ThemedText>
      </View>
      {list.map((s) => (
        <PlaceRow
          key={s.place.id}
          status={s}
          best={s.place.id === bestId}
          open={openId === s.place.id}
          nowMs={nowMs}
          onToggle={() => setOpenId(openId === s.place.id ? null : s.place.id)}
          onReport={(l) => report(s.place.id, l)}
        />
      ))}
    </Card>
  );
}

export default function LiveScreen() {
  const live = useLive();
  const theme = useTheme();
  const { isMedium } = useLayout();
  const [category, setCategory] = useState<AlertCategory | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const alerts = ALERTS.filter((a) => category === 'all' || a.category === category);

  const shared = { statuses: live.statuses, openId, setOpenId, nowMs: live.nowMs, report: live.report };

  return (
    <Screen title="Campus Live" subtitle="Tap any place to tell other students what it is like">
      <View style={[styles.cols, isMedium && styles.colsRow]}>
        <Section title="Food and lines" icon="restaurant" kind="wait" {...shared} />
        <Section title="Study spaces" icon="chair" kind="seats" {...shared} />
      </View>

      <Card>
        <View style={styles.sectionHead}>
          <Icon name="campaign" size="lg" color="accentLink" />
          <ThemedText type="heading" accessibilityRole="header">
            Campus notices
          </ThemedText>
          {SAMPLE_DATA ? <Pill label="Sample" /> : null}
        </View>
        <ChoiceChips label="Notice category" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
        <View style={[styles.notices, isMedium && styles.noticesRow]}>
          {alerts.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Nothing in this category right now.
            </ThemedText>
          ) : (
            alerts.map((a) => (
              <View key={a.id} style={[styles.notice, isMedium && styles.noticeHalf]}>
                <View style={[styles.noticeIcon, { backgroundColor: theme.accentTint }]}>
                  <Icon name={a.icon} size="md" color="accentLink" />
                </View>
                <View style={styles.name}>
                  <ThemedText type="smallBold">{a.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {a.detail}
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {CATEGORY_LABEL[a.category]} · {ago(live.nowMs - a.minutesAgo * 60_000, live.nowMs)}
                  </ThemedText>
                </View>
              </View>
            ))
          )}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cols: { gap: Spacing.four },
  colsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  section: { flex: 1, gap: Spacing.one, padding: Spacing.three },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.one, paddingBottom: Spacing.one },
  rowWrap: { borderTopWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: TouchTarget + Spacing.three, paddingVertical: Spacing.two, paddingHorizontal: Spacing.one },
  name: { flex: 1, gap: Spacing.half },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  nameText: { flexShrink: 1 },
  status: { alignItems: 'flex-end', gap: Spacing.one },
  report: { padding: Spacing.three, borderRadius: Radius.lg, gap: Spacing.two, marginBottom: Spacing.two },
  notices: { gap: Spacing.three },
  noticesRow: { flexDirection: 'row', flexWrap: 'wrap' },
  notice: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  noticeHalf: { flexBasis: '46%', flexGrow: 1 },
  noticeIcon: { width: TouchTarget - Spacing.one, height: TouchTarget - Spacing.one, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
});
