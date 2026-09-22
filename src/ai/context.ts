// The short, privacy-conscious athlete summary sent with each AI Coach message.
// No name, no body weight.

import { EQUIPMENT_LABEL, MUSCLE_LABEL } from '../data/exercises';
import { GOAL_LABEL, LEVEL_LABEL } from '../data/workouts';
import { readiness, MUSCLES } from '../engine/coach';
import { buildDayPlan, eventsOn, nextWindow } from '../engine/forecast';
import { addDays, dateKey, formatClock, formatDateLong, minutesOfDay } from '../engine/time';
import type { AppState } from '../state/store';
import { pantryNames } from './coach';

export function buildContext(state: AppState, now: Date): string {
  const today = dateKey(now);
  const nowMin = minutesOfDay(now);
  const p = state.profile;
  const lines: string[] = [];

  lines.push(`Now: ${formatDateLong(today)}, ${formatClock(nowMin)}`);
  lines.push(`Sport: ${p.sport}. Training level: ${LEVEL_LABEL[p.level]}. Goal: ${GOAL_LABEL[p.goal]}. Usual workout length: ${p.sessionMin} min.`);
  lines.push(`Equipment: ${['Bodyweight', ...p.equipment.map((e) => EQUIPMENT_LABEL[e])].join(', ')}. Units: ${p.units === 'imperial' ? 'lb/oz' : 'kg/mL'}.`);

  lines.push('Schedule:');
  for (let i = 0; i < 4; i++) {
    const d = addDays(today, i);
    const evs = eventsOn(d, state.events);
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : formatDateLong(d);
    lines.push(
      `- ${label}: ${evs.length ? evs.map((e) => `${e.title} (${e.kind}, ${formatClock(e.startMin)}, ${e.durationMin} min, ${e.intensity})`).join('; ') : 'rest day'}`,
    );
  }

  const plan = buildDayPlan(today, state.events, p);
  const log = state.logs[today];
  const next = nextWindow(plan, nowMin, (id) => !!log?.windows[id]);
  if (next) lines.push(`Next fuel window: ${next.title} at ${formatClock(next.startMin)} (for ${next.eventTitle}).`);

  const r = readiness(state.workoutLogs, state.events, today, now.getTime());
  lines.push(`Muscle readiness (0 = tired, 1 = fresh): ${MUSCLES.map((m) => `${MUSCLE_LABEL[m]} ${r[m]}`).join(', ')}`);

  const recent = state.workoutLogs.slice(0, 5);
  lines.push(`Recent workouts: ${recent.length ? recent.map((l) => `${l.date} ${l.name}${l.rpe ? ` (effort ${l.rpe}/10)` : ''}`).join('; ') : 'none logged yet'}`);
  lines.push(`Kitchen: ${pantryNames(state.pantry) || 'nothing listed'}`);
  return lines.join('\n');
}
