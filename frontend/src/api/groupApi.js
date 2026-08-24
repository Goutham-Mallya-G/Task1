import api from './axios'

export const getGroups = () => api.get('/group')
export const getGroup = (id) => api.get(`/group/${id}/members`)
export const createGroup = (data) => api.post('/group', data)
export const addMember = (groupId, data) => api.post(`/group/${groupId}/add`, data)
