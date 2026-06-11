import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../state/AppContext'

const tabs = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/history', label: 'History', icon: HistoryIcon },
  { to: '/templates', label: 'Train', icon: null }, // center action
  { to: '/analytics', label: 'Insights', icon: ChartIcon },
  { to: '/settings', label: 'Profile', icon: UserIcon },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { data } = useApp()
  const inProgress = !!data.activeSession

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="card flex items-center justify-between px-3 py-2 shadow-2xl shadow-black/60">
        {tabs.map(t =>
          t.icon ? (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[0.65rem] font-medium transition-colors ${
                  isActive ? 'text-violet-400' : 'text-zinc-500'
                }`
              }
            >
              <t.icon />
              {t.label}
            </NavLink>
          ) : (
            <button
              key="train"
              onClick={() => navigate(inProgress ? '/workout' : '/templates')}
              className={`btn-primary -mt-7 flex h-14 w-14 items-center justify-center rounded-full !p-0 text-2xl ${inProgress ? 'timer-pulse' : ''}`}
              aria-label={inProgress ? 'Resume workout' : 'Start workout'}
            >
              {inProgress ? <ResumeIcon /> : <PlusIcon />}
            </button>
          ),
        )}
      </div>
    </nav>
  )
}

function HomeIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>
}
function HistoryIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
}
function ChartIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></svg>
}
function UserIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" /></svg>
}
function PlusIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
}
function ResumeIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
}
