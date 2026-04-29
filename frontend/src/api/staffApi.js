import api from './axios';

export const getStaff = () => api.get('/staff/staff/');
export const createStaff = (data) => api.post('/staff/staff/', data);
export const updateStaff = (id, data) => api.put(`/staff/staff/${id}/`, data);
export const deleteStaff = (id) => api.delete(`/staff/staff/${id}/`);

export const getPayroll = () => api.get('/staff/payroll/');
export const createPayroll = (data) => api.post('/staff/payroll/', data);
