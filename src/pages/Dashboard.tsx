import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useApp } from '../state/AppContext'
import { exerciseById } from '../lib/exercises'
import { e1rm, exerciseHistory, goalPace, sessionVolume, weeklyStreak } from '../lib/overload'
import SyncBadge from '../components/SyncBadge'
import MiniCalendar from '../components/MiniCalendar'

export default function Dashboard() {
  const { data } = useApp()
  const navigate = useNavigate()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const completed = data.sessions.filter(s => s.endedAt).sort((a, b) => b.endedAt! - a.endedAt!)
  const streak = weeklyStreak(data.sessions)
  const thisWeekStart = new Date(); thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay()); thisWeekStart.setHours(0, 0, 0, 0)
  const thisWeek = completed.filter(s => s.endedAt! >= thisWeekStart.getTime())
  const recent = completed.slice(0, 3)

  return (
    <div className="px-5 pt-8">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <p className="label">{format(new Date(), 'EEEE, MMM d')}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {data.profile.displayName ? `Hey, ${data.profile.displayName.split(' ')[0]}` : <>Time to <span className="accent-text">lift</span></>}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-ghost flex h-9 w-9 items-center justify-center !rounded-lg !p-0"
            onClick={() => setCalendarOpen(true)}
            aria-label="Open training calendar"
          >
            <CalendarIcon />
          </button>
          <SyncBadge />
        </div>
      </header>

      {data.activeSession && (
        <button className="card mb-5 w-full border-(--color-accent)/40 bg-(--color-accent-dim) p-4 text-left" onClick={() => navigate('/workout')}>
          <p className="text-sm font-semibold accent-text">Workout in progress</p>
          <p className="mt-0.5 text-xs text-zinc-400">{data.activeSession.name} — tap to resume</p>
        </button>
      )}

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="Week streak" value={`${streak}`} suffix="wk" />
        <Stat label="This week" value={`${thisWeek.length}/${data.profile.daysPerWeek}`} suffix="days" />
        <Stat label="Workouts" value={`${completed.length}`} suffix="total" />
      </div>

      {data.profile.exerciseGoals.length > 0 && (
        <section className="mb-5">
          <h2 className="label mb-2">Goal progress</h2>
          <div className="space-y-3">
            {data.profile.exerciseGoals.map(g => {
              const ex = exerciseById(g.exerciseId, data.customExercises)
              const hist = exerciseHistory(data.sessions, g.exerciseId)
              const pace = goalPace(hist, g)
              const targetE = e1rm(g.targetWeight, g.targetReps)
              return (
                <Link key={g.exerciseId} to={`/exercise/${g.exerciseId}`} className="card block p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-medium">{ex?.name ?? g.exerciseId}</p>
                    <p className="num shrink-0 text-xs text-zinc-500">
                      {g.targetWeight}{data.profile.unit}×{g.targetReps} · {format(new Date(g.targetDate + 'T12:00:00'), 'MMM d')}
                    </p>
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-(--color-accent) transition-all"
                      style={{ width: `${Math.round(pace.pctComplete * 100)}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-xs">
                    <span className={pace.onTrack ? 'accent-text' : 'text-(--color-warn)'}>{pace.note}</span>
                    <span className="num text-zinc-500">{Math.round(pace.currentE1rm)} / {Math.round(targetE)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="label">Quick start</h2>
          <Link to="/templates" className="text-xs accent-text">All templates</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {data.templates.slice(0, 5).map(t => (
            <button
              key={t.id}
              className="card min-w-36 shrink-0 p-4 text-left"
              onClick={() => navigate('/templates', { state: { startTemplateId: t.id } })}
            >
              <p className="text-sm font-semibold">{t.name}</p>
              <p className="num mt-1 text-xs text-zinc-500">{t.exercises.length} exercises</p>
            </button>
          ))}
          {data.templates.length === 0 && (
            <Link to="/templates" className="card min-w-40 p-4 text-sm text-zinc-400">Create your first template</Link>
          )}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="label">Recent</h2>
          <Link to="/history" className="text-xs accent-text">History</Link>
        </div>
        <div className="space-y-2.5">
          {recent.map(s => (
            <div key={s.id} className="card p-4">
              <div className="flex justify-between">
                <p className="font-medium">{s.name}</p>
                <p className="num text-xs text-zinc-500">{format(s.endedAt!, 'MMM d')}</p>
              </div>
              <p className="num mt-1 text-xs text-zinc-500">
                {s.exercises.length} exercises · {Math.round(sessionVolume(s)).toLocaleString()} {data.profile.unit} volume
              </p>
            </div>
          ))}
          {recent.length === 0 && (
            <div className="card p-6 text-center text-sm text-zinc-500">
              No workouts yet. Hit the <span className="accent-text">+</span> button to start your first one.
            </div>
          )}
        </div>
      </section>

      {calendarOpen && <MiniCalendar sessions={data.sessions} onClose={() => setCalendarOpen(false)} />}
    </div>
  )
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <div className="card p-3 text-center">
      <p className="num text-xl font-bold">{value}<span className="ml-0.5 text-[0.6rem] font-normal text-zinc-500">{suffix}</span></p>
      <p className="label mt-1 !text-[0.55rem]">{label}</p>
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}
