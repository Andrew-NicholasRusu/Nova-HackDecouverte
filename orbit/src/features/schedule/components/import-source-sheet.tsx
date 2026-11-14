import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Sheet } from '@/components/ui/sheet';
import { Radius, Size, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { parseIcs, type ImportDraft } from './ics';
import { parseScheduleText } from './parse-text';
import { readScheduleFile } from './read-file';

export type Parsed = { fileName: string; drafts: ImportDraft[]; skipped: number };

const TYPES = ['Calendar (.ics)', 'PDF', 'Photo or screenshot', 'Text or CSV'];

/** One place to bring a schedule in: any file type, or pasted text. Everything is reviewed before saving. */
export function ImportSourceSheet({ onClose, onParsed }: { onClose: () => void; onParsed: (p: Parsed) => void }) {
  const theme = useTheme();
  const [pasted, setPasted] = useState('');
  const [busy, setBusy] = useState<{ label: string; fraction: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const finish = (fileName: string, kind: 'ics' | 'text', text: string, ocr: boolean) => {
    const { drafts, skipped } = kind === 'ics' ? parseIcs(text) : parseScheduleText(text);
    if (drafts.length === 0) {
      setError(
        kind === 'ics'
          ? 'No classes found in that calendar.'
          : ocr
            ? 'We could read the image but found no classes. Try a sharper, cropped screenshot of the schedule, or paste the text.'
            : 'No classes found. Each class needs a course code like COMP 352 and a time like 10:15-11:30.',
      );
      return;
    }
    onParsed({
      fileName,
      skipped,
      drafts: ocr ? drafts.map((d) => ({ ...d, warnings: ['Read from an image, so double-check this class.', ...d.warnings] })) : drafts,
    });
  };

  async function chooseFile() {
    setError(null);
    try {
      const r = await readScheduleFile((label, fraction) => setBusy({ label, fraction }));
      if (r) finish(r.name, r.kind, r.text, r.ocr);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.');
    }
    setBusy(null);
  }

  return (
    <Sheet visible title="Import schedule" onClose={onClose} actionLabel="Read text" onAction={() => finish('Pasted text', 'text', pasted, false)} actionDisabled={!pasted.trim() || !!busy}>
      <View style={styles.drop}>
        <Icon name="upload-file" size="xl" color="accentLink" />
        <ThemedText type="heading">Drop in your schedule, any format</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          {TYPES.join(' · ')}. Photos and scanned PDFs are read with text recognition, then you review every class before it is saved.
        </ThemedText>
        <Button label={busy ? busy.label : 'Choose a file'} icon="upload-file" onPress={chooseFile} disabled={!!busy} />
        {busy && busy.fraction !== null ? (
          <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(busy.fraction * 100) }}>
            <View style={[styles.fill, { backgroundColor: theme.accent, width: `${Math.round(busy.fraction * 100)}%` }]} />
          </View>
        ) : null}
      </View>

      <ThemedText type="smallBold">Or paste the text</ThemedText>
      <TextInput
        value={pasted}
        onChangeText={setPasted}
        multiline
        placeholder={'COMP 352 Data Structures\nMon Wed 10:15 - 11:30  H 820'}
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Paste your schedule text"
        style={[styles.paste, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
      />
      {error ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {error}
        </ThemedText>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  drop: { alignItems: 'center', gap: Spacing.three, padding: Spacing.five, borderRadius: Radius.xl, borderWidth: 2, borderStyle: 'dashed' },
  center: { textAlign: 'center' },
  track: { height: Spacing.two, alignSelf: 'stretch', borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%' },
  paste: { minHeight: Size.pasteHeight, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.three, textAlignVertical: 'top', ...Typography.small },
});
