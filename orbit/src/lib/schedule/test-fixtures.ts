import type { ClassEventDraft } from './types';

export const TZ = 'America/Toronto';

export function draft(overrides: Partial<ClassEventDraft> = {}): ClassEventDraft {
  return {
    courseCode: 'COMP 248',
    courseName: 'Object-Oriented Programming I',
    section: 'AA',
    kind: 'lecture',
    buildingCode: 'H',
    room: '937',
    weekdays: [1, 3],
    startTime: '10:15',
    endTime: '11:30',
    startDate: '2026-09-07',
    endDate: '2026-12-07',
    excludedDates: [],
    color: null,
    notes: null,
    source: 'manual',
    ...overrides,
  };
}
