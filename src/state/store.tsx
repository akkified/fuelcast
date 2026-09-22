// App state: a single React context backed by AsyncStorage. Everything stays on
// the device. There are no accounts and no server.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { buildDemoState } from '../data/demo';
import type { DayLog, Profile, TrainingEvent, WindowStatus } from '../engine/types';

const STORAGE_KEY = 'fuelcast:state';
const VERSION = 1;

export interface AppState {
  version: number;
  onboarded: boolean;
  profile: Profile;
  events: TrainingEvent[];
  pantry: string[];
  logs: Record<string, DayLog>;
  demo: boolean;
}

export const DEFAULT_PROFILE: Profile = { name: '', sport: 'Soccer', units: 'imperial', bottleMl: 710 };

export const initialState = (): AppState => ({
  version: VERSION,
  onboarded: false,
  profile: DEFAULT_PROFILE,
  events: [],
  pantry: ['banana', 'bagel', 'pretzels', 'chocmilk', 'greekyogurt', 'turkeysandwich', 'pasta', 'apple'],
  logs: {},
  demo: false,
});

export const emptyDay = (): DayLog => ({ windows: {}, waterMl: 0, energy: {} });

interface Actions {
  completeOnboarding: (profile: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  upsertEvent: (event: TrainingEvent) => void;
  deleteEvent: (id: string) => void;
  togglePantry: (foodId: string) => void;
  logWindow: (date: string, windowId: string, status: WindowStatus, foodIds?: string[]) => void;
  clearWindow: (date: string, windowId: string) => void;
  addWater: (date: string, deltaMl: number) => void;
  setEnergy: (date: string, eventId: string, value: number) => void;
  loadDemo: (today: string, nowMin: number) => void;
  resetAll: () => void;
}

interface StoreValue extends Actions {
  state: AppState;
  ready: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

function isAppState(x: unknown): x is AppState {
  const s = x as AppState;
  return !!s && s.version === VERSION && typeof s.profile === 'object' && Array.isArray(s.events) && Array.isArray(s.pantry);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (isAppState(parsed)) setState(parsed);
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
