import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Settings, LogOut } from 'lucide-react'
import { useRole } from '../../context/RoleContext'
import AdminLoginModal from './AdminLoginModal'

function UserProfileMenu({ darkNav = false }) {
  const { isAdmin, loginAsAdmin, logoutAdmin } = useRole()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAdminClick = () => {
    setOpen(false)
    if (isAdmin) {
      navigate('/')
    } else {
      setShowLogin(true)
    }
  }

  const handleViewerClick = () => {
    setOpen(false)
    logoutAdmin()
    navigate('/viewer')
  }

  const handleLogin = (username, password) => {
    const result = loginAsAdmin(username, password)
    if (result.success) {
      navigate('/')
    }
    return result
  }

  const label = isAdmin ? 'Admin' : 'Viewer'
  const initials = isAdmin ? 'AD' : 'VI'
  const avatarColor = isAdmin ? 'bg-blue-600' : 'bg-violet-600'

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-colors ${
            darkNav
              ? 'border-slate-700 bg-white/5 hover:bg-white/10'
              : 'border-slate-200 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800'
          }`}
          aria-expanded={open}
          aria-haspopup="true"
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColor}`}
          >
            {initials}
          </div>
          <span
            className={`hidden text-sm font-medium sm:inline ${
              darkNav ? 'text-slate-200' : 'text-slate-700 dark:text-white'
            }`}
          >
            {label}
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform ${darkNav ? 'text-slate-400' : 'text-slate-400 dark:text-white'} ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-900">
            {isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    navigate('/')
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800"
                >
                  <Settings size={16} />
                  Admin Dashboard
                </button>
                <button
                  type="button"
                  onClick={handleViewerClick}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800"
                >
                  <LogOut size={16} />
                  Switch to Viewer
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleAdminClick}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800"
              >
                <Settings size={16} />
                Admin
              </button>
            )}
          </div>
        )}
      </div>

      <AdminLoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={handleLogin}
      />
    </>
  )
}

export default UserProfileMenu
