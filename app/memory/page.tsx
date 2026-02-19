'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Memory } from '@/lib/types'
import { Plus, X, Search, Tag, Loader2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

const PAGE_SIZE = 30

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [allTags, setAllTags] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', tags: '', source: 'manual', memory_date: '' })
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 300)
  }, [query])

  const fetchMemories = useCallback(async (reset = true) => {
    const currentOffset = reset ? 0 : offset
    if (reset) setLoading(true)
    else setLoadingMore(true)

    let q = supabase.from('memories').select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(currentOffset, currentOffset + PAGE_SIZE - 1)

    if (debouncedQuery) {
      q = q.or(`title.ilike.%${debouncedQuery}%,content.ilike.%${debouncedQuery}%`)
    }
    if (activeTag) {
      q = q.contains('tags', [activeTag])
    }

    const { data, count } = await q
    if (reset) {
      setMemories(data || [])
      setOffset(PAGE_SIZE)
    } else {
      setMemories(prev => [...prev, ...(data || [])])
      setOffset(currentOffset + PAGE_SIZE)
    }
    setTotal(count || 0)
    setLoading(false)
    setLoadingMore(false)
  }, [debouncedQuery, activeTag, offset])

  useEffect(() => { fetchMemories(true) }, [debouncedQuery, activeTag])

  // Load all unique tags
  useEffect(() => {
    supabase.from('memories').select('tags').then(({ data }) => {
      const tags = Array.from(new Set((data || []).flatMap(m => m.tags || []))).sort()
      setAllTags(tags)
    })
  }, [memories.length])

  const addMemory = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    await supabase.from('memories').insert({ ...form, tags, memory_date: form.memory_date || new Date().toISOString().slice(0, 10) })
    setForm({ title: '', content: '', tags: '', source: 'manual', memory_date: '' })
    setShowAdd(false)
    setSaving(false)
    fetchMemories(true)
  }

  const deleteMemory = async (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id))
    setTotal(t => t - 1)
    await supabase.from('memories').delete().eq('id', id)
  }

  const hasMore = memories.length < total

  if (loading) return <div className="flex items-center justify-center h-full min-h-screen"><div className="text-slate-500 animate-pulse">Loading memories...</div></div>

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">🧠 Memory</h1>
          <p className="text-xs text-slate-600 mt-0.5">{total.toLocaleString()} memories synced from Aurora's files</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setSyncing(true); fetchMemories(true).then(() => setSyncing(false)) }}
            className={`p-2 text-slate-500 hover:text-slate-300 transition-colors ${syncing ? 'animate-spin' : ''}`}>
            <RefreshCw size={15} />
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
            <Plus size={15} /> Add
          </button>
        </div>
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
            <input value={form.source} onChange={e => setForm(f => ({...f, source: e.target.value}))} placeholder="Source file" className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 mb-4 outline-none focus:border-indigo-500" />
            <button onClick={addMemory} disabled={saving || !form.title.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Memory'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${total.toLocaleString()} memories...`}
          className="w-full bg-[#111111] border border-[#1a1a1a] rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-indigo-500" />
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <button onClick={() => setActiveTag(null)} className={`shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${!activeTag ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-[#1a1a1a] text-slate-500 hover:text-slate-300'}`}>All</button>
          {allTags.slice(0, 20).map(tag => (
            <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} className={`shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${activeTag === tag ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-[#1a1a1a] text-slate-500 hover:text-slate-300'}`}>
              <Tag size={9} />{tag}
            </button>
          ))}
        </div>
      )}

      <div className="text-xs text-slate-600 mb-3">Showing {memories.length} of {total.toLocaleString()}</div>

      {/* Memory cards */}
      <div className="space-y-2">
        {memories.length === 0 ? (
          <div className="text-center text-slate-600 py-12">
            <p className="text-2xl mb-2">🧠</p>
            <p className="text-sm">No memories found</p>
          </div>
        ) : memories.map(mem => (
          <div key={mem.id} className="bg-[#111111] border border-[#1a1a1a] rounded-xl overflow-hidden">
            <button className="w-full text-left p-4" onClick={() => setExpanded(expanded === mem.id ? null : mem.id)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-200 text-sm mb-1 leading-snug">{mem.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-2">{mem.content.slice(0, 200)}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] text-slate-700">{mem.source}</span>
                    {mem.memory_date && <span className="text-[10px] text-slate-700">{mem.memory_date}</span>}
                    {(mem.tags || []).slice(0, 3).map(t => <span key={t} className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded">{t}</span>)}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {expanded === mem.id ? <ChevronUp size={13} className="text-slate-600" /> : <ChevronDown size={13} className="text-slate-600" />}
                  <button onClick={e => { e.stopPropagation(); deleteMemory(mem.id) }} className="text-slate-700 hover:text-red-400 p-0.5"><X size={12} /></button>
                </div>
              </div>
            </button>
            {expanded === mem.id && (
              <div className="px-4 pb-4 border-t border-[#1a1a1a] pt-3">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">{mem.content}</pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <button onClick={() => fetchMemories(false)} disabled={loadingMore}
          className="w-full mt-4 py-3 text-sm text-slate-500 hover:text-slate-300 border border-[#1a1a1a] rounded-xl transition-colors flex items-center justify-center gap-2">
          {loadingMore ? <><Loader2 size={14} className="animate-spin" /> Loading...</> : `Load more (${total - memories.length} remaining)`}
        </button>
      )}
    </div>
  )
}
