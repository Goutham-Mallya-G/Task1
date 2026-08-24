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
    return <p className="p-6">Loading...</p>
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
      setError(requestError.response?.data?.message || 'Unable to register')
    }finally{
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 rounded-lg bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-2 text-slate-600">Join your classmates in the assignment portal.</p>
        </div>
        {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
        <label className="block text-sm font-medium text-slate-700">Name<input className="mt-1 w-full rounded border border-slate-300 p-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />{fieldErrors.name && <span className="text-sm text-red-600">{fieldErrors.name[0]}</span>}</label>
        <label className="block text-sm font-medium text-slate-700">Email<input className="mt-1 w-full rounded border border-slate-300 p-2" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />{fieldErrors.email && <span className="text-sm text-red-600">{fieldErrors.email[0]}</span>}</label>
        <label className="block text-sm font-medium text-slate-700">Password<input className="mt-1 w-full rounded border border-slate-300 p-2" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />{fieldErrors.password && <span className="text-sm text-red-600">{fieldErrors.password[0]}</span>}</label>
        <button className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60" disabled={submitting} type="submit">{submitting ? 'Creating account...' : 'Register'}</button>
        <p className="text-center text-sm text-slate-600">Already registered? <Link className="text-blue-600" to="/login">Log in</Link></p>
      </form>
    </main>
  )
}

export default Register
