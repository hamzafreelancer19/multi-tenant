import api from './axios';

export const getEnrollments = () => api.get('/enrollments/');
export const createEnrollment = (data) => api.post('/enrollments/', data);
export const acceptEnrollment = (id) => api.post(`/enrollments/${id}/accept/`);
export const rejectEnrollment = (id) => api.post(`/enrollments/${id}/reject/`);
export const deleteEnrollment = (id) => api.delete(`/enrollments/${id}/`);
