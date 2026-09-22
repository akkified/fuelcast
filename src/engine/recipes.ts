// Recipe matching: what can I make with what I have, and what is it good for?

import { FOOD_BY_ID } from '../data/foods';
import type { Recipe } from '../data/recipes';
import { evaluatePlate } from './fuelFit';
import { windowTargets } from './targets';
import type { Food, Macros, WindowType } from './types';

export function recipeMacros(recipe: Recipe, includeOptional = false): Macros {
  const t = { carbs: 0, protein: 0, fat: 0, fiber: 0 };
  for (const i of recipe.ingredients) {
    if (i.optional && !includeOptional) continue;
    const f = FOOD_BY_ID[i.foodId];
    if (!f) continue;
    t.carbs += f.carbs * i.servings;
    t.protein += f.protein * i.servings;
    t.fat += f.fat * i.servings;
    t.fiber += f.fiber * i.servings;
  }
  const r = (n: number) => Math.round(n);
  return { carbs: r(t.carbs), protein: r(t.protein), fat: r(t.fat), fiber: r(t.fiber) };
}

/** Score a recipe (0–100) for a fueling window, using the same scorer as the kitchen combos. */
export function recipeFit(recipe: Recipe, type: WindowType, weightKg?: number): number {
  const m = recipeMacros(recipe);
  const asFood: Food = { id: recipe.id, name: recipe.name, serving: '1 serving', category: 'meal', emoji: recipe.emoji, ...m };
  return evaluatePlate([asFood], windowTargets(type, weightKg)).score;
}

export const FIT_WINDOWS: WindowType[] = ['preMeal', 'topOff', 'recovery'];

/**
 * Windows this recipe is a strong fit for. It must score 85+ AND meet the
 * window's core needs: a pre-game meal needs its carbs without heavy fat or
 * fiber, recovery needs both carbs and protein, and a top-off must be small and
 * easy to digest.
 */
export function bestWindows(recipe: Recipe, weightKg?: number): WindowType[] {
  const m = recipeMacros(recipe);
  return FIT_WINDOWS.filter((t) => {
    const tg = windowTargets(t, weightKg);
    if (t === 'topOff' && (m.carbs > 40 || m.protein > 12 || m.fat > 6 || m.fiber > 4)) return false;
    if (t === 'preMeal' && (m.carbs < tg.carbs.min * 0.9 || m.fat > tg.fatMax || m.fiber > tg.fiberMax)) return false;
    if (t === 'recovery' && (m.carbs < tg.carbs.min * 0.9 || m.protein < tg.protein.min * 0.9)) return false;
    return recipeFit(recipe, t, weightKg) >= 85;
  });
}

export type MatchStatus = 'ready' | 'almost' | 'shop';

export interface RecipeMatch {
  recipe: Recipe;
  have: string[];
  missing: string[];
  status: MatchStatus;
}

export function matchRecipe(recipe: Recipe, pantry: Set<string>): RecipeMatch {
  const required = recipe.ingredients.filter((i) => !i.optional).map((i) => i.foodId);
  const have = required.filter((id) => pantry.has(id));
  const missing = required.filter((id) => !pantry.has(id));
  const status: MatchStatus = missing.length === 0 ? 'ready' : missing.length <= 2 ? 'almost' : 'shop';
  return { recipe, have, missing, status };
}

const STATUS_RANK: Record<MatchStatus, number> = { ready: 0, almost: 1, shop: 2 };

/** Ready-to-make first, then closest to ready, then best fit for the window you care about. */
export function rankRecipes(recipes: Recipe[], pantryIds: string[], focus?: WindowType, weightKg?: number): RecipeMatch[] {
  const pantry = new Set(pantryIds);
  return recipes
    .map((r) => ({ m: matchRecipe(r, pantry), fit: focus ? recipeFit(r, focus, weightKg) : 0 }))
    .sort(
      (a, b) =>
        STATUS_RANK[a.m.status] - STATUS_RANK[b.m.status] ||
        b.fit - a.fit ||
        a.m.missing.length - b.m.missing.length ||
        a.m.recipe.name.localeCompare(b.m.recipe.name),
    )
    .map((x) => x.m);
}

const FRACTIONS: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅛': 0.125 };

function formatQty(n: number): string {
  const whole = Math.floor(n + 1e-9);
  const frac = n - whole;
  const glyph = Object.entries(FRACTIONS).find(([, v]) => Math.abs(v - frac) < 0.01)?.[0];
  if (frac < 0.01) return String(whole);
  if (glyph) return whole ? `${whole}${glyph}` : glyph;
  return String(Math.round(n * 10) / 10);
}

/** Human-readable amount: scales the serving's leading number ("1 cup" × 1.5 → "1½ cups"). */
export function ingredientAmount(servings: number, serving: string): string {
  if (servings === 1) return serving;
  const m = serving.match(/^(\d+(?:\.\d+)?|[½¼¾⅓⅛])\s*(.*)$/);
  if (!m) return `${formatQty(servings)} × ${serving}`;
  const base = FRACTIONS[m[1]] ?? Number(m[1]);
  const total = base * servings;
  let unit = m[2];
  // Pluralize simple units ("cup" → "cups") when the amount goes above one.
  if (total > 1 && /^(cup|slice|tbsp|stick|bar|cake)\b/.test(unit) && !/^(cups|slices|bars|cakes|sticks)\b/.test(unit)) {
    unit = unit.replace(/^(cup|slice|stick|bar|cake)\b/, '$1s');
  }
  return `${formatQty(total)} ${unit}`.trim();
}
