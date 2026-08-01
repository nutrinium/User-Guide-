import { Link, Outlet } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import UserProfileMenu from '../layout/UserProfileMenu'
import ExtropeakLogo from '../layout/ExtropeakLogo'

function ViewerLayout() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <div className="relative mx-auto flex h-20 items-center px-4 sm:h-24 sm:px-6 lg:max-w-7xl">
          <Link to="/viewer" className="shrink-0">
            <ExtropeakLogo className="h-10 w-auto object-contain sm:h-12" />
          </Link>

          <Link
            to="/viewer"
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-base font-bold text-slate-900 dark:text-white sm:text-xl"
          >
            User Guide Application
          </Link>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg border border-slate-200 p-2.5 text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <UserProfileMenu />
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default ViewerLayout
