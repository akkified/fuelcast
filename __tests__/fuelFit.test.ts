import { FOOD_BY_ID, FOODS } from '../src/data/foods';
import { bestCombos, evaluatePlate, itemFit, plateTotals } from '../src/engine/fuelFit';
import { windowTargets } from '../src/engine/targets';

const f = (...ids: string[]) => ids.map((id) => FOOD_BY_ID[id]);

describe('food library', () => {
  it('has unique ids and sane macros', () => {
    expect(new Set(FOODS.map((x) => x.id)).size).toBe(FOODS.length);
    for (const food of FOODS) {
      for (const v of [food.carbs, food.protein, food.fat, food.fiber]) expect(v).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('itemFit', () => {
  it('rates classic pre-game snacks well and heavy food poorly', () => {
    expect(itemFit(FOOD_BY_ID.banana, 'topOff').level).toBe('great');
    expect(itemFit(FOOD_BY_ID.pretzels, 'topOff').level).toBe('great');
    expect(itemFit(FOOD_BY_ID.fries, 'topOff').level).toBe('avoid');
    expect(itemFit(FOOD_BY_ID.chicken, 'topOff').level).toBe('avoid');
    expect(itemFit(FOOD_BY_ID.pasta, 'topOff').reason).toMatch(/Big portion/);
  });
  it('rewards carbs + protein after training', () => {
    expect(itemFit(FOOD_BY_ID.chocmilk, 'recovery').level).toBe('great');
    expect(itemFit(FOOD_BY_ID.greekyogurt, 'recovery').reason).toMatch(/Add carbs/);
  });
  it('never recommends energy drinks', () => {
    for (const t of ['preMeal', 'topOff', 'during', 'recovery'] as const) {
      expect(itemFit(FOOD_BY_ID.energydrink, t).level).toBe('avoid');
    }
  });
  it('allows only fast carbs mid-session', () => {
    expect(itemFit(FOOD_BY_ID.sportsdrink, 'during').level).toBe('great');
    expect(itemFit(FOOD_BY_ID.pbj, 'during').level).toBe('avoid');
  });
});

describe('evaluatePlate', () => {
  it('totals macros', () => {
    expect(plateTotals(f('banana', 'pretzels'))).toEqual({ carbs: 50, protein: 4.3, fat: 1.4, fiber: 4.1 });
  });
  it('scores an on-target recovery plate at 100', () => {
    const r = evaluatePlate(f('banana', 'turkeysandwich'), windowTargets('recovery'));
    expect(r.score).toBe(100);
    expect(r.notes).toEqual(['Right on target']);
  });
  it('treats a near miss (within 5%) as on target', () => {
    // 56.7 kg athlete: recovery carbs target starts at 28 g; a turkey sandwich has 27 g.
    expect(evaluatePlate(f('turkeysandwich'), windowTargets('recovery', 56.7)).score).toBe(100);
  });
  it('explains what is missing', () => {
    const r = evaluatePlate(f('banana'), windowTargets('recovery'));
    expect(r.score).toBeLessThan(80);
    expect(r.notes.join(' ')).toMatch(/Add ~\d+ g protein/);
  });
  it('penalises fat before training', () => {
    const lean = evaluatePlate(f('pretzels'), windowTargets('topOff')).score;
    const greasy = evaluatePlate(f('chips'), windowTargets('topOff')).score;
    expect(lean).toBeGreaterThan(greasy);
  });
});

describe('bestCombos', () => {
  const pantry = f('banana', 'pretzels', 'chocmilk', 'greekyogurt', 'fries', 'bagel', 'chicken', 'energydrink');

  it('never suggests avoid-level foods', () => {
    for (const type of ['preMeal', 'topOff', 'during', 'recovery'] as const) {
      for (const combo of bestCombos(pantry, type, windowTargets(type))) {
        for (const food of combo.foods) expect(itemFit(food, type).level).not.toBe('avoid');
      }
    }
  });

  it('returns varied, sorted, top-scoring options', () => {
    const combos = bestCombos(pantry, 'recovery', windowTargets('recovery'));
    expect(combos.length).toBe(3);
    for (let i = 1; i < combos.length; i++) {
      const prev = combos[i - 1].foods.map((x) => x.id);
      const cur = combos[i].foods.map((x) => x.id);
      expect(prev.every((id) => cur.includes(id))).toBe(false);
    }
    expect(combos[0].score).toBeGreaterThanOrEqual(90);
    for (let i = 1; i < combos.length; i++) expect(combos[i].score).toBeLessThanOrEqual(combos[i - 1].score);
  });

  it('uses single items mid-session and handles an empty pantry', () => {
    expect(bestCombos(pantry, 'during', windowTargets('during')).every((c) => c.foods.length === 1)).toBe(true);
    expect(bestCombos([], 'topOff', windowTargets('topOff'))).toEqual([]);
  });
});
