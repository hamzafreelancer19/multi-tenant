import api from "./axios";

// Get all teachers
export const getTeachers = (params = {}) => api.get("teachers/", { params });

// Create teacher
export const createTeacher = (data) => api.post("teachers/", data);

// Update teacher
export const updateTeacher = (id, data) => api.patch(`teachers/${id}/`, data);

// Delete teacher
export const deleteTeacher = (id) => api.delete(`teachers/${id}/`);
