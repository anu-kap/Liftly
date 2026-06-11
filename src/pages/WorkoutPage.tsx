import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { exerciseById } from '../lib/exercises'
import { detectPRs, type PR } from '../lib/overload'
import { addExerciseToSession } from '../lib/session'
import { uid, type SetEntry, type WorkoutSession } from '../lib/types'
import ExercisePicker from '../components/ExercisePicker'
import RestTimer from '../components/RestTimer'

interface RestState { startedAt: number; seconds: number }

export default function WorkoutPage() {
  const { data, update } = useApp()
  const navigate = useNavigate()
  const session = data.activeSession
  const [rest, setRest] = useState<RestState | null>(null)
  const [picking, setPicking] = useState(false)
  const [confirmFinish, setConfirmFinish] = useState(false)
  const [prs, setPrs] = useState<PR[] | null>(null)
  const [now, setNow] = useState(session?.startedAt ?? 0)

  // Live elapsed-time header.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // No active session and nothing to celebrate → back to templates.
  useEffect(() => {
    if (!session && !prs) navigate('/templates', { replace: true })
  }, [session, prs, navigate])

  if (!session) {
    if (prs) return <PRCelebration prs={prs} unit={data.profile.unit} onClose={() => { setPrs(null); navigate('/') }} customExercises={data.customExercises} />
    return null
  }

  const patch = (fn: (s: WorkoutSession) => WorkoutSession) =>
    update(d => ({ ...d, activeSession: d.activeSession ? fn(d.activeSession) : d.activeSession }))

  const setField = (exId: string, setId: string, field: 'weight' | 'reps', value: string) =>
    patch(s => ({
      ...s,
      exercises: s.exercises.map(ex => ex.id !== exId ? ex : {
        ...ex,
        sets: ex.sets.map(st => st.id !== setId ? st : { ...st, [field]: Number(value) || 0 }),
      }),
    }))

  const toggleDone = (exId: string, setId: string) => {
    const ex = session.exercises.find(e => e.id === exId)
    const st = ex?.sets.find(s => s.id === setId)
    if (!ex || !st) return
    const nowDone = !st.done
    patch(s => ({
      ...s,
      exercises: s.exercises.map(e => e.id !== exId ? e : {
        ...e, sets: e.sets.map(x => x.id !== setId ? x : { ...x, done: nowDone }),
      }),
    }))
    if (nowDone) {
      const secs = ex.restSeconds ?? data.profile.defaultRestSeconds
      setRest({ startedAt: Date.now(), seconds: secs })
    }
  }

  const addSet = (exId: string) =>
    patch(s => ({
      ...s,
      exercises: s.exercises.map(ex => {
        if (ex.id !== exId) return ex
        const last = ex.sets[ex.sets.length - 1]
        const blank: SetEntry = { id: uid(), type: 'normal', weight: last?.weight ?? 0, reps: last?.reps ?? 0, done: false }
        return { ...ex, sets: [...ex.sets, blank] }
      }),
    }))

  const removeSet = (exId: string, setId: string) =>
    patch(s => ({
      ...s,
      exercises: s.exercises.map(ex => ex.id !== exId ? ex : { ...ex, sets: ex.sets.filter(st => st.id !== setId) }),
    }))

  const removeExercise = (exId: string) =>
    patch(s => ({ ...s, exercises: s.exercises.filter(ex => ex.id !== exId) }))

  const finish = () => {
    const done: WorkoutSession = { ...session, endedAt: Date.now() }
    const newPrs = detectPRs(data.sessions, done)
    update(d => ({ ...d, activeSession: null, sessions: [...d.sessions, done] }))
    setConfirmFinish(false)
    if (newPrs.length > 0) setPrs(newPrs)
    else navigate('/')
  }

  const discard = () => {
    update(d => ({ ...d, activeSession: null }))
    navigate('/')
  }

  const elapsed = Math.max(0, Math.floor((now - session.startedAt) / 1000))
  const hh = Math.floor(elapsed / 3600)
  const mm = Math.floor((elapsed % 3600) / 60).toString().padStart(hh ? 2 : 1, '0')
  const ss = (elapsed % 60).toString().padStart(2, '0')
  const doneSets = session.exercises.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0)
  const totalSets = session.exercises.reduce((n, e) => n + e.sets.length, 0)

  return (
    <div className="px-4 pt-6 pb-40">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{session.name}</h1>
          <p className="text-xs text-zinc-500">
            {hh ? `${hh}:` : ''}{mm}:{ss} · {doneSets}/{totalSets} sets
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost !px-3 !py-1.5 text-xs text-rose-400" onClick={discard}>Discard</button>
          <button className="btn-primary !px-4 !py-1.5 text-sm" onClick={() => setConfirmFinish(true)}>Finish</button>
        </div>
      </header>

      <div className="space-y-4">
        {session.exercises.map(ex => {
          const meta = exerciseById(ex.exerciseId, data.customExercises)
          return (
            <div key={ex.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{meta?.name ?? ex.exerciseId}</p>
                  {ex.target && ex.target.weight > 0 && (
                    <p className="mt-0.5 text-xs text-violet-300">
                      🎯 Target: {ex.target.sets} × {ex.target.reps} @ {ex.target.weight} {data.profile.unit}
                    </p>
                  )}
                  {ex.target && <p className="mt-0.5 text-[0.7rem] text-zinc-500">{ex.target.rationale}</p>}
                </div>
                <button className="text-zinc-600 hover:text-rose-400" onClick={() => removeExercise(ex.id)} aria-label="Remove exercise">✕</button>
              </div>

              <div className="mt-3 grid grid-cols-[2rem_1fr_1fr_2.5rem_1.5rem] items-center gap-2 text-xs text-zinc-500">
                <span>SET</span><span className="text-center">{data.profile.unit.toUpperCase()}</span><span className="text-center">REPS</span><span className="text-center">✓</span><span />
              </div>
              {ex.sets.map((st, i) => (
                <div key={st.id} className={`mt-1.5 grid grid-cols-[2rem_1fr_1fr_2.5rem_1.5rem] items-center gap-2 rounded-lg ${st.done ? 'opacity-90' : ''}`}>
                  <span className="text-center text-sm font-semibold text-zinc-400">{i + 1}</span>
                  <input
                    className={`input !py-2 text-center ${st.done ? '!border-emerald-500/40 !bg-emerald-500/10' : ''}`}
                    type="number" inputMode="decimal" value={st.weight || ''}
                    placeholder={ex.target ? String(ex.target.weight || '') : '0'}
                    onChange={e => setField(ex.id, st.id, 'weight', e.target.value)}
                  />
                  <input
                    className={`input !py-2 text-center ${st.done ? '!border-emerald-500/40 !bg-emerald-500/10' : ''}`}
                    type="number" inputMode="numeric" value={st.reps || ''}
                    placeholder={ex.target ? String(ex.target.reps) : '0'}
                    onChange={e => setField(ex.id, st.id, 'reps', e.target.value)}
                  />
                  <button
                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border text-sm transition-all ${
                      st.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-white/15 text-zinc-500'
                    }`}
                    onClick={() => toggleDone(ex.id, st.id)}
                    aria-label="Toggle set done"
                  >✓</button>
                  <button className="text-zinc-700 hover:text-rose-400" onClick={() => removeSet(ex.id, st.id)} aria-label="Remove set">−</button>
                </div>
              ))}
              <button className="btn-ghost mt-3 w-full !py-2 text-sm" onClick={() => addSet(ex.id)}>+ Add set</button>
            </div>
          )
        })}
      </div>

      <button className="btn-ghost mt-4 w-full" onClick={() => setPicking(true)}>+ Add exercise</button>

      {picking && (
        <ExercisePicker
          onClose={() => setPicking(false)}
          onPick={ex => {
            update(d => ({ ...d, activeSession: d.activeSession ? addExerciseToSession(d, d.activeSession, ex.id) : d.activeSession }))
            setPicking(false)
          }}
        />
      )}

      {rest && (
        <RestTimer
          seconds={rest.seconds}
          startedAt={rest.startedAt}
          onDone={() => setRest(null)}
          onSkip={() => setRest(null)}
          onAdjust={d => setRest(r => (r ? { ...r, seconds: Math.max(5, r.seconds + d) } : r))}
        />
      )}

      {confirmFinish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm" onClick={() => setConfirmFinish(false)}>
          <div className="card animate-pop w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Finish workout?</h2>
            <p className="mt-1 text-sm text-zinc-400">{doneSets} of {totalSets} sets completed.</p>
            <div className="mt-5 flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => setConfirmFinish(false)}>Keep going</button>
              <button className="btn-primary flex-1" onClick={finish}>Finish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PRCelebration({ prs, unit, onClose, customExercises }: {
  prs: PR[]; unit: string; onClose: () => void
  customExercises: ReturnType<typeof useApp>['data']['customExercises']
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-md">
      <div className="card animate-pop w-full max-w-sm p-6 text-center">
        <p className="text-5xl">🏆</p>
        <h2 className="mt-2 text-2xl font-bold grad-text">New PR{prs.length > 1 ? 's' : ''}!</h2>
        <div className="mt-4 space-y-2">
          {prs.map(pr => (
            <div key={pr.exerciseId} className="card p-3 text-sm">
              <p className="font-semibold">{exerciseById(pr.exerciseId, customExercises)?.name ?? pr.exerciseId}</p>
              <p className="text-zinc-400">{pr.weight} {unit} × {pr.reps} · e1RM {Math.round(pr.e1rm)} {unit}</p>
            </div>
          ))}
        </div>
        <button className="btn-primary mt-6 w-full" onClick={onClose}>Awesome</button>
      </div>
    </div>
  )
}
