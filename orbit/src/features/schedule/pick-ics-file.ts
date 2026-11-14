import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

/** Calendar files from Outlook, Google, Apple and university portals. */
const MAX_BYTES = 2 * 1024 * 1024;

export type PickedFile = { name: string; text: string };

/**
 * Let the student choose an .ics file and return its text, or null if they
 * cancelled. Throws with a readable message for unsupported files.
 */
export async function pickIcsFile(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    // Many file providers don't tag .ics files as text/calendar, so accept any
    // file and let the parser check the content.
    type: '*/*',
    copyToCacheDirectory: true,
    multiple: false,
    base64: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;

  if (asset.size !== undefined && asset.size > MAX_BYTES) {
    throw new Error('That file is too large to be a class schedule (max 2 MB).');
  }
  const name = asset.name ?? 'calendar.ics';
  if (/\.(pdf|png|jpe?g|heic|webp)$/i.test(name)) {
    throw new Error('PDF and image imports are not available yet. Export your schedule as an .ics calendar file instead.');
  }

  const text = asset.file ? await asset.file.text() : await new File(asset.uri).text();
  if (text.length > MAX_BYTES) throw new Error('That file is too large to be a class schedule (max 2 MB).');
  return { name, text };
}
