import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, addMonths } from 'date-fns'
import { useApp } from '../state/AppContext'
import { generatePlan } from '../lib/generator'
import { EXERCISES } from '../lib/exercises'
import type { ExerciseGoal, ExperienceLevel, GoalFocus } from '../lib/types'

const GOAL_CANDIDATES = ['bench-press', 'squat', 'deadlift', 'overhead-press', 'pull-up', 'barbell-row']

export default function Onboarding() {
  const { data, update } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [focus, setFocus] = useState<GoalFocus>('hypertrophy')
  const [experience, setExperience] = useState<ExperienceLevel>('beginner')
  const [days, setDays] = useState(3)
  const [unit, setUnit] = useState<'lb' | 'kg'>(data.profile.unit)
  const [goals, setGoals] = useState<ExerciseGoal[]>([])

  const toggleGoal = (exerciseId: string) => {
    setGoals(gs =>
      gs.some(g => g.exerciseId === exerciseId)
        ? gs.filter(g => g.exerciseId !== exerciseId)
        : [...gs, { exerciseId, targetWeight: unit === 'lb' ? 135 : 60, targetReps: 5, targetDate: format(addMonths(new Date(), 3), 'yyyy-MM-dd') }],
    )
  }

  const setGoalField = (exerciseId: string, field: keyof ExerciseGoal, value: string) => {
    setGoals(gs => gs.map(g => g.exerciseId === exerciseId
      ? { ...g, [field]: field === 'targetDate' ? value : Number(value) || 0 }
      : g))
  }

  const finish = () => {
    update(d => {
      const profile = { ...d.profile, onboarded: true, focus, experience, daysPerWeek: days, unit, exerciseGoals: goals }
      const templates = d.templates.length > 0 ? d.templates : generatePlan(profile)
      return { ...d, profile, templates }
    })
    navigate('/')
  }

  return (
    <div className="flex min-h-dvh flex-col px-6 py-10">
      <div className="mb-8 flex gap-1.5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-(--color-accent)' : 'bg-white/10'}`} />
        ))}
      </div>

      {step === 0 && (
        <div className="animate-pop flex flex-1 flex-col">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">Welcome to <span className="accent-text">Liftly</span></h1>
          <p className="mt-3 text-zinc-400">Your training, beautifully tracked. Let's set up your goals — what are you mainly training for?</p>
          <div className="mt-8 space-y-3">
            {([
              ['strength', 'Get Stronger', 'Heavy compound lifts, 3–6 rep range'],
              ['hypertrophy', 'Build Muscle', 'Moderate weights, 8–12 rep range'],
              ['general', 'General Fitness', 'Higher reps, balanced full-body work'],
            ] as const).map(([key, title, sub]) => (
              <button
                key={key}
                onClick={() => setFocus(key)}
                className={`card w-full p-4 text-left transition-all ${focus === key ? 'border-(--color-accent)/60 bg-(--color-accent-dim)' : ''}`}
              >
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-zinc-500">{sub}</p>
              </button>
            ))}
          </div>
          <button className="btn-primary mt-auto w-full" onClick={() => setStep(1)}>Continue</button>
        </div>
      )}

      {step === 1 && (
        <div className="animate-pop flex flex-1 flex-col">
          <h1 className="text-3xl font-bold">About you</h1>
          <p className="mt-2 text-zinc-400">We use this to pace your progressive overload.</p>

          <p className="label mt-8 mb-2">Experience level</p>
          <div className="flex gap-2">
            {(['beginner', 'intermediate', 'advanced'] as const).map(l => (
              <button key={l} className={`chip flex-1 !py-2 capitalize ${experience === l ? 'chip-active' : ''}`} onClick={() => setExperience(l)}>{l}</button>
            ))}
          </div>

          <p className="label mt-6 mb-2">Workout days per week</p>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map(n => (
              <button key={n} className={`chip flex-1 !py-2 ${days === n ? 'chip-active' : ''}`} onClick={() => setDays(n)}>{n}</button>
            ))}
          </div>

          <p className="label mt-6 mb-2">Units</p>
          <div className="flex gap-2">
            {(['lb', 'kg'] as const).map(u => (
              <button key={u} className={`chip flex-1 !py-2 ${unit === u ? 'chip-active' : ''}`} onClick={() => setUnit(u)}>{u}</button>
            ))}
          </div>

          <div className="mt-auto flex gap-2">
            <button className="btn-ghost" onClick={() => setStep(0)}>Back</button>
            <button className="btn-primary flex-1" onClick={() => setStep(2)}>Continue</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-pop flex flex-1 flex-col">
          <h1 className="text-3xl font-bold">Lift goals</h1>
          <p className="mt-2 text-zinc-400">Pick lifts you want to improve. Liftly will prescribe sets, reps and weight each session to keep you on pace.</p>
          <div className="mt-6 space-y-3 overflow-y-auto pb-4">
            {GOAL_CANDIDATES.map(id => {
              const ex = EXERCISES.find(e => e.id === id)!
              const goal = goals.find(g => g.exerciseId === id)
              return (
                <div key={id} className={`card p-4 ${goal ? 'border-(--color-accent)/60' : ''}`}>
                  <button className="flex w-full items-center justify-between" onClick={() => toggleGoal(id)}>
                    <span className="font-medium">{ex.name}</span>
                    <span className={`flex h-6 w-6 items-center justify-center rounded-lg border ${goal ? 'border-(--color-accent) bg-(--color-accent) text-black' : 'border-white/20 text-transparent'}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5 10 18 20 6" /></svg>
                    </span>
                  </button>
                  {goal && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <label className="text-xs text-zinc-500">
                        Target {unit}
                        <input className="input mt-1" type="number" inputMode="decimal" value={goal.targetWeight || ''} onChange={e => setGoalField(id, 'targetWeight', e.target.value)} />
                      </label>
                      <label className="text-xs text-zinc-500">
                        × Reps
                        <input className="input mt-1" type="number" inputMode="numeric" value={goal.targetReps || ''} onChange={e => setGoalField(id, 'targetReps', e.target.value)} />
                      </label>
                      <label className="text-xs text-zinc-500">
                        By date
                        <input className="input mt-1 !px-2 text-xs" type="date" value={goal.targetDate} onChange={e => setGoalField(id, 'targetDate', e.target.value)} />
                      </label>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-auto flex gap-2 pt-2">
            <button className="btn-ghost" onClick={() => setStep(1)}>Back</button>
            <button className="btn-primary flex-1" onClick={() => setStep(3)}>{goals.length ? 'Continue' : 'Skip for now'}</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-pop flex flex-1 flex-col">
          <h1 className="text-3xl font-bold tracking-tight">Your plan is <span className="accent-text">ready</span></h1>
          <p className="mt-2 text-zinc-400">
            Based on your goals, Liftly generated a <strong>{days}-day {focus}</strong> plan with editable workout templates.
            During each workout, every set shows the exact weight × reps to hit for progressive overload.
          </p>
          <div className="card mt-6 space-y-2.5 p-4 text-sm text-zinc-300">
            {[
              `${days} workouts per week, tailored to ${focus === 'strength' ? 'strength' : focus === 'hypertrophy' ? 'muscle growth' : 'overall fitness'}`,
              goals.length > 0 ? `${goals.length} lift goal${goals.length > 1 ? 's' : ''} with pace tracking` : 'Add lift goals anytime in Profile',
              'Per-set progressive overload targets in every session',
              'Sign in with Google later to back up your data',
            ].map(line => (
              <p key={line} className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-sm bg-(--color-accent)" />
                {line}
              </p>
            ))}
          </div>
          <div className="mt-auto flex gap-2">
            <button className="btn-ghost" onClick={() => setStep(2)}>Back</button>
            <button className="btn-primary flex-1" onClick={finish}>Start Training</button>
          </div>
        </div>
      )}
    </div>
  )
}
