import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGroups } from '../../api/groupApi'

function Groups(){
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadGroups = useCallback(async () => {
    setLoading(true)
    setError('')
    try{
      const response = await getGroups()
      setGroups(response.data.groups || [])
    }catch{
      setError('We could not load your groups.')
    }finally{
      setLoading(false)
    }
  }, [])

  useEffect(() => { 
    const timer = setTimeout(loadGroups, 0);
    return () => clearTimeout(timer) 
  }, [loadGroups])

  return (
    <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 className="text-2xl font-bold">
                    Your groups
                </h1>
                <p className="mt-1 text-slate-600">
                    Work together with your classmates.
                </p>
            </div>
            <Link className="rounded bg-blue-600 px-4 py-2 font-medium text-white" to="/student/groups/create">
                Create group
            </Link>
        </div>
    {
        loading && 
        <p>
            Loading groups...
        </p>
    }
    {
        error && 
        <div className="rounded bg-red-50 p-4 text-red-700">
            {error}
            <button className="ml-3 underline" onClick={loadGroups} type="button">
                Retry
            </button>
        </div>
    }
    {
        !loading && !error && groups.length === 0 && 
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <h2 className="font-semibold">
                No groups yet
            </h2>
            <p className="mt-1 text-slate-600">
                Create your first group to start collaborating.
            </p>
        </div>}
    {
        !loading && !error && groups.length > 0 && 
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
                <article className="rounded-lg bg-white p-5 shadow-sm" key={group.id}>
                    <h2 className="text-lg font-semibold">
                        {group.name}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Created {new Date(group.created_at).toLocaleDateString('en-IN')}
                    </p>
                    <Link className="mt-5 inline-block text-sm font-medium text-blue-600" to={`/student/groups/${group.id}`}>
                        View group
                    </Link>
                </article>))
            }
        </div>
    }
  </section>
  )
}

export default Groups
