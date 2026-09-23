import { EXERCISE_BY_ID } from '../src/data/exercises';
import { analyzeForm, angleAt, cameraView, L, leanFromVertical, MOVEMENTS, movementForExercise, type Landmark, type PoseFrame } from '../src/engine/form';

type Pt = [number, number];

/** Build a 33-point pose; unspecified points sit at the center, and both sides get the same joint unless given. */
function pose(joints: Partial<Record<'shoulder' | 'elbow' | 'wrist' | 'hip' | 'knee' | 'ankle', Pt | [Pt, Pt]>>, visibility = 0.95): PoseFrame {
  const lm: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility }));
  for (const [name, v] of Object.entries(joints)) {
    const pair = (Array.isArray(v![0]) ? v : [v, v]) as [Pt, Pt];
    const idx = L[name as keyof typeof L] as readonly number[];
    idx.forEach((k, s) => (lm[k] = { x: pair[s][0], y: pair[s][1], z: 0, visibility }));
  }
  return { w: 1000, h: 1000, landmarks: lm };
}

describe('geometry', () => {
  it('measures angles and lean', () => {
    expect(Math.round(angleAt({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }))).toBe(90);
    expect(Math.round(angleAt({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }))).toBe(180);
    expect(Math.round(leanFromVertical({ x: 0, y: 0 }, { x: 0, y: 10 }))).toBe(0);
    expect(Math.round(leanFromVertical({ x: 10, y: 0 }, { x: 0, y: 10 }))).toBe(45);
  });
  it('maps exercises to form checks', () => {
    expect(movementForExercise('goblet-squat')?.id).toBe('squat');
    expect(movementForExercise('db-rdl')?.id).toBe('hinge');
    expect(movementForExercise('db-curl')).toBeUndefined();
    for (const m of MOVEMENTS) for (const id of m.exercises) expect(EXERCISE_BY_ID[id]).toBeDefined();
  });
});

describe('squat', () => {
  const top = pose({ shoulder: [0.5, 0.2], hip: [0.5, 0.5], knee: [0.52, 0.68], ankle: [0.5, 0.86] });
  const goodBottom = pose({ shoulder: [0.52, 0.35], hip: [0.45, 0.62], knee: [0.6, 0.62], ankle: [0.55, 0.85] });
  const shallowLean = pose({ shoulder: [0.75, 0.3], hip: [0.45, 0.5], knee: [0.5, 0.65], ankle: [0.5, 0.85] });

  it('grades the deepest frame of a clip and praises good form', () => {
    const r = analyzeForm('squat', [top, goodBottom, top]);
    expect(r.ok).toBe(true);
    expect(r.keyFrame).toBe(1);
    expect(r.checks.every((c) => c.status === 'good')).toBe(true);
    expect(r.score).toBe(100);
    expect(r.verdict).toBe('Great form');
  });

  it('flags a quarter squat with a dropping chest', () => {
    const r = analyzeForm('squat', [shallowLean]);
    expect(r.checks.find((c) => c.label === 'Depth')?.status).toBe('bad');
    expect(r.checks.find((c) => c.label === 'Chest position')?.status).toBe('warn');
    expect(r.score).toBeLessThan(65);
    expect(r.topCue).toMatch(/parallel/);
  });
});

describe('push-up', () => {
  it('detects sagging hips and shallow reps', () => {
    const sag = pose({ shoulder: [0.3, 0.5], elbow: [0.3, 0.6], wrist: [0.3, 0.7], hip: [0.55, 0.62], ankle: [0.8, 0.6] });
    const r = analyzeForm('pushup', [sag]);
    const line = r.checks.find((c) => c.label === 'Body line');
    expect(line?.status).not.toBe('good');
    expect(line?.detail).toMatch(/sag/i);
    expect(r.checks.find((c) => c.label === 'Depth')?.status).toBe('bad');
  });
  it('passes a straight, deep push-up', () => {
    const good = pose({ shoulder: [0.3, 0.6], elbow: [0.38, 0.62], wrist: [0.32, 0.7], hip: [0.55, 0.625], ankle: [0.8, 0.65] });
    expect(analyzeForm('pushup', [good]).score).toBe(100);
  });
});

describe('hinge and plank', () => {
  it('wants the hips back with soft knees', () => {
    const good = pose({ shoulder: [0.7, 0.45], hip: [0.4, 0.5], knee: [0.45, 0.68], ankle: [0.42, 0.86] });
    const squatty = pose({ shoulder: [0.55, 0.3], hip: [0.5, 0.55], knee: [0.62, 0.62], ankle: [0.55, 0.85] });
    expect(analyzeForm('hinge', [good]).checks.every((c) => c.status === 'good')).toBe(true);
    const r = analyzeForm('hinge', [squatty]);
    expect(r.checks.find((c) => c.label === 'Hip hinge')?.status).toBe('bad');
    expect(r.checks.find((c) => c.label === 'Knee bend')?.status).toBe('warn');
  });
  it('grades a plank on its median frame', () => {
    const straight = pose({ shoulder: [0.3, 0.6], elbow: [0.3, 0.7], hip: [0.55, 0.62], knee: [0.68, 0.63], ankle: [0.8, 0.64] });
    const piked = pose({ shoulder: [0.3, 0.6], elbow: [0.3, 0.7], hip: [0.55, 0.4], knee: [0.68, 0.52], ankle: [0.8, 0.64] });
    expect(analyzeForm('plank', [straight, straight, piked]).checks[0].status).toBe('good');
    expect(analyzeForm('plank', [piked, piked, straight]).checks[0].detail).toMatch(/piked/);
  });
});

describe('jump landing (front view)', () => {
  it('flags knees caving in', () => {
    const valgus = pose({
      hip: [[0.45, 0.5], [0.55, 0.5]],
      knee: [[0.49, 0.66], [0.51, 0.66]],
      ankle: [[0.42, 0.85], [0.58, 0.85]],
    });
    const r = analyzeForm('landing', [valgus]);
    expect(r.checks.find((c) => c.label === 'Knee alignment')?.status).toBe('bad');
    expect(r.topCue).toMatch(/knees/i);
  });
  it('passes aligned, soft landings and flags stiff ones', () => {
    const stand = pose({ hip: [[0.44, 0.45], [0.56, 0.45]], knee: [[0.43, 0.65], [0.57, 0.65]], ankle: [[0.43, 0.85], [0.57, 0.85]] });
    const soft = pose({ hip: [[0.44, 0.58], [0.56, 0.58]], knee: [[0.4, 0.7], [0.6, 0.7]], ankle: [[0.43, 0.85], [0.57, 0.85]] });
    const stiff = pose({ hip: [[0.44, 0.47], [0.56, 0.47]], knee: [[0.43, 0.66], [0.57, 0.66]], ankle: [[0.43, 0.85], [0.57, 0.85]] });
    const good = analyzeForm('landing', [stand, soft, stand]);
    expect(good.keyFrame).toBe(1);
    expect(good.checks.map((c) => c.status)).toEqual(['good', 'good']);
    const bad = analyzeForm('landing', [stand, stiff, stand]);
    expect(bad.checks.find((c) => c.label === 'Soft landing')?.status).toBe('bad');
  });
  it('skips the softness check on a single photo', () => {
    const soft = pose({ hip: [[0.44, 0.58], [0.56, 0.58]], knee: [[0.4, 0.7], [0.6, 0.7]], ankle: [[0.43, 0.85], [0.57, 0.85]] });
    expect(analyzeForm('landing', [soft]).checks.map((c) => c.label)).toEqual(['Knee alignment']);
  });
});

describe('camera angle', () => {
  it('recognizes side and front views and warns on a mismatch', () => {
    const side = pose({ shoulder: [0.5, 0.3], hip: [0.5, 0.55], knee: [0.55, 0.7], ankle: [0.5, 0.88] });
    const front = pose({
      shoulder: [[0.4, 0.3], [0.6, 0.3]],
      hip: [[0.44, 0.55], [0.56, 0.55]],
      knee: [[0.44, 0.7], [0.56, 0.7]],
      ankle: [[0.44, 0.88], [0.56, 0.88]],
    });
    expect(cameraView(side)).toBe('side');
    expect(cameraView(front)).toBe('front');
    expect(analyzeForm('squat', [side]).viewNote).toBeUndefined();
    expect(analyzeForm('squat', [front]).viewNote).toMatch(/side/);
    expect(analyzeForm('landing', [side]).viewNote).toMatch(/front/);
  });
});

describe('robustness', () => {
  it('explains what went wrong instead of guessing', () => {
    expect(analyzeForm('squat', []).ok).toBe(false);
    expect(analyzeForm('squat', [{ w: 100, h: 100, landmarks: null }]).message).toMatch(/whole body/);
    const hidden = pose({ shoulder: [0.5, 0.3], hip: [0.5, 0.5], knee: [0.5, 0.7], ankle: [0.5, 0.9] }, 0.1);
    const r = analyzeForm('squat', [hidden]);
    expect(r.ok).toBe(false);
    expect(r.framesWithPose).toBe(1);
  });
});
