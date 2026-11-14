import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import type { ReadProgress, ReadResult } from './read-file.types';

const MAX_BYTES = 8_000_000;

/** Native: calendar and text files. Photo and PDF reading needs the web app (see read-file.web.ts). */
export async function readScheduleFile(_onProgress?: ReadProgress): Promise<ReadResult | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (asset.size && asset.size > MAX_BYTES) throw new Error('That file is too large (max 8 MB).');

  if (/\.(png|jpe?g|webp|gif|bmp|heic|pdf)$/i.test(asset.name)) {
    throw new Error('Reading photos and PDFs works in the web app. On your phone, import an .ics file or paste the schedule text.');
  }
  if (/\.(docx?|xlsx?|pptx?)$/i.test(asset.name)) {
    throw new Error('Office files cannot be read directly. Export it as PDF, CSV or a screenshot, or paste the text.');
  }
  const text = await new File(asset.uri).text();
  return { name: asset.name, kind: /\.(ics|ical|icalendar)$/i.test(asset.name) || /^BEGIN:VCALENDAR/m.test(text) ? 'ics' : 'text', text, ocr: false };
}
