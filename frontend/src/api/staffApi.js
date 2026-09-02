import api from "./axios";

export const getStaff = (params = {}) => api.get("/staff/staff/", { params });
export const createStaff = (data) => api.post("/staff/staff/", data);
export const updateStaff = (id, data) => api.patch(`/staff/staff/${id}/`, data);
export const deleteStaff = (id) => api.delete(`/staff/staff/${id}/`);

export const getPayroll = (params = {}) => api.get("/staff/payroll/", { params });
export const createPayroll = (data) => api.post("/staff/payroll/", data);
export const updatePayroll = (id, data) => api.patch(`/staff/payroll/${id}/`, data);
export const deletePayroll = (id) => api.delete(`/staff/payroll/${id}/`);
