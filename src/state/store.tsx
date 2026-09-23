// App state: a single React context backed by AsyncStorage. Everything stays on
// the device. There are no accounts and no server. (The optional AI coach sends only
// what's described in src/ai/coach.ts, and only when the athlete connects a key.)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { buildDemoState } from '../data/demo';
import type { Workout } from '../data/workouts';
import type { CheckStatus, MovementId } from '../engine/form';
import type { ShoppingItem } from '../engine/shopping';
import type { DayLog, Profile, TrainingEvent, WindowStatus, WorkoutLog } from '../engine/types';

const STORAGE_KEY = 'fuelcast:state';
const VERSION = 2;
const MAX_CHAT = 40;

export interface ChatRecipe {
  name: string;
  minutes: number;
  ingredients: string[];
  steps: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** Raw assistant content blocks, replayed to the API on the next turn. */
  content?: unknown;
  workout?: Workout;
  recipe?: ChatRecipe;
  shopping?: string[];
  /** Answered on-device (no AI key connected). */
  offline?: boolean;
  error?: boolean;
  at: number;
}

export interface FormCheckRecord {
  id: string;
  movement: MovementId;
  score: number;
  date: string;
  at: number;
  topCue: string;
  checks: { label: string; status: CheckStatus }[];
}

export interface UiPrefs {
  /** The getting-started checklist on Today was dismissed. */
  checklistDismissed?: boolean;
}

export interface AppState {
  version: number;
  onboarded: boolean;
  profile: Profile;
  events: TrainingEvent[];
  pantry: string[];
  logs: Record<string, DayLog>;
  customWorkouts: Workout[];
  workoutLogs: WorkoutLog[];
  shopping: ShoppingItem[];
  chat: ChatMessage[];
  formChecks: FormCheckRecord[];
  ui: UiPrefs;
  demo: boolean;
}

export const DEFAULT_PROFILE: Profile = {
  name: '',
  sport: 'Soccer',
  units: 'imperial',
  bottleMl: 710,
  goal: 'general',
  level: 'beginner',
  equipment: ['dumbbells'],
  sessionMin: 40,
};

export const initialState = (): AppState => ({
  version: VERSION,
  onboarded: false,
  profile: DEFAULT_PROFILE,
  events: [],
  pantry: ['banana', 'bagel', 'pretzels', 'chocmilk', 'greekyogurt', 'turkeysandwich', 'pasta', 'apple'],
  logs: {},
  customWorkouts: [],
  workoutLogs: [],
  shopping: [],
  chat: [],
  formChecks: [],
  ui: {},
  demo: false,
});

export const emptyDay = (): DayLog => ({ windows: {}, waterMl: 0, energy: {} });

/** Bring older saved data up to the current shape without losing anything. */
export function migrate(raw: unknown): AppState | null {
  const s = raw as Partial<AppState> & { version?: number };
  if (!s || typeof s !== 'object' || typeof s.profile !== 'object' || !Array.isArray(s.events) || !Array.isArray(s.pantry)) return null;
  if (s.version !== 1 && s.version !== VERSION) return null;
  return {
    ...initialState(),
    ...s,
    version: VERSION,
    profile: { ...DEFAULT_PROFILE, ...s.profile },
    customWorkouts: s.customWorkouts ?? [],
    workoutLogs: s.workoutLogs ?? [],
    shopping: s.shopping ?? [],
    chat: s.chat ?? [],
    formChecks: s.formChecks ?? [],
    ui: s.ui ?? {},
  } as AppState;
}

interface Actions {
  completeOnboarding: (profile: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  upsertEvent: (event: TrainingEvent) => void;
  deleteEvent: (id: string) => void;
  togglePantry: (foodId: string) => void;
  addToPantry: (foodIds: string[]) => void;
  logWindow: (date: string, windowId: string, status: WindowStatus, foodIds?: string[]) => void;
  clearWindow: (date: string, windowId: string) => void;
  addWater: (date: string, deltaMl: number) => void;
  setEnergy: (date: string, eventId: string, value: number) => void;
  saveWorkout: (w: Workout) => void;
  deleteWorkout: (id: string) => void;
  addWorkoutLog: (log: WorkoutLog) => void;
  deleteWorkoutLog: (id: string) => void;
  setShopping: (fn: (list: ShoppingItem[]) => ShoppingItem[]) => void;
  /** Checked items with a library food move into the kitchen; all checked items leave the list. */
  moveCheckedToKitchen: () => void;
  addChat: (msgs: ChatMessage[]) => void;
  patchChat: (id: string, patch: Partial<ChatMessage>) => void;
  clearChat: () => void;
  addFormCheck: (r: FormCheckRecord) => void;
  setUi: (patch: Partial<UiPrefs>) => void;
  loadDemo: (today: string, nowMin: number) => void;
  resetAll: () => void;
}

interface StoreValue extends Actions {
  state: AppState;
  ready: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const migrated = migrate(JSON.parse(raw));
        if (migrated) setState(migrated);
      })
      .catch(() => {
        // Corrupt or unavailable storage: start fresh rather than crash.
      })
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const updateDay = useCallback((date: string, fn: (d: DayLog) => DayLog) => {
    setState((s) => ({ ...s, logs: { ...s.logs, [date]: fn(s.logs[date] ?? emptyDay()) } }));
  }, []);

  const actions = useMemo<Actions>(
    () => ({
      completeOnboarding: (profile) => setState((s) => ({ ...s, profile, onboarded: true })),
      updateProfile: (patch) => setState((s) => ({ ...s, profile: { ...s.profile, ...patch } })),
      upsertEvent: (event) =>
        setState((s) => ({
          ...s,
          events: s.events.some((e) => e.id === event.id)
            ? s.events.map((e) => (e.id === event.id ? event : e))
            : [...s.events, event],
        })),
      deleteEvent: (id) => setState((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) })),
      togglePantry: (foodId) =>
        setState((s) => ({
          ...s,
          pantry: s.pantry.includes(foodId) ? s.pantry.filter((id) => id !== foodId) : [...s.pantry, foodId],
        })),
      addToPantry: (foodIds) => setState((s) => ({ ...s, pantry: [...new Set([...s.pantry, ...foodIds])] })),
      logWindow: (date, windowId, status, foodIds) =>
        updateDay(date, (d) => ({ ...d, windows: { ...d.windows, [windowId]: { status, foodIds, at: Date.now() } } })),
      clearWindow: (date, windowId) =>
        updateDay(date, (d) => {
          const windows = { ...d.windows };
          delete windows[windowId];
          return { ...d, windows };
        }),
      addWater: (date, deltaMl) => updateDay(date, (d) => ({ ...d, waterMl: Math.max(0, d.waterMl + deltaMl) })),
      setEnergy: (date, eventId, value) =>
        updateDay(date, (d) => ({ ...d, energy: { ...d.energy, [eventId]: value } })),
      saveWorkout: (w) =>
        setState((s) => ({
          ...s,
          customWorkouts: s.customWorkouts.some((x) => x.id === w.id)
            ? s.customWorkouts.map((x) => (x.id === w.id ? w : x))
            : [w, ...s.customWorkouts],
        })),
      deleteWorkout: (id) =>
        setState((s) => ({
          ...s,
          customWorkouts: s.customWorkouts.filter((w) => w.id !== id),
          events: s.events.map((e) => (e.workoutId === id ? { ...e, workoutId: undefined } : e)),
        })),
      addWorkoutLog: (log) => setState((s) => ({ ...s, workoutLogs: [log, ...s.workoutLogs] })),
      deleteWorkoutLog: (id) => setState((s) => ({ ...s, workoutLogs: s.workoutLogs.filter((l) => l.id !== id) })),
      setShopping: (fn) => setState((s) => ({ ...s, shopping: fn(s.shopping) })),
      moveCheckedToKitchen: () =>
        setState((s) => {
          const bought = s.shopping.filter((i) => i.checked);
          const foodIds = bought.map((i) => i.foodId).filter((id): id is string => !!id);
          return { ...s, pantry: [...new Set([...s.pantry, ...foodIds])], shopping: s.shopping.filter((i) => !i.checked) };
        }),
      addChat: (msgs) => setState((s) => ({ ...s, chat: [...s.chat, ...msgs].slice(-MAX_CHAT) })),
      patchChat: (id, patch) => setState((s) => ({ ...s, chat: s.chat.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      clearChat: () => setState((s) => ({ ...s, chat: [] })),
      addFormCheck: (r) => setState((s) => ({ ...s, formChecks: [r, ...s.formChecks].slice(0, 30) })),
      setUi: (patch) => setState((s) => ({ ...s, ui: { ...s.ui, ...patch } })),
      loadDemo: (today, nowMin) => setState(buildDemoState(today, nowMin)),
      resetAll: () => setState(initialState()),
    }),
    [updateDay],
  );

  const value = useMemo(() => ({ state, ready, ...actions }), [state, ready, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

/** Current time, refreshed every 30 s so countdowns and "now" markers stay live. */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
