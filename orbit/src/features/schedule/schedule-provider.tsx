import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { ClassEvent, ClassEventDraft, Schedule } from '@/lib/schedule/types';
import { DEFAULT_TIMEZONE } from '@/lib/schedule/types';
import { useAuth } from '@/providers/auth-provider';

import * as api from './schedule-api';

type Status = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready' };

export type ScheduleContextValue = Status & {
  schedules: Schedule[];
  /** The schedule the calendar and dashboard show. */
  active: Schedule | null;
  /** Events of the active schedule. */
  events: ClassEvent[];
  timeZone: string;
  reload: () => void;
  createSchedule: (input: api.ScheduleInput) => Promise<Schedule>;
  updateSchedule: (id: string, input: api.ScheduleInput) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  switchSchedule: (id: string) => Promise<void>;
  addEvents: (drafts: ClassEventDraft[]) => Promise<void>;
  updateEvent: (id: string, draft: ClassEventDraft) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  /** Cancel a single meeting of a recurring class. */
  skipOccurrence: (event: ClassEvent, date: string) => Promise<void>;
};

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

/** Shared schedule state so the Schedule tab and the dashboard always agree. */
export function ScheduleProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [status, setStatus] = useState<Status>({ status: 'loading' });
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allEvents, setAllEvents] = useState<ClassEvent[]>([]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    api
      .fetchScheduleData()
      .then(({ schedules: s, events: e }) => {
        if (cancelled) return;
        setSchedules(s);
        setAllEvents(e);
        setStatus({ status: 'ready' });
      })
      .catch((e: Error) => !cancelled && setStatus({ status: 'error', message: e.message }));
    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);

  const reload = useCallback(() => {
    setStatus({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  // Fall back to the most recent term if none is flagged active.
  const active = schedules.find((s) => s.isActive) ?? schedules[0] ?? null;
  const events = useMemo(
    () => (active ? allEvents.filter((e) => e.scheduleId === active.id) : []),
    [allEvents, active],
  );

  const requireUser = useCallback(() => {
    if (!userId) throw new Error('You are signed out.');
    return userId;
  }, [userId]);

  const switchSchedule = useCallback(async (id: string) => {
    await api.activateSchedule(id);
    setSchedules((prev) => prev.map((s) => ({ ...s, isActive: s.id === id })));
  }, []);

  const createSchedule = useCallback(
    async (input: api.ScheduleInput) => {
      const created = await api.insertSchedule(requireUser(), input);
      await api.activateSchedule(created.id);
      const next = { ...created, isActive: true };
      setSchedules((prev) =>
        [...prev.map((s) => ({ ...s, isActive: false })), next].sort((a, b) =>
          b.startsOn.localeCompare(a.startsOn),
        ),
      );
      return next;
    },
    [requireUser],
  );

  const updateSchedule = useCallback(async (id: string, input: api.ScheduleInput) => {
    await api.updateScheduleRow(id, input);
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...input } : s)));
  }, []);

  const deleteSchedule = useCallback(async (id: string) => {
    await api.deleteScheduleRow(id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    setAllEvents((prev) => prev.filter((e) => e.scheduleId !== id));
  }, []);

  const addEvents = useCallback(
    async (drafts: ClassEventDraft[]) => {
      if (!active) throw new Error('Create a term first.');
      const created = await api.insertEvents(requireUser(), active.id, drafts);
      setAllEvents((prev) => [...prev, ...created]);
    },
    [active, requireUser],
  );

  const updateEvent = useCallback(async (id: string, draft: ClassEventDraft) => {
    const updated = await api.updateEventRow(id, draft);
    setAllEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    await api.deleteEventRow(id);
    setAllEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const skipOccurrence = useCallback(
    async (event: ClassEvent, date: string) => {
      const excludedDates = [...new Set([...event.excludedDates, date])].sort();
      await updateEvent(event.id, { ...event, excludedDates });
    },
    [updateEvent],
  );

  const value: ScheduleContextValue = {
    ...(userId ? status : { status: 'loading' as const }),
    schedules: userId ? schedules : [],
    active: userId ? active : null,
    events: userId ? events : [],
    timeZone: active?.timezone ?? DEFAULT_TIMEZONE,
    reload,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    switchSchedule,
    addEvents,
    updateEvent,
    deleteEvent,
    skipOccurrence,
  };

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
}

export function useSchedule(): ScheduleContextValue {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error('useSchedule must be used inside <ScheduleProvider>');
  return ctx;
}
