import { useMemo, useState } from 'react'
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay,
  isSameMonth, isToday, startOfMonth, startOfWeek,
} from 'date-fns'
import type { WorkoutSession } from '../lib/types'

interface Props {
  sessions: WorkoutSession[]
  onClose: () => void
}

// Strong-style mini calendar: lime squares on days you trained,
// tap a day to see that day's workouts.
export default function MiniCalendar({ sessions, onClose }: Props) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState<Date | null>(null)

  const completed = useMemo(() => sessions.filter(s => s.endedAt), [sessions])

  const days = useMemo(
    () => eachDayOfInterval({
      start: startOfWeek(month, { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
    }),
    [month],
  )

  const sessionsOn = (d: Date) => completed.filter(s => isSameDay(s.endedAt!, d))
  const daySessions = selected ? sessionsOn(selected) : []
  const trainedThisMonth = completed.filter(s => isSameMonth(s.endedAt!, month)).length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 px-5 pt-20 backdrop-blur-sm" onClick={onClose}>
      <div className="card animate-pop w-full max-w-sm p-4" onClick={e => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <button className="btn-ghost !px-3 !py-1" onClick={() => setMonth(m => addMonths(m, -1))} aria-label="Previous month">←</button>
          <div className="text-center">
            <p className="font-semibold">{format(month, 'MMMM yyyy')}</p>
            <p className="label mt-0.5">{trainedThisMonth} workout{trainedThisMonth === 1 ? '' : 's'}</p>
          </div>
          <button className="btn-ghost !px-3 !py-1" onClick={() => setMonth(m => addMonths(m, 1))} aria-label="Next month">→</button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i} className="label py-1">{d}</span>
          ))}
          {days.map(d => {
            const trained = sessionsOn(d).length > 0
            const inMonth = isSameMonth(d, month)
            const sel = selected && isSameDay(d, selected)
            return (
              <button
                key={d.getTime()}
                onClick={() => setSelected(sel ? null : d)}
                className={[
                  'num relative aspect-square rounded-lg text-xs transition-colors',
                  trained ? 'bg-(--color-accent) font-bold text-black' : inMonth ? 'text-zinc-300' : 'text-zinc-700',
                  sel ? 'ring-2 ring-white/60' : '',
                  isToday(d) && !trained ? 'border border-(--color-accent) text-(--color-accent)' : '',
                ].join(' ')}
              >
                {format(d, 'd')}
              </button>
            )
          })}
        </div>

        {selected && (
          <div className="hairline mt-3 pt-3">
            <p className="label mb-1.5">{format(selected, 'EEEE, MMM d')}</p>
            {daySessions.length === 0 && <p className="text-sm text-zinc-500">Rest day.</p>}
            {daySessions.map(s => (
              <div key={s.id} className="flex items-baseline justify-between py-1 text-sm">
                <span className="font-medium">{s.name}</span>
                <span className="num text-xs text-zinc-500">
                  {s.exercises.length} ex · {Math.round((s.endedAt! - s.startedAt) / 60000)}m
                </span>
              </div>
            ))}
          </div>
        )}

        <button className="btn-ghost mt-3 w-full !py-2" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
