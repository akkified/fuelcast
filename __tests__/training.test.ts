import { EXERCISE_BY_ID, EXERCISES } from '../src/data/exercises';
import { estimateMinutes, STARTER_WORKOUTS, workoutEquipment } from '../src/data/workouts';
import {
  atMs,
  canDo,
  availableEquipment,
  dayContext,
  displayWeight,
  generateWorkout,
  lowerBodyShare,
  readiness,
  recommend,
  suggestLoad,
} from '../src/engine/coach';
import type { Profile, TrainingEvent, WorkoutLog } from '../src/engine/types';

const MON = '2026-09-21';
const profile: Pick<Profile, 'goal' | 'level' | 'equipment' | 'sessionMin'> = {
  goal: 'strength',
  level: 'beginner',
  equipment: ['dumbbells'],
  sessionMin: 45,
};

const log = (over: Partial<WorkoutLog> & Pick<WorkoutLog, 'sets'>): WorkoutLog => ({
  id: 'l1',
  workoutId: 'db-full-a',
  name: 'x',
  date: MON,
  startedAt: atMs(MON, 600),
  finishedAt: atMs(MON, 640),
  rpe: 7,
  ...over,
});

describe('library integrity', () => {
  it('every starter workout uses real exercises with sane doses', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
    expect(STARTER_WORKOUTS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(STARTER_WORKOUTS.map((w) => w.id)).size).toBe(STARTER_WORKOUTS.length);
    for (const w of STARTER_WORKOUTS) {
      expect(w.items.length).toBeGreaterThan(0);
      for (const it of w.items) {
        expect(EXERCISE_BY_ID[it.exerciseId]).toBeDefined();
        expect(it.sets).toBeGreaterThanOrEqual(1);
        expect(it.sets).toBeLessThanOrEqual(8);
      }
    }
  });
  it('estimates duration and equipment', () => {
    expect(estimateMinutes([{ exerciseId: 'push-up', sets: 3, reps: 10, restSec: 60 }])).toBe(5);
    expect(workoutEquipment(STARTER_WORKOUTS.find((w) => w.id === 'db-full-a')!)).toEqual(['dumbbells', 'bands', 'bodyweight']);
  });
});

describe('readiness', () => {
  it('is fresh with no history and drops after training, recovering over days', () => {
    const fresh = readiness([], [], MON, atMs(MON, 700));
    expect(Object.values(fresh).every((v) => v === 1)).toBe(true);

    const squats = log({ sets: Array.from({ length: 6 }, () => ({ exerciseId: 'goblet-squat', targetReps: 10, reps: 10, done: true })) });
    const right = readiness([squats], [], MON, atMs(MON, 650));
    expect(right.quads).toBeLessThan(0.5);
    expect(right.chest).toBe(1);
    const later = readiness([squats], [], '2026-09-23', atMs('2026-09-23', 650));
    expect(later.quads).toBeGreaterThan(right.quads);
  });
  it('counts practices as leg load, but only after they end', () => {
    const practice: TrainingEvent = { id: 'p', title: 'P', kind: 'practice', days: [1], startMin: 900, durationMin: 120, intensity: 'hard' };
    expect(readiness([], [practice], MON, atMs(MON, 800)).quads).toBe(1);
    expect(readiness([], [practice], MON, atMs(MON, 1100)).quads).toBeLessThan(0.5);
  });
});

describe('recommend', () => {
  const game: TrainingEvent = { id: 'g', title: 'Game', kind: 'game', days: [], date: '2026-09-22', startMin: 1080, durationMin: 90, intensity: 'hard' };
  const base = { today: MON, nowMs: atMs(MON, 600), profile, events: [] as TrainingEvent[], logs: [] as WorkoutLog[], workouts: STARTER_WORKOUTS };

  it('never picks workouts the athlete lacks equipment for or that are 2 levels up', () => {
    const rec = recommend(base);
    expect(rec.mode).toBe('train');
    expect(rec.picks.length).toBe(3);
    const eq = availableEquipment(profile);
    for (const p of rec.picks) {
      expect(canDo(p.workout, eq)).toBe(true);
      expect(p.workout.level).not.toBe('advanced');
    }
    expect(rec.picks[0].workout.goal).toBe('strength');
  });

  it('keeps it light the day before a game', () => {
    const rec = recommend({ ...base, events: [game] });
    expect(rec.mode).toBe('light');
    for (const p of rec.picks) {
      if (p.workout.goal !== 'mobility') expect(lowerBodyShare(p.workout)).toBeLessThanOrEqual(0.3);
      expect(['conditioning', 'power']).not.toContain(p.workout.goal);
    }
  });

  it('only primes on game day and recovers after', () => {
    const gameDay = recommend({ ...base, today: '2026-09-22', nowMs: atMs('2026-09-22', 600), events: [game] });
    expect(gameDay.mode).toBe('prime');
    expect(gameDay.picks.every((p) => p.workout.goal === 'mobility' && p.workout.durationMin <= 20)).toBe(true);
    const after = recommend({ ...base, today: '2026-09-23', nowMs: atMs('2026-09-23', 600), events: [game] });
    expect(after.mode).toBe('recover');
    expect(after.picks[0].workout.goal).toBe('mobility');
  });

  it('avoids back-to-back strength days and stops after a workout', () => {
    const yesterday = log({ date: '2026-09-20', finishedAt: atMs('2026-09-20', 640), sets: [{ exerciseId: 'goblet-squat', targetReps: 10, reps: 10, done: true }] });
    const ctx = dayContext(MON, [], [yesterday]);
    expect(ctx.strengthYesterday).toBe(true);
    expect(recommend({ ...base, logs: [yesterday] }).mode).toBe('alternate');

    const todayLog = log({ sets: [{ exerciseId: 'plank', targetReps: 30, reps: 30, done: true }] });
    const done = recommend({ ...base, nowMs: atMs(MON, 700), logs: [todayLog] });
    expect(done.mode).toBe('done');
    expect(done.picks.every((p) => p.workout.goal === 'mobility')).toBe(true);
  });
});

describe('generateWorkout', () => {
  it('respects equipment, level and the time budget', () => {
    for (const focus of ['full', 'lower', 'upper', 'power', 'core', 'conditioning', 'mobility'] as const) {
      const w = generateWorkout({ focus, minutes: 30, profile: { level: 'beginner', equipment: ['dumbbells'] }, seed: 3 });
      expect(w.items.length).toBeGreaterThanOrEqual(3);
      expect(new Set(w.items.map((i) => i.exerciseId)).size).toBe(w.items.length);
      for (const it of w.items) {
        const ex = EXERCISE_BY_ID[it.exerciseId];
        expect(['bodyweight', 'dumbbells']).toContain(ex.equipment);
      }
      expect(w.durationMin).toBeLessThanOrEqual(35);
    }
  });
  it('uses barbells only for experienced lifters who have them', () => {
    const w = generateWorkout({ focus: 'lower', minutes: 45, profile: { level: 'intermediate', equipment: ['barbell', 'dumbbells'] } });
    expect(w.items.some((i) => EXERCISE_BY_ID[i.exerciseId].equipment === 'barbell')).toBe(true);
  });
});

describe('suggestLoad', () => {
  const benchLog = (reps: number, rpe: number) =>
    log({ rpe, sets: [1, 2, 3].map(() => ({ exerciseId: 'db-bench', targetReps: 10, reps, weightKg: 20, done: true })) });
  it('progresses about 5% after an all-reps, manageable session', () => {
    const s = suggestLoad('db-bench', [benchLog(10, 7)], 'metric');
    expect(s?.weightKg).toBe(21);
    const lb = suggestLoad('db-bench', [benchLog(10, 7)], 'imperial');
    expect(displayWeight(lb!.weightKg, 'imperial')).toBe('47.5 lb');
  });
  it('holds weight after missed reps or a max-effort day', () => {
    expect(suggestLoad('db-bench', [benchLog(7, 7)], 'metric')?.weightKg).toBe(20);
    expect(suggestLoad('db-bench', [benchLog(10, 9)], 'metric')?.weightKg).toBe(20);
    expect(suggestLoad('goblet-squat', [benchLog(10, 7)], 'metric')).toBeNull();
  });
});
