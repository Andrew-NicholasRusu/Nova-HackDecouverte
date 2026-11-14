import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

const MAX_BYTES = 2 * 1024 * 1024; // calendar files are small; refuse anything larger

/** Lets the student pick a calendar file and returns its text, or null if cancelled. */
export async function pickCalendarFile(): Promise<{ name: string; text: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/calendar', 'application/ics', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  if (!/\.ics$/i.test(asset.name) && asset.mimeType !== 'text/calendar') {
    throw new Error('Choose a calendar file ending in .ics.');
  }
  if (asset.size && asset.size > MAX_BYTES) throw new Error('That file is too large to be a class calendar.');

  const text =
    Platform.OS === 'web' && asset.file ? await asset.file.text() : await new File(asset.uri).text();
  if (!text.includes('BEGIN:VCALENDAR')) throw new Error("That file isn't a valid calendar (.ics) file.");
  return { name: asset.name, text };
}
