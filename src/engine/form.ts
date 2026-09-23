// Form Check: grades exercise form from body landmarks.
//
// Pose landmarks come from MediaPipe Pose (33 points per frame, normalized 0–1,
// y pointing down), detected on the phone. This module is pure math: it picks the
// most informative frame, measures joint angles, and compares them with common
// strength-coaching cues. It's a coaching aid, not a medical assessment.

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface PoseFrame {
  /** Image size in pixels, so angles are measured without aspect-ratio distortion. */
  w: number;
  h: number;
  /** Seconds into the video (undefined for photos). */
  t?: number;
  landmarks: Landmark[] | null;
}

export type MovementId = 'squat' | 'pushup' | 'hinge' | 'lunge' | 'plank' | 'landing';
export type CheckStatus = 'good' | 'warn' | 'bad';

export interface Movement {
  id: MovementId;
  name: string;
  emoji: string;
  view: 'side' | 'front';
  /** What to record. */
  setup: string;
  /** Library exercises this check applies to. */
  exercises: string[];
}

export const MOVEMENTS: Movement[] = [
  {
    id: 'squat',
    name: 'Squat',
    emoji: '🏋️',
    view: 'side',
    setup: 'Film from the side, phone at hip height, whole body in frame. Do 2–3 slow reps.',
    exercises: ['bw-squat', 'goblet-squat', 'back-squat', 'squat-jump', 'leg-press'],
  },
  {
    id: 'pushup',
    name: 'Push-up',
    emoji: '💪',
    view: 'side',
    setup: 'Film from the side at floor level, head to feet in frame. Do 2–3 reps.',
    exercises: ['push-up', 'db-bench', 'band-press'],
  },
  {
    id: 'hinge',
    name: 'Hip hinge (RDL / deadlift)',
    emoji: '🦵',
    view: 'side',
    setup: 'Film from the side, whole body in frame. Hinge down 2–3 times, slowly.',
    exercises: ['db-rdl', 'trap-deadlift', 'single-leg-rdl', 'kb-swing'],
  },
  {
    id: 'lunge',
    name: 'Lunge / split squat',
    emoji: '🚶',
    view: 'side',
    setup: 'Film from the side, whole body in frame. Lower into 2–3 reps.',
    exercises: ['split-squat', 'walking-lunge', 'step-up'],
  },
  {
    id: 'plank',
    name: 'Plank',
    emoji: '🧱',
    view: 'side',
    setup: 'Film from the side at floor level. Hold for about 5 seconds.',
    exercises: ['plank', 'side-plank', 'mountain-climber'],
  },
  {
    id: 'landing',
    name: 'Jump landing (knee check)',
    emoji: '🦘',
    view: 'front',
    setup: 'Film from the FRONT, whole body in frame. Drop off a low box or jump in place and land softly 2–3 times.',
    exercises: ['box-jump', 'squat-jump', 'broad-jump', 'skater-bound'],
  },
];

export const MOVEMENT_BY_ID = Object.fromEntries(MOVEMENTS.map((m) => [m.id, m])) as Record<MovementId, Movement>;

export function movementForExercise(exerciseId: string): Movement | undefined {
  return MOVEMENTS.find((m) => m.exercises.includes(exerciseId));
}

export interface FormCheck {
  label: string;
  status: CheckStatus;
  detail: string;
  /** Measured value, e.g. "92°". */
  value?: string;
}

export interface FormReport {
  ok: boolean;
  movement: MovementId;
  score: number;
  verdict: string;
  checks: FormCheck[];
  /** The single most useful cue. */
  topCue: string;
  /** Index of the frame the grade is based on. */
  keyFrame: number;
  framesWithPose: number;
  message?: string;
  /** Set when the clip seems filmed from the wrong angle for this movement. */
  viewNote?: string;
}

// MediaPipe Pose landmark indices.
export const L = {
  nose: 0,
  shoulder: [11, 12],
  elbow: [13, 14],
  wrist: [15, 16],
  hip: [23, 24],
  knee: [25, 26],
  ankle: [27, 28],
} as const;

interface P {
  x: number;
  y: number;
}

const toPx = (f: PoseFrame, i: number): P => ({ x: f.landmarks![i].x * f.w, y: f.landmarks![i].y * f.h });
const vis = (f: PoseFrame, i: number) => f.landmarks?.[i]?.visibility ?? 1;

/** Angle ABC in degrees (0–180). */
export function angleAt(a: P, b: P, c: P): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
  if (mag === 0) return 180;
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
}

/** Lean of the segment bottom→top away from vertical, in degrees (0 = upright, 90 = horizontal). */
export function leanFromVertical(top: P, bottom: P): number {
  const dx = top.x - bottom.x;
  const dy = bottom.y - top.y; // up is positive
  return (Math.atan2(Math.abs(dx), dy) * 180) / Math.PI;
}

/** Which side (0 = left, 1 = right) the camera sees best. */
function bestSide(f: PoseFrame): 0 | 1 {
  const score = (s: 0 | 1) => [L.shoulder[s], L.hip[s], L.knee[s], L.ankle[s], L.elbow[s]].reduce((sum, i) => sum + vis(f, i), 0);
  return score(0) >= score(1) ? 0 : 1;
}

function sideJoints(f: PoseFrame) {
  const s = bestSide(f);
  return {
    side: s,
    shoulder: toPx(f, L.shoulder[s]),
    elbow: toPx(f, L.elbow[s]),
    wrist: toPx(f, L.wrist[s]),
    hip: toPx(f, L.hip[s]),
    knee: toPx(f, L.knee[s]),
    ankle: toPx(f, L.ankle[s]),
    visible: [L.shoulder[s], L.hip[s], L.knee[s], L.ankle[s]].every((i) => vis(f, i) >= 0.5),
  };
}

const deg = (n: number) => `${Math.round(n)}°`;
const WEIGHT: Record<CheckStatus, number> = { good: 100, warn: 60, bad: 20 };

function finish(movement: MovementId, checks: FormCheck[], keyFrame: number, framesWithPose: number, cues: Record<string, string>): FormReport {
  const score = Math.round(checks.reduce((s, c) => s + WEIGHT[c.status], 0) / checks.length);
  const worst = [...checks].sort((a, b) => WEIGHT[a.status] - WEIGHT[b.status])[0];
  const topCue = worst.status === 'good' ? cues.good : cues[worst.label] ?? worst.detail;
  const verdict = score >= 85 ? 'Great form' : score >= 65 ? 'Solid, with one thing to fix' : 'Let’s clean this up';
  return { ok: true, movement, score, verdict, checks, topCue, keyFrame, framesWithPose };
}

function fail(movement: MovementId, message: string, framesWithPose = 0): FormReport {
  return { ok: false, movement, score: 0, verdict: 'Couldn’t grade this one', checks: [], topCue: message, keyFrame: 0, framesWithPose, message };
}

/** Index of the frame that minimizes f(frame); only frames with usable poses count. */
function pickFrame(frames: PoseFrame[], usable: (f: PoseFrame) => boolean, metric: (f: PoseFrame) => number): number {
  let best = -1;
  let bestVal = Infinity;
  frames.forEach((f, i) => {
    if (!f.landmarks || !usable(f)) return;
    const v = metric(f);
    if (v < bestVal) {
      bestVal = v;
      best = i;
    }
  });
  return best;
}

// ---------------- Movement rules ----------------

function squat(frames: PoseFrame[], n: number): FormReport {
  const usable = (f: PoseFrame) => sideJoints(f).visible;
  // Bottom of the squat = smallest knee angle.
  const i = pickFrame(frames, usable, (f) => {
    const j = sideJoints(f);
    return angleAt(j.hip, j.knee, j.ankle);
  });
  if (i < 0) return fail('squat', 'I couldn’t see your hips, knees and ankles clearly. Film from the side with your whole body in frame.', n);
  const j = sideJoints(frames[i]);
  const knee = angleAt(j.hip, j.knee, j.ankle);
  const lean = leanFromVertical(j.shoulder, j.hip);
  const thigh = Math.hypot(j.knee.x - j.hip.x, j.knee.y - j.hip.y);
  const hipBelowKnee = j.hip.y >= j.knee.y - 0.05 * thigh;

  const checks: FormCheck[] = [
    knee <= 100 || hipBelowKnee
      ? { label: 'Depth', status: 'good', detail: 'Thighs reached parallel or lower.', value: deg(knee) }
      : knee <= 120
        ? { label: 'Depth', status: 'warn', detail: 'Almost parallel. Sit a little lower if it’s pain-free.', value: deg(knee) }
        : { label: 'Depth', status: 'bad', detail: 'Quarter squat. Aim for thighs parallel to the floor.', value: deg(knee) },
    lean <= 45
      ? { label: 'Chest position', status: 'good', detail: 'Chest stays proud through the bottom.', value: deg(lean) }
      : lean <= 60
        ? { label: 'Chest position', status: 'warn', detail: 'Leaning forward a bit. Brace and keep your chest up.', value: deg(lean) }
        : { label: 'Chest position', status: 'bad', detail: 'Chest is dropping a lot. Lighten the load and stay tall.', value: deg(lean) },
  ];
  return finish('squat', checks, i, n, {
    good: 'Great squat. Keep that depth and posture as the weight goes up.',
    Depth: 'Sit your hips down between your heels until your thighs are parallel.',
    'Chest position': 'Brace your core and keep your chest proud, like a logo on your shirt facing forward.',
  });
}

function pushup(frames: PoseFrame[], n: number): FormReport {
  const usable = (f: PoseFrame) => {
    const j = sideJoints(f);
    return j.visible && vis(f, L.elbow[j.side]) >= 0.5;
  };
  const i = pickFrame(frames, usable, (f) => {
    const j = sideJoints(f);
    return angleAt(j.shoulder, j.elbow, j.wrist);
  });
  if (i < 0) return fail('pushup', 'I couldn’t see your shoulder, elbow, hip and ankle. Film from the side at floor level.', n);
  const j = sideJoints(frames[i]);
  const elbow = angleAt(j.shoulder, j.elbow, j.wrist);
  const line = angleAt(j.shoulder, j.hip, j.ankle);
  // Is the hip below (sag) or above (pike) the shoulder–ankle line?
  const t = (j.hip.x - j.shoulder.x) / ((j.ankle.x - j.shoulder.x) || 1);
  const lineY = j.shoulder.y + t * (j.ankle.y - j.shoulder.y);
  const sag = j.hip.y > lineY;

  const checks: FormCheck[] = [
    line >= 165
      ? { label: 'Body line', status: 'good', detail: 'Straight line from head to heels.', value: deg(line) }
      : line >= 150
        ? { label: 'Body line', status: 'warn', detail: sag ? 'Hips sagging a little. Squeeze your glutes.' : 'Hips a little high. Lower them into a straight line.', value: deg(line) }
        : { label: 'Body line', status: 'bad', detail: sag ? 'Hips are sagging. Squeeze glutes and brace your abs.' : 'Hips are piked up. Bring them down into a plank.', value: deg(line) },
    elbow <= 100
      ? { label: 'Depth', status: 'good', detail: 'Elbows bent to 90° or more.', value: deg(elbow) }
      : elbow <= 120
        ? { label: 'Depth', status: 'warn', detail: 'Go a bit lower: chest toward fist height.', value: deg(elbow) }
        : { label: 'Depth', status: 'bad', detail: 'Very shallow. Use an incline (hands on a bench) to get full range.', value: deg(elbow) },
  ];
  return finish('pushup', checks, i, n, {
    good: 'Strong push-ups. Add reps or slow the lowering to progress.',
    'Body line': 'Squeeze your glutes and abs so you move like one solid plank.',
    Depth: 'Lower until your elbows hit 90°. Elevate your hands if you need to.',
  });
}

function hinge(frames: PoseFrame[], n: number): FormReport {
  const usable = (f: PoseFrame) => sideJoints(f).visible;
  // Bottom of the hinge = most forward torso lean.
  const i = pickFrame(frames, usable, (f) => {
    const j = sideJoints(f);
    return -leanFromVertical(j.shoulder, j.hip);
  });
  if (i < 0) return fail('hinge', 'I couldn’t see your shoulders, hips and knees. Film from the side with your whole body in frame.', n);
  const j = sideJoints(frames[i]);
  const lean = leanFromVertical(j.shoulder, j.hip);
  const knee = angleAt(j.hip, j.knee, j.ankle);

  const checks: FormCheck[] = [
    lean >= 45
      ? { label: 'Hip hinge', status: 'good', detail: 'Good hinge: hips pushed back, torso tipped forward.', value: deg(lean) }
      : lean >= 30
        ? { label: 'Hip hinge', status: 'warn', detail: 'Push your hips back further to load your hamstrings.', value: deg(lean) }
        : { label: 'Hip hinge', status: 'bad', detail: 'Barely hinging. Push your hips back like closing a car door with your butt.', value: deg(lean) },
    knee >= 135 && knee <= 175
      ? { label: 'Knee bend', status: 'good', detail: 'Soft knees: the hips do the work.', value: deg(knee) }
      : knee < 135
        ? { label: 'Knee bend', status: 'warn', detail: 'Knees bending a lot. That turns it into a squat.', value: deg(knee) }
        : { label: 'Knee bend', status: 'warn', detail: 'Knees locked straight. Keep a slight bend.', value: deg(knee) },
  ];
  return finish('hinge', checks, i, n, {
    good: 'Nice hinge. Keep your back flat and the weight close to your legs.',
    'Hip hinge': 'Push your hips back and let your torso tip forward with a flat back.',
    'Knee bend': 'Keep a soft, fixed bend in your knees and move from your hips.',
  });
}

function lunge(frames: PoseFrame[], n: number): FormReport {
  const bothLegs = (f: PoseFrame) => [L.hip[0], L.hip[1], L.knee[0], L.knee[1], L.ankle[0], L.ankle[1]].every((k) => vis(f, k) >= 0.4);
  const legAngles = (f: PoseFrame) => [0, 1].map((s) => angleAt(toPx(f, L.hip[s]), toPx(f, L.knee[s]), toPx(f, L.ankle[s])));
  // Bottom = lowest hip.
  const i = pickFrame(frames, bothLegs, (f) => -(toPx(f, L.hip[0]).y + toPx(f, L.hip[1]).y));
  if (i < 0) return fail('lunge', 'I couldn’t see both legs. Film from the side with your whole body in frame.', n);
  const f = frames[i];
  // Front leg = the one whose ankle is further ahead of the hips... use the smaller knee angle (it's the working leg).
  const angles = legAngles(f);
  const front = angles[0] <= angles[1] ? 0 : 1;
  const frontKnee = angles[front];
  const midShoulder = { x: (toPx(f, L.shoulder[0]).x + toPx(f, L.shoulder[1]).x) / 2, y: (toPx(f, L.shoulder[0]).y + toPx(f, L.shoulder[1]).y) / 2 };
  const midHip = { x: (toPx(f, L.hip[0]).x + toPx(f, L.hip[1]).x) / 2, y: (toPx(f, L.hip[0]).y + toPx(f, L.hip[1]).y) / 2 };
  const lean = leanFromVertical(midShoulder, midHip);

  const checks: FormCheck[] = [
    frontKnee >= 75 && frontKnee <= 110
      ? { label: 'Front knee', status: 'good', detail: 'Front knee near 90° at the bottom.', value: deg(frontKnee) }
      : frontKnee > 110
        ? { label: 'Front knee', status: frontKnee > 130 ? 'bad' : 'warn', detail: 'Not deep enough. Lower your back knee toward the floor.', value: deg(frontKnee) }
        : { label: 'Front knee', status: 'warn', detail: 'Very deep front knee. Lengthen your stance a little.', value: deg(frontKnee) },
    lean <= 20
      ? { label: 'Torso', status: 'good', detail: 'Tall torso over the hips.', value: deg(lean) }
      : lean <= 35
        ? { label: 'Torso', status: 'warn', detail: 'Leaning forward a bit. Stay tall.', value: deg(lean) }
        : { label: 'Torso', status: 'bad', detail: 'Leaning far forward. Slow down and stay upright.', value: deg(lean) },
  ];
  return finish('lunge', checks, i, n, {
    good: 'Solid lunge. Add load or slow the lowering to progress.',
    'Front knee': 'Drop your back knee straight down until your front knee is near 90°.',
    Torso: 'Keep your chest tall, stacked over your hips.',
  });
}

function plank(frames: PoseFrame[], n: number): FormReport {
  const usable = (f: PoseFrame) => sideJoints(f).visible;
  const good = frames.map((f, i) => ({ f, i })).filter(({ f }) => f.landmarks && usable(f));
  if (good.length === 0) return fail('plank', 'I couldn’t see your shoulders, hips and ankles. Film from the side at floor level.', n);
  // Grade the frame with the median body line (robust to one odd frame).
  const lines = good.map(({ f, i }) => {
    const j = sideJoints(f);
    return { i, line: angleAt(j.shoulder, j.hip, j.ankle) };
  });
  lines.sort((a, b) => a.line - b.line);
  const mid = lines[Math.floor(lines.length / 2)];
  const j = sideJoints(frames[mid.i]);
  const t = (j.hip.x - j.shoulder.x) / ((j.ankle.x - j.shoulder.x) || 1);
  const sag = j.hip.y > j.shoulder.y + t * (j.ankle.y - j.shoulder.y);
  const torso = Math.hypot(j.hip.x - j.shoulder.x, j.hip.y - j.shoulder.y) || 1;
  const elbowOffset = Math.abs(j.elbow.x - j.shoulder.x) / torso;

  const checks: FormCheck[] = [
    mid.line >= 165
      ? { label: 'Body line', status: 'good', detail: 'Straight from shoulders to ankles.', value: deg(mid.line) }
      : mid.line >= 150
        ? { label: 'Body line', status: 'warn', detail: sag ? 'Hips dipping slightly.' : 'Hips a little high.', value: deg(mid.line) }
        : { label: 'Body line', status: 'bad', detail: sag ? 'Hips sagging. That strains your low back.' : 'Hips piked up. Lower them into a line.', value: deg(mid.line) },
    elbowOffset <= 0.25
      ? { label: 'Elbows under shoulders', status: 'good', detail: 'Elbows stacked under your shoulders.' }
      : { label: 'Elbows under shoulders', status: 'warn', detail: 'Move your elbows directly under your shoulders.' },
  ];
  return finish('plank', checks, mid.i, n, {
    good: 'Rock-solid plank. Try longer holds or a side plank next.',
    'Body line': 'Squeeze glutes, tuck your ribs down, and make one straight line.',
    'Elbows under shoulders': 'Stack your elbows right under your shoulders.',
  });
}

function landing(frames: PoseFrame[], n: number): FormReport {
  const need = [...L.hip, ...L.knee, ...L.ankle];
  const usable = (f: PoseFrame) => need.every((k) => vis(f, k) >= 0.5);
  const hipY = (f: PoseFrame) => (toPx(f, L.hip[0]).y + toPx(f, L.hip[1]).y) / 2;
  const ankleY = (f: PoseFrame) => (toPx(f, L.ankle[0]).y + toPx(f, L.ankle[1]).y) / 2;
  // From the front, knee bend points at the camera, so we use hip drop (not a 2D knee angle):
  // the landing is the frame where the hips are lowest relative to the ankles.
  const hipHeight = (f: PoseFrame) => ankleY(f) - hipY(f);
  const i = pickFrame(frames, usable, hipHeight);
  if (i < 0) return fail('landing', 'I couldn’t see both hips, knees and ankles. Film from the front with your whole body in frame.', n);
  const f = frames[i];
  const kneeGap = Math.abs(toPx(f, L.knee[0]).x - toPx(f, L.knee[1]).x);
  const ankleGap = Math.abs(toPx(f, L.ankle[0]).x - toPx(f, L.ankle[1]).x) || 1;
  // Knee-to-ankle separation ratio: below ~0.8 means the knees are caving in (valgus).
  const ratio = kneeGap / ankleGap;

  const checks: FormCheck[] = [
    ratio >= 0.8
      ? { label: 'Knee alignment', status: 'good', detail: 'Knees stay over your feet as you land.', value: ratio.toFixed(2) }
      : ratio >= 0.6
        ? { label: 'Knee alignment', status: 'warn', detail: 'Knees drifting inward. Push them out over your toes.', value: ratio.toFixed(2) }
        : { label: 'Knee alignment', status: 'bad', detail: 'Knees caving in (valgus), a common ACL-injury pattern. Practice slow, controlled landings.', value: ratio.toFixed(2) },
  ];

  // Softness needs a standing frame to compare against, so it's graded on videos only.
  const heights = frames.filter((x) => x.landmarks && usable(x)).map(hipHeight);
  if (heights.length >= 3) {
    const standing = Math.max(...heights);
    const drop = standing > 0 ? 1 - hipHeight(f) / standing : 0;
    const pct = `${Math.round(drop * 100)}%`;
    checks.push(
      drop >= 0.15
        ? { label: 'Soft landing', status: 'good', detail: 'You absorb the landing by bending your knees and hips.', value: pct }
        : drop >= 0.08
          ? { label: 'Soft landing', status: 'warn', detail: 'A bit stiff. Sink your hips more as you land.', value: pct }
          : { label: 'Soft landing', status: 'bad', detail: 'Stiff landing. Bend your knees and hips to absorb force.', value: pct },
    );
  }
  return finish('landing', checks, i, n, {
    good: 'Safe, athletic landings. Keep them quiet and controlled.',
    'Knee alignment': 'Land with your knees pushed out over your toes, never caving in.',
    'Soft landing': 'Land quietly: bend your knees and hips like a spring.',
  });
}

const RULES: Record<MovementId, (frames: PoseFrame[], framesWithPose: number) => FormReport> = {
  squat,
  pushup,
  hinge,
  lunge,
  plank,
  landing,
};

/**
 * Rough camera angle from shoulder and hip width compared with torso length. From the
 * side, left and right joints overlap (narrow); from the front or back they're wide.
 */
export function viewRatio(f: PoseFrame): number {
  if (!f.landmarks) return NaN;
  const sh = [toPx(f, L.shoulder[0]), toPx(f, L.shoulder[1])];
  const hp = [toPx(f, L.hip[0]), toPx(f, L.hip[1])];
  const mid = (a: P, b: P) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const torso = Math.hypot(mid(sh[0], sh[1]).x - mid(hp[0], hp[1]).x, mid(sh[0], sh[1]).y - mid(hp[0], hp[1]).y) || 1;
  const width = (Math.abs(sh[0].x - sh[1].x) + Math.abs(hp[0].x - hp[1].x)) / 2;
  return width / torso;
}

export function cameraView(f: PoseFrame): 'side' | 'front' | 'unclear' {
  const ratio = viewRatio(f);
  if (!Number.isFinite(ratio)) return 'unclear';
  // Calibrated on real photos: side views measure ~0.15, front/back views ~0.40.
  if (ratio < 0.25) return 'side';
  if (ratio > 0.32) return 'front';
  return 'unclear';
}

export function analyzeForm(movement: MovementId, frames: PoseFrame[]): FormReport {
  const withPose = frames.filter((f) => f.landmarks && f.landmarks.length >= 33).length;
  if (frames.length === 0) return fail(movement, 'No frames to analyze. Try recording again.');
  if (withPose === 0) return fail(movement, 'I couldn’t find a person in this clip. Make sure your whole body is in frame with good light.');
  const cleaned = frames.map((f) => (f.landmarks && f.landmarks.length >= 33 ? f : { ...f, landmarks: null }));
  const report = RULES[movement](cleaned, withPose);
  if (report.ok) {
    const want = MOVEMENT_BY_ID[movement].view;
    const got = cameraView(cleaned[report.keyFrame]);
    // Planks and push-ups are horizontal, so the width/torso test doesn't apply to them.
    const horizontal = movement === 'plank' || movement === 'pushup';
    if (!horizontal && want === 'side' && got === 'front') {
      report.viewNote = 'This looks like a front or back view. Angles are most accurate when you film from the side, so treat this grade as a rough guide.';
    } else if (want === 'front' && got === 'side') {
      report.viewNote = 'This looks like a side view. Film from the front so I can check whether your knees cave in.';
    }
  }
  return report;
}
