import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import type { ClassEvent, ClassEventInput } from '@/core/schedule/model';
import { supabase } from '@/lib/supabase';

const COLUMNS =
  'id, term_label, course_code, course_title, component, section, building_code, room, days, start_time, end_time, start_date, end_date, timezone, color, source, notes';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string; missingTable: boolean }
  | { status: 'ready'; classes: ClassEvent[] };

type Ctx = {
  state: State;
  reload: () => void;
  /** Each returns an error message, or null on success. */
  addMany: (inputs: ClassEventInput[]) => Promise<string | null>;
  update: (id: string, input: ClassEventInput) => Promise<string | null>;
  remove: (id: string) => Promise<string | null>;
};

const ScheduleContext = createContext<Ctx | null>(null);

const sortClasses = (list: ClassEvent[]) =>
  [...list].sort(
    (a, b) => a.course_code.localeCompare(b.course_code) || a.start_time.localeCompare(b.start_time),
  );

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('class_events')
      .select(COLUMNS)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState({ status: 'error', message: error.message, missingTable: error.code === 'PGRST205' });
        } else {
          setState({ status: 'ready', classes: sortClasses(data as ClassEvent[]) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  const addMany = useCallback(async (inputs: ClassEventInput[]) => {
    const { data, error } = await supabase.from('class_events').insert(inputs).select(COLUMNS);
    if (error) return error.message;
    setState((s) =>
      s.status === 'ready'
        ? { status: 'ready', classes: sortClasses([...s.classes, ...(data as ClassEvent[])]) }
        : s,
    );
    return null;
  }, []);

  const update = useCallback(async (id: string, input: ClassEventInput) => {
    const { data, error } = await supabase
      .from('class_events')
      .update(input)
      .eq('id', id)
      .select(COLUMNS)
      .single();
    if (error) return error.message;
    setState((s) =>
      s.status === 'ready'
        ? {
            status: 'ready',
            classes: sortClasses(s.classes.map((c) => (c.id === id ? (data as ClassEvent) : c))),
          }
        : s,
    );
    return null;
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('class_events').delete().eq('id', id);
    if (error) return error.message;
    setState((s) =>
      s.status === 'ready' ? { status: 'ready', classes: s.classes.filter((c) => c.id !== id) } : s,
    );
    return null;
  }, []);

  return (
    <ScheduleContext.Provider value={{ state, reload, addMany, update, remove }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const ctx = useContext(ScheduleContext);
  if (!ctx) throw new Error('useSchedule must be used inside ScheduleProvider');
  return ctx;
}

/** All classes once loaded, else an empty list. */
export function useClasses(): ClassEvent[] {
  const { state } = useSchedule();
  return state.status === 'ready' ? state.classes : EMPTY;
}

const EMPTY: ClassEvent[] = [];
