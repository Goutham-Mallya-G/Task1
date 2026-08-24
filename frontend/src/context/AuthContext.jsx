import { useEffect, useState } from 'react'
import { getMe, login as loginApi } from '../api/authApi'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const login = async (email, password) => {
    const response = await loginApi({ email, password })
    const token = response.data.token

    localStorage.setItem('token', token)

    try {
      const meResponse = await getMe()
      const authenticatedUser = meResponse.data.user
      setUser(authenticatedUser)
      return authenticatedUser
    }catch (error){
      localStorage.removeItem('token')
      setUser(null)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token')

      if(!token){
        setLoading(false)
        return
      }

      try {
        const response = await getMe()
        setUser(response.data.user)
      } catch {
        localStorage.removeItem('token')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}