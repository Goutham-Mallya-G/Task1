import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function ProtectedRoute(){
  const { user, loading } = useAuth()

  if(loading){
    return (
        <p className="p-6">
            Loading...
        </p>
    )
  }
  if(!user){
    return (
        <Navigate to="/login" replace />
    )
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute