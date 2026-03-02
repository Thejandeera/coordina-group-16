import { useMemo, useState } from 'react'
import { authFetch, readJsonSafe } from '../lib/authClient'

const typeOptions = ['All Types', 'Project', 'Event', 'Donation Drive']

const badgeStyles = {
  Project: 'bg-amber-100 text-amber-700',
  Event: 'bg-orange-100 text-orange-700',
  'Donation Drive': 'bg-rose-100 text-rose-700',
  Active: 'bg-emerald-100 text-emerald-700',
  Upcoming: 'bg-amber-100 text-amber-700',
  Completed: 'bg-slate-200 text-slate-600',
}

const initialForm = {
  name: '',
  type: 'Project',
  description: '',
  startDate: '',
  endDate: '',
  goals: '',
}

const formatDate = (dateText) => {
  if (!dateText) {
    return '-'
  }

  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return date.toISOString().slice(0, 10)
}

const formatCurrency = (value) => `LKR ${Number(value ?? 0).toLocaleString()}`

function ProjectsEvents({ items, loading, notice, onRefresh }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createNotice, setCreateNotice] = useState({ text: '', type: '' })

  const [formType, setFormType] = useState('Project')
  
  const [editItem, setEditItem] = useState(null)
  const [activeMenuId, setActiveMenuId] = useState(null)

  const filteredItems = useMemo(() => {
    const searchQuery = search.trim().toLowerCase()
    return items.filter((item) => {
      const typeMatches = typeFilter === 'All Types' || item.type === typeFilter
      const searchMatches =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery) ||
        item.description.toLowerCase().includes(searchQuery)
      return typeMatches && searchMatches
    })
  }, [items, search, typeFilter])

  const openCreateModal = () => {
    setCreateNotice({ text: '', type: '' })
    setFormType('Project')
    setEditItem(null)
    setShowCreateModal(true)
  }

  const openEditModal = (item) => {
    setCreateNotice({ text: '', type: '' })
    setFormType(item.type)
    setEditItem(item)
    setShowCreateModal(true)
    setActiveMenuId(null)
  }

  const closeCreateModal = () => {
    if (creating) {
      return
    }
    setShowCreateModal(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setCreateNotice({ text: '', type: '' })

    const formData = new FormData(event.currentTarget)
    const formName = formData.get('name')?.toString() || ''
    const formTypeVal = formData.get('type')?.toString() || formType
    const formDescription = formData.get('description')?.toString() || ''
    const formStartDate = formData.get('startDate')?.toString() || ''
    const formEndDate = formData.get('endDate')?.toString() || ''
    const formGoals = formData.get('goals')?.toString() || ''
    
    const membersCount = formData.get('membersCount') ? Number(formData.get('membersCount')) : undefined
    const goalAmount = formData.get('goalAmount') ? Number(formData.get('goalAmount')) : undefined
    const raisedAmount = formData.get('raisedAmount') ? Number(formData.get('raisedAmount')) : undefined
    const padletEvidence = formData.get('padletEvidence')?.toString() || undefined

    if (!formName.trim() || !formDescription.trim() || !formStartDate) {
      setCreateNotice({ text: 'Name, description, and start date are required.', type: 'error' })
      return
    }

    if (formEndDate && formEndDate < formStartDate) {
      setCreateNotice({ text: 'End date cannot be before start date.', type: 'error' })
      return
    }

    setCreating(true)
    try {
      const isEdit = !!editItem
      const endpoint = isEdit ? `/api/project-management/entities/${editItem.id}` : '/api/project-management/entities'
      const method = isEdit ? 'PUT' : 'POST'

      const response = await authFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          type: formTypeVal,
          description: formDescription.trim(),
          startDate: formStartDate,
          endDate: formEndDate || null,
          goals: formGoals.trim() || null,
          membersCount: membersCount,
          goalAmount: goalAmount,
          raisedAmount: raisedAmount,
          padletEvidence: padletEvidence
        }),
      })

      const data = await readJsonSafe(response)
      if (!response.ok) {
        let errorText = data?.message
        if (!errorText && data?.errors) {
          // Flatten ASP.NET validation error array
          errorText = Object.values(data.errors).flat().join(' ')
        }
        throw new Error(errorText ?? `Could not ${isEdit ? 'update' : 'create'} entity.`)
      }

      await onRefresh()
      closeCreateModal()
    } catch (error) {
      setCreateNotice({ text: error.message, type: 'error' })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id) => {
    setActiveMenuId(null)
    if (!window.confirm('Are you sure you want to delete this?')) {
      return
    }

    try {
      const response = await authFetch(`/api/project-management/entities/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const data = await readJsonSafe(response)
        throw new Error(data?.message ?? 'Could not delete entity.')
      }
      await onRefresh()
    } catch (error) {
      alert(error.message)
    }
  }

  return (
    <section className="mt-6">
      <div className="rounded-2xl bg-[var(--surface-bg)] px-5 py-6 shadow-sm" style={{ boxShadow: 'var(--surface-shadow)' }}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[36px] font-extrabold leading-none text-[var(--text-main)]">Projects &amp; Events</h2>
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-orange-500 px-5 py-2.5 text-base font-semibold text-white hover:brightness-110"
          >
            + Create New
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search..."
            className="h-12 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-lg text-[var(--text-main)] outline-none focus:border-orange-500"
          />
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="h-12 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-lg text-[var(--text-main)] outline-none focus:border-orange-500"
          >
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {notice.text && (
          <p
            className={`mt-4 rounded-lg px-3 py-2 text-sm font-semibold ${
              notice.type === 'error' ? 'bg-orange-50 text-orange-700' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {notice.text}
          </p>
        )}

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <article key={index} className="rounded-2xl border border-[var(--surface-border)] px-5 py-5 animate-pulse">
                <div className="flex items-start justify-between gap-3">
                  <div className="h-9 w-2/3 rounded bg-slate-200"></div>
                  <div className="h-6 w-6 rounded bg-slate-200"></div>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-5 w-full rounded bg-slate-200"></div>
                  <div className="h-5 w-5/6 rounded bg-slate-200"></div>
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="h-6 w-20 rounded-full bg-slate-200"></div>
                  <div className="h-6 w-20 rounded-full bg-slate-200"></div>
                </div>
                <div className="mt-8 flex gap-4">
                  <div className="h-5 w-24 rounded bg-slate-200"></div>
                  <div className="h-5 w-32 rounded bg-slate-200"></div>
                </div>
              </article>
            ))
          ) : filteredItems.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No matching projects or events found.</p>
          ) : (
            filteredItems.map((item) => {
              const hasDonationProgress =
                item.type === 'Donation Drive' &&
                Number(item.goalAmount ?? 0) > 0 &&
                Number(item.raisedAmount ?? 0) >= 0
              const progress = hasDonationProgress
                ? Math.min(100, Math.round((Number(item.raisedAmount ?? 0) / Number(item.goalAmount ?? 1)) * 100))
                : 0

              return (
                <article key={item.id} className="rounded-2xl border border-[var(--surface-border)] px-5 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[34px] font-bold leading-tight text-[var(--text-main)]">{item.name}</h3>
                    <div className="relative">
                      <button 
                        type="button" 
                        onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                        className="text-xl font-bold leading-none text-[var(--text-muted)] p-2 hover:bg-slate-100 rounded-lg"
                      >
                        ...
                      </button>
                      
                      {activeMenuId === item.id && (
                        <div className="absolute right-0 top-full mt-1 w-32 rounded-xl border border-[var(--surface-border)] bg-white py-2 shadow-lg z-10">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="w-full px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="w-full px-4 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="mt-2 text-lg leading-relaxed text-[var(--text-muted)]">{item.description}</p>

                  <div className="mt-4 flex flex-wrap gap-2 text-base font-semibold">
                    <span className={`rounded-full px-3 py-1 ${badgeStyles[item.type] ?? 'bg-slate-100 text-slate-700'}`}>
                      {item.type}
                    </span>
                    <span className={`rounded-full px-3 py-1 ${badgeStyles[item.status] ?? 'bg-slate-100 text-slate-700'}`}>
                      {item.status}
                    </span>
                  </div>

                  {hasDonationProgress && (
                    <div className="mt-4">
                      <div className="h-2 w-full rounded-full bg-slate-200">
                        <div className="h-2 rounded-full bg-orange-500" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="mt-2 text-sm font-medium text-[var(--text-muted)]">
                        {formatCurrency(item.raisedAmount)} / {formatCurrency(item.goalAmount)}
                      </p>
                    </div>
                  )}

                  {item.goals && (
                    <p className="mt-3 text-sm text-[var(--text-muted)]">
                      <span className="font-semibold text-[var(--text-main)]">Goals:</span> {item.goals}
                    </p>
                  )}

                  {item.padletEvidence && (
                    <p className="mt-3 text-sm text-blue-600 underline">
                      <a href={item.padletEvidence} target="_blank" rel="noopener noreferrer">View Padlet Evidence</a>
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-base text-[var(--text-muted)]">
                    {(item.type === 'Event' || item.type === 'Project') && (
                      <span>Members: {item.membersCount}</span>
                    )}
                    <span>Start: {formatDate(item.startDate)}</span>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCreateModal()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeCreateModal()
          }}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--surface-bg)] p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="flex items-center justify-between">
              <h3 id="modal-title" className="text-3xl font-bold text-[var(--text-main)]">
                {editItem ? 'Edit Entity' : 'Create Entity'}
              </h3>
              <button
                type="button"
                onClick={closeCreateModal}
                className="text-3xl leading-none text-[var(--text-muted)]"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-xl font-semibold text-[var(--text-main)]">
                Name
                <input
                  type="text"
                  name="name"
                  defaultValue={editItem?.name ?? ''}
                  className="h-14 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-lg outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  required
                />
              </label>

              <label className="grid gap-2 text-xl font-semibold text-[var(--text-main)]">
                Type
                <select
                  name="type"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="h-14 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-lg outline-none focus:border-orange-500"
                >
                  <option value="Project">Project</option>
                  <option value="Event">Event</option>
                  <option value="Donation Drive">Donation Drive</option>
                </select>
              </label>

              <label className="grid gap-2 text-xl font-semibold text-[var(--text-main)]">
                Description
                <textarea
                  name="description"
                  defaultValue={editItem?.description ?? ''}
                  className="min-h-24 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-lg outline-none focus:border-orange-500"
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-xl font-semibold text-[var(--text-main)]">
                  Start
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={editItem?.startDate ? formatDate(editItem.startDate) : ''}
                    className="h-14 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-lg outline-none focus:border-orange-500"
                    required
                  />
                </label>

                <label className="grid gap-2 text-xl font-semibold text-[var(--text-main)]">
                  End
                  <input
                    type="date"
                    name="endDate"
                    defaultValue={editItem?.endDate ? formatDate(editItem.endDate) : ''}
                    className="h-14 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-lg outline-none focus:border-orange-500"
                  />
                </label>
              </div>

              {(formType === 'Project' || formType === 'Event') && (
                <label className="grid gap-2 text-xl font-semibold text-[var(--text-main)]">
                  Members Count
                  <input
                    type="number"
                    name="membersCount"
                    min="0"
                    defaultValue={editItem?.membersCount ?? 0}
                    className="h-14 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-lg outline-none focus:border-orange-500"
                  />
                </label>
              )}

              {formType === 'Donation Drive' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-xl font-semibold text-[var(--text-main)]">
                    Raised Amount (LKR)
                    <input
                      type="number"
                      step="0.01"
                      name="raisedAmount"
                      min="0"
                      defaultValue={editItem?.raisedAmount ?? 0}
                      className="h-14 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-lg outline-none focus:border-orange-500"
                    />
                  </label>

                  <label className="grid gap-2 text-xl font-semibold text-[var(--text-main)]">
                    Goal Amount (LKR)
                    <input
                      type="number"
                      step="0.01"
                      name="goalAmount"
                      min="0.01"
                      defaultValue={editItem?.goalAmount ?? ''}
                      className="h-14 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-lg outline-none focus:border-orange-500"
                      required
                    />
                  </label>
                  
                  <label className="grid gap-2 text-xl font-semibold text-[var(--text-main)] sm:col-span-2">
                    Padlet Evidence Link
                    <input
                      type="url"
                      name="padletEvidence"
                      defaultValue={editItem?.padletEvidence ?? ''}
                      placeholder="https://padlet.com/..."
                      className="h-14 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-lg outline-none focus:border-orange-500"
                    />
                  </label>
                </div>
              )}

              <label className="grid gap-2 text-xl font-semibold text-[var(--text-main)]">
                Goals
                <input
                  type="text"
                  name="goals"
                  defaultValue={editItem?.goals ?? ''}
                  className="h-14 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 text-lg outline-none focus:border-orange-500"
                />
              </label>

              {createNotice.text && (
                <p
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                    createNotice.type === 'error' ? 'bg-orange-50 text-orange-700' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {createNotice.text}
                </p>
              )}

              <button
                type="submit"
                disabled={creating}
                className="mt-1 h-12 rounded-xl bg-orange-500 text-xl font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {creating ? 'Saving...' : (editItem ? 'Save Changes' : 'Create')}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default ProjectsEvents
