import api from "./axios";

export const getVehicles = (params = {}) => api.get("/transport/vehicles/", { params });
export const createVehicle = (data) => api.post("/transport/vehicles/", data);
export const updateVehicle = (id, data) => api.patch(`/transport/vehicles/${id}/`, data);
export const deleteVehicle = (id) => api.delete(`/transport/vehicles/${id}/`);

export const getRoutes = (params = {}) => api.get("/transport/routes/", { params });
export const createRoute = (data) => api.post("/transport/routes/", data);
export const updateRoute = (id, data) => api.patch(`/transport/routes/${id}/`, data);
export const deleteRoute = (id) => api.delete(`/transport/routes/${id}/`);

export const getRiders = (params = {}) => api.get("/transport/riders/", { params });
export const createRider = (data) => api.post("/transport/riders/", data);
export const deleteRider = (id) => api.delete(`/transport/riders/${id}/`);
