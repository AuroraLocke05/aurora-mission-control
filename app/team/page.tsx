'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { TeamMember, MemberStatus } from '@/lib/types'
import { Plus, X, Loader2, Edit2, Check } from 'lucide-react'

const STATUS_STYLES: Record<MemberStatus, string> = {
  active:  'bg-emerald-500/20 text-emerald-400',
  idle:    'bg-amber-500/20 text-amber-400',
  offline: 'bg-slate-500/20 text-slate-500',
}
const STATUS_DOT: Record<MemberStatus, string> = {
  active:  'bg-emerald-400 animate-pulse',
  idle:    'bg-amber-400',
  offline: 'bg-slate-600',
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingTask, setEditingTask] = useState<{id: string; task: string} | null>(null)
  const [form, setForm] = useState({ name: '', role: '', type: 'agent' as 'human' | 'agent', description: '', responsibilities: '', avatar: '🤖' })

  const load = useCallback(async () => {
    const { data } = await supabase.from('team_members').select('*').order('sort_order')
    setMembers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const ch = supabase.channel('team-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  const updateStatus = async (id: string, status: MemberStatus) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, status } : m))
    await supabase.from('team_members').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  }

  const saveTask = async (id: string, current_task: string) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, current_task } : m))
    await supabase.from('team_members').update({ current_task, updated_at: new Date().toISOString() }).eq('id', id)
    setEditingTask(null)
  }

  const addMember = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const responsibilities = form.responsibilities.split(',').map(r => r.trim()).filter(Boolean)
    await supabase.from('team_members').insert({ ...form, responsibilities, status: 'idle', sort_order: members.length })
    setForm({ name: '', role: '', type: 'agent', description: '', responsibilities: '', avatar: '🤖' })
    setShowAdd(false)
    setSaving(false)
    load()
  }

  const deleteMember = async (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id))
    await supabase.from('team_members').delete().eq('id', id)
  }

  if (loading) return <div className="flex items-center justify-center h-full min-h-screen"><div className="text-slate-500 animate-pulse">Loading team...</div></div>

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-100">👥 Team</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
          <Plus size={15} /> Add Agent
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-5 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-slate-100">New Team Member</h2>
              <button onClick={() => setShowAdd(false)}><X size={18} className="text-slate-500" /></button>
            </div>
            <div className="flex gap-2 mb-2">
              <input value={form.avatar} onChange={e => setForm(f => ({...f, avatar: e.target.value}))} placeholder="Emoji" className="w-16 bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 text-center outline-none focus:border-indigo-500" />
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Name" className="flex-1 bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-indigo-500" />
            </div>
            <input value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))} placeholder="Role" className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 mb-2 outline-none focus:border-indigo-500" />
            <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value as 'human' | 'agent'}))} className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 mb-2 outline-none focus:border-indigo-500">
              <option value="agent">🤖 AI Agent</option>
              <option value="human">👤 Human</option>
            </select>
            <input value={form.responsibilities} onChange={e => setForm(f => ({...f, responsibilities: e.target.value}))} placeholder="Responsibilities (comma separated)" className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 mb-4 outline-none focus:border-indigo-500" />
            <button onClick={addMember} disabled={saving || !form.name.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Add Member'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {members.map(member => (
          <div key={member.id} className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="text-3xl">{member.avatar}</span>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#111111] ${STATUS_DOT[member.status]}`} />
                </div>
                <div>
                  <p className="font-semibold text-slate-200 text-sm">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.role}</p>
                </div>
              </div>
              <button onClick={() => deleteMember(member.id)} className="text-slate-700 hover:text-red-400 p-1"><X size={13} /></button>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 mb-3">
              <select value={member.status} onChange={e => updateStatus(member.id, e.target.value as MemberStatus)}
                className={`text-xs px-2 py-1 rounded-full border-0 outline-none font-medium ${STATUS_STYLES[member.status]} bg-transparent cursor-pointer`}>
                <option value="active">🟢 Active</option>
                <option value="idle">🟡 Idle</option>
                <option value="offline">⚫ Offline</option>
              </select>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border border-[#222] ${member.type === 'human' ? 'text-blue-400' : 'text-purple-400'}`}>
                {member.type === 'human' ? '👤 Human' : '🤖 Agent'}
              </span>
            </div>

            {/* Current task */}
            <div className="mb-3">
              {editingTask?.id === member.id ? (
                <div className="flex gap-1">
                  <input value={editingTask.task} onChange={e => setEditingTask(t => t && {...t, task: e.target.value})}
                    className="flex-1 bg-[#0a0a0a] border border-[#222] rounded text-xs px-2 py-1 text-slate-200 outline-none focus:border-indigo-500" placeholder="Current task..." />
                  <button onClick={() => saveTask(member.id, editingTask.task)} className="text-emerald-400 hover:text-emerald-300"><Check size={14} /></button>
                  <button onClick={() => setEditingTask(null)} className="text-slate-600 hover:text-slate-400"><X size={14} /></button>
                </div>
              ) : (
                <button onClick={() => setEditingTask({ id: member.id, task: member.current_task || '' })}
                  className="w-full text-left flex items-center gap-1.5 group">
                  <span className="text-xs text-slate-500 truncate flex-1">{member.current_task || 'No active task'}</span>
                  <Edit2 size={11} className="text-slate-700 group-hover:text-slate-500 shrink-0" />
                </button>
              )}
            </div>

            {/* Responsibilities */}
            {(member.responsibilities || []).length > 0 && (
              <div>
                <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1.5">Responsibilities</p>
                <div className="flex flex-wrap gap-1">
                  {member.responsibilities.map(r => (
                    <span key={r} className="text-[10px] bg-[#1a1a1a] text-slate-500 px-1.5 py-0.5 rounded">{r}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
