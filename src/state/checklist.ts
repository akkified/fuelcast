// Getting-started checklist for new athletes (shown on Today until done or hidden).

import type { AppState } from './store';

export interface ChecklistItem {
  id: 'schedule' | 'kitchen' | 'fuel' | 'workout' | 'form';
  label: string;
  hint: string;
  done: boolean;
  /** Where tapping the item goes. */
  href: string;
}

export function gettingStarted(state: Pick<AppState, 'events' | 'pantry' | 'logs' | 'workoutLogs' | 'formChecks'>): ChecklistItem[] {
  const loggedFuel = Object.values(state.logs).some((d) => Object.values(d.windows).some((w) => w.status === 'done'));
  return [
    { id: 'schedule', label: 'Add a practice or game', hint: 'Your fuel forecast is built from it.', done: state.events.length > 0, href: '/event' },
    { id: 'kitchen', label: 'Stock your kitchen', hint: 'Tap at least 5 foods you have.', done: state.pantry.length >= 5, href: '/fuel' },
    { id: 'fuel', label: 'Log a fuel window', hint: 'Open a window on Today and tap “I ate this.”', done: loggedFuel, href: '/' },
    { id: 'workout', label: 'Finish a workout', hint: 'Pick one Smart Coach recommends.', done: state.workoutLogs.length > 0, href: '/train' },
    { id: 'form', label: 'Try a Form Check', hint: 'Film a few squats and get instant feedback.', done: state.formChecks.length > 0, href: '/train?tab=form' },
  ];
}
