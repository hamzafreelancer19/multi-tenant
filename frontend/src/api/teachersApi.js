import api from "./axios";

export const getTeachers = (params = {}) => api.get("teachers/", { params });
export const createTeacher = (data) => api.post("teachers/", data);
export const updateTeacher = (id, data) => api.patch(`teachers/${id}/`, data);
export const deleteTeacher = (id) => api.delete(`teachers/${id}/`);
export const getMyTeacherProfile = () => api.get("teachers/me/");
export const setTeacherLogin = (id, data) => api.post(`teachers/${id}/set-login/`, data);
