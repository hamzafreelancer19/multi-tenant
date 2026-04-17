import api from "./axios";

// Get all students
export const getStudents = (params = {}) => api.get("students/", { params });

// Create student
export const createStudent = (data) => api.post("students/", data);

// Update student
export const updateStudent = (id, data) => api.patch(`students/${id}/`, data);

// Delete student
export const deleteStudent = (id) => api.delete(`students/${id}/`);
