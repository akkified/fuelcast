// Smart Coach: on-device training recommendations.
//
// 1. Muscle readiness: every logged set (and every practice/game) adds fatigue
//    to the muscles it works; fatigue halves every 24 h.
// 2. Day context: game today/tomorrow/yesterday, strength yesterday, strength
//    days this week (youth guidance: 2–3 non-consecutive strength days).
// 3. Each workout is scored on readiness, goal, level, time, variety and the
//    day's context, and the top picks come back with plain-English reasons.
//
// Sources: Faigenbaum et al. 2009 (NSCA youth resistance training position
// statement); Stricker et al. 2020 (AAP clinical report on resistance training).

import { EXERCISE_BY_ID, type Equipment, type Muscle } from '../data/exercises';
import { estimateMinutes, workoutEquipment, type Goal, type Level, type Workout, type WorkoutItem } from '../data/workouts';
import { eventsOn } from './forecast';
import { addDays, parseDateKey } from './time';
import type { Intensity, Profile, TrainingEvent, Units, WorkoutLog } from './types';

export const MUSCLES: Muscle[] = ['chest', 'back', 'shoulders', 'arms', 'core', 'quads', 'hamstrings', 'glutes', 'calves', 'cardio'];
const LOWER: Muscle[] = ['quads', 'hamstrings', 'glutes', 'calves'];
const HALF_LIFE_H = 24;
/** Hard sets in the last day or so that leave a muscle fully fatigued. */
const FULL_FATIGUE = 10;
const HOUR = 3_600_000;

export type Readiness = Record<Muscle, number>;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const round2 = (n: number) => Math.round(n * 100) / 100;

export function atMs(date: string, minutes: number): number {
  return parseDateKey(date).getTime() + minutes * 60_000;
}

/** Leg "set equivalents" per hour of practice or game. */
const EVENT_SETS: Record<Intensity, number> = { light: 1.5, moderate: 2, hard: 3 };

/** 0 = cooked, 1 = fresh. */
export function readiness(logs: WorkoutLog[], events: TrainingEvent[], today: string, nowMs: number): Readiness {
  const load = Object.fromEntries(MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>;
  const decay = (endMs: number) => {
    const h = (nowMs - endMs) / HOUR;
    return h < 0 || h > 120 ? 0 : Math.pow(0.5, h / HALF_LIFE_H);
  };

  for (const log of logs) {
    const d = decay(log.finishedAt);
    if (!d) continue;
    const effort = (log.rpe ?? 7) / 7;
    for (const s of log.sets) {
      if (!s.done) continue;
      const ex = EXERCISE_BY_ID[s.exerciseId];
      if (!ex) continue;
      for (const m of ex.muscles) load[m] += effort * d;
      for (const m of ex.secondary ?? []) load[m] += 0.5 * effort * d;
    }
  }

  // Practices and games load the legs and the engine too.
  for (let back = 0; back <= 4; back++) {
    const date = addDays(today, -back);
    for (const e of eventsOn(date, events)) {
      if (e.kind !== 'practice' && e.kind !== 'game') continue;
      const d = decay(atMs(date, e.startMin + e.durationMin));
      if (!d) continue;
      const sets = (e.durationMin / 60) * EVENT_SETS[e.intensity] * d;
      for (const m of [...LOWER, 'cardio'] as Muscle[]) load[m] += sets;
    }
  }

  return Object.fromEntries(MUSCLES.map((m) => [m, round2(clamp01(1 - load[m] / FULL_FATIGUE))])) as Readiness;
}

function primaryVolume(items: WorkoutItem[]): Map<Muscle, number> {
  const vol = new Map<Muscle, number>();
  for (const it of items) {
    const ex = EXERCISE_BY_ID[it.exerciseId];
    if (!ex) continue;
    for (const m of ex.muscles) vol.set(m, (vol.get(m) ?? 0) + it.sets);
  }
  return vol;
}

/** Readiness of the muscles a workout hits, weighted by sets. */
export function workoutReadiness(w: Pick<Workout, 'items'>, r: Readiness): number {
  const vol = primaryVolume(w.items);
  let total = 0;
  let sum = 0;
  for (const [m, sets] of vol) {
    total += sets;
    sum += sets * r[m];
  }
  return total ? round2(sum / total) : 1;
}

export function lowerBodyShare(w: Pick<Workout, 'items'>): number {
  const vol = primaryVolume(w.items);
  let total = 0;
  let lower = 0;
  for (const [m, sets] of vol) {
    total += sets;
    if (LOWER.includes(m)) lower += sets;
  }
  return total ? lower / total : 0;
}

const isStrengthLog = (log: WorkoutLog) => {
  const types = log.sets.filter((s) => s.done).map((s) => EXERCISE_BY_ID[s.exerciseId]?.type);
  const heavy = types.filter((t) => t === 'strength' || t === 'power').length;
  return types.length > 0 && heavy / types.length >= 0.5;
};

export interface DayContext {
  gameToday: boolean;
  gameTomorrow: boolean;
  gameYesterday: boolean;
  workoutDoneToday: boolean;
  strengthYesterday: boolean;
  strengthDays7: number;
}

export function dayContext(today: string, events: TrainingEvent[], logs: WorkoutLog[]): DayContext {
  const hasGame = (d: string) => eventsOn(d, events).some((e) => e.kind === 'game');
  const strengthDates = new Set(logs.filter(isStrengthLog).map((l) => l.date));
  let strengthDays7 = 0;
  for (let back = 0; back < 7; back++) if (strengthDates.has(addDays(today, -back))) strengthDays7++;
  return {
    gameToday: hasGame(today),
    gameTomorrow: hasGame(addDays(today, 1)),
    gameYesterday: hasGame(addDays(today, -1)),
    workoutDoneToday: logs.some((l) => l.date === today),
    strengthYesterday: strengthDates.has(addDays(today, -1)),
    strengthDays7,
  };
}

export type CoachMode = 'done' | 'prime' | 'light' | 'recover' | 'alternate' | 'train';

export interface CoachPick {
  workout: Workout;
  score: number;
  why: string[];
}

export interface Recommendation {
  mode: CoachMode;
  headline: string;
  reasons: string[];
  picks: CoachPick[];
  readiness: Readiness;
}

const LEVEL_RANK: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 };
const GOAL_NAME: Record<Goal, string> = {
  strength: 'strength',
  power: 'speed & power',
  conditioning: 'conditioning',
  mobility: 'mobility',
  core: 'core',
  general: 'total-body',
};

export function availableEquipment(profile: Pick<Profile, 'equipment'>): Set<Equipment> {
  return new Set<Equipment>(['bodyweight', ...profile.equipment]);
}

export function canDo(w: Pick<Workout, 'items'>, equipment: Set<Equipment>): boolean {
  return workoutEquipment(w).every((e) => equipment.has(e));
}

const LEG_NAMES = (r: Readiness) =>
  LOWER.filter((m) => r[m] < 0.5).length >= 2 ? 'legs' : undefined;

export function recommend(input: {
  today: string;
  nowMs: number;
  profile: Pick<Profile, 'goal' | 'level' | 'equipment' | 'sessionMin'>;
  events: TrainingEvent[];
  logs: WorkoutLog[];
  workouts: Workout[];
}): Recommendation {
  const { today, nowMs, profile, events, logs, workouts } = input;
  const r = readiness(logs, events, today, nowMs);
  const ctx = dayContext(today, events, logs);
  const legsAvg = LOWER.reduce((s, m) => s + r[m], 0) / LOWER.length;

  let mode: CoachMode = 'train';
  let headline = 'Good day to train';
  const reasons: string[] = [];
  if (ctx.workoutDoneToday) {
    mode = 'done';
    headline = 'Workout done. Now recover';
    reasons.push('You already trained today. Refuel, hydrate and sleep: that’s when you get stronger.');
  } else if (ctx.gameToday) {
    mode = 'prime';
    headline = 'Game day: stay fresh';
    reasons.push('Save your legs for the game. A short primer wakes you up without tiring you out.');
  } else if (ctx.gameTomorrow) {
    mode = 'light';
    headline = 'Game tomorrow: keep it light';
    reasons.push('Skip hard leg work and conditioning the day before a game.');
  } else if (ctx.gameYesterday) {
    mode = 'recover';
    headline = 'Day after the game: recover';
    reasons.push('Light movement and mobility speed up recovery more than sitting still.');
  } else if (legsAvg < 0.35) {
    mode = 'recover';
    headline = 'Your legs need a break';
    reasons.push('Recent practices and lifts have your legs worn down. Recovery work today pays off tomorrow.');
  } else if (ctx.strengthYesterday || ctx.strengthDays7 >= 3) {
    mode = 'alternate';
    headline = ctx.strengthDays7 >= 3 ? 'Strength quota met this week' : 'Alternate today';
    reasons.push(
      ctx.strengthDays7 >= 3
        ? `You’ve done ${ctx.strengthDays7} strength days this week. Youth guidelines recommend 2–3.`
        : 'Strength days work best with a rest day in between. Try conditioning, core or mobility.',
    );
  } else {
    reasons.push(`Your muscles are recovered and your ${GOAL_NAME[profile.goal]} goal is up next.`);
  }

  const equipment = availableEquipment(profile);
  const lastDone = new Map<string, number>();
  for (const l of logs) {
    const days = Math.round((parseDateKey(today).getTime() - parseDateKey(l.date).getTime()) / 86_400_000);
    if (days >= 0 && (!lastDone.has(l.workoutId) || days < lastDone.get(l.workoutId)!)) lastDone.set(l.workoutId, days);
  }

  const picks: CoachPick[] = [];
  for (const w of workouts) {
    if (!canDo(w, equipment)) continue;
    const levelGap = LEVEL_RANK[w.level] - LEVEL_RANK[profile.level];
    if (levelGap >= 2) continue;

    const why: string[] = [];
    const ready = workoutReadiness(w, r);
    let score = 40 + 40 * ready;
    if (w.goal === 'mobility') {
      if (ready < 0.6) why.push('Helps tired muscles recover');
    } else if (ready >= 0.8) why.push('Targets fresh muscles');
    else if (ready < 0.5) why.push('Hits muscles that are still recovering');

    if (w.goal === profile.goal) {
      score += 15;
      why.push(`Matches your ${GOAL_NAME[profile.goal]} goal`);
    }
    if (levelGap === 1) score -= 30;
    if (w.durationMin <= profile.sessionMin) score += 5;
    else score -= Math.min(20, w.durationMin - profile.sessionMin);

    const d = lastDone.get(w.id);
    if (d !== undefined && d <= 1) score -= 30;
    else if (d !== undefined && d <= 3) score -= 10;

    const lower = lowerBodyShare(w);
    switch (mode) {
      case 'done':
        score += w.goal === 'mobility' ? 40 : -100;
        break;
      case 'prime':
        if (w.goal === 'mobility' && w.durationMin <= 20) {
          score += 40;
          why.unshift('Short and light for game day');
        } else score -= 100;
        break;
      case 'light':
        if (w.goal === 'mobility') score += 25;
        if (w.goal === 'core') score += 20;
        // Mobility work is fine for the legs; loaded leg work isn't.
        if (lower > 0.3 && w.goal !== 'mobility') score -= 60;
        if (w.goal === 'conditioning' || w.goal === 'power') score -= 50;
        if ((lower <= 0.3 || w.goal === 'mobility') && w.goal !== 'conditioning' && w.goal !== 'power')
          why.unshift('Won’t tire your legs before the game');
        break;
      case 'recover':
        if (w.goal === 'mobility') {
          score += 40;
          why.unshift('Speeds up recovery');
        } else if (w.goal === 'core') score += 5;
        else score -= 30;
        break;
      case 'alternate':
        if (w.goal === 'strength') score -= 25;
        if (w.goal === 'conditioning' || w.goal === 'core') {
          score += 10;
          why.unshift('A good change of pace from strength');
        }
        if (w.goal === 'mobility') score += 5;
        break;
      case 'train':
        break;
    }
    if (score > 0) picks.push({ workout: w, score: Math.round(score), why: why.slice(0, 2) });
  }

  picks.sort((a, b) => b.score - a.score || a.workout.name.localeCompare(b.workout.name));
  const legs = LEG_NAMES(r);
  if (legs && mode === 'train') reasons.push('Your legs are a little tired from recent sessions, so upper-body and core picks rank higher.');
  return { mode, headline, reasons, picks: picks.slice(0, 3), readiness: r };
}

// ---------- Workout generator ----------

export type Focus = 'full' | 'lower' | 'upper' | 'power' | 'core' | 'conditioning' | 'mobility';

export const FOCUS_LABEL: Record<Focus, string> = {
  full: 'Total Body',
  lower: 'Lower Body',
  upper: 'Upper Body',
  power: 'Speed & Power',
  core: 'Core',
  conditioning: 'Conditioning',
  mobility: 'Mobility',
};

const FOCUS_GOAL: Record<Focus, Goal> = {
  full: 'general',
  lower: 'strength',
  upper: 'strength',
  power: 'power',
  core: 'core',
  conditioning: 'conditioning',
  mobility: 'mobility',
};

const SLOTS: Record<string, string[]> = {
  squat: ['back-squat', 'goblet-squat', 'leg-press', 'split-squat', 'bw-squat'],
  hinge: ['trap-deadlift', 'db-rdl', 'kb-swing', 'hip-thrust', 'glute-bridge'],
  single: ['walking-lunge', 'step-up', 'single-leg-rdl', 'split-squat'],
  calves: ['calf-raise'],
  push: ['bench-press', 'db-bench', 'push-up', 'band-press'],
  push2: ['db-ohp', 'landmine-press', 'dips', 'push-up'],
  pull: ['barbell-row', 'db-row', 'pull-up', 'lat-pulldown', 'inverted-row'],
  pull2: ['inverted-row', 'face-pull', 'band-pull-apart', 'lat-pulldown', 'pull-up'],
  arms: ['db-curl', 'dips'],
  core: ['dead-bug', 'pallof', 'side-plank', 'bird-dog', 'plank', 'hollow-hold'],
  jump: ['box-jump', 'broad-jump', 'squat-jump', 'skater-bound'],
  sprint: ['sprint', 'skater-bound', 'pogo-hop'],
  cond: ['shuttle-run', 'burpee', 'jump-rope', 'mountain-climber', 'bike-intervals', 'tempo-run'],
  mob: ['worlds-greatest', 'hip-9090', 'cat-cow', 'couch-stretch', 'thoracic-openers', 'ankle-rocks', 'foam-roll'],
};

const FOCUS_SLOTS: Record<Focus, string[]> = {
  full: ['squat', 'push', 'hinge', 'pull', 'core', 'single'],
  lower: ['squat', 'hinge', 'single', 'calves', 'core'],
  upper: ['push', 'pull', 'push2', 'pull2', 'arms', 'core'],
  power: ['jump', 'sprint', 'squat', 'hinge', 'core'],
  core: ['core', 'core', 'core', 'core', 'core'],
  conditioning: ['cond', 'cond', 'cond', 'cond', 'core'],
  mobility: ['mob', 'mob', 'mob', 'mob', 'mob', 'mob'],
};

function dose(level: Level, type: string, timed: boolean): { sets: number; reps: number; restSec: number } {
  const lv = LEVEL_RANK[level];
  if (type === 'mobility') return { sets: 1, reps: timed ? 60 : 8, restSec: 0 };
  if (timed) return { sets: 2 + (lv > 0 ? 1 : 0), reps: [30, 40, 45][lv], restSec: 30 };
  if (type === 'power') return { sets: 3, reps: [5, 5, 4][lv], restSec: 90 };
  if (type === 'core') return { sets: 2 + (lv > 0 ? 1 : 0), reps: [8, 10, 12][lv], restSec: 30 };
  if (type === 'conditioning') return { sets: 3 + lv, reps: [8, 10, 12][lv], restSec: 45 };
  return { sets: [2, 3, 3][lv], reps: [12, 10, 8][lv], restSec: [75, 90, 120][lv] };
}

/**
 * Build a workout for a focus and time budget from the exercises the athlete
 * can do with their equipment and level, favoring the freshest muscles.
 * `seed` rotates between equally good choices so repeat requests vary.
 */
export function generateWorkout(opts: {
  focus: Focus;
  minutes: number;
  profile: Pick<Profile, 'level' | 'equipment'>;
  readiness?: Readiness;
  seed?: number;
}): Workout {
  const { focus, minutes, profile } = opts;
  const r = opts.readiness;
  const seed = Math.abs(Math.floor(opts.seed ?? 0));
  const equipment = availableEquipment(profile);
  const used = new Set<string>();
  const items: WorkoutItem[] = [];

  FOCUS_SLOTS[focus].forEach((slot, idx) => {
    const candidates = SLOTS[slot].filter((id) => {
      const ex = EXERCISE_BY_ID[id];
      if (!ex || used.has(id) || !equipment.has(ex.equipment)) return false;
      if (ex.equipment === 'barbell' && profile.level === 'beginner') return false;
      return true;
    });
    if (candidates.length === 0) return;
    const ranked = r
      ? [...candidates].sort((a, b) => {
          const ra = Math.min(...EXERCISE_BY_ID[a].muscles.map((m) => r[m]));
          const rb = Math.min(...EXERCISE_BY_ID[b].muscles.map((m) => r[m]));
          return rb - ra > 0.15 ? 1 : ra - rb > 0.15 ? -1 : 0;
        })
      : candidates;
    const top = ranked.slice(0, Math.min(2, ranked.length));
    const id = top[(seed + idx) % top.length];
    used.add(id);
    const ex = EXERCISE_BY_ID[id];
    items.push({ exerciseId: id, ...dose(profile.level, ex.type, !!ex.timed) });
  });

  // Fit the time budget: trim sets from the end, then drop exercises (keep 3).
  while (estimateMinutes(items) > minutes) {
    const reducible = [...items].reverse().find((it) => it.sets > 1);
    if (reducible) reducible.sets--;
    else if (items.length > 3) items.pop();
    else break;
  }
  // Add sets back to the main lifts if there's lots of time left.
  for (let k = 0; k < items.length * 2 && minutes - estimateMinutes(items) >= 8; k++) {
    const it = items[k % items.length];
    if (it.sets < 4) it.sets++;
  }

  return {
    id: '',
    name: `Smart ${FOCUS_LABEL[focus]}`,
    emoji: '✨',
    goal: FOCUS_GOAL[focus],
    level: profile.level,
    durationMin: estimateMinutes(items),
    description: `Built by Smart Coach for your equipment and level${r ? ', favoring your freshest muscles' : ''}.`,
    items,
    custom: true,
    source: 'smart',
  };
}

// ---------- Progression ----------

export interface LoadSuggestion {
  weightKg: number;
  note: string;
}

/** Suggest today's weight for an exercise from the last time it was done with weight. */
export function suggestLoad(exerciseId: string, logs: WorkoutLog[], units: Units): LoadSuggestion | null {
  const last = [...logs]
    .sort((a, b) => b.finishedAt - a.finishedAt)
    .find((l) => l.sets.some((s) => s.exerciseId === exerciseId && s.done && (s.weightKg ?? 0) > 0));
  if (!last) return null;
  const sets = last.sets.filter((s) => s.exerciseId === exerciseId);
  const lastWeight = Math.max(...sets.map((s) => s.weightKg ?? 0));
  const allHit = sets.every((s) => s.done && s.reps >= s.targetReps);
  const rpe = last.rpe ?? 7;
  const inc = units === 'imperial' ? 2.5 / 2.20462 : 1;

  if (allHit && rpe <= 8) {
    let next = Math.ceil((lastWeight * 1.05) / inc - 1e-9) * inc;
    if (next <= lastWeight + 1e-9) next = lastWeight + inc;
    return { weightKg: next, note: 'You hit every rep last time. Time to add a little weight.' };
  }
  return {
    weightKg: lastWeight,
    note: allHit ? 'Last session was tough. Repeat this weight and own it.' : 'Repeat this weight until every rep is solid.',
  };
}

/** Round a weight for display in the athlete's units. */
export function displayWeight(kg: number, units: Units): string {
  return units === 'imperial' ? `${Math.round(kg * 2.20462 * 2) / 2} lb` : `${Math.round(kg * 2) / 2} kg`;
}
