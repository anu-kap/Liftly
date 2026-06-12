import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import { useApp } from '../state/AppContext'
import { allExercises, exerciseById } from '../lib/exercises'
import { cutoffMs, exerciseHistory, muscleSplit, sessionVolume } from '../lib/overload'

const RANGES = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: 'All', days: 36500 },
]

const PALETTE = ['#d3ff3a', '#9caf2e', '#6b7a25', '#e8e8ec', '#a9a9b2', '#74747e', '#d3ff3a', '#9caf2e', '#6b7a25', '#e8e8ec', '#a9a9b2', '#74747e']

export default function AnalyticsPage() {
  const { data } = useApp()
  const [rangeDays, setRangeDays] = useState(90)
  const cutoff = cutoffMs(rangeDays)
  const completed = data.sessions.filter(s => s.endedAt && s.endedAt >= cutoff).sort((a, b) => a.endedAt! - b.endedAt!)
  const unit = data.profile.unit

  // Exercises with logged history, most-trained first.
  const trained = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of data.sessions) {
      if (!s.endedAt) continue
      for (const ex of s.exercises) {
        if (ex.sets.some(st => st.done)) counts.set(ex.exerciseId, (counts.get(ex.exerciseId) ?? 0) + 1)
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
  }, [data.sessions])

  const [selected, setSelected] = useState<string | null>(null)
  const exerciseId = selected ?? trained[0] ?? null

  const strengthData = useMemo(() => {
    if (!exerciseId) return []
    return exerciseHistory(data.sessions, exerciseId)
      .filter(p => p.date >= cutoff)
      .map(p => ({ date: p.date, e1RM: p.bestE1rm, 'Top weight': p.topWeight, Volume: p.totalVolume, Reps: p.topReps }))
  }, [data.sessions, exerciseId, cutoff])

  const volumeData = useMemo(() => {
    // Weekly volume buckets.
    const weeks = new Map<number, number>()
    for (const s of completed) {
      const wk = Math.floor(s.endedAt! / (7 * 24 * 3600 * 1000))
      weeks.set(wk, (weeks.get(wk) ?? 0) + sessionVolume(s))
    }
    return [...weeks.entries()].sort((a, b) => a[0] - b[0])
      .map(([wk, vol]) => ({ week: format(wk * 7 * 24 * 3600 * 1000, 'MMM d'), Volume: Math.round(vol) }))
  }, [completed])

  const splitData = useMemo(() => {
    const split = muscleSplit(data.sessions, rangeDays, id => exerciseById(id, data.customExercises)?.muscleGroup)
    return Object.entries(split).sort((a, b) => b[1] - a[1]).map(([name, sets]) => ({ name, sets }))
  }, [data.sessions, data.customExercises, rangeDays])

  const goal = exerciseId ? data.profile.exerciseGoals.find(g => g.exerciseId === exerciseId) : undefined

  return (
    <div className="px-5 pt-8">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button key={r.label} className={`chip !px-2.5 !py-1 text-xs ${rangeDays === r.days ? 'chip-active' : ''}`} onClick={() => setRangeDays(r.days)}>
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {trained.length === 0 ? (
        <div className="card p-8 text-center text-sm text-zinc-500">
          Charts appear after your first logged workout. Go lift something heavy.
        </div>
      ) : (
        <>
          <section className="card mb-4 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="label">Strength progress</h2>
              {exerciseId && <Link className="text-xs accent-text" to={`/exercise/${exerciseId}`}>Detail</Link>}
            </div>
            <select
              className="input mb-3 !py-2 text-sm"
              value={exerciseId ?? ''}
              onChange={e => setSelected(e.target.value)}
            >
              {trained.map(id => (
                <option key={id} value={id}>{exerciseById(id, data.customExercises)?.name ?? id}</option>
              ))}
              {allExercises(data.customExercises).filter(e => !trained.includes(e.id)).map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            {strengthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={strengthData} margin={{ left: -14, right: 6, top: 6 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d3ff3a" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#d3ff3a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={d => format(d, 'M/d')} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip content={<ChartTip unit={unit} />} />
                  <Area type="monotone" dataKey="e1RM" stroke="#d3ff3a" strokeWidth={2.5} fill="url(#g1)" dot={{ r: 3, fill: '#d3ff3a' }} />
                  <Area type="monotone" dataKey="Top weight" stroke="#a9a9b2" strokeWidth={1.5} fill="none" strokeDasharray="4 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-zinc-500">No data in this range for this exercise.</p>
            )}
            {goal && strengthData.length > 0 && (
              <p className="mt-1 text-xs text-zinc-500">
                Goal: {goal.targetWeight} {unit} × {goal.targetReps} by {format(new Date(goal.targetDate + 'T12:00:00'), 'MMM d, yyyy')}
              </p>
            )}
          </section>

          <section className="card mb-4 p-4">
            <h2 className="label mb-3">Weekly volume ({unit})</h2>
            {volumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={volumeData} margin={{ left: -8, right: 6 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip unit={unit} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="Volume" radius={[5, 5, 0, 0]}>
                    {volumeData.map((_, i) => <Cell key={i} fill={i === volumeData.length - 1 ? '#d3ff3a' : 'rgba(211,255,58,0.35)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-zinc-500">No workouts in this range.</p>
            )}
          </section>

          <section className="card mb-4 p-4">
            <h2 className="label mb-3">Muscle balance (sets)</h2>
            {splitData.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(160, splitData.length * 34)}>
                <BarChart data={splitData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={86} tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip unit="sets" />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="sets" radius={[0, 6, 6, 0]} barSize={16}>
                    {splitData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-zinc-500">No sets in this range.</p>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export function ChartTip({ active, payload, label, unit }: {
  active?: boolean
  payload?: { name: string; value: number; color?: string }[]
  label?: string | number
  unit: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="card num !rounded-lg border-white/15 bg-zinc-900/95 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-zinc-300">{typeof label === 'number' ? format(label, 'MMM d, yyyy') : label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color ?? '#d3ff3a' }}>
          {p.name}: <strong>{Math.round(p.value * 10) / 10}</strong> {p.name === 'Reps' ? '' : unit}
        </p>
      ))}
    </div>
  )
}
