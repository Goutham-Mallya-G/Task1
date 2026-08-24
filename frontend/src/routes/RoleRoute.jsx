import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function RoleRoute({ role }) {
  const{ user, loading } = useAuth()
  const allowedRoles = Array.isArray(role) ? role : [role]

  if(loading){
    return <p className="p-6">Loading...</p>
  }

  if(!user){
    return <Navigate to="/login" replace />
  }

  return allowedRoles.includes(user.role)
    ? <Outlet />
    : <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard'} replace />
}

export default RoleRoute