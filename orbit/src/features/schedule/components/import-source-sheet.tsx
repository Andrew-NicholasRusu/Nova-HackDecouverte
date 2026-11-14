import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Sheet } from '@/components/ui/sheet';
import { ThemedText } from '@/components/ui/themed-text';
import type { PendingImport, ReadResult } from '@/data/types';
import { parseImport } from '@/features/schedule/import';
import { readScheduleFile } from '@/features/schedule/read-file';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './import-source-sheet.styles';

const TYPES = ['Calendar (.ics)', 'PDF', 'Photo or screenshot', 'Text or CSV'];

/** One place to bring a schedule in: any file type, or pasted text. Everything is reviewed before saving. */
export function ImportSourceSheet({ onClose, onParsed }: { onClose: () => void; onParsed: (p: PendingImport) => void }) {
  const theme = useTheme();
  const [pasted, setPasted] = useState('');
  const [busy, setBusy] = useState<{ label: string; fraction: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const finish = (read: ReadResult) => {
    const outcome = parseImport(read);
    if (outcome.ok) onParsed(outcome.value);
    else setError(outcome.error);
  };

  async function chooseFile() {
    setError(null);
    try {
      const r = await readScheduleFile((label, fraction) => setBusy({ label, fraction }));
      if (r) finish(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.');
    }
    setBusy(null);
  }

  return (
    <Sheet visible title="Import schedule" onClose={onClose} actionLabel="Read text" onAction={() => finish({ name: 'Pasted text', kind: 'text', text: pasted, ocr: false })} actionDisabled={!pasted.trim() || !!busy}>
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
