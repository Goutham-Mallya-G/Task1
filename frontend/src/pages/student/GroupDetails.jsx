import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { z } from 'zod'
import { addMember, getGroup } from '../../api/groupApi'

const memberSchema = z.object({ email: z.string().email('Enter a valid student email') })

function GroupDetails(){
  const { id } = useParams()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [adding, setAdding] = useState(false)

  const loadGroup = useCallback(async () => {
     setLoading(true);
    setError('');
    try{
        const response = await getGroup(id);
        setGroup(response.data.group)
    }catch{
        setError('We could not load this group.')
    }finally{
        setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const timer = setTimeout(loadGroup, 0);
    return () => clearTimeout(timer) 
  }, [loadGroup])

  const handleAddMember = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccess('')
    const result = memberSchema.safeParse({ email })
    if(!result.success){
        setFormError(result.error.issues[0].message);
        return
    }
    setAdding(true)
    try{
        const response = await addMember(id, result.data);
        setGroup({ ...group, members: [...(group.members || []), response.data.student] });
        setEmail('');
        setSuccess('Student added to the group.') 
    }catch(requestError){
        setFormError(requestError.response?.data?.message || 'We could not add that student.') 
    }finally{
        setAdding(false) 
    }
  }

  if(loading){
    return <p>Loading group...</p>
  }
  if(error){
    return (
        <div className="rounded bg-red-50 p-4 text-red-700">
            {error}
            <button className="ml-3 underline" onClick={loadGroup} type="button">
                Retry
            </button>
        </div>)
    }

  return (
  <section className="space-y-6">
    <Link className="text-sm text-blue-600" to="/student/groups">
        Back to groups
    </Link>
    <div>
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <p className="mt-1 text-slate-600">
            Group details and members
        </p>
    </div>
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
                Members
            </h2>
            {
                !group.members?.length ? 
                <p className="mt-4 text-slate-600">
                    No members found.
                </p> : 
                <ul className="mt-4 divide-y divide-slate-200">
                    {group.members.map((member) => (
                        <li className="py-3" key={member.id}>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-slate-500">
                                {member.email}</p>
                        </li>))
                    }</ul>
            }
        </div>
        <form className="h-fit space-y-4 rounded-lg bg-white p-6 shadow-sm" onSubmit={handleAddMember}>
            <h2 className="text-lg font-semibold">
                Add a member
            </h2>
            {
                formError && 
                <p className="text-sm text-red-600" role="alert">
                    {formError}
                </p>
            }{
                success && 
                <p className="text-sm text-emerald-700" role="status">
                    {success}
                </p>
            }
            <label className="block text-sm font-medium">
                Student email
                <input className="mt-1 w-full rounded border border-slate-300 p-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)}/>
            </label>
            <button className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60" disabled={adding} type="submit">
                {adding ? 'Adding...' : 'Add member'}
            </button>
        </form>
    </div>
  </section>)
}

export default GroupDetails
