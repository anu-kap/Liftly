import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { exerciseById } from '../lib/exercises'
import { detectPRs, type PR } from '../lib/overload'
import { addExerciseToSession, differsFromTemplate, sessionToTemplateExercises } from '../lib/session'
import { uid, type Exercise, type SetEntry, type Template, type WorkoutSession } from '../lib/types'
import ExercisePicker from '../components/ExercisePicker'
import ExerciseSheet from '../components/ExerciseSheet'
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
  const [statsFor, setStatsFor] = useState<Exercise | null>(null)
  const [now, setNow] = useState(session?.startedAt ?? 0)
  // Finish dialog: template-saving options
  const sourceTemplate = data.templates.find(t => t.id === session?.templateId)
  const [saveAsNew, setSaveAsNew] = useState(false)
  const [updateSource, setUpdateSource] = useState(true)
  const [tmplName, setTmplName] = useState('')

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
        const blank: SetEntry = {
          id: uid(), type: 'normal', weight: last?.weight ?? 0, reps: last?.reps ?? 0, done: false,
          target: last?.target,
        }
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
    const tmplExercises = sessionToTemplateExercises(done)
    update(d => {
      let templates = d.templates
      // Update the template this workout started from, if requested.
      if (updateSource && sourceTemplate && session.exercises.length > 0) {
        templates = templates.map(t => t.id === sourceTemplate.id ? { ...t, exercises: tmplExercises } : t)
      }
      // Save the workout as a brand-new template, if requested.
      if (saveAsNew && session.exercises.length > 0) {
        const newTpl: Template = {
          id: uid(),
          name: tmplName.trim() || done.name || 'My Template',
          exercises: tmplExercises,
        }
        templates = [...templates, newTpl]
      }
      return { ...d, activeSession: null, sessions: [...d.sessions, done], templates }
    })
    setConfirmFinish(false)
    if (newPrs.length > 0) setPrs(newPrs)
    else navigate('/')
  }

  const openFinish = () => {
    setSaveAsNew(!sourceTemplate)          // freestyle → default to saving a template
    setUpdateSource(!!sourceTemplate)
    setTmplName(session.name === 'Freestyle Workout' ? '' : session.name)
    setConfirmFinish(true)
  }

  const templateChanged = differsFromTemplate(session, sourceTemplate)

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

  // A completed set achieves overload if it meets/beats its target.
  const hitTarget = (st: SetEntry) => st.target && st.weight >= st.target.weight && st.reps >= st.target.reps

  return (
    <div className="px-4 pt-6 pb-40">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{session.name}</h1>
          <p className="num mt-0.5 text-xs text-zinc-500">
            {hh ? `${hh}:` : ''}{mm}:{ss} · {doneSets}/{totalSets} sets
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost !px-3 !py-1.5 text-xs text-(--color-bad)" onClick={discard}>Discard</button>
          <button className="btn-primary !px-4 !py-1.5 text-xs" onClick={openFinish}>Finish</button>
        </div>
      </header>

      <div className="space-y-4">
        {session.exercises.map(ex => {
          const meta = exerciseById(ex.exerciseId, data.customExercises)
          return (
            <div key={ex.id} className="card p-4">
              <div className="flex items-start justify-between">
                <button className="min-w-0 text-left" onClick={() => meta && setStatsFor(meta)}>
                  <p className="flex items-center gap-1.5 font-semibold">
                    <span className="truncate">{meta?.name ?? ex.exerciseId}</span>
                    <ChevronIcon />
                  </p>
                  {ex.target && <p className="mt-0.5 text-[0.7rem] text-zinc-500">{ex.target.rationale}</p>}
                </button>
                <button className="ml-2 shrink-0 text-zinc-600 active:text-(--color-bad)" onClick={() => removeExercise(ex.id)} aria-label="Remove exercise">
                  <XIcon />
                </button>
              </div>

              <div className="label mt-3 grid grid-cols-[1.6rem_1fr_1fr_1fr_2.2rem_1.2rem] items-center gap-2 !text-[0.55rem]">
                <span>Set</span>
                <span className="text-center">Target</span>
                <span className="text-center">{data.profile.unit}</span>
                <span className="text-center">Reps</span>
                <span className="text-center">Done</span>
                <span />
              </div>
              {ex.sets.map((st, i) => {
                const achieved = st.done && hitTarget(st)
                const missed = st.done && st.target && !hitTarget(st)
                return (
                  <div key={st.id} className="mt-1.5 grid grid-cols-[1.6rem_1fr_1fr_1fr_2.2rem_1.2rem] items-center gap-2">
                    <span className="num text-center text-sm font-semibold text-zinc-500">{i + 1}</span>
                    <span className={`num text-center text-xs ${achieved ? 'text-(--color-accent)' : missed ? 'text-(--color-warn)' : 'text-zinc-500'}`}>
                      {st.target && st.target.weight > 0 ? `${st.target.weight}×${st.target.reps}` : st.target ? `—×${st.target.reps}` : '—'}
                    </span>
                    <input
                      className={`input num !py-2 text-center text-sm ${achieved ? '!border-(--color-accent)/50 !bg-(--color-accent-dim)' : missed ? '!border-(--color-warn)/40' : ''}`}
                      type="number" inputMode="decimal" value={st.weight || ''}
                      placeholder={st.target ? String(st.target.weight || '') : '0'}
                      onChange={e => setField(ex.id, st.id, 'weight', e.target.value)}
                    />
                    <input
                      className={`input num !py-2 text-center text-sm ${achieved ? '!border-(--color-accent)/50 !bg-(--color-accent-dim)' : missed ? '!border-(--color-warn)/40' : ''}`}
                      type="number" inputMode="numeric" value={st.reps || ''}
                      placeholder={st.target ? String(st.target.reps) : '0'}
                      onChange={e => setField(ex.id, st.id, 'reps', e.target.value)}
                    />
                    <button
                      className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                        st.done
                          ? achieved
                            ? 'border-(--color-accent) bg-(--color-accent) text-black'
                            : 'border-(--color-warn) bg-(--color-warn)/20 text-(--color-warn)'
                          : 'border-white/15 text-zinc-600'
                      }`}
                      onClick={() => toggleDone(ex.id, st.id)}
                      aria-label="Toggle set done"
                    >
                      <CheckIcon />
                    </button>
                    <button className="text-zinc-700 active:text-(--color-bad)" onClick={() => removeSet(ex.id, st.id)} aria-label="Remove set">
                      <MinusIcon />
                    </button>
                  </div>
                )
              })}
              <button className="btn-ghost mt-3 w-full !py-2 text-xs" onClick={() => addSet(ex.id)}>Add set</button>
            </div>
          )
        })}
      </div>

      <button className="btn-ghost mt-4 w-full" onClick={() => setPicking(true)}>Add exercise</button>

      {picking && (
        <ExercisePicker
          onClose={() => setPicking(false)}
          onPick={ex => {
            update(d => ({ ...d, activeSession: d.activeSession ? addExerciseToSession(d, d.activeSession, ex.id) : d.activeSession }))
            setPicking(false)
          }}
        />
      )}

      {statsFor && <ExerciseSheet exercise={statsFor} onClose={() => setStatsFor(null)} />}

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm" onClick={() => setConfirmFinish(false)}>
          <div className="card animate-pop w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Finish workout?</h2>
            <p className="num mt-1 text-sm text-zinc-400">{doneSets} of {totalSets} sets completed.</p>

            {session.exercises.length > 0 && (
              <div className="mt-4 space-y-2">
                {/* Update the template this workout came from */}
                {sourceTemplate && templateChanged && (
                  <button
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${updateSource ? 'border-(--color-accent)/60 bg-(--color-accent-dim)' : 'border-(--color-line)'}`}
                    onClick={() => setUpdateSource(v => !v)}
                  >
                    <Checkbox on={updateSource} />
                    <span className="min-w-0 text-sm">
                      <span className="font-medium">Update "{sourceTemplate.name}"</span>
                      <span className="block text-xs text-zinc-500">Save your changes to this template</span>
                    </span>
                  </button>
                )}

                {/* Save as a brand-new template */}
                <button
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${saveAsNew ? 'border-(--color-accent)/60 bg-(--color-accent-dim)' : 'border-(--color-line)'}`}
                  onClick={() => setSaveAsNew(v => !v)}
                >
                  <Checkbox on={saveAsNew} />
                  <span className="text-sm">
                    <span className="font-medium">Save as new template</span>
                    <span className="block text-xs text-zinc-500">Reuse this workout anytime</span>
                  </span>
                </button>
                {saveAsNew && (
                  <input
                    className="input text-sm"
                    placeholder="Template name"
                    value={tmplName}
                    onChange={e => setTmplName(e.target.value)}
                    autoFocus
                  />
                )}
              </div>
            )}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-md">
      <div className="card animate-pop w-full max-w-sm p-6 text-center">
        <TrophyIcon />
        <h2 className="mt-3 text-2xl font-bold tracking-tight">
          New record{prs.length > 1 ? 's' : ''}
        </h2>
        <div className="mt-4 space-y-2">
          {prs.map(pr => (
            <div key={pr.exerciseId} className="card !rounded-xl bg-(--color-surface-2) p-3 text-sm">
              <p className="font-semibold">{exerciseById(pr.exerciseId, customExercises)?.name ?? pr.exerciseId}</p>
              <p className="num mt-0.5 text-zinc-400">{pr.weight} {unit} × {pr.reps} · e1RM {Math.round(pr.e1rm)} {unit}</p>
            </div>
          ))}
        </div>
        <button className="btn-primary mt-6 w-full" onClick={onClose}>Continue</button>
      </div>
    </div>
  )
}

function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5 10 18 20 6" /></svg>
}
function Checkbox({ on }: { on: boolean }) {
  return (
    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${on ? 'border-(--color-accent) bg-(--color-accent) text-black' : 'border-white/25 text-transparent'}`}>
      <CheckIcon />
    </span>
  )
}
function XIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
}
function MinusIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14" /></svg>
}
function ChevronIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M9 6l6 6-6 6" /></svg>
}
function TrophyIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
      <path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0z" />
      <path d="M7 6H4a2 2 0 0 0 2 4h1M17 6h3a2 2 0 0 1-2 4h-1" />
    </svg>
  )
}
