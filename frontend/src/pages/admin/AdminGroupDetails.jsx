import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getGroup } from '../../api/groupApi'

function AdminGroupDetails() {
  const { id } = useParams()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadGroup = useCallback(async () => {
    setLoading(true)
    setError('')
    try{
      const response = await getGroup(id)
      setGroup(response.data.group)
    }catch{
      setError('We could not load this group.')
    }finally{
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const timer = setTimeout(loadGroup, 0)
    return () => clearTimeout(timer)
  }, [loadGroup])

  if (loading) return <p>Loading group...</p>
  if (error) return (
    <div className="rounded bg-red-50 p-4 text-red-700">
        {error}
        <button className="ml-3 underline" onClick={loadGroup} type="button">
            Retry
        </button>
    </div>
  )

  return (
    <section className="mx-auto max-w-2xl space-y-6">
        <Link className="text-sm text-blue-600" to="/admin/groups">
            Back to groups
        </Link>
        <div>
            <h1 className="text-2xl font-bold">
                {group.name}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
                Group ID: {group.id}
            </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                    Members
                </h2>
                <span className="text-sm text-slate-500">
                    {group.members?.length || 0} members
                </span>
            </div>
            {
                group.members?.length ? 
                <ul className="mt-4 divide-y divide-slate-200">
                    {group.members.map((member) => 
                        <li className="py-3" key={member.id}>
                            <p className="font-medium">
                                {member.name}
                            </p>
                            <p className="text-sm text-slate-500">
                                {member.email}
                            </p>
                        </li>
                    )}
                </ul> : 
                <p className="mt-4 text-slate-600">
                    This group has no members.
                </p>
            }
        </div>
    </section>
    )
}

export default AdminGroupDetails