import type { Exercise } from './types'

// Built-in exercise library, modeled on the Strong app's catalog.
export const EXERCISES: Exercise[] = [
  // Chest
  { id: 'bench-press', name: 'Bench Press (Barbell)', muscleGroup: 'Chest', equipment: 'Barbell' },
  { id: 'incline-bench-press', name: 'Incline Bench Press (Barbell)', muscleGroup: 'Chest', equipment: 'Barbell' },
  { id: 'db-bench-press', name: 'Bench Press (Dumbbell)', muscleGroup: 'Chest', equipment: 'Dumbbell' },
  { id: 'db-incline-press', name: 'Incline Press (Dumbbell)', muscleGroup: 'Chest', equipment: 'Dumbbell' },
  { id: 'chest-fly', name: 'Chest Fly (Dumbbell)', muscleGroup: 'Chest', equipment: 'Dumbbell' },
  { id: 'cable-fly', name: 'Cable Crossover', muscleGroup: 'Chest', equipment: 'Cable' },
  { id: 'push-up', name: 'Push Up', muscleGroup: 'Chest', equipment: 'Bodyweight' },
  { id: 'dips', name: 'Dips', muscleGroup: 'Chest', equipment: 'Bodyweight' },
  { id: 'machine-chest-press', name: 'Chest Press (Machine)', muscleGroup: 'Chest', equipment: 'Machine' },
  // Back
  { id: 'deadlift', name: 'Deadlift (Barbell)', muscleGroup: 'Back', equipment: 'Barbell' },
  { id: 'barbell-row', name: 'Bent Over Row (Barbell)', muscleGroup: 'Back', equipment: 'Barbell' },
  { id: 'pull-up', name: 'Pull Up', muscleGroup: 'Back', equipment: 'Bodyweight' },
  { id: 'chin-up', name: 'Chin Up', muscleGroup: 'Back', equipment: 'Bodyweight' },
  { id: 'lat-pulldown', name: 'Lat Pulldown (Cable)', muscleGroup: 'Back', equipment: 'Cable' },
  { id: 'seated-row', name: 'Seated Row (Cable)', muscleGroup: 'Back', equipment: 'Cable' },
  { id: 'db-row', name: 'One-Arm Row (Dumbbell)', muscleGroup: 'Back', equipment: 'Dumbbell' },
  { id: 't-bar-row', name: 'T-Bar Row', muscleGroup: 'Back', equipment: 'Barbell' },
  { id: 'rack-pull', name: 'Rack Pull', muscleGroup: 'Back', equipment: 'Barbell' },
  // Shoulders
  { id: 'overhead-press', name: 'Overhead Press (Barbell)', muscleGroup: 'Shoulders', equipment: 'Barbell' },
  { id: 'db-shoulder-press', name: 'Shoulder Press (Dumbbell)', muscleGroup: 'Shoulders', equipment: 'Dumbbell' },
  { id: 'lateral-raise', name: 'Lateral Raise (Dumbbell)', muscleGroup: 'Shoulders', equipment: 'Dumbbell' },
  { id: 'front-raise', name: 'Front Raise (Dumbbell)', muscleGroup: 'Shoulders', equipment: 'Dumbbell' },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly (Dumbbell)', muscleGroup: 'Shoulders', equipment: 'Dumbbell' },
  { id: 'face-pull', name: 'Face Pull (Cable)', muscleGroup: 'Shoulders', equipment: 'Cable' },
  { id: 'arnold-press', name: 'Arnold Press (Dumbbell)', muscleGroup: 'Shoulders', equipment: 'Dumbbell' },
  { id: 'upright-row', name: 'Upright Row (Barbell)', muscleGroup: 'Shoulders', equipment: 'Barbell' },
  // Biceps
  { id: 'barbell-curl', name: 'Bicep Curl (Barbell)', muscleGroup: 'Biceps', equipment: 'Barbell' },
  { id: 'db-curl', name: 'Bicep Curl (Dumbbell)', muscleGroup: 'Biceps', equipment: 'Dumbbell' },
  { id: 'hammer-curl', name: 'Hammer Curl (Dumbbell)', muscleGroup: 'Biceps', equipment: 'Dumbbell' },
  { id: 'preacher-curl', name: 'Preacher Curl', muscleGroup: 'Biceps', equipment: 'Machine' },
  { id: 'cable-curl', name: 'Cable Curl', muscleGroup: 'Biceps', equipment: 'Cable' },
  { id: 'incline-db-curl', name: 'Incline Curl (Dumbbell)', muscleGroup: 'Biceps', equipment: 'Dumbbell' },
  // Triceps
  { id: 'close-grip-bench', name: 'Close-Grip Bench Press', muscleGroup: 'Triceps', equipment: 'Barbell' },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown (Cable)', muscleGroup: 'Triceps', equipment: 'Cable' },
  { id: 'skullcrusher', name: 'Skullcrusher (Barbell)', muscleGroup: 'Triceps', equipment: 'Barbell' },
  { id: 'overhead-tricep-ext', name: 'Overhead Tricep Extension', muscleGroup: 'Triceps', equipment: 'Dumbbell' },
  { id: 'tricep-dip', name: 'Bench Dip', muscleGroup: 'Triceps', equipment: 'Bodyweight' },
  // Quads
  { id: 'squat', name: 'Squat (Barbell)', muscleGroup: 'Quads', equipment: 'Barbell' },
  { id: 'front-squat', name: 'Front Squat (Barbell)', muscleGroup: 'Quads', equipment: 'Barbell' },
  { id: 'leg-press', name: 'Leg Press (Machine)', muscleGroup: 'Quads', equipment: 'Machine' },
  { id: 'leg-extension', name: 'Leg Extension (Machine)', muscleGroup: 'Quads', equipment: 'Machine' },
  { id: 'goblet-squat', name: 'Goblet Squat (Dumbbell)', muscleGroup: 'Quads', equipment: 'Dumbbell' },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', muscleGroup: 'Quads', equipment: 'Dumbbell' },
  { id: 'lunge', name: 'Lunge (Dumbbell)', muscleGroup: 'Quads', equipment: 'Dumbbell' },
  { id: 'hack-squat', name: 'Hack Squat (Machine)', muscleGroup: 'Quads', equipment: 'Machine' },
  // Hamstrings
  { id: 'romanian-deadlift', name: 'Romanian Deadlift (Barbell)', muscleGroup: 'Hamstrings', equipment: 'Barbell' },
  { id: 'leg-curl', name: 'Leg Curl (Machine)', muscleGroup: 'Hamstrings', equipment: 'Machine' },
  { id: 'good-morning', name: 'Good Morning (Barbell)', muscleGroup: 'Hamstrings', equipment: 'Barbell' },
  { id: 'db-rdl', name: 'Romanian Deadlift (Dumbbell)', muscleGroup: 'Hamstrings', equipment: 'Dumbbell' },
  // Glutes
  { id: 'hip-thrust', name: 'Hip Thrust (Barbell)', muscleGroup: 'Glutes', equipment: 'Barbell' },
  { id: 'glute-kickback', name: 'Glute Kickback (Cable)', muscleGroup: 'Glutes', equipment: 'Cable' },
  { id: 'sumo-deadlift', name: 'Sumo Deadlift (Barbell)', muscleGroup: 'Glutes', equipment: 'Barbell' },
  // Calves
  { id: 'calf-raise', name: 'Standing Calf Raise', muscleGroup: 'Calves', equipment: 'Machine' },
  { id: 'seated-calf-raise', name: 'Seated Calf Raise', muscleGroup: 'Calves', equipment: 'Machine' },
  // Core
  { id: 'plank', name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight' },
  { id: 'crunch', name: 'Crunch', muscleGroup: 'Core', equipment: 'Bodyweight' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscleGroup: 'Core', equipment: 'Bodyweight' },
  { id: 'cable-crunch', name: 'Cable Crunch', muscleGroup: 'Core', equipment: 'Cable' },
  { id: 'russian-twist', name: 'Russian Twist', muscleGroup: 'Core', equipment: 'Bodyweight' },
  { id: 'ab-wheel', name: 'Ab Wheel Rollout', muscleGroup: 'Core', equipment: 'Other' },
  // Full body / cardio
  { id: 'clean-and-press', name: 'Clean and Press (Barbell)', muscleGroup: 'Full Body', equipment: 'Barbell' },
  { id: 'kettlebell-swing', name: 'Kettlebell Swing', muscleGroup: 'Full Body', equipment: 'Kettlebell' },
  { id: 'farmers-walk', name: "Farmer's Walk", muscleGroup: 'Full Body', equipment: 'Dumbbell' },
  { id: 'burpee', name: 'Burpee', muscleGroup: 'Cardio', equipment: 'Bodyweight' },
  { id: 'rowing-machine', name: 'Rowing (Machine)', muscleGroup: 'Cardio', equipment: 'Machine' },
]

export const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Full Body', 'Cardio',
] as const

export function exerciseById(id: string, custom: Exercise[] = []): Exercise | undefined {
  return EXERCISES.find(e => e.id === id) ?? custom.find(e => e.id === id)
}

export function allExercises(custom: Exercise[] = []): Exercise[] {
  return [...EXERCISES, ...custom].sort((a, b) => a.name.localeCompare(b.name))
}
