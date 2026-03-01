import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import { clearAuthTokens, clearSessionUserData, getSessionUserData } from './lib/authClient'

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
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login onLoggedIn={handleLoginSuccess} />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/dashboard" replace /> : <Signup />}
      />
      <Route
        path="/dashboard/*"
        element={user ? <Dashboard user={user} onLogout={handleLogout} onUserRefresh={setUser} /> : <Navigate to="/login" replace />}
      />
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}

export default App
