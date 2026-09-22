// The Fuel Forecast: turns a training schedule into timed fueling windows.

import { preFluidMl, windowTargets } from './targets';
import { weekdayOf } from './time';
import type { EventKind, FuelWindow, Profile, TrainingEvent, WindowType } from './types';

const KIND_LABEL: Record<EventKind, string> = {
  practice: 'practice',
  game: 'game',
  lift: 'lift',
  conditioning: 'workout',
};

export const WINDOW_ORDER: Record<WindowType, number> = { preMeal: 0, topOff: 1, during: 2, recovery: 3 };

/** Events that happen on a given day, sorted by start time. */
export function eventsOn(key: string, events: TrainingEvent[]): TrainingEvent[] {
  const wd = weekdayOf(key);
  return events
    .filter((e) => (e.date ? e.date === key : e.days.includes(wd)))
    .sort((a, b) => a.startMin - b.startMin);
}

/** Sessions long or hard enough to need carbs while training. */
export function needsInSessionFuel(e: TrainingEvent): boolean {
  return e.durationMin >= 75 || (e.intensity === 'hard' && e.durationMin >= 60);
}

function windowsForEvent(e: TrainingEvent, profile: Pick<Profile, 'weightKg' | 'sweatRateLph'>): FuelWindow[] {
  const s = e.startMin;
  const end = s + e.durationMin;
  const label = KIND_LABEL[e.kind];
  const base = { eventId: e.id, eventTitle: e.title };
  const out: FuelWindow[] = [];
  const make = (type: WindowType, w: Omit<FuelWindow, 'id' | 'eventId' | 'eventTitle' | 'type'>): FuelWindow => ({
    id: `${e.id}:${type}`,
    type,
    ...base,
    ...w,
  });

  let hasPreMeal = true;
  if (s - 240 >= 360) {
    const startMin = s - 240;
    const lunch = startMin >= 660 && startMin <= 810;
    out.push(
      make('preMeal', {
        title: `Pre-${label} meal`,
        startMin,
        endMin: s - 180,
        why: 'A carb-focused meal 3–4 hours out tops up muscle glycogen, your main fuel for hard efforts, and leaves time to digest.',
        tip: lunch
          ? 'This is probably your school lunch. Build the plate around a big carb, add lean protein and fruit.'
          : 'Build the plate around a big carb, add lean protein and fruit. Go easy on greasy food.',
        targets: windowTargets('preMeal', profile.weightKg),
        fluidMl: preFluidMl(profile.weightKg),
      }),
    );
  } else if (s - 120 >= 330) {
    out.push(
      make('preMeal', {
        title: 'Light breakfast',
        startMin: s - 120,
        endMin: s - 90,
        why: 'Early start? A light, carb-based breakfast about 1.5–2 hours out gives you fuel without a heavy stomach.',
        tip: 'Think toast or a bagel with honey, a banana, or a bowl of cereal.',
        targets: windowTargets('preMeal', profile.weightKg, true),
        fluidMl: preFluidMl(profile.weightKg),
      }),
    );
  } else {
    hasPreMeal = false;
  }

  out.push(
    make('topOff', {
      title: 'Top-off snack',
      startMin: hasPreMeal ? s - 60 : s - 45,
      endMin: hasPreMeal ? s - 30 : s - 15,
      why: 'A small carb snack 30–60 minutes before, low in fat and fiber, raises available energy without upsetting your stomach.',
      tip: hasPreMeal
        ? 'Fill your bottle now so you start hydrated.'
        : 'Early session: last night’s dinner was your big fuel. Grab a quick carb and your bottle on the way.',
      targets: windowTargets('topOff', profile.weightKg),
    }),
  );

  if (needsInSessionFuel(e)) {
    out.push(
      make('during', {
        title: 'In-session fuel',
        startMin: s,
        endMin: end,
        why: 'For sessions over about an hour, 30–60 g of carbs per hour helps keep your energy steady to the final whistle.',
        tip: 'Sip every 15–20 minutes. A sports drink covers fluid and carbs at the same time.',
        targets: windowTargets('during', profile.weightKg),
        fluidMl: profile.sweatRateLph ? Math.round((profile.sweatRateLph * 1000 * 0.8) / 50) * 50 : 500,
      }),
    );
  }

  out.push(
    make('recovery', {
      title: 'Recovery refuel',
      startMin: end,
      endMin: end + 60,
      why: 'Within an hour after, carbs refill glycogen and 15–25 g of protein kick-starts muscle repair.',
      tip: 'Chocolate milk, a turkey sandwich, or yogurt with fruit all hit carbs + protein in one go.',
      targets: windowTargets('recovery', profile.weightKg),
    }),
  );

  return out;
}

const overlaps = (a0: number, a1: number, b0: number, b1: number) => a0 < b1 && b0 < a1;

/**
 * Build the day's fueling plan.
 *  1. Generate windows for every session.
 *  2. Drop pre-session windows that land inside another session.
 *  3. When a recovery window collides with the next session's pre-fuel, keep the
 *     recovery and turn it into a "Recover + reload" window.
 */
export function buildDayPlan(
  key: string,
  events: TrainingEvent[],
  profile: Pick<Profile, 'weightKg' | 'sweatRateLph'>,
): FuelWindow[] {
  const todays = eventsOn(key, events);
  let windows = todays.flatMap((e) => windowsForEvent(e, profile));

  windows = windows.filter((w) => {
    if (w.type === 'during' || w.type === 'recovery') return true;
    return !todays.some(
      (e) => e.id !== w.eventId && overlaps(w.startMin, w.endMin, e.startMin, e.startMin + e.durationMin),
    );
  });

  const dropped = new Set<string>();
  const isPre = (w: FuelWindow) => w.type === 'preMeal' || w.type === 'topOff';
  const eventStart = (id: string) => todays.find((e) => e.id === id)?.startMin ?? 0;
  // Two sessions' pre-fuel windows collide: the sooner session's window wins.
  for (const a of windows) {
    for (const b of windows) {
      if (a === b || a.eventId === b.eventId || !isPre(a) || !isPre(b)) continue;
      if (overlaps(a.startMin, a.endMin, b.startMin, b.endMin) && eventStart(a.eventId) < eventStart(b.eventId)) {
        dropped.add(b.id);
      }
    }
  }
  windows = windows.filter((w) => !dropped.has(w.id));

  const recoveries = windows.filter((w) => w.type === 'recovery');
  const markReload = (r: FuelWindow, next: TrainingEvent) => {
    if (r.reloadForEventId) return;
    r.reloadForEventId = next.id;
    r.title = 'Recover + reload';
    r.why = 'You train again soon. Refuel now with carbs and protein so you start the next session ready.';
    r.tip = `Next up: ${next.title}. Favor easy-to-digest carbs.`;
  };
  for (const r of recoveries) {
    for (const w of windows) {
      if (w.eventId === r.eventId || (w.type !== 'preMeal' && w.type !== 'topOff')) continue;
      if (overlaps(r.startMin, r.endMin, w.startMin, w.endMin)) {
        dropped.add(w.id);
        const next = todays.find((e) => e.id === w.eventId);
        if (next) markReload(r, next);
      }
    }
    // Back-to-back sessions: the next one starts inside this recovery window.
    const next = todays.find((e) => e.id !== r.eventId && e.startMin >= r.startMin && e.startMin < r.endMin);
    if (next) markReload(r, next);
  }
  windows = windows.filter((w) => !dropped.has(w.id));

  return windows.sort((a, b) => a.startMin - b.startMin || WINDOW_ORDER[a.type] - WINDOW_ORDER[b.type]);
}

export type WindowPhase = 'upcoming' | 'now' | 'past';

export function windowPhase(w: FuelWindow, nowMin: number): WindowPhase {
  if (nowMin < w.startMin) return 'upcoming';
  if (nowMin < w.endMin) return 'now';
  return 'past';
}

/** The window the athlete should care about next: the current one, else the next upcoming. */
export function nextWindow(windows: FuelWindow[], nowMin: number, isDone: (id: string) => boolean): FuelWindow | undefined {
  return (
    windows.find((w) => windowPhase(w, nowMin) === 'now' && !isDone(w.id)) ??
    windows.find((w) => windowPhase(w, nowMin) === 'upcoming' && !isDone(w.id))
  );
}
