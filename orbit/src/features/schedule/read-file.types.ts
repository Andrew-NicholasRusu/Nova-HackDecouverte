export type ReadProgress = (label: string, fraction: number | null) => void;

export type ReadResult = {
  name: string;
  /** 'ics' goes to the calendar parser; everything else is text for the schedule text parser. */
  kind: 'ics' | 'text';
  text: string;
  /** True when the text came from OCR, so the review screen can say to double-check it. */
  ocr: boolean;
};
