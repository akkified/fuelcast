// A clearly-labelled sample athlete with two weeks of history, so the app can
// be explored (and demoed) without waiting two weeks for real data.

import { buildDayPlan, eventsOn } from '../engine/forecast';
import { bestCombos } from '../engine/fuelFit';
import { dailyGoalMl } from '../engine/hydration';
import { isEventFueled } from '../engine/insights';
import { addDays } from '../engine/time';
import type { DayLog, Profile, TrainingEvent } from '../engine/types';
import type { AppState } from '../state/store';
import { FOOD_BY_ID } from './foods';

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
};

export const DEMO_EVENTS: TrainingEvent[] = [
  { id: 'demo-practice', title: 'Varsity practice', kind: 'practice', days: [1, 2, 4], startMin: 945, durationMin: 105, intensity: 'hard' },
  { id: 'demo-match', title: 'Match', kind: 'game', days: [3, 5], startMin: 1080, durationMin: 90, intensity: 'hard' },
  { id: 'demo-cond', title: 'Morning conditioning', kind: 'conditioning', days: [2], startMin: 390, durationMin: 45, intensity: 'moderate' },
  { id: 'demo-lift', title: 'Weight room', kind: 'lift', days: [6], startMin: 540, durationMin: 60, intensity: 'moderate' },
];

export const DEMO_PANTRY = [
  'banana', 'bagel', 'pretzels', 'chocmilk', 'greekyogurt', 'turkeysandwich', 'pasta', 'chicken', 'rice',
  'granolabar', 'apple', 'stringcheese', 'honey', 'sportsdrink', 'chips', 'pb', 'milk', 'berries',
];

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

  return {
    version: 1,
    onboarded: true,
    profile: DEMO_PROFILE,
    events: DEMO_EVENTS,
    pantry: DEMO_PANTRY,
    logs,
    demo: true,
  };
}
