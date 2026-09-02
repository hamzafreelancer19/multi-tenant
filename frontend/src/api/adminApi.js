import api from "./axios";

// Schools Management
export const getSchools = (params = {}) => api.get("schools/", { params });
export const getSchool = (id) => api.get(`schools/${id}/`);
export const getSchoolProfile = (id) => api.get(`schools/${id}/profile/`);
export const createSchool = (data) => api.post("schools/", data);
export const updateSchool = (id, data) => api.patch(`schools/${id}/`, data);
export const deleteSchool = (id) => api.delete(`schools/${id}/`);
export const approveSchool = (id) => api.post(`schools/${id}/approve/`);
export const rejectSchool = (id) => api.post(`schools/${id}/reject/`);
export const approvePlan = (id) => api.post(`schools/${id}/approve_plan/`);
export const rejectPlan = (id) => api.post(`schools/${id}/reject_plan/`);
export const suspendSchool = (id) => api.post(`schools/${id}/suspend/`);

// Platform Users Management
export const getPlatformUsers = (params = {}) => api.get("platform-users/", { params });
export const createPlatformUser = (data) => api.post("platform-users/", data);
export const updatePlatformUser = (id, data) => api.patch(`platform-users/${id}/`, data);
export const deletePlatformUser = (id) => api.delete(`platform-users/${id}/`);

export const getPlatformSettings = () => api.get("platform/settings/");
export const updatePlatformSettings = (data) => api.patch("platform/settings/", data);
