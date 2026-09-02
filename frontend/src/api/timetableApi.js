import api from './axios';

export const getTimetables = (params = {}) => api.get("/timetable/timetable/", { params });
export const createTimetable = (data) => api.post("/timetable/timetable/", data);
export const updateTimetable = (id, data) => api.patch(`/timetable/timetable/${id}/`, data);
export const deleteTimetable = (id) => api.delete(`/timetable/timetable/${id}/`);
export const getCoverBoard = (params = {}) => api.get("/timetable/timetable/cover-board/", { params });
export const getFreeTeachers = (id, params = {}) => api.get(`/timetable/timetable/${id}/free-teachers/`, { params });
export const assignPeriodCover = (id, data) => api.post(`/timetable/timetable/${id}/cover/`, data);
export const clearPeriodCover = (id, params = {}) => api.delete(`/timetable/timetable/${id}/cover/`, { params });
