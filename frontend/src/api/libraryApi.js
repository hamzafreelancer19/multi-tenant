import api from "./axios";

export const getBooks = (params = {}) => api.get("/library/books/", { params });
export const createBook = (data) => api.post("/library/books/", data);
export const updateBook = (id, data) => api.patch(`/library/books/${id}/`, data);
export const deleteBook = (id) => api.delete(`/library/books/${id}/`);

export const getIssues = (params = {}) => api.get("/library/issue-returns/", { params });
export const createIssue = (data) => api.post("/library/issue-returns/", data);
export const updateIssue = (id, data) => api.patch(`/library/issue-returns/${id}/`, data);
export const deleteIssue = (id) => api.delete(`/library/issue-returns/${id}/`);
