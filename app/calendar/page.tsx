'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { CalendarEvent, EventType } from '@/lib/types'
import { Plus, X, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, parseISO } from 'date-fns'

const EVENT_COLORS: Record<EventType, string> = {
  cron:     'bg-emerald-500',
  task:     'bg-indigo-500',
  meeting:  'bg-blue-500',
  reminder: 'bg-amber-500',
}

const EVENT_LABELS: Record<EventType, string> = {
  cron: '⚙️ Cron', task: '✅ Task', meeting: '📅 Meeting', reminder: '🔔 Reminder'
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date>(new Date())
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"), type: 'task' as EventType, recurring: '', color: '#6366f1' })

  const load = useCallback(async () => {
    const { data } = await supabase.from('calendar_events').select('*').order('start_time')
    setEvents(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startDow = startOfMonth(currentMonth).getDay()
  const dayEvents = (day: Date) => events.filter(e => isSameDay(parseISO(e.start_time), day))
  const selectedEvents = dayEvents(selectedDay)

  const addEvent = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    await supabase.from('calendar_events').insert({ ...form, color: EVENT_COLORS[form.type].replace('bg-','#').replace('-500','') || form.color })
    setShowAdd(false)
    setSaving(false)
    load()
  }

  const deleteEvent = async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
    await supabase.from('calendar_events').delete().eq('id', id)
  }

  if (loading) return <div className="flex items-center justify-center h-full min-h-screen"><div className="text-slate-500 animate-pulse">Loading...</div></div>

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-100">📅 Calendar</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
          <Plus size={15} /> Add Event
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-5 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-slate-100">New Event</h2>
              <button onClick={() => setShowAdd(false)}><X size={18} className="text-slate-500" /></button>
            </div>
            <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Event title..." className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 mb-2 outline-none focus:border-indigo-500" />
            <input type="datetime-local" value={form.start_time} onChange={e => setForm(f => ({...f, start_time: e.target.value}))} className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 mb-2 outline-none focus:border-indigo-500" />
            <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value as EventType}))} className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 mb-2 outline-none focus:border-indigo-500">
              {Object.entries(EVENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input value={form.recurring} onChange={e => setForm(f => ({...f, recurring: e.target.value}))} placeholder="Recurring? (e.g. daily, weekly monday)" className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 mb-4 outline-none focus:border-indigo-500" />
            <button onClick={addEvent} disabled={saving || !form.title.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Add Event'}
            </button>
          </div>
        </div>
      )}

      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-2 hover:bg-[#1a1a1a] rounded-lg text-slate-400"><ChevronLeft size={18} /></button>
        <h2 className="font-semibold text-slate-200">{format(currentMonth, 'MMMM yyyy')}</h2>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 hover:bg-[#1a1a1a] rounded-lg text-slate-400"><ChevronRight size={18} /></button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-xs text-slate-600 py-1 font-medium">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {Array.from({ length: startDow }).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(day => {
          const evs = dayEvents(day)
          const isToday = isSameDay(day, new Date())
          const isSelected = isSameDay(day, selectedDay)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          return (
            <button key={day.toISOString()} onClick={() => setSelectedDay(day)}
              className={`aspect-square flex flex-col items-center justify-start p-1 rounded-lg text-xs transition-colors ${isSelected ? 'bg-indigo-600 text-white' : isToday ? 'bg-indigo-500/20 text-indigo-300' : isCurrentMonth ? 'hover:bg-[#1a1a1a] text-slate-300' : 'text-slate-700'}`}>
              <span className="font-medium">{format(day, 'd')}</span>
              {evs.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {evs.slice(0,3).map((e,i) => <span key={i} className={`w-1 h-1 rounded-full ${EVENT_COLORS[e.type]}`} />)}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day events */}
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
        <h3 className="font-semibold text-slate-300 text-sm mb-3">{format(selectedDay, 'EEEE, MMMM d')}</h3>
        {selectedEvents.length === 0 ? (
          <p className="text-slate-600 text-sm">No events</p>
        ) : (
          <div className="space-y-2">
            {selectedEvents.map(ev => (
              <div key={ev.id} className="flex items-start gap-3 p-3 bg-[#161616] rounded-xl">
                <div className={`w-1 self-stretch rounded-full ${EVENT_COLORS[ev.type]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-200">{ev.title}</p>
                    {ev.recurring && <RefreshCw size={11} className="text-slate-600" />}
                  </div>
                  <p className="text-xs text-slate-500">{format(parseISO(ev.start_time), 'h:mm a')} · {EVENT_LABELS[ev.type]}</p>
                  {ev.recurring && <p className="text-xs text-slate-600">🔄 {ev.recurring}</p>}
                </div>
                <button onClick={() => deleteEvent(ev.id)} className="text-slate-700 hover:text-red-400"><X size={13} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
