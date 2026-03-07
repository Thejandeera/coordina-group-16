import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './Pages/Login'
import Signup from './Pages/Signup'
import Dashboard from './Pages/Dashboard'
import { clearAuthTokens, clearSessionUserData, getSessionUserData } from './lib/authClient'

const PATHS = {
  root: '/',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  projectsEvents: '/projects-events',
  bookings: '/bookings',
  calendar: '/calendar',
  forms: '/forms',
  analytics: '/analytics',
  settings: '/settings',
}

const protectedPaths = [
  PATHS.root,
  PATHS.dashboard,
  PATHS.projectsEvents,
  PATHS.projectsEvents + '/:id',
  PATHS.bookings,
  PATHS.calendar,
  PATHS.forms,
  PATHS.analytics,
  PATHS.settings,
]

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sessionUser = getSessionUserData()
    if (sessionUser) {
      setUser(sessionUser)
    }
    setLoading(false)
  }, [])

  const handleLoginSuccess = (profileData) => {
    setUser(profileData)
  }

  const handleLogout = () => {
    clearAuthTokens()
    clearSessionUserData()
    setUser(null)
  }

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-600">Loading...</div>
  }

  return (
    <Routes>
      <Route
        path={PATHS.login}
        element={
          user ? (
            <Navigate to={PATHS.dashboard} replace />
          ) : (
            <Login onLoggedIn={handleLoginSuccess} signupPath={PATHS.signup} />
          )
        }
      />
      <Route
        path={PATHS.signup}
        element={user ? <Navigate to={PATHS.dashboard} replace /> : <Signup loginPath={PATHS.login} />}
      />
      {protectedPaths.map((path) => (
        <Route
          key={path}
          path={path}
          element={
            user ? (
              <Dashboard user={user} onLogout={handleLogout} onUserRefresh={setUser} paths={PATHS} />
            ) : (
              <Navigate to={PATHS.login} replace />
            )
          }
        />
      ))}
      <Route path="*" element={<Navigate to={user ? PATHS.dashboard : PATHS.login} replace />} />
    </Routes>
  )
}

export default App
