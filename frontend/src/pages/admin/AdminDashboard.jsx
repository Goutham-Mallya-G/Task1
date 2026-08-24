import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminAssignments, getAssignmentProgress } from '../../api/assignmentApi'

function AdminDashboard() {
  const [summary, setSummary] = useState({ assignments: 0, submitted: 0, pending: 0, completion: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('')
  const loadDashboard = useCallback(async () => {
     setLoading(true);
     setError('');
     try{
        const response = await getAdminAssignments();
        const assignments = response.data.assignments || [];
        const progress = await Promise.all(assignments.map(async (assignment) => { 
          try {
            const result = await getAssignmentProgress(assignment.id);
            return result.data 
          }catch{
            return null
          }
        }));
        const valid = progress.filter(Boolean);
        const totalStudents = valid.reduce((sum, item) => sum + (Number(item.totalStudents) || 0), 0);
        const submitted = valid.reduce((sum, item) => sum + (Number(item.submitted) || 0), 0);
      setSummary({
        assignments: assignments.length,
        submitted,
        pending: valid.reduce((sum, item) => sum + (Number(item.pending) || 0), 0),
        completion: totalStudents ? Math.round((submitted / totalStudents) * 100) : 0 
      }) 
     }catch{
      setError('We could not load the admin dashboard.')
     }finally{
      setLoading(false) 
     }
  }, [])
  useEffect(() => { const timer = setTimeout(loadDashboard, 0);
  return () => clearTimeout(timer) }, [loadDashboard])
  if (loading) {
    return <p>Loading dashboard...</p>
  }
  if (error){
   return (
   <div className="rounded bg-red-50 p-4 text-red-700">
      {error}
      <button className="ml-3 underline" onClick={loadDashboard} type="button">
        Retry
      </button>
   </div>)
  }
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Admin dashboard
          </h1>
          <p className="mt-1 text-slate-600">
            A summary of the assignments you manage.
          </p>
        </div>
        <Link className="rounded bg-blue-600 px-4 py-2 font-medium text-white" to="/admin/assignments/create">
          Create assignment
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {
          [
          ['Assignments', summary.assignments],
          ['Submitted', summary.submitted],
          ['Pending', summary.pending],
          ['Completion', `${summary.completion}%`]
        ].map(([label, value]) => (
          <div className="rounded-lg bg-white p-5 shadow-sm" key={label}>
            <p className="text-sm text-slate-500">
              {label}
            </p>
            <p className="mt-2 text-3xl font-bold">
              {value}
            </p>
            </div>
          ))
        }
      </div>
      <Link className="inline-block text-blue-600" to="/admin/assignments">
        View managed assignments
      </Link>
    </section>
  )
}

export default AdminDashboard
