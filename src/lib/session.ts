import { buildSets, recommend } from './overload'
import { uid, type AppData, type SessionExercise, type Template, type WorkoutSession } from './types'

// Create a session, pre-filling each exercise with coached targets.
export function createSession(data: AppData, template?: Template): WorkoutSession {
  const exercises: SessionExercise[] = (template?.exercises ?? []).map(te => {
    const goal = data.profile.exerciseGoals.find(g => g.exerciseId === te.exerciseId)
    const rec = recommend(data, te.exerciseId, goal)
    // Template defines the set/rep skeleton; the engine supplies weight + pacing.
    const target = { sets: te.sets, reps: rec.reps, weight: rec.weight, rationale: rec.rationale }
    return {
      id: uid(),
      exerciseId: te.exerciseId,
      restSeconds: te.restSeconds,
      target,
      sets: buildSets(rec, te.sets, uid),
    }
  })
  return {
    id: uid(),
    name: template?.name ?? 'Freestyle Workout',
    startedAt: Date.now(),
    exercises,
    templateId: template?.id,
  }
}

// Add an exercise mid-workout, with a fresh recommendation.
export function addExerciseToSession(data: AppData, session: WorkoutSession, exerciseId: string): WorkoutSession {
  const goal = data.profile.exerciseGoals.find(g => g.exerciseId === exerciseId)
  const rec = recommend(data, exerciseId, goal)
  const ex: SessionExercise = {
    id: uid(),
    exerciseId,
    target: { sets: rec.sets, reps: rec.reps, weight: rec.weight, rationale: rec.rationale },
    sets: buildSets(rec, rec.sets, uid),
  }
  return { ...session, exercises: [...session.exercises, ex] }
}
