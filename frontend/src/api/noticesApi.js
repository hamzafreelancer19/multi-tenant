import api from './axios';

export const getNotices = () => api.get('/notices/notices/');
export const createNotice = (data) => api.post('/notices/notices/', data);
export const updateNotice = (id, data) => api.put(`/notices/notices/${id}/`, data);
export const deleteNotice = (id) => api.delete(`/notices/notices/${id}/`);
