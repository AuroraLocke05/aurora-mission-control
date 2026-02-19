'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, Clapperboard, Calendar, Brain, Users, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/',        label: 'Home',    icon: LayoutDashboard },
  { href: '/tasks',   label: 'Tasks',   icon: CheckSquare },
  { href: '/content', label: 'Content', icon: Clapperboard },
  { href: '/calendar',label: 'Calendar',icon: Calendar },
  { href: '/memory',  label: 'Memory',  icon: Brain },
  { href: '/team',    label: 'Team',    icon: Users },
  { href: '/office',  label: 'Office',  icon: Building2 },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111111] border-t border-[#1a1a1a] flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} className={cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] transition-colors',
              active ? 'text-indigo-400' : 'text-slate-500'
            )}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-16 hover:w-48 transition-all duration-200 bg-[#111111] border-r border-[#1a1a1a] overflow-hidden group shrink-0">
        <div className="p-3 mb-2 border-b border-[#1a1a1a]">
          <span className="text-xl">🌅</span>
          <span className="ml-2 text-sm font-semibold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Mission Control</span>
        </div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} className={cn(
              'flex items-center gap-3 px-4 py-3 text-sm transition-colors whitespace-nowrap',
              active ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            )}>
              <Icon size={18} className="shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">{label}</span>
            </Link>
          )
        })}
      </aside>
    </>
  )
}
