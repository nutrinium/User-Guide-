import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import UserProfileMenu from './UserProfileMenu'
import ExtropeakLogo from './ExtropeakLogo'

function TopNav() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-4">
        <ExtropeakLogo className="h-10 w-auto object-contain" />
        <div className="hidden h-6 w-px bg-slate-300 dark:bg-slate-600 sm:block" />
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-white">
            User Guide Management
          </p>
          <p className="text-base font-bold text-slate-800 dark:text-white sm:text-lg">
            Dynamic User Guide
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          <span className="hidden text-sm font-medium sm:inline">
            {isDark ? 'Light' : 'Dark'}
          </span>
        </button>
        <UserProfileMenu />
      </div>
    </header>
  )
}

export default TopNav
