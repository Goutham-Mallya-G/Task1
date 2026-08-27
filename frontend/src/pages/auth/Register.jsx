import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { register as registerUser } from '../../api/authApi'
import { useAuth } from '../../hooks/useAuth'

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

function Register(){
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if(loading){
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="flex items-center gap-3 rounded-lg bg-white px-5 py-4 text-slate-700 shadow-sm ring-1 ring-slate-200">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" aria-label="Loading" />
          <span className="text-sm font-medium">Loading your session...</span>
        </div>
      </main>
    )
  }

  if(user){
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard'} replace />
  }

  const handleSubmit = async (event)=>{
    event.preventDefault()
    setError('')
    const result = registerSchema.safeParse(form)
    if(!result.success){
      setFieldErrors(result.error.flatten().fieldErrors)
      return
    }

    setFieldErrors({})
    setSubmitting(true)
    try{
      await registerUser(form)
      navigate('/login', {state:{registered : true }})
    }catch (requestError){
      setError(requestError.response?.data?.message || 'Unable to create your account. Please try again.')
    }finally{
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-2 text-slate-600">Join your classmates in the assignment portal.</p>
        </div>

        {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}

        <label className="block text-sm font-medium text-slate-700">
          Name
          <input
            className="mt-1 w-full rounded border border-slate-300 p-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            aria-invalid={Boolean(fieldErrors.name)}
          />
          {fieldErrors.name && <span className="mt-1 block text-sm text-red-600">{fieldErrors.name[0]}</span>}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            className="mt-1 w-full rounded border border-slate-300 p-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            aria-invalid={Boolean(fieldErrors.email)}
          />
          {fieldErrors.email && <span className="mt-1 block text-sm text-red-600">{fieldErrors.email[0]}</span>}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            className="mt-1 w-full rounded border border-slate-300 p-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            aria-invalid={Boolean(fieldErrors.password)}
          />
          {fieldErrors.password && <span className="mt-1 block text-sm text-red-600">{fieldErrors.password[0]}</span>}
        </label>

        <button
          className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={submitting}
          type="submit"
        >
          {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" aria-label="Creating account" />}
          {submitting ? 'Creating account...' : 'Register'}
        </button>

        <p className="text-center text-sm text-slate-600">Already registered? <Link className="font-medium text-blue-600 hover:text-blue-700" to="/login">Log in</Link></p>
      </form>
    </main>
  )
}

export default Register
