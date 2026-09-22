// A clearly-labelled sample athlete with two weeks of history, so the app can
// be explored (and demoed) without waiting two weeks for real data.

import { atMs } from '../engine/coach';
import { buildDayPlan, eventsOn } from '../engine/forecast';
import { bestCombos } from '../engine/fuelFit';
import { dailyGoalMl } from '../engine/hydration';
import { isEventFueled } from '../engine/insights';
import { addDays } from '../engine/time';
import type { DayLog, Profile, SetLog, TrainingEvent, WorkoutLog } from '../engine/types';
import type { AppState } from '../state/store';
import { EXERCISE_BY_ID } from './exercises';
import { FOOD_BY_ID } from './foods';
import { STARTER_WORKOUTS } from './workouts';

/** Deterministic PRNG (mulberry32) so the sample week looks the same every time. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEMO_PROFILE: Profile = {
  name: 'Maya',
  sport: 'Soccer',
  units: 'imperial',
  bottleMl: 710,
  weightKg: 56.7,
  sweatRateLph: 0.9,
  goal: 'power',
  level: 'intermediate',
  equipment: ['dumbbells', 'bands'],
  sessionMin: 40,
};

export const DEMO_EVENTS: TrainingEvent[] = [
  { id: 'demo-practice', title: 'Varsity practice', kind: 'practice', days: [1, 2, 4], startMin: 945, durationMin: 105, intensity: 'hard' },
  { id: 'demo-match', title: 'Match', kind: 'game', days: [3, 5], startMin: 1080, durationMin: 90, intensity: 'hard' },
  { id: 'demo-cond', title: 'Morning conditioning', kind: 'conditioning', days: [2], startMin: 390, durationMin: 45, intensity: 'moderate' },
  { id: 'demo-lift', title: 'Weight room', kind: 'lift', days: [6], startMin: 540, durationMin: 60, intensity: 'moderate', workoutId: 'db-full-a' },
];

export const DEMO_PANTRY = [
  'banana', 'bagel', 'pretzels', 'chocmilk', 'greekyogurt', 'turkeysandwich', 'pasta', 'chicken', 'rice',
  'granolabar', 'apple', 'stringcheese', 'honey', 'sportsdrink', 'chips', 'pb', 'milk', 'berries',
  'tortilla', 'eggs', 'cheddar', 'salsa', 'oats',
];

/** Starting dumbbell weights (kg) for the sample athlete; they creep up each week. */
const DEMO_LOADS: Record<string, number> = {
  'goblet-squat': 16, 'db-bench': 12, 'db-rdl': 14, 'db-row': 14, 'db-ohp': 8, 'step-up': 8, 'single-leg-rdl': 10,
};

function demoWorkoutLog(workoutId: string, date: string, startMin: number, week: number): WorkoutLog {
  const w = STARTER_WORKOUTS.find((x) => x.id === workoutId)!;
  const sets: SetLog[] = [];
  for (const it of w.items) {
    const base = DEMO_LOADS[it.exerciseId];
    for (let k = 0; k < it.sets; k++) {
      sets.push({
        exerciseId: it.exerciseId,
        targetReps: it.reps,
        reps: it.reps,
        ...(base && EXERCISE_BY_ID[it.exerciseId] ? { weightKg: base + week * 1 } : {}),
        done: true,
      });
    }
  }
  const startedAt = atMs(date, startMin);
  return { id: `demo-${workoutId}-${date}`, workoutId, name: w.name, date, startedAt, finishedAt: startedAt + w.durationMin * 60_000, rpe: 7, sets };
}

export function buildDemoState(today: string, nowMin: number): AppState {
  const rand = rng(20261007);
  const pantryFoods = DEMO_PANTRY.map((id) => FOOD_BY_ID[id]);
  const logs: Record<string, DayLog> = {};

  for (let back = 13; back >= 0; back--) {
    const date = addDays(today, -back);
    const plan = buildDayPlan(date, DEMO_EVENTS, DEMO_PROFILE);
    const goal = dailyGoalMl(DEMO_PROFILE, eventsOn(date, DEMO_EVENTS));
    // Consistency improves over the two weeks, like a real athlete building a habit.
    const hitRate = back > 7 ? 0.5 : 0.82;
    const log: DayLog = { windows: {}, waterMl: 0, energy: {} };

    for (const w of plan) {
      if (back === 0 && w.endMin > nowMin) continue;
      if (rand() < hitRate) {
        const combos = bestCombos(pantryFoods, w.type, w.targets);
        const pick = combos[Math.floor(rand() * combos.length)] ?? combos[0];
        log.windows[w.id] = { status: 'done', foodIds: pick?.foods.map((f) => f.id) ?? [], at: 0 };
      }
    }

    const dayFraction = back === 0 ? Math.min(1, Math.max(0, (nowMin - 420) / 900)) : 1;
    log.waterMl = Math.round((goal * dayFraction * (0.6 + rand() * 0.45)) / 50) * 50;

    for (const e of eventsOn(date, DEMO_EVENTS)) {
      if (back === 0 && e.startMin + e.durationMin > nowMin) continue;
      const fueled = isEventFueled(e.id, plan, log);
      const base = fueled ? 4 : 2.4;
      log.energy[e.id] = Math.max(1, Math.min(5, Math.round(base + (rand() - 0.4) * 1.4)));
    }
    logs[date] = log;
  }

  // Two weeks of training: Saturday weight room (alternating A/B), Sunday recovery, Thursday core.
  const workoutLogs: WorkoutLog[] = [];
  for (let back = 13; back >= 1; back--) {
    const date = addDays(today, -back);
    const wd = new Date(atMs(date, 0)).getDay();
    const week = back > 7 ? 0 : 1;
    if (wd === 6) workoutLogs.push(demoWorkoutLog(week === 0 ? 'db-full-b' : 'db-full-a', date, 540, week));
    if (wd === 0) workoutLogs.push(demoWorkoutLog('recovery-flow', date, 600, week));
    if (wd === 4) workoutLogs.push(demoWorkoutLog('core-stability', date, 1080, week));
  }
  workoutLogs.sort((a, b) => b.finishedAt - a.finishedAt);

  return {
    version: 2,
    onboarded: true,
    profile: DEMO_PROFILE,
    events: DEMO_EVENTS,
    pantry: DEMO_PANTRY,
    logs,
    customWorkouts: [],
    workoutLogs,
    shopping: [],
    chat: [],
    demo: true,
  };
}
