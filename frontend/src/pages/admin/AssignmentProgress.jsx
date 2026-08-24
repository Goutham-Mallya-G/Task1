import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAssignmentProgress } from '../../api/assignmentApi'

function AssignmentProgress() {
  const {id} = useParams();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('')
  const loadProgress = useCallback(async () => { 
      setLoading(true);
      setError('');
      try{
        const response = await getAssignmentProgress(id);
        setProgress(response.data) 
      }catch{
        setError('We could not load assignment progress.')
      }finally{
        setLoading(false)
      }},[id]
  )
  useEffect(() => {
    const timer = setTimeout(loadProgress, 0);
    return () => clearTimeout(timer) 
  },[loadProgress])
  if (loading) return (
    <p>Loading progress...</p>
  )
  if (error) return (
    <div className="rounded bg-red-50 p-4 text-red-700">
      {error}
      <button className="ml-3 underline" onClick={loadProgress} type="button">
        Retry
      </button>
    </div>
  )
  const percentage = Number(progress.progress) || 0
  return (
  <section className="mx-auto max-w-3xl space-y-6">
    <Link className="text-sm text-blue-600" to="/admin/assignments">
      Back to assignments
    </Link>
    <div>
      <h1 className="text-2xl font-bold">
        Assignment progress
      </h1>
      <p className="mt-1 text-slate-600">
        Aggregate progress.
      </p>
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">
          Total students
        </p>
        <p className="mt-2 text-3xl font-bold">
          {progress.totalStudents}
        </p>
      </div>
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">
          Submitted
        </p>
        <p className="mt-2 text-3xl font-bold">
          {progress.submitted}
        </p>
      </div>
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">
          Pending
        </p>
        <p className="mt-2 text-3xl font-bold">
          {progress.pending}
        </p>
      </div>
    </div>
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex justify-between font-semibold">
        <span>
          Completion
        </span>
        <span>
          {percentage}%
        </span>
      </div>
      <div className="mt-3 h-4 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} />
      </div>
    </div>
  </section>
  )
}

export default AssignmentProgress
