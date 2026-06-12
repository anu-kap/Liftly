export type MuscleGroup =
  | 'Chest' | 'Back' | 'Shoulders' | 'Biceps' | 'Triceps'
  | 'Quads' | 'Hamstrings' | 'Glutes' | 'Calves' | 'Core' | 'Full Body' | 'Cardio'

export type Equipment = 'Barbell' | 'Dumbbell' | 'Machine' | 'Cable' | 'Bodyweight' | 'Kettlebell' | 'Other'

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  equipment: Equipment
  isCustom?: boolean
}

export type SetType = 'normal' | 'warmup' | 'failure' | 'drop'

export interface SetEntry {
  id: string
  type: SetType
  weight: number          // in user's unit
  reps: number
  done: boolean
  // What this specific set must hit for progressive overload (vs last session)
  target?: { weight: number; reps: number }
}

export interface SessionExercise {
  id: string
  exerciseId: string
  sets: SetEntry[]
  restSeconds?: number    // per-exercise rest override
  note?: string
  // Coaching target computed when the workout starts
  target?: { sets: number; reps: number; weight: number; rationale: string }
}

export interface WorkoutSession {
  id: string
  name: string
  startedAt: number       // epoch ms
  endedAt?: number        // undefined while in progress
  exercises: SessionExercise[]
  templateId?: string
  note?: string
}

export interface TemplateExercise {
  exerciseId: string
  sets: number
  reps: number            // target reps per set
  restSeconds?: number
}

export interface Template {
  id: string
  name: string
  exercises: TemplateExercise[]
  lastUsedAt?: number
}

export type GoalFocus = 'strength' | 'hypertrophy' | 'general'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export interface ExerciseGoal {
  exerciseId: string
  targetWeight: number
  targetReps: number
  targetDate: string      // yyyy-MM-dd
}

export interface Profile {
  onboarded: boolean
  displayName?: string
  focus: GoalFocus
  experience: ExperienceLevel
  daysPerWeek: number
  unit: 'lb' | 'kg'
  defaultRestSeconds: number
  exerciseGoals: ExerciseGoal[]
}

export interface AppData {
  profile: Profile
  sessions: WorkoutSession[]
  templates: Template[]
  customExercises: Exercise[]
  activeSession: WorkoutSession | null
}

export const defaultProfile: Profile = {
  onboarded: false,
  focus: 'hypertrophy',
  experience: 'beginner',
  daysPerWeek: 3,
  unit: 'lb',
  defaultRestSeconds: 120,
  exerciseGoals: [],
}

export const emptyData: AppData = {
  profile: defaultProfile,
  sessions: [],
  templates: [],
  customExercises: [],
  activeSession: null,
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
