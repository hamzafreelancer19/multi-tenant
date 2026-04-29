import api from './axios';

export const getAssignments = () => api.get('/assignments/assignments/');
export const createAssignment = (data) => api.post('/assignments/assignments/', data);
export const updateAssignment = (id, data) => api.put(`/assignments/assignments/${id}/`, data);
export const deleteAssignment = (id) => api.delete(`/assignments/assignments/${id}/`);
