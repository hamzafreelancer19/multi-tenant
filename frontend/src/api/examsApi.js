import api from "./axios";

export const getExams = () => api.get("/exams/exams/");
export const createExam = (data) => api.post("/exams/exams/", data);
export const updateExam = (id, data) => api.patch(`/exams/exams/${id}/`, data);
export const deleteExam = (id) => api.delete(`/exams/exams/${id}/`);

export const getSubjects = () => api.get("/exams/subjects/");
export const createSubject = (data) => api.post("/exams/subjects/", data);
export const deleteSubject = (id) => api.delete(`/exams/subjects/${id}/`);

export const getResults = () => api.get("/exams/results/");
export const createResult = (data) => api.post("/exams/results/", data);
