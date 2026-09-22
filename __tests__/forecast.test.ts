import { buildDayPlan, eventsOn, nextWindow, windowPhase } from '../src/engine/forecast';
import type { TrainingEvent } from '../src/engine/types';

// 2026-09-21 is a Monday.
const MON = '2026-09-21';
const practice: TrainingEvent = {
  id: 'p',
  title: 'Soccer practice',
  kind: 'practice',
  days: [1, 2, 4],
  startMin: 15 * 60 + 45,
  durationMin: 105,
  intensity: 'hard',
};

describe('eventsOn', () => {
  it('matches recurring weekdays and one-time dates', () => {
    const game: TrainingEvent = { ...practice, id: 'g', days: [], date: '2026-09-23' };
    expect(eventsOn(MON, [practice, game]).map((e) => e.id)).toEqual(['p']);
    expect(eventsOn('2026-09-23', [practice, game]).map((e) => e.id)).toEqual(['g']);
    expect(eventsOn('2026-09-27', [practice, game])).toEqual([]);
  });
});

describe('buildDayPlan', () => {
  it('builds pre-meal, top-off, in-session and recovery windows for an afternoon practice', () => {
    const plan = buildDayPlan(MON, [practice], {});
    expect(plan.map((w) => w.type)).toEqual(['preMeal', 'topOff', 'during', 'recovery']);
    const [pre, top, during, rec] = plan;
    expect([pre.startMin, pre.endMin]).toEqual([11 * 60 + 45, 12 * 60 + 45]);
    expect(pre.tip).toMatch(/school lunch/);
    expect([top.startMin, top.endMin]).toEqual([14 * 60 + 45, 15 * 60 + 15]);
    expect([during.startMin, during.endMin]).toEqual([945, 1050]);
    expect([rec.startMin, rec.endMin]).toEqual([1050, 1110]);
  });

  it('skips in-session fuel for short, easy sessions', () => {
    const plan = buildDayPlan(MON, [{ ...practice, durationMin: 45, intensity: 'light' }], {});
    expect(plan.some((w) => w.type === 'during')).toBe(false);
  });

  it('uses a light breakfast for early sessions and drops the meal for very early ones', () => {
    const eight = buildDayPlan(MON, [{ ...practice, startMin: 8 * 60 }], {});
    expect(eight[0]).toMatchObject({ type: 'preMeal', title: 'Light breakfast', startMin: 360, endMin: 390 });

    const six = buildDayPlan(MON, [{ ...practice, startMin: 6 * 60 }], {});
    expect(six[0]).toMatchObject({ type: 'topOff', startMin: 315, endMin: 345 });
    expect(six.some((w) => w.type === 'preMeal')).toBe(false);
  });

  it('merges a recovery window with the next session’s pre-fuel on double days', () => {
    const lift: TrainingEvent = { id: 'l', title: 'Lift', kind: 'lift', days: [1], startMin: 13 * 60 + 30, durationMin: 45, intensity: 'moderate' };
    const plan = buildDayPlan(MON, [lift, practice], {});
    const liftRecovery = plan.find((w) => w.id === 'l:recovery');
    expect(liftRecovery?.title).toBe('Recover + reload');
    expect(liftRecovery?.reloadForEventId).toBe('p');
    // Practice pre-meal (11:45–12:45) collides with the lift top-off, so the sooner session wins;
    // practice top-off (2:45) collides with lift recovery (2:15–3:15) and is dropped.
    expect(plan.find((w) => w.id === 'p:preMeal')).toBeUndefined();
    expect(plan.find((w) => w.id === 'p:topOff')).toBeUndefined();
    // Nothing starts inside another session.
    for (const w of plan.filter((x) => x.type === 'preMeal' || x.type === 'topOff')) {
      expect(w.startMin < 14 * 60 + 15 && w.endMin > 13 * 60 + 30).toBe(false);
    }
    // Pre-fuel windows never overlap each other.
    const pre = plan.filter((x) => x.type === 'preMeal' || x.type === 'topOff');
    for (const a of pre)
      for (const b of pre) if (a !== b) expect(a.startMin < b.endMin && b.startMin < a.endMin).toBe(false);
    // Plan stays sorted.
    const starts = plan.map((w) => w.startMin);
    expect([...starts].sort((a, b) => a - b)).toEqual(starts);
  });

  it('uses the sweat rate for in-session fluid when available', () => {
    const plan = buildDayPlan(MON, [practice], { sweatRateLph: 1 });
    expect(plan.find((w) => w.type === 'during')?.fluidMl).toBe(800);
  });
});

describe('windowPhase / nextWindow', () => {
  const plan = buildDayPlan(MON, [practice], {});
  it('reports phases', () => {
    expect(windowPhase(plan[0], 600)).toBe('upcoming');
    expect(windowPhase(plan[0], 720)).toBe('now');
    expect(windowPhase(plan[0], 800)).toBe('past');
  });
  it('picks the current window, skipping ones already done', () => {
    expect(nextWindow(plan, 720, () => false)?.type).toBe('preMeal');
    expect(nextWindow(plan, 720, (id) => id === 'p:preMeal')?.type).toBe('topOff');
    expect(nextWindow(plan, 1200, () => false)).toBeUndefined();
  });
});
