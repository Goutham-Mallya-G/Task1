import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function RoleRoute({ role }) {
  const { user } = useAuth()

  return user?.role === role
    ? <Outlet />
    : <Navigate to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard'} replace />
}

export default RoleRoute