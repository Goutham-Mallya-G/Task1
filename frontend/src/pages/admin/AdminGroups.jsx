import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGroups } from '../../api/groupApi'

function AdminGroups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const loadGroups = useCallback(async () => {
    setLoading(true)
    setError('')
    try{
      const response = await getGroups()
      setGroups(response.data.groups || [])
    }catch(requestError){
    setError(requestError.response?.status === 403 ? 'You are not authorized to view groups.' : 'We could not load groups.')
    }finally{
      setLoading(false)
    }
  }, [])
  useEffect(() => { 
    const timer = setTimeout(loadGroups, 0);
    return () => clearTimeout(timer) },
    [loadGroups]
  )

  return (
    <section className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">
                Groups
            </h1>
            <p className="mt-1 text-slate-600">
                Review groups before assigning work.
            </p>
        </div>
        {
            loading && 
            <p>
                Loading groups...
            </p>
        }{
            error && 
            <div className="rounded bg-red-50 p-4 text-red-700">
                {error}
                <button className="ml-3 underline" onClick={loadGroups} type="button">
                    Retry
                </button>
            </div>
        }{
            !loading && !error && groups.length === 0 && 
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                <p>No groups have been created yet.</p>
            </div>
        }{
            !loading && !error && groups.length > 0 && 
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => (
                    <article className="rounded-lg bg-white p-5 shadow-sm" key={group.id}>
                        <h2 className="text-lg font-semibold">{group.name}</h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Group ID: {group.id}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                            Members: {group.members?.length || 0}
                        </p>
                        <Link className="mt-4 inline-block text-sm font-medium text-blue-600" to={`/admin/groups/${group.id}`}>
                            View members
                        </Link>
                    </article>
                ))}
            </div>
        }
    </section>
    )
}

export default AdminGroups