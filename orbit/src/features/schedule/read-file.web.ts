import * as DocumentPicker from 'expo-document-picker';

import { PDF_MAX_PAGES, READER_SCRIPTS, SCHEDULE_FILE_MAX_BYTES } from '@/data/constants';
import type { ReadProgress, ReadResult } from '@/data/types';

const scripts = new Map<string, Promise<void>>();
/** Loads an OCR/PDF library on first use only, so it never weighs on app start-up. */
function loadScript(src: string) {
  let p = scripts.get(src);
  if (!p) {
    p = new Promise<void>((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error('Could not load the file reader. Check your connection and try again.'));
      document.head.appendChild(el);
    });
    scripts.set(src, p);
  }
  return p;
}

type TesseractGlobal = {
  recognize: (
    image: Blob | HTMLCanvasElement,
    lang: string,
    opts?: { logger?: (m: { status: string; progress: number }) => void },
  ) => Promise<{ data: { text: string } }>;
};
type PdfGlobal = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: { data: ArrayBuffer }) => {
    promise: Promise<{
      numPages: number;
      getPage: (n: number) => Promise<{
        getTextContent: () => Promise<{ items: { str: string; transform: number[] }[] }>;
        getViewport: (o: { scale: number }) => { width: number; height: number };
        render: (o: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> };
      }>;
    }>;
  };
};
const g = () => window as unknown as { Tesseract?: TesseractGlobal; pdfjsLib?: PdfGlobal };

async function ocr(image: Blob | HTMLCanvasElement, onProgress?: ReadProgress, label = 'Reading the text in your image') {
  await loadScript(READER_SCRIPTS.tesseract);
  const { data } = await g().Tesseract!.recognize(image, 'eng', {
    logger: (m) => m.status === 'recognizing text' && onProgress?.(label, m.progress),
  });
  return data.text;
}

/** Text layer of a PDF, line by line (items grouped by their vertical position). */
async function pdfText(buffer: ArrayBuffer, onProgress?: ReadProgress): Promise<{ text: string; ocr: boolean }> {
  await loadScript(READER_SCRIPTS.pdfjs);
  const pdfjs = g().pdfjsLib!;
  pdfjs.GlobalWorkerOptions.workerSrc = READER_SCRIPTS.pdfjsWorker;
  const doc = await pdfjs.getDocument({ data: buffer }).promise;
  const pages = Math.min(doc.numPages, PDF_MAX_PAGES);
  let text = '';
  for (let n = 1; n <= pages; n++) {
    onProgress?.(`Reading PDF page ${n} of ${pages}`, n / pages);
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    const rows = new Map<number, { x: number; s: string }[]>();
    for (const it of content.items) {
      const y = Math.round(it.transform[5] / 3);
      rows.set(y, [...(rows.get(y) ?? []), { x: it.transform[4], s: it.str }]);
    }
    text += [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, r]) => r.sort((a, b) => a.x - b.x).map((i) => i.s).join(' '))
      .join('\n') + '\n';
  }
  if (text.replace(/\s/g, '').length >= 30) return { text, ocr: false };

  // Scanned PDF with no text layer: draw each page and read it like a photo.
  let scanned = '';
  for (let n = 1; n <= pages; n++) {
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
    scanned += (await ocr(canvas, onProgress, `Reading scanned page ${n} of ${pages}`)) + '\n';
  }
  return { text: scanned, ocr: true };
}

/** Web: calendar (.ics), photos and screenshots (OCR), PDFs (text layer, OCR when scanned), plain text and CSV. */
export async function readScheduleFile(onProgress?: ReadProgress): Promise<ReadResult | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const file: Blob = asset.file ?? (await fetch(asset.uri).then((r) => r.blob()));
  const name = asset.name;
  if (file.size > SCHEDULE_FILE_MAX_BYTES.web) throw new Error('That file is too large (max 15 MB).');

  if (/\.(png|jpe?g|webp|gif|bmp)$/i.test(name) || file.type.startsWith('image/')) {
    if (/\.hei[cf]$/i.test(name)) throw new Error('HEIC photos are not supported. Take a screenshot or export as JPG or PNG.');
    onProgress?.('Reading the text in your image', 0);
    return { name, kind: 'text', text: await ocr(file, onProgress), ocr: true };
  }
  if (/\.pdf$/i.test(name) || file.type === 'application/pdf') {
    const { text, ocr: scanned } = await pdfText(await file.arrayBuffer(), onProgress);
    return { name, kind: 'text', text, ocr: scanned };
  }
  if (/\.(docx?|xlsx?|pptx?)$/i.test(name)) {
    throw new Error('Office files cannot be read directly. Export it as PDF or CSV, or take a screenshot.');
  }
  const text = await file.text();
  return { name, kind: /\.(ics|ical|icalendar)$/i.test(name) || /^BEGIN:VCALENDAR/m.test(text) ? 'ics' : 'text', text, ocr: false };
}
