import api from './axios';

export const getNotices = () => api.get("/notices/notices/");
export const getPublicNotices = (params = {}) => api.get("/notices/public/", { params });
export const createNotice = (data) => api.post("/notices/notices/", data);
export const updateNotice = (id, data) => api.patch(`/notices/notices/${id}/`, data);
export const deleteNotice = (id) => api.delete(`/notices/notices/${id}/`);
