// Offline coach: answers the common requests on-device with the Smart Coach
// engines, so the Coach tab is useful without an API key or internet.

import { FOOD_BY_ID } from '../data/foods';
import { RECIPES } from '../data/recipes';
import { STARTER_WORKOUTS } from '../data/workouts';
import { FOCUS_LABEL, generateWorkout, readiness, recommend, type Focus } from '../engine/coach';
import { buildDayPlan, nextWindow } from '../engine/forecast';
import { ingredientAmount, rankRecipes } from '../engine/recipes';
import { weekSuggestions } from '../engine/shopping';
import { addDays, dateKey, minutesOfDay } from '../engine/time';
import type { AppState, ChatMessage } from '../state/store';

export const QUICK_PROMPTS = [
  'What should I do today?',
  'Build me a 30-min workout',
  'What can I cook with my kitchen?',
  'Make my shopping list for the week',
];

function detectFocus(t: string): Focus {
  if (/upper|\barms?\b|chest|\bback\b|shoulder|\bpush|\bpull/.test(t)) return 'upper';
  if (/lower|\blegs?\b|squat|glute/.test(t)) return 'lower';
  if (/\bcore\b|\babs\b/.test(t)) return 'core';
  if (/speed|power|jump|explosive|fast/.test(t)) return 'power';
  if (/cardio|condition|endurance|\bruns?\b|running/.test(t)) return 'conditioning';
  if (/stretch|mobility|recover|sore|flexib/.test(t)) return 'mobility';
  return 'full';
}

export function offlineReply(text: string, state: AppState, now: Date, seed: number): Omit<ChatMessage, 'id' | 'at'> {
  const t = text.toLowerCase();
  const today = dateKey(now);
  const workouts = [...state.customWorkouts, ...STARTER_WORKOUTS];

  if (/workout|\blift|exercise|routine|train me|build me/.test(t)) {
    const minutes = Number(t.match(/(\d{1,3})\s*-?\s*min/)?.[1]) || state.profile.sessionMin;
    const focus = detectFocus(t);
    const r = readiness(state.workoutLogs, state.events, today, now.getTime());
    const workout = generateWorkout({ focus, minutes: Math.min(90, Math.max(10, minutes)), profile: state.profile, readiness: r, seed });
    return {
      role: 'assistant',
      offline: true,
      text: `Here’s a ${workout.durationMin}-minute ${FOCUS_LABEL[focus].toLowerCase()} session built for your equipment and level, favoring your freshest muscles. Save it to your workouts or start it now.`,
      workout,
    };
  }

  if (/cook|recipe|\bmeals?\b|dinner|lunch|breakfast|make with|\beat\b/.test(t)) {
    const plan = buildDayPlan(today, state.events, state.profile);
    const next = nextWindow(plan, minutesOfDay(now), (id) => !!state.logs[today]?.windows[id]);
    const ranked = rankRecipes(RECIPES, state.pantry, next?.type ?? 'recovery', state.profile.weightKg);
    const best = ranked[0];
    if (!best) return { role: 'assistant', offline: true, text: 'Add some foods in Fuel → Kitchen and I’ll find recipes you can make.' };
    const missing = best.missing.map((id) => FOOD_BY_ID[id]?.name).filter(Boolean);
    return {
      role: 'assistant',
      offline: true,
      text:
        best.status === 'ready'
          ? `You have everything for ${best.recipe.name}${next ? `, and it’s a good fit for your ${next.title.toLowerCase()}` : ''}.`
          : `Closest match: ${best.recipe.name}. You’d just need ${missing.join(' and ')}.`,
      recipe: {
        name: best.recipe.name,
        minutes: best.recipe.minutes,
        ingredients: best.recipe.ingredients.map((i) => {
          const f = FOOD_BY_ID[i.foodId];
          return `${f.name}: ${ingredientAmount(i.servings, f.serving)}${i.optional ? ' (optional)' : ''}`;
        }),
        steps: best.recipe.steps,
      },
      shopping: missing,
    };
  }

  if (/\bshop|grocer|\bbuy\b|\blist\b/.test(t)) {
    const week = Array.from({ length: 7 }, (_, i) => buildDayPlan(addDays(today, i), state.events, state.profile)).flat();
    const s = weekSuggestions(week, state.pantry);
    if (s.length === 0) return { role: 'assistant', offline: true, text: 'Your kitchen already covers every fuel window this week. Nice work.' };
    return {
      role: 'assistant',
      offline: true,
      text: `Based on this week’s schedule, grab these so every fuel window has a great option:`,
      shopping: s.map((x) => `${FOOD_BY_ID[x.foodId].name} ×${x.qty}`),
    };
  }

  if (/today|should i|what do i|\bsore\b|tired|\brest\b/.test(t)) {
    const rec = recommend({ today, nowMs: now.getTime(), profile: state.profile, events: state.events, logs: state.workoutLogs, workouts });
    const top = rec.picks[0];
    return {
      role: 'assistant',
      offline: true,
      text: `${rec.headline}. ${rec.reasons.join(' ')}${top ? `\n\nMy pick: ${top.workout.emoji} ${top.workout.name} (${top.workout.durationMin} min).` : ''}`,
      workout: top?.workout,
    };
  }

  return {
    role: 'assistant',
    offline: true,
    text: 'Offline, I can plan today’s training, build a workout, find a recipe from your kitchen, or make your shopping list. Tap a suggestion below. Connect Claude in Settings → AI Coach for open-ended coaching.',
  };
}
