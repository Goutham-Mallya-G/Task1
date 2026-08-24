import api from './axios'

export const getAssignments = () => api.get('/assignment')
export const getAdminAssignments = () => api.get('/assignment/admin')
export const createAssignment = (data) => api.post('/assignment', data)
export const getAssignmentStatus = (id) => api.get(`/assignment/${id}/status`)
export const submitAssignment = (id) => api.post(`/assignment/${id}/submit`)
export const getAssignmentProgress = (id) => api.get(`/assignment/${id}/progress`)
export const getAssignmentSubmissions = (id) => api.get(`/assignment/${id}/submissions`)
