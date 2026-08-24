const statusStyles = {
  PENDING: 'bg-amber-100 text-amber-800',
  SUBMITTED: 'bg-emerald-100 text-emerald-800',
  OVERDUE: 'bg-red-100 text-red-800',
}

function AssignmentStatusBadge({status}){
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status] || 'bg-slate-100 text-slate-700'}`}>
        {status || 'UNKNOWN'}
    </span>)
}

export default AssignmentStatusBadge
