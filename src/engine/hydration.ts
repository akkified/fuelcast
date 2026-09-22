// Hydration math: the sweat test and a daily fluid goal.
//
// Sweat rate = (pre-weight − post-weight + fluid drunk − urine) ÷ hours
// (Sawka et al., 2007; McDermott et al., 2017, NATA fluid replacement statement).
// Replace 1.25–1.5 L per kg lost after exercise; losing more than ~2% of body
// mass is linked to lower performance.

import type { Intensity, Profile, TrainingEvent, Units } from './types';

export const ML_PER_OZ = 29.5735;
export const LB_PER_KG = 2.20462;

export interface SweatTestInput {
  preKg: number;
  postKg: number;
  fluidMl: number;
  urineMl: number;
  minutes: number;
}

export type SweatTestResult =
  | {
      ok: true;
      sweatRateLph: number;
      lossPct: number;
      replaceMl: { min: number; max: number };
      perHourMl: number;
      warning?: string;
    }
  | { ok: false; error: string };

const round50 = (ml: number) => Math.round(ml / 50) * 50;

export function sweatTest(i: SweatTestInput): SweatTestResult {
  const nums = [i.preKg, i.postKg, i.fluidMl, i.urineMl, i.minutes];
  if (nums.some((n) => !Number.isFinite(n))) return { ok: false, error: 'Fill in every field with a number.' };
  if (i.minutes < 15 || i.minutes > 300) return { ok: false, error: 'Session length should be 15–300 minutes.' };
  if (i.preKg < 25 || i.preKg > 200 || i.postKg < 25 || i.postKg > 200)
    return { ok: false, error: 'Double-check your weights.' };
  if (i.fluidMl < 0 || i.urineMl < 0) return { ok: false, error: 'Fluid amounts can’t be negative.' };
  if (Math.abs(i.preKg - i.postKg) > i.preKg * 0.06)
    return { ok: false, error: 'That’s a bigger change than a single session causes. Re-weigh and try again.' };

  const lossKg = i.preKg - i.postKg;
  const sweatL = lossKg + i.fluidMl / 1000 - i.urineMl / 1000;
  if (sweatL <= 0) return { ok: false, error: 'Those numbers add up to zero sweat. Check the fluid and weights.' };

  const sweatRateLph = Math.round((sweatL / (i.minutes / 60)) * 100) / 100;
  const lossPct = Math.round((Math.max(0, lossKg) / i.preKg) * 1000) / 10;
  const replaceMl = lossKg > 0 ? { min: round50(lossKg * 1250), max: round50(lossKg * 1500) } : { min: 0, max: 0 };

  return {
    ok: true,
    sweatRateLph,
    lossPct,
    replaceMl,
    perHourMl: round50(sweatRateLph * 1000 * 0.8),
    warning:
      lossPct >= 2
        ? 'You lost 2% or more of your body weight. That’s where performance starts to drop, so drink more during your next session.'
        : undefined,
  };
}

const INTENSITY_FACTOR: Record<Intensity, number> = { light: 0.7, moderate: 1, hard: 1.2 };

export interface GoalItem {
  label: string;
  ml: number;
}

/** Daily fluid goal, itemised: a 2 L baseline for teens plus what each session costs. */
export function goalBreakdown(profile: Pick<Profile, 'sweatRateLph'>, todaysEvents: TrainingEvent[]): GoalItem[] {
  const perHour = profile.sweatRateLph ? profile.sweatRateLph * 1000 : 500;
  return [
    { label: 'Daily baseline', ml: 2000 },
    ...todaysEvents.map((e) => ({
      label: e.title,
      ml: round50((e.durationMin / 60) * perHour * INTENSITY_FACTOR[e.intensity]),
    })),
  ];
}

export function dailyGoalMl(profile: Pick<Profile, 'sweatRateLph'>, todaysEvents: TrainingEvent[]): number {
  return goalBreakdown(profile, todaysEvents).reduce((sum, item) => sum + item.ml, 0);
}

export function bottlesFor(ml: number, bottleMl: number): number {
  return Math.max(1, Math.ceil(ml / bottleMl));
}

export function formatFluid(ml: number, units: Units): string {
  if (units === 'imperial') return `${Math.round(ml / ML_PER_OZ)} oz`;
  return ml >= 1000 ? `${(ml / 1000).toFixed(1)} L` : `${Math.round(ml)} mL`;
}

export function formatWeight(kg: number, units: Units): string {
  return units === 'imperial' ? `${Math.round(kg * LB_PER_KG * 10) / 10} lb` : `${Math.round(kg * 10) / 10} kg`;
}

export const toKg = (value: number, units: Units) => (units === 'imperial' ? value / LB_PER_KG : value);
export const toMl = (value: number, units: Units) => (units === 'imperial' ? value * ML_PER_OZ : value);
