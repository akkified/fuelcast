// Core domain types shared by the engine, the store, and the UI.

export type Units = 'imperial' | 'metric';

export type Sport =
  | 'Soccer'
  | 'Basketball'
  | 'Football'
  | 'Track & XC'
  | 'Swimming'
  | 'Volleyball'
  | 'Baseball & Softball'
  | 'Tennis'
  | 'Lacrosse'
  | 'Other';

export interface Profile {
  name: string;
  sport: Sport;
  units: Units;
  /** Bottle size in millilitres. */
  bottleMl: number;
  /** Optional. Only used for fueling targets and sweat-test math. Never shown as a goal. */
  weightKg?: number;
  /** Litres per hour, saved from the sweat test. */
  sweatRateLph?: number;
}

export type EventKind = 'practice' | 'game' | 'lift' | 'conditioning';
export type Intensity = 'light' | 'moderate' | 'hard';

export interface TrainingEvent {
  id: string;
  title: string;
  kind: EventKind;
  /** Weekdays this repeats on (0 = Sunday). Ignored when `date` is set. */
  days: number[];
  /** One-time event on this date (YYYY-MM-DD). */
  date?: string;
  /** Minutes after midnight. */
  startMin: number;
  durationMin: number;
  intensity: Intensity;
}

export type WindowType = 'preMeal' | 'topOff' | 'during' | 'recovery';

export interface Range {
  min: number;
  max: number;
}

export interface Targets {
  carbs: Range;
  protein: Range;
  /** Grams — stay at or under. */
  fatMax: number;
  /** Grams — stay at or under. */
  fiberMax: number;
}

export interface FuelWindow {
  /** `${eventId}:${type}` — unique within a day. */
  id: string;
  eventId: string;
  eventTitle: string;
  type: WindowType;
  title: string;
  startMin: number;
  endMin: number;
  /** Short explanation of the science behind this window. */
  why: string;
  tip?: string;
  targets: Targets;
  /** Suggested fluid for this window, in millilitres (per hour for `during`). */
  fluidMl?: number;
  /** Set when a recovery window also has to fuel a later session. */
  reloadForEventId?: string;
}

export type FoodCategory = 'grain' | 'fruit' | 'protein' | 'dairy' | 'snack' | 'meal' | 'veg' | 'drink';

export interface Food {
  id: string;
  name: string;
  serving: string;
  category: FoodCategory;
  emoji: string;
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
  fried?: boolean;
  /** Not recommended for teens — never suggested. */
  caution?: string;
}

export type FitLevel = 'great' | 'ok' | 'avoid';

export interface ItemFit {
  level: FitLevel;
  reason: string;
}

export interface Macros {
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
}

export interface PlateResult {
  foods: Food[];
  totals: Macros;
  score: number;
  notes: string[];
}

export type WindowStatus = 'done' | 'skipped';

export interface WindowLog {
  status: WindowStatus;
  foodIds?: string[];
  /** Epoch ms. */
  at: number;
}

export interface DayLog {
  windows: Record<string, WindowLog>;
  waterMl: number;
  /** Session energy check-ins, keyed by event id. 1 (drained) – 5 (unstoppable). */
  energy: Record<string, number>;
}
