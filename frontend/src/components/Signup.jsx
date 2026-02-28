import { useState } from 'react'
import { apiFetch, readJsonSafe } from '../lib/authClient'

function Signup({ onSuccess, onError, onSignedUp }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    profileImage: null,
  })

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

    const validationError = validateSignUp()
    if (validationError) {
      onError?.(validationError)
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

      onSuccess?.(data?.message ?? 'Your Account created successfully')
      setForm({
        username: '',
        email: '',
        password: '',
        phoneNumber: '',
        profileImage: null,
      })
      onSignedUp?.()
    } catch (error) {
      onError?.(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
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
  )
}

export default Signup
