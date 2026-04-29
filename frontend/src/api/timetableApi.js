import api from './axios';

export const getTimetables = () => api.get('/timetable/timetable/');
export const createTimetable = (data) => api.post('/timetable/timetable/', data);
export const updateTimetable = (id, data) => api.put(`/timetable/timetable/${id}/`, data);
export const deleteTimetable = (id) => api.delete(`/timetable/timetable/${id}/`);
