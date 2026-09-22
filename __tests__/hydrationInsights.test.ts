import { buildDayPlan } from '../src/engine/forecast';
import { bottlesFor, dailyGoalMl, formatFluid, sweatTest } from '../src/engine/hydration';
import { dayScore, energyInsight, isEventFueled, streak, topFoods } from '../src/engine/insights';
import { windowTargets } from '../src/engine/targets';
import { addDays, dateKey, formatClock, formatDuration, weekdayOf } from '../src/engine/time';
import type { DayLog, TrainingEvent } from '../src/engine/types';

describe('sweatTest', () => {
  it('computes sweat rate, loss and replacement', () => {
    // Lost 1 kg in 90 min while drinking 500 mL: 1.5 L sweat / 1.5 h = 1.0 L/h.
    const r = sweatTest({ preKg: 60, postKg: 59, fluidMl: 500, urineMl: 0, minutes: 90 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.sweatRateLph).toBe(1);
    expect(r.lossPct).toBe(1.7);
    expect(r.replaceMl).toEqual({ min: 1250, max: 1500 });
    expect(r.perHourMl).toBe(800);
    expect(r.warning).toBeUndefined();
  });
  it('warns at 2% loss or more', () => {
    const r = sweatTest({ preKg: 50, postKg: 49, fluidMl: 0, urineMl: 0, minutes: 60 });
    expect(r.ok && r.warning).toBeTruthy();
  });
  it('rejects impossible input', () => {
    expect(sweatTest({ preKg: 60, postKg: 50, fluidMl: 0, urineMl: 0, minutes: 60 }).ok).toBe(false);
    expect(sweatTest({ preKg: 60, postKg: 60, fluidMl: 0, urineMl: 0, minutes: 60 }).ok).toBe(false);
    expect(sweatTest({ preKg: NaN, postKg: 60, fluidMl: 0, urineMl: 0, minutes: 60 }).ok).toBe(false);
    expect(sweatTest({ preKg: 60, postKg: 59, fluidMl: 0, urineMl: 0, minutes: 5 }).ok).toBe(false);
  });
});

describe('daily goal', () => {
  const ev: TrainingEvent = { id: 'p', title: 'P', kind: 'practice', days: [1], startMin: 900, durationMin: 120, intensity: 'moderate' };
  it('adds training on top of a 2 L baseline', () => {
    expect(dailyGoalMl({}, [])).toBe(2000);
    expect(dailyGoalMl({}, [ev])).toBe(3000);
    expect(dailyGoalMl({ sweatRateLph: 1.2 }, [ev])).toBe(4400);
  });
  it('formats fluids and bottles', () => {
    expect(bottlesFor(3000, 500)).toBe(6);
    expect(bottlesFor(3001, 500)).toBe(7);
    expect(formatFluid(500, 'imperial')).toBe('17 oz');
    expect(formatFluid(1500, 'metric')).toBe('1.5 L');
  });
});

describe('time helpers', () => {
  it('formats clock times and durations', () => {
    expect(formatClock(0)).toBe('12:00 AM');
    expect(formatClock(945)).toBe('3:45 PM');
    expect(formatClock(720)).toBe('12:00 PM');
    expect(formatDuration(105)).toBe('1 hr 45 min');
    expect(formatDuration(30)).toBe('30 min');
  });
  it('moves across month boundaries', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(weekdayOf('2026-09-21')).toBe(1);
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('insights', () => {
  const ev: TrainingEvent = { id: 'p', title: 'P', kind: 'practice', days: [1], startMin: 945, durationMin: 60, intensity: 'moderate' };
  const plan = buildDayPlan('2026-09-21', [ev], {});
  const log = (done: string[], waterMl: number): DayLog => ({
    windows: Object.fromEntries(done.map((id) => [id, { status: 'done' as const, at: 0, foodIds: ['banana'] }])),
    waterMl,
    energy: {},
  });

  it('scores a day from windows and water', () => {
    expect(plan.length).toBe(3);
    expect(dayScore(plan, undefined, 2000)).toBe(0);
    expect(dayScore(plan, log(['p:preMeal', 'p:topOff', 'p:recovery'], 2000), 2000)).toBe(100);
    expect(dayScore(plan, log(['p:topOff'], 1000), 2000)).toBe(37);
    expect(dayScore([], log([], 1000), 2000)).toBe(50);
  });

  it('knows when a session was fueled', () => {
    expect(isEventFueled('p', plan, log(['p:topOff'], 0))).toBe(true);
    expect(isEventFueled('p', plan, log(['p:recovery'], 0))).toBe(false);
  });

  it('compares energy only with enough data', () => {
    expect(energyInsight([{ fueled: true, energy: 5 }])).toBeNull();
    expect(
      energyInsight([
        { fueled: true, energy: 5 },
        { fueled: true, energy: 4 },
        { fueled: false, energy: 2 },
        { fueled: false, energy: 3 },
      ]),
    ).toEqual({ fueledAvg: 4.5, unfueledAvg: 2.5, fueledCount: 2, unfueledCount: 2 });
  });

  it('counts streaks, allowing today to be in progress', () => {
    const scores: Record<string, number> = { '2026-09-22': 40, '2026-09-21': 80, '2026-09-20': 90, '2026-09-19': 10 };
    expect(streak('2026-09-22', (k) => scores[k] ?? 0)).toBe(2);
    scores['2026-09-22'] = 75;
    expect(streak('2026-09-22', (k) => scores[k] ?? 0)).toBe(3);
  });

  it('ranks most-used foods', () => {
    expect(topFoods([log(['a', 'b'], 0)])).toEqual([{ id: 'banana', count: 2 }]);
  });

  it('uses weight-scaled targets when weight is known', () => {
    expect(windowTargets('recovery', 60).protein).toEqual({ min: 15, max: 25 });
    expect(windowTargets('preMeal', 60).carbs).toEqual({ min: 60, max: 120 });
  });
});
