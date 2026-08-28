import {useCallback, useEffect, useState} from 'react'
import {Link, useLocation, useParams} from 'react-router-dom'
import {getAssignments, getAssignmentStatus, submitAssignment} from '../../api/assignmentApi'
import AssignmentStatusBadge from '../../components/student/AssignmentStatusBadge'

const formatDate = (date) => new Date(date).toLocaleString('en-IN', {dateStyle: 'medium', timeStyle: 'short'})

function AssignmentDetails(){
  const {id} = useParams(); 
  const location = useLocation();
  const [assignment, setAssignment] = useState(location.state?.assignment || null)
    const [status, setStatus] = useState(location.state?.assignment?.status || '')
    const [canSubmit, setCanSubmit] = useState(location.state?.assignment?.canSubmit ?? true)
    const [shared, setShared] = useState(location.state?.assignment?.shared || false)
  const [loading, setLoading] = useState(!assignment); 
  const [error, setError] = useState(''); 
  const [confirming, setConfirming] = useState(false); 
  const [submitting, setSubmitting] = useState(false); 
  const [feedback, setFeedback] = useState('')
    const [justSubmitted, setJustSubmitted] = useState(false)

  const loadAssignment = useCallback(async () => {
    setLoading(true);
    setError('');
    try {const listResponse = await getAssignments();
         const found = (listResponse.data.assignments || []).find((item) => String(item.id) === String(id));
         if (!found) { setError('Assignment not found.');
         return } setAssignment(found);
         const statusResponse = await getAssignmentStatus(id);
         setStatus(statusResponse.data.status)
         setCanSubmit(statusResponse.data.canSubmit)
         setShared(statusResponse.data.shared)
        }catch{ 
            setError('We could not load this assignment.') 
        }finally{setLoading(false)}
    }, [id])
  useEffect(()=>{ 
    if(!assignment || !status){
        const timer = setTimeout(loadAssignment, 0);
        return () => clearTimeout(timer)}},[assignment, loadAssignment, status])

  const handleSubmit = async () => { 
    setSubmitting(true);
    setError('');
    try{await submitAssignment(id);
        setStatus('SUBMITTED');
        setFeedback('Your submission has been confirmed.');
        setJustSubmitted(true)
        setConfirming(false) 
    }catch(requestError){
        setError(requestError.response?.data?.message || 'We could not confirm the submission.')
    }finally{
        setSubmitting(false) 
    }}
  if(loading){
    return <p>Loading assignment...</p>
  }
  if(error && !assignment){
    return <div className="rounded bg-red-50 p-4 text-red-700">{error}<Link className="ml-3 underline" to="/student/assignments">Back to assignments</Link></div>
  }
  return (
  <section className="mx-auto max-w-3xl space-y-6">
    <Link className="text-sm text-blue-600" to="/student/assignments">
        Back to assignments
    </Link>
    <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
                <h1 className="text-2xl font-bold">{assignment.title}</h1>
                <p className="mt-2 text-slate-600">Due {formatDate(assignment.due_date)}</p>
                {shared && <p className="mt-2 text-sm text-blue-700">One acknowledgement applies to every member of your group.</p>}
            </div>
            <div className={justSubmitted ? 'submission-status-pulse' : ''}>
                <AssignmentStatusBadge status={status} />
            </div>
        </div>
        {
            assignment.description && 
            <p className="mt-6 whitespace-pre-wrap text-slate-700">
                {assignment.description}
            </p>
        }
        <div className="mt-6 border-t border-slate-200 pt-5">
            <h2 className="font-semibold">Assignment file</h2>
            {
                assignment.onedrive_url ? 
                <a className="mt-2 inline-block text-blue-600 underline" href={assignment.onedrive_url} rel="noopener noreferrer" target="_blank">
                    Open OneDrive link
                </a> : 
                <p className="mt-2 text-slate-600">
                    No OneDrive link is available.
                </p>
            }
        </div>
        {
            feedback && 
            <p className="mt-5 flex items-center gap-2 rounded bg-emerald-50 p-3 text-emerald-700" role="status">
                <span className="submission-check" aria-hidden="true">&#10003;</span>
                <span>{feedback}</span>
            </p>
        }{
            error && assignment && 
            <p className="mt-5 rounded bg-red-50 p-3 text-red-700" role="alert">
                {error}
            </p>
        }{
            status !== 'SUBMITTED' && canSubmit &&
            <button className="mt-6 rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60" disabled={submitting} onClick={() => setConfirming(true)} type="button">
                Yes, I have submitted
            </button>
        }
        </div>
        {
            status !== 'SUBMITTED' && !canSubmit && shared &&
            <p className="mt-6 rounded bg-slate-100 p-3 text-slate-700">Only your group leader can acknowledge this assignment.</p>
        }{
            confirming && 
            <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">
                <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                    <h2 className="text-lg font-semibold">
                        Confirm submission
                    </h2>
                    <p className="mt-3 text-slate-600">
                        You are confirming that you have uploaded your assignment to the provided OneDrive link. Continue?
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button className="rounded border border-slate-300 px-4 py-2" disabled={submitting} onClick={() => setConfirming(false)} type="button">
                            Cancel
                        </button>
                        <button className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60" disabled={submitting} onClick={handleSubmit} type="button">
                            {submitting ? 'Confirming...' : 'Confirm submission'}
                        </button>
                    </div>
                </div>
            </div>
        }
  </section>
  )
}

export default AssignmentDetails
