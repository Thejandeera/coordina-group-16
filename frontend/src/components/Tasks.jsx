import { useState, useEffect, useMemo } from 'react'
import { authFetch, readJsonSafe } from '../lib/authClient'

const getPriorityColor = (priority) => {
    if (priority >= 8) return 'text-rose-600 bg-rose-50 ring-rose-500/20'
    if (priority >= 5) return 'text-amber-600 bg-amber-50 ring-amber-500/20'
    return 'text-emerald-600 bg-emerald-50 ring-emerald-500/20'
}

const getPriorityText = (priority) => {
    if (priority >= 8) return 'High'
    if (priority >= 5) return 'Medium'
    return 'Low'
}

const getStatusColor = (status) => {
    if (status === 'Done') return 'bg-emerald-500 shadow-emerald-500/20'
    if (status === 'In Progress') return 'bg-blue-500 shadow-blue-500/20'
    return 'bg-slate-300 shadow-slate-300/20'
}

function TaskCard({ task, onClick, onDragStart }) {
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const completedSubtasks = hasSubtasks ? task.subtasks.filter(s => s.status === 'Done').length : 0;

    return (
        <article
            draggable
            onDragStart={(e) => onDragStart(e, task)}
            onClick={() => onClick(task)}
            className="group relative cursor-pointer rounded-[14px] border border-slate-200 bg-white p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:border-blue-400 hover:shadow-lg hover:-translate-y-0.5 transition-all w-full text-left flex gap-3"
        >
            <div className="mt-1 flex-shrink-0 cursor-grab text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block" title="Drag to move">
                <svg className="h-[15px] w-[15px]" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="4" cy="4" r="1.5" />
                    <circle cx="10" cy="4" r="1.5" />
                    <circle cx="4" cy="8" r="1.5" />
                    <circle cx="10" cy="8" r="1.5" />
                    <circle cx="4" cy="12" r="1.5" />
                    <circle cx="10" cy="12" r="1.5" />
                </svg>
            </div>

            <div className="w-full min-w-0">
                <div className="flex justify-between items-start gap-2">
                    <h4 className="text-[14.5px] font-bold text-slate-800 leading-snug line-clamp-2 pr-2">
                        {task.description.split('\n')[0]}
                    </h4>
                </div>

                {task.description.split('\n').length > 1 && (
                    <p className="mt-1.5 text-[13px] font-medium text-slate-500 line-clamp-1 pr-4">{task.description.split('\n')[1]}</p>
                )}

                {hasSubtasks && (
                    <div className="mt-3.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${(completedSubtasks / task.subtasks.length) * 100}%` }}></div>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                            {completedSubtasks}/{task.subtasks.length}
                        </span>
                    </div>
                )}

                <div className="mt-5 flex items-center justify-between">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-bold ring-1 ring-inset ${getPriorityColor(task.priority)}`}>
                        {getPriorityText(task.priority)}
                    </span>

                    <div className="flex items-center gap-2">
                        {task.dueDate && (
                            <span className="text-[11px] font-bold flex items-center gap-1 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                        <div title={task.assigneeInitials} className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 ring-2 ring-white shadow-sm">
                            {task.assigneeInitials || 'U'}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    )
}

function BacklogItem({ task, depth = 0, onClick, onEdit, onDelete, onAddSubtask, activeMenuId, setActiveMenuId }) {
    return (
        <div className={`${depth > 0 ? 'ml-6 mt-2 relative before:absolute before:-left-3 before:top-4 before:w-3 before:h-px before:bg-slate-200' : 'mt-3'} transition-all`}>
            {depth > 0 && <div className="absolute -left-3 top-0 bottom-0 w-px bg-slate-200"></div>}
            <div
                onClick={() => onClick(task)}
                className="group flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 rounded-xl border border-slate-200/60 bg-white p-3 hover:bg-blue-50/30 hover:border-blue-200 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0 ${getStatusColor(task.status)}`}></span>
                    <span className={`text-[14px] font-bold truncate ${task.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {task.description.split('\n')[0]}
                    </span>
                </div>

                <div className="flex items-center gap-4 text-sm w-full sm:w-auto justify-end flex-shrink-0 ml-5 sm:ml-0">
                    <span className={`inline-flex justify-center items-center rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset w-16 ${getPriorityColor(task.priority)}`}>
                        {getPriorityText(task.priority)}
                    </span>
                    {task.dueDate ? (
                        <span className="text-[12px] font-semibold text-slate-500 w-20 text-right">
                            {new Date(task.dueDate).toISOString().slice(0, 10)}
                        </span>
                    ) : (
                        <span className="w-20"></span>
                    )}

                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setActiveMenuId(activeMenuId === `backlog-${task.id}` ? null : `backlog-${task.id}`)}
                            className="p-1 rounded-md text-slate-400 hover:bg-slate-200/60 transition-colors"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                        </button>
                        {activeMenuId === `backlog-${task.id}` && (
                            <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl z-30 animate-in fade-in zoom-in-95 duration-100">
                                <button onClick={() => { setActiveMenuId(null); onAddSubtask(task); }} className="w-full px-4 py-1.5 text-left text-[12px] font-bold text-emerald-600 flex items-center gap-2 hover:bg-emerald-50">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
                                    Add Subtask
                                </button>
                                <button onClick={() => { setActiveMenuId(null); onEdit(task); }} className="w-full px-4 py-1.5 text-left text-[12px] font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 mt-1 border-t border-slate-100 pt-1.5">Edit Detail</button>
                                <button onClick={() => { setActiveMenuId(null); onDelete(task.id); }} className="w-full px-4 py-1.5 text-left text-[12px] font-bold text-rose-600 hover:bg-rose-50">Delete Task</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {task.subtasks?.map(st => (
                <BacklogItem
                    key={st.id}
                    task={st}
                    depth={depth + 1}
                    onClick={onClick}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAddSubtask={onAddSubtask}
                    activeMenuId={activeMenuId}
                    setActiveMenuId={setActiveMenuId}
                />
            ))}
        </div>
    )
}

function Tasks({ projectId }) {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeMenuId, setActiveMenuId] = useState(null)

    // Modals state
    const [isFormModalOpen, setIsFormModalOpen] = useState(false)
    const [viewingTask, setViewingTask] = useState(null)
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
        setIsFormModalOpen(true)
        setViewingTask(null)
        setActiveMenuId(null)
    }

    const openEditTask = (task) => {
        setEditingTask(task)
        setIsFormModalOpen(true)
        setViewingTask(null)
        setActiveMenuId(null)
    }

    const viewTask = (task) => {
        setViewingTask(task)
        setEditingTask(null)
        setIsFormModalOpen(false)
        setActiveMenuId(null)
    }

    const deleteSelectedTask = async (id) => {
        if (!window.confirm('Delete this task and all its subtasks?')) return
        try {
            const response = await authFetch(`/api/tasks/${id}`, { method: 'DELETE' })
            if (!response.ok) throw new Error('Could not delete task')
            fetchTasks()
            setIsFormModalOpen(false)
            setViewingTask(null)
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
            setIsFormModalOpen(false)
        } catch (err) {
            alert(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const getTaskById = (id, taskList) => {
        for (const t of taskList) {
            if (String(t.id) === String(id)) return t;
            if (t.subtasks) {
                const sub = getTaskById(id, t.subtasks);
                if (sub) return sub;
            }
        }
        return null;
    }

    // --- HTML5 Drag and Drop Handlers ---
    const onDragStart = (e, task) => {
        e.dataTransfer.setData('taskId', task.id)
        e.dataTransfer.effectAllowed = 'move'
    }

    const onDragOver = (e) => {
        e.preventDefault() // Allow drop
        e.dataTransfer.dropEffect = 'move'
    }

    const onDrop = async (e, newStatus) => {
        e.preventDefault()
        const taskId = e.dataTransfer.getData('taskId')
        if (!taskId) return

        const taskToMove = getTaskById(taskId, tasks)
        if (!taskToMove || taskToMove.status === newStatus) return

        const previousStatus = taskToMove.status

        // Optimistic Update function matching nested array
        const recursivelyUpdateTask = (taskList) => {
            return taskList.map(t => {
                if (String(t.id) === String(taskId)) {
                    return { ...t, status: newStatus }
                }
                if (t.subtasks && t.subtasks.length > 0) {
                    return { ...t, subtasks: recursivelyUpdateTask(t.subtasks) }
                }
                return t;
            });
        }

        setTasks(prev => recursivelyUpdateTask(prev));

        try {
            const payload = {
                description: taskToMove.description,
                priority: taskToMove.priority,
                dueDate: taskToMove.dueDate ? new Date(taskToMove.dueDate).toISOString().slice(0, 10) : null,
                status: newStatus
            }

            const response = await authFetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!response.ok) throw new Error('Failed to update status')
        } catch (err) {
            // Revert Optimistic Update
            const recursivelyRevertTask = (taskList) => {
                return taskList.map(t => {
                    if (String(t.id) === String(taskId)) return { ...t, status: previousStatus }
                    if (t.subtasks && t.subtasks.length > 0) return { ...t, subtasks: recursivelyRevertTask(t.subtasks) }
                    return t;
                });
            }
            setTasks(prev => recursivelyRevertTask(prev))
            alert('Failed to update task status: ' + err.message)
        }
    }

    const todoTasks = useMemo(() => tasks.filter(t => t.status === 'To Do'), [tasks])
    const inProgressTasks = useMemo(() => tasks.filter(t => t.status === 'In Progress'), [tasks])
    const doneTasks = useMemo(() => tasks.filter(t => t.status === 'Done'), [tasks])

    if (loading) return (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />)}
        </div>
    )
    if (error) return <div className="p-4 mt-4 rounded-xl bg-rose-50 text-sm font-bold text-rose-600 border border-rose-100">{error}</div>

    return (
        <div className="mt-8" onClick={() => setActiveMenuId(null)}>
            <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-200">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-800">Task Board</h2>
                    <p className="text-sm font-medium text-slate-400 mt-0.5">Drag to rearrange, manage your nested items seamlessly.</p>
                </div>
                <button
                    onClick={() => openNewTask()}
                    className="rounded-xl flex items-center justify-center gap-2 bg-blue-600 px-6 py-3 text-[14px] font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
                    New Task
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-3 xl:gap-8 items-start">
                {/* To Do Column */}
                <div
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, 'To Do')}
                    className="rounded-[20px] bg-slate-50/80 p-5 border border-slate-200/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] min-h-[300px]"
                >
                    <div className="flex items-center gap-3 border-b-2 border-slate-300 pb-4 mb-4">
                        <h3 className="text-[16px] font-extrabold text-slate-700 uppercase tracking-wide">To Do</h3>
                        <span className="flex h-[26px] min-w-[26px] items-center justify-center rounded-lg bg-white text-[13px] font-black text-slate-500 shadow-sm border border-slate-200 px-2">
                            {todoTasks.length}
                        </span>
                    </div>
                    <div className="flex flex-col gap-4 min-h-[150px]">
                        {todoTasks.map(task => <TaskCard key={task.id} task={task} onClick={viewTask} onDragStart={onDragStart} />)}
                        {todoTasks.length === 0 && <div className="border border-dashed border-slate-300 rounded-xl h-24 flex items-center justify-center text-slate-400 font-bold text-sm">Drop tasks here</div>}
                    </div>
                </div>

                {/* In Progress Column */}
                <div
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, 'In Progress')}
                    className="rounded-[20px] bg-slate-50/80 p-5 border border-slate-200/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] min-h-[300px]"
                >
                    <div className="flex items-center gap-3 border-b-2 border-sky-400 pb-4 mb-4">
                        <h3 className="text-[16px] font-extrabold text-slate-700 uppercase tracking-wide">In Progress</h3>
                        <span className="flex h-[26px] min-w-[26px] items-center justify-center rounded-lg bg-white text-[13px] font-black text-sky-600 shadow-sm border border-slate-200 px-2">
                            {inProgressTasks.length}
                        </span>
                    </div>
                    <div className="flex flex-col gap-4 min-h-[150px]">
                        {inProgressTasks.map(task => <TaskCard key={task.id} task={task} onClick={viewTask} onDragStart={onDragStart} />)}
                        {inProgressTasks.length === 0 && <div className="border border-dashed border-slate-300 rounded-xl h-24 flex items-center justify-center text-slate-400 font-bold text-sm">Drop tasks here</div>}
                    </div>
                </div>

                {/* Done Column */}
                <div
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, 'Done')}
                    className="rounded-[20px] bg-slate-50/80 p-5 border border-slate-200/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] min-h-[300px]"
                >
                    <div className="flex items-center gap-3 border-b-2 border-emerald-400 pb-4 mb-4">
                        <h3 className="text-[16px] font-extrabold text-slate-700 uppercase tracking-wide">Done</h3>
                        <span className="flex h-[26px] min-w-[26px] items-center justify-center rounded-lg bg-white text-[13px] font-black text-emerald-600 shadow-sm border border-slate-200 px-2">
                            {doneTasks.length}
                        </span>
                    </div>
                    <div className="flex flex-col gap-4 min-h-[150px]">
                        {doneTasks.map(task => <TaskCard key={task.id} task={task} onClick={viewTask} onDragStart={onDragStart} />)}
                        {doneTasks.length === 0 && <div className="border border-dashed border-slate-300 rounded-xl h-24 flex items-center justify-center text-slate-400 font-bold text-sm">Drop tasks here</div>}
                    </div>
                </div>
            </div>

            <div className="mt-14 mb-8">
                <h2 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                    Complete Backlog
                </h2>
                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200 shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]">
                    {tasks.length === 0 ? (
                        <p className="text-slate-500 font-semibold text-center py-6">No tasks added yet.</p>
                    ) : (
                        tasks.map(task => <BacklogItem key={task.id} task={task} depth={0} onClick={viewTask} onEdit={openEditTask} onDelete={deleteSelectedTask} onAddSubtask={openNewTask} activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} />)
                    )}
                </div>
            </div>


            {/* VIEW MODAL (Task Details) */}
            {viewingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={() => setViewingTask(null)}>
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"></div>
                    <div
                        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
                            <div className="flex justify-between items-start gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <span className={`w-3 h-3 rounded-full shadow-sm ${getStatusColor(viewingTask.status)}`}></span>
                                    <h2 className="text-2xl sm:text-3xl font-black text-slate-800 leading-tight">
                                        {viewingTask.description.split('\n')[0]}
                                    </h2>
                                </div>
                                <button onClick={() => setViewingTask(null)} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mb-8">
                                <span className={`inline-flex items-center rounded-lg px-3 py-1.5 text-[12px] font-extrabold ring-1 ring-inset ${getPriorityColor(viewingTask.priority)}`}>
                                    {getPriorityText(viewingTask.priority)} Priority
                                </span>
                                {viewingTask.dueDate && (
                                    <span className="text-[13px] font-bold flex items-center gap-1.5 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        Due {new Date(viewingTask.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </span>
                                )}
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-blue-700 ring-2 ring-white">
                                        {viewingTask.assigneeInitials || 'U'}
                                    </div>
                                    <span className="text-[12px] font-bold text-slate-600">Assignee</span>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-8 min-h-[100px]">
                                <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-2">Details</h3>
                                <p className="text-[15px] font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {viewingTask.description}
                                </p>
                            </div>

                            <div className="border border-slate-200 rounded-2xl overflow-hidden mb-4">
                                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="text-[14px] font-extrabold text-slate-700">Subtasks ({viewingTask.subtasks?.length || 0})</h3>
                                    <button onClick={() => { setViewingTask(null); openNewTask(viewingTask); }} className="text-[12px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
                                        Add
                                    </button>
                                </div>
                                <div className="p-4 bg-white flex flex-col gap-2">
                                    {viewingTask.subtasks && viewingTask.subtasks.map(st => (
                                        <div key={st.id} className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(st.status)}`}></span>
                                                <span className={`text-[14px] font-bold ${st.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{st.description.split('\n')[0]}</span>
                                            </div>
                                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${getPriorityColor(st.priority)}`}>{getPriorityText(st.priority)}</span>
                                        </div>
                                    ))}
                                    {(!viewingTask.subtasks || viewingTask.subtasks.length === 0) && (
                                        <p className="text-[13px] font-medium text-slate-400 italic text-center py-4">No subtasks added.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => { setViewingTask(null); onDelete(viewingTask.id); }} className="px-5 py-2.5 rounded-xl font-bold text-rose-500 hover:bg-rose-100 transition-colors text-[14px] border border-transparent mr-auto">
                                Delete Task
                            </button>
                            <button onClick={() => setViewingTask(null)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors text-[14px]">
                                Close
                            </button>
                            <button onClick={() => { setViewingTask(null); openEditTask(viewingTask); }} className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 shadow-sm shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all text-[14px]">
                                Edit Task
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE / EDIT FORM MODAL */}
            {isFormModalOpen && editingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" onClick={() => setIsFormModalOpen(false)}>
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"></div>
                    <div
                        className="relative w-full max-w-xl rounded-[28px] bg-white p-7 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
                            <h3 className="text-2xl font-black text-slate-800">
                                {editingTask.isNew ? (editingTask.parentTaskId ? 'Create Subtask' : 'Create New Task') : 'Edit Task'}
                            </h3>
                            <button onClick={() => setIsFormModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSaveTask} className="flex flex-col gap-5">
                            <label className="flex flex-col gap-2">
                                <span className="text-[13px] font-extrabold text-slate-500 uppercase tracking-wider">Description / Title</span>
                                <textarea
                                    name="description"
                                    defaultValue={editingTask.description || ''}
                                    required
                                    placeholder="What needs to be done?"
                                    className="min-h-[120px] w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 text-[15px] outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold text-slate-800 resize-y placeholder:font-medium placeholder:text-slate-400"
                                />
                            </label>

                            <div className="grid grid-cols-2 gap-5">
                                <label className="flex flex-col gap-2">
                                    <span className="text-[13px] font-extrabold text-slate-500 uppercase tracking-wider">Status</span>
                                    <select
                                        name="status"
                                        defaultValue={editingTask.status || 'To Do'}
                                        className="h-12 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-[14px] outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 cursor-pointer appearance-none"
                                        style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="%2394a3b8"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>')`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
                                    >
                                        <option value="To Do">To Do</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Done">Done</option>
                                    </select>
                                </label>

                                <label className="flex flex-col gap-2">
                                    <span className="text-[13px] font-extrabold text-slate-500 uppercase tracking-wider">Priority (1-10)</span>
                                    <input
                                        type="number"
                                        name="priority"
                                        min="1" max="10"
                                        defaultValue={editingTask.priority || 5}
                                        required
                                        className="h-12 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-[15px] outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700"
                                    />
                                </label>
                            </div>

                            <label className="flex flex-col gap-2">
                                <span className="text-[13px] font-extrabold text-slate-500 uppercase tracking-wider">Due Date</span>
                                <input
                                    type="date"
                                    name="dueDate"
                                    defaultValue={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().slice(0, 10) : ''}
                                    className="h-12 w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 text-[14px] outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 cursor-pointer"
                                />
                            </label>

                            <div className="mt-6 flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="rounded-xl px-6 py-3 text-[14px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-xl bg-blue-600 px-8 py-3 text-[14px] font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:shadow-none disabled:transform-none"
                                >
                                    {submitting ? 'Saving...' : 'Save Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Tasks
