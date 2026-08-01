import { useEffect, useRef, useState } from 'react'
import { Lock, User } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

function AdminLoginModal({ isOpen, onClose, onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const usernameRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setError('')
      requestAnimationFrame(() => usernameRef.current?.focus())
    }
  }, [isOpen])

  const handleClose = () => {
    setUsername('')
    setPassword('')
    setError('')
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = onLogin(username.trim(), password)
    setLoading(false)

    if (result.success) {
      handleClose()
    } else {
      setError(result.error || 'Login failed')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Admin Login" size="sm">
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-300">
        Sign in to access the admin dashboard.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="admin-username"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-white"
          >
            Username
          </label>
          <div className="relative">
            <User
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              ref={usernameRef}
              id="admin-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              required
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="admin-password"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-white"
          >
            Password
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              required
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default AdminLoginModal
