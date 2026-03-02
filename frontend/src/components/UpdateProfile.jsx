import { useState } from 'react'

function UpdateProfile({ form, setForm, setProfileImageFile, handleProfileSave, savingProfile, profileNotice }) {
  const [imageError, setImageError] = useState('')

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] ?? null
    if (!file) {
      setImageError('')
      setProfileImageFile(null)
      return
    }

    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      setImageError('Please select a valid image file.')
      setProfileImageFile(null)
      return
    }

    const maxBytes = 2 * 1024 * 1024
    if (file.size > maxBytes) {
      setImageError('Image must be 2MB or smaller.')
      setProfileImageFile(null)
      return
    }

    setImageError('')
    setProfileImageFile(file)
  }

  return (
    <section className="mt-6 rounded-2xl bg-[var(--surface-bg)] px-5 py-6 shadow-sm" style={{ boxShadow: 'var(--surface-shadow)' }}>
      <div className="mx-auto w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-[var(--text-main)]">Update Profile</h2>

        <form className="mt-5 grid gap-4" onSubmit={handleProfileSave}>
          <label className="grid gap-1 text-sm font-semibold text-[var(--text-muted)]">
            Username
            <input
              type="text"
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--text-main)] outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#ffedd5]"
              required
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-[var(--text-muted)]">
            Email (cannot be changed)
            <input
              type="email"
              value={form.email}
              disabled
              className="cursor-not-allowed rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--text-muted)]"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-[var(--text-muted)]">
            Phone Number
            <input
              type="tel"
              value={form.phoneNumber}
              onChange={(event) => {
                const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 10)
                setForm((prev) => ({ ...prev, phoneNumber: digitsOnly }))
              }}
              inputMode="numeric"
              maxLength={10}
              className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--text-main)] outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#ffedd5]"
              required
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-[var(--text-muted)]">
            Profile Image
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[#fff7ed] file:px-3 file:py-1.5 file:text-[#f97316] hover:file:bg-[#ffedd5]"
            />
          </label>
          {imageError && <p className="text-sm font-semibold text-orange-700">{imageError}</p>}

          <p className="text-sm font-semibold text-[var(--text-muted)]">To change password, fill all three password fields below.</p>

          <label className="grid gap-1 text-sm font-semibold text-[var(--text-muted)]">
            Current Password
            <input
              type="password"
              value={form.currentPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
              className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--text-main)] outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#ffedd5]"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-[var(--text-muted)]">
            New Password
            <input
              type="password"
              value={form.newPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, newPassword: event.target.value }))}
              className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--text-main)] outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#ffedd5]"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-[var(--text-muted)]">
            Confirm New Password
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              className="rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--text-main)] outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#ffedd5]"
            />
          </label>

          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-xl bg-[#f97316] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {profileNotice.text && (
          <p
            className={`mt-4 rounded-lg px-3 py-2 text-sm font-semibold ${
              profileNotice.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
            }`}
          >
            {profileNotice.text}
          </p>
        )}
      </div>
    </section>
  )
}

export default UpdateProfile
