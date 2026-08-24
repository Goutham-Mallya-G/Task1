import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAssignmentSubmissions } from '../../api/assignmentApi'

function Submissions() {
  const { id } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('')
  const loadSubmissions = useCallback(async () => { 
    setLoading(true);
    setError('');
    try{
      const response = await getAssignmentSubmissions(id);
      setSubmissions(response.data.submissions || []) 
    }catch{
      setError('We could not load submissions.')
    }finally{
      setLoading(false)
    }}, [id]);
  useEffect(() => {
    const timer = setTimeout(loadSubmissions, 0); 
    return () => clearTimeout(timer) },
    [loadSubmissions]);
  if (loading) return <p>Loading submissions...</p>
  if (error) return (
    <div className="rounded bg-red-50 p-4 text-red-700">
      {error}
      <button className="ml-3 underline" onClick={loadSubmissions} type="button">
        Retry
      </button>
    </div>);
  return (<section className="space-y-6">
    <Link className="text-sm text-blue-600" to="/admin/assignments">
      Back to assignments
    </Link>
    <div>
      <h1 className="text-2xl font-bold">
        Submissions
      </h1>
      <p className="mt-1 text-slate-600">
        Confirmed submissions.
      </p>
    </div>
    {
      submissions.length === 0 ? 
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-slate-600">
          No submissions have been confirmed.
        </p>
      </div> : 
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3">
                Student
              </th>
              <th className="px-5 py-3">
                Email
              </th>
              <th className="px-5 py-3">
                Confirmed
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {submissions.map((submission) => 
              <tr key={submission.id}>
                <td className="px-5 py-4 font-medium">
                  {submission.name}
                </td>
                <td className="px-5 py-4">
                  {submission.email}
                </td>
                <td className="px-5 py-4">
                  {new Date(submission.confirmed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
              </tr>)
            }
          </tbody>
        </table>
      </div>
    }
  </section>
  )
}

export default Submissions
