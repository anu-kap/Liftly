import type { GoalFocus, Profile, Template, TemplateExercise } from './types'
import { uid } from './types'

// Goal-driven workout plan generator. Produces editable templates based on
// days/week and training focus, weighted toward exercises the user has goals for.

interface Slot { exerciseId: string }

function reps(focus: GoalFocus, compound: boolean): { sets: number; reps: number } {
  if (focus === 'strength') return compound ? { sets: 4, reps: 5 } : { sets: 3, reps: 8 }
  if (focus === 'hypertrophy') return compound ? { sets: 3, reps: 8 } : { sets: 3, reps: 12 }
  return compound ? { sets: 3, reps: 10 } : { sets: 3, reps: 15 }
}

const COMPOUNDS = new Set([
  'squat', 'deadlift', 'bench-press', 'overhead-press', 'barbell-row', 'pull-up',
  'front-squat', 'romanian-deadlift', 'hip-thrust', 'incline-bench-press', 'leg-press',
  'close-grip-bench', 'sumo-deadlift', 'lat-pulldown', 'db-bench-press', 'chin-up',
])

const PLANS: Record<string, Record<number, { name: string; slots: Slot[] }[]>> = {
  // Full-body for low frequency, upper/lower for 4, PPL for 5-6.
  any: {
    2: [
      { name: 'Full Body A', slots: ['squat', 'bench-press', 'barbell-row', 'plank'].map(e => ({ exerciseId: e })) },
      { name: 'Full Body B', slots: ['deadlift', 'overhead-press', 'lat-pulldown', 'lunge'].map(e => ({ exerciseId: e })) },
    ],
    3: [
      { name: 'Full Body A', slots: ['squat', 'bench-press', 'barbell-row', 'plank'].map(e => ({ exerciseId: e })) },
      { name: 'Full Body B', slots: ['deadlift', 'overhead-press', 'pull-up', 'lateral-raise'].map(e => ({ exerciseId: e })) },
      { name: 'Full Body C', slots: ['front-squat', 'db-incline-press', 'seated-row', 'barbell-curl', 'tricep-pushdown'].map(e => ({ exerciseId: e })) },
    ],
    4: [
      { name: 'Upper A', slots: ['bench-press', 'barbell-row', 'overhead-press', 'barbell-curl', 'tricep-pushdown'].map(e => ({ exerciseId: e })) },
      { name: 'Lower A', slots: ['squat', 'romanian-deadlift', 'leg-extension', 'calf-raise', 'plank'].map(e => ({ exerciseId: e })) },
      { name: 'Upper B', slots: ['incline-bench-press', 'lat-pulldown', 'db-shoulder-press', 'hammer-curl', 'skullcrusher'].map(e => ({ exerciseId: e })) },
      { name: 'Lower B', slots: ['deadlift', 'leg-press', 'leg-curl', 'hip-thrust', 'hanging-leg-raise'].map(e => ({ exerciseId: e })) },
    ],
    5: [
      { name: 'Push', slots: ['bench-press', 'overhead-press', 'db-incline-press', 'lateral-raise', 'tricep-pushdown'].map(e => ({ exerciseId: e })) },
      { name: 'Pull', slots: ['deadlift', 'pull-up', 'seated-row', 'face-pull', 'barbell-curl'].map(e => ({ exerciseId: e })) },
      { name: 'Legs', slots: ['squat', 'romanian-deadlift', 'leg-press', 'leg-curl', 'calf-raise'].map(e => ({ exerciseId: e })) },
      { name: 'Upper', slots: ['incline-bench-press', 'barbell-row', 'db-shoulder-press', 'hammer-curl', 'skullcrusher'].map(e => ({ exerciseId: e })) },
      { name: 'Lower', slots: ['front-squat', 'hip-thrust', 'lunge', 'leg-extension', 'hanging-leg-raise'].map(e => ({ exerciseId: e })) },
    ],
    6: [
      { name: 'Push A', slots: ['bench-press', 'overhead-press', 'cable-fly', 'lateral-raise', 'tricep-pushdown'].map(e => ({ exerciseId: e })) },
      { name: 'Pull A', slots: ['deadlift', 'pull-up', 'seated-row', 'face-pull', 'barbell-curl'].map(e => ({ exerciseId: e })) },
      { name: 'Legs A', slots: ['squat', 'romanian-deadlift', 'leg-press', 'calf-raise', 'plank'].map(e => ({ exerciseId: e })) },
      { name: 'Push B', slots: ['incline-bench-press', 'db-shoulder-press', 'dips', 'rear-delt-fly', 'skullcrusher'].map(e => ({ exerciseId: e })) },
      { name: 'Pull B', slots: ['barbell-row', 'lat-pulldown', 'db-row', 'hammer-curl', 'cable-curl'].map(e => ({ exerciseId: e })) },
      { name: 'Legs B', slots: ['front-squat', 'hip-thrust', 'leg-curl', 'leg-extension', 'hanging-leg-raise'].map(e => ({ exerciseId: e })) },
    ],
  },
}

export function generatePlan(profile: Profile): Template[] {
  const days = Math.min(Math.max(profile.daysPerWeek, 2), 6)
  const base = PLANS.any[days] ?? PLANS.any[3]
  const goalIds = new Set(profile.exerciseGoals.map(g => g.exerciseId))

  return base.map(day => {
    const slots = [...day.slots]
    // Ensure goal exercises appear: swap into the day that targets the same pattern if missing everywhere.
    const exercises: TemplateExercise[] = slots.map(s => {
      const r = reps(profile.focus, COMPOUNDS.has(s.exerciseId))
      return { exerciseId: s.exerciseId, sets: r.sets, reps: r.reps, restSeconds: COMPOUNDS.has(s.exerciseId) ? 180 : 90 }
    })
    return { id: uid(), name: day.name, exercises }
  }).map((tpl, i, arr) => {
    // Place any goal exercise not already in the plan into the least-loaded day.
    if (i === arr.length - 1) {
      const present = new Set(arr.flatMap(t => t.exercises.map(e => e.exerciseId)))
      for (const gid of goalIds) {
        if (!present.has(gid)) {
          const target = arr.reduce((a, b) => (a.exercises.length <= b.exercises.length ? a : b))
          const r = reps('strength', true)
          target.exercises.unshift({ exerciseId: gid, sets: r.sets, reps: r.reps, restSeconds: 180 })
          present.add(gid)
        }
      }
    }
    return tpl
  })
}
