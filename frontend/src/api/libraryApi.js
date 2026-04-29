import api from './axios';

export const getBooks = () => api.get('/library/books/');
export const createBook = (data) => api.post('/library/books/', data);
export const updateBook = (id, data) => api.put(`/library/books/${id}/`, data);
export const deleteBook = (id) => api.delete(`/library/books/${id}/`);

export const getIssues = () => api.get('/library/issue-returns/');
export const createIssue = (data) => api.post('/library/issue-returns/', data);
export const updateIssue = (id, data) => api.put(`/library/issue-returns/${id}/`, data);
