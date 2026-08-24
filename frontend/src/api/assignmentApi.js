import api from './axios'

export const getAssignments = () => api.get('/assignment')
export const getAssignmentStatus = (id) => api.get(`/assignment/${id}/status`)
export const submitAssignment = (id) => api.post(`/assignment/${id}/submit`)
