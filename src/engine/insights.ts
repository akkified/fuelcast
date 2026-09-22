// Insights: daily Fuel Score, streaks, and the energy-vs-fueling comparison.

import { addDays } from './time';
import type { DayLog, FuelWindow } from './types';

export const GOOD_DAY = 70;

/** 80% of the score is hitting fueling windows, 20% is hydration. Rest days are hydration only. */
export function dayScore(windows: FuelWindow[], log: DayLog | undefined, waterGoalMl: number): number {
  const water = Math.min(1, (log?.waterMl ?? 0) / Math.max(1, waterGoalMl));
  if (windows.length === 0) return Math.round(water * 100);
  const done = windows.filter((w) => log?.windows[w.id]?.status === 'done').length;
  return Math.round((done / windows.length) * 80 + water * 20);
}

/** A session counts as fueled if the athlete ate in any window leading into it. */
export function isEventFueled(eventId: string, windows: FuelWindow[], log: DayLog | undefined): boolean {
  if (!log) return false;
  return windows.some(
    (w) =>
      log.windows[w.id]?.status === 'done' &&
      (((w.type === 'preMeal' || w.type === 'topOff') && w.eventId === eventId) || w.reloadForEventId === eventId),
  );
}

export interface EnergyInsight {
  fueledAvg: number;
  unfueledAvg: number;
  fueledCount: number;
  unfueledCount: number;
}

/** Compares session energy ratings when fueled vs. not. Needs at least 2 of each to say anything. */
export function energyInsight(entries: { fueled: boolean; energy: number }[]): EnergyInsight | null {
  const f = entries.filter((e) => e.fueled);
  const u = entries.filter((e) => !e.fueled);
  if (f.length < 2 || u.length < 2) return null;
  const avg = (xs: typeof entries) => Math.round((xs.reduce((s, x) => s + x.energy, 0) / xs.length) * 10) / 10;
  return { fueledAvg: avg(f), unfueledAvg: avg(u), fueledCount: f.length, unfueledCount: u.length };
}

/** Consecutive good days ending today (or yesterday, if today isn't there yet). */
export function streak(today: string, scoreFor: (key: string) => number): number {
  let d = scoreFor(today) >= GOOD_DAY ? today : addDays(today, -1);
  let n = 0;
  while (n < 366 && scoreFor(d) >= GOOD_DAY) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function topFoods(logs: DayLog[], limit = 3): { id: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const log of logs)
    for (const w of Object.values(log.windows))
      for (const id of w.foodIds ?? []) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
    .slice(0, limit);
}
