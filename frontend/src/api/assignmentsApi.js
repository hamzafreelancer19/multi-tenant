import api from "./axios";

export const getAssignments = (params = {}) => api.get("/assignments/assignments/", { params });
export const createAssignment = (data) => api.post("/assignments/assignments/", data);
export const updateAssignment = (id, data) => api.patch(`/assignments/assignments/${id}/`, data);
export const deleteAssignment = (id) => api.delete(`/assignments/assignments/${id}/`);
