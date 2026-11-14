/**
 * Schedule import entry point: turns what was read from a file or pasted (see read-file.ts)
 * into drafts for the review screen, using the calendar or the text parser.
 */

import type { PendingImport, ReadResult } from '@/data/types';

import { parseIcs } from './ics';
import { parseScheduleText } from './parse-text';

export type ImportOutcome = { ok: true; value: PendingImport } | { ok: false; error: string };

export function parseImport({ name, kind, text, ocr }: ReadResult): ImportOutcome {
  const { drafts, skipped } = kind === 'ics' ? parseIcs(text) : parseScheduleText(text);
  if (drafts.length === 0) {
    return {
      ok: false,
      error:
        kind === 'ics'
          ? 'No classes found in that calendar.'
          : ocr
            ? 'We could read the image but found no classes. Try a sharper, cropped screenshot of the schedule, or paste the text.'
            : 'No classes found. Each class needs a course code like COMP 352 and a time like 10:15-11:30.',
    };
  }
  return {
    ok: true,
    value: {
      fileName: name,
      skipped,
      drafts: ocr ? drafts.map((d) => ({ ...d, warnings: ['Read from an image, so double-check this class.', ...d.warnings] })) : drafts,
    },
  };
}
