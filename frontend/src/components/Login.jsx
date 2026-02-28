import { useState } from 'react'
import { apiFetch, authFetch, readJsonSafe, setAuthTokens, setSessionUserData } from '../lib/authClient'

function Login({ onSuccess, onError, onLoggedIn }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    identifier: '',
    password: '',
  })

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

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
      onSuccess?.('Login successful.')
    } catch (error) {
      onError?.(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
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
