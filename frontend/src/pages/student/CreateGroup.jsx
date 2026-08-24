import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { createGroup } from '../../api/groupApi'

const groupSchema = z.object({ name: z.string().trim().min(2, 'Group name must be at least 2 characters') })

function CreateGroup(){
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [validationError, setValidationError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event)=>{
    event.preventDefault()
    setError('')
    const result = groupSchema.safeParse({ name })
    if(!result.success){
        setValidationError(result.error.issues[0].message);
        return 
    }
    setValidationError('')
    setSubmitting(true)
    try{
        const response = await createGroup({ name: result.data.name })
        const groupId = response.data.group?.id
        navigate(groupId ? `/student/groups/${groupId}` : '/student/groups')
    }catch(requestError){
        setError(requestError.response?.data?.message || 'We could not create the group.')
    }finally{
        setSubmitting(false)
    }
  }

  return (
  <section className="mx-auto max-w-xl">
    <Link className="text-sm text-blue-600" to="/student/groups">
        Back to groups
    </Link>
    <form className="mt-4 space-y-5 rounded-lg bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        <div>
            <h1 className="text-2xl font-bold">
                Create a group
            </h1>
            <p className="mt-1 text-slate-600">
                Give your collaboration group a clear name.
            </p>
        </div>
        {
            error && 
            <p className="rounded bg-red-50 p-3 text-sm text-red-700" role="alert">
                {error}
            </p>
        }
        <label className="block text-sm font-medium">
            Group name
            <input className="mt-1 w-full rounded border border-slate-300 p-2" value={name} onChange={(event) => setName(event.target.value)} />
            {
                validationError && 
                <span className="text-sm text-red-600">
                    {validationError}
                </span>
            }</label>
            <button className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60" disabled={submitting} type="submit">
                {submitting ? 'Creating...' : 'Create group'}
            </button>
    </form>
  </section>
  )
}

export default CreateGroup
