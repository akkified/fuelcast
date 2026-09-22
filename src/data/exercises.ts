// Exercise library. Cues are short coaching points, not a substitute for a coach.

export type Muscle = 'chest' | 'back' | 'shoulders' | 'arms' | 'core' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'cardio';
export type Equipment = 'bodyweight' | 'dumbbells' | 'barbell' | 'machine' | 'bands' | 'kettlebell';
export type ExerciseType = 'strength' | 'power' | 'conditioning' | 'mobility' | 'core';

export interface Exercise {
  id: string;
  name: string;
  muscles: Muscle[];
  secondary?: Muscle[];
  equipment: Equipment;
  type: ExerciseType;
  cue: string;
  /** Measured in seconds instead of reps. */
  timed?: boolean;
}

export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  cardio: 'Conditioning',
};

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  bodyweight: 'Bodyweight',
  dumbbells: 'Dumbbells',
  barbell: 'Barbell',
  machine: 'Machines',
  bands: 'Bands',
  kettlebell: 'Kettlebell',
};

export const EXERCISES: Exercise[] = [
  // Lower body – strength
  { id: 'goblet-squat', name: 'Goblet squat', muscles: ['quads', 'glutes'], secondary: ['core'], equipment: 'dumbbells', type: 'strength', cue: 'Hold the bell at your chest, sit between your heels, knees track over toes.' },
  { id: 'back-squat', name: 'Barbell back squat', muscles: ['quads', 'glutes'], secondary: ['core', 'hamstrings'], equipment: 'barbell', type: 'strength', cue: 'Brace before you descend, chest proud, drive the floor away.' },
  { id: 'bw-squat', name: 'Bodyweight squat', muscles: ['quads', 'glutes'], equipment: 'bodyweight', type: 'strength', cue: 'Arms forward, hips back and down, full foot on the floor.' },
  { id: 'split-squat', name: 'Split squat', muscles: ['quads', 'glutes'], secondary: ['hamstrings'], equipment: 'bodyweight', type: 'strength', cue: 'Long stance, back knee lowers straight down, front heel stays planted.' },
  { id: 'db-rdl', name: 'Dumbbell Romanian deadlift', muscles: ['hamstrings', 'glutes'], secondary: ['back'], equipment: 'dumbbells', type: 'strength', cue: 'Soft knees, push hips back, bells slide down your thighs, flat back.' },
  { id: 'trap-deadlift', name: 'Trap-bar deadlift', muscles: ['glutes', 'hamstrings', 'quads'], secondary: ['back', 'core'], equipment: 'barbell', type: 'strength', cue: 'Stand in the center, brace, push the floor away, finish tall.' },
  { id: 'hip-thrust', name: 'Hip thrust', muscles: ['glutes'], secondary: ['hamstrings'], equipment: 'bodyweight', type: 'strength', cue: 'Upper back on a bench, chin tucked, squeeze glutes at the top.' },
  { id: 'glute-bridge', name: 'Glute bridge', muscles: ['glutes'], secondary: ['hamstrings', 'core'], equipment: 'bodyweight', type: 'strength', cue: 'Heels close, press through heels, ribs down, pause at the top.' },
  { id: 'walking-lunge', name: 'Walking lunge', muscles: ['quads', 'glutes'], secondary: ['hamstrings'], equipment: 'dumbbells', type: 'strength', cue: 'Tall torso, soft back knee touch, step through with control.' },
  { id: 'step-up', name: 'Step-up', muscles: ['quads', 'glutes'], equipment: 'dumbbells', type: 'strength', cue: 'Whole foot on the box, drive through the top leg, no push from the back foot.' },
  { id: 'leg-press', name: 'Leg press', muscles: ['quads', 'glutes'], equipment: 'machine', type: 'strength', cue: 'Lower until hips start to tuck, press through mid-foot, never lock knees hard.' },
  { id: 'ham-curl', name: 'Hamstring curl', muscles: ['hamstrings'], equipment: 'machine', type: 'strength', cue: 'Hips pinned, curl smoothly, slow on the way back.' },
  { id: 'nordic', name: 'Nordic hamstring lower', muscles: ['hamstrings'], equipment: 'bodyweight', type: 'strength', cue: 'Anchor heels, lower as slowly as you can, catch with your hands.' },
  { id: 'calf-raise', name: 'Calf raise', muscles: ['calves'], equipment: 'bodyweight', type: 'strength', cue: 'Full range: deep stretch at the bottom, pause at the top.' },
  { id: 'single-leg-rdl', name: 'Single-leg RDL', muscles: ['hamstrings', 'glutes'], secondary: ['core'], equipment: 'dumbbells', type: 'strength', cue: 'Hips square to the floor, reach long, stand tall through the heel.' },
  { id: 'kb-swing', name: 'Kettlebell swing', muscles: ['glutes', 'hamstrings'], secondary: ['core', 'cardio'], equipment: 'kettlebell', type: 'power', cue: 'Hinge, not squat. Snap the hips so the bell floats to chest height.' },

  // Upper body – push
  { id: 'push-up', name: 'Push-up', muscles: ['chest'], secondary: ['shoulders', 'arms', 'core'], equipment: 'bodyweight', type: 'strength', cue: 'Straight line head to heels, elbows about 45°, chest to fist height.' },
  { id: 'db-bench', name: 'Dumbbell bench press', muscles: ['chest'], secondary: ['shoulders', 'arms'], equipment: 'dumbbells', type: 'strength', cue: 'Shoulder blades pinned, lower to the chest line, press up and slightly in.' },
  { id: 'bench-press', name: 'Barbell bench press', muscles: ['chest'], secondary: ['shoulders', 'arms'], equipment: 'barbell', type: 'strength', cue: 'Always use a spotter. Feet planted, touch mid-chest, press back over shoulders.' },
  { id: 'db-ohp', name: 'Dumbbell shoulder press', muscles: ['shoulders'], secondary: ['arms', 'core'], equipment: 'dumbbells', type: 'strength', cue: 'Ribs down, press overhead without arching your low back.' },
  { id: 'landmine-press', name: 'Landmine press', muscles: ['shoulders', 'chest'], secondary: ['core'], equipment: 'barbell', type: 'strength', cue: 'Staggered stance, press up and forward, shoulder-friendly angle.' },
  { id: 'dips', name: 'Bench dip', muscles: ['arms'], secondary: ['chest', 'shoulders'], equipment: 'bodyweight', type: 'strength', cue: 'Hands on the bench edge, shoulders away from ears, elbows back.' },
  { id: 'band-press', name: 'Band chest press', muscles: ['chest'], secondary: ['arms'], equipment: 'bands', type: 'strength', cue: 'Band behind your back, press out until arms are straight.' },

  // Upper body – pull
  { id: 'db-row', name: 'One-arm dumbbell row', muscles: ['back'], secondary: ['arms'], equipment: 'dumbbells', type: 'strength', cue: 'Flat back, pull the elbow toward your hip, pause at the top.' },
  { id: 'inverted-row', name: 'Inverted row', muscles: ['back'], secondary: ['arms', 'core'], equipment: 'bodyweight', type: 'strength', cue: 'Body in a plank, pull your chest to the bar or table edge.' },
  { id: 'pull-up', name: 'Pull-up (or assisted)', muscles: ['back'], secondary: ['arms'], equipment: 'bodyweight', type: 'strength', cue: 'Full hang to chin over bar. Use a band or machine for assistance.' },
  { id: 'lat-pulldown', name: 'Lat pulldown', muscles: ['back'], secondary: ['arms'], equipment: 'machine', type: 'strength', cue: 'Lean back slightly, pull to the upper chest, control the return.' },
  { id: 'band-pull-apart', name: 'Band pull-apart', muscles: ['back', 'shoulders'], equipment: 'bands', type: 'strength', cue: 'Straight arms, squeeze shoulder blades, band to the chest.' },
  { id: 'face-pull', name: 'Face pull', muscles: ['shoulders', 'back'], equipment: 'bands', type: 'strength', cue: 'Pull toward your eyes, elbows high, thumbs finish back.' },
  { id: 'db-curl', name: 'Dumbbell curl', muscles: ['arms'], equipment: 'dumbbells', type: 'strength', cue: 'Elbows by your sides, no swinging, slow lower.' },
  { id: 'barbell-row', name: 'Barbell row', muscles: ['back'], secondary: ['arms', 'hamstrings'], equipment: 'barbell', type: 'strength', cue: 'Hinge to about 45°, pull the bar to your lower ribs.' },

  // Power / speed
  { id: 'box-jump', name: 'Box jump', muscles: ['quads', 'glutes'], secondary: ['calves'], equipment: 'bodyweight', type: 'power', cue: 'Explode up, land softly and quietly, step down. Quality over height.' },
  { id: 'broad-jump', name: 'Broad jump', muscles: ['glutes', 'quads'], secondary: ['hamstrings'], equipment: 'bodyweight', type: 'power', cue: 'Big arm swing, jump far, stick the landing for 2 seconds.' },
  { id: 'squat-jump', name: 'Squat jump', muscles: ['quads', 'glutes'], secondary: ['calves'], equipment: 'bodyweight', type: 'power', cue: 'Quarter squat, jump as high as you can, land soft and reset.' },
  { id: 'skater-bound', name: 'Skater bound', muscles: ['glutes', 'quads'], secondary: ['calves'], equipment: 'bodyweight', type: 'power', cue: 'Bound side to side, stick each landing on one leg.' },
  { id: 'pogo-hop', name: 'Pogo hops', muscles: ['calves'], secondary: ['cardio'], equipment: 'bodyweight', type: 'power', cue: 'Stiff ankles, quick ground contacts, stay on the balls of your feet.', timed: true },
  { id: 'sprint', name: 'Acceleration sprint (20 m)', muscles: ['cardio', 'hamstrings'], secondary: ['glutes'], equipment: 'bodyweight', type: 'power', cue: 'Full recovery between reps. Lean, drive knees, fast arms.' },

  // Core
  { id: 'plank', name: 'Plank', muscles: ['core'], equipment: 'bodyweight', type: 'core', cue: 'Elbows under shoulders, squeeze glutes, breathe.', timed: true },
  { id: 'side-plank', name: 'Side plank', muscles: ['core'], secondary: ['shoulders'], equipment: 'bodyweight', type: 'core', cue: 'Stack feet, lift hips, straight line. Each side.', timed: true },
  { id: 'dead-bug', name: 'Dead bug', muscles: ['core'], equipment: 'bodyweight', type: 'core', cue: 'Low back pressed down, extend opposite arm and leg slowly.' },
  { id: 'bird-dog', name: 'Bird dog', muscles: ['core'], secondary: ['glutes', 'back'], equipment: 'bodyweight', type: 'core', cue: 'Reach long with opposite arm and leg, keep hips level.' },
  { id: 'pallof', name: 'Pallof press', muscles: ['core'], equipment: 'bands', type: 'core', cue: 'Band anchored to the side, press straight out and resist the twist.' },
  { id: 'hollow-hold', name: 'Hollow hold', muscles: ['core'], equipment: 'bodyweight', type: 'core', cue: 'Low back glued down, arms and legs long, shake is fine.', timed: true },
  { id: 'mountain-climber', name: 'Mountain climbers', muscles: ['core', 'cardio'], equipment: 'bodyweight', type: 'conditioning', cue: 'Hands under shoulders, drive knees fast, hips level.', timed: true },

  // Conditioning
  { id: 'jump-rope', name: 'Jump rope', muscles: ['cardio', 'calves'], equipment: 'bodyweight', type: 'conditioning', cue: 'Small, quick jumps, wrists turn the rope.', timed: true },
  { id: 'shuttle-run', name: 'Shuttle run (5-10-5)', muscles: ['cardio', 'quads'], equipment: 'bodyweight', type: 'conditioning', cue: 'Low hips on each cut, touch the line, explode out.' },
  { id: 'tempo-run', name: 'Tempo run', muscles: ['cardio'], equipment: 'bodyweight', type: 'conditioning', cue: 'Comfortably hard: you can say a few words, not a full sentence.', timed: true },
  { id: 'burpee', name: 'Burpee', muscles: ['cardio', 'chest'], secondary: ['quads', 'core'], equipment: 'bodyweight', type: 'conditioning', cue: 'Chest to floor, jump up tall, land soft.' },
  { id: 'bike-intervals', name: 'Bike intervals', muscles: ['cardio', 'quads'], equipment: 'machine', type: 'conditioning', cue: 'Hard for the work period, easy spin for the rest.', timed: true },

  // Mobility
  { id: 'worlds-greatest', name: "World's greatest stretch", muscles: ['hamstrings', 'glutes'], secondary: ['back'], equipment: 'bodyweight', type: 'mobility', cue: 'Lunge, elbow to instep, rotate and reach to the sky. Each side.' },
  { id: 'hip-9090', name: '90/90 hip switch', muscles: ['glutes'], equipment: 'bodyweight', type: 'mobility', cue: 'Sit tall, rotate both knees side to side slowly.' },
  { id: 'cat-cow', name: 'Cat-cow', muscles: ['back', 'core'], equipment: 'bodyweight', type: 'mobility', cue: 'Move one vertebra at a time, breathe with the motion.' },
  { id: 'couch-stretch', name: 'Couch stretch', muscles: ['quads'], equipment: 'bodyweight', type: 'mobility', cue: 'Back knee against a wall, squeeze glute, stay tall. Each side.', timed: true },
  { id: 'ankle-rocks', name: 'Ankle rocks', muscles: ['calves'], equipment: 'bodyweight', type: 'mobility', cue: 'Knee drives over toes, heel stays down.' },
  { id: 'thoracic-openers', name: 'Thoracic open books', muscles: ['back', 'shoulders'], equipment: 'bodyweight', type: 'mobility', cue: 'Lie on your side, rotate the top arm open, follow with your eyes.' },
  { id: 'foam-roll', name: 'Foam roll (legs + back)', muscles: ['quads', 'hamstrings', 'back'], equipment: 'bodyweight', type: 'mobility', cue: 'Slow passes, pause on tight spots, breathe.', timed: true },
];

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
