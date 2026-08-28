import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCourse } from '../../api/courseApi'

function AdminCourseDetails() {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [students, setStudents] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCourse = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getCourse(id)
      setCourse(response.data.course)
      setStudents(response.data.students || [])
      setAssignments(response.data.assignments || [])
    } catch {
      setError('We could not load this course.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const timer = setTimeout(loadCourse, 0)
    return () => clearTimeout(timer)
  }, [loadCourse])

  if (loading) return <p>Loading course details...</p>
  if (error) return <div className="rounded bg-red-50 p-4 text-red-700">{error}<button className="ml-3 underline" onClick={loadCourse} type="button">Retry</button></div>

  const assignmentCount = assignments.length
  const submissionCount = assignments.reduce((total, assignment) => total + assignment.submitted_count, 0)
  const expectedSubmissions = assignments.reduce((total, assignment) => total + assignment.student_count, 0)
  const pendingCount = Math.max(expectedSubmissions - submissionCount, 0)
  const completion = expectedSubmissions ? Math.round((submissionCount / expectedSubmissions) * 100) : 0

  return (
    <section className="space-y-6">
      <Link className="text-sm text-blue-600" to="/admin/courses">Back to courses</Link>
      <div>
        <h1 className="text-2xl font-bold">{course.name}</h1>
        <p className="mt-1 text-slate-600">Enrollment and assignment performance.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Students', students.length],
          ['Assignments', assignmentCount],
          ['Submitted', submissionCount],
          ['Pending', pendingCount]
        ].map(([label, value]) => 
        <div className="rounded-lg bg-white p-5 shadow-sm" key={label}>
            <p className="text-sm text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-3xl font-bold">
                {value}
            </p>
        </div>)}
      </div>
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <div className="flex justify-between font-semibold">
            <span>
                Overall completion
            </span>
            <span>
                {completion}%
            </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full bg-blue-600" style={{ width: `${completion}%` }} /></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">
            Enrolled students
          </h2>
          {students.length ? 
            <ul className="mt-4 divide-y divide-slate-200">
                {students.map((student) => 
                    <li className="flex items-center justify-between gap-3 py-3" key={student.id}>
                        <div>
                            <p className="font-medium">
                                {student.name}
                            </p>
                            <p className="text-sm text-slate-500">
                                {student.email}
                            </p>
                        </div>
                        <span className="text-right text-sm text-slate-600">
                            {student.submitted_count} submitted<br />{student.pending_count} pending
                        </span>
                    </li>)}
            </ul> : 
            <p className="mt-4 text-slate-600">
                No students are enrolled in this course.</p>
          }
        </div>
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">
            Assignment statuses
          </h2>
          {assignments.length ? 
            <ul className="mt-4 divide-y divide-slate-200">
                {assignments.map((assignment) => 
                    <li className="py-3" key={assignment.id}>
                        <p className="font-medium">
                            {assignment.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                            <span className="text-emerald-600">
                                {assignment.submitted_count} submitted
                            </span> · 
                            <span className="text-amber-600">
                                {assignment.pending_count} pending
                            </span>
                        </p>
                    </li>)}
            </ul> : 
            <p className="mt-4 text-slate-600">
                No assignments are assigned to this course.
            </p>
          }
        </div>
      </div>
    </section>
  )
}

export default AdminCourseDetails