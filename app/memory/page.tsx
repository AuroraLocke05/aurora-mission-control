'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Memory } from '@/lib/types'
import { Plus, X, Search, Tag, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', tags: '', source: 'manual', memory_date: '' })

  const load = useCallback(async () => {
    const { data } = await supabase.from('memories').select('*').order('updated_at', { ascending: false })
    setMemories(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const allTags = Array.from(new Set(memories.flatMap(m => m.tags || []))).sort()

  const filtered = memories.filter(m => {
    const matchesQ = !query || m.title.toLowerCase().includes(query.toLowerCase()) || m.content.toLowerCase().includes(query.toLowerCase())
    const matchesTag = !activeTag || (m.tags || []).includes(activeTag)
    return matchesQ && matchesTag
  })

  const addMemory = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    await supabase.from('memories').insert({ ...form, tags, memory_date: form.memory_date || new Date().toISOString().slice(0, 10) })
    setForm({ title: '', content: '', tags: '', source: 'manual', memory_date: '' })
    setShowAdd(false)
    setSaving(false)
    load()
  }

  const deleteMemory = async (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id))
    await supabase.from('memories').delete().eq('id', id)
  }

  if (loading) return <div className="flex items-center justify-center h-full min-h-screen"><div className="text-slate-500 animate-pulse">Loading memories...</div></div>

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100">🧠 Memory</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
          <Plus size={15} /> Add
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-slate-100">New Memory</h2>
              <button onClick={() => setShowAdd(false)}><X size={18} className="text-slate-500" /></button>
            </div>
            <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Title..." className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 mb-2 outline-none focus:border-indigo-500" />
            <textarea value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} placeholder="Memory content..." rows={5} className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 mb-2 outline-none focus:border-indigo-500 resize-none" />
            <input value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))} placeholder="Tags (comma separated)" className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 mb-2 outline-none focus:border-indigo-500" />
            <input value={form.source} onChange={e => setForm(f => ({...f, source: e.target.value}))} placeholder="Source file (e.g. MEMORY.md)" className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 mb-4 outline-none focus:border-indigo-500" />
            <button onClick={addMemory} disabled={saving || !form.title.trim() || !form.content.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Memory'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search memories..." className="w-full bg-[#111111] border border-[#1a1a1a] rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-indigo-500" />
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <button onClick={() => setActiveTag(null)} className={`shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${!activeTag ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-[#1a1a1a] text-slate-500 hover:text-slate-300'}`}>
            All
          </button>
          {allTags.map(tag => (
            <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} className={`shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${activeTag === tag ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-[#1a1a1a] text-slate-500 hover:text-slate-300'}`}>
              <Tag size={10} />{tag}
            </button>
          ))}
        </div>
      )}

      <div className="text-xs text-slate-600 mb-3">{filtered.length} memor{filtered.length !== 1 ? 'ies' : 'y'}</div>

      {/* Memory cards */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center text-slate-600 py-12">
            <Brain size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No memories found</p>
          </div>
        ) : filtered.map(mem => (
          <div key={mem.id} className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
            <button className="w-full text-left p-4" onClick={() => setExpanded(expanded === mem.id ? null : mem.id)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-200 text-sm mb-1">{mem.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-2">{mem.content.slice(0, 150)}{mem.content.length > 150 ? '…' : ''}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-slate-600">{mem.source}</span>
                    {mem.memory_date && <span className="text-[10px] text-slate-600">{mem.memory_date}</span>}
                    {(mem.tags || []).map(t => <span key={t} className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded">{t}</span>)}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {expanded === mem.id ? <ChevronUp size={14} className="text-slate-600" /> : <ChevronDown size={14} className="text-slate-600" />}
                  <button onClick={e => { e.stopPropagation(); deleteMemory(mem.id) }} className="text-slate-700 hover:text-red-400 p-1">
                    <X size={13} />
                  </button>
                </div>
              </div>
            </button>
            {expanded === mem.id && (
              <div className="px-4 pb-4 border-t border-[#1a1a1a] pt-3">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{mem.content}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Brain({ size, className }: { size: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>
}
