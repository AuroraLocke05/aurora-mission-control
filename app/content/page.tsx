'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { supabase } from '@/lib/supabase'
import { ContentItem, ContentStage } from '@/lib/types'
import { Plus, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

const STAGES: { id: ContentStage; label: string; emoji: string }[] = [
  { id: 'idea',       label: 'Idea',       emoji: '💡' },
  { id: 'script',     label: 'Script',     emoji: '📝' },
  { id: 'thumbnail',  label: 'Thumbnail',  emoji: '🎨' },
  { id: 'filming',    label: 'Filming',    emoji: '🎬' },
  { id: 'published',  label: 'Published',  emoji: '🚀' },
]

const PLATFORMS = ['twitter', 'youtube', 'tiktok', 'instagram', 'blog']
const PLATFORM_LABELS: Record<string, string> = { twitter: '𝕏', youtube: '▶️', tiktok: '♪', instagram: '📸', blog: '📄' }

export default function ContentPage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', platform: 'twitter' })
  const [saving, setSaving] = useState(false)
  const [editScript, setEditScript] = useState<{id: string; script: string} | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('content_items').select('*').order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const ch = supabase.channel('content-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content_items' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const id = result.draggableId
    const newStage = result.destination.droppableId as ContentStage
    setItems(prev => prev.map(i => i.id === id ? { ...i, stage: newStage } : i))
    await supabase.from('content_items').update({ stage: newStage, updated_at: new Date().toISOString() }).eq('id', id)
  }

  const addItem = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    await supabase.from('content_items').insert({ ...form, stage: 'idea' })
    setForm({ title: '', description: '', platform: 'twitter' })
    setShowAdd(false)
    setSaving(false)
    load()
  }

  const saveScript = async (id: string, script: string) => {
    await supabase.from('content_items').update({ script, updated_at: new Date().toISOString() }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, script } : i))
    setEditScript(null)
  }

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    await supabase.from('content_items').delete().eq('id', id)
  }

  const moveStage = async (item: ContentItem, dir: 1 | -1) => {
    const idx = STAGES.findIndex(s => s.id === item.stage)
    const next = STAGES[idx + dir]
    if (!next) return
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, stage: next.id } : i))
    await supabase.from('content_items').update({ stage: next.id, updated_at: new Date().toISOString() }).eq('id', item.id)
  }

  if (loading) return <div className="flex items-center justify-center h-full min-h-screen"><div className="text-slate-500 animate-pulse">Loading...</div></div>

  return (
    <div className="p-4 md:p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-100">🎬 Content Pipeline</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
          <Plus size={15} /> New
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-5 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-slate-100">New Content</h2>
              <button onClick={() => setShowAdd(false)}><X size={18} className="text-slate-500" /></button>
            </div>
            <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Content title..." className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 mb-2 outline-none focus:border-indigo-500" />
            <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Brief description..." rows={2} className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 mb-2 outline-none focus:border-indigo-500 resize-none" />
            <select value={form.platform} onChange={e => setForm(f => ({...f, platform: e.target.value}))} className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 mb-4 outline-none focus:border-indigo-500">
              {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_LABELS[p]} {p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            <button onClick={addItem} disabled={saving || !form.title.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Add to Pipeline'}
            </button>
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const stageItems = items.filter(i => i.stage === stage.id)
            return (
              <div key={stage.id} className="flex-1 min-w-[220px]">
                <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-[#1a1a1a]">
                  <span>{stage.emoji}</span>
                  <span className="text-sm font-semibold text-slate-300">{stage.label}</span>
                  <span className="text-xs bg-[#1a1a1a] text-slate-500 rounded-full px-2 py-0.5 ml-auto">{stageItems.length}</span>
                </div>
                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className={`min-h-[120px] rounded-xl p-2 ${snapshot.isDraggingOver ? 'bg-indigo-500/5' : ''}`}>
                      {stageItems.map((item, idx) => (
                        <Draggable key={item.id} draggableId={item.id} index={idx}>
                          {(prov, snap) => (
                            <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                              className={`bg-[#111111] border border-[#1a1a1a] rounded-xl mb-2 ${snap.isDragging ? 'shadow-lg rotate-1' : ''}`}>
                              <div className="p-3">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="text-sm text-slate-200 font-medium leading-snug">{item.title}</p>
                                  <div className="flex gap-1">
                                    <button onClick={() => setExpanded(expanded === item.id ? null : item.id)} className="text-slate-600 hover:text-slate-400"><ChevronDown size={13} /></button>
                                    <button onClick={() => deleteItem(item.id)} className="text-slate-700 hover:text-red-400"><X size={13} /></button>
                                  </div>
                                </div>
                                {item.platform && <span className="text-[10px] bg-[#1a1a1a] text-slate-500 px-1.5 py-0.5 rounded">{PLATFORM_LABELS[item.platform]} {item.platform}</span>}
                              </div>

                              {expanded === item.id && (
                                <div className="px-3 pb-3 border-t border-[#1a1a1a] pt-3">
                                  {editScript?.id === item.id ? (
                                    <>
                                      <textarea value={editScript.script} onChange={e => setEditScript(s => s && {...s, script: e.target.value})} rows={6} className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-2 py-2 text-xs text-slate-200 resize-none outline-none focus:border-indigo-500 mb-2" placeholder="Write your script here..." />
                                      <div className="flex gap-2">
                                        <button onClick={() => saveScript(item.id, editScript.script)} className="flex-1 bg-indigo-600 text-white text-xs py-1.5 rounded-lg">Save</button>
                                        <button onClick={() => setEditScript(null)} className="flex-1 bg-[#1a1a1a] text-slate-400 text-xs py-1.5 rounded-lg">Cancel</button>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-xs text-slate-500 mb-2 line-clamp-3">{item.script || 'No script yet.'}</p>
                                      <button onClick={() => setEditScript({ id: item.id, script: item.script || '' })} className="text-xs text-indigo-400 hover:text-indigo-300">
                                        {item.script ? 'Edit script' : '+ Add script'}
                                      </button>
                                    </>
                                  )}
                                  <div className="flex gap-1 mt-2">
                                    <button onClick={() => moveStage(item, -1)} disabled={stage.id === 'idea'} className="flex-1 text-xs bg-[#1a1a1a] text-slate-500 py-1 rounded disabled:opacity-30"><ChevronUp size={12} className="inline" /> Back</button>
                                    <button onClick={() => moveStage(item, 1)} disabled={stage.id === 'published'} className="flex-1 text-xs bg-[#1a1a1a] text-slate-500 py-1 rounded disabled:opacity-30">Next <ChevronDown size={12} className="inline" /></button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
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
