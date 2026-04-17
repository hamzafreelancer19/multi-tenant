import api from "./axios";

// Schools Management
export const getSchools = (params = {}) => api.get("schools/", { params });
export const createSchool = (data) => api.post("schools/", data);
export const updateSchool = (id, data) => api.patch(`schools/${id}/`, data);
export const deleteSchool = (id) => api.delete(`schools/${id}/`);
export const approveSchool = (id) => api.post(`schools/${id}/approve/`);
export const rejectSchool = (id) => api.post(`schools/${id}/reject/`);

// Platform Users Management
export const getPlatformUsers = (params = {}) => api.get("platform-users/", { params });
export const createPlatformUser = (data) => api.post("platform-users/", data);
export const updatePlatformUser = (id, data) => api.patch(`platform-users/${id}/`, data);
export const deletePlatformUser = (id) => api.delete(`platform-users/${id}/`);
