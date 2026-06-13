import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'
import { exerciseById } from '../lib/exercises'
import { generatePlan } from '../lib/generator'
import { createSession } from '../lib/session'
import { uid, type Template, type TemplateExercise } from '../lib/types'
import ExercisePicker from '../components/ExercisePicker'

export default function TemplatesPage() {
  const { data, update } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [editing, setEditing] = useState<Template | null>(null)
  const hasActive = !!data.activeSession

  const start = (tpl?: Template) => {
    if (data.activeSession) { navigate('/workout'); return }
    const session = createSession(data, tpl)
    update(d => ({
      ...d,
      activeSession: session,
      templates: tpl ? d.templates.map(t => t.id === tpl.id ? { ...t, lastUsedAt: Date.now() } : t) : d.templates,
    }))
    navigate('/workout')
  }

  // Quick-start from Dashboard cards.
  useEffect(() => {
    const id = (location.state as { startTemplateId?: string } | null)?.startTemplateId
    if (id) {
      const tpl = data.templates.find(t => t.id === id)
      if (tpl) start(tpl)
      navigate('.', { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const regenerate = () => {
    const fresh = generatePlan(data.profile)
    update(d => ({ ...d, templates: [...fresh, ...d.templates] }))
  }

  return (
    <div className="px-5 pt-8">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Workouts</h1>
        <button
          className="btn-ghost !px-3 !py-1.5 text-xs"
          onClick={() => setEditing({ id: uid(), name: 'New Template', exercises: [] })}
        >New template</button>
      </header>

      {hasActive && (
        <button className="card mb-4 w-full border-(--color-accent)/40 bg-(--color-accent-dim) p-4 text-left" onClick={() => navigate('/workout')}>
          <p className="text-sm font-semibold accent-text">Workout in progress — tap to resume</p>
        </button>
      )}

      <button className="btn-primary mb-5 w-full" onClick={() => start(undefined)}>
        Start Empty Workout
      </button>

      <div className="space-y-3">
        {data.templates.map(t => (
          <div key={t.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {t.exercises.map(e => exerciseById(e.exerciseId, data.customExercises)?.name?.split(' (')[0]).filter(Boolean).join(' · ') || 'Empty'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="btn-primary flex-1 !py-2 text-sm" onClick={() => start(t)}>Start</button>
              <button className="btn-ghost !py-2 text-sm" onClick={() => setEditing(structuredClone(t))}>Edit</button>
              <button
                className="btn-ghost !py-2 text-sm text-(--color-bad)"
                onClick={() => update(d => ({ ...d, templates: d.templates.filter(x => x.id !== t.id) }))}
              >Delete</button>
            </div>
          </div>
        ))}
      </div>

      {data.templates.length === 0 && (
        <button className="card mt-2 w-full p-5 text-center text-sm accent-text" onClick={regenerate}>
          Generate a plan from my goals
        </button>
      )}

      {editing && (
        <TemplateEditor
          template={editing}
          onSave={tpl => {
            update(d => ({
              ...d,
              templates: d.templates.some(t => t.id === tpl.id)
                ? d.templates.map(t => (t.id === tpl.id ? tpl : t))
                : [...d.templates, tpl],
            }))
            setEditing(null)
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function TemplateEditor({ template, onSave, onClose }: { template: Template; onSave: (t: Template) => void; onClose: () => void }) {
  const { data } = useApp()
  const [tpl, setTpl] = useState(template)
  const [picking, setPicking] = useState(false)

  const setEx = (i: number, patch: Partial<TemplateExercise>) =>
    setTpl(t => ({ ...t, exercises: t.exercises.map((e, j) => (j === i ? { ...e, ...patch } : e)) }))

  const move = (i: number, dir: -1 | 1) =>
    setTpl(t => {
      const xs = [...t.exercises]
      const j = i + dir
      if (j < 0 || j >= xs.length) return t
      ;[xs[i], xs[j]] = [xs[j], xs[i]]
      return { ...t, exercises: xs }
    })

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/70" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-lg flex-col border-x border-(--color-line) bg-(--color-surface) p-4"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-3 flex shrink-0 items-center gap-2">
          <input className="input text-lg font-semibold" value={tpl.name} onChange={e => setTpl(t => ({ ...t, name: e.target.value }))} />
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-(--color-line) text-zinc-400 active:bg-white/10"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto">
          {tpl.exercises.map((te, i) => (
            <div key={i} className="card p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{exerciseById(te.exerciseId, data.customExercises)?.name ?? te.exerciseId}</p>
                <div className="flex items-center gap-1 text-zinc-500">
                  <button className="px-1.5" onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                  <button className="px-1.5" onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                  <button className="px-1.5 text-(--color-bad)" onClick={() => setTpl(t => ({ ...t, exercises: t.exercises.filter((_, j) => j !== i) }))} aria-label="Remove">✕</button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <label className="text-[0.65rem] text-zinc-500">SETS
                  <input className="input mt-0.5 !py-1.5 text-center" type="number" inputMode="numeric" value={te.sets || ''} onChange={e => setEx(i, { sets: Number(e.target.value) || 0 })} />
                </label>
                <label className="text-[0.65rem] text-zinc-500">REPS
                  <input className="input mt-0.5 !py-1.5 text-center" type="number" inputMode="numeric" value={te.reps || ''} onChange={e => setEx(i, { reps: Number(e.target.value) || 0 })} />
                </label>
                <label className="text-[0.65rem] text-zinc-500">REST (s)
                  <input className="input mt-0.5 !py-1.5 text-center" type="number" inputMode="numeric" value={te.restSeconds ?? ''} placeholder={String(data.profile.defaultRestSeconds)} onChange={e => setEx(i, { restSeconds: Number(e.target.value) || undefined })} />
                </label>
              </div>
            </div>
          ))}
          {tpl.exercises.length === 0 && <p className="py-6 text-center text-sm text-zinc-500">No exercises yet.</p>}
        </div>
        <button className="btn-ghost mt-3 w-full shrink-0" onClick={() => setPicking(true)}>+ Add exercise</button>
        <div className="mt-2 flex shrink-0 gap-2">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" onClick={() => onSave(tpl)} disabled={!tpl.name.trim()}>Save</button>
        </div>

        {picking && (
          <ExercisePicker
            onClose={() => setPicking(false)}
            onPick={ex => {
              setTpl(t => ({ ...t, exercises: [...t.exercises, { exerciseId: ex.id, sets: 3, reps: 8, restSeconds: undefined }] }))
              setPicking(false)
            }}
          />
        )}
      </div>
    </div>
  )
}
