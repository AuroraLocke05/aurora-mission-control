'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Task, TeamMember, Memory, CalendarEvent } from '@/lib/types'
import { CheckSquare, Users, Brain, Calendar, TrendingUp, Clock } from 'lucide-react'

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [memories, setMemories] = useState<Memory[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [t, m, mem, e] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('team_members').select('*').order('sort_order'),
        supabase.from('memories').select('*').order('updated_at', { ascending: false }).limit(5),
        supabase.from('calendar_events').select('*').order('start_time'),
      ])
      setTasks(t.data || [])
      setMembers(m.data || [])
      setMemories(mem.data || [])
      setEvents(e.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const activeTasks = tasks.filter(t => t.status !== 'DONE').length
  const activeAgents = members.filter(m => m.status === 'active').length
  const thisWeekEvents = events.filter(e => {
    const d = new Date(e.start_time)
    const now = new Date()
    const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7)
    return d >= now && d <= weekEnd
  }).length

  const stats = [
    { label: 'Active Tasks', value: activeTasks, icon: CheckSquare, color: 'text-indigo-400' },
    { label: 'Active Agents', value: activeAgents, icon: Users, color: 'text-emerald-400' },
    { label: 'Memories', value: memories.length, icon: Brain, color: 'text-purple-400' },
    { label: 'Events This Week', value: thisWeekEvents, icon: Calendar, color: 'text-amber-400' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-screen">
      <div className="text-slate-500 animate-pulse">Loading...</div>
    </div>
  )

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">🌅 Mission Control</h1>
        <p className="text-slate-500 text-sm mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
            <Icon size={18} className={cn(color, 'mb-2')} />
            <div className="text-2xl font-bold text-slate-100">{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent tasks */}
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-indigo-400" />
            <h2 className="font-semibold text-slate-200 text-sm">Active Tasks</h2>
          </div>
          <div className="space-y-2">
            {tasks.filter(t => t.status !== 'DONE').slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center gap-2 py-1.5 border-b border-[#1a1a1a] last:border-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.priority === 'high' ? 'bg-red-400' : task.priority === 'medium' ? 'bg-amber-400' : 'bg-slate-600'}`} />
                <span className="text-sm text-slate-300 truncate flex-1">{task.title}</span>
                <span className="text-xs text-slate-600">{task.assignee === 'aurora' ? '🌅' : '👨‍💼'}</span>
              </div>
            ))}
            {tasks.filter(t => t.status !== 'DONE').length === 0 && (
              <p className="text-slate-600 text-sm">All clear! No active tasks.</p>
            )}
          </div>
        </div>

        {/* Recent memories */}
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-purple-400" />
            <h2 className="font-semibold text-slate-200 text-sm">Recent Memories</h2>
          </div>
          <div className="space-y-2">
            {memories.slice(0, 5).map(mem => (
              <div key={mem.id} className="py-1.5 border-b border-[#1a1a1a] last:border-0">
                <div className="text-sm text-slate-300 truncate">{mem.title}</div>
                <div className="text-xs text-slate-600 mt-0.5">{mem.memory_date || mem.updated_at?.slice(0, 10)}</div>
              </div>
            ))}
            {memories.length === 0 && (
              <p className="text-slate-600 text-sm">No memories yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Team status */}
      <div className="mt-4 bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-emerald-400" />
          <h2 className="font-semibold text-slate-200 text-sm">Team Status</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-2 bg-[#161616] rounded-lg px-3 py-2">
              <span>{m.avatar}</span>
              <span className="text-sm text-slate-300">{m.name}</span>
              <span className={`w-2 h-2 rounded-full ${m.status === 'active' ? 'bg-emerald-400 animate-pulse' : m.status === 'idle' ? 'bg-amber-400' : 'bg-slate-600'}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}
