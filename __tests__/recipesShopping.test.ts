import { FOOD_BY_ID } from '../src/data/foods';
import { RECIPE_BY_ID, RECIPES } from '../src/data/recipes';
import { bestCombos, itemFit } from '../src/engine/fuelFit';
import { buildDayPlan } from '../src/engine/forecast';
import { bestWindows, ingredientAmount, matchRecipe, rankRecipes, recipeFit, recipeMacros } from '../src/engine/recipes';
import { matchFood, mergeShopping, recipeShopping, weekSuggestions, type ShoppingItem } from '../src/engine/shopping';
import { windowTargets } from '../src/engine/targets';
import type { TrainingEvent } from '../src/engine/types';

describe('recipes', () => {
  it('only use foods from the library', () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(20);
    for (const r of RECIPES) for (const i of r.ingredients) expect(FOOD_BY_ID[i.foodId]).toBeDefined();
  });

  it('compute macros from ingredients', () => {
    // Smoothie: banana + berries + Greek yogurt + milk (honey optional).
    expect(recipeMacros(RECIPE_BY_ID['recovery-smoothie'])).toEqual({ carbs: 58, protein: 27, fat: 4, fiber: 6 });
  });

  it('know what they are good for', () => {
    expect(bestWindows(RECIPE_BY_ID['recovery-smoothie'])).toContain('recovery');
    expect(bestWindows(RECIPE_BY_ID['rice-cakes-jam'])).toEqual(['topOff']);
    expect(bestWindows(RECIPE_BY_ID['yogurt-parfait'])).not.toContain('topOff');
    expect(recipeFit(RECIPE_BY_ID['turkey-tacos'], 'topOff')).toBeLessThan(60);
  });

  it('match against the kitchen, ignoring optional ingredients', () => {
    const m = matchRecipe(RECIPE_BY_ID['recovery-smoothie'], new Set(['banana', 'berries', 'greekyogurt', 'milk']));
    expect(m.status).toBe('ready');
    const almost = matchRecipe(RECIPE_BY_ID['recovery-smoothie'], new Set(['banana', 'berries']));
    expect(almost).toMatchObject({ status: 'almost', missing: ['greekyogurt', 'milk'] });
  });

  it('rank ready recipes first, then by fit for the window', () => {
    const ranked = rankRecipes(RECIPES, ['ricecakes', 'jam', 'banana', 'berries', 'greekyogurt', 'milk'], 'topOff');
    expect(ranked[0].status).toBe('ready');
    expect(ranked[0].recipe.id).toBe('rice-cakes-jam');
    const statuses = ranked.map((r) => r.status);
    expect(statuses.indexOf('shop')).toBeGreaterThan(statuses.lastIndexOf('ready'));
  });

  it('scales ingredient amounts readably', () => {
    expect(ingredientAmount(0.5, '1 cup')).toBe('½ cup');
    expect(ingredientAmount(1.5, '1 cup cooked')).toBe('1½ cups cooked');
    expect(ingredientAmount(2, '1 tbsp')).toBe('2 tbsp');
    expect(ingredientAmount(0.5, '¼ cup')).toBe('⅛ cup');
    expect(ingredientAmount(1, 'pinch')).toBe('pinch');
    expect(ingredientAmount(2, 'medium')).toBe('2 × medium');
  });

  it('keeps cooking ingredients out of snack combos', () => {
    const combos = bestCombos([FOOD_BY_ID.oats, FOOD_BY_ID.marinara, FOOD_BY_ID.banana], 'topOff', windowTargets('topOff'));
    for (const c of combos) for (const f of c.foods) expect(f.ingredientOnly).toBeFalsy();
  });
});

describe('shopping', () => {
  const practice: TrainingEvent = { id: 'p', title: 'P', kind: 'practice', days: [1, 2, 4], startMin: 945, durationMin: 105, intensity: 'hard' };
  const week = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27'].flatMap((d) =>
    buildDayPlan(d, [practice], {}),
  );

  it('suggests staples for each uncovered window, with counts', () => {
    const s = weekSuggestions(week, []);
    expect(s.find((x) => x.foodId === 'banana')).toMatchObject({ qty: 3, reason: 'For 3 top-off snacks this week' });
    expect(s.some((x) => x.foodId === 'sportsdrink')).toBe(true);
    expect(s.some((x) => x.foodId === 'chocmilk')).toBe(true);
  });

  it('only suggests foods that are a great fit for their window', () => {
    for (const x of weekSuggestions(week, [])) {
      const types = ['topOff', 'preMeal', 'recovery', 'during'] as const;
      expect(types.some((t) => itemFit(FOOD_BY_ID[x.foodId], t).level === 'great')).toBe(true);
    }
  });

  it('suggests nothing for windows the kitchen already covers', () => {
    const s = weekSuggestions(week, ['banana', 'pretzels', 'pasta', 'rice', 'chocmilk', 'bagel', 'sportsdrink']);
    expect(s).toEqual([]);
  });

  it('merges without duplicates and turns recipe gaps into items', () => {
    let n = 0;
    const id = () => `i${n++}`;
    const items = recipeShopping(RECIPE_BY_ID['recovery-smoothie'], ['greekyogurt', 'milk'], id);
    expect(items.map((i) => i.name)).toEqual(['Greek yogurt', 'Milk']);
    const list: ShoppingItem[] = mergeShopping([], items);
    const again = mergeShopping(list, [{ id: id(), name: 'greek yogurt', checked: false, source: 'manual' }]);
    expect(again).toHaveLength(2);
  });

  it('matches typed items to library foods', () => {
    expect(matchFood('Bananas')).toBe('banana');
    expect(matchFood('greek yogurt')).toBe('greekyogurt');
    expect(matchFood('paper towels')).toBeUndefined();
  });
});
