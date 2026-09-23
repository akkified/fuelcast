import { gettingStarted } from '../src/state/checklist';
import { initialState, migrate } from '../src/state/store';

describe('getting started checklist', () => {
  it('starts mostly unchecked and completes as the athlete uses the app', () => {
    const s = initialState();
    const first = gettingStarted(s);
    expect(first.map((i) => i.done)).toEqual([false, true, false, false, false]); // default kitchen has 8 foods
    const later = gettingStarted({
      ...s,
      events: [{ id: 'e', title: 'P', kind: 'practice', days: [1], startMin: 900, durationMin: 60, intensity: 'moderate' }],
      logs: { '2026-09-21': { windows: { 'e:topOff': { status: 'done', at: 0 } }, waterMl: 0, energy: {} } },
      workoutLogs: [{ id: 'w', workoutId: 'x', name: 'x', date: '2026-09-21', startedAt: 0, finishedAt: 1, sets: [] }],
      formChecks: [{ id: 'f', movement: 'squat', score: 90, date: '2026-09-21', at: 0, topCue: '', checks: [] }],
    });
    expect(later.every((i) => i.done)).toBe(true);
  });
});

describe('saved-data migration', () => {
  it('upgrades v1 data without losing anything', () => {
    const v1 = { version: 1, onboarded: true, profile: { name: 'A', sport: 'Soccer', units: 'metric', bottleMl: 500 }, events: [], pantry: ['banana'], logs: {}, demo: false };
    const m = migrate(v1)!;
    expect(m.version).toBe(2);
    expect(m.profile.name).toBe('A');
    expect(m.profile.units).toBe('metric');
    expect(m.profile.level).toBe('beginner');
    expect(m.pantry).toEqual(['banana']);
    expect(m.formChecks).toEqual([]);
    expect(m.ui).toEqual({});
  });
  it('rejects garbage and unknown versions', () => {
    expect(migrate(null)).toBeNull();
    expect(migrate({ version: 9, profile: {}, events: [], pantry: [] })).toBeNull();
  });
});
