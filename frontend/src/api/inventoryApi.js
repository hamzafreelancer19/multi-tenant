import api from './axios';

export const getItems = () => api.get('/inventory/items/');
export const createItem = (data) => api.post('/inventory/items/', data);
export const updateItem = (id, data) => api.put(`/inventory/items/${id}/`, data);
export const deleteItem = (id) => api.delete(`/inventory/items/${id}/`);

export const getLogs = () => api.get('/inventory/stock-logs/');
export const createLog = (data) => api.post('/inventory/stock-logs/', data);
