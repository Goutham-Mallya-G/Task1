import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGroups } from '../../api/groupApi'
import { enrollCourse, enrollGroup } from '../../api/courseApi'
import { getCourses } from '../../api/courseApi'

function Courses(){
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState({ courseId: '', groupId: '' })
  const [submitting, setSubmitting] = useState(false)

  const loadCourses = useCallback(async () => {
    setLoading(true)
    setError('')
    try{
      const [response, groupsResponse] = await Promise.all([getCourses(), getGroups()])
      setCourses(response.data.courses || [])
      setGroups(groupsResponse.data.groups || [])
    }catch{
      setError('We could not load your courses.')
    }finally{
      setLoading(false)
    }
  }, [])

  const handleEnroll = async (courseId) => {
    setSubmitting(true)
    setError('')
    try{
      await enrollCourse(courseId)
      await loadCourses()
    }catch(requestError){
      setError(requestError.response?.data?.message || 'We could not enroll you in this course.')
    }finally{
      setSubmitting(false)
    }
  }

  const handleGroupEnroll = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try{
      await enrollGroup(selectedGroup.courseId, selectedGroup.groupId)
      setSelectedGroup({ courseId: '', groupId: '' })
      await loadCourses()
    }catch(requestError){
      setError(requestError.response?.data?.message || 'We could not enroll your group in this course.')
    }finally{
      setSubmitting(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadCourses, 0)
    return () => clearTimeout(timer)
  }, [loadCourses])

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your courses</h1>
        <p className="mt-1 text-slate-600">View the courses you are enrolled in.</p>
      </div>
      {loading && <p>Loading courses...</p>}
      {error && (
        <div className="rounded bg-red-50 p-4 text-red-700">
          {error}
          <button className="ml-3 underline" onClick={loadCourses} type="button">Retry</button>
        </div>
      )}
      {!loading && courses.length > 0 && (
        <form className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-5 shadow-sm" onSubmit={handleGroupEnroll}>
          <label className="text-sm font-medium">Enroll a course
            <select className="mt-1 block rounded border border-slate-300 p-2" required value={selectedGroup.courseId} onChange={(event) => setSelectedGroup({ ...selectedGroup, courseId: event.target.value })}>
              <option value="">Select a course</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Select group
            <select className="mt-1 block rounded border border-slate-300 p-2" required value={selectedGroup.groupId} onChange={(event) => setSelectedGroup({ ...selectedGroup, groupId: event.target.value })}>
              <option value="">Select your group</option>
              {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select>
          </label>
          <button className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60" disabled={submitting || !groups.length} type="submit">Enroll group</button>
        </form>
      )}
      {!loading && !error && courses.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="font-semibold">No courses yet</h2>
          <p className="mt-1 text-slate-600">You are not enrolled in any courses yet.</p>
        </div>
      )}
      {!loading && !error && courses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <article className="rounded-lg bg-white p-5 shadow-sm" key={course.id}>
              <h2 className="text-lg font-semibold">{course.name}</h2>
              <p className="mt-3 text-sm text-slate-500">
                Enrolled since {new Date(course.created_at).toLocaleDateString('en-IN')}
              </p>
              <div className="mt-4 flex flex-row gap-3">
                <Link className="inline-block rounded border border-blue-600 px-3 py-2 text-center text-sm font-medium text-blue-600 hover:bg-blue-50" to={`/student/assignments?courseId=${course.id}`}>
                  See assignments
                </Link>
                <button className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60" disabled={submitting || course.enrolled} onClick={() => handleEnroll(course.id)} type="button">
                  {course.enrolled ? 'Enrolled' : 'Enroll individually'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default Courses
