'use client'

import { useEffect, useState, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { supabase } from '@/lib/supabase'
import { Task, TaskStatus, TaskAssignee, TaskPriority } from '@/lib/types'
import { Plus, X, Loader2 } from 'lucide-react'

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'TODO',        label: 'To Do',      color: 'border-slate-600' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-indigo-500' },
  { id: 'DONE',        label: 'Done',        color: 'border-emerald-500' },
]

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high:   'bg-red-500/20 text-red-400',
  medium: 'bg-amber-500/20 text-amber-400',
  low:    'bg-slate-500/20 text-slate-400',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', assignee: 'aurora' as TaskAssignee, priority: 'medium' as TaskPriority })
  const [saving, setSaving] = useState(false)

  const loadTasks = useCallback(async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadTasks()
    const channel = supabase.channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, loadTasks)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadTasks])

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const taskId = result.draggableId
    const newStatus = result.destination.droppableId as TaskStatus
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    await supabase.from('tasks').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', taskId)
  }

  const addTask = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    await supabase.from('tasks').insert({ ...form, status: 'TODO' })
    setForm({ title: '', description: '', assignee: 'aurora', priority: 'medium' })
    setShowAdd(false)
    setSaving(false)
    loadTasks()
  }

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
  }

  if (loading) return <div className="flex items-center justify-center h-full min-h-screen"><div className="text-slate-500 animate-pulse">Loading tasks...</div></div>

  return (
    <div className="p-4 md:p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-100">✅ Tasks Board</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
          <Plus size={15} /> New Task
        </button>
      </div>

      {/* Add Task Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-5 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-slate-100">New Task</h2>
              <button onClick={() => setShowAdd(false)}><X size={18} className="text-slate-500" /></button>
            </div>
            <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Task title..." className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 mb-2 outline-none focus:border-indigo-500" />
            <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Description (optional)..." rows={2} className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 mb-2 outline-none focus:border-indigo-500 resize-none" />
            <div className="flex gap-2 mb-4">
              <select value={form.assignee} onChange={e => setForm(f => ({...f, assignee: e.target.value as TaskAssignee}))} className="flex-1 bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500">
                <option value="aurora">🌅 Aurora</option>
                <option value="joey">👨‍💼 Joey</option>
              </select>
              <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value as TaskPriority}))} className="flex-1 bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500">
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">⚪ Low</option>
              </select>
            </div>
            <button onClick={addTask} disabled={saving || !form.title.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Add Task'}
            </button>
          </div>
        </div>
      )}

      {/* Kanban board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 h-full">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id)
            return (
              <div key={col.id} className="flex-1 min-w-[260px] flex flex-col">
                <div className={`flex items-center justify-between mb-3 pb-2 border-b-2 ${col.color}`}>
                  <span className="text-sm font-semibold text-slate-300">{col.label}</span>
                  <span className="text-xs bg-[#1a1a1a] text-slate-500 rounded-full px-2 py-0.5">{colTasks.length}</span>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className={`flex-1 min-h-[200px] rounded-xl p-2 transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-500/5' : ''}`}>
                      {colTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(prov, snap) => (
                            <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                              className={`bg-[#111111] border border-[#1a1a1a] rounded-xl p-3 mb-2 cursor-grab active:cursor-grabbing ${snap.isDragging ? 'shadow-lg shadow-black/50 rotate-1' : ''}`}>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-sm text-slate-200 font-medium leading-snug">{task.title}</p>
                                <button onClick={() => deleteTask(task.id)} className="text-slate-700 hover:text-red-400 transition-colors shrink-0">
                                  <X size={13} />
                                </button>
                              </div>
                              {task.description && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{task.description}</p>}
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                                <span className="text-xs ml-auto">{task.assignee === 'aurora' ? '🌅' : '👨‍💼'}</span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {colTasks.length === 0 && (
                        <div className="text-center text-slate-700 text-xs py-8">Drop here</div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>
    </div>
  )
}
