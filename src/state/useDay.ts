import { useMemo } from 'react';

import { buildDayPlan, eventsOn } from '../engine/forecast';
import { dailyGoalMl } from '../engine/hydration';
import { dayScore } from '../engine/insights';
import type { DayLog, FuelWindow, TrainingEvent } from '../engine/types';
import { useStore, type AppState } from './store';

export interface DayView {
  date: string;
  events: TrainingEvent[];
  plan: FuelWindow[];
  goalMl: number;
  log: DayLog | undefined;
  score: number;
}

export function computeDay(state: AppState, date: string): DayView {
  const events = eventsOn(date, state.events);
  const plan = buildDayPlan(date, state.events, state.profile);
  const goalMl = dailyGoalMl(state.profile, events);
  const log = state.logs[date];
  return { date, events, plan, goalMl, log, score: dayScore(plan, log, goalMl) };
}

export function useDay(date: string): DayView {
  const { state } = useStore();
  return useMemo(() => computeDay(state, date), [state, date]);
}
