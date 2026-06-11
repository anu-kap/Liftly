import { useMemo, useState } from 'react'
import { allExercises, MUSCLE_GROUPS } from '../lib/exercises'
import { uid, type Exercise, type MuscleGroup } from '../lib/types'
import { useApp } from '../state/AppContext'

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

  const list = useMemo(() => {
    let xs = allExercises(data.customExercises)
    if (group) xs = xs.filter(e => e.muscleGroup === group)
    if (query.trim()) xs = xs.filter(e => e.name.toLowerCase().includes(query.trim().toLowerCase()))
    return xs
  }, [data.customExercises, group, query])

  const createCustom = () => {
    if (!newName.trim()) return
    const ex: Exercise = { id: 'custom-' + uid(), name: newName.trim(), muscleGroup: newGroup, equipment: 'Other', isCustom: true }
    update(d => ({ ...d, customExercises: [...d.customExercises, ex] }))
    onPick(ex)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-pop flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-3xl border border-(--color-line) bg-(--color-surface) p-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Exercise</h2>
          <button className="btn-ghost !px-3 !py-1 text-sm" onClick={onClose}>Close</button>
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
              <button className="btn-primary flex-1" onClick={createCustom} disabled={!newName.trim()}>Create & Add</button>
              <button className="btn-ghost" onClick={() => setCreating(false)}>Back</button>
            </div>
          </div>
        ) : (
          <>
            <input className="input mb-2" placeholder="Search exercises…" value={query} onChange={e => setQuery(e.target.value)} />
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
              <button className={`chip shrink-0 ${group === null ? 'chip-active' : ''}`} onClick={() => setGroup(null)}>All</button>
              {MUSCLE_GROUPS.map(g => (
                <button key={g} className={`chip shrink-0 ${group === g ? 'chip-active' : ''}`} onClick={() => setGroup(g)}>{g}</button>
              ))}
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto">
              {list.map(e => (
                <button
                  key={e.id}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-white/5 active:bg-white/10"
                  onClick={() => onPick(e)}
                >
                  <span className="text-sm font-medium">{e.name}</span>
                  <span className="text-xs text-zinc-500">{e.muscleGroup}</span>
                </button>
              ))}
              {list.length === 0 && <p className="py-6 text-center text-sm text-zinc-500">No matches.</p>}
            </div>
            <button className="btn-ghost mt-2 w-full" onClick={() => { setCreating(true); setNewName(query) }}>
              + Create custom exercise
            </button>
          </>
        )}
      </div>
    </div>
  )
}
