// Starter workouts. Built around youth resistance-training guidance (NSCA 2009;
// AAP 2020): technique first, 1–3 sets of 6–15 reps, 2–3 strength days a week
// on non-consecutive days, and a proper warm-up.

import type { Equipment } from './exercises';
import { EXERCISE_BY_ID } from './exercises';

export type Goal = 'strength' | 'power' | 'conditioning' | 'mobility' | 'core' | 'general';
export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface WorkoutItem {
  exerciseId: string;
  sets: number;
  /** Reps, or seconds for timed exercises. */
  reps: number;
  restSec: number;
  note?: string;
}

export interface Workout {
  id: string;
  name: string;
  emoji: string;
  goal: Goal;
  level: Level;
  durationMin: number;
  description: string;
  items: WorkoutItem[];
  custom?: boolean;
  /** Set when the AI coach designed it. */
  source?: 'coach' | 'smart';
}

export const GOAL_LABEL: Record<Goal, string> = {
  strength: 'Strength',
  power: 'Speed & power',
  conditioning: 'Conditioning',
  mobility: 'Mobility & recovery',
  core: 'Core',
  general: 'Total body',
};

export const LEVEL_LABEL: Record<Level, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

const i = (exerciseId: string, sets: number, reps: number, restSec: number, note?: string): WorkoutItem => ({
  exerciseId,
  sets,
  reps,
  restSec,
  ...(note ? { note } : {}),
});

export const STARTER_WORKOUTS: Workout[] = [
  {
    id: 'first-lift', name: 'First Lift', emoji: '🌱', goal: 'general', level: 'beginner', durationMin: 30,
    description: 'Learn the basic movement patterns with bodyweight: squat, hinge, push, pull, brace.',
    items: [i('bw-squat', 2, 12, 60), i('glute-bridge', 2, 12, 60), i('push-up', 2, 8, 60, 'Hands on a bench if needed'), i('inverted-row', 2, 8, 60), i('dead-bug', 2, 8, 45), i('plank', 2, 30, 45)],
  },
  {
    id: 'dorm-room', name: 'No-Gym Total Body', emoji: '🏠', goal: 'general', level: 'beginner', durationMin: 25,
    description: 'Zero equipment, small space. Great for home or a hotel before a tournament.',
    items: [i('split-squat', 3, 10, 45, 'Each leg'), i('push-up', 3, 10, 45), i('hip-thrust', 3, 12, 45), i('bird-dog', 2, 8, 30, 'Each side'), i('side-plank', 2, 25, 30), i('mountain-climber', 3, 30, 30)],
  },
  {
    id: 'db-full-a', name: 'Dumbbell Total Body A', emoji: '💪', goal: 'strength', level: 'beginner', durationMin: 40,
    description: 'The classic starter strength day with just a pair of dumbbells.',
    items: [i('goblet-squat', 3, 10, 90), i('db-bench', 3, 10, 90), i('db-rdl', 3, 10, 90), i('db-row', 3, 10, 60, 'Each arm'), i('pallof', 2, 10, 45, 'Each side'), i('calf-raise', 2, 15, 45)],
  },
  {
    id: 'db-full-b', name: 'Dumbbell Total Body B', emoji: '💪', goal: 'strength', level: 'beginner', durationMin: 40,
    description: 'Pair with Total Body A on alternating days for a balanced week.',
    items: [i('step-up', 3, 8, 90, 'Each leg'), i('db-ohp', 3, 10, 90), i('single-leg-rdl', 3, 8, 60, 'Each leg'), i('inverted-row', 3, 10, 60), i('dead-bug', 3, 8, 45), i('glute-bridge', 2, 15, 45)],
  },
  {
    id: 'bb-lower', name: 'Barbell Lower Strength', emoji: '🏋️', goal: 'strength', level: 'intermediate', durationMin: 50,
    description: 'Heavy-ish lower-body day for athletes who already own their squat and hinge.',
    items: [i('back-squat', 3, 6, 150), i('trap-deadlift', 3, 5, 150), i('walking-lunge', 2, 10, 90, 'Each leg'), i('nordic', 2, 5, 90), i('side-plank', 2, 30, 45)],
  },
  {
    id: 'bb-upper', name: 'Barbell Upper Strength', emoji: '🏋️', goal: 'strength', level: 'intermediate', durationMin: 50,
    description: 'Balanced push/pull so shoulders stay healthy through the season.',
    items: [i('bench-press', 3, 6, 150, 'With a spotter'), i('barbell-row', 3, 8, 120), i('landmine-press', 3, 8, 90, 'Each arm'), i('pull-up', 3, 6, 90), i('face-pull', 2, 15, 45), i('db-curl', 2, 10, 45)],
  },
  {
    id: 'machine-circuit', name: 'Machine Circuit', emoji: '⚙️', goal: 'strength', level: 'beginner', durationMin: 35,
    description: 'Guided machines make a safe first trip to the school weight room.',
    items: [i('leg-press', 3, 12, 75), i('lat-pulldown', 3, 12, 75), i('ham-curl', 3, 12, 60), i('db-bench', 3, 10, 75), i('plank', 2, 30, 45)],
  },
  {
    id: 'speed-day', name: 'Speed & Acceleration', emoji: '⚡', goal: 'power', level: 'intermediate', durationMin: 35,
    description: 'Short, fast, fully recovered reps. Do it fresh, never after a hard practice.',
    items: [i('pogo-hop', 2, 20, 60), i('broad-jump', 3, 4, 90), i('sprint', 5, 1, 90, 'Walk back recovery'), i('skater-bound', 3, 6, 60, 'Each side'), i('hollow-hold', 2, 25, 45)],
  },
  {
    id: 'jump-power', name: 'Jump Power', emoji: '🦘', goal: 'power', level: 'intermediate', durationMin: 35,
    description: 'Vertical power for basketball and volleyball, with strength to back it up.',
    items: [i('box-jump', 4, 4, 90), i('squat-jump', 3, 5, 90), i('goblet-squat', 3, 8, 90), i('single-leg-rdl', 3, 8, 60, 'Each leg'), i('calf-raise', 3, 12, 45)],
  },
  {
    id: 'kb-power', name: 'Kettlebell Power', emoji: '🔔', goal: 'power', level: 'intermediate', durationMin: 30,
    description: 'Hip power and grip with one kettlebell.',
    items: [i('kb-swing', 4, 12, 75), i('goblet-squat', 3, 10, 75), i('push-up', 3, 10, 60), i('side-plank', 2, 30, 30)],
  },
  {
    id: 'field-conditioning', name: 'Field Conditioning', emoji: '🏃', goal: 'conditioning', level: 'intermediate', durationMin: 30,
    description: 'Repeat-sprint fitness for soccer, lacrosse and football.',
    items: [i('jump-rope', 2, 60, 30, 'Warm-up'), i('shuttle-run', 6, 1, 60), i('burpee', 3, 8, 60), i('tempo-run', 4, 60, 60), i('mountain-climber', 2, 30, 30)],
  },
  {
    id: 'bike-hiit', name: 'Bike Intervals', emoji: '🚴', goal: 'conditioning', level: 'beginner', durationMin: 25,
    description: 'Low-impact conditioning that spares your legs from pounding.',
    items: [i('bike-intervals', 8, 30, 60, '30 s hard / 60 s easy'), i('dead-bug', 2, 10, 30), i('foam-roll', 1, 180, 0)],
  },
  {
    id: 'rope-and-core', name: 'Rope + Core Finisher', emoji: '🪢', goal: 'conditioning', level: 'beginner', durationMin: 15,
    description: 'A quick add-on after a light practice.',
    items: [i('jump-rope', 4, 45, 30), i('plank', 2, 40, 30), i('side-plank', 2, 25, 30), i('mountain-climber', 2, 30, 30)],
  },
  {
    id: 'core-stability', name: 'Core Stability', emoji: '🧱', goal: 'core', level: 'beginner', durationMin: 20,
    description: 'Anti-rotation and bracing. The core that actually protects your back.',
    items: [i('dead-bug', 3, 10, 30), i('bird-dog', 3, 8, 30, 'Each side'), i('pallof', 3, 10, 30, 'Each side'), i('side-plank', 2, 30, 30), i('hollow-hold', 2, 25, 30)],
  },
  {
    id: 'pre-game-primer', name: 'Game-Day Primer', emoji: '🎯', goal: 'mobility', level: 'beginner', durationMin: 15,
    description: 'Wake up the body without tiring it. Morning of a game, or before warm-ups.',
    items: [i('worlds-greatest', 1, 5, 0, 'Each side'), i('hip-9090', 1, 8, 0), i('glute-bridge', 2, 10, 30), i('pogo-hop', 2, 15, 45), i('broad-jump', 2, 2, 60, 'Easy, crisp reps')],
  },
  {
    id: 'recovery-flow', name: 'Recovery Flow', emoji: '🧘', goal: 'mobility', level: 'beginner', durationMin: 20,
    description: 'The day after a game: move, breathe, restore range of motion.',
    items: [i('foam-roll', 1, 300, 0), i('cat-cow', 2, 8, 0), i('thoracic-openers', 2, 8, 0, 'Each side'), i('couch-stretch', 2, 45, 0, 'Each side'), i('hip-9090', 2, 8, 0), i('ankle-rocks', 2, 10, 0, 'Each side')],
  },
  {
    id: 'injury-proof', name: 'Injury-Proofing', emoji: '🛡️', goal: 'general', level: 'beginner', durationMin: 25,
    description: 'Hamstrings, hips and shoulders: the areas that get hurt most in field and court sports.',
    items: [i('nordic', 2, 5, 90), i('single-leg-rdl', 2, 8, 60, 'Each leg'), i('split-squat', 2, 8, 60, 'Each leg'), i('band-pull-apart', 2, 15, 30), i('face-pull', 2, 15, 30), i('side-plank', 2, 30, 30)],
  },
  {
    id: 'swimmer-dryland', name: 'Swimmer Dryland', emoji: '🏊', goal: 'general', level: 'intermediate', durationMin: 35,
    description: 'Shoulder-friendly pulling strength plus core for the pool.',
    items: [i('pull-up', 3, 6, 90), i('band-pull-apart', 3, 15, 30), i('db-row', 3, 10, 60, 'Each arm'), i('hollow-hold', 3, 30, 30), i('squat-jump', 3, 5, 60), i('thoracic-openers', 2, 8, 0)],
  },
  {
    id: 'runner-strength', name: 'Runner Strength', emoji: '👟', goal: 'strength', level: 'beginner', durationMin: 30,
    description: 'Single-leg strength and calves for cross-country and track.',
    items: [i('step-up', 3, 8, 60, 'Each leg'), i('single-leg-rdl', 3, 8, 60, 'Each leg'), i('calf-raise', 3, 15, 45), i('glute-bridge', 3, 12, 45), i('side-plank', 2, 30, 30)],
  },
  {
    id: 'upper-push-pull', name: 'Dumbbell Upper Body', emoji: '🔁', goal: 'strength', level: 'intermediate', durationMin: 35,
    description: 'Upper-body day that pairs well with a lower-body practice.',
    items: [i('db-bench', 3, 8, 90), i('db-row', 3, 10, 60, 'Each arm'), i('db-ohp', 3, 8, 90), i('inverted-row', 3, 10, 60), i('db-curl', 2, 12, 45), i('dips', 2, 10, 45)],
  },
];

/** Estimate how long a list of items takes: work time + rest + about 40 s per set to set up. */
export function estimateMinutes(items: WorkoutItem[]): number {
  let sec = 0;
  for (const it of items) {
    const ex = EXERCISE_BY_ID[it.exerciseId];
    const work = ex?.timed ? it.reps : it.reps * 3;
    sec += it.sets * (work + 20) + Math.max(0, it.sets - 1) * it.restSec;
  }
  return Math.max(5, Math.round(sec / 60 / 5) * 5);
}

export function workoutEquipment(w: Pick<Workout, 'items'>): Equipment[] {
  return [...new Set(w.items.map((it) => EXERCISE_BY_ID[it.exerciseId]?.equipment).filter((e): e is Equipment => !!e))];
}
