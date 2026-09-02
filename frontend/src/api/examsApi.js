import api from "./axios";

export const getExams = () => api.get("/exams/exams/");
export const createExam = (data) => api.post("/exams/exams/", data);
export const updateExam = (id, data) => api.patch(`/exams/exams/${id}/`, data);
export const deleteExam = (id) => api.delete(`/exams/exams/${id}/`);

export const getSubjects = () => api.get("/exams/subjects/");
export const createSubject = (data) => api.post("/exams/subjects/", data);
export const deleteSubject = (id) => api.delete(`/exams/subjects/${id}/`);

export const getResults = (params = {}) => api.get("/exams/results/", { params });
export const createResult = (data) => api.post("/exams/results/", data);
export const getExamResults = (examId) => api.get(`/exams/exams/${examId}/results/`);
export const saveExamResults = (examId, data) => api.post(`/exams/exams/${examId}/results/`, data);
