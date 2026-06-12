import { Link } from 'react-router-dom'
import { useApp } from '../state/AppContext'

// Small status pill: shows cloud sync state, links to Profile for sign-in.
export default function SyncBadge() {
  const { user, syncState, cloudAvailable } = useApp()

  if (user) {
    const color = syncState === 'synced' ? 'text-(--color-accent)' : syncState === 'error' ? 'text-(--color-bad)' : 'text-(--color-warn)'
    const label = syncState === 'synced' ? 'Synced' : syncState === 'error' ? 'Sync error' : 'Syncing…'
    return (
      <Link to="/settings" className={`chip flex items-center gap-1.5 ${color}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {label}
      </Link>
    )
  }
  return (
    <Link to="/settings" className="chip text-zinc-400">
      {cloudAvailable ? 'Sign in' : 'Local'}
    </Link>
  )
}
