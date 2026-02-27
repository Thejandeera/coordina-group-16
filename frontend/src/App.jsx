import { useState } from 'react'
import Login from './components/Login'
import Signup from './components/Signup'
import { apiFetch, setAuthTokens } from './lib/authClient'

const HAS_CUSTOM_API_BASE_URL = Boolean(import.meta.env.VITE_API_BASE_URL)

function App() {
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const [loginForm, setLoginForm] = useState({
    identifier: '',
    password: '',
  })

  const [signUpForm, setSignUpForm] = useState({
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    profileImage: null,
  })

  const setNotice = (text, type) => {
    setMessage(text)
    setMessageType(type)
  }

  const validateSignUp = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/
    const phoneRegex = /^\d{10}$/

    if (signUpForm.username.trim().length < 3) {
      return 'Username must be at least 3 characters.'
    }

    if (!emailRegex.test(signUpForm.email.trim())) {
      return 'Email must include a valid @ format.'
    }

    if (!passwordRegex.test(signUpForm.password)) {
      return 'Password must be 8+ chars with uppercase, lowercase, and symbol.'
    }

    if (!phoneRegex.test(signUpForm.phoneNumber.trim())) {
      return 'Phone number must contain exactly 10 digits.'
    }

    if (!signUpForm.profileImage) {
      return 'Profile image is required.'
    }

    return null
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message ?? 'Login failed')
      }

      setAuthTokens(data)
      setNotice('Login successful.', 'success')
    } catch (error) {
      setNotice(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUpSubmit = async (event) => {
    event.preventDefault()

    const validationError = validateSignUp()
    if (validationError) {
      setNotice(validationError, 'error')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('username', signUpForm.username)
      formData.append('email', signUpForm.email)
      formData.append('password', signUpForm.password)
      formData.append('phoneNumber', signUpForm.phoneNumber)
      if (signUpForm.profileImage) {
        formData.append('profileImage', signUpForm.profileImage)
      }

      const response = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message ?? 'Sign up failed')
      }

      setNotice(data.message ?? 'Your Account created successfully', 'success')
      setMode('login')
      setSignUpForm({
        username: '',
        email: '',
        password: '',
        phoneNumber: '',
        profileImage: null,
      })
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
            <h2 className="text-2xl font-bold">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'login' ? 'Sign in to continue.' : 'Create your account to continue.'}
            </p>
          </header>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-[#0b2347] text-white' : 'text-[#385075]'}`}
              type="button"
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === 'signup' ? 'bg-[#0b2347] text-white' : 'text-[#385075]'}`}
              type="button"
              onClick={() => setMode('signup')}
            >
              Sign Up
            </button>
          </div>

          {mode === 'login' ? (
            <Login
              form={loginForm}
              onChange={setLoginForm}
              onSubmit={handleLoginSubmit}
              loading={loading}
            />
          ) : (
            <Signup
              form={signUpForm}
              onChange={setSignUpForm}
              onSubmit={handleSignUpSubmit}
              loading={loading}
            />
          )}

          {message && (
            <p
              className={`mt-4 rounded-lg px-3 py-2 text-sm font-semibold ${messageType === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}
            >
              {message}
            </p>
          )}

          {!HAS_CUSTOM_API_BASE_URL && (
            <p className="mt-4 text-xs text-slate-500">Set `VITE_API_BASE_URL` if your backend uses a different URL.</p>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
