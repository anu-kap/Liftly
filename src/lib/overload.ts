import type { AppData, ExerciseGoal, Profile, SessionExercise, WorkoutSession } from './types'

// Epley estimated one-rep max. Reps capped at 12 — beyond that the formula loses meaning.
export function e1rm(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  return weight * (1 + Math.min(reps, 12) / 30)
}

// Weight needed to perform `reps` at a given e1RM (inverse Epley).
export function weightForReps(oneRm: number, reps: number): number {
  return oneRm / (1 + Math.min(reps, 12) / 30)
}

export interface ExercisePoint {
  date: number
  bestE1rm: number
  topWeight: number
  topReps: number          // reps achieved at topWeight
  totalVolume: number      // sum of weight * reps across working sets
  sets: number
}

// Chronological history of completed working sets for one exercise.
export function exerciseHistory(sessions: WorkoutSession[], exerciseId: string): ExercisePoint[] {
  const points: ExercisePoint[] = []
  for (const s of sessions) {
    if (!s.endedAt) continue
    for (const ex of s.exercises) {
      if (ex.exerciseId !== exerciseId) continue
      const working = ex.sets.filter(st => st.done && st.type !== 'warmup' && st.reps > 0)
      if (working.length === 0) continue
      const best = working.reduce((a, b) => (e1rm(b.weight, b.reps) > e1rm(a.weight, a.reps) ? b : a))
      const top = working.reduce((a, b) => (b.weight > a.weight ? b : a))
      points.push({
        date: s.endedAt,
        bestE1rm: Math.round(e1rm(best.weight, best.reps) * 10) / 10,
        topWeight: top.weight,
        topReps: top.reps,
        totalVolume: working.reduce((sum, st) => sum + st.weight * st.reps, 0),
        sets: working.length,
      })
    }
  }
  return points.sort((a, b) => a.date - b.date)
}

// Smallest practical weight jump for the user's unit.
export function increment(unit: 'lb' | 'kg'): number {
  return unit === 'lb' ? 5 : 2.5
}

export function roundToIncrement(weight: number, unit: 'lb' | 'kg'): number {
  const inc = unit === 'lb' ? 2.5 : 1.25
  return Math.round(weight / inc) * inc
}

export interface Recommendation {
  sets: number
  reps: number
  weight: number
  rationale: string
  onTrack?: boolean        // only when a goal exists
  paceNote?: string
}

// Rep ranges by training focus (double-progression scheme).
function repRange(focus: Profile['focus']): { low: number; high: number; sets: number } {
  switch (focus) {
    case 'strength': return { low: 3, high: 6, sets: 4 }
    case 'hypertrophy': return { low: 8, high: 12, sets: 3 }
    case 'general': return { low: 10, high: 15, sets: 3 }
  }
}

/**
 * Core coaching logic. Double progression toward the user's goal:
 *  - No history: start light (goal-derived or blank).
 *  - Hit the top of the rep range last time → add weight, drop to bottom of range.
 *  - Otherwise → same weight, +1 rep.
 * If a goal exists, compares the required e1RM pace against actual progress.
 */
export function recommend(
  data: AppData,
  exerciseId: string,
  goal?: ExerciseGoal,
): Recommendation {
  const { profile, sessions } = data
  const range = repRange(profile.focus)
  const history = exerciseHistory(sessions, exerciseId)
  const unit = profile.unit
  const inc = increment(unit)

  if (history.length === 0) {
    if (goal) {
      // Start at ~65% of the goal e1RM — a comfortable on-ramp.
      const startWeight = roundToIncrement(weightForReps(e1rm(goal.targetWeight, goal.targetReps), range.low) * 0.65, unit)
      return {
        sets: range.sets, reps: range.low, weight: Math.max(startWeight, inc),
        rationale: 'First session — starting at ~65% of your goal to build a base.',
      }
    }
    return { sets: range.sets, reps: range.low, weight: 0, rationale: 'First time — pick a weight you can lift with clean form.' }
  }

  const last = history[history.length - 1]
  let rec: Recommendation
  if (last.topReps >= range.high) {
    rec = {
      sets: range.sets, reps: range.low,
      weight: roundToIncrement(last.topWeight + inc, unit),
      rationale: `You hit ${last.topReps} reps @ ${last.topWeight} ${unit} — time to add weight.`,
    }
  } else {
    rec = {
      sets: range.sets,
      reps: Math.min(last.topReps + 1, range.high),
      weight: last.topWeight,
      rationale: `Last time: ${last.topReps} reps @ ${last.topWeight} ${unit}. Push for one more rep.`,
    }
  }

  if (goal) {
    const pace = goalPace(history, goal)
    rec.onTrack = pace.onTrack
    rec.paceNote = pace.note
    // Behind pace and already at top of range? Nudge the weight up instead.
    if (!pace.onTrack && rec.weight === last.topWeight && last.topReps >= range.high - 1) {
      rec.weight = roundToIncrement(last.topWeight + inc, unit)
      rec.reps = range.low
      rec.rationale = 'Behind goal pace — adding weight to catch up.'
    }
  }
  return rec
}

export interface GoalPace {
  onTrack: boolean
  note: string
  currentE1rm: number
  targetE1rm: number
  expectedE1rmToday: number   // where you "should" be today on a linear path
  pctComplete: number         // 0..1 progress from start toward target
}

export function goalPace(history: ExercisePoint[], goal: ExerciseGoal): GoalPace {
  const targetE1rm = e1rm(goal.targetWeight, goal.targetReps)
  const current = history.length ? history[history.length - 1].bestE1rm : 0
  const start = history.length ? history[0].bestE1rm : current
  const startDate = history.length ? history[0].date : Date.now()
  const targetDate = new Date(goal.targetDate + 'T12:00:00').getTime()
  const now = Date.now()

  const totalSpan = Math.max(targetDate - startDate, 1)
  const elapsed = Math.min(Math.max(now - startDate, 0), totalSpan)
  const expected = start + (targetE1rm - start) * (elapsed / totalSpan)
  const pct = targetE1rm > start ? Math.min(Math.max((current - start) / (targetE1rm - start), 0), 1) : 1
  const onTrack = current >= expected * 0.97 // 3% tolerance

  let note: string
  if (current >= targetE1rm) note = 'Goal reached! Set a new one 🎉'
  else if (now > targetDate) note = 'Goal date passed — consider extending the date.'
  else if (onTrack) note = `On track — ${Math.round(pct * 100)}% of the way there.`
  else note = `Slightly behind pace (${Math.round(pct * 100)}% there). Keep pushing.`

  return { onTrack, note, currentE1rm: current, targetE1rm, expectedE1rmToday: expected, pctComplete: pct }
}

// ---- Aggregate stats for dashboard / analytics ----

// Epoch ms for "N days ago" (clock read kept out of component render paths).
export function cutoffMs(days: number): number {
  return Date.now() - days * 24 * 3600 * 1000
}

export function sessionVolume(s: WorkoutSession): number {
  return s.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter(st => st.done && st.type !== 'warmup').reduce((v, st) => v + st.weight * st.reps, 0),
    0,
  )
}

export function sessionSets(s: WorkoutSession): number {
  return s.exercises.reduce((n, ex) => n + ex.sets.filter(st => st.done).length, 0)
}

export interface PR { exerciseId: string; weight: number; reps: number; e1rm: number; date: number }

// Sets in `session` that beat all prior history — personal records.
export function detectPRs(prior: WorkoutSession[], session: WorkoutSession): PR[] {
  const prs: PR[] = []
  for (const ex of session.exercises) {
    const hist = exerciseHistory(prior.filter(s => s.id !== session.id), ex.exerciseId)
    const bestBefore = hist.reduce((m, p) => Math.max(m, p.bestE1rm), 0)
    const working = ex.sets.filter(st => st.done && st.type !== 'warmup' && st.reps > 0)
    let best: PR | null = null
    for (const st of working) {
      const v = e1rm(st.weight, st.reps)
      if (v > bestBefore && (!best || v > best.e1rm)) {
        best = { exerciseId: ex.exerciseId, weight: st.weight, reps: st.reps, e1rm: Math.round(v * 10) / 10, date: session.endedAt ?? Date.now() }
      }
    }
    if (best) prs.push(best)
  }
  return prs
}

export function weeklyStreak(sessions: WorkoutSession[]): number {
  const completed = sessions.filter(s => s.endedAt).sort((a, b) => b.endedAt! - a.endedAt!)
  if (completed.length === 0) return 0
  const week = 7 * 24 * 3600 * 1000
  const weekIndex = (t: number) => Math.floor(t / week)
  const weeks = new Set(completed.map(s => weekIndex(s.endedAt!)))
  let streak = 0
  let w = weekIndex(Date.now())
  // Current week counts if trained; otherwise start from last week.
  if (!weeks.has(w)) w -= 1
  while (weeks.has(w)) { streak += 1; w -= 1 }
  return streak
}

// Muscle-group set counts over the trailing N days (for balance chart).
export function muscleSplit(sessions: WorkoutSession[], days: number, lookup: (id: string) => string | undefined): Record<string, number> {
  const cutoff = Date.now() - days * 24 * 3600 * 1000
  const out: Record<string, number> = {}
  for (const s of sessions) {
    if (!s.endedAt || s.endedAt < cutoff) continue
    for (const ex of s.exercises) {
      const mg = lookup(ex.exerciseId)
      if (!mg) continue
      out[mg] = (out[mg] ?? 0) + ex.sets.filter(st => st.done && st.type !== 'warmup').length
    }
  }
  return out
}

// Pre-fill a session exercise's sets from the recommendation.
export function buildSets(rec: Recommendation, makeId: () => string): SessionExercise['sets'] {
  return Array.from({ length: rec.sets }, () => ({
    id: makeId(), type: 'normal' as const, weight: rec.weight, reps: rec.reps, done: false,
  }))
}
