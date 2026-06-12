import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useApp } from './state/AppContext'
import BottomNav from './components/BottomNav'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import WorkoutPage from './pages/WorkoutPage'
import TemplatesPage from './pages/TemplatesPage'
import HistoryPage from './pages/HistoryPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ExerciseDetailPage from './pages/ExerciseDetailPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const { data } = useApp()
  const location = useLocation()

  if (!data.profile.onboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  const hideNav = location.pathname === '/onboarding' || location.pathname === '/workout'

  return (
    <div
      className="mx-auto max-w-lg min-h-dvh pb-24"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/workout" element={<WorkoutPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/exercise/:id" element={<ExerciseDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  )
}
