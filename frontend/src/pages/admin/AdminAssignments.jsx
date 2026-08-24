import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminAssignments } from '../../api/assignmentApi'

const formatDate = (date) => new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

function AdminAssignments() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const loadAssignments = useCallback(async () => { 
        setLoading(true);
        setError('');
        try{ const response = await getAdminAssignments();
            setAssignments(response.data.assignments || []) 
        }catch{
            setError('We could not load your assignments.') 
        }finally{
            setLoading(false) 
        } 
    }, [])
  useEffect(() => { 
    const timer = setTimeout(loadAssignments, 0);
    return () => clearTimeout(timer) },
    [loadAssignments]);
  return (<section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">
                        Managed assignments
                    </h1>
                    <p className="mt-1 text-slate-600">
                        Review assignments and submission progress.
                    </p>
                </div>
                <Link className="rounded bg-blue-600 px-4 py-2 font-medium text-white" to="/admin/assignments/create">
                    Create assignment
                </Link>
            </div>
            {
                loading && 
                    <p>
                        Loading assignments...
                    </p>
            }{
                error &&
                 <div className="rounded bg-red-50 p-4 text-red-700">
                    {error}
                    <button className="ml-3 underline" onClick={loadAssignments} type="button">
                        Retry
                    </button>
                </div>
            }{
                !loading && !error && assignments.length === 0 &&
                 <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                    <p className="text-slate-600">
                        You have not created any assignments yet.
                    </p>
                </div>
            }{
                !loading && !error && assignments.length > 0 && 
                <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                    <div className="divide-y divide-slate-200 md:hidden">
                        {assignments.map((assignment) =>  
                            <article className="space-y-2 p-4" key={assignment.id}>
                                <h2 className="font-semibold">
                                    {assignment.title}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Due {formatDate(assignment.due_date)}
                                </p>
                                <p className="text-sm text-slate-600">
                                    Target: {assignment.target_type}
                                </p>
                                <div className="flex gap-4 text-sm">
                                    <Link className="text-blue-600" to={`/admin/assignments/${assignment.id}/progress`}>
                                        Progress
                                    </Link>
                                    <Link className="text-blue-600" to={`/admin/assignments/${assignment.id}/submissions`}>
                                        Submissions
                                    </Link>
                                </div>
                            </article>)}
                    </div>
                    <table className="hidden w-full text-left text-sm md:table">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-5 py-3">
                                    Title
                                </th>
                                <th className="px-5 py-3">
                                    Due
                                </th>
                                <th className="px-5 py-3">
                                    Target
                                </th>
                                <th className="px-5 py-3">
                                    Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {assignments.map((assignment) => 
                                <tr key={assignment.id}>
                                    <td className="px-5 py-4 font-medium">
                                        {assignment.title}
                                    </td>
                                    <td className="px-5 py-4">
                                        {formatDate(assignment.due_date)}
                                    </td>
                                    <td className="px-5 py-4">
                                        {assignment.target_type}
                                    </td>
                                    <td className="px-5 py-4">
                                        <Link className="mr-4 text-blue-600" to={`/admin/assignments/${assignment.id}/progress`}>
                                            Progress
                                        </Link>
                                        <Link className="text-blue-600" to={`/admin/assignments/${assignment.id}/submissions`}>
                                            Submissions
                                        </Link>
                                    </td>
                                </tr>)}
                        </tbody>
                    </table>
                </div>
            }
        </section>)
}

export default AdminAssignments
