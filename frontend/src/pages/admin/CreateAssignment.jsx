import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { createAssignment } from '../../api/assignmentApi'

const assignmentSchema = z.object({ 
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  onedriveUrl: z.string().url('Enter a valid OneDrive URL'),
  targetType: z.enum(['ALL', 'GROUP']),
  groupIds: z.string().optional() }).superRefine((value, context) => { 
    if(value.targetType === 'GROUP' && !value.groupIds?.trim()){
      context.addIssue({
       code: z.ZodIssueCode.custom,
       path: ['groupIds'],
       message: 'Enter at least one group ID' 
      })
  }})

function CreateAssignment() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    onedriveUrl: '',
    targetType: 'ALL',
    groupIds: '' 
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false)
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const result = assignmentSchema.safeParse(form);
    if(!result.success){
      setErrors(result.error.flatten().fieldErrors);
      return 
    }
    setErrors({});
    setSubmitting(true);
    try{
      const groupIds = form.targetType === 'GROUP' ? form.groupIds.split(',').map((id) => id.trim()).filter(Boolean) : [];
      await createAssignment({ 
        title: form.title.trim(),
        description: form.description || null,
        dueDate: new Date(form.dueDate).toISOString(),
        onedriveUrl: form.onedriveUrl.trim(),
        targetType: form.targetType, groupIds 
      });
    navigate('/admin/assignments') 
    }catch(requestError){
      setError(requestError.response?.data?.message || 'We could not create the assignment.')
    }finally{setSubmitting(false)

    } 
  }
  const update = (field, value) => setForm({ ...form, [field]: value })
  return (
  <section className="mx-auto max-w-2xl">
    <Link className="text-sm text-blue-600" to="/admin/assignments">
      Back to assignments
    </Link>
    <form className="mt-4 space-y-5 rounded-lg bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
      <h1 className="text-2xl font-bold">
        Create assignment
      </h1>
      {
        error && 
        <p className="rounded bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      }
      <label className="block text-sm font-medium">
        Title
        <input className="mt-1 w-full rounded border border-slate-300 p-2" value={form.title} onChange={(event) => update('title', event.target.value)} />
        {
          errors.title &&
          <span className="text-sm text-red-600">
            {errors.title[0]}
          </span>
        }
      </label>
      <label className="block text-sm font-medium">
        Description
        <textarea className="mt-1 w-full rounded border border-slate-300 p-2" rows="4" value={form.description} onChange={(event) => update('description', event.target.value)} />
      </label>
      <label className="block text-sm font-medium">
        Due date and time
        <input className="mt-1 w-full rounded border border-slate-300 p-2" type="datetime-local" value={form.dueDate} onChange={(event) => update('dueDate', event.target.value)} />
        {
          errors.dueDate && 
          <span className="text-sm text-red-600">
            {errors.dueDate[0]}
          </span>
        }
      </label>
      <label className="block text-sm font-medium">
        OneDrive URL
        <input className="mt-1 w-full rounded border border-slate-300 p-2" type="url" value={form.onedriveUrl} onChange={(event) => update('onedriveUrl', event.target.value)} />
        {
          errors.onedriveUrl && 
          <span className="text-sm text-red-600">
            {errors.onedriveUrl[0]}
          </span>
        }
      </label>
      <fieldset>
        <legend className="text-sm font-medium">
          Target students
        </legend>
        <div className="mt-2 flex gap-4">
          <label>
            <input checked={form.targetType === 'ALL'} name="target" onChange={() => update('targetType', 'ALL')} type="radio" />
            <span className="ml-1">
              All students
            </span>
          </label>
          <label>
            <input checked={form.targetType === 'GROUP'} name="target" onChange={() => update('targetType', 'GROUP')} type="radio" />
            <span className="ml-1">
              Specific groups
            </span>
          </label>
        </div>
      </fieldset>
      {
        form.targetType === 'GROUP' &&
        <label className="block text-sm font-medium">
          Group IDs
          <span className="mt-1 block text-xs font-normal text-slate-500">
            Enter group IDs separated by commas. The backend does not expose groups to admins.
          </span>
          <input className="mt-1 w-full rounded border border-slate-300 p-2" value={form.groupIds} onChange={(event) => update('groupIds', event.target.value)} />
          {
            errors.groupIds && 
            <span className="text-sm text-red-600">
              {errors.groupIds[0]}
            </span>
          }
        </label>
      }
      <button className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60" disabled={submitting} type="submit">
        {submitting ? 'Creating...' : 'Create assignment'}
      </button>
    </form>
  </section>
  )
}

export default CreateAssignment
