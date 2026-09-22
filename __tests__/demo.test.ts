import { buildDemoState } from '../src/data/demo';
import { FOOD_BY_ID } from '../src/data/foods';
import { buildDayPlan } from '../src/engine/forecast';

describe('sample athlete', () => {
  it('builds 14 labelled days without logging anything that has not happened yet', () => {
    const today = '2026-09-22';
    const nowMin = 15 * 60; // 3:00 PM
    const s = buildDemoState(today, nowMin);
    expect(s.demo).toBe(true);
    expect(s.onboarded).toBe(true);
    expect(Object.keys(s.logs)).toHaveLength(14);
    for (const id of s.pantry) expect(FOOD_BY_ID[id]).toBeDefined();

    const plan = buildDayPlan(today, s.events, s.profile);
    for (const id of Object.keys(s.logs[today].windows)) {
      const w = plan.find((x) => x.id === id);
      expect(w && w.endMin <= nowMin).toBe(true);
    }
    for (const log of Object.values(s.logs))
      for (const w of Object.values(log.windows)) for (const f of w.foodIds ?? []) expect(FOOD_BY_ID[f]).toBeDefined();

    // Deterministic: same inputs, same sample data.
    expect(buildDemoState(today, nowMin)).toEqual(s);
  });
});
