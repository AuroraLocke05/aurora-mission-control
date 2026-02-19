'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { TeamMember, MemberStatus } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

const STATUS_GLOW: Record<MemberStatus, string> = {
  active:  'shadow-emerald-500/30',
  idle:    'shadow-amber-500/10',
  offline: 'shadow-none',
}

const STATUS_SCREEN: Record<MemberStatus, string> = {
  active:  'bg-indigo-900/80',
  idle:    'bg-slate-800/30',
  offline: 'bg-slate-900/10',
}

function Workstation({ member, onClick }: { member: TeamMember; onClick: () => void }) {
  const isActive = member.status === 'active'
  const isIdle = member.status === 'idle'

  return (
    <button onClick={onClick} className="group w-full">
      <div className={`bg-[#111111] border border-[#1a1a1a] rounded-2xl p-4 transition-all hover:border-[#2a2a2a] shadow-lg ${STATUS_GLOW[member.status]}`}>
        {/* Monitor */}
        <div className={`rounded-xl mb-2 h-20 flex items-center justify-center relative overflow-hidden border border-[#222] ${STATUS_SCREEN[member.status]}`}>
          {isActive && (
            <>
              <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent"
                animate={{ x: ['-100%', '100%'] }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} />
              <div className="text-[10px] text-indigo-300/60 font-mono absolute top-2 left-2 right-2 truncate">
                {member.current_task || '> running...'}
              </div>
              <motion.div className="text-[10px] font-mono text-emerald-400/60 absolute bottom-2 left-2"
                animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                ▋
              </motion.div>
            </>
          )}
          {isIdle && <div className="text-slate-700 text-[10px] font-mono">idle</div>}
          {member.status === 'offline' && <div className="text-slate-800 text-[10px]">offline</div>}
        </div>

        {/* Desk surface */}
        <div className="bg-[#0d0d0d] rounded-lg h-3 mb-3 flex items-center px-2 gap-1">
          <div className="w-1 h-1 rounded-full bg-slate-700" />
          <div className="w-1 h-1 rounded-full bg-slate-800" />
        </div>

        {/* Agent */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <motion.span className="text-3xl block"
              animate={isActive ? { y: [0, -2, 0] } : {}}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}>
              {member.avatar}
            </motion.span>
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#111] ${isActive ? 'bg-emerald-400 animate-pulse' : isIdle ? 'bg-amber-400' : 'bg-slate-700'}`} />
          </div>
          <span className="text-xs text-slate-400 mt-1.5 font-medium">{member.name}</span>
          <span className="text-[10px] text-slate-600">{member.role}</span>
        </div>
      </div>
    </button>
  )
}

export default function OfficePage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<TeamMember | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('team_members').select('*').order('sort_order')
    setMembers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const ch = supabase.channel('office-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  const active = members.filter(m => m.status === 'active')
  const idle = members.filter(m => m.status === 'idle')
  const offline = members.filter(m => m.status === 'offline')

  if (loading) return <div className="flex items-center justify-center h-full min-h-screen"><div className="text-slate-500 animate-pulse">Opening office...</div></div>

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-100">🏢 Office</h1>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> {active.length} active</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> {idle.length} idle</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-700" /> {offline.length} offline</span>
        </div>
      </div>

      {/* Active section */}
      {active.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-emerald-500 font-medium uppercase tracking-wide mb-3">🟢 On the Clock</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {active.map(m => <Workstation key={m.id} member={m} onClick={() => setSelected(m)} />)}
          </div>
        </div>
      )}

      {/* Idle section */}
      {idle.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-amber-500/70 font-medium uppercase tracking-wide mb-3">🟡 Available</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {idle.map(m => <Workstation key={m.id} member={m} onClick={() => setSelected(m)} />)}
          </div>
        </div>
      )}

      {/* Offline */}
      {offline.length > 0 && (
        <div>
          <p className="text-xs text-slate-700 font-medium uppercase tracking-wide mb-3">⚫ Offline</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 opacity-50">
            {offline.map(m => <Workstation key={m.id} member={m} onClick={() => setSelected(m)} />)}
          </div>
        </div>
      )}

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            className="fixed inset-x-0 bottom-0 md:bottom-4 md:right-4 md:left-auto md:w-80 bg-[#161616] border border-[#2a2a2a] md:rounded-2xl rounded-t-2xl p-5 z-40 shadow-2xl">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selected.avatar}</span>
                <div>
                  <p className="font-semibold text-slate-100">{selected.name}</p>
                  <p className="text-xs text-slate-500">{selected.role}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-600 hover:text-slate-400">✕</button>
            </div>
            <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full mb-3 ${selected.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : selected.status === 'idle' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${selected.status === 'active' ? 'bg-emerald-400' : selected.status === 'idle' ? 'bg-amber-400' : 'bg-slate-600'}`} />
              {selected.status}
            </div>
            {selected.current_task && (
              <div className="bg-[#111] rounded-xl p-3 mb-3">
                <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1">Current Task</p>
                <p className="text-sm text-slate-200">{selected.current_task}</p>
              </div>
            )}
            {selected.description && <p className="text-xs text-slate-500 mb-3">{selected.description}</p>}
            {(selected.responsibilities || []).length > 0 && (
              <div>
                <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1.5">Responsibilities</p>
                <div className="flex flex-wrap gap-1">
                  {selected.responsibilities.map(r => <span key={r} className="text-[10px] bg-[#1a1a1a] text-slate-500 px-1.5 py-0.5 rounded">{r}</span>)}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
