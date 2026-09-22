// Fueling targets for each window type.
//
// Sources (see docs/RESEARCH.md):
//  - Thomas, Erdman & Burke (2016), ACSM / Academy of Nutrition and Dietetics /
//    Dietitians of Canada joint position: carbs 1–4 g/kg 1–4 h before exercise,
//    30–60 g/h during longer sessions, ~0.25–0.3 g/kg protein after.
//  - Sawka et al. (2007), ACSM fluid replacement position stand: ~5–7 mL/kg
//    at least 4 h before exercise.
// FuelCast uses the conservative low end of each range for teens and never
// shows calories.

import type { Targets, WindowType } from './types';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function windowTargets(type: WindowType, weightKg?: number, light = false): Targets {
  const kg = weightKg && weightKg > 0 ? weightKg : undefined;
  switch (type) {
    case 'preMeal':
      if (light) return { carbs: { min: 30, max: 60 }, protein: { min: 5, max: 20 }, fatMax: 10, fiberMax: 6 };
      return {
        carbs: kg ? { min: Math.round(clamp(kg, 40, 90)), max: Math.round(clamp(2 * kg, 70, 160)) } : { min: 60, max: 100 },
        protein: { min: 15, max: 35 },
        fatMax: 20,
        fiberMax: 10,
      };
    case 'topOff':
      return { carbs: { min: 15, max: 30 }, protein: { min: 0, max: 10 }, fatMax: 5, fiberMax: 4 };
    case 'during':
      return { carbs: { min: 30, max: 60 }, protein: { min: 0, max: 5 }, fatMax: 3, fiberMax: 3 };
    case 'recovery': {
      if (!kg) return { carbs: { min: 30, max: 60 }, protein: { min: 15, max: 25 }, fatMax: 20, fiberMax: 12 };
      const pMin = Math.round(clamp(0.25 * kg, 12, 30));
      return {
        carbs: { min: Math.round(clamp(0.5 * kg, 25, 60)), max: Math.round(clamp(kg, 50, 110)) },
        protein: { min: pMin, max: pMin + 10 },
        fatMax: 20,
        fiberMax: 12,
      };
    }
  }
}

/** Pre-exercise fluid: ~6 mL/kg (middle of 5–7 mL/kg), or a 500 mL default. */
export function preFluidMl(weightKg?: number): number {
  if (!weightKg || weightKg <= 0) return 500;
  return Math.round((6 * weightKg) / 50) * 50;
}
