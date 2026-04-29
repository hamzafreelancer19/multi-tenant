import api from "./axios";

export const getClasses = () => api.get("classes/classes/");
export const createClass = (data) => api.post("classes/classes/", data);
export const updateClass = (id, data) => api.put(`classes/classes/${id}/`, data);
export const deleteClass = (id) => api.delete(`classes/classes/${id}/`);

export const getSections = () => api.get("classes/sections/");
export const createSection = (data) => api.post("classes/sections/", data);
