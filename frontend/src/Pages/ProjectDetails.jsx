import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const badgeStyles = {
    Project: 'bg-blue-100 text-blue-700',
    Event: 'bg-orange-100 text-orange-700',
    'Donation Drive': 'bg-rose-100 text-rose-700',
    Active: 'bg-emerald-100 text-emerald-700',
    Upcoming: 'bg-amber-100 text-amber-700',
    Completed: 'bg-slate-200 text-slate-600',
}

function ProjectDetails({ projectId, items, loading }) {
    const navigate = useNavigate()
    const project = useMemo(() => items.find((item) => String(item.id) === String(projectId)), [items, projectId])

    if (loading) {
        return <div className="p-8 animate-pulse text-slate-500 font-semibold">Loading details...</div>
    }

    if (!project) {
        return (
            <div className="p-8">
                <button onClick={() => navigate('/projects-events')} className="text-sm font-semibold text-slate-500 hover:text-slate-800 mb-4 transition-colors">
                    &larr; Back to list
                </button>
                <p className="text-xl font-bold text-rose-600">Project or event not found.</p>
            </div>
        )
    }

    return (
        <section className="mt-2 w-full max-w-7xl">
            <button
                onClick={() => navigate('/projects-events')}
                className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
                &larr; Back to list
            </button>

            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-[var(--text-main)] sm:text-[38px] leading-tight">
                        {project.name}
                    </h1>
                    <div className="mt-3 flex gap-2 text-[13px] font-bold font-sans">
                        <span className={`block rounded-full px-3 py-1 ${badgeStyles[project.type] ?? 'bg-slate-100 text-slate-700'}`}>
                            {project.type}
                        </span>
                        <span className={`block rounded-full px-3 py-1 ${badgeStyles[project.status || 'Active'] ?? 'bg-slate-100 text-slate-700'}`}>
                            {project.status || 'Active'}
                        </span>
                    </div>
                </div>

                <button className="flex min-w-[100px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 h-[42px]">
                    <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Invite
                </button>
            </div>

            <div className="mt-8 flex gap-1 rounded-xl bg-slate-100/70 p-1.5 w-max border border-slate-200/50">
                {['Overview', 'Tasks (3)', 'Calendar', 'Chat', 'Forms (0)', 'Members (3)'].map((tab, i) => (
                    <button
                        key={tab}
                        className={`px-4 py-2 text-[14px] font-bold transition-all rounded-lg ${i === 0
                                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="mt-6 flex flex-col gap-4">
                <div className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                    <p className="text-slate-500 text-[15px] font-medium leading-relaxed">{project.description}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-[1.5fr_1.5fr_2fr] lg:grid-cols-[1fr_1fr_1.5fr]">
                    <div className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-center">
                        <p className="text-[13px] font-medium text-slate-400 mb-2">Start Date</p>
                        <p className="text-[19px] font-bold text-slate-800 leading-none">
                            {project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : '-'}
                        </p>
                    </div>
                    <div className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-center">
                        <p className="text-[13px] font-medium text-slate-400 mb-2">End Date</p>
                        <p className="text-[19px] font-bold text-slate-800 leading-none">
                            {project.endDate ? new Date(project.endDate).toISOString().slice(0, 10) : '-'}
                        </p>
                    </div>
                    <div className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-center">
                        <p className="text-[13px] font-medium text-slate-400 mb-2">Goals</p>
                        <p className="text-[17px] font-bold text-slate-800 leading-snug">
                            {project.goals || 'No specific goals set.'}
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mt-2">
                    {[
                        { value: '3', label: 'Tasks' },
                        { value: '0', label: 'Completed' },
                        { value: '0', label: 'Forms' },
                        { value: String(project.membersCount ?? '3'), label: 'Members' },
                    ].map((stat, idx) => (
                        <div key={idx} className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] text-center flex flex-col justify-center gap-2">
                            <p className="text-[34px] font-black text-slate-900 leading-none">{stat.value}</p>
                            <p className="text-[14px] font-medium text-slate-400">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default ProjectDetails
