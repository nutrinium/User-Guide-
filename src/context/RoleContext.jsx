import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const RoleContext = createContext(null)
const ROLE_KEY = 'ugms-role'
const AUTH_KEY = 'ugms-admin-auth'

const DEFAULT_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
}

export function RoleProvider({ children }) {
  const [role, setRole] = useState(() => {
    if (typeof window === 'undefined') return 'viewer'
    const isAuthed = localStorage.getItem(AUTH_KEY) === 'true'
    const storedRole = localStorage.getItem(ROLE_KEY)
    return isAuthed && storedRole === 'admin' ? 'admin' : 'viewer'
  })

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(AUTH_KEY) === 'true'
  })

  useEffect(() => {
    localStorage.setItem(ROLE_KEY, role)
  }, [role])

  useEffect(() => {
    localStorage.setItem(AUTH_KEY, isAdminAuthenticated ? 'true' : 'false')
  }, [isAdminAuthenticated])

  const loginAsAdmin = useCallback((username, password) => {
    if (
      username === DEFAULT_CREDENTIALS.username &&
      password === DEFAULT_CREDENTIALS.password
    ) {
      setIsAdminAuthenticated(true)
      setRole('admin')
      return { success: true }
    }
    return { success: false, error: 'Invalid username or password' }
  }, [])

  const logoutAdmin = useCallback(() => {
    setIsAdminAuthenticated(false)
    setRole('viewer')
  }, [])

  const switchToViewer = useCallback(() => {
    setRole('viewer')
  }, [])

  return (
    <RoleContext.Provider
      value={{
        role,
        isAdmin: role === 'admin' && isAdminAuthenticated,
        isViewer: role === 'viewer' || !isAdminAuthenticated,
        isAdminAuthenticated,
        setRole,
        loginAsAdmin,
        logoutAdmin,
        switchToViewer,
      }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole must be used within RoleProvider')
  }
  return context
}
