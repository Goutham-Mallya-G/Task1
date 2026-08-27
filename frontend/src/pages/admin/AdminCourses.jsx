import { useCallback, useEffect, useState } from 'react'
import { createCourse, getCourses } from '../../api/courseApi'

function AdminCourses(){
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [courseForm, setCourseForm] = useState({ name: '' })
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try{
      const coursesResponse = await getCourses()
      setCourses(coursesResponse.data.courses || [])
    }catch(requestError){
      setError(requestError.response?.status === 403 ? 'You are not authorized to manage courses.' : 'We could not load courses.')
    }finally{
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(loadData, 0)
    return () => clearTimeout(timer)
  }, [loadData])

  const handleCreateCourse = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    setSubmitting(true)
    try{
      await createCourse(courseForm)
      setCourseForm({ name: '' })
      setMessage('Course created successfully.')
      await loadData()
    }catch(requestError){
      setError(requestError.response?.data?.message || 'We could not create the course.')
    }finally{
      setSubmitting(false)
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Courses</h1>
        <p className="mt-1 text-slate-600">Create courses. Students manage their own enrollment.</p>
      </div>
      {message && <p className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700" role="status">{message}</p>}
      {
        error && 
        <div className="rounded bg-red-50 p-4 text-red-700">
            {error}
            <button className="ml-3 underline" onClick={loadData} type="button">
                Retry
            </button>
        </div>
      }

      <div className="grid gap-6 lg:grid-cols-3">
        <form className="space-y-4 rounded-lg bg-white p-5 shadow-sm" onSubmit={handleCreateCourse}>
          <h2 className="text-lg font-semibold">Create course</h2>
          <label className="block text-sm font-medium">
            Course name
            <input className="mt-1 w-full rounded border border-slate-300 p-2" required value={courseForm.name} onChange={(event) => 
                setCourseForm({ ...courseForm, name: event.target.value })} />
          </label>
            <button className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60" disabled={submitting} type="submit">Create course</button>
        </form>
      </div>

      {loading && <p>Loading courses...</p>}
      {!loading && !error && courses.length === 0 && 
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <h2 className="font-semibold">
                No courses yet
            </h2>
            <p className="mt-1 text-slate-600">
                Create a course to begin enrollment.
            </p>
        </div>}
      {!loading && !error && courses.length > 0 && 
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => 
                <article className="rounded-lg bg-white p-5 shadow-sm" key={course.id}>
                    <h2 className="text-lg font-semibold">
                        {course.name}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Course ID: {course.id}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                        Created {new Date(course.created_at).toLocaleDateString('en-IN')}
                    </p>
                </article>)}
        </div>}
    </section>
  )
}

export default AdminCourses
