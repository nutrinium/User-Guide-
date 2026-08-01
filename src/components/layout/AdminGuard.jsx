import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useRole } from '../../context/RoleContext'

function AdminGuard() {
  const { isAdmin } = useRole()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAdmin) {
      navigate('/viewer', { replace: true })
    }
  }, [isAdmin, navigate])

  if (!isAdmin) return null

  return <Outlet />
}

export default AdminGuard
