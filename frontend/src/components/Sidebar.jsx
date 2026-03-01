function Sidebar({ user, initials, navItems, activeNav, goToSection, openProfile }) {
  return (
    <aside className="sticky top-0 flex h-screen flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] text-white">
      <div className="flex items-center gap-3 border-b border-[var(--sidebar-border)] px-6 py-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f97316] text-base font-bold text-white">C</div>
        <p className="text-lg font-bold text-white">Coordina</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <p className="px-1 pb-2 text-sm font-extrabold uppercase tracking-[0.14em] text-white">Navigation</p>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => goToSection(item)}
              className={`w-full rounded-xl px-4 py-3 text-left text-base font-bold transition ${
                activeNav === item ? 'bg-white text-[#0b2347]' : 'text-white hover:bg-[#153865]'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <p className="mt-8 px-1 text-sm leading-7 text-[var(--sidebar-muted)]">
          Tasks, calendar, chat, forms and donations are nested inside each project.
        </p>
      </div>

      <button
        type="button"
        onClick={openProfile}
        className="mt-auto flex w-full items-center gap-3 border-t border-[var(--sidebar-border)] px-5 py-4 text-left transition hover:bg-[#153865]"
      >
        {user?.profileImageUrl ? (
          <img src={user.profileImageUrl} alt="Profile" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[#f97316] font-bold text-white">{initials}</div>
        )}
        <span>
          <span className="block text-base font-bold text-white">{user?.username ?? 'User'}</span>
          <span className="block text-sm text-white/70">Admin</span>
        </span>
      </button>
    </aside>
  )
}

export default Sidebar
