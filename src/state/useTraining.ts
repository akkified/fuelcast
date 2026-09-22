import { useMemo } from 'react';

import { STARTER_WORKOUTS, type Workout } from '../data/workouts';
import { recommend, type Recommendation } from '../engine/coach';
import { dateKey } from '../engine/time';
import { useStore, type AppState } from './store';

export function allWorkouts(state: Pick<AppState, 'customWorkouts'>): Workout[] {
  return [...state.customWorkouts, ...STARTER_WORKOUTS];
}

export function findWorkout(state: Pick<AppState, 'customWorkouts'>, id: string | undefined): Workout | undefined {
  if (!id) return undefined;
  return state.customWorkouts.find((w) => w.id === id) ?? STARTER_WORKOUTS.find((w) => w.id === id);
}

/** Smart Coach recommendation for right now. Recomputed when data or the clock changes. */
export function useRecommendation(now: Date): Recommendation {
  const { state } = useStore();
  const today = dateKey(now);
  // Re-run at most once a minute of clock time.
  const minute = Math.floor(now.getTime() / 60_000);
  return useMemo(
    () =>
      recommend({
        today,
        nowMs: minute * 60_000,
        profile: state.profile,
        events: state.events,
        logs: state.workoutLogs,
        workouts: allWorkouts(state),
      }),
    [state, today, minute],
  );
}
