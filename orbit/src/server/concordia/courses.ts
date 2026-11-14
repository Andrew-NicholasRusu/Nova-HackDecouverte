import { concordiaGet } from './client';

/** Shape returned by GET course/catalog/filter/{subject}/{catalog}/{career} (verified live). */
type RawCourse = {
  ID: string;
  title: string;
  subject: string;
  catalog: string;
  career: string;
  classUnit: string;
  prerequisites: string | null;
  crosslisted: string | null;
};

export type Course = {
  code: string; // "COMP 352"
  title: string;
  credits: number | null;
  career: string;
  prerequisites: string | null;
};

/**
 * Looks up a course in Concordia's catalog. Note: the Open Data schedule endpoints currently
 * return no sections, so times/rooms are not available here — only catalog facts.
 */
export async function findCourse(subject: string, catalog: string): Promise<Course[]> {
  const s = encodeURIComponent(subject.toUpperCase());
  const c = encodeURIComponent(catalog.toUpperCase());
  const raw = await concordiaGet<RawCourse[]>(`course/catalog/filter/${s}/${c}/*`);
  return raw.map((r) => ({
    code: `${r.subject} ${r.catalog}`,
    title: r.title.trim(),
    credits: Number.isFinite(Number.parseFloat(r.classUnit)) ? Number.parseFloat(r.classUnit) : null,
    career: r.career,
    prerequisites: r.prerequisites?.trim() || null,
  }));
}
