import { useMemo, useState } from 'react'
import { allExercises, MUSCLE_GROUPS } from '../lib/exercises'
import { lastSessions } from '../lib/overload'
import { uid, type Exercise, type MuscleGroup } from '../lib/types'
import { useApp } from '../state/AppContext'
import ExerciseSheet from './ExerciseSheet'
import MuscleDiagram from './MuscleDiagram'

interface Props {
  onPick: (exercise: Exercise) => void
  onClose: () => void
}

export default function ExercisePicker({ onPick, onClose }: Props) {
  const { data, update } = useApp()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newGroup, setNewGroup] = useState<MuscleGroup>('Chest')
  const [detail, setDetail] = useState<Exercise | null>(null)

  const list = useMemo(() => {
    let xs = allExercises(data.customExercises)
    if (group) xs = xs.filter(e => e.muscleGroup === group)
    if (query.trim()) xs = xs.filter(e => e.name.toLowerCase().includes(query.trim().toLowerCase()))
    return xs
  }, [data.customExercises, group, query])

  const lastUse = (id: string) => lastSessions(data.sessions, id, 1)[0]

  const createCustom = () => {
    if (!newName.trim()) return
    const ex: Exercise = { id: 'custom-' + uid(), name: newName.trim(), muscleGroup: newGroup, equipment: 'Other', isCustom: true }
    update(d => ({ ...d, customExercises: [...d.customExercises, ex] }))
    onPick(ex)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-pop flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-3xl border border-(--color-line) bg-(--color-surface) p-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add exercise</h2>
          <button className="btn-ghost !px-3 !py-1 text-xs" onClick={onClose}>Close</button>
        </div>

        {creating ? (
          <div className="space-y-3">
            <input className="input" placeholder="Exercise name" value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
            <div className="flex flex-wrap gap-1.5">
              {MUSCLE_GROUPS.map(g => (
                <button key={g} className={`chip ${newGroup === g ? 'chip-active' : ''}`} onClick={() => setNewGroup(g)}>{g}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => setCreating(false)}>Back</button>
              <button className="btn-primary flex-1" onClick={createCustom} disabled={!newName.trim()}>Create & add</button>
            </div>
          </div>
        ) : (
          <>
            <input className="input mb-2" placeholder="Search exercises" value={query} onChange={e => setQuery(e.target.value)} />
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
              <button className={`chip shrink-0 ${group === null ? 'chip-active' : ''}`} onClick={() => setGroup(null)}>All</button>
              {MUSCLE_GROUPS.map(g => (
                <button key={g} className={`chip shrink-0 ${group === g ? 'chip-active' : ''}`} onClick={() => setGroup(g)}>{g}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {list.map(e => {
                const last = lastUse(e.id)
                return (
                  <div key={e.id} className="hairline flex items-center first:border-t-0">
                    <button
                      className="flex min-w-0 flex-1 items-center gap-3 py-2 pr-2 text-left active:bg-white/5"
                      onClick={() => onPick(e)}
                    >
                      <span className="flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-(--color-surface-2)">
                        <MuscleDiagram group={e.muscleGroup} size={24} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{e.name}</span>
                        <span className="label !text-[0.58rem]">
                          {e.muscleGroup}
                          {last && <span className="num normal-case tracking-normal text-zinc-600"> · last {last.sets[0].weight}×{last.sets[0].reps}</span>}
                        </span>
                      </span>
                    </button>
                    <button
                      className="shrink-0 px-2 py-3 text-zinc-600 active:text-(--color-accent)"
                      onClick={() => setDetail(e)}
                      aria-label={`About ${e.name}`}
                    >
                      <InfoIcon />
                    </button>
                  </div>
                )
              })}
              {list.length === 0 && <p className="py-6 text-center text-sm text-zinc-500">No matches.</p>}
            </div>
            <button className="btn-ghost mt-2 w-full" onClick={() => { setCreating(true); setNewName(query) }}>
              Create custom exercise
            </button>
          </>
        )}

        {detail && (
          <ExerciseSheet
            exercise={detail}
            onClose={() => setDetail(null)}
            actionLabel="Add to workout"
            onAction={() => { onPick(detail); setDetail(null) }}
          />
        )}
      </div>
    </div>
  )
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" /><circle cx="12" cy="8" r="0.6" fill="currentColor" />
    </svg>
  )
}
