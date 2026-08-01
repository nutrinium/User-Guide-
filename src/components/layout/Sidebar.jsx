import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  AppWindow,
  Layers,
  BookOpen,
  Settings,
  Video,
  Image,
  Link2,
  AlignLeft,
} from 'lucide-react'
import ExtropeakLogo from './ExtropeakLogo'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', color: '#3b82f6' },
  { to: '/applications', icon: AppWindow, label: 'Applications', color: '#8b5cf6' },
  { to: '/modules', icon: Layers, label: 'Modules', color: '#06b6d4' },
  { to: '/guides', icon: BookOpen, label: 'Guides', color: '#f59e0b' },
  { to: '/videos', icon: Video, label: 'Videos', color: '#ef4444' },
  { to: '/photos', icon: Image, label: 'Photos', color: '#10b981' },
  { to: '/documents', icon: Link2, label: 'Linked Documents', color: '#6366f1' },
  { to: '/content', icon: AlignLeft, label: 'Content', color: '#ec4899' },
  { to: '/settings', icon: Settings, label: 'Settings', color: '#64748b' },
]

function SidebarNavItem({ to, icon: Icon, label, color, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={label}
      className={({ isActive }) =>
        `group/item relative flex h-10 w-full items-center justify-center rounded-xl font-medium transition-all group-hover/sidebar:justify-start group-hover/sidebar:px-1 ${
          isActive
            ? 'bg-white/10 text-white ring-1 ring-white/10'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className="absolute left-0 h-8 w-[3px] rounded-r-full transition-opacity"
            style={{ backgroundColor: color, opacity: isActive ? 1 : 0 }}
          />
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover/item:scale-105"
            style={{
              backgroundColor: isActive ? `${color}30` : `${color}18`,
              color,
            }}
          >
            <Icon size={18} />
          </span>
          <span className="ml-3 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-300 group-hover/sidebar:opacity-100">
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}

function Sidebar() {
  return (
    <aside className="peer/sidebar group/sidebar fixed left-0 top-0 z-40 flex h-full w-[72px] flex-col border-r border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 py-3 transition-all duration-300 ease-in-out hover:w-64 lg:w-20 lg:hover:w-64">
      <div
        className="mb-3 h-1 w-full shrink-0"
        style={{
          background: 'linear-gradient(90deg, #FF6B2C, #E91E8C, #7B2FF7, #2563EB)',
        }}
      />

      <div className="mb-4 flex items-center justify-center px-2 group-hover/sidebar:justify-start lg:px-3">
        <ExtropeakLogo className="h-10 w-auto max-w-[48px] object-contain object-left group-hover/sidebar:max-w-none" />
      </div>

      <nav className="relative flex flex-1 flex-col gap-1 overflow-y-auto px-2">
        {navItems.map((item) => (
          <SidebarNavItem key={item.to} {...item} end={item.to === '/'} />
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
