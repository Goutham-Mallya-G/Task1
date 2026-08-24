import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAssignments, getAssignmentStatus } from '../../api/assignmentApi'
import { getGroups } from '../../api/groupApi'

function StudentDashboard() {
  const [stats, setStats] = useState({ groups: 0, assignments: 0, pending: 0, submitted: 0, overdue: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true); 
    setError('')
    try{
      const [groupsResponse, assignmentsResponse] = await Promise.all([getGroups(), getAssignments()])
      const assignments = assignmentsResponse.data.assignments || []
      const statuses = await Promise.all(assignments.map(async (assignment) => { try { const response = await getAssignmentStatus(assignment.id); return response.data.status } catch { return null } }))
      setStats(
        { groups: (groupsResponse.data.groups || []).length,
          assignments: assignments.length,
          pending: statuses.filter((status) => status === 'PENDING').length,
          submitted: statuses.filter((status) => status === 'SUBMITTED').length,
          overdue: statuses.filter((status) => status === 'OVERDUE').length 
        }
      )
    }catch{
      setError('We could not load your dashboard.') 
    }finally{
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    const timer = setTimeout(loadDashboard, 0);
    return () => clearTimeout(timer) 
  },[loadDashboard]);

  return (
  <section className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold">
        Student dashboard
      </h1>
        <p className="mt-1 text-slate-600">
          Here is your current Joineazy overview.
        </p>
    </div>
    {
      loading && 
        <p>
          Loading your overview...
        </p>
    }{
      error && 
      <div className="rounded bg-red-50 p-4 text-red-700">
        {error}
        <button className="ml-3 underline" onClick={loadDashboard} type="button">
          Retry
        </button>
      </div>
    }{
      !loading && !error && 
      <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{
        [['Groups',stats.groups,'/student/groups'],
            ['Assignments',stats.assignments,'/student/assignments'],
            ['Pending', stats.pending,'/student/assignments'],
            ['Submitted', stats.submitted,'/student/assignments'],
            ['Overdue', stats.overdue, '/student/assignments']
          ].map(([label, value, to]) => (
            <Link className="rounded-lg bg-white p-5 shadow-sm hover:ring-2 hover:ring-blue-200" key={label} to={to}>
              <p className="text-sm text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-3xl font-bold">
                {value}
              </p>
            </Link>))
        }
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="rounded bg-blue-600 px-4 py-2 font-medium text-white" to="/student/groups">
            View groups
          </Link>
          <Link className="rounded border border-slate-300 bg-white px-4 py-2 font-medium" to="/student/assignments">
            View assignments
          </Link>
        </div>
      </>
    }
  </section>
  )
}

export default StudentDashboard