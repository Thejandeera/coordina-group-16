import { useState, useEffect, useMemo } from 'react'
import { authFetch, readJsonSafe } from '../lib/authClient'

const getInitials = (name) => {
    if (!name) return 'U'
    return name.slice(0, 2).toUpperCase()
}

const getPriorityColor = (priority) => {
    if (priority >= 8) return 'text-rose-500'       // High
    if (priority >= 4) return 'text-sky-500'     // Medium
    return 'text-emerald-500'                       // Low
}

const getPriorityText = (priority) => {
    if (priority >= 8) return 'High'
    if (priority >= 4) return 'Medium'
    return 'Low'
}

function TaskCard({ task, onClick }) {
    return (
        <article
            onClick={() => onClick(task)}
            className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 hover:shadow-md transition-all active:scale-[0.99] w-full text-left"
        >
            <div className="flex gap-2">
                <svg className="mt-1 h-[14px] w-[14px] text-slate-400 opacity-50 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="2" cy="4" r="1.5" />
                    <circle cx="8" cy="4" r="1.5" />
                    <circle cx="2" cy="8" r="1.5" />
                    <circle cx="8" cy="8" r="1.5" />
                    <circle cx="2" cy="12" r="1.5" />
                    <circle cx="8" cy="12" r="1.5" />
                </svg>
                <div className="w-full">
                    <h4 className="text-[14px] font-bold text-slate-800 leading-snug">{task.description.split('\n')[0]}</h4>
                    {task.description.split('\n').length > 1 && (
                        <p className="mt-1 text-[13px] text-slate-500 line-clamp-1">{task.description.split('\n')[1]}</p>
                    )}

                    {task.subtasks?.length > 0 && (
                        <div className="mt-2 text-[12px] font-semibold text-slate-500 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {task.subtasks.filter(s => s.status === 'Done').length}/{task.subtasks.length} subtasks
                        </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold tracking-wide bg-slate-50 border border-slate-100 ${getPriorityColor(task.priority)}`}>
                            {getPriorityText(task.priority)}
                        </span>

                        <div className="flex items-center gap-2">
                            {task.dueDate && (
                                <span className="text-[11px] font-semibold text-slate-400">
                                    {new Date(task.dueDate).toISOString().slice(0, 10)}
                                </span>
                            )}
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-600 outline outline-1 outline-offset-1 outline-slate-200/50">
                                {task.assigneeInitials || 'U'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    )
}

function Tasks({ projectId }) {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    const fetchTasks = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await authFetch(`/api/projects/${projectId}/tasks`)
            const data = await readJsonSafe(response)
            if (!response.ok) throw new Error(data?.message || 'Could not fetch tasks')
            setTasks(data || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTasks()
    }, [projectId])

    const openNewTask = (parentTask = null) => {
        setEditingTask(parentTask ? { parentTaskId: parentTask.id, isNew: true } : { isNew: true })
        setIsModalOpen(true)
    }

    const openEditTask = (task) => {
        setEditingTask(task)
        setIsModalOpen(true)
    }

    const deleteSelectedTask = async (id) => {
        if (!window.confirm('Delete this task?')) return
        try {
            const response = await authFetch(`/api/tasks/${id}`, { method: 'DELETE' })
            if (!response.ok) throw new Error('Could not delete task')
            fetchTasks()
            setIsModalOpen(false)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleSaveTask = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        const formData = new FormData(e.currentTarget)
        const payload = {
            description: formData.get('description'),
            status: formData.get('status'),
            priority: Number(formData.get('priority')),
            dueDate: formData.get('dueDate') || null
        }

        try {
            let response;
            if (editingTask?.isNew) {
                response = await authFetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...payload,
                        projectId: Number(projectId),
                        parentTaskId: editingTask.parentTaskId || null
                    })
                })
            } else {
                response = await authFetch(`/api/tasks/${editingTask.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
            }

            if (!response.ok) {
                const data = await readJsonSafe(response)
                throw new Error(data?.message || 'Could not save task')
            }

            await fetchTasks()
            setIsModalOpen(false)
        } catch (err) {
            alert(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const todoTasks = useMemo(() => tasks.filter(t => t.status === 'To Do'), [tasks])
    const inProgressTasks = useMemo(() => tasks.filter(t => t.status === 'In Progress'), [tasks])
    const doneTasks = useMemo(() => tasks.filter(t => t.status === 'Done'), [tasks])

    if (loading) return <div className="animate-pulse p-4 text-sm font-semibold text-slate-500">Loading tasks...</div>
    if (error) return <div className="p-4 text-sm font-semibold text-rose-600">{error}</div>

    return (
        <div className="mt-8">
            <div className="mb-6 flex justify-end">
                <button
                    onClick={() => openNewTask()}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 hover:shadow transition-all"
                >
                    + New Task
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-3 xl:gap-8 items-start">
                {/* To Do Column */}
                <div className="rounded-[16px] bg-slate-50/50 p-4 border border-slate-100 flex flex-col gap-4">
                    <div className="flex items-center gap-3 border-b-2 border-slate-300 pb-3">
                        <h3 className="text-[15px] font-bold text-slate-800">To Do</h3>
                        <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-white text-[12px] font-bold text-slate-500 shadow-sm border border-slate-200 px-1.5">
                            {todoTasks.length}
                        </span>
                    </div>
                    <div className="flex flex-col gap-3 min-h-[150px]">
                        {todoTasks.map(task => <TaskCard key={task.id} task={task} onClick={openEditTask} />)}
                    </div>
                </div>

                {/* In Progress Column */}
                <div className="rounded-[16px] bg-slate-50/50 p-4 border border-slate-100 flex flex-col gap-4">
                    <div className="flex items-center gap-3 border-b-2 border-sky-400 pb-3">
                        <h3 className="text-[15px] font-bold text-slate-800">In Progress</h3>
                        <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-white text-[12px] font-bold text-slate-500 shadow-sm border border-slate-200 px-1.5">
                            {inProgressTasks.length}
                        </span>
                    </div>
                    <div className="flex flex-col gap-3 min-h-[150px]">
                        {inProgressTasks.map(task => <TaskCard key={task.id} task={task} onClick={openEditTask} />)}
                    </div>
                </div>

                {/* Done Column */}
                <div className="rounded-[16px] bg-slate-50/50 p-4 border border-slate-100 flex flex-col gap-4">
                    <div className="flex items-center gap-3 border-b-2 border-emerald-400 pb-3">
                        <h3 className="text-[15px] font-bold text-slate-800">Done</h3>
                        <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-white text-[12px] font-bold text-slate-500 shadow-sm border border-slate-200 px-1.5">
                            {doneTasks.length}
                        </span>
                    </div>
                    <div className="flex flex-col gap-3 min-h-[150px]">
                        {doneTasks.map(task => <TaskCard key={task.id} task={task} onClick={openEditTask} />)}
                    </div>
                </div>
            </div>

            {isModalOpen && editingTask && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm overflow-y-auto">
                    <div className="w-full max-w-[500px] rounded-2xl bg-white p-6 shadow-xl border border-slate-100 my-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                            <h3 className="text-xl font-extrabold text-slate-800">
                                {editingTask.isNew ? (editingTask.parentTaskId ? 'Create Subtask' : 'Create Task') : 'Edit Task'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">&times;</button>
                        </div>

                        <form onSubmit={handleSaveTask} className="flex flex-col gap-5">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-slate-700">Description / Title</span>
                                <textarea
                                    name="description"
                                    defaultValue={editingTask.description || ''}
                                    required
                                    placeholder="Task title or details..."
                                    className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-800"
                                />
                            </label>

                            <div className="grid grid-cols-2 gap-4">
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-sm font-bold text-slate-700">Status</span>
                                    <select
                                        name="status"
                                        defaultValue={editingTask.status || 'To Do'}
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-800 font-bold"
                                    >
                                        <option value="To Do">To Do</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Done">Done</option>
                                    </select>
                                </label>

                                <label className="flex flex-col gap-1.5">
                                    <span className="text-sm font-bold text-slate-700">Priority (1-10)</span>
                                    <input
                                        type="number"
                                        name="priority"
                                        min="1" max="10"
                                        defaultValue={editingTask.priority || 5}
                                        required
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-800 font-bold"
                                    />
                                </label>
                            </div>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm font-bold text-slate-700">Due Date</span>
                                <input
                                    type="date"
                                    name="dueDate"
                                    defaultValue={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().slice(0, 10) : ''}
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-800 font-bold"
                                />
                            </label>

                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-5">
                                {!editingTask.isNew ? (
                                    <button
                                        type="button"
                                        onClick={() => deleteSelectedTask(editingTask.id)}
                                        className="text-sm font-bold text-rose-500 hover:text-rose-700 transition-colors bg-rose-50 px-4 py-2 rounded-lg"
                                    >
                                        Delete Task
                                    </button>
                                ) : (
                                    <div></div>
                                )}
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all font-bold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 hover:shadow transition-all disabled:opacity-70 disabled:shadow-none"
                                    >
                                        {submitting ? 'Saving...' : 'Save Task'}
                                    </button>
                                </div>
                            </div>

                            {!editingTask.isNew && editingTask.subtasks && (
                                <div className="mt-4 border-t border-slate-100 pt-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold text-slate-700">Subtasks ({editingTask.subtasks.length})</span>
                                        <button type="button" onClick={() => openNewTask(editingTask)} className="text-[12px] font-bold text-blue-600 hover:underline">
                                            + Add Subtask
                                        </button>
                                    </div>
                                    {editingTask.subtasks.map(st => (
                                        <div
                                            key={st.id}
                                            onClick={() => openEditTask(st)}
                                            className="p-3 bg-slate-50 border border-slate-200 rounded-lg mb-2 cursor-pointer hover:border-blue-300"
                                        >
                                            <div className="flex justify-between">
                                                <span className="text-[13px] font-bold text-slate-800 line-clamp-1">{st.description.split('\n')[0]}</span>
                                                <span className={`text-[11px] font-bold ${st.status === 'Done' ? 'text-emerald-500' : 'text-slate-400'}`}>{st.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {editingTask.subtasks.length === 0 && <p className="text-[13px] text-slate-400 italic font-medium">No subtasks yet.</p>}
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Tasks
