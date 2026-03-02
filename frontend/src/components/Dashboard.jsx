import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authFetch, readJsonSafe, setSessionUserData } from '../lib/authClient'
import Sidebar from './Sidebar'
import UpdateProfile from './UpdateProfile'
import ProjectsEvents from './ProjectsEvents'

const navItems = ['Dashboard', 'Projects & Events', 'Bookings', 'Analytics', 'Settings']
const defaultPaths = {
  dashboard: '/dashboard',
  projectsEvents: '/projects-events',
  bookings: '/bookings',
  analytics: '/analytics',
  settings: '/settings',
}

const emptyWeeklyTasks = [
  { day: 'Mon', value: 0 },
  { day: 'Tue', value: 0 },
  { day: 'Wed', value: 0 },
  { day: 'Thu', value: 0 },
  { day: 'Fri', value: 0 },
  { day: 'Sat', value: 0 },
  { day: 'Sun', value: 0 },
]

const formatTimeAgo = (dateValue) => {
  if (!dateValue) {
    return '-'
  }

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  const diffMs = Date.now() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) {
    return 'Just now'
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) {
    return 'Yesterday'
  }
  return `${diffDays} days ago`
}

function Dashboard({ user, onLogout, onUserRefresh, paths }) {
  const resolvedPaths = { ...defaultPaths, ...(paths ?? {}) }
  const dashboardPath = resolvedPaths.dashboard
  const projectsEventsPath = resolvedPaths.projectsEvents
  const bookingsPath = resolvedPaths.bookings
  const analyticsPath = resolvedPaths.analytics
  const settingsPath = resolvedPaths.settings

  const navToPath = {
    Dashboard: dashboardPath,
    'Projects & Events': projectsEventsPath,
    Bookings: bookingsPath,
    Analytics: analyticsPath,
    Settings: settingsPath,
  }

  const navigate = useNavigate()
  const location = useLocation()
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [isDarkTheme, setIsDarkTheme] = useState(() => localStorage.getItem('dashboardTheme') === 'dark')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileNotice, setProfileNotice] = useState({ text: '', type: '' })
  const [dashboardNotice, setDashboardNotice] = useState({ text: '', type: '' })
  const [profileImageFile, setProfileImageFile] = useState(null)
  const [dashboardStats, setDashboardStats] = useState([
    { label: 'Active Projects', value: '0' },
    { label: 'Upcoming Events', value: '0' },
    { label: 'Pending Tasks', value: '0' },
    { label: 'Donations Raised', value: 'LKR 0' },
  ])
  const [dashboardActivity, setDashboardActivity] = useState([])
  const [dashboardUpcoming, setDashboardUpcoming] = useState([])
  const [dashboardWeeklyTasks, setDashboardWeeklyTasks] = useState(emptyWeeklyTasks)
  const [projectEntities, setProjectEntities] = useState([])
  const [projectEntitiesLoading, setProjectEntitiesLoading] = useState(false)
  const [projectEntitiesNotice, setProjectEntitiesNotice] = useState({ text: '', type: '' })
  const [form, setForm] = useState({
    username: user?.username ?? '',
    email: user?.email ?? '',
    phoneNumber: user?.phoneNumber ?? '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const initials = useMemo(() => {
    const source = user?.username?.trim() || 'U'
    return source.slice(0, 2).toUpperCase()
  }, [user?.username])

  const weeklyTaskMax = useMemo(() => {
    const values = dashboardWeeklyTasks.map((item) => Number(item.value || 0))
    const maxValue = Math.max(...values, 0)
    return Math.max(4, Math.ceil(maxValue / 2) * 2)
  }, [dashboardWeeklyTasks])

  useEffect(() => {
    localStorage.setItem('dashboardTheme', isDarkTheme ? 'dark' : 'light')
  }, [isDarkTheme])

  useEffect(() => {
    const normalizedPath = location.pathname.replace(/\/+$/, '') || dashboardPath
    let nextActive = 'Dashboard'
    if (normalizedPath === projectsEventsPath) {
      nextActive = 'Projects & Events'
    } else if (normalizedPath === bookingsPath) {
      nextActive = 'Bookings'
    } else if (normalizedPath === analyticsPath) {
      nextActive = 'Analytics'
    } else if (normalizedPath === settingsPath) {
      nextActive = 'Settings'
    }
    setActiveNav(nextActive)
  }, [analyticsPath, bookingsPath, dashboardPath, location.pathname, projectsEventsPath, settingsPath])

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      username: user?.username ?? '',
      email: user?.email ?? '',
      phoneNumber: user?.phoneNumber ?? '',
    }))
  }, [user?.username, user?.email, user?.phoneNumber])

  useEffect(() => {
    let cancelled = false

    const refreshUserProfile = async () => {
      try {
        const response = await authFetch('/api/users/me')
        const profileData = await readJsonSafe(response)
        if (!response.ok || !profileData || cancelled) {
          if (!cancelled) {
            setDashboardNotice({ text: 'Could not refresh profile data.', type: 'error' })
          }
          return
        }

        setSessionUserData(profileData)
        onUserRefresh?.(profileData)
      } catch {
        if (!cancelled) {
          setDashboardNotice({ text: 'Could not refresh profile data.', type: 'error' })
        }
      }
    }

    refreshUserProfile()

    return () => {
      cancelled = true
    }
  }, [onUserRefresh])

  const fetchProjectEntities = useCallback(async () => {
    setProjectEntitiesLoading(true)
    try {
      const response = await authFetch('/api/project-management/entities')
      const data = await readJsonSafe(response)
      if (!response.ok || !Array.isArray(data)) {
        setProjectEntitiesNotice({ text: 'Could not load projects and events.', type: 'error' })
        return
      }

      setProjectEntities(data)
      setProjectEntitiesNotice({ text: '', type: '' })
    } catch {
      setProjectEntitiesNotice({ text: 'Could not load projects and events.', type: 'error' })
    } finally {
      setProjectEntitiesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjectEntities()
  }, [fetchProjectEntities])

  useEffect(() => {
    let cancelled = false

    const fetchDashboardOverview = async () => {
      try {
        const response = await authFetch('/api/dashboard/overview')
        const data = await readJsonSafe(response)
        if (!response.ok || !data || cancelled) {
          if (!cancelled) {
            setDashboardNotice({ text: 'Could not load dashboard overview.', type: 'error' })
          }
          return
        }
        setDashboardNotice({ text: '', type: '' })

        setDashboardStats([
          { label: 'Active Projects', value: String(data.activeProjects ?? 0) },
          { label: 'Upcoming Events', value: String(data.upcomingEvents ?? 0) },
          { label: 'Pending Tasks', value: String(data.pendingTasks ?? 0) },
          { label: 'Donations Raised', value: `LKR ${Number(data.donationsRaised ?? 0).toLocaleString()}` },
        ])

        const mappedActivity = Array.isArray(data.recentActivity)
          ? data.recentActivity.map((item) => ({
              actor: item.actor ?? '',
              action: item.action ?? '',
              target: item.target ?? '',
              time: formatTimeAgo(item.occurredAt),
            }))
          : []
        setDashboardActivity(mappedActivity)

        const mappedUpcoming = Array.isArray(data.upcomingSchedule)
          ? data.upcomingSchedule.map((item) => {
              const eventDate = new Date(item.eventDate)
              const day = Number.isNaN(eventDate.getTime()) ? '--' : String(eventDate.getDate())
              const month = Number.isNaN(eventDate.getTime())
                ? '---'
                : eventDate.toLocaleString('en-US', { month: 'short' })

              return {
                day,
                month,
                title: item.title ?? '',
                time: item.timeRange ?? '09:00 - 16:00',
              }
            })
          : []
        setDashboardUpcoming(mappedUpcoming)

        if (Array.isArray(data.weeklyTasks)) {
          const mappedWeeklyTasks = data.weeklyTasks.map((item) => ({
            day: item.day ?? '',
            value: Number(item.value ?? 0),
          }))
          setDashboardWeeklyTasks(mappedWeeklyTasks.length > 0 ? mappedWeeklyTasks : emptyWeeklyTasks)
        }
      } catch {
        if (!cancelled) {
          setDashboardNotice({ text: 'Could not load dashboard overview.', type: 'error' })
        }
      }
    }

    fetchDashboardOverview()

    return () => {
      cancelled = true
    }
  }, [])

  const goToSection = (sectionName) => {
    setActiveNav(sectionName)
    navigate(navToPath[sectionName] ?? dashboardPath)
  }

  const themeVars = isDarkTheme
    ? {
        '--page-bg': '#0a1020',
        '--text-main': '#e2e8f0',
        '--text-muted': '#93a4bf',
        '--surface-bg': '#121a2f',
        '--surface-border': '#253250',
        '--surface-shadow': '0 6px 20px rgba(0,0,0,0.35)',
        '--input-bg': '#0f172a',
        '--input-border': '#2b3a5c',
        '--sidebar-bg': '#ffffff',
        '--sidebar-border': '#d5dbe8',
        '--sidebar-muted': '#64748b',
        '--sidebar-text': '#0b2347',
        '--sidebar-hover': '#eef2ff',
        '--sidebar-active-bg': '#0b2347',
        '--sidebar-active-text': '#ffffff',
      }
    : {
        '--page-bg': '#f8fafc',
        '--text-main': '#0b2347',
        '--text-muted': '#153865',
        '--surface-bg': '#ffffff',
        '--surface-border': '#d5dbe8',
        '--surface-shadow': '0 1px 2px rgba(15,23,42,0.08)',
        '--input-bg': '#ffffff',
        '--input-border': '#d5dbe8',
        '--sidebar-bg': '#ffffff',
        '--sidebar-border': '#d5dbe8',
        '--sidebar-muted': '#64748b',
        '--sidebar-text': '#0b2347',
        '--sidebar-hover': '#eef2ff',
        '--sidebar-active-bg': '#0b2347',
        '--sidebar-active-text': '#ffffff',
      }

  const openProfile = () => {
    setProfileNotice({ text: '', type: '' })
    setProfileImageFile(null)
    setForm({
      username: user?.username ?? '',
      email: user?.email ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    goToSection('Settings')
  }

  const validateProfileForm = () => {
    if (form.username.trim().length < 3) {
      return 'Username must be at least 3 characters.'
    }
    if (!/^\d{10}$/.test(form.phoneNumber.trim())) {
      return 'Phone number must contain exactly 10 digits.'
    }

    const wantsPasswordChange =
      form.currentPassword.trim() || form.newPassword.trim() || form.confirmPassword.trim()

    if (!wantsPasswordChange) {
      return null
    }

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      return 'Fill current password, new password, and confirm password.'
    }

    if (form.newPassword !== form.confirmPassword) {
      return 'New password and confirm password must match.'
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/.test(form.newPassword)) {
      return 'Password must be 8+ chars with uppercase, lowercase, and symbol.'
    }

    return null
  }

  const handleProfileSave = async (event) => {
    event.preventDefault()
    setProfileNotice({ text: '', type: '' })

    const validationError = validateProfileForm()
    if (validationError) {
      setProfileNotice({ text: validationError, type: 'error' })
      return
    }

    setSavingProfile(true)
    try {
      const payload = {
        username: form.username.trim(),
        phoneNumber: form.phoneNumber.trim(),
      }

      if (form.newPassword.trim()) {
        payload.currentPassword = form.currentPassword
        payload.newPassword = form.newPassword
      }

      const profileResponse = await authFetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const profileData = await readJsonSafe(profileResponse)
      if (!profileResponse.ok) {
        throw new Error(profileData?.message ?? 'Failed to update profile.')
      }

      if (profileImageFile) {
        const formData = new FormData()
        formData.append('profileImage', profileImageFile)

        const imageResponse = await authFetch('/api/users/profile-image', {
          method: 'PATCH',
          body: formData,
        })
        const imageData = await readJsonSafe(imageResponse)
        if (!imageResponse.ok) {
          throw new Error(imageData?.message ?? 'Failed to update profile image.')
        }
      }

      const refreshResponse = await authFetch('/api/users/me')
      const refreshedProfile = await readJsonSafe(refreshResponse)
      if (!refreshResponse.ok || !refreshedProfile) {
        throw new Error('Profile saved but failed to refresh data.')
      }

      setSessionUserData(refreshedProfile)
      onUserRefresh?.(refreshedProfile)
      setProfileNotice({ text: 'Profile updated successfully.', type: 'success' })
      setForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
      setProfileImageFile(null)
    } catch (error) {
      setProfileNotice({ text: error.message, type: 'error' })
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className="h-screen bg-[var(--page-bg)] text-[13px] text-[var(--text-main)]" style={themeVars}>
      <div className="grid h-screen w-full grid-cols-1 xl:grid-cols-[280px_1fr]">
        <Sidebar
          user={user}
          initials={initials}
          navItems={navItems}
          activeNav={activeNav}
          goToSection={goToSection}
          openProfile={openProfile}
        />

        <main className="h-screen overflow-y-auto px-4 pb-7 pt-4 sm:px-6">
          <header className="flex flex-wrap items-center gap-3 rounded-2xl bg-[var(--surface-bg)] px-5 py-3 shadow-sm" style={{ boxShadow: 'var(--surface-shadow)' }}>
            {activeNav !== 'Projects & Events' && (
              <>
                <input
                  type="search"
                  placeholder="Search..."
                  className="h-10 flex-1 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-sm text-[var(--text-main)] outline-none focus:border-[#f97316]"
                />
                <button
                  type="button"
                  onClick={() => goToSection('Projects & Events')}
                  className="rounded-xl border border-[#153865] px-5 py-2.5 text-sm font-semibold text-[#153865]"
                >
                  New Project
                </button>
                <button
                  type="button"
                  onClick={() => goToSection('Bookings')}
                  className="rounded-xl border border-[#153865] px-5 py-2.5 text-sm font-semibold text-[#153865]"
                >
                  Book Resource
                </button>
              </>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDarkTheme((prev) => !prev)}
                aria-label="Toggle theme"
                title="Theme"
                className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--surface-border)] text-[var(--text-muted)] transition hover:bg-[#fff7ed]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  {isDarkTheme ? (
                    <>
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                    </>
                  ) : (
                    <path d="M12 3a7.5 7.5 0 1 0 9 9A9 9 0 1 1 12 3Z" />
                  )}
                </svg>
              </button>

              <button
                type="button"
                aria-label="Notifications"
                title="Notifications"
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-[var(--surface-border)] text-[var(--text-muted)] transition hover:bg-[#fff7ed]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                  <path d="M9 17a3 3 0 0 0 6 0" />
                </svg>
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#f97316] text-[11px] font-bold text-white">
                  3
                </span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                aria-label="Logout"
                title="Logout"
                className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--surface-border)] text-[var(--text-muted)] transition hover:bg-[#fff7ed]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="m16 17 5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
              </button>
            </div>
          </header>

          {dashboardNotice.text && (
            <p
              className={`mt-4 rounded-lg px-3 py-2 text-sm font-semibold ${
                dashboardNotice.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
              }`}
            >
              {dashboardNotice.text}
            </p>
          )}

          {activeNav === 'Settings' ? (
            <UpdateProfile
              form={form}
              setForm={setForm}
              setProfileImageFile={setProfileImageFile}
              handleProfileSave={handleProfileSave}
              savingProfile={savingProfile}
              profileNotice={profileNotice}
            />
          ) : activeNav === 'Projects & Events' ? (
            <ProjectsEvents
              items={projectEntities}
              loading={projectEntitiesLoading}
              notice={projectEntitiesNotice}
              onRefresh={fetchProjectEntities}
            />
          ) : (
            <section className="mt-6 rounded-2xl bg-[var(--surface-bg)] px-5 py-6 shadow-sm" style={{ boxShadow: 'var(--surface-shadow)' }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold leading-tight text-[var(--text-main)] sm:text-3xl">Welcome back, {user?.username ?? 'User'}</h1>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">Here&apos;s what&apos;s happening in your community on Coordina</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {dashboardStats.map((card) => (
                  <article key={card.label} className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-bg)] p-5">
                    <p className="text-2xl font-extrabold text-[var(--text-main)]">{card.value}</p>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">{card.label}</p>
                  </article>
                ))}
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_320px]">
                <article className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-bg)] p-5">
                  <h2 className="text-xl font-bold text-[var(--text-main)]">Recent Activity</h2>
                  <ul className="mt-4 space-y-4">
                    {dashboardActivity.map((item, index) => (
                      <li key={`${item.actor}-${index}`} className="flex gap-3">
                        <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[#f97316]" />
                        <div className="text-sm text-[var(--text-muted)]">
                          <span className="font-bold text-[var(--text-main)]">{item.actor}</span> {item.action}{' '}
                          <span className="font-bold text-[var(--text-main)]">{item.target}</span>
                          <p className="text-sm text-[var(--text-muted)]">{item.time}</p>
                        </div>
                      </li>
                    ))}
                    {dashboardActivity.length === 0 && (
                      <li className="text-sm text-[var(--text-muted)]">No recent activity yet.</li>
                    )}
                  </ul>
                </article>

                <article className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-bg)] p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[var(--text-main)]">Upcoming</h2>
                    <button type="button" className="text-sm font-semibold text-[var(--text-muted)]">
                      View all
                    </button>
                  </div>
                  <ul className="mt-4 space-y-4">
                    {dashboardUpcoming.map((item) => (
                      <li key={`${item.day}-${item.title}`} className="flex gap-3">
                        <div className="w-14 rounded-xl bg-[#fff7ed] py-1.5 text-center">
                          <p className="text-lg font-bold text-[#f97316]">{item.day}</p>
                          <p className="text-sm text-[var(--text-muted)]">{item.month}</p>
                        </div>
                        <div>
                          <p className="text-base font-bold text-[var(--text-main)]">{item.title}</p>
                          <p className="text-sm text-[var(--text-muted)]">{item.time}</p>
                        </div>
                      </li>
                    ))}
                    {dashboardUpcoming.length === 0 && (
                      <li className="text-sm text-[var(--text-muted)]">No upcoming events.</li>
                    )}
                  </ul>
                </article>
              </div>

              <article className="mt-6 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-bg)] p-5">
                <h2 className="text-xl font-bold text-[var(--text-main)]">Tasks This Week</h2>
                <div className="mt-4 grid grid-cols-[28px_1fr] gap-3">
                  <div className="flex h-52 flex-col justify-between pb-7 text-xs font-semibold text-[var(--text-muted)]">
                    <span>{weeklyTaskMax}</span>
                    <span>{Math.max(0, weeklyTaskMax - 2)}</span>
                    <span>{Math.max(0, weeklyTaskMax - 4)}</span>
                    <span>{Math.max(0, weeklyTaskMax - 6)}</span>
                    <span>0</span>
                  </div>
                  <div className="grid h-52 grid-cols-7 items-end gap-3 border-b border-[var(--surface-border)] pb-7">
                    {dashboardWeeklyTasks.map((item) => (
                      <div key={item.day} className="flex flex-col items-center gap-2">
                        <div
                          className="w-full rounded-md bg-[#3264cc]"
                          style={{ height: `${Math.max(10, (Number(item.value || 0) / weeklyTaskMax) * 100)}%` }}
                          title={`${item.day}: ${item.value} tasks`}
                        />
                        <span className="text-sm text-[var(--text-muted)]">{item.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default Dashboard
