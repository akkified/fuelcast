// Shopping list: turn the week's fuel forecast and chosen recipes into a list.

import { FOOD_BY_ID } from '../data/foods';
import type { Recipe } from '../data/recipes';
import { itemFit } from './fuelFit';
import type { FuelWindow, WindowType } from './types';

export interface ShoppingItem {
  id: string;
  name: string;
  foodId?: string;
  note?: string;
  checked: boolean;
  source: 'plan' | 'recipe' | 'manual' | 'coach';
}

export interface Suggestion {
  foodId: string;
  qty: number;
  reason: string;
}

/** Easy, cheap staples for each window, in order of preference (only "great fit" ones are ever suggested). */
const STAPLES: Record<WindowType, string[]> = {
  topOff: ['banana', 'pretzels', 'granolabar', 'figbars', 'applesauce', 'ricecakes'],
  preMeal: ['pasta', 'rice', 'bagel', 'potato'],
  during: ['sportsdrink'],
  recovery: ['chocmilk', 'turkeysandwich', 'bagel', 'pbj'],
};

const WINDOW_NAME: Record<WindowType, string> = {
  preMeal: 'pre-session meals',
  topOff: 'top-off snacks',
  during: 'long sessions',
  recovery: 'recovery refuels',
};

/**
 * For each window type in the coming week, make sure the kitchen has at least
 * two "great fit" options; suggest staples (with a count) for any gaps.
 * Recovery also needs a protein source.
 */
export function weekSuggestions(weekWindows: FuelWindow[], pantryIds: string[]): Suggestion[] {
  const pantry = new Set(pantryIds);
  const counts: Record<WindowType, number> = { preMeal: 0, topOff: 0, during: 0, recovery: 0 };
  for (const w of weekWindows) counts[w.type]++;

  const out: Suggestion[] = [];
  for (const type of ['topOff', 'preMeal', 'recovery', 'during'] as WindowType[]) {
    const n = counts[type];
    if (n === 0) continue;
    const greatInPantry = pantryIds.filter((id) => {
      const f = FOOD_BY_ID[id];
      return f && !f.ingredientOnly && itemFit(f, type).level === 'great';
    }).length;
    const needed = Math.max(0, (type === 'during' ? 1 : 2) - greatInPantry);
    let added = 0;
    for (const id of STAPLES[type]) {
      if (added >= needed) break;
      if (pantry.has(id) || out.some((s) => s.foodId === id)) continue;
      if (itemFit(FOOD_BY_ID[id], type).level !== 'great') continue;
      const qty = type === 'topOff' || type === 'during' ? n : Math.ceil(n / 2);
      out.push({ foodId: id, qty, reason: `For ${n} ${WINDOW_NAME[type]} this week` });
      added++;
    }
  }
  return out;
}

export function recipeShopping(recipe: Recipe, missingIds: string[], newId: () => string): ShoppingItem[] {
  return missingIds
    .map((id) => FOOD_BY_ID[id])
    .filter(Boolean)
    .map((f) => ({ id: newId(), name: f.name, foodId: f.id, note: `For ${recipe.name}`, checked: false, source: 'recipe' as const }));
}

const norm = (s: string) => s.trim().toLowerCase();

/** Add items, skipping anything already on the list (by food or by name). */
export function mergeShopping(list: ShoppingItem[], items: ShoppingItem[]): ShoppingItem[] {
  const out = [...list];
  for (const item of items) {
    const dupe = out.some(
      (x) => !x.checked && ((item.foodId && x.foodId === item.foodId) || norm(x.name) === norm(item.name)),
    );
    if (!dupe && item.name.trim()) out.push(item);
  }
  return out;
}

/** Match free text ("bananas", "Greek yogurt") to a library food so it can go to the kitchen when bought. */
export function matchFood(text: string): string | undefined {
  const t = norm(text).replace(/s$/, '');
  if (!t) return undefined;
  const all = Object.values(FOOD_BY_ID);
  const exact = all.find((f) => norm(f.name) === t || norm(f.name).replace(/s$/, '') === t);
  if (exact) return exact.id;
  const partial = all.find((f) => norm(f.name).includes(t) || (t.length >= 4 && t.includes(norm(f.name))));
  return partial?.id;
}
