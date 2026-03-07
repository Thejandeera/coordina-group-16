import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Tasks from '../components/Tasks'
import InviteModal from '../components/InviteModal'
import { authFetch, readJsonSafe } from '../lib/authClient'

const badgeStyles = {
    Project: 'bg-blue-100 text-blue-700',
    Event: 'bg-orange-100 text-orange-700',
    'Donation Drive': 'bg-rose-100 text-rose-700',
    Active: 'bg-emerald-100 text-emerald-700',
    Upcoming: 'bg-amber-100 text-amber-700',
    Completed: 'bg-slate-200 text-slate-600',
}

const roleBadgeStyles = {
    Admin: 'bg-purple-100 text-purple-700 border-purple-200',
    Organizer: 'bg-blue-100 text-blue-700 border-blue-200',
    Participant: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Viewer: 'bg-slate-100 text-slate-600 border-slate-200',
}

function ProjectDetails({ projectId, items, loading }) {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('Overview')
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [userRole, setUserRole] = useState('Viewer')
    const [members, setMembers] = useState([])
    const project = useMemo(() => items.find((item) => String(item.id) === String(projectId)), [items, projectId])

    const fetchMembersAndRole = async () => {
        if (!project) return;
        try {
            const response = await authFetch(`/api/project-management/${project.id}/members`);

            if (response.ok) {
                const data = await response.json();
                setMembers(data);

                const userDataStr = sessionStorage.getItem('userData');
                if (userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    const currentUserId = userData.id;

                    const myMember = data.find(m => String(m.userId) === String(currentUserId));
                    if (myMember) {
                        setUserRole(myMember.role);
                    } else {
                        if (project.createdByUserId && String(project.createdByUserId) === String(currentUserId)) {
                            setUserRole('Admin');
                        } else {
                            setUserRole('Viewer');
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch project members', err);
        }
    };

    const handleRoleChange = async (targetUserId, memberUsername, newRole) => {
        try {
            const response = await authFetch(`/api/project-management/${project.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: targetUserId, role: newRole })
            });

            if (!response.ok) {
                const errData = await readJsonSafe(response);
                throw new Error(errData?.message || 'Could not update role');
            }

            toast.success(`${memberUsername}'s role updated to ${newRole}`);
            await fetchMembersAndRole();
        } catch (err) {
            toast.error(err.message);
        }
    };

    useEffect(() => {
        fetchMembersAndRole();
    }, [project]);

    if (loading) {
        return <div className="p-4 sm:p-8 animate-pulse text-slate-500 font-semibold">Loading details...</div>
    }

    if (!project) {
        return (
            <div className="p-4 sm:p-8">
                <button onClick={() => navigate('/projects-events')} className="text-sm font-semibold text-slate-500 hover:text-slate-800 mb-4 transition-colors">
                    &larr; Back to list
                </button>
                <p className="text-xl font-bold text-rose-600">Project or event not found.</p>
            </div>
        )
    }

    return (
        <section className="mt-2 w-full max-w-7xl px-1 sm:px-0">
            <button
                onClick={() => navigate('/projects-events')}
                className="mb-4 sm:mb-6 flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
                &larr; Back to list
            </button>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-extrabold text-[var(--text-main)] leading-tight break-words">
                        {project.name}
                    </h1>
                    <div className="mt-3 flex flex-wrap gap-2 text-[13px] font-bold font-sans">
                        <span className={`block rounded-full px-3 py-1 ${badgeStyles[project.type] ?? 'bg-slate-100 text-slate-700'}`}>
                            {project.type}
                        </span>
                        <span className={`block rounded-full px-3 py-1 ${badgeStyles[project.status || 'Active'] ?? 'bg-slate-100 text-slate-700'}`}>
                            {project.status || 'Active'}
                        </span>
                    </div>
                </div>

                {userRole === 'Admin' && (
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 h-[42px] self-start flex-shrink-0"
                    >
                        <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Invite
                    </button>
                )}
            </div>

            {/* Responsive Tab Bar */}
            <div className="mt-6 sm:mt-8 flex gap-1 rounded-xl bg-slate-100/70 p-1 sm:p-1.5 w-full sm:w-max border border-slate-200/50 overflow-x-auto scrollbar-none">
                {['Overview', 'Tasks', 'Calendar', 'Chat', 'Forms', 'Members'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 sm:px-4 py-2 text-[13px] sm:text-[14px] font-bold transition-all rounded-lg whitespace-nowrap flex-shrink-0 ${activeTab === tab
                            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'Overview' && (
                <div className="mt-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="rounded-[14px] border border-slate-200 bg-white p-4 sm:p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                        <p className="text-slate-500 text-[14px] sm:text-[15px] font-medium leading-relaxed">{project.description}</p>
                    </div>

                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-[14px] border border-slate-200 bg-white p-4 sm:p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-center">
                            <p className="text-[13px] font-medium text-slate-400 mb-2">Start Date</p>
                            <p className="text-[17px] sm:text-[19px] font-bold text-slate-800 leading-none">
                                {project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : '-'}
                            </p>
                        </div>
                        <div className="rounded-[14px] border border-slate-200 bg-white p-4 sm:p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-center">
                            <p className="text-[13px] font-medium text-slate-400 mb-2">End Date</p>
                            <p className="text-[17px] sm:text-[19px] font-bold text-slate-800 leading-none">
                                {project.endDate ? new Date(project.endDate).toISOString().slice(0, 10) : '-'}
                            </p>
                        </div>
                        <div className="rounded-[14px] border border-slate-200 bg-white p-4 sm:p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-center sm:col-span-2 lg:col-span-1">
                            <p className="text-[13px] font-medium text-slate-400 mb-2">Goals</p>
                            <p className="text-[15px] sm:text-[17px] font-bold text-slate-800 leading-snug">
                                {project.goals || 'No specific goals set.'}
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mt-2">
                        {[
                            { value: '3', label: 'Tasks' },
                            { value: '0', label: 'Completed' },
                            { value: '0', label: 'Forms' },
                            { value: String(members.length > 0 ? members.length : (project.membersCount ?? '0')), label: 'Members' },
                        ].map((stat, idx) => (
                            <div key={idx} className="rounded-[14px] border border-slate-200 bg-white p-4 sm:p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] text-center flex flex-col justify-center gap-1 sm:gap-2">
                                <p className="text-[28px] sm:text-[34px] font-black text-slate-900 leading-none">{stat.value}</p>
                                <p className="text-[13px] sm:text-[14px] font-medium text-slate-400">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'Tasks' && (
                <Tasks projectId={project.id} userRole={userRole} />
            )}

            {activeTab === 'Members' && (
                <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Card-based layout for all screen sizes */}
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {members.map((member) => (
                            <div key={member.id} className="rounded-[14px] border border-slate-200 bg-white p-4 sm:p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col gap-4 transition-all hover:shadow-md">
                                <div className="flex items-center gap-3 min-w-0">
                                    {member.profileImageUrl ? (
                                        <img src={member.profileImageUrl} alt="Profile" className="w-11 h-11 rounded-full object-cover shadow-sm bg-slate-200 flex-shrink-0" />
                                    ) : (
                                        <div className="flex-shrink-0 w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 shadow-sm border border-indigo-200 text-lg">
                                            {member.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-bold text-slate-800 leading-tight truncate">{member.username}</p>
                                        <p className="text-[13px] text-slate-500 truncate">{member.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    {userRole === 'Admin' ? (
                                        <select
                                            value={member.role}
                                            onChange={(e) => handleRoleChange(member.userId, member.username, e.target.value)}
                                            className="bg-slate-50 border border-slate-200 text-slate-700 text-[13px] font-bold rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-2 outline-none cursor-pointer hover:bg-white shadow-sm transition-all flex-1"
                                        >
                                            <option value="Admin">Admin</option>
                                            <option value="Organizer">Organizer</option>
                                            <option value="Participant">Participant</option>
                                            <option value="Viewer">Viewer</option>
                                        </select>
                                    ) : (
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold tracking-wide border ${roleBadgeStyles[member.role] || roleBadgeStyles.Viewer}`}>
                                            {member.role}
                                        </span>
                                    )}
                                    <span className="text-[12px] text-slate-400 font-medium whitespace-nowrap flex-shrink-0">
                                        {new Date(member.joinedAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {members.length === 0 && (
                        <div className="py-16 text-center text-slate-500 text-[14px] font-semibold rounded-2xl border-2 border-dashed border-slate-200 mt-4">
                            No members found. Invite your team to get started!
                        </div>
                    )}
                </div>
            )}

            {activeTab !== 'Overview' && activeTab !== 'Tasks' && activeTab !== 'Members' && (
                <div className="mt-8 p-8 sm:p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl animate-in fade-in duration-300">
                    <p className="text-lg font-bold text-slate-400">{activeTab} section coming soon.</p>
                </div>
            )}

            <InviteModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                projectId={project.id}
                onInviteSuccess={fetchMembersAndRole}
            />
        </section>
    )
}

export default ProjectDetails
