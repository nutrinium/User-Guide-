import { Link, Outlet } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import UserProfileMenu from '../layout/UserProfileMenu'
import ExtropeakLogo from '../layout/ExtropeakLogo'

function ViewerLayout() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950">
        <div
          className="h-1 w-full"
          style={{
            background: 'linear-gradient(90deg, #FF6B2C, #E91E8C, #7B2FF7, #2563EB)',
          }}
        />
        <div className="relative mx-auto flex h-20 items-center px-4 sm:h-[4.5rem] sm:px-6 lg:max-w-7xl">
          <Link to="/viewer" className="shrink-0">
            <ExtropeakLogo className="h-10 w-auto object-contain sm:h-11" />
          </Link>

          <Link
            to="/viewer"
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-base font-bold text-white sm:text-xl"
          >
            User Guide Application
          </Link>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg border border-slate-700 bg-white/5 p-2.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <UserProfileMenu darkNav />
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
