import { isValidDate, isValidTime, timeToMinutes } from './time';
import { CLASS_KINDS, type ClassEventDraft } from './types';

export type DraftErrors = Partial<Record<keyof ClassEventDraft, string>>;

const COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

/**
 * Field-level validation for a class before it is saved. Mirrors the
 * database check constraints so the student sees a message instead of a
 * rejected insert.
 */
export function validateClassDraft(draft: ClassEventDraft): DraftErrors {
  const errors: DraftErrors = {};
  const code = draft.courseCode.trim();
  const name = draft.courseName.trim();

  if (!code && !name) errors.courseCode = 'Enter a course code or name';
  if (code.length > 20) errors.courseCode = 'Course code is too long';
  if (name.length > 120) errors.courseName = 'Course name is too long';
  if ((draft.section ?? '').length > 20) errors.section = 'Section is too long';
  if ((draft.buildingCode ?? '').length > 10) errors.buildingCode = 'Building code is too long';
  if ((draft.room ?? '').length > 20) errors.room = 'Room is too long';
  if ((draft.notes ?? '').length > 500) errors.notes = 'Notes are too long';
  if (!CLASS_KINDS.includes(draft.kind)) errors.kind = 'Choose a class type';
  if (draft.color && !COLOR_RE.test(draft.color)) errors.color = 'Invalid colour';

  if (!isValidTime(draft.startTime)) errors.startTime = 'Use 24-hour HH:MM';
  if (!isValidTime(draft.endTime)) errors.endTime = 'Use 24-hour HH:MM';
  if (
    !errors.startTime &&
    !errors.endTime &&
    timeToMinutes(draft.endTime) <= timeToMinutes(draft.startTime)
  ) {
    errors.endTime = 'End time must be after start time';
  }

  if (!isValidDate(draft.startDate)) errors.startDate = 'Use YYYY-MM-DD';
  if (!isValidDate(draft.endDate)) errors.endDate = 'Use YYYY-MM-DD';
  if (!errors.startDate && !errors.endDate && draft.endDate < draft.startDate) {
    errors.endDate = 'End date must be on or after start date';
  }
  if (new Set(draft.weekdays).size !== draft.weekdays.length) {
    errors.weekdays = 'Duplicate weekday';
  }
  if (draft.excludedDates.some((d) => !isValidDate(d))) {
    errors.excludedDates = 'Invalid skipped date';
  }
  return errors;
}

export function hasErrors(errors: DraftErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Normalize user input before saving (trim, uppercase codes, null empties). */
export function normalizeDraft(draft: ClassEventDraft): ClassEventDraft {
  const blankToNull = (v: string | null) => (v && v.trim() ? v.trim() : null);
  return {
    ...draft,
    courseCode: draft.courseCode.trim().toUpperCase().replace(/\s+/g, ' '),
    courseName: draft.courseName.trim(),
    section: blankToNull(draft.section)?.toUpperCase() ?? null,
    buildingCode: blankToNull(draft.buildingCode)?.toUpperCase() ?? null,
    room: blankToNull(draft.room)?.toUpperCase() ?? null,
    notes: blankToNull(draft.notes),
    weekdays: [...new Set(draft.weekdays)].sort((a, b) => a - b),
    excludedDates: [...new Set(draft.excludedDates)].sort(),
  };
}
