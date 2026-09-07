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

// Plans catalog + approvals
export const getPlansOverview = () => api.get("plans/overview/");
export const getPlans = (params = {}) => api.get("plans/", { params });
export const getPlanCatalog = () => api.get("plans/catalog/");
export const createPlan = (data) => api.post("plans/", data);
export const updatePlan = (id, data) => api.patch(`plans/${id}/`, data);
export const deletePlan = (id) => api.delete(`plans/${id}/`);
export const assignPlanToSchool = (planId, data) => api.post(`plans/${planId}/assign/`, data);

// Platform Users Management
export const getPlatformUsers = (params = {}) => api.get("platform-users/", { params });
export const createPlatformUser = (data) => api.post("platform-users/", data);
export const updatePlatformUser = (id, data) => api.patch(`platform-users/${id}/`, data);
export const deletePlatformUser = (id) => api.delete(`platform-users/${id}/`);

export const getPlatformSettings = () => api.get("platform/settings/");
export const updatePlatformSettings = (data) => api.patch("platform/settings/", data);
