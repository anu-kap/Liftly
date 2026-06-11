import { useState } from 'react'
import { format } from 'date-fns'
import { useApp } from '../state/AppContext'
import { exerciseById } from '../lib/exercises'
import { sessionSets, sessionVolume } from '../lib/overload'
import type { WorkoutSession } from '../lib/types'

export default function HistoryPage() {
  const { data, update } = useApp()
  const [open, setOpen] = useState<WorkoutSession | null>(null)
  const completed = data.sessions.filter(s => s.endedAt).sort((a, b) => b.endedAt! - a.endedAt!)

  // Group by month for scannability.
  const groups = new Map<string, WorkoutSession[]>()
  for (const s of completed) {
    const key = format(s.endedAt!, 'MMMM yyyy')
    groups.set(key, [...(groups.get(key) ?? []), s])
  }

  return (
    <div className="px-5 pt-8">
      <h1 className="mb-5 text-2xl font-bold">History</h1>

      {completed.length === 0 && (
        <div className="card p-6 text-center text-sm text-zinc-500">No workouts logged yet.</div>
      )}

      {[...groups.entries()].map(([month, sessions]) => (
        <section key={month} className="mb-5">
          <h2 className="mb-2 text-sm font-semibold text-zinc-400">{month.toUpperCase()}</h2>
          <div className="space-y-2.5">
            {sessions.map(s => (
              <button key={s.id} className="card w-full p-4 text-left" onClick={() => setOpen(s)}>
                <div className="flex justify-between">
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-zinc-500">{format(s.endedAt!, 'EEE, MMM d')}</p>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {s.exercises.length} exercises · {sessionSets(s)} sets · {Math.round(sessionVolume(s)).toLocaleString()} {data.profile.unit}
                  {' · '}{Math.round((s.endedAt! - s.startedAt) / 60000)} min
                </p>
              </button>
            ))}
          </div>
        </section>
      ))}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div className="animate-pop flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-3xl border border-(--color-line) bg-(--color-surface) p-5" onClick={e => e.stopPropagation()}>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{open.name}</h2>
              <button className="btn-ghost !px-3 !py-1 text-sm" onClick={() => setOpen(null)}>Close</button>
            </div>
            <p className="mb-3 text-xs text-zinc-500">
              {format(open.endedAt!, 'EEEE, MMM d yyyy · h:mm a')} · {Math.round((open.endedAt! - open.startedAt) / 60000)} min
            </p>
            <div className="flex-1 space-y-3 overflow-y-auto">
              {open.exercises.map(ex => (
                <div key={ex.id} className="card p-3">
                  <p className="text-sm font-semibold">{exerciseById(ex.exerciseId, data.customExercises)?.name ?? ex.exerciseId}</p>
                  <div className="mt-1.5 space-y-0.5 text-sm text-zinc-400">
                    {ex.sets.filter(st => st.done).map((st, i) => (
                      <p key={st.id} className="font-mono text-xs">
                        {i + 1} — {st.weight} {data.profile.unit} × {st.reps}{st.type === 'warmup' ? ' (warmup)' : ''}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              className="btn-ghost mt-3 w-full text-rose-400"
              onClick={() => {
                update(d => ({ ...d, sessions: d.sessions.filter(s => s.id !== open.id) }))
                setOpen(null)
              }}
            >Delete workout</button>
          </div>
        </div>
      )}
    </div>
  )
}
