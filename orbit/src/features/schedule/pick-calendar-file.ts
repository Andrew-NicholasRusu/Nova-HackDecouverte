import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

const MAX_BYTES = 2_000_000;

/** Lets the student choose an .ics file and returns its text, or null if they cancelled. */
export async function pickCalendarFile(): Promise<{ name: string; text: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({
    // Android often labels .ics files as octet-stream, so accept anything and check the name.
    type: Platform.OS === 'web' ? ['.ics', 'text/calendar'] : '*/*',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!/\.(ics|ical|icalendar)$/i.test(asset.name)) {
    throw new Error('Choose a calendar file ending in .ics.');
  }
  if (asset.size && asset.size > MAX_BYTES) {
    throw new Error('That file is too large (max 2 MB).');
  }

  const text =
    Platform.OS === 'web'
      ? await (asset.file ? asset.file.text() : fetch(asset.uri).then((r) => r.text()))
      : await new File(asset.uri).text();
  return { name: asset.name, text };
}
