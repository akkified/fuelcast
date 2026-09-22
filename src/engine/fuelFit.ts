// Fuel Fit: rates foods for a fueling window and builds the best combos from
// what the athlete already has in their kitchen or bag.

import type { Food, ItemFit, Macros, PlateResult, Targets, WindowType } from './types';

/** How appropriate a single food is for a window, based on digestion and purpose. */
export function itemFit(food: Food, type: WindowType): ItemFit {
  if (food.caution) return { level: 'avoid', reason: 'Not recommended for teens' };
  if (food.ingredientOnly) return { level: 'ok', reason: 'Cooking ingredient. See Recipes' };
  const { carbs, protein, fat, fiber } = food;

  switch (type) {
    case 'topOff':
      if (food.fried) return { level: 'avoid', reason: 'Fried food sits heavy before training' };
      if (fat > 7) return { level: 'avoid', reason: 'Too much fat to digest before you play' };
      if (fiber > 5) return { level: 'avoid', reason: 'High fiber can upset your stomach mid-session' };
      if (protein > 15) return { level: 'avoid', reason: 'Protein-heavy, so save it for after' };
      if (fat > 4 || fiber > 3.5) return { level: 'ok', reason: 'Works, but a little slow to digest' };
      if (carbs < 12) return { level: 'ok', reason: 'Light on carbs. Pair with fruit or pretzels' };
      if (carbs > 40) return { level: 'ok', reason: 'Big portion this close to go time. Try half' };
      return { level: 'great', reason: 'Quick, easy-to-digest carbs' };

    case 'preMeal':
      if (fat > 20 || fiber > 12) return { level: 'avoid', reason: 'Too heavy to digest in time' };
      if (food.fried) return { level: 'ok', reason: 'Fried food sits heavy, so eat it early if at all' };
      if (fat > 12) return { level: 'ok', reason: 'A bit heavy. Eat it early in the window' };
      if (carbs >= 25) return { level: 'great', reason: 'Carb-rich base for your meal' };
      if (protein >= 10) return { level: 'ok', reason: 'Good protein. Pair it with a big carb' };
      return { level: 'ok', reason: 'Add a carb-rich base' };

    case 'during':
      if (food.category === 'drink' && carbs >= 15) return { level: 'great', reason: 'Fluid and fast carbs in one' };
      if (fat <= 2 && fiber <= 2 && protein <= 3 && carbs >= 15)
        return { level: 'ok', reason: 'Fast carbs for long sessions' };
      return { level: 'avoid', reason: 'Hard to digest mid-session' };

    case 'recovery':
      if (food.fried) return { level: 'ok', reason: 'Fine as a treat, but little repair value' };
      if (carbs >= 15 && protein >= 8) return { level: 'great', reason: 'Carbs and protein in one' };
      if (protein >= 10) return { level: 'ok', reason: 'Protein covered. Add carbs' };
      if (carbs >= 15) return { level: 'ok', reason: 'Carbs covered. Add protein' };
      return { level: 'ok', reason: 'Light. Build a bigger plate' };
  }
}

export function plateTotals(foods: Food[]): Macros {
  const t = foods.reduce(
    (acc, f) => ({
      carbs: acc.carbs + f.carbs,
      protein: acc.protein + f.protein,
      fat: acc.fat + f.fat,
      fiber: acc.fiber + f.fiber,
    }),
    { carbs: 0, protein: 0, fat: 0, fiber: 0 },
  );
  const r = (n: number) => Math.round(n * 10) / 10;
  return { carbs: r(t.carbs), protein: r(t.protein), fat: r(t.fat), fiber: r(t.fiber) };
}

/**
 * Score a plate (0–100) against a window's targets. Under-target carbs cost the
 * most (fuel is the point), then protein; going over fat/fiber limits costs
 * points because it slows digestion.
 */
export function evaluatePlate(foods: Food[], targets: Targets): PlateResult {
  const totals = plateTotals(foods);
  const notes: string[] = [];
  let score = 100;

  // A 5% tolerance on each range so "1 g short" doesn't count as a miss.
  const carbs = { min: targets.carbs.min * 0.95, max: targets.carbs.max * 1.05 };
  const protein = { min: targets.protein.min * 0.95, max: targets.protein.max * 1.05 };
  if (totals.carbs < carbs.min) {
    score -= (40 * (carbs.min - totals.carbs)) / carbs.min;
    notes.push(`Add ~${Math.ceil(targets.carbs.min - totals.carbs)} g carbs`);
  } else if (totals.carbs > carbs.max) {
    score -= 20 * Math.min(1, (totals.carbs - carbs.max) / carbs.max);
    notes.push('More carbs than you need here');
  }

  if (protein.min > 0 && totals.protein < protein.min) {
    score -= (30 * (protein.min - totals.protein)) / protein.min;
    notes.push(`Add ~${Math.ceil(targets.protein.min - totals.protein)} g protein`);
  } else if (totals.protein > protein.max) {
    score -= 10 * Math.min(1, (totals.protein - protein.max) / Math.max(protein.max, 1));
    notes.push('Heavy on protein for this window');
  }

  if (totals.fat > targets.fatMax) {
    score -= Math.min(25, (totals.fat - targets.fatMax) * 2);
    notes.push('High in fat, slower to digest');
  }
  if (totals.fiber > targets.fiberMax) {
    score -= Math.min(20, (totals.fiber - targets.fiberMax) * 3);
    notes.push('High in fiber, may upset your stomach');
  }

  if (foods.some((f) => f.caution)) {
    score = 0;
    notes.push('Includes something not recommended for teens');
  }

  if (notes.length === 0) notes.push('Right on target');
  return { foods, totals, score: Math.max(0, Math.min(100, Math.round(score))), notes };
}

function* combinations<T>(items: T[], size: number, start = 0, prefix: T[] = []): Generator<T[]> {
  if (prefix.length === size) {
    yield prefix;
    return;
  }
  for (let i = start; i < items.length; i++) {
    yield* combinations(items, size, i + 1, [...prefix, items[i]]);
  }
}

/**
 * Search every combination of up to `maxItems` foods from the pantry and return
 * the best-scoring options. Ties go to the plate with fewer items, and combos
 * that just add or remove items from a better pick are skipped so the
 * suggestions stay varied.
 */
export function bestCombos(
  pantry: Food[],
  type: WindowType,
  targets: Targets,
  opts: { maxItems?: number; top?: number } = {},
): PlateResult[] {
  const maxItems = type === 'during' ? 1 : (opts.maxItems ?? 3);
  const top = opts.top ?? 3;
  const candidates = pantry.filter((f) => !f.ingredientOnly && itemFit(f, type).level !== 'avoid');

  const scored: PlateResult[] = [];
  for (let size = 1; size <= Math.min(maxItems, candidates.length); size++) {
    for (const combo of combinations(candidates, size)) {
      scored.push(evaluatePlate(combo, targets));
    }
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      a.foods.length - b.foods.length ||
      a.foods.map((f) => f.id).join().localeCompare(b.foods.map((f) => f.id).join()),
  );

  const picked: PlateResult[] = [];
  for (const result of scored) {
    if (picked.length >= top) break;
    const ids = new Set(result.foods.map((f) => f.id));
    const redundant = picked.some((p) => {
      const pIds = p.foods.map((f) => f.id);
      return pIds.every((id) => ids.has(id)) || result.foods.every((f) => pIds.includes(f.id));
    });
    if (!redundant) picked.push(result);
  }
  return picked;
}

export const FIT_LABEL: Record<ItemFit['level'], string> = { great: 'Great fit', ok: 'Okay', avoid: 'Not now' };
