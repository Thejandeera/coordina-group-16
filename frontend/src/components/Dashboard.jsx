import { useEffect } from 'react'
import { authFetch, readJsonSafe, setSessionUserData } from '../lib/authClient'

function Dashboard({ user, onLogout, onUserRefresh }) {
  useEffect(() => {
    let cancelled = false

    const refreshUserProfile = async () => {
      try {
        const response = await authFetch('/api/users/me')
        const profileData = await readJsonSafe(response)
        if (!response.ok || !profileData || cancelled) {
          return
        }

        setSessionUserData(profileData)
        onUserRefresh?.(profileData)
      } catch {
        // Keep existing session user if profile refresh fails.
      }
    }

    refreshUserProfile()

    return () => {
      cancelled = true
    }
  }, [onUserRefresh])

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#041229] via-[#0b2347] to-[#153865] text-white">
      <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-[#ff8b2d]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />

      <main className="relative z-10 mx-auto w-[min(980px,calc(100%-1.5rem))] py-10">
        <section className="rounded-2xl bg-white p-6 text-slate-900 shadow-2xl sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#385075]">Coordina Dashboard</p>
              <h1 className="mt-2 text-3xl font-extrabold text-[#0b2347]">Welcome, {user?.username ?? 'User'}</h1>
              <p className="mt-2 text-sm text-slate-600">You are signed in and your session is active.</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg bg-[#0b2347] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#153865]"
            >
              Logout
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Username</p>
              <p className="mt-1 text-base font-bold text-slate-900">{user?.username ?? '-'}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-1 text-base font-bold text-slate-900">{user?.email ?? '-'}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone Number</p>
              <p className="mt-1 text-base font-bold text-slate-900">{user?.phoneNumber || 'Not available'}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">User Id</p>
              <p className="mt-1 text-base font-bold text-slate-900">{user?.id ?? '-'}</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
