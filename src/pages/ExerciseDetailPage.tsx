import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useApp } from '../state/AppContext'
import { exerciseById } from '../lib/exercises'
import { e1rm, exerciseHistory, goalPace, recommend } from '../lib/overload'
import { ChartTip } from './AnalyticsPage'

type Metric = 'e1RM' | 'Top weight' | 'Volume' | 'Reps'

export default function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data } = useApp()
  const [metric, setMetric] = useState<Metric>('e1RM')
  const ex = id ? exerciseById(id, data.customExercises) : undefined
  const unit = data.profile.unit

  const history = useMemo(() => (id ? exerciseHistory(data.sessions, id) : []), [data.sessions, id])
  const goal = data.profile.exerciseGoals.find(g => g.exerciseId === id)
  const pace = goal ? goalPace(history, goal) : null
  const rec = id ? recommend(data, id, goal) : null

  const chart = history.map(p => ({
    date: p.date,
    'e1RM': p.bestE1rm,
    'Top weight': p.topWeight,
    'Volume': p.totalVolume,
    'Reps': p.topReps,
  }))

  const best = history.reduce((m, p) => Math.max(m, p.bestE1rm), 0)
  const bestWeight = history.reduce((m, p) => Math.max(m, p.topWeight), 0)
  const totalSets = history.reduce((n, p) => n + p.sets, 0)

  if (!ex) return <div className="p-8 text-center text-zinc-500">Exercise not found.</div>

  return (
    <div className="px-5 pt-8">
      <h1 className="text-2xl font-bold tracking-tight">{ex.name}</h1>
      <p className="label mb-4 mt-1">{ex.muscleGroup} · {ex.equipment}</p>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat label={`Best e1RM (${unit})`} value={best ? Math.round(best).toString() : '—'} />
        <Stat label={`Top weight (${unit})`} value={bestWeight ? String(bestWeight) : '—'} />
        <Stat label="Sets logged" value={String(totalSets)} />
      </div>

      {rec && (
        <div className="card mb-4 border-(--color-accent)/40 bg-(--color-accent-dim) p-4">
          <p className="label !text-(--color-accent)">Next session targets</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {rec.perSet.map((t, i) => (
              <span key={i} className="num rounded-md border border-(--color-accent)/40 px-2 py-1 text-sm font-semibold">
                {t.weight > 0 ? `${t.weight}×${t.reps}` : `— × ${t.reps}`}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-400">{rec.rationale}</p>
        </div>
      )}

      {pace && goal && (
        <div className="card mb-4 p-4">
          <div className="flex justify-between text-sm">
            <p className="font-semibold">Goal pace</p>
            <p className={pace.onTrack ? 'accent-text' : 'text-(--color-warn)'}>{pace.note}</p>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-(--color-accent)" style={{ width: `${Math.round(pace.pctComplete * 100)}%` }} />
          </div>
          <p className="num mt-1.5 text-xs text-zinc-500">
            Current e1RM {Math.round(pace.currentE1rm)} {unit} → goal {Math.round(pace.targetE1rm)} {unit} ({goal.targetWeight} × {goal.targetReps}) by {format(new Date(goal.targetDate + 'T12:00:00'), 'MMM d, yyyy')}
          </p>
        </div>
      )}

      <div className="card p-4">
        <div className="mb-3 flex gap-1.5 overflow-x-auto">
          {(['e1RM', 'Top weight', 'Volume', 'Reps'] as Metric[]).map(m => (
            <button key={m} className={`chip shrink-0 !px-3 !py-1 text-xs ${metric === m ? 'chip-active' : ''}`} onClick={() => setMetric(m)}>{m}</button>
          ))}
        </div>
        {chart.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chart} margin={{ left: -10, right: 6, top: 6 }}>
              <defs>
                <linearGradient id="gd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d3ff3a" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#d3ff3a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="date" tickFormatter={d => format(d, 'M/d')} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip content={<ChartTip unit={metric === 'Reps' ? '' : unit} />} />
              {goal && metric === 'e1RM' && (
                <ReferenceLine y={e1rm(goal.targetWeight, goal.targetReps)} stroke="#e8e8ec" strokeDasharray="6 4" label={{ value: 'Goal', fill: '#e8e8ec', fontSize: 11, position: 'insideTopRight' }} />
              )}
              <Area type="monotone" dataKey={metric} stroke="#d3ff3a" strokeWidth={2.5} fill="url(#gd)" dot={{ r: 3, fill: '#d3ff3a' }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-10 text-center text-sm text-zinc-500">No history yet for this exercise.</p>
        )}
      </div>

      <section className="mt-4 pb-4">
        <h2 className="label mb-2">Session log</h2>
        <div className="space-y-2">
          {[...history].reverse().map(p => (
            <div key={p.date} className="card flex items-center justify-between p-3 text-sm">
              <span className="text-zinc-400">{format(p.date, 'MMM d, yyyy')}</span>
              <span className="num text-xs">
                {p.topWeight} {unit} × {p.topReps} · e1RM {Math.round(p.bestE1rm)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3 text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="mt-0.5 text-[0.62rem] text-zinc-500">{label}</p>
    </div>
  )
}
