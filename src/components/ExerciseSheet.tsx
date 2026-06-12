import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import type { Exercise } from '../lib/types'
import { exerciseInfo } from '../lib/exerciseInfo'
import { exerciseHistory, lastSessions } from '../lib/overload'
import { useApp } from '../state/AppContext'
import MuscleDiagram from './MuscleDiagram'
import Sparkline from './Sparkline'

interface Props {
  exercise: Exercise
  onClose: () => void
  // Optional action button (e.g. "Add to workout" from the picker)
  actionLabel?: string
  onAction?: () => void
}

// Bottom sheet with the exercise illustration, how-to, recent performance
// (last 3 workouts) and an e1RM sparkline — usable mid-workout for a quick gauge.
export default function ExerciseSheet({ exercise, onClose, actionLabel, onAction }: Props) {
  const { data } = useApp()
  const unit = data.profile.unit

  const recent = useMemo(() => lastSessions(data.sessions, exercise.id, 3), [data.sessions, exercise.id])
  const trend = useMemo(
    () => exerciseHistory(data.sessions, exercise.id).map(p => p.bestE1rm).slice(-10),
    [data.sessions, exercise.id],
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-pop flex max-h-[88dvh] w-full max-w-lg flex-col overflow-y-auto rounded-t-3xl border border-(--color-line) bg-(--color-surface) p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex gap-4">
          <div className="card flex shrink-0 items-center justify-center !rounded-xl bg-(--color-surface-2) px-2 py-1">
            <MuscleDiagram group={exercise.muscleGroup} size={42} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold leading-tight">{exercise.name}</h2>
            <p className="label mt-1">{exercise.muscleGroup} · {exercise.equipment}</p>
            {trend.length >= 2 && (
              <div className="mt-2 flex items-end gap-2">
                <Sparkline values={trend} width={110} height={30} />
                <span className="num text-[0.65rem] text-zinc-500">e1RM trend</span>
              </div>
            )}
          </div>
          <button className="self-start text-zinc-500" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-zinc-400">{exerciseInfo(exercise.id)}</p>

        <div className="hairline mt-4 pt-4">
          <p className="label mb-2">Last {recent.length || ''} workout{recent.length === 1 ? '' : 's'}</p>
          {recent.length === 0 && <p className="text-sm text-zinc-600">No history yet — this session sets the baseline.</p>}
          <div className="space-y-2">
            {recent.map(s => (
              <div key={s.date} className="card !rounded-xl bg-(--color-surface-2) p-3">
                <p className="num text-[0.65rem] text-zinc-500">{format(s.date, 'EEE, MMM d')}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {s.sets.map((st, i) => (
                    <span key={i} className="num rounded-md border border-(--color-line) px-2 py-0.5 text-xs text-zinc-300">
                      {st.weight}<span className="text-zinc-600">×</span>{st.reps}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {recent.length > 0 && (
            <Link to={`/exercise/${exercise.id}`} className="btn-ghost flex-1 text-center" onClick={onClose}>
              Full stats
            </Link>
          )}
          {actionLabel && onAction ? (
            <button className="btn-primary flex-1" onClick={onAction}>{actionLabel}</button>
          ) : (
            <button className="btn-primary flex-1" onClick={onClose}>Done</button>
          )}
        </div>
        <p className="num mt-2 text-center text-[0.6rem] text-zinc-600">{unit} × reps</p>
      </div>
    </div>
  )
}

function CloseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
}
