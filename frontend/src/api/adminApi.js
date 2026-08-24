import api from './axios'

export const createAdmin = (data) => api.post('/auth/register/admin', data)