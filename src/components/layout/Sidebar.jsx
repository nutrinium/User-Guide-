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
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/applications', icon: AppWindow, label: 'Applications' },
  { to: '/modules', icon: Layers, label: 'Modules' },
  { to: '/guides', icon: BookOpen, label: 'Guides' },
  { to: '/videos', icon: Video, label: 'Videos' },
  { to: '/photos', icon: Image, label: 'Photos' },
  { to: '/documents', icon: Link2, label: 'Linked Documents' },
  { to: '/content', icon: AlignLeft, label: 'Content' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

function Sidebar() {
  return (
    <aside className="peer/sidebar group/sidebar fixed left-0 top-0 z-40 flex h-full w-[72px] flex-col border-r border-slate-200 bg-white py-4 transition-all duration-300 ease-in-out hover:w-64 dark:border-slate-600 dark:bg-slate-950 lg:w-20 lg:hover:w-64">
      <div className="mb-4 flex items-center justify-center px-2 group-hover/sidebar:justify-start lg:px-3">
        <ExtropeakLogo className="h-10 w-auto max-w-[48px] object-contain object-left group-hover/sidebar:max-w-none" />
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={label}
            className={({ isActive }) =>
              `flex h-10 items-center justify-center rounded-xl font-medium transition-colors group-hover/sidebar:justify-start group-hover/sidebar:px-3 ${
                isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-white dark:ring-1 dark:ring-blue-400/30'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-white dark:hover:bg-slate-700 dark:hover:text-white'
              }`
            }
          >
            <Icon size={20} className="shrink-0" />
            <span className="ml-3 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-300 group-hover/sidebar:opacity-100">
              {label}
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
