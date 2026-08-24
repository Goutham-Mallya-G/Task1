import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

function Login(){
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if(loading){
    return <p className="p-6">Loading...</p>
  }
  if(user){
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard'} replace />
  }
  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const result = loginSchema.safeParse(form)

    if(!result.success){
      setFieldErrors(result.error.flatten().fieldErrors)
      return
    }

    setFieldErrors({})
    setSubmitting(true)
    try{
      const authenticatedUser = await login(form.email, form.password)
      navigate(authenticatedUser.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard')
    }catch (requestError){
      setError(requestError.response?.data?.message || 'Unable to log in')
    }finally{
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 rounded-lg bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Log in to Joineazy</h1>
          <p className="mt-2 text-slate-600">Manage your groups and assignments.</p>
        </div>
        {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input className="mt-1 w-full rounded border border-slate-300 p-2" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          {fieldErrors.email && <span className="text-sm text-red-600">{fieldErrors.email[0]}</span>}
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input className="mt-1 w-full rounded border border-slate-300 p-2" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          {fieldErrors.password && <span className="text-sm text-red-600">{fieldErrors.password[0]}</span>}
        </label>
        <button className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60" disabled={submitting} type="submit">
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
        <p className="text-center text-sm text-slate-600">No account? <Link className="text-blue-600" to="/register">Register</Link></p>
      </form>
    </main>
  )
}

export default Login