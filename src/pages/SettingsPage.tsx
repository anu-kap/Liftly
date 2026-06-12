import { useState } from 'react'
import { format, addMonths } from 'date-fns'
import { useApp } from '../state/AppContext'
import { exerciseById, EXERCISES } from '../lib/exercises'
import { generatePlan } from '../lib/generator'
import type { ExerciseGoal } from '../lib/types'
import ExercisePicker from '../components/ExercisePicker'

export default function SettingsPage() {
  const { data, update, user, cloudAvailable, syncState, signIn, logOut, resetAll } = useApp()
  const [pickingGoal, setPickingGoal] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [signinError, setSigninError] = useState<string | null>(null)
  const p = data.profile

  const setProfile = (patch: Partial<typeof p>) =>
    update(d => ({ ...d, profile: { ...d.profile, ...patch } }))

  const setGoal = (i: number, patch: Partial<ExerciseGoal>) =>
    setProfile({ exerciseGoals: p.exerciseGoals.map((g, j) => (j === i ? { ...g, ...patch } : g)) })

  return (
    <div className="px-5 pt-8 pb-8">
      <h1 className="mb-5 text-2xl font-bold tracking-tight">Profile</h1>

      {/* Account / sync */}
      <section className="card mb-4 p-4">
        <h2 className="label mb-2.5">Account & cloud backup</h2>
        {user ? (
          <>
            <div className="flex items-center gap-3">
              {user.photoURL && <img src={user.photoURL} alt="" className="h-10 w-10 rounded-full" referrerPolicy="no-referrer" />}
              <div>
                <p className="text-sm font-medium">{user.displayName}</p>
                <p className="text-xs text-zinc-500">{user.email}</p>
              </div>
            </div>
            <p className="mt-2 text-xs">
              {syncState === 'synced' && <span className="accent-text">All data synced to the cloud</span>}
              {syncState === 'syncing' && <span className="text-(--color-warn)">Syncing…</span>}
              {syncState === 'error' && <span className="text-(--color-bad)">Sync error — check your connection</span>}
            </p>
            <button className="btn-ghost mt-3 w-full !py-2 text-sm" onClick={logOut}>Sign out</button>
          </>
        ) : cloudAvailable ? (
          <>
            <p className="mb-3 text-xs text-zinc-500">Sign in with Google so your workouts survive any device or browser change. Your local data is migrated automatically.</p>
            <button
              className="btn-primary w-full !py-2.5 text-sm"
              onClick={async () => {
                setSigninError(null)
                try { await signIn() } catch (e) { setSigninError(e instanceof Error ? e.message : 'Sign-in failed') }
              }}
            >
              Continue with Google
            </button>
            {signinError && <p className="mt-2 text-xs text-(--color-bad)">{signinError}</p>}
          </>
        ) : (
          <p className="text-xs text-zinc-500">
            Running in <strong>local mode</strong> — data is saved on this device. To enable Google sign-in and cloud backup,
            add your Firebase config (see <code className="accent-text">src/lib/firebaseConfig.ts</code> / README).
          </p>
        )}
      </section>

      {/* Training preferences */}
      <section className="card mb-4 p-4">
        <h2 className="label mb-3">Training preferences</h2>

        <p className="mb-1.5 text-xs text-zinc-500">Focus</p>
        <div className="mb-3 flex gap-2">
          {(['strength', 'hypertrophy', 'general'] as const).map(f => (
            <button key={f} className={`chip flex-1 capitalize ${p.focus === f ? 'chip-active' : ''}`} onClick={() => setProfile({ focus: f })}>{f === 'hypertrophy' ? 'muscle' : f}</button>
          ))}
        </div>

        <p className="mb-1.5 text-xs text-zinc-500">Days per week</p>
        <div className="mb-3 flex gap-2">
          {[2, 3, 4, 5, 6].map(n => (
            <button key={n} className={`chip flex-1 ${p.daysPerWeek === n ? 'chip-active' : ''}`} onClick={() => setProfile({ daysPerWeek: n })}>{n}</button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1.5 text-xs text-zinc-500">Units</p>
            <div className="flex gap-2">
              {(['lb', 'kg'] as const).map(u => (
                <button key={u} className={`chip flex-1 ${p.unit === u ? 'chip-active' : ''}`} onClick={() => setProfile({ unit: u })}>{u}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs text-zinc-500">Default rest (sec)</p>
            <input
              className="input !py-1.5 text-center" type="number" inputMode="numeric"
              value={p.defaultRestSeconds || ''}
              onChange={e => setProfile({ defaultRestSeconds: Number(e.target.value) || 0 })}
            />
          </div>
        </div>

        <button
          className="btn-ghost mt-4 w-full !py-2 text-sm accent-text"
          onClick={() => update(d => ({ ...d, templates: [...generatePlan(d.profile), ...d.templates] }))}
        >
          Regenerate plan from these settings
        </button>
      </section>

      {/* Goals */}
      <section className="card mb-4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="label">Lift goals</h2>
          <button className="btn-ghost !px-3 !py-1 text-xs" onClick={() => setPickingGoal(true)}>Add goal</button>
        </div>
        <div className="space-y-3">
          {p.exerciseGoals.map((g, i) => (
            <div key={g.exerciseId} className="rounded-xl border border-(--color-line) p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{exerciseById(g.exerciseId, data.customExercises)?.name ?? g.exerciseId}</p>
                <button className="text-xs text-(--color-bad)" onClick={() => setProfile({ exerciseGoals: p.exerciseGoals.filter((_, j) => j !== i) })}>Remove</button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <label className="text-[0.65rem] text-zinc-500">TARGET {p.unit.toUpperCase()}
                  <input className="input mt-0.5 !py-1.5 text-center" type="number" inputMode="decimal" value={g.targetWeight || ''} onChange={e => setGoal(i, { targetWeight: Number(e.target.value) || 0 })} />
                </label>
                <label className="text-[0.65rem] text-zinc-500">× REPS
                  <input className="input mt-0.5 !py-1.5 text-center" type="number" inputMode="numeric" value={g.targetReps || ''} onChange={e => setGoal(i, { targetReps: Number(e.target.value) || 0 })} />
                </label>
                <label className="text-[0.65rem] text-zinc-500">BY DATE
                  <input className="input mt-0.5 !px-1 !py-1.5 text-[0.7rem]" type="date" value={g.targetDate} onChange={e => setGoal(i, { targetDate: e.target.value })} />
                </label>
              </div>
            </div>
          ))}
          {p.exerciseGoals.length === 0 && <p className="text-xs text-zinc-500">No goals yet. Add one to unlock pace coaching during workouts.</p>}
        </div>
      </section>

      {/* Danger zone */}
      <section className="card p-4">
        <h2 className="label mb-2.5">Data</h2>
        <button
          className="btn-ghost w-full !py-2 text-sm"
          onClick={() => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `liftly-export-${format(Date.now(), 'yyyy-MM-dd')}.json`
            a.click()
            URL.revokeObjectURL(a.href)
          }}
        >Export data (JSON)</button>
        <button className="btn-ghost mt-2 w-full !py-2 text-sm text-(--color-bad)" onClick={() => setConfirmReset(true)}>Reset all data</button>
      </section>

      {pickingGoal && (
        <ExercisePicker
          onClose={() => setPickingGoal(false)}
          onPick={ex => {
            if (!p.exerciseGoals.some(g => g.exerciseId === ex.id)) {
              setProfile({
                exerciseGoals: [...p.exerciseGoals, {
                  exerciseId: ex.id,
                  targetWeight: p.unit === 'lb' ? 135 : 60,
                  targetReps: 5,
                  targetDate: format(addMonths(new Date(), 3), 'yyyy-MM-dd'),
                }],
              })
            }
            setPickingGoal(false)
          }}
        />
      )}

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm" onClick={() => setConfirmReset(false)}>
          <div className="card animate-pop w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Reset everything?</h2>
            <p className="mt-1 text-sm text-zinc-400">All workouts, templates and goals will be deleted{user ? ' from this device and the cloud' : ''}. This cannot be undone.</p>
            <div className="mt-5 flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => setConfirmReset(false)}>Cancel</button>
              <button className="btn-primary flex-1 !bg-(--color-bad) !text-white" onClick={() => { resetAll(); setConfirmReset(false) }}>Reset</button>
            </div>
          </div>
        </div>
      )}

      <p className="label mt-6 text-center !text-zinc-600">Liftly · {EXERCISES.length}+ exercises</p>
    </div>
  )
}
