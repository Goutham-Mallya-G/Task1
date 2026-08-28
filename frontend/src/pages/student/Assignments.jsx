import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getAssignments, getAssignmentStatus } from '../../api/assignmentApi'
import AssignmentStatusBadge from '../../components/student/AssignmentStatusBadge'

const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function Assignments() {
  const [assignments, setAssignments] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
    const [searchParams] = useSearchParams()
    const courseId = searchParams.get('courseId')

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setError('');
    try{
        const response = await getAssignments();
        const items = response.data.assignments || [];
        const withStatuses = await Promise.all(items.map(async (assignment)=>{
            try{
                const statusResponse = await getAssignmentStatus(assignment.id);
                return { ...assignment, status: statusResponse.data.status,
                                        canSubmit: statusResponse.data.canSubmit,
                                        shared: statusResponse.data.shared }
            }catch{
                return { ...assignment, status: 'UNKNOWN' }
            } 
        }));
        setAssignments(withStatuses) 
    }catch{
        setError('We could not load your assignments.') 
    }finally{
        setLoading(false)
    }
  }, [])
  useEffect(()=>{
    const timer = setTimeout(loadAssignments, 0);
    return ()=>clearTimeout(timer) 
  },[loadAssignments]);

    const visibleAssignments = assignments.filter((assignment) => (!courseId || String(assignment.course_id) === courseId) && (filter === 'ALL' || assignment.status === filter) && assignment.title.toLowerCase().includes(search.toLowerCase()))

  return (
  <section className="space-y-6">
    <div>
        <h1 className="text-2xl font-bold">
            {courseId ? 'Course assignments' : 'Assignments'}
        </h1>
        <p className="mt-1 text-slate-600">
            Track your deadlines and submissions.
        </p>
    </div>
        <div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm sm:flex-row">
            <input aria-label="Search assignments" className="rounded border border-slate-300 p-2 sm:flex-1" placeholder="Search by title" value={search} onChange={(event) => setSearch(event.target.value)} />
            <div className="flex flex-wrap gap-2">{
                ['ALL', 'PENDING', 'SUBMITTED', 'OVERDUE'].map((option) => 
                <button className={`rounded px-3 py-2 text-sm ${
                    filter === option ?
                    'bg-blue-600 text-white' : 
                    'bg-slate-100 text-slate-700'}`} 
                    key={option} onClick={() => setFilter(option)} 
                    type="button">{option === 'ALL' ? 'All' : option}
                </button>)}
            </div>
        </div>
        {loading && <p>Loading assignments...</p>}
        {error && 
            <div className="rounded bg-red-50 p-4 text-red-700">
                {error}
                <button className="ml-3 underline" onClick={loadAssignments} type="button">
                    Retry
                </button>
            </div>
        }{
            !loading && !error && visibleAssignments.length === 0 && 
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="text-slate-600">No assignments match this filter.</p>
            </div>
        }{
            !loading && !error && visibleAssignments.length > 0 && 
            <div className="grid gap-4 lg:grid-cols-2">
                {visibleAssignments.map((assignment) => (
                    <article className="rounded-lg bg-white p-5 shadow-sm" key={assignment.id}>
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-lg font-semibold">
                                {assignment.title}
                            </h2>
                            <AssignmentStatusBadge status={assignment.status} />
                        </div>
                        {assignment.description && 
                            <p className="mt-2 text-slate-600">
                                {assignment.description}
                            </p>
                        }
                        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                            <span>
                                <span className="font-medium text-slate-500">
                                    Type : 
                                </span> 
                                {assignment.target_type}
                            </span>
                            <span>
                                <span className="font-medium text-slate-500">
                                    From : 
                                </span> 
                                {assignment.course_name || assignment.group_names || assignment.title}
                            </span>
                        </div>
                        <p className="mt-4 text-sm text-slate-500">
                            Due {formatDate(assignment.due_date)}
                        </p>
                        <Link className="mt-4 inline-block text-sm font-medium text-blue-600" to={`/student/assignments/${assignment.id}`} state={{ assignment }}>
                            View assignment
                        </Link>
                    </article>))}
            </div>
        }
  </section>
  )
}

export default Assignments
