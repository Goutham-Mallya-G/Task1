import api from './axios'

export const getCourses = () => api.get('/course')
export const createCourse = (data) => api.post('/course', data)
export const enrollCourse = (courseId) => api.post(`/course/${courseId}/enroll`)
export const enrollGroup = (courseId, groupId) => api.post(`/course/${courseId}/enroll-group`, { groupId })
