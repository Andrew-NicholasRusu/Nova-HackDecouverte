/**
 * Course colours. Muted mid-tones that read on both the off-white and charcoal
 * surfaces; burgundy is deliberately absent so courses never look like the
 * brand accent or an error.
 */
export const COURSE_COLORS = [
  '#3B6EA8', // steel blue
  '#2F8F83', // teal
  '#6A8E3A', // olive
  '#B7792B', // ochre
  '#7B5EA7', // violet
  '#B5576F', // rose
  '#4F7C99', // slate
  '#8C6A4F', // umber
] as const;

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** The event's own colour, or a stable colour derived from its course code. */
export function courseColor(event: { courseCode: string; color: string | null }): string {
  if (event.color) return event.color;
  const key = event.courseCode.replace(/\s+/g, '').toUpperCase();
  return COURSE_COLORS[hash(key) % COURSE_COLORS.length]!;
}
