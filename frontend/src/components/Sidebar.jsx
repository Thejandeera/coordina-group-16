function Sidebar({ user, initials, navItems, activeNav, goToSection, openProfile, onLogout }) {
  return (
    <aside className="sticky top-0 flex h-screen flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] backdrop-blur-xl text-[var(--sidebar-text)] shadow-2xl z-20">
      <div className="flex items-center gap-3 border-b border-[var(--sidebar-border)] px-6 py-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f97316] text-base font-bold text-white">C</div>
        <p className="text-lg font-bold text-[var(--sidebar-text)]">Coordina</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <p className="px-1 pb-2 text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--sidebar-text)]">Navigation</p>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => goToSection(item)}
              className={`w-full rounded-xl px-4 py-3 text-left text-base font-bold transition ${activeNav === item
                  ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)]'
                  : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)]'
                }`}
            >
              {item}
            </button>
          ))}
        </nav>


      </div>

      <div className="mt-auto border-t border-[var(--sidebar-border)] px-5 py-4">
        <div className="flex w-full items-center gap-3 mb-4">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt="Profile" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#f97316] font-bold text-white shadow-sm">{initials}</div>
          )}
          <span>
            <span className="block text-base font-bold text-[var(--sidebar-text)]">{user?.username ?? 'User'}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-500/20"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
