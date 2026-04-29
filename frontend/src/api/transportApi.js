import api from './axios';

export const getVehicles = () => api.get('/transport/vehicles/');
export const createVehicle = (data) => api.post('/transport/vehicles/', data);
export const updateVehicle = (id, data) => api.put(`/transport/vehicles/${id}/`, data);
export const deleteVehicle = (id) => api.delete(`/transport/vehicles/${id}/`);

export const getRoutes = () => api.get('/transport/routes/');
export const createRoute = (data) => api.post('/transport/routes/', data);
export const updateRoute = (id, data) => api.put(`/transport/routes/${id}/`);
export const deleteRoute = (id) => api.delete(`/transport/routes/${id}/`);
