import api from "./axios";

// Get all students
export const getStudents = (params = {}) => api.get("students/", { params });
export const createStudent = (data) => api.post("students/", data);
export const updateStudent = (id, data) => api.patch(`students/${id}/`, data);
export const deleteStudent = (id) => api.delete(`students/${id}/`);
export const getMyChild = () => api.get("students/my-child/");
export const setParentLogin = (id) => api.post(`students/${id}/set-parent-login/`);
