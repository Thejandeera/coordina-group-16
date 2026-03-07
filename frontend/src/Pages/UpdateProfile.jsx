import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function UpdateProfile({ form, setForm, setProfileImageFile, handleProfileSave, savingProfile, profileNotice }) {
  const [imagePreview, setImagePreview] = useState(null)

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] ?? null
    if (!file) {
      setProfileImageFile(null)
      setImagePreview(null)
      return
    }

    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      toast.error('Please select a valid image file.')
      setProfileImageFile(null)
      setImagePreview(null)
      return
    }

    const maxBytes = 2 * 1024 * 1024
    if (file.size > maxBytes) {
      toast.error('Image must be 2MB or smaller.')
      setProfileImageFile(null)
      setImagePreview(null)
      return
    }

    setProfileImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (profileNotice?.text) {
      if (profileNotice.type === 'success') {
        toast.success(profileNotice.text)
      } else if (profileNotice.type === 'error') {
        toast.error(profileNotice.text)
      }
    }
  }, [profileNotice])

  return (
    <section className="mt-6">
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

          <div className="grid gap-1 text-sm font-semibold text-[var(--text-muted)]">
            Profile Image
            <div className="flex items-center gap-4 mt-2">
              <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-[var(--input-border)] bg-[var(--input-bg)] shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                ) : form.profileImageUrl ? (
                  <img src={form.profileImageUrl} alt="Current Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-[#f97316] text-2xl font-bold text-white">
                    {form.username?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[#fff7ed] file:px-3 file:py-1.5 file:text-[#f97316] hover:file:bg-[#ffedd5]"
              />
            </div>
          </div>

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
      </div>
    </section>
  )
}

export default UpdateProfile
