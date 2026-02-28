function Login({ form, onChange, onSubmit, loading }) {
  return (
    <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
      <label className="grid gap-1 text-sm font-semibold text-[#294c78]">
        Username or Email
        <input
          type="text"
          placeholder="Enter your username or email"
          value={form.identifier}
          onChange={(event) => onChange((prev) => ({ ...prev, identifier: event.target.value }))}
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
          onChange={(event) => onChange((prev) => ({ ...prev, password: event.target.value }))}
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

export default Login
