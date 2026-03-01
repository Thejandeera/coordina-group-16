import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, authFetch, readJsonSafe, setAuthTokens, setSessionUserData } from '../lib/authClient'

function Login({ onLoggedIn }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    identifier: '',
    password: '',
  })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const setNotice = (text, type) => {
    setMessage(text)
    setMessageType(type)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setMessageType('')

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await readJsonSafe(response)
      if (!response.ok) {
        throw new Error(data?.message ?? 'Login failed')
      }
      if (!data?.accessToken || !data?.refreshToken) {
        throw new Error('Login response is invalid.')
      }

      setAuthTokens(data)
      let profileData = null

      try {
        const profileResponse = await authFetch('/api/users/me')
        const apiProfile = await readJsonSafe(profileResponse)
        if (profileResponse.ok && apiProfile) {
          profileData = apiProfile
        }
      } catch {
        profileData = null
      }

      if (!profileData) {
        profileData = getFallbackUserFromToken(data.accessToken)
      }
      if (!profileData) {
        throw new Error('Login succeeded but failed to load user profile.')
      }

      setSessionUserData(profileData)
      onLoggedIn?.(profileData)
      setNotice('Login successful.', 'success')
    } catch (error) {
      setNotice(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#041229] via-[#0b2347] to-[#153865] text-white">
      <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-[#ff8b2d]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />

      <main className="relative z-10 mx-auto grid min-h-screen w-[min(1120px,calc(100%-1.5rem))] items-center gap-8 py-8 md:grid-cols-[1.1fr_0.9fr]">
        <section>
          <p className="mb-4 text-xs uppercase tracking-[0.18em] text-blue-100/90">Coordina Platform</p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Community Collaboration,
            <span className="block text-[#ff8b2d]">Organized Beautifully</span>
          </h1>
          <p className="mt-4 max-w-xl text-blue-100/90">
            Plan events, assign tasks, and keep your team connected with secure access, clear ownership, and one shared workspace.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-blue-300/20 bg-blue-950/45 p-4">
              <h3 className="text-2xl font-bold text-[#ff8b2d]">1000+</h3>
              <p className="text-sm text-blue-100/80">Active Members</p>
            </article>
            <article className="rounded-xl border border-blue-300/20 bg-blue-950/45 p-4">
              <h3 className="text-2xl font-bold text-[#ff8b2d]">99%</h3>
              <p className="text-sm text-blue-100/80">Availability Target</p>
            </article>
            <article className="rounded-xl border border-blue-300/20 bg-blue-950/45 p-4">
              <h3 className="text-2xl font-bold text-[#ff8b2d]">24/7</h3>
              <p className="text-sm text-blue-100/80">Team Collaboration</p>
            </article>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 text-slate-900 shadow-2xl sm:p-7">
          <header>
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in to continue.</p>
          </header>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button
              className="rounded-lg px-3 py-2 text-sm font-semibold transition bg-[#0b2347] text-white"
              type="button"
            >
              Login
            </button>
            <button
              className="rounded-lg px-3 py-2 text-sm font-semibold transition text-[#385075]"
              type="button"
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </button>
          </div>

          <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-1 text-sm font-semibold text-[#294c78]">
              Username or Email
              <input
                type="text"
                placeholder="Enter your username or email"
                value={form.identifier}
                onChange={(event) => setForm((prev) => ({ ...prev, identifier: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                required
              />
            </label>

            <label className="grid gap-1 text-sm font-semibold text-[#294c78]">
              Password
              <input
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-xl bg-gradient-to-br from-[#ff8b2d] to-[#f97316] px-4 py-2.5 font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {message && (
            <p
              className={`mt-4 rounded-lg px-3 py-2 text-sm font-semibold ${messageType === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}
            >
              {message}
            </p>
          )}
        </section>
      </main>
    </div>
  )
}

const getFallbackUserFromToken = (accessToken) => {
  try {
    const parts = accessToken.split('.')
    if (parts.length < 2) {
      return null
    }

    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=')
    const claims = JSON.parse(atob(payload))

    return {
      id: claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ?? null,
      username: claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ?? 'User',
      email:
        claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ??
        claims.email ??
        '',
      phoneNumber: '',
    }
  } catch {
    return null
  }
}

export default Login
