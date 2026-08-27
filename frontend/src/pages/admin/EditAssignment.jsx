import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getGroups } from '../../api/groupApi'
import { getCourses } from '../../api/courseApi'
import { getAdminAssignment, updateAssignment } from '../../api/assignmentApi'

function EditAssignment(){
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', onedriveUrl: '', targetType: 'ALL', courseId: '', groupIds: [] })
  const [groups, setGroups] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getAdminAssignment(id), getGroups(), getCourses()])
      .then(([assignmentResponse, groupsResponse, coursesResponse]) => {
        const assignment = assignmentResponse.data.assignment
        setForm({
          title: assignment.title || '',
          description: assignment.description || '',
          dueDate: new Date(assignment.due_date).toISOString().slice(0, 16),
          onedriveUrl: assignment.onedrive_url || '',
          targetType: assignment.target_type,
          courseId: assignment.course_id ? String(assignment.course_id) : '',
          groupIds: (assignment.group_ids || []).map(String)
        })
        setGroups(groupsResponse.data.groups || [])
        setCourses(coursesResponse.data.courses || [])
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'We could not load the assignment.'))
      .finally(() => setLoading(false))
  }, [id])

  const update = (field, value) => setForm({ ...form, [field]: value })
  const toggleGroup = (groupId) => {
    const value = String(groupId)
    update('groupIds', form.groupIds.includes(value) ? form.groupIds.filter((item) => item !== value) : [...form.groupIds, value])
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (!form.title.trim() || !form.dueDate || !form.onedriveUrl.trim()) {
      setError('Title, due date, and OneDrive URL are required.')
      return
    }
    if (form.targetType === 'GROUP' && !form.groupIds.length) {
      setError('Select at least one group.')
      return
    }
    if (form.targetType === 'COURSE' && !form.courseId) {
      setError('Select a course.')
      return
    }
    setSubmitting(true)
    try{
      await updateAssignment(id, {
        title: form.title.trim(),
        description: form.description || null,
        dueDate: new Date(form.dueDate).toISOString(),
        onedriveUrl: form.onedriveUrl.trim(),
        targetType: form.targetType,
        groupIds: form.targetType === 'GROUP' ? form.groupIds : [],
        courseId: form.targetType === 'COURSE' ? form.courseId : null
      })
      navigate('/admin/assignments')
    }catch(requestError){
      setError(requestError.response?.data?.message || 'We could not update the assignment.')
    }finally{
      setSubmitting(false)
    }
  }

  if (loading) return <p>Loading assignment...</p>
  if (error && !form.title) return <p className="rounded bg-red-50 p-4 text-red-700">{error}</p>

  return (
    <section className="mx-auto max-w-2xl">
      <Link className="text-sm text-blue-600" to="/admin/assignments">Back to assignments</Link>
      <form className="mt-4 space-y-5 rounded-lg bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-bold">Edit assignment</h1>
        {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
        <label className="block text-sm font-medium">Title<input className="mt-1 w-full rounded border border-slate-300 p-2" required value={form.title} onChange={(event) => update('title', event.target.value)} /></label>
        <label className="block text-sm font-medium">Description<textarea className="mt-1 w-full rounded border border-slate-300 p-2" rows="4" value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
        <label className="block text-sm font-medium">Due date and time<input className="mt-1 w-full rounded border border-slate-300 p-2" required type="datetime-local" value={form.dueDate} onChange={(event) => update('dueDate', event.target.value)} /></label>
        <label className="block text-sm font-medium">OneDrive URL<input className="mt-1 w-full rounded border border-slate-300 p-2" required type="url" value={form.onedriveUrl} onChange={(event) => update('onedriveUrl', event.target.value)} /></label>
        <fieldset><legend className="text-sm font-medium">Target students</legend><div className="mt-2 flex flex-wrap gap-4">
          {['ALL', 'GROUP', 'COURSE'].map((target) => <label key={target}><input checked={form.targetType === target} name="target" onChange={() => update('targetType', target)} type="radio" /><span className="ml-1">{target === 'ALL' ? 'All students' : target === 'GROUP' ? 'Specific groups' : 'Course'}</span></label>)}
        </div></fieldset>
        {form.targetType === 'COURSE' && <label className="block text-sm font-medium">Course<select className="mt-1 w-full rounded border border-slate-300 p-2" required value={form.courseId} onChange={(event) => update('courseId', event.target.value)}><option value="">Select a course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label>}
        {form.targetType === 'GROUP' && <div className="space-y-2"><p className="text-sm font-medium">Select groups</p>{groups.map((group) => <button className={`block w-full rounded border p-3 text-left ${form.groupIds.includes(String(group.id)) ? 'border-blue-500 bg-blue-50' : 'border-slate-300'}`} key={group.id} onClick={() => toggleGroup(group.id)} type="button">{form.groupIds.includes(String(group.id)) ? '[x]' : '[ ]'} {group.name}</button>)}</div>}
        <button className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60" disabled={submitting} type="submit">{submitting ? 'Saving...' : 'Save changes'}</button>
      </form>
    </section>
  )
}

export default EditAssignment
