import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { createAssignment } from '../../api/assignmentApi'
import { getGroups } from '../../api/groupApi'

const assignmentSchema = z.object({ 
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  onedriveUrl: z.string().url('Enter a valid OneDrive URL'),
  targetType: z.enum(['ALL', 'GROUP']),
  selectedGroupIds: z.array(z.union([z.string(), z.number()])).optional() }).superRefine((value, context) => {
    const dueDate = new Date(value.dueDate)
    if(value.dueDate && (Number.isNaN(dueDate.getTime()) || dueDate.getTime() < Date.now() + 60 * 60 * 1000)){
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dueDate'],
        message: 'Due date must be at least 1 hour from now.'
      })
    }

    if(value.targetType === 'GROUP' && !value.selectedGroupIds?.length){
      context.addIssue({
       code: z.ZodIssueCode.custom,
      path: ['selectedGroupIds'],
      message: 'Select at least one group.' 
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
    selectedGroupIds: []
  });
  const [groups, setGroups] = useState([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [groupsError, setGroupsError] = useState('')
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false)
    const [minimumDueDateValue] = useState(() => {
      const minimumDueDate = new Date(Date.now() + 60 * 60 * 1000)
      return new Date(minimumDueDate.getTime() - minimumDueDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    })
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
      const groupIds = form.targetType === 'GROUP' ? form.selectedGroupIds : [];
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
  useEffect(() => {
    if(form.targetType !== 'GROUP'){
      return
    }

    const loadGroups = async () => {
      setGroupsLoading(true)
      setGroupsError('')
      try{
        const response = await getGroups()
        setGroups(response.data.groups || [])
      }catch(requestError){
        setGroupsError(requestError.response?.status === 403 ? 'We currently allow only students to view groups. An admin group endpoint is required for group selection.' : 'We could not load groups.')
      }finally{
        setGroupsLoading(false)
      }
    }

    loadGroups()
  }, [form.targetType])

  const toggleGroup = (groupId) => {
    const selected = form.selectedGroupIds.includes(groupId)
    setForm({ ...form, selectedGroupIds: selected ? form.selectedGroupIds.filter((id) => id !== groupId) : [...form.selectedGroupIds, groupId] })
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
        <input className="mt-1 w-full rounded border border-slate-300 p-2" min={minimumDueDateValue} type="datetime-local" value={form.dueDate} onChange={(event) => update('dueDate', event.target.value)} />
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
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-medium">
              Select groups
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Choose groups by name. Their IDs are sent automatically.
            </p>
          </div>
          {
            groupsLoading && 
            <p className="text-sm text-slate-600">
              Loading groups...
            </p>
          }{
              groupsError && 
              <p className="rounded bg-red-50 p-3 text-sm text-red-700" role="alert">
                {groupsError}
              </p>
          }{
              !groupsLoading && !groupsError && groups.length === 0 && 
              <p className="rounded border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                No groups have been created yet.
              </p>
          }{
              groups.map((group) => 
              <button className={
              `block w-full rounded border p-4 text-left ${form.selectedGroupIds.includes(group.id) ? 
              'border-blue-500 bg-blue-50' : 
              'border-slate-300 bg-white'}`} 
              key={group.id} onClick={() => toggleGroup(group.id)}
              type="button">
                <span className="font-medium">
                  {form.selectedGroupIds.includes(group.id) ? '[x]' : '[ ]'}
                  {group.name}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  ID: {group.id}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Members: {group.members?.length || 0}
                </span>
                {group.members?.length > 0 && <span className="mt-2 block text-xs text-slate-600">{group.members.map((member) => member.name).join(', ')}</span>}
              </button>)
          }
          {
            errors.selectedGroupIds && 
            <span className="text-sm text-red-600">
              {errors.selectedGroupIds[0]}
            </span>
          }
        </div>
      }{
        form.targetType === 'GROUP' && form.selectedGroupIds.length > 0 && 
        <div className="rounded bg-slate-50 p-4 text-sm">
          <p className="font-semibold">
            Assignment target
          </p>
          <p className="mt-1">
            Specific groups
          </p>
          <ul className="mt-2 list-disc pl-5">
            {groups.filter((group) => 
              form.selectedGroupIds.includes(group.id)).map((group) => 
              <li key={group.id}>{group.name} (ID: {group.id}) - {group.members?.length || 0} members</li>
            )}
          </ul>
          <p className="mt-2 text-slate-600">
            Total groups: {form.selectedGroupIds.length}
          </p>
        </div>
      }
      <button className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60" disabled={submitting} type="submit">
        {submitting ? 'Creating...' : 'Create assignment'}
      </button>
    </form>
  </section>
  )
}

export default CreateAssignment
