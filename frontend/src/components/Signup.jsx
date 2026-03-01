import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, readJsonSafe } from '../lib/authClient'

function Signup() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    profileImage: null,
  })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const setNotice = (text, type) => {
    setMessage(text)
    setMessageType(type)
  }

  const validateSignUp = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/
    const phoneRegex = /^\d{10}$/

    if (form.username.trim().length < 3) {
      return 'Username must be at least 3 characters.'
    }
    if (!emailRegex.test(form.email.trim())) {
      return 'Email must include a valid @ format.'
    }
    if (!passwordRegex.test(form.password)) {
      return 'Password must be 8+ chars with uppercase, lowercase, and symbol.'
    }
    if (!phoneRegex.test(form.phoneNumber.trim())) {
      return 'Phone number must contain exactly 10 digits.'
    }
    if (!form.profileImage) {
      return 'Profile image is required.'
    }
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setMessageType('')

    const validationError = validateSignUp()
    if (validationError) {
      setNotice(validationError, 'error')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('username', form.username)
      formData.append('email', form.email)
      formData.append('password', form.password)
      formData.append('phoneNumber', form.phoneNumber)
      if (form.profileImage) {
        formData.append('profileImage', form.profileImage)
      }

      const response = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: formData,
      })

      const data = await readJsonSafe(response)
      if (!response.ok) {
        throw new Error(data?.message ?? 'Sign up failed')
      }

      setNotice(data?.message ?? 'Your Account created successfully', 'success')
      setForm({
        username: '',
        email: '',
        password: '',
        phoneNumber: '',
        profileImage: null,
      })
      navigate('/login')
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
            <h2 className="text-2xl font-bold">Create Account</h2>
            <p className="mt-1 text-sm text-slate-500">Create your account to continue.</p>
          </header>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button
              className="rounded-lg px-3 py-2 text-sm font-semibold transition text-[#385075]"
              type="button"
              onClick={() => navigate('/login')}
            >
              Login
            </button>
            <button
              className="rounded-lg px-3 py-2 text-sm font-semibold transition bg-[#0b2347] text-white"
              type="button"
            >
              Sign Up
            </button>
          </div>

          <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-1 text-sm font-semibold text-[#294c78]">
              Username
              <input
                type="text"
                placeholder="Enter Username"
                value={form.username}
                onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                minLength={3}
                maxLength={50}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                required
              />
            </label>

            <label className="grid gap-1 text-sm font-semibold text-[#294c78]">
              Email
              <input
                type="email"
                placeholder="Enter Your email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                required
              />
            </label>

            <label className="grid gap-1 text-sm font-semibold text-[#294c78]">
              Password
              <input
                type="password"
                placeholder="Enter a strong password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                minLength={8}
                pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$"
                title="At least 8 characters with uppercase, lowercase, and symbol."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                required
              />
            </label>

            <label className="grid gap-1 text-sm font-semibold text-[#294c78]">
              Phone Number
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={form.phoneNumber}
                onChange={(event) => {
                  const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 10)
                  setForm((prev) => ({ ...prev, phoneNumber: digitsOnly }))
                }}
                inputMode="numeric"
                pattern="^\d{10}$"
                maxLength={10}
                title="Phone number must contain exactly 10 digits."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                required
              />
            </label>

            <label className="grid gap-1 text-sm font-semibold text-[#294c78]">
              Profile Image
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  setForm((prev) => ({ ...prev, profileImage: file }))
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-slate-700 hover:file:bg-slate-200"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-xl bg-gradient-to-br from-[#ff8b2d] to-[#f97316] px-4 py-2.5 font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
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

export default Signup
