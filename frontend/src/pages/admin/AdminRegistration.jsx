import { useState } from 'react'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { createAdmin } from '../../api/adminApi'

const adminSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters') 
})

function AdminRegistration() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false)
  const handleSubmit = async (event) => { 
     event.preventDefault();
     setError('');
     setSuccess('');
     const result = adminSchema.safeParse(form);
     if(!result.success){
       setErrors(result.error.flatten().fieldErrors);
       return
     }
     setErrors({});
     setSubmitting(true);
     try{
        const response = await createAdmin(result.data);
        setSuccess(response.data.message || 'Admin created successfully.');
        setForm({name: '', email: '', password: '' }) 
      }catch(requestError){
         setError(requestError.response?.data?.message || 'We could not create the admin.') 
      }finally{
        setSubmitting(false) 
      }
  }
  return (
    <section className="mx-auto max-w-xl">
      <Link className="text-sm text-blue-600" to="/admin/dashboard">
        Back to dashboard
      </Link>
      <form className="mt-4 space-y-5 rounded-lg bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-bold">
          Add an admin
        </h1>
        {
          error && 
          <p className="rounded bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
          </p>
        }{
          success &&
            <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-700" role="status">
              {success}
            </p>
        }
        <label className="block text-sm font-medium">
            Name
            <input className="mt-1 w-full rounded border border-slate-300 p-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            {
              errors.name && 
                <span className="text-sm text-red-600">
                  {errors.name[0]}
                </span>
            }
        </label>
        <label className="block text-sm font-medium">
          Email
          <input className="mt-1 w-full rounded border border-slate-300 p-2" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          {
            errors.email && 
            <span className="text-sm text-red-600">
              {errors.email[0]}
            </span>
          }
        </label>
        <label className="block text-sm font-medium">
          Password
          <input className="mt-1 w-full rounded border border-slate-300 p-2" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            {
              errors.password && 
              <span className="text-sm text-red-600">
                {errors.password[0]}
              </span>
            }
        </label>
        <button className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60" disabled={submitting} type="submit">
          {submitting ? 'Creating...' : 'Create admin'}
        </button>
      </form>
    </section>
  )
}

export default AdminRegistration
